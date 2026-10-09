const { test, before, after, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { promisify } = require("node:util");
const express = require("express");
const db = require("../src/common/db");
const Users = require("../src/models/gymusers.model");
const Plans = require("../src/models/workoutplans.model");
const Days = require("../src/models/workoutdays.model");
const Dashboard = require("../src/models/dashboard.model");

// Contract fixtures only: these tests never write to the application database.
const sqlSource = readFileSync(resolve(__dirname, "../../../Database/MySQL_GymPlan.sql"), "utf8");
const parametersOf = (name) => {
  const definitions = [...sqlSource.matchAll(new RegExp(`CREATE\\s+PROCEDURE\\s+${name}\\s*\\(([\\s\\S]*?)\\)\\s*BEGIN`, "gi"))];
  assert.ok(definitions.length, `Missing ${name} in SQL file`);
  return [...definitions.at(-1)[1].matchAll(/IN\s+p_(\w+)\s+/g)].map((match) => match[1]);
};

function procedureMock(name, values, result = [[{ message: "OK" }]]) {
  let count = 0;
  const query = (sql, args) => {
    count += 1;
    assert.equal(sql.replace(/\s/g, ""), `CALL${name}(${args.map(() => "?").join(",")})`);
    assert.deepEqual(args, parametersOf(name).map((field) => values[field]), `${name}: parameter order/types`);
    return result;
  };
  mock.method(db, "promise", () => ({ query: async (sql, args) => [query(sql, args)] }));
  mock.method(db, "query", (sql, args, callback) => callback(null, query(sql, args)));
  return () => assert.equal(count, 1, "Only the intended procedure should execute");
}

let server;
let baseUrl;
before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/users", require("../src/routes/gymusers.route"));
  app.use("/workoutplans", require("../src/routes/workoutplans.route"));
  app.use("/workoutdays", require("../src/routes/workoutdays.route"));
  app.use("/api/dashboard", require("../src/routes/dashboard.route"));
  server = app.listen(0, "127.0.0.1");
  await new Promise((done) => server.once("listening", done));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
afterEach(() => mock.restoreAll());
after(async () => {
  await new Promise((done) => server.close(done));
  await db.promise().end();
});
const request = (path, method = "GET", body) => fetch(baseUrl + path, {
  method, headers: { "Content-Type": "application/json" },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const user = {
  profileId: 31, username: "test-user", email: "user@example.test", password: "test-password",
  fullName: "Test User", gender: null, level: null, goal: null, sessionsPerWeek: null, status: "LOCKED",
};
const plan = { planId: 41, title: "Test Plan", description: "Description", creatorId: 7, isTemplate: true, level: "BEGINNER", durationWeeks: 12 };

test("user list and detail preserve active plan fields and the existing response shape", async () => {
  const rows = [
    { ...user, activePlanId: 41, activePlanTitle: "Template plan", activePlanType: "TEMPLATE" },
    { ...user, profileId: 32, activePlanId: 42, activePlanTitle: "Personal plan", activePlanType: "PERSONAL" },
    { ...user, profileId: 33, activePlanId: null, activePlanTitle: null, activePlanType: null },
  ];
  let calls = 0;
  mock.method(db, "query", (sql, callback) => {
    assert.equal(sql, "CALL sp_GetAllGymUsers()");
    calls += 1;
    callback(null, [rows, { affectedRows: 0 }]);
  });
  const response = await request("/api/users");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), rows);
  for (const row of rows) {
    const detail = await request(`/api/users/${row.profileId}`);
    assert.equal(detail.status, 200);
    assert.deepEqual(await detail.json(), row);
  }
  assert.equal(calls, 4);
});

const modelCases = [
  ["sp_AddGymUser", user, () => promisify(Users.insert)(user)],
  ["sp_UpdateGymUser", user, () => promisify(Users.update)(user, user.profileId)],
  ["sp_GetWorkoutPlanTemplates", {}, () => Plans.getTemplates()],
  ["sp_GetWorkoutPlanDetail", plan, () => Plans.getDetail(plan.planId)],
  ["sp_CreateWorkoutPlan", plan, () => Plans.createWithProcedure(plan)],
  ["sp_UpdateWorkoutPlan", plan, () => Plans.updateWithProcedure(plan.planId, plan)],
  ["sp_AddWorkoutDay", { planId: 41, dayName: "Day", weekDay: 7 }, () => Days.addWithProcedure(41, "Day", 7)],
  ["sp_UpdateWorkoutDay", { dayId: 51, dayName: "Day", weekDay: null }, () => Days.updateWithProcedure(51, "Day", null)],
  ["sp_GetDashboardRecentWorkoutTemplates", { limit: 5 }, () => Dashboard.getRecentWorkoutTemplates(5)],
];
for (const [name, values, call] of modelCases) {
  test(`${name}: CALL matches latest SQL parameter count, names and order`, async () => {
    const check = procedureMock(name, values);
    await call();
    check();
  });
}

test("plan POST/PUT carry numeric durationWeeks through the existing routes", async () => {
  for (const [method, path, name] of [
    ["POST", "/workoutplans/procedure", "sp_CreateWorkoutPlan"],
    ["PUT", "/workoutplans/41/procedure", "sp_UpdateWorkoutPlan"],
  ]) {
    const check = procedureMock(name, plan, [[{ planId: 41 }]]);
    const response = await request(path, method, { ...plan, title: " Test Plan " });
    assert.equal(response.status, method === "POST" ? 201 : 200);
    assert.equal((await response.json()).data.planId, 41);
    check();
    mock.restoreAll();
  }
});

test("plan validation rejects missing, zero, negative, fractional and nonnumeric duration", async () => {
  mock.method(Plans, "createWithProcedure", () => assert.fail("invalid duration reached model"));
  mock.method(Plans, "updateWithProcedure", () => assert.fail("invalid duration reached model"));
  for (const durationWeeks of [undefined, null, "", "8", 0, -1, 2.5, true, 2147483648]) {
    for (const [method, path] of [["POST", "/workoutplans/procedure"], ["PUT", "/workoutplans/41/procedure"]]) {
      assert.equal((await request(path, method, { ...plan, durationWeeks })).status, 400);
    }
  }
});

test("day POST/PUT preserve weekdays 1 and 7, and clear scheduling with NULL", async () => {
  for (const weekDay of [1, 7, null, undefined]) {
    for (const [method, path, name] of [
      ["POST", "/workoutdays/plan/41", "sp_AddWorkoutDay"],
      ["PUT", "/workoutdays/51/procedure", "sp_UpdateWorkoutDay"],
    ]) {
      const expected = { planId: 41, dayId: 51, dayName: "Day", weekDay: weekDay ?? null };
      const check = procedureMock(name, expected, [[{ dayId: 51, weekDay: expected.weekDay }]]);
      const response = await request(path, method, { dayName: " Day ", weekDay });
      assert.equal(response.status, method === "POST" ? 201 : 200);
      assert.equal((await response.json()).data.weekDay, expected.weekDay);
      check();
      mock.restoreAll();
    }
  }
});

test("day validation rejects invalid weekdays and forwards duplicate-day SQL errors", async () => {
  mock.method(Days, "addWithProcedure", () => assert.fail("invalid weekday reached model"));
  mock.method(Days, "updateWithProcedure", () => assert.fail("invalid weekday reached model"));
  for (const weekDay of [0, 8, 1.5, "1", "", true]) {
    for (const [method, path] of [["POST", "/workoutdays/plan/41"], ["PUT", "/workoutdays/51/procedure"]]) {
      assert.equal((await request(path, method, { dayName: "Day", weekDay })).status, 400);
    }
  }
  mock.restoreAll();
  const message = "Ngày này đã có buổi tập trong chương trình";
  mock.method(db, "promise", () => ({ query: async () => { throw { sqlState: "45000", sqlMessage: message }; } }));
  const response = await request("/workoutdays/51/procedure", "PUT", { dayName: "Day", weekDay: 1 });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, message);
});

test("plan detail preserves empty days, prescriptions and sorted media across repeated exercises", async () => {
  const result = [
    [{ ...plan, totalDays: 3 }],
    [
      { dayId: 51, dayName: "First", dayOrder: 1, weekDay: 1, configId: 61, exerciseId: 71, exerciseName: "Exercise", sets: 3, reps: 10, restTime: 60 },
      { dayId: 52, dayName: "Second", dayOrder: 2, weekDay: 7, configId: 62, exerciseId: 71, exerciseName: "Exercise", sets: 4, reps: 8, restTime: 90 },
      { dayId: 53, dayName: "Empty", dayOrder: 3, weekDay: null, configId: null },
    ],
    [
      { exerciseId: 71, mediaId: 82, mediaType: "VIDEO", mediaUrl: "https://example.test/video", sortOrder: 2 },
      { exerciseId: 71, mediaId: 81, mediaType: "IMAGE", mediaUrl: "https://example.test/image", sortOrder: 1 },
    ],
  ];
  const check = procedureMock("sp_GetWorkoutPlanDetail", plan, result);
  const response = await request("/workoutplans/41/detail");
  assert.equal(response.status, 200);
  const detail = await response.json();
  assert.equal(detail.durationWeeks, 12);
  assert.deepEqual(detail.days.map((day) => day.weekDay), [1, 7, null]);
  assert.deepEqual(detail.days[2].exercises, []);
  assert.equal(detail.days[0].exercises[0].sets, 3);
  assert.equal(detail.days[1].exercises[0].sets, 4);
  assert.deepEqual(detail.days[0].exercises[0].media.map((media) => media.mediaId), [81, 82]);
  assert.deepEqual(detail.days[0].exercises[0].media, detail.days[1].exercises[0].media);
  check();
});

test("new missing-plan SIGNAL returns 404; unrelated database failure remains 500", async () => {
  for (const [error, status] of [[{ sqlState: "45000", sqlMessage: "Chương trình không tồn tại" }, 404], [new Error("Unavailable"), 500]]) {
    mock.method(db, "promise", () => ({ query: async () => { throw error; } }));
    assert.equal((await request("/workoutplans/41/detail")).status, status);
    mock.restoreAll();
  }
});

test("user create/update use nullable fields and return accountStatus without writing profile status", async () => {
  for (const [method, path, name] of [["POST", "/api/users", "sp_AddGymUser"], ["PUT", "/api/users/31", "sp_UpdateGymUser"]]) {
    const expected = { ...user, sessionsPerWeek: 7 };
    const result = { profileId: 31, accountId: 21, ...(method === "PUT" ? { accountStatus: "LOCKED" } : {}) };
    const check = procedureMock(name, expected, [[result]]);
    const response = await request(path, method, { ...expected, gender: "", level: "", fullName: " Test User " });
    assert.equal(response.status, method === "POST" ? 201 : 200);
    assert.deepEqual((await response.json()).data, result);
    check();
    mock.restoreAll();
  }
});

test("user validation is shared by create/update and rejects invalid sessions and enums", async () => {
  mock.method(Users, "insert", () => assert.fail("invalid input reached insert"));
  mock.method(Users, "update", () => assert.fail("invalid input reached update"));
  for (const change of [{ sessionsPerWeek: 0 }, { sessionsPerWeek: 8 }, { sessionsPerWeek: 1.5 }, { sessionsPerWeek: true }, { sessionsPerWeek: "abc" }, { gender: "INVALID" }, { level: "INVALID" }, { username: "  " }, { goal: "x".repeat(256) }]) {
    for (const [method, path] of [["POST", "/api/users"], ["PUT", "/api/users/31"]]) {
      assert.equal((await request(path, method, { ...user, ...change })).status, 400);
    }
  }
  assert.equal((await request("/api/users", "POST", { ...user, password: "" })).status, 400);
  assert.equal((await request("/api/users/31", "PUT", { ...user, status: "INVALID" })).status, 400);
});

test("all three account statuses are passed unchanged to sp_UpdateGymUser", async () => {
  for (const status of ["ACTIVE", "LOCKED", "INACTIVE"]) {
    const check = procedureMock("sp_UpdateGymUser", { ...user, status });
    assert.equal((await request("/api/users/31", "PUT", { ...user, status })).status, 200);
    check();
    mock.restoreAll();
  }
});

test("template list and dashboard responses keep durationWeeks and existing fields", async () => {
  const rows = [{ ...plan, totalDays: 3, totalExercises: 9 }];
  let check = procedureMock("sp_GetWorkoutPlanTemplates", {}, [rows]);
  assert.deepEqual(await (await request("/workoutplans/templates")).json(), rows);
  check();
  mock.restoreAll();
  for (const [query, limit] of [["", null], ["?limit=", null], ["?limit=0", 0], ["?limit=-1", -1], ["?limit=5", 5]]) {
    check = procedureMock("sp_GetDashboardRecentWorkoutTemplates", { limit }, [rows]);
    const response = await request(`/api/dashboard/recent-workout-templates${query}`);
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, rows);
    check();
    mock.restoreAll();
  }
  for (const limit of ["abc", "1.5"]) {
    assert.equal((await request(`/api/dashboard/recent-workout-templates?limit=${limit}`)).status, 400);
  }
});

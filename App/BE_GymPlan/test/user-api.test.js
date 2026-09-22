const { test, before, after, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const db = require("../src/common/db");
const User = require("../src/models/user.model");
const Workoutplans = require("../src/models/workoutplans.model");
const Auth = require("../src/models/auth.model");
const { issueToken, verifyToken } = require("../src/services/userSessionService");
const token = issueToken({ accountId: 71, profileId: 93, loginSessionId: 123 });
const request = (url, options = {}) => fetch(url, {
  ...options, headers: { Authorization: `Bearer ${token}`, ...options.headers },
});

let server;
let baseUrl;
before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/auth", require("../src/routes/auth.route"));
  app.use("/api/user", require("../src/routes/user.route"));
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/user`;
});
afterEach(() => mock.restoreAll());
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.promise().end();
});

function queryMock(query) {
  mock.method(User, "getLoginSession", async () => ({ profileId: 93 }));
  mock.method(db, "promise", () => ({ query }));
}

test("profile GET uses accountId and update uses profileId, returning fresh profile", async () => {
  const calls = [];
  const profile = { accountId: 71, profileId: 93, fullName: "Updated User" };
  queryMock(async (sql, params) => {
    calls.push([sql, params]);
    if (sql.startsWith("SELECT accountId")) return [[{ accountId: 71 }]];
    return [[[profile], {}]];
  });
  const get = await request(`${baseUrl}/profile/71`);
  assert.equal(get.status, 200);
  assert.deepEqual((await get.json()).data, profile);
  const body = {
    fullName: " Updated User ", gender: "OTHER", level: "ADVANCED",
    goal: "Strength", sessionsPerWeek: 7, height: 172.5, weight: 70.25
  };
  const put = await request(`${baseUrl}/profile/93`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  assert.equal(put.status, 200);
  assert.deepEqual((await put.json()).data, profile);
  assert.deepEqual(calls.find(([sql]) => sql.includes("sp_UpdateMyProfile"))[1],
    [93, "Updated User", "OTHER", "ADVANCED", "Strength", 7, 172.5, 70.25]);
  assert.deepEqual(calls.at(-1), ["CALL sp_GetMyProfile(?)", [71]]);
});

test("active plan keeps summary and reuses days/exercises from existing plan model", async () => {
  const plan = { planId: 28, currentWeek: 3, durationWeeks: 8, completedThisWeek: 2 };
  const days = [{ dayId: 11, exercises: [{ exerciseId: 19, sets: 4 }] }];
  queryMock(async (sql, params) => {
    assert.equal(sql, "CALL sp_GetUserActivePlan(?)");
    assert.deepEqual(params, [93]);
    return [[[plan], {}]];
  });
  mock.method(Workoutplans, "getDetail", async (id) => { assert.equal(id, 28); return { days }; });
  assert.deepEqual(await User.getActivePlan(93), { ...plan, days });
});

test("today workout maps both result sets and preserves exercise prescription/preview", async () => {
  const workout = { dayId: 11, totalExercises: 1, totalSets: 4 };
  const exercise = { exerciseId: 19, exerciseName: "Exercise", sets: 4, reps: 10, restTime: 60, preview: "https://example.test/image.png" };
  queryMock(async () => [[[workout], [exercise], {}]]);
  assert.deepEqual(await User.getTodayWorkout(93), { ...workout, exercises: [exercise] });
});

test("no plan and rest day return null; database failures remain errors", async () => {
  queryMock(async () => { throw { sqlState: "45000", sqlMessage: "Người dùng chưa có lịch tập đang hoạt động" }; });
  assert.equal(await User.getTodayWorkout(93), null);
  mock.restoreAll();
  queryMock(async () => [[[{ dayId: null }], [], {}]]);
  assert.equal(await User.getTodayWorkout(93), null);
  mock.restoreAll();
  queryMock(async () => [[[], {}]]);
  assert.equal(await User.getActivePlan(93), null);
  mock.restoreAll();
  queryMock(async () => { throw new Error("database unavailable"); });
  const response = await request(`${baseUrl}/93/today-workout`);
  assert.equal(response.status, 500);
  assert.equal("data" in await response.json(), false);
});

test("history ALL/WEEK/MONTH reach the stored procedure, including empty history", async () => {
  const periods = [];
  queryMock(async (sql, params) => {
    assert.equal(sql, "CALL sp_GetUserWorkoutHistory(?, ?)");
    assert.equal(params[0], 93);
    periods.push(params[1]);
    return [[[], {}]];
  });
  for (const period of [undefined, "ALL", "WEEK", "MONTH"]) {
    const response = await request(`${baseUrl}/93/workout-history${period ? `?period=${period}` : ""}`);
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, []);
  }
  assert.deepEqual(periods, ["ALL", "ALL", "WEEK", "MONTH"]);
});

test("invalid IDs, periods and profile values are rejected before querying", async () => {
  queryMock(async () => assert.fail("must not query invalid input"));
  for (const path of ["/0/active-plan", "/-1/today-workout", "/1.2/progress-summary", "/no/personal-records", "/93/workout-history?period=YEAR"]) {
    assert.equal((await request(`${baseUrl}${path}`)).status, 400);
  }
  const valid = { fullName: "User", gender: "MALE", level: "BEGINNER", sessionsPerWeek: 3 };
  for (const change of [{ fullName: " " }, { gender: "INVALID" }, { level: null }, { sessionsPerWeek: 8 }, { sessionsPerWeek: 1.5 }, { height: -1 }, { weight: "abc" }, { weight: 1000 }]) {
    const response = await request(`${baseUrl}/profile/93`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...valid, ...change }),
    });
    assert.equal(response.status, 400, JSON.stringify(change));
  }
});

test("workout details are scoped to profile and group all actual sets", async () => {
  queryMock(async (sql, params) => {
    if (sql.includes("FROM WorkoutSessions")) {
      assert.deepEqual(params, [93, 82]);
      return [[{ workoutSessionId: 82 }]];
    }
    return [[
      { performedExerciseId: 4, exerciseId: 9, exerciseName: "Exercise", setId: 1, setNumber: 1, weight: "40.00", reps: 10 },
      { performedExerciseId: 4, exerciseId: 9, exerciseName: "Exercise", setId: 2, setNumber: 2, weight: "45.00", reps: 8 },
      { performedExerciseId: 5, exerciseId: 10, exerciseName: "No sets", setId: null },
    ]];
  });
  const result = await User.getWorkoutDetail(93, 82);
  assert.equal(result.exercises.length, 2);
  assert.equal(result.exercises[0].sets.length, 2);
  assert.equal(result.exercises[0].sets[1].weight, "45.00");
  assert.deepEqual(result.exercises[1].sets, []);
  mock.restoreAll();
  queryMock(async () => [[]]);
  assert.equal((await request(`${baseUrl}/93/workout-history/82`)).status, 404);
});

test("user routes reject missing, tampered, expired sessions and another user's IDs", async () => {
  queryMock(async () => assert.fail("must not access another user's data"));
  assert.equal((await fetch(`${baseUrl}/profile/71`)).status, 401);
  assert.equal((await request(`${baseUrl}/profile/72`)).status, 403);
  assert.equal((await request(`${baseUrl}/94/workout-history`)).status, 403);
  assert.equal((await request(`${baseUrl}/profile/94`, { method: "PUT" })).status, 403);
  const changedPayload = Buffer.from(JSON.stringify({ accountId: 72, profileId: 94, loginSessionId: 123 })).toString("base64url");
  const tampered = `${changedPayload}.${token.split(".")[1]}`;
  assert.equal(verifyToken(tampered), null);
  assert.equal((await request(`${baseUrl}/profile/71`, { headers: { Authorization: `Bearer ${tampered}` } })).status, 401);
  mock.restoreAll();
  mock.method(User, "getLoginSession", async () => null);
  assert.equal((await request(`${baseUrl}/profile/71`)).status, 401);
});

test("login issues a signed user token without exposing password; ADMIN response stays unchanged", async () => {
  const user = { accountId: 71, profileId: 93, loginSessionId: 123, role: "GYM_USER", password: "stored-password" };
  mock.method(Auth, "login", (email, password, callback) => callback(null, user));
  const login = () => fetch(`${baseUrl.replace("/api/user", "")}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.test", password: "test-password" }),
  });
  const response = await login();
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.deepEqual(verifyToken(data.accessToken), { accountId: 71, profileId: 93, loginSessionId: 123 });
  assert.equal("password" in data, false);
  mock.restoreAll();
  const admin = { accountId: 7, loginSessionId: 124, role: "ADMIN" };
  mock.method(Auth, "login", (email, password, callback) => callback(null, admin));
  assert.deepEqual((await (await login()).json()).data, admin);
});

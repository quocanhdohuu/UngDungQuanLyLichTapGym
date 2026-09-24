const { test } = require("node:test");
const assert = require("node:assert/strict");

test("mobile workout flow against local MySQL with isolated fixtures", {
  skip: process.env.GYM_DB_TESTS !== "1", timeout: 60000,
}, async () => {
  const db = require("../src/common/db");
  const User = require("../src/models/user.model");
  const express = require("express");
  const { issueToken } = require("../src/services/userSessionService");
  const query = (sql, args = []) => db.promise().query(sql, args).then(([rows]) => rows);
  const fixture = "flow_" + Date.now();
  const accountIds = [];
  const profileIds = [];
  let exerciseId;
  let server;
  try {
    for (let index = 0; index < 2; index++) {
      const account = await query("INSERT INTO Accounts (username, email, password, role) VALUES (?, ?, ?, 'GYM_USER')",
        [fixture + index, fixture + index + "@example.test", "OldPassword123"]);
      accountIds.push(account.insertId);
      const profile = await query("INSERT INTO GymUsers (accountId, fullName) VALUES (?, ?)", [account.insertId, fixture]);
      profileIds.push(profile.insertId);
    }
    exerciseId = (await query("INSERT INTO Exercises (name, description, difficulty) VALUES (?, 'Integration fixture', 'EASY')", [fixture])).insertId;
    const login = await query("INSERT INTO LoginSessions (accountId, expiration) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR))", [accountIds[0]]);
    const token = issueToken({ accountId: accountIds[0], profileId: profileIds[0], loginSessionId: login.insertId });
    const app = express();
    app.use(express.json());
    app.use("/api/user", require("../src/routes/user.route"));
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    const api = async (path, method = "GET", body, status = 200) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/user/${path}`, {
        method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = await response.json();
      assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(payload)}`);
      return payload.data;
    };
    const profileId = profileIds[0];
    const [calendar] = await query("SELECT WEEKDAY(CURDATE()) + 1 AS today");
    const planBody = {
      title: fixture, description: "Fixture plan", level: "BEGINNER", durationWeeks: 8,
      // Supplied identity/template flags must be ignored by the mobile API.
      creatorId: accountIds[1], isTemplate: true,
      days: [{ dayName: "Test day", weekDay: calendar.today, exercises: [{ exerciseId, sets: 3, reps: 10, restTime: 60 }] }],
    };
    const plan = await api(`${profileId}/plans`, "POST", planBody);
    const [storedPlan] = await query("SELECT creatorId, isTemplate FROM WorkoutPlans WHERE planId = ?", [plan.planId]);
    assert.equal(storedPlan.creatorId, accountIds[0]);
    assert.equal(storedPlan.isTemplate, 0);
    const activePlan = await api(`${profileId}/active-plan`);
    assert.equal(activePlan.planId, plan.planId);
    const today = await api(`${profileId}/today-workout`);
    assert.equal(today.exercises[0].exerciseId, exerciseId);
    const dayId = today.dayId;

    // Concurrent starts and retries must converge on one session.
    const sessions = await Promise.all(Array.from({ length: 5 }, () => api(`${profileId}/workout-sessions`, "POST", { dayId })));
    assert.equal(new Set(sessions.map(session => session.workoutSessionId)).size, 1);
    const sessionId = sessions[0].workoutSessionId;
    const active = await api(`${profileId}/active-session`);
    assert.equal(active.workoutSessionId, sessionId);
    assert.equal(active.prescription[0].exerciseId, exerciseId);
    await api(`${profileId}/apply-plan`, "POST", { planId: plan.planId }, 400);
    await api(`${profileId}/workout-sessions`, "POST", { dayId: -1 }, 400);
    await api(`${profileId}/workout-sessions/${sessionId}/complete`, "PUT", {}, 400);

    const exercises = await Promise.all(Array.from({ length: 3 }, () => api(`${profileId}/workout-sessions/${sessionId}/exercises`, "POST", { exerciseId })));
    assert.equal(new Set(exercises.map(exercise => exercise.performedExerciseId)).size, 1);
    const performedId = exercises[0].performedExerciseId;
    for (const invalid of [{ weight: -1, reps: 10 }, { weight: 20, reps: 0 }, { weight: "20", reps: 10 }, { weight: 20, reps: 1.5 }]) {
      await api(`${profileId}/performed-exercises/${performedId}/sets`, "POST", { setNumber: 1, ...invalid }, 400);
    }
    const set = await api(`${profileId}/performed-exercises/${performedId}/sets`, "POST", { setNumber: 1, weight: 20, reps: 10 });
    const retry = await api(`${profileId}/performed-exercises/${performedId}/sets`, "POST", { setNumber: 1, weight: 20, reps: 10 });
    assert.equal(retry.setId, set.setId);
    await api(`${profileId}/exercise-sets/${set.setId}`, "PUT", { weight: 25, reps: 8 });
    const extra = await api(`${profileId}/performed-exercises/${performedId}/sets`, "POST", { setNumber: 2, weight: 10, reps: 5 });
    await api(`${profileId}/exercise-sets/${extra.setId}`, "DELETE");
    const resumed = await api(`${profileId}/active-session`);
    assert.equal(resumed.exercises[0].sets.length, 1);
    assert.equal(Number(resumed.exercises[0].sets[0].weight), 25);

    // A correct profile URL still cannot authorize another user's nested IDs.
    const foreignSession = (await query("INSERT INTO WorkoutSessions (profileId, startTime) VALUES (?, NOW())", [profileIds[1]])).insertId;
    const foreignExercise = (await query("INSERT INTO PerformedExercises (workoutSessionId, exerciseId) VALUES (?, ?)", [foreignSession, exerciseId])).insertId;
    const foreignSet = (await query("INSERT INTO ExerciseSets (performedExerciseId, setNumber, weight, reps) VALUES (?, 1, 10, 5)", [foreignExercise])).insertId;
    await api(`${profileId}/workout-sessions/${foreignSession}/cancel`, "PUT", {}, 404);
    await api(`${profileId}/workout-sessions/${foreignSession}/exercises`, "POST", { exerciseId }, 404);
    await api(`${profileId}/performed-exercises/${foreignExercise}/complete`, "PUT", {}, 404);
    await api(`${profileId}/performed-exercises/${foreignExercise}/sets`, "POST", { setNumber: 2, weight: 10, reps: 5 }, 404);
    await api(`${profileId}/exercise-sets/${foreignSet}`, "PUT", { weight: 20, reps: 10 }, 404);
    await api(`${profileId}/exercise-sets/${foreignSet}`, "DELETE", undefined, 404);

    await api(`${profileId}/performed-exercises/${performedId}/complete`, "PUT", {});
    const completed = await api(`${profileId}/workout-sessions/${sessionId}/complete`, "PUT", { totalDuration: 999999 });
    assert.equal(completed.status, "COMPLETED");
    assert.ok(completed.totalDuration < 2, "server measures duration");
    const completedRetry = await api(`${profileId}/workout-sessions/${sessionId}/complete`, "PUT", {});
    assert.equal(completedRetry.endTime, completed.endTime);
    await api(`${profileId}/exercise-sets/${set.setId}`, "PUT", { weight: 30, reps: 10 }, 409);
    await api(`${profileId}/workout-sessions/${sessionId}/cancel`, "PUT", {}, 409);
    assert.equal(await api(`${profileId}/active-session`), null);
    const history = await api(`${profileId}/workout-history?period=WEEK`);
    assert.equal(history.length, 1);
    assert.equal(Number(history[0].totalVolume), 200);
    const summary = await api(`${profileId}/progress-summary`);
    assert.equal(Number(summary.totalSessions), 1);
    const records = await api(`${profileId}/personal-records`);
    assert.equal(Number(records.find(record => record.exerciseId === exerciseId).maxWeight), 25);
    assert.ok(records.find(record => record.exerciseId === exerciseId).achievedAt);
    const previous = await api(`${profileId}/exercises/${exerciseId}/previous-performance`);
    assert.equal(Number(previous[0].weight), 25);

    // A mid-plan failure rolls back the plan and preserves the active assignment.
    const before = await query("SELECT planId FROM WorkoutPlans WHERE creatorId = ?", [accountIds[0]]);
    await api(`${profileId}/plans`, "POST", { ...planBody, days: [{ ...planBody.days[0], exercises: [planBody.days[0].exercises[0], { exerciseId: 2147483647, sets: 1, reps: 1, restTime: 0 }] }] }, 400);
    assert.deepEqual(await query("SELECT planId FROM WorkoutPlans WHERE creatorId = ?", [accountIds[0]]), before);
    assert.equal((await User.getActivePlan(profileId)).planId, plan.planId);
    const newSession = await api(`${profileId}/workout-sessions`, "POST", { dayId });
    await api(`${profileId}/workout-sessions/${newSession.workoutSessionId}/cancel`, "PUT", {});
    assert.equal((await api(`${profileId}/workout-history`)).length, 1);

    // Applying templates preserves history and never rewrites the shared days.
    const template = (await query("INSERT INTO WorkoutPlans (title, creatorId, isTemplate, durationWeeks) VALUES (?, ?, FALSE, 4)", [fixture, accountIds[1]])).insertId;
    const templateDay = (await query("INSERT INTO WorkoutDays (planId, dayName, `order`, weekDay) VALUES (?, 'Template day', ?, NULL)", [template, calendar.today])).insertId;
    await query("INSERT INTO ExerciseConfigs (exerciseId, dayId, sets, reps, `order`) VALUES (?, ?, 3, 10, 1)", [exerciseId, templateDay]);
    await api(`${profileId}/apply-plan`, "POST", { planId: template }, 400);
    await query("UPDATE WorkoutPlans SET isTemplate = TRUE WHERE planId = ?", [template]);
    await api(`${profileId}/apply-plan`, "POST", { planId: template });
    assert.equal((await api(`${profileId}/active-plan`)).planId, template);
    assert.equal((await api(`${profileId}/today-workout`)).dayId, templateDay);
    assert.equal((await query("SELECT weekDay FROM WorkoutDays WHERE dayId = ?", [templateDay]))[0].weekDay, null);
    assert.equal((await api(`${profileId}/workout-history`)).length, 1);

    await api(`profile/${accountIds[0]}/change-password`, "PUT", { oldPassword: "wrong", newPassword: "NewPassword123", confirmPassword: "NewPassword123" }, 400);
    await api(`profile/${accountIds[0]}/change-password`, "PUT", { oldPassword: "oldpassword123", newPassword: "NewPassword123", confirmPassword: "NewPassword123" }, 400);
    await api(`profile/${accountIds[0]}/change-password`, "PUT", { oldPassword: "OldPassword123", newPassword: "NewPassword123", confirmPassword: "NewPassword123" });
    assert.deepEqual(await api(`${profileId}/body-metrics`), []);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    // Delete only fixtures identified by the IDs inserted by this test.
    for (const profileId of profileIds) await query("DELETE FROM WorkoutSessions WHERE profileId = ?", [profileId]);
    for (const accountId of accountIds) {
      await query("DELETE FROM WorkoutPlans WHERE creatorId = ?", [accountId]);
      await query("DELETE FROM Accounts WHERE accountId = ?", [accountId]);
    }
    if (exerciseId) await query("DELETE FROM Exercises WHERE exerciseId = ?", [exerciseId]);
    await db.promise().end();
  }
});

const { test } = require("node:test");
const assert = require("node:assert/strict");

test("exercise substitutions preserve sets, selection, slot boundaries and API validation", {
  skip: process.env.GYM_DB_TESTS !== "1", timeout: 60000,
}, async () => {
  const db = require("../src/common/db");
  const express = require("express");
  const { issueToken } = require("../src/services/userSessionService");
  const query = (sql, args = []) => db.promise().query(sql, args).then(([rows]) => rows);
  const fixture = "alternatives_" + Date.now();
  let accountId, profileId, server;
  const ids = [];
  try {
    accountId = (await query("INSERT INTO Accounts (username, email, password, role) VALUES (?, ?, 'Fixture123', 'GYM_USER')", [fixture, fixture + "@example.test"])).insertId;
    profileId = (await query("INSERT INTO GymUsers (accountId, fullName) VALUES (?, ?)", [accountId, fixture])).insertId;
    for (const name of ["Original", "Alternative", "Other", "Invalid"]) {
      ids.push((await query("INSERT INTO Exercises (name, description, difficulty) VALUES (?, 'Fixture description', 'EASY')", [fixture + name])).insertId);
    }
    const [originalId, alternativeId, otherId, invalidId] = ids;
    await query("INSERT INTO ExerciseAlternatives (exerciseId, alternativeExerciseId, priority, note) VALUES (?, ?, 2, 'Second'), (?, ?, 1, 'First')", [originalId, otherId, originalId, alternativeId]);
    await query("INSERT INTO ExerciseMedia (exerciseId, mediaType, mediaUrl, sortOrder) VALUES (?, 'IMAGE', 'https://example.test/second.png', 2), (?, 'IMAGE', 'https://example.test/first.png', 1)", [alternativeId, alternativeId]);
    const planId = (await query("INSERT INTO WorkoutPlans (title, creatorId, durationWeeks) VALUES (?, ?, 4)", [fixture, accountId])).insertId;
    const dayId = (await query("INSERT INTO WorkoutDays (planId, dayName, `order`) VALUES (?, 'Fixture day', 1)", [planId])).insertId;
    await query("INSERT INTO ExerciseConfigs (exerciseId, dayId, sets, reps, restTime, `order`) VALUES (?, ?, 3, 10, 60, 1), (?, ?, 2, 8, 90, 2)", [originalId, dayId, alternativeId, dayId]);
    const sessionId = (await query("INSERT INTO WorkoutSessions (profileId, dayId, startTime, status) VALUES (?, ?, NOW(), 'IN_PROGRESS')", [profileId, dayId])).insertId;
    const loginId = (await query("INSERT INTO LoginSessions (accountId, expiration) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR))", [accountId])).insertId;
    const token = issueToken({ accountId, profileId, loginSessionId: loginId });
    const app = express();
    app.use(express.json());
    app.use("/api/user", require("../src/routes/user.route"));
    app.use("/api/exercises", require("../src/routes/exercises.route"));
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    const api = async (path, method = "GET", body, status = 200) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
        method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = await response.json();
      assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(payload)}`);
      return payload.data;
    };
    const prefix = `/api/user/${profileId}`;
    const sessionPath = `${prefix}/workout-sessions/${sessionId}`;
    const choose = (exerciseId, originalExerciseId = originalId, status = 200) => api(sessionPath + "/exercises", "POST", { exerciseId, originalExerciseId }, status);
    const addSet = (id, weight) => api(`${prefix}/performed-exercises/${id}/sets`, "POST", { setNumber: 1, weight, reps: 10 });
    const detail = () => api(`${prefix}/workout-history/${sessionId}`);

    const alternatives = await api(`/api/exercises/${originalId}/alternatives`);
    assert.deepEqual(alternatives.map(item => item.exerciseId), [alternativeId, otherId]);
    assert.equal(alternatives[0].name, fixture + "Alternative");
    assert.equal(alternatives[0].preview, "https://example.test/first.png");
    for (const field of ["description", "difficulty", "priority", "note", "primaryMuscles", "secondaryMuscles", "equipment"]) assert.ok(field in alternatives[0]);
    assert.deepEqual(await api(`${prefix}/exercises/${originalId}/alternatives`), alternatives);
    assert.deepEqual(await api(`/api/exercises/${invalidId}/alternatives`), []);
    for (const id of ["abc", "0", "1.5", "999999999"]) await api(`/api/exercises/${id}/alternatives`, "GET", undefined, 400);
    await assert.rejects(query("CALL sp_GetExerciseAlternatives(999999999)"), error => error.sqlState === "45000");
    await choose(invalidId, originalId, 400);
    await choose(alternativeId, invalidId, 400);
    await choose(otherId, null, 400);
    for (const value of [true, [], {}, "", "1e0", -1, 1.5]) await choose(alternativeId, value, 400);

    // Empty records are reused and completion state is cleared on a different exercise.
    const original = await choose(originalId, null);
    assert.equal(original.originalExerciseId, originalId);
    assert.equal(original.isSubstituted, 0);
    const emptyAlternative = await choose(alternativeId);
    assert.equal(emptyAlternative.performedExerciseId, original.performedExerciseId);
    const restored = await choose(originalId);
    assert.equal(restored.performedExerciseId, original.performedExerciseId);
    const originalSet = await addSet(original.performedExerciseId, 40);
    await api(`${prefix}/performed-exercises/${original.performedExerciseId}/complete`, "PUT", {});

    // Concurrent retries create one replacement, preserving the original set and identity.
    const replacements = await Promise.all(Array.from({ length: 3 }, () => choose(alternativeId)));
    assert.equal(new Set(replacements.map(item => item.performedExerciseId)).size, 1);
    const replacement = replacements[0];
    assert.notEqual(replacement.performedExerciseId, original.performedExerciseId);
    assert.equal(replacement.originalExerciseId, originalId);
    assert.equal(replacement.isSubstituted, 1);
    assert.equal(replacement.isCompleted, 0);
    const replacementSet = await addSet(replacement.performedExerciseId, 20);

    // The same physical exercise prescribed in a second slot must have its own record.
    const ownSlot = await choose(alternativeId, alternativeId);
    assert.notEqual(ownSlot.performedExerciseId, replacement.performedExerciseId);
    await addSet(ownSlot.performedExerciseId, 15);
    const returned = await choose(originalId);
    assert.equal(returned.performedExerciseId, original.performedExerciseId);
    let session = await detail();
    assert.deepEqual(session.exercises.filter(item => item.isActive).map(item => item.performedExerciseId).sort(), [original.performedExerciseId, ownSlot.performedExerciseId].sort());
    // Re-running the schema migration must not reselect a newer, inactive record.
    const migration = require("node:fs").readFileSync(require("node:path").join(__dirname, "../sql/migrate_exercise_selection.sql"), "utf8");
    const connection = await db.promise().getConnection();
    try {
      for (const statement of migration.replace(/^\s*--.*$/gm, "").split(";").filter(s => s.trim())) await connection.query(statement);
    } finally { connection.release(); }
    assert.deepEqual((await detail()).exercises.filter(item => item.isActive).map(item => item.performedExerciseId).sort(), [original.performedExerciseId, ownSlot.performedExerciseId].sort());
    assert.equal(session.prescription[0].sets, 3);
    assert.equal(session.prescription[0].restTime, 60);
    assert.equal(session.exercises.find(item => item.performedExerciseId === original.performedExerciseId).sets[0].setId, originalSet.setId);
    const retained = session.exercises.find(item => item.performedExerciseId === replacement.performedExerciseId);
    assert.equal(retained.exerciseId, alternativeId);
    assert.equal(retained.originalExerciseName, fixture + "Original");
    assert.equal(retained.preview, "https://example.test/first.png");
    assert.equal(retained.sets[0].setId, replacementSet.setId);
    assert.equal(Number(retained.sets[0].weight), 20);
    await choose(alternativeId);
    session = await api(`${prefix}/active-session`);
    assert.equal(session.exercises.find(item => item.originalExerciseId === originalId && item.isActive).performedExerciseId, replacement.performedExerciseId);

    // A new empty choice can be repurposed without disturbing either saved exercise.
    const third = await choose(otherId);
    assert.equal((await detail()).exercises.length, 4);
    await choose(originalId);
    assert.equal((await choose(otherId)).performedExerciseId, third.performedExerciseId);
    await choose(alternativeId);
    await api(sessionPath + "/complete", "PUT", {});
    await choose(originalId, originalId, 409);
    await assert.rejects(query("CALL sp_AddPerformedExercise(?, ?, ?)", [sessionId, originalId, originalId]), error => error.sqlState === "45000");
    const history = await detail();
    assert.equal(history.exercises.flatMap(item => item.sets).length, 3);
    const previous = await api(`${prefix}/exercises/${alternativeId}/previous-performance`);
    assert.ok(previous.some(set => Number(set.weight) === 20));
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (profileId) await query("DELETE FROM WorkoutSessions WHERE profileId = ?", [profileId]);
    if (accountId) {
      await query("DELETE FROM WorkoutPlans WHERE creatorId = ?", [accountId]);
      await query("DELETE FROM Accounts WHERE accountId = ?", [accountId]);
    }
    for (const id of ids) await query("DELETE FROM Exercises WHERE exerciseId = ?", [id]);
    await db.promise().end();
  }
});

const db = require("../common/db");

const fail = (message, statusCode = 400) => {
  throw Object.assign(new Error(message), { statusCode });
};

// Serialize a user's workout writes on one connection, including procedure calls.
// This also prevents concurrent start requests from creating duplicate sessions.
async function transaction(profileId, action) {
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query(
      "SELECT accountId FROM GymUsers WHERE profileId = ? FOR UPDATE", [profileId],
    );
    if (!users.length) fail("Không tìm thấy hồ sơ", 404);
    const result = await action(connection, users[0].accountId);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

async function procedure(connection, name, args) {
  const [result] = await connection.query(`CALL ${name}(${args.map(() => "?").join(",")})`, args);
  return result[0]?.[0] || null;
}

const resources = {
  session: "SELECT ws.* FROM WorkoutSessions ws WHERE ws.workoutSessionId = ? AND ws.profileId = ? FOR UPDATE",
  exercise: `SELECT ws.* FROM WorkoutSessions ws JOIN PerformedExercises pe
    ON pe.workoutSessionId = ws.workoutSessionId WHERE pe.performedExerciseId = ? AND ws.profileId = ? FOR UPDATE`,
  set: `SELECT ws.* FROM WorkoutSessions ws JOIN PerformedExercises pe
    ON pe.workoutSessionId = ws.workoutSessionId JOIN ExerciseSets es ON es.performedExerciseId = pe.performedExerciseId
    WHERE es.setId = ? AND ws.profileId = ? FOR UPDATE`,
};
const mutate = (resource, name) => (profileId, id, ...args) => transaction(profileId, async (connection) => {
  const [rows] = await connection.query(resources[resource], [id, profileId]);
  if (!rows.length) fail("Không tìm thấy dữ liệu buổi tập", 404);
  if ((name === "sp_CompleteWorkoutSession" && rows[0].status === "COMPLETED") ||
      (name === "sp_CancelWorkoutSession" && rows[0].status === "CANCELLED")) return rows[0];
  if (rows[0].status !== "IN_PROGRESS") fail("Buổi tập đã kết thúc, không thể thay đổi", 409);
  return procedure(connection, name, [id, ...args]);
});

module.exports = {
  applyPlan: (profileId, planId) => transaction(profileId, (connection) =>
    procedure(connection, "sp_ApplyWorkoutPlanToUser", [profileId, planId])),
  startWorkoutSession: (profileId, dayId) => transaction(profileId, (connection) =>
    procedure(connection, "sp_StartWorkoutSession", [profileId, dayId])),
  addPerformedExercise: mutate("session", "sp_AddPerformedExercise"),
  addExerciseSet: mutate("exercise", "sp_AddExerciseSet"),
  updateExerciseSet: mutate("set", "sp_UpdateExerciseSet"),
  deleteExerciseSet: mutate("set", "sp_DeleteExerciseSet"),
  completePerformedExercise: mutate("exercise", "sp_CompletePerformedExercise"),
  completeWorkoutSession: mutate("session", "sp_CompleteWorkoutSession"),
  cancelWorkoutSession: mutate("session", "sp_CancelWorkoutSession"),
  createCustomPlan: (profileId, data) => transaction(profileId, async (connection, accountId) => {
    const plan = await procedure(connection, "sp_CreateWorkoutPlan", [
      data.title, data.description, accountId, false, data.level, data.durationWeeks,
    ]);
    for (const day of data.days) {
      const created = await procedure(connection, "sp_AddWorkoutDay", [plan.planId, day.dayName, day.weekDay]);
      for (const exercise of day.exercises) {
        await procedure(connection, "sp_AddExerciseToWorkoutDay", [
          created.dayId, exercise.exerciseId, exercise.sets, exercise.reps, exercise.restTime,
        ]);
      }
    }
    await procedure(connection, "sp_ApplyWorkoutPlanToUser", [profileId, plan.planId]);
    return plan;
  }),
};

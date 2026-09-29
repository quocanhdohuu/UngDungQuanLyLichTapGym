const db = require("../common/db");
const Workoutplans = require("./workoutplans.model");

const call = async (sql, params) => {
  const [result] = await db.promise().query(sql, params);
  return result;
};

const User = {
  getLoginSession: async (accountId, loginSessionId) => {
    const [rows] = await db.promise().query(
      `SELECT gu.profileId FROM LoginSessions ls
       JOIN Accounts a ON a.accountId = ls.accountId
       JOIN GymUsers gu ON gu.accountId = a.accountId
       WHERE ls.accountId = ? AND ls.loginSessionId = ?
         AND ls.status = 'ACTIVE' AND ls.expiration > NOW()
         AND a.role = 'GYM_USER' AND a.status = 'ACTIVE' AND gu.status = 'ACTIVE'`,
      [accountId, loginSessionId],
    );
    return rows[0] || null;
  },

  getProfile: async (accountId) =>
    (await call("CALL sp_GetMyProfile(?)", [accountId]))[0]?.[0] || null,

  updateProfile: async (profileId, data) => {
    await call("CALL sp_UpdateMyProfile(?, ?, ?, ?, ?, ?, ?, ?)", [
      profileId, data.fullName, data.gender, data.level, data.goal,
      data.sessionsPerWeek, data.height, data.weight,
    ]);
    const [rows] = await db.promise().query(
      "SELECT accountId FROM GymUsers WHERE profileId = ?", [profileId],
    );
    return rows[0] ? User.getProfile(rows[0].accountId) : null;
  },

  getActivePlan: async (profileId) => {
    const plan = (await call("CALL sp_GetUserActivePlan(?)", [profileId]))[0]?.[0];
    if (!plan) return null;
    const detail = await Workoutplans.getDetail(plan.planId);
    return { ...plan, days: detail?.days || [] };
  },

  getTodayWorkout: async (profileId) => {
    try {
      const result = await call("CALL sp_GetTodayWorkout(?)", [profileId]);
      const workout = result[0]?.[0];
      if (workout?.dayId) return { ...workout, exercises: result[1] || [] };
      if (!workout?.planId) return null;
      // Legacy templates without weekdays use day order (Monday = 1).
      // Resolve it at read time instead of editing a shared template on apply.
      const [days] = await db.promise().query(
        "SELECT dayId FROM WorkoutDays WHERE planId = ? AND weekDay IS NULL AND `order` = WEEKDAY(CURDATE()) + 1 LIMIT 1", [workout.planId],
      );
      if (!days.length) return null;
      const detail = await Workoutplans.getDetail(workout.planId);
      const day = detail?.days.find(item => item.dayId === days[0].dayId);
      return day ? { ...workout, dayId: day.dayId, dayName: day.dayName, exercises: day.exercises,
        totalExercises: day.exercises.length, totalSets: day.exercises.reduce((sum, exercise) => sum + Number(exercise.sets), 0) } : null;
    } catch (error) {
      // This procedure signals the absence of an active plan as a business case.
      if (error.sqlState === "45000" &&
        error.sqlMessage === "Người dùng chưa có lịch tập đang hoạt động") return null;
      throw error;
    }
  },

  getProgressSummary: async (profileId) =>
    (await call("CALL sp_GetUserProgressSummary(?)", [profileId]))[0]?.[0] || null,
  getPersonalRecords: async (profileId) => {
    const records = (await call("CALL sp_GetUserPersonalRecords(?)", [profileId]))[0] || [];
    if (!records.length) return records;
    // First time the current maximum was achieved; a later tie is not a new PR.
    const [dates] = await db.promise().query(
      `SELECT pe.exerciseId, MIN(ws.endTime) AS achievedAt FROM WorkoutSessions ws
       JOIN PerformedExercises pe ON pe.workoutSessionId = ws.workoutSessionId
       JOIN ExerciseSets es ON es.performedExerciseId = pe.performedExerciseId
       WHERE ws.profileId = ? AND ws.status = 'COMPLETED'
         AND (${records.map(() => "(pe.exerciseId = ? AND es.weight = ?)").join(" OR ")})
       GROUP BY pe.exerciseId`, [profileId, ...records.flatMap(record => [record.exerciseId, record.maxWeight])],
    );
    return records.map(record => ({ ...record, achievedAt: dates.find(date => date.exerciseId === record.exerciseId)?.achievedAt || null }));
  },
  getWorkoutHistory: async (profileId, period) =>
    (await call("CALL sp_GetUserWorkoutHistory(?, ?)", [profileId, period]))[0] || [],

  getWorkoutDetail: async (profileId, workoutSessionId) => {
    const [sessions] = await db.promise().query(
      `SELECT ws.workoutSessionId, ws.profileId, ws.dayId, ws.startTime, ws.endTime,
              ws.totalDuration, ws.status, wd.dayName, wp.planId, wp.title AS planTitle
       FROM WorkoutSessions ws
       LEFT JOIN WorkoutDays wd ON wd.dayId = ws.dayId
       LEFT JOIN WorkoutPlans wp ON wp.planId = wd.planId
       WHERE ws.profileId = ? AND ws.workoutSessionId = ?`,
      [profileId, workoutSessionId],
    );
    if (!sessions.length) return null;
    const session = sessions[0];
    const [rows] = await db.promise().query(
      `SELECT pe.performedExerciseId, pe.exerciseId, pe.originalExerciseId, pe.isSubstituted, pe.isCompleted,
              e.name AS exerciseName, orig.name AS originalExerciseName,
              (SELECT GROUP_CONCAT(DISTINCT mg.groupName ORDER BY mg.groupName SEPARATOR ', ')
               FROM ExerciseMuscleGroups emg JOIN MuscleGroups mg ON mg.groupId = emg.groupId
               WHERE emg.exerciseId = e.exerciseId AND emg.role = 'PRIMARY') AS primaryMuscles,
              (SELECT GROUP_CONCAT(DISTINCT eq.equipmentName ORDER BY eq.equipmentName SEPARATOR ', ')
               FROM ExerciseEquipment ee JOIN Equipment eq ON eq.equipmentId = ee.equipmentId
               WHERE ee.exerciseId = e.exerciseId) AS equipment,
              es.setId, es.setNumber, es.weight, es.reps, es.preValue
       FROM PerformedExercises pe
       JOIN Exercises e ON e.exerciseId = pe.exerciseId
       LEFT JOIN Exercises orig ON orig.exerciseId = pe.originalExerciseId
       LEFT JOIN ExerciseSets es ON es.performedExerciseId = pe.performedExerciseId
       WHERE pe.workoutSessionId = ?
       ORDER BY pe.performedExerciseId, es.setNumber`, [workoutSessionId],
    );
    const exercises = new Map();
    for (const row of rows) {
      if (!exercises.has(row.performedExerciseId)) {
        exercises.set(row.performedExerciseId, {
          performedExerciseId: row.performedExerciseId,
          exerciseId: row.exerciseId,
          originalExerciseId: row.originalExerciseId,
          isSubstituted: Boolean(row.isSubstituted),
          exerciseName: row.exerciseName,
          originalExerciseName: row.originalExerciseName,
          primaryMuscles: row.primaryMuscles,
          equipment: row.equipment,
          isCompleted: Boolean(row.isCompleted),
          sets: [],
        });
      }
      if (row.setId != null) exercises.get(row.performedExerciseId).sets.push({
        setId: row.setId,
        setNumber: row.setNumber,
        weight: row.weight,
        reps: row.reps,
        preValue: row.preValue,
      });
    }
    const [prescription] = session.dayId ? await db.promise().query(
      `SELECT ec.configId, ec.exerciseId, e.name AS exerciseName, ec.sets, ec.reps, ec.restTime,
         (SELECT GROUP_CONCAT(DISTINCT mg.groupName ORDER BY mg.groupName SEPARATOR ', ')
          FROM ExerciseMuscleGroups emg JOIN MuscleGroups mg ON mg.groupId = emg.groupId
          WHERE emg.exerciseId = e.exerciseId AND emg.role = 'PRIMARY') AS primaryMuscles,
         (SELECT GROUP_CONCAT(DISTINCT eq.equipmentName ORDER BY eq.equipmentName SEPARATOR ', ')
          FROM ExerciseEquipment ee JOIN Equipment eq ON eq.equipmentId = ee.equipmentId
          WHERE ee.exerciseId = e.exerciseId) AS equipment
       FROM ExerciseConfigs ec JOIN Exercises e ON e.exerciseId = ec.exerciseId
       WHERE ec.dayId = ? ORDER BY ec.\`order\``, [session.dayId],
    ) : [[]];
    return { ...session, prescription, exercises: [...exercises.values()] };
  },

  ...require("./user-workout.model"),

  getActiveSession: async (profileId) => {
    const [rows] = await db.promise().query(
      "SELECT workoutSessionId FROM WorkoutSessions WHERE profileId = ? AND status = 'IN_PROGRESS' ORDER BY startTime DESC LIMIT 1", [profileId],
    );
    return rows[0] ? User.getWorkoutDetail(profileId, rows[0].workoutSessionId) : null;
  },

  getPreviousPerformance: async (profileId, exerciseId) =>
    (await call("CALL sp_GetPreviousExercisePerformance(?, ?)", [profileId, exerciseId]))[0] || [],

  getExerciseAlternatives: async (exerciseId) =>
    (await call("CALL sp_GetExerciseAlternatives(?)", [exerciseId]))[0] || [],

  changePassword: async (accountId, oldPassword, newPassword) =>
    (await call("CALL sp_ChangePassword(?, ?, ?)", [accountId, oldPassword, newPassword]))[0]?.[0],

  getBodyMetrics: async (profileId) =>
    (await call("CALL sp_GetUserBodyMetrics(?)", [profileId]))[0] || [],
};

module.exports = User;

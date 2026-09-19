const db = require("../common/db");

const Workoutplans = (workoutplans) => {
  this.planId = workoutplans.planId;
  this.title = workoutplans.title;
  this.description = workoutplans.description;
  this.creatorId = workoutplans.creatorId;
  this.isTemplate = workoutplans.isTemplate;
  this.level = workoutplans.level;
  this.createdAt = workoutplans.createdAt;
};

Workoutplans.getById = (planId, callback) => {
  const sqlString = "SELECT * FROM `workoutplans` WHERE `planId` = ?";
  db.query(sqlString, [planId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Workoutplans.getTemplates = async () => {
  const [result] = await db
    .promise()
    .query("CALL sp_GetWorkoutPlanTemplates()");
  return result[0] || [];
};

Workoutplans.getDetail = async (planId) => {
  const [result] = await db
    .promise()
    .query("CALL sp_GetWorkoutPlanDetail(?)", [planId]);
  const plan = result[0]?.[0];
  if (!plan) return null;
  const days = new Map();
  (result[1] || []).forEach((row) => {
    if (!days.has(row.dayId))
      days.set(row.dayId, {
        dayId: row.dayId,
        dayName: row.dayName,
        dayOrder: row.dayOrder,
        exercises: [],
      });
    if (row.configId !== null && row.configId !== undefined) {
      days
        .get(row.dayId)
        .exercises.push({
          configId: row.configId,
          exerciseId: row.exerciseId,
          exerciseName: row.exerciseName,
          exerciseDescription: row.exerciseDescription,
          difficulty: row.difficulty,
          sets: row.sets,
          reps: row.reps,
          restTime: row.restTime,
          exerciseOrder: row.exerciseOrder,
        });
    }
  });
  return { ...plan, days: Array.from(days.values()) };
};

Workoutplans.createWithProcedure = async (data) => {
  const [result] = await db
    .promise()
    .query("CALL sp_CreateWorkoutPlan(?, ?, ?, ?, ?)", [
      data.title,
      data.description,
      data.creatorId,
      data.isTemplate,
      data.level,
    ]);
  return result[0]?.[0] || null;
};

Workoutplans.updateWithProcedure = async (planId, data) => {
  const [result] = await db
    .promise()
    .query("CALL sp_UpdateWorkoutPlan(?, ?, ?, ?, ?)", [
      planId,
      data.title,
      data.description,
      data.level,
      data.isTemplate,
    ]);
  return result[0]?.[0] || null;
};

Workoutplans.getAll = (callback) => {
  const sqlString = "SELECT * FROM `workoutplans`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Workoutplans.insert = (workoutplans, callback) => {
  const sqlString = "INSERT INTO `workoutplans` SET ?";
  db.query(sqlString, workoutplans, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { planId: res.insertId, ...workoutplans });
  });
};

Workoutplans.update = (workoutplans, planId, callback) => {
  const sqlString = "UPDATE `workoutplans` SET ? WHERE `planId` = ?";
  db.query(sqlString, [workoutplans, planId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật workoutplans thành công" });
  });
};

Workoutplans.delete = (planId, callback) => {
  db.query(
    "DELETE FROM `workoutplans` WHERE `planId` = ?",
    [planId],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, { message: "Xóa workoutplans thành công" });
    },
  );
};

module.exports = Workoutplans;

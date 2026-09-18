const db = require("../common/db");

const Exercises = (exercises) => {
  this.exerciseId = exercises.exerciseId;
  this.name = exercises.name;
  this.description = exercises.description;
  this.difficulty = exercises.difficulty;
};

Exercises.getById = (exerciseId, callback) => {
  const sqlString = "SELECT * FROM `exercises` WHERE `exerciseId` = ?";
  db.query(sqlString, [exerciseId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exercises.getDetailsById = async (exerciseId) => {
  const [exerciseRows] = await db
    .promise()
    .query(
      "SELECT exerciseId, name, description, difficulty FROM `exercises` WHERE exerciseId = ?",
      [exerciseId],
    );

  if (exerciseRows.length === 0) {
    return null;
  }

  const [muscleGroups] = await db
    .promise()
    .query(
      "SELECT groupId, role FROM `exercisemusclegroups` WHERE exerciseId = ? ORDER BY exerciseMuscleGroupId",
      [exerciseId],
    );
  const [equipmentRows] = await db
    .promise()
    .query(
      "SELECT equipmentId FROM `exerciseequipment` WHERE exerciseId = ? ORDER BY exerciseId, equipmentId",
      [exerciseId],
    );
  const [media] = await db
    .promise()
    .query(
      "SELECT mediaId, mediaUrl, publicId, mediaType, sortOrder FROM `exercisemedia` WHERE exerciseId = ? ORDER BY sortOrder, mediaId",
      [exerciseId],
    );

  return {
    ...exerciseRows[0],
    muscleGroups,
    equipmentIds: equipmentRows.map((item) => item.equipmentId),
    media,
  };
};

Exercises.createWithProcedure = async (data) => {
  const [result] = await db
    .promise()
    .query("CALL sp_AddExercise(?, ?, ?, ?, ?, ?)", [
      data.name,
      data.description ?? null,
      data.difficulty,
      JSON.stringify(data.muscleGroups),
      JSON.stringify(data.equipmentIds),
      JSON.stringify(data.media),
    ]);

  return result[0]?.[0] || null;
};

Exercises.updateWithProcedure = async (exerciseId, data) => {
  const [result] = await db
    .promise()
    .query("CALL sp_UpdateExercise(?, ?, ?, ?, ?, ?, ?)", [
      exerciseId,
      data.name,
      data.description ?? null,
      data.difficulty,
      JSON.stringify(data.muscleGroups),
      JSON.stringify(data.equipmentIds),
      JSON.stringify(data.media),
    ]);

  return result[0]?.[0] || null;
};

Exercises.getAll = (callback) => {
  const sqlString = "CALL sp_GetAllExercises()";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }

    const rows =
      Array.isArray(result) && result.length > 0 ? result[0] : result;
    callback(null, rows);
  });
};

Exercises.getAllWithSummary = (callback) => {
  return Exercises.getAll(callback);
};

Exercises.insert = (exercises, callback) => {
  const sqlString = "INSERT INTO `exercises` SET ?";
  db.query(sqlString, exercises, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { exerciseId: res.insertId, ...exercises });
  });
};

Exercises.update = (exercises, exerciseId, callback) => {
  const sqlString = "UPDATE `exercises` SET ? WHERE `exerciseId` = ?";
  db.query(sqlString, [exercises, exerciseId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật exercises thành công" });
  });
};

Exercises.delete = (exerciseId, callback) => {
  db.query(
    "DELETE FROM `exercises` WHERE `exerciseId` = ?",
    [exerciseId],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, { message: "Xóa exercises thành công" });
    },
  );
};

module.exports = Exercises;

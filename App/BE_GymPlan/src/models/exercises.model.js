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
      `SELECT emg.groupId, emg.role, mg.groupName
       FROM exercisemusclegroups emg
       LEFT JOIN musclegroups mg ON mg.groupId = emg.groupId
       WHERE emg.exerciseId = ?
       ORDER BY emg.exerciseMuscleGroupId`,
      [exerciseId],
    );
  const [equipmentRows] = await db
    .promise()
    .query(
      `SELECT ee.equipmentId, eq.equipmentName
       FROM exerciseequipment ee
       LEFT JOIN equipment eq ON eq.equipmentId = ee.equipmentId
       WHERE ee.exerciseId = ?
       ORDER BY ee.exerciseId, ee.equipmentId`,
      [exerciseId],
    );
  const [media] = await db
    .promise()
    .query(
      "SELECT mediaId, mediaUrl, publicId, mediaType, sortOrder FROM `exercisemedia` WHERE exerciseId = ? ORDER BY sortOrder, mediaId",
      [exerciseId],
    );

  const primaryMuscles = muscleGroups
    .filter((m) => m.role === "PRIMARY")
    .map((m) => m.groupName)
    .join(", ");
  const secondaryMuscles = muscleGroups
    .filter((m) => m.role === "SECONDARY")
    .map((m) => m.groupName)
    .join(", ");
  const equipmentNames = equipmentRows.map((e) => e.equipmentName).filter(Boolean).join(", ");

  return {
    ...exerciseRows[0],
    muscleGroups,
    primaryMuscles: primaryMuscles || null,
    secondaryMuscles: secondaryMuscles || null,
    equipment: equipmentNames || null,
    equipmentIds: equipmentRows.map((item) => item.equipmentId),
    equipmentList: equipmentRows,
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

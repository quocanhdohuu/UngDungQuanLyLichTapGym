const db = require("../config/db");

const Exercisemusclegroups = (exercisemusclegroups) => {
  this.exerciseMuscleGroupId = exercisemusclegroups.exerciseMuscleGroupId;
  this.exerciseId = exercisemusclegroups.exerciseId;
  this.groupId = exercisemusclegroups.groupId;
  this.role = exercisemusclegroups.role;
};

Exercisemusclegroups.getById = (exerciseMuscleGroupId, callback) => {
  const sqlString =
    "SELECT * FROM `exercisemusclegroups` WHERE `exerciseMuscleGroupId` = ?";
  db.query(sqlString, [exerciseMuscleGroupId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exercisemusclegroups.getAll = (callback) => {
  const sqlString = "SELECT * FROM `exercisemusclegroups`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exercisemusclegroups.insert = (exercisemusclegroups, callback) => {
  const sqlString = "INSERT INTO `exercisemusclegroups` SET ?";
  db.query(sqlString, exercisemusclegroups, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, {
      exerciseMuscleGroupId: res.insertId,
      ...exercisemusclegroups,
    });
  });
};

Exercisemusclegroups.update = (
  exercisemusclegroups,
  exerciseMuscleGroupId,
  callback,
) => {
  const sqlString =
    "UPDATE `exercisemusclegroups` SET ? WHERE `exerciseMuscleGroupId` = ?";
  db.query(
    sqlString,
    [exercisemusclegroups, exerciseMuscleGroupId],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, { message: "Cập nhật exercisemusclegroups thành công" });
    },
  );
};

Exercisemusclegroups.delete = (exerciseMuscleGroupId, callback) => {
  db.query(
    "DELETE FROM `exercisemusclegroups` WHERE `exerciseMuscleGroupId` = ?",
    [exerciseMuscleGroupId],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, { message: "Xóa exercisemusclegroups thành công" });
    },
  );
};

module.exports = Exercisemusclegroups;

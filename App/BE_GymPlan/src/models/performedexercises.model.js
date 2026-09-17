const db = require("../common/db");

const Performedexercises = (performedexercises) => {
  this.performedExerciseId = performedexercises.performedExerciseId;
  this.workoutSessionId = performedexercises.workoutSessionId;
  this.exerciseId = performedexercises.exerciseId;
  this.isCompleted = performedexercises.isCompleted;
};

Performedexercises.getById = (performedExerciseId, callback) => {
  const sqlString = "SELECT * FROM `performedexercises` WHERE `performedExerciseId` = ?";
  db.query(sqlString, [performedExerciseId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Performedexercises.getAll = (callback) => {
  const sqlString = "SELECT * FROM `performedexercises`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Performedexercises.insert = (performedexercises, callback) => {
  const sqlString = "INSERT INTO `performedexercises` SET ?";
  db.query(sqlString, performedexercises, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { performedExerciseId: res.insertId, ...performedexercises });
  });
};

Performedexercises.update = (performedexercises, performedExerciseId, callback) => {
  const sqlString = "UPDATE `performedexercises` SET ? WHERE `performedExerciseId` = ?";
  db.query(sqlString, [performedexercises, performedExerciseId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật performedexercises thành công" });
  });
};

Performedexercises.delete = (performedExerciseId, callback) => {
  db.query("DELETE FROM `performedexercises` WHERE `performedExerciseId` = ?", [performedExerciseId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Xóa performedexercises thành công" });
  });
};

module.exports = Performedexercises;

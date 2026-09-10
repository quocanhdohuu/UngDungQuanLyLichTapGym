const db = require("../config/db");

const Exercises = (exercises) => {
  this.exerciseId = exercises.exerciseId;
  this.name = exercises.name;
  this.description = exercises.description;
  this.mediaUrl = exercises.mediaUrl;
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

Exercises.getAll = (callback) => {
  const sqlString = "SELECT * FROM `exercises`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
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

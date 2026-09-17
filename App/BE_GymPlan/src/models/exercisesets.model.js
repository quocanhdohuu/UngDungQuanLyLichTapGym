const db = require("../common/db");

const Exercisesets = (exercisesets) => {
  this.setId = exercisesets.setId;
  this.performedExerciseId = exercisesets.performedExerciseId;
  this.setNumber = exercisesets.setNumber;
  this.weight = exercisesets.weight;
  this.reps = exercisesets.reps;
  this.preValue = exercisesets.preValue;
};

Exercisesets.getById = (setId, callback) => {
  const sqlString = "SELECT * FROM `exercisesets` WHERE `setId` = ?";
  db.query(sqlString, [setId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exercisesets.getAll = (callback) => {
  const sqlString = "SELECT * FROM `exercisesets`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exercisesets.insert = (exercisesets, callback) => {
  const sqlString = "INSERT INTO `exercisesets` SET ?";
  db.query(sqlString, exercisesets, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { setId: res.insertId, ...exercisesets });
  });
};

Exercisesets.update = (exercisesets, setId, callback) => {
  const sqlString = "UPDATE `exercisesets` SET ? WHERE `setId` = ?";
  db.query(sqlString, [exercisesets, setId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật exercisesets thành công" });
  });
};

Exercisesets.delete = (setId, callback) => {
  db.query("DELETE FROM `exercisesets` WHERE `setId` = ?", [setId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Xóa exercisesets thành công" });
  });
};

module.exports = Exercisesets;

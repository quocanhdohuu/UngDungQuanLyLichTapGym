const db = require("../common/db");

const Exerciseconfigs = (exerciseconfigs) => {
  this.configId = exerciseconfigs.configId;
  this.exerciseId = exerciseconfigs.exerciseId;
  this.dayId = exerciseconfigs.dayId;
  this.sets = exerciseconfigs.sets;
  this.reps = exerciseconfigs.reps;
  this.restTime = exerciseconfigs.restTime;
  this.order = exerciseconfigs.order;
};

Exerciseconfigs.getById = (configId, callback) => {
  const sqlString = "SELECT * FROM `exerciseconfigs` WHERE `configId` = ?";
  db.query(sqlString, [configId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exerciseconfigs.getAll = (callback) => {
  const sqlString = "SELECT * FROM `exerciseconfigs`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exerciseconfigs.insert = (exerciseconfigs, callback) => {
  const sqlString = "INSERT INTO `exerciseconfigs` SET ?";
  db.query(sqlString, exerciseconfigs, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { configId: res.insertId, ...exerciseconfigs });
  });
};

Exerciseconfigs.update = (exerciseconfigs, configId, callback) => {
  const sqlString = "UPDATE `exerciseconfigs` SET ? WHERE `configId` = ?";
  db.query(sqlString, [exerciseconfigs, configId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật exerciseconfigs thành công" });
  });
};

Exerciseconfigs.delete = (configId, callback) => {
  db.query("DELETE FROM `exerciseconfigs` WHERE `configId` = ?", [configId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Xóa exerciseconfigs thành công" });
  });
};

module.exports = Exerciseconfigs;

const db = require("../config/db");

const Exerciseequipment = (exerciseequipment) => {
  this.exerciseId = exerciseequipment.exerciseId;
  this.equipmentId = exerciseequipment.equipmentId;
};

Exerciseequipment.getById = (exerciseId, callback) => {
  const sqlString = "SELECT * FROM `exerciseequipment` WHERE `exerciseId` = ?";
  db.query(sqlString, [exerciseId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exerciseequipment.getAll = (callback) => {
  const sqlString = "SELECT * FROM `exerciseequipment`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exerciseequipment.insert = (exerciseequipment, callback) => {
  const sqlString = "INSERT INTO `exerciseequipment` SET ?";
  db.query(sqlString, exerciseequipment, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { exerciseId: res.insertId, ...exerciseequipment });
  });
};

Exerciseequipment.update = (exerciseequipment, exerciseId, callback) => {
  const sqlString = "UPDATE `exerciseequipment` SET ? WHERE `exerciseId` = ?";
  db.query(sqlString, [exerciseequipment, exerciseId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật exerciseequipment thành công" });
  });
};

Exerciseequipment.delete = (exerciseId, callback) => {
  db.query(
    "DELETE FROM `exerciseequipment` WHERE `exerciseId` = ?",
    [exerciseId],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, { message: "Xóa exerciseequipment thành công" });
    },
  );
};

module.exports = Exerciseequipment;

const db = require("../config/db");

const Equipment = (equipment) => {
  this.equipmentId = equipment.equipmentId;
  this.equipmentName = equipment.equipmentName;
};

Equipment.getById = (equipmentId, callback) => {
  const sqlString = "SELECT * FROM `equipment` WHERE `equipmentId` = ?";
  db.query(sqlString, [equipmentId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Equipment.getAll = (callback) => {
  const sqlString = "SELECT * FROM `equipment`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Equipment.insert = (equipment, callback) => {
  const sqlString = "INSERT INTO `equipment` SET ?";
  db.query(sqlString, equipment, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { equipmentId: res.insertId, ...equipment });
  });
};

Equipment.update = (equipment, equipmentId, callback) => {
  const sqlString = "UPDATE `equipment` SET ? WHERE `equipmentId` = ?";
  db.query(sqlString, [equipment, equipmentId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật equipment thành công" });
  });
};

Equipment.delete = (equipmentId, callback) => {
  db.query(
    "DELETE FROM `equipment` WHERE `equipmentId` = ?",
    [equipmentId],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, { message: "Xóa equipment thành công" });
    },
  );
};

module.exports = Equipment;

const db = require("../common/db");

const Musclegroups = (musclegroups) => {
  this.groupId = musclegroups.groupId;
  this.groupName = musclegroups.groupName;
  this.function = musclegroups.function;
};

Musclegroups.getById = (groupId, callback) => {
  const sqlString = "SELECT * FROM `musclegroups` WHERE `groupId` = ?";
  db.query(sqlString, [groupId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Musclegroups.getAll = (callback) => {
  const sqlString = "SELECT * FROM `musclegroups`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Musclegroups.insert = (musclegroups, callback) => {
  const sqlString = "INSERT INTO `musclegroups` SET ?";
  db.query(sqlString, musclegroups, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { groupId: res.insertId, ...musclegroups });
  });
};

Musclegroups.update = (musclegroups, groupId, callback) => {
  const sqlString = "UPDATE `musclegroups` SET ? WHERE `groupId` = ?";
  db.query(sqlString, [musclegroups, groupId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật musclegroups thành công" });
  });
};

Musclegroups.delete = (groupId, callback) => {
  db.query("DELETE FROM `musclegroups` WHERE `groupId` = ?", [groupId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Xóa musclegroups thành công" });
  });
};

module.exports = Musclegroups;

const db = require("../common/db");

const Gymusers = (gymusers) => {
  this.profileId = gymusers.profileId;
  this.accountId = gymusers.accountId;
  this.fullName = gymusers.fullName;
  this.gender = gymusers.gender;
  this.level = gymusers.level;
  this.goal = gymusers.goal;
  this.sessionsPerWeek = gymusers.sessionsPerWeek;
  this.status = gymusers.status;
};

Gymusers.getById = (profileId, callback) => {
  const sqlString = "SELECT * FROM `gymusers` WHERE `profileId` = ?";
  db.query(sqlString, [profileId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Gymusers.getAll = (callback) => {
  const sqlString = "SELECT * FROM `gymusers`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Gymusers.insert = (gymusers, callback) => {
  const sqlString = "INSERT INTO `gymusers` SET ?";
  db.query(sqlString, gymusers, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { profileId: res.insertId, ...gymusers });
  });
};

Gymusers.update = (gymusers, profileId, callback) => {
  const sqlString = "UPDATE `gymusers` SET ? WHERE `profileId` = ?";
  db.query(sqlString, [gymusers, profileId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật gymusers thành công" });
  });
};

Gymusers.delete = (profileId, callback) => {
  db.query("DELETE FROM `gymusers` WHERE `profileId` = ?", [profileId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Xóa gymusers thành công" });
  });
};

module.exports = Gymusers;

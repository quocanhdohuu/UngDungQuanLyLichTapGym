const db = require("../config/db");

const Gymuserworkoutplans = (gymuserworkoutplans) => {
  this.profileId = gymuserworkoutplans.profileId;
  this.planId = gymuserworkoutplans.planId;
  this.joinedAt = gymuserworkoutplans.joinedAt;
  this.status = gymuserworkoutplans.status;
};

Gymuserworkoutplans.getById = (profileId, callback) => {
  const sqlString = "SELECT * FROM `gymuserworkoutplans` WHERE `profileId` = ?";
  db.query(sqlString, [profileId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Gymuserworkoutplans.getAll = (callback) => {
  const sqlString = "SELECT * FROM `gymuserworkoutplans`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Gymuserworkoutplans.insert = (gymuserworkoutplans, callback) => {
  const sqlString = "INSERT INTO `gymuserworkoutplans` SET ?";
  db.query(sqlString, gymuserworkoutplans, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { profileId: res.insertId, ...gymuserworkoutplans });
  });
};

Gymuserworkoutplans.update = (gymuserworkoutplans, profileId, callback) => {
  const sqlString = "UPDATE `gymuserworkoutplans` SET ? WHERE `profileId` = ?";
  db.query(sqlString, [gymuserworkoutplans, profileId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật gymuserworkoutplans thành công" });
  });
};

Gymuserworkoutplans.delete = (profileId, callback) => {
  db.query(
    "DELETE FROM `gymuserworkoutplans` WHERE `profileId` = ?",
    [profileId],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, { message: "Xóa gymuserworkoutplans thành công" });
    },
  );
};

module.exports = Gymuserworkoutplans;

const db = require("../config/db");

const Admins = (admins) => {
  this.accountId = admins.accountId;
};

Admins.getById = (accountId, callback) => {
  const sqlString = "SELECT * FROM `admins` WHERE `accountId` = ?";
  db.query(sqlString, [accountId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Admins.getAll = (callback) => {
  const sqlString = "SELECT * FROM `admins`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Admins.insert = (admins, callback) => {
  const sqlString = "INSERT INTO `admins` SET ?";
  db.query(sqlString, admins, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { accountId: res.insertId, ...admins });
  });
};

Admins.update = (admins, accountId, callback) => {
  const sqlString = "UPDATE `admins` SET ? WHERE `accountId` = ?";
  db.query(sqlString, [admins, accountId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật admins thành công" });
  });
};

Admins.delete = (accountId, callback) => {
  db.query(
    "DELETE FROM `admins` WHERE `accountId` = ?",
    [accountId],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, { message: "Xóa admins thành công" });
    },
  );
};

module.exports = Admins;

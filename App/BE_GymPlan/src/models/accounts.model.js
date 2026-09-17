const db = require("../common/db");

const Accounts = (accounts) => {
  this.accountId = accounts.accountId;
  this.username = accounts.username;
  this.email = accounts.email;
  this.password = accounts.password;
  this.role = accounts.role;
  this.status = accounts.status;
  this.createdAt = accounts.createdAt;
};

Accounts.getById = (accountId, callback) => {
  const sqlString = "SELECT * FROM `accounts` WHERE `accountId` = ?";
  db.query(sqlString, [accountId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Accounts.getAll = (callback) => {
  const sqlString = "SELECT * FROM `accounts`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Accounts.insert = (accounts, callback) => {
  const sqlString = "INSERT INTO `accounts` SET ?";
  db.query(sqlString, accounts, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { accountId: res.insertId, ...accounts });
  });
};

Accounts.update = (accounts, accountId, callback) => {
  const sqlString = "UPDATE `accounts` SET ? WHERE `accountId` = ?";
  db.query(sqlString, [accounts, accountId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật accounts thành công" });
  });
};

Accounts.delete = (accountId, callback) => {
  db.query("DELETE FROM `accounts` WHERE `accountId` = ?", [accountId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Xóa accounts thành công" });
  });
};

module.exports = Accounts;

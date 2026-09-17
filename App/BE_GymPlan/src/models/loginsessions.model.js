const db = require("../common/db");

const Loginsessions = (loginsessions) => {
  this.loginSessionId = loginsessions.loginSessionId;
  this.accountId = loginsessions.accountId;
  this.loginTime = loginsessions.loginTime;
  this.expiration = loginsessions.expiration;
  this.status = loginsessions.status;
};

Loginsessions.getById = (loginSessionId, callback) => {
  const sqlString = "SELECT * FROM `loginsessions` WHERE `loginSessionId` = ?";
  db.query(sqlString, [loginSessionId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Loginsessions.getAll = (callback) => {
  const sqlString = "SELECT * FROM `loginsessions`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Loginsessions.insert = (loginsessions, callback) => {
  const sqlString = "INSERT INTO `loginsessions` SET ?";
  db.query(sqlString, loginsessions, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { loginSessionId: res.insertId, ...loginsessions });
  });
};

Loginsessions.update = (loginsessions, loginSessionId, callback) => {
  const sqlString = "UPDATE `loginsessions` SET ? WHERE `loginSessionId` = ?";
  db.query(sqlString, [loginsessions, loginSessionId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật loginsessions thành công" });
  });
};

Loginsessions.delete = (loginSessionId, callback) => {
  db.query("DELETE FROM `loginsessions` WHERE `loginSessionId` = ?", [loginSessionId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Xóa loginsessions thành công" });
  });
};

module.exports = Loginsessions;

const db = require("../common/db");

const Bodymetrics = (bodymetrics) => {
  this.metricId = bodymetrics.metricId;
  this.profileId = bodymetrics.profileId;
  this.height = bodymetrics.height;
  this.weight = bodymetrics.weight;
  this.recordedAt = bodymetrics.recordedAt;
};

Bodymetrics.getById = (metricId, callback) => {
  const sqlString = "SELECT * FROM `bodymetrics` WHERE `metricId` = ?";
  db.query(sqlString, [metricId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Bodymetrics.getAll = (callback) => {
  const sqlString = "SELECT * FROM `bodymetrics`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Bodymetrics.insert = (bodymetrics, callback) => {
  const sqlString = "INSERT INTO `bodymetrics` SET ?";
  db.query(sqlString, bodymetrics, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { metricId: res.insertId, ...bodymetrics });
  });
};

Bodymetrics.update = (bodymetrics, metricId, callback) => {
  const sqlString = "UPDATE `bodymetrics` SET ? WHERE `metricId` = ?";
  db.query(sqlString, [bodymetrics, metricId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật bodymetrics thành công" });
  });
};

Bodymetrics.delete = (metricId, callback) => {
  db.query("DELETE FROM `bodymetrics` WHERE `metricId` = ?", [metricId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Xóa bodymetrics thành công" });
  });
};

module.exports = Bodymetrics;

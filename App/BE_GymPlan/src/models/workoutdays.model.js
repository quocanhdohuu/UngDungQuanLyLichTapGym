const db = require("../common/db");

const Workoutdays = (workoutdays) => {
  this.dayId = workoutdays.dayId;
  this.planId = workoutdays.planId;
  this.dayName = workoutdays.dayName;
  this.order = workoutdays.order;
};

Workoutdays.getById = (dayId, callback) => {
  const sqlString = "SELECT * FROM `workoutdays` WHERE `dayId` = ?";
  db.query(sqlString, [dayId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Workoutdays.getAll = (callback) => {
  const sqlString = "SELECT * FROM `workoutdays`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Workoutdays.insert = (workoutdays, callback) => {
  const sqlString = "INSERT INTO `workoutdays` SET ?";
  db.query(sqlString, workoutdays, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { dayId: res.insertId, ...workoutdays });
  });
};

Workoutdays.update = (workoutdays, dayId, callback) => {
  const sqlString = "UPDATE `workoutdays` SET ? WHERE `dayId` = ?";
  db.query(sqlString, [workoutdays, dayId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật workoutdays thành công" });
  });
};

Workoutdays.delete = (dayId, callback) => {
  db.query("DELETE FROM `workoutdays` WHERE `dayId` = ?", [dayId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Xóa workoutdays thành công" });
  });
};

module.exports = Workoutdays;

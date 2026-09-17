const db = require("../common/db");

const Workoutsessions = (workoutsessions) => {
  this.workoutSessionId = workoutsessions.workoutSessionId;
  this.profileId = workoutsessions.profileId;
  this.startTime = workoutsessions.startTime;
  this.endTime = workoutsessions.endTime;
  this.totalDuration = workoutsessions.totalDuration;
  this.status = workoutsessions.status;
};

Workoutsessions.getById = (workoutSessionId, callback) => {
  const sqlString = "SELECT * FROM `workoutsessions` WHERE `workoutSessionId` = ?";
  db.query(sqlString, [workoutSessionId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Workoutsessions.getAll = (callback) => {
  const sqlString = "SELECT * FROM `workoutsessions`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Workoutsessions.insert = (workoutsessions, callback) => {
  const sqlString = "INSERT INTO `workoutsessions` SET ?";
  db.query(sqlString, workoutsessions, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { workoutSessionId: res.insertId, ...workoutsessions });
  });
};

Workoutsessions.update = (workoutsessions, workoutSessionId, callback) => {
  const sqlString = "UPDATE `workoutsessions` SET ? WHERE `workoutSessionId` = ?";
  db.query(sqlString, [workoutsessions, workoutSessionId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật workoutsessions thành công" });
  });
};

Workoutsessions.delete = (workoutSessionId, callback) => {
  db.query("DELETE FROM `workoutsessions` WHERE `workoutSessionId` = ?", [workoutSessionId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Xóa workoutsessions thành công" });
  });
};

module.exports = Workoutsessions;

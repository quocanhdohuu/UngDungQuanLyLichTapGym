const db = require("../config/db");

const Workoutplans = (workoutplans) => {
  this.planId = workoutplans.planId;
  this.title = workoutplans.title;
  this.description = workoutplans.description;
  this.creatorId = workoutplans.creatorId;
  this.isTemplate = workoutplans.isTemplate;
  this.level = workoutplans.level;
  this.createdAt = workoutplans.createdAt;
};

Workoutplans.getById = (planId, callback) => {
  const sqlString = "SELECT * FROM `workoutplans` WHERE `planId` = ?";
  db.query(sqlString, [planId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Workoutplans.getAll = (callback) => {
  const sqlString = "SELECT * FROM `workoutplans`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Workoutplans.insert = (workoutplans, callback) => {
  const sqlString = "INSERT INTO `workoutplans` SET ?";
  db.query(sqlString, workoutplans, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { planId: res.insertId, ...workoutplans });
  });
};

Workoutplans.update = (workoutplans, planId, callback) => {
  const sqlString = "UPDATE `workoutplans` SET ? WHERE `planId` = ?";
  db.query(sqlString, [workoutplans, planId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật workoutplans thành công" });
  });
};

Workoutplans.delete = (planId, callback) => {
  db.query(
    "DELETE FROM `workoutplans` WHERE `planId` = ?",
    [planId],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, { message: "Xóa workoutplans thành công" });
    },
  );
};

module.exports = Workoutplans;

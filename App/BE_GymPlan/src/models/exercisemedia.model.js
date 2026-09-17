const db = require("../common/db");

const Exercisemedia = (exercisemedia) => {
  this.mediaId = exercisemedia.mediaId;
  this.exerciseId = exercisemedia.exerciseId;
  this.mediaUrl = exercisemedia.mediaUrl;
  this.publicId = exercisemedia.publicId;
  this.mediaType = exercisemedia.mediaType;
  this.sortOrder = exercisemedia.sortOrder;
  this.createdAt = exercisemedia.createdAt;
};

Exercisemedia.getById = (mediaId, callback) => {
  const sqlString = "SELECT * FROM `exercisemedia` WHERE `mediaId` = ?";
  db.query(sqlString, [mediaId], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exercisemedia.getAll = (callback) => {
  const sqlString = "SELECT * FROM `exercisemedia`";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

Exercisemedia.insert = (exercisemedia, callback) => {
  const sqlString = "INSERT INTO `exercisemedia` SET ?";
  db.query(sqlString, exercisemedia, (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { mediaId: res.insertId, ...exercisemedia });
  });
};

Exercisemedia.update = (exercisemedia, mediaId, callback) => {
  const sqlString = "UPDATE `exercisemedia` SET ? WHERE `mediaId` = ?";
  db.query(sqlString, [exercisemedia, mediaId], (err, res) => {
    if (err) {
      return callback(err);
    }
    callback(null, { message: "Cập nhật exercisemedia thành công" });
  });
};

Exercisemedia.delete = (mediaId, callback) => {
  db.query(
    "DELETE FROM `exercisemedia` WHERE `mediaId` = ?",
    [mediaId],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, { message: "Xóa exercisemedia thành công" });
    },
  );
};

module.exports = Exercisemedia;

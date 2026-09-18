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
  const sqlString = "CALL sp_GetAllGymUsers()";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(
      null,
      (result?.[0] || []).filter(
        (item) => Number(item.profileId) === Number(profileId),
      ),
    );
  });
};

Gymusers.getAll = (callback) => {
  const sqlString = "CALL sp_GetAllGymUsers()";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, Array.isArray(result) ? result[0] : result);
  });
};

Gymusers.insert = (gymusers, callback) => {
  const sqlString = "CALL sp_AddGymUser(?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(
    sqlString,
    [
      gymusers.username,
      gymusers.email,
      gymusers.password,
      gymusers.fullName,
      gymusers.gender,
      gymusers.level,
      gymusers.goal,
      gymusers.sessionsPerWeek,
    ],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, res?.[0]?.[0] || null);
    },
  );
};

Gymusers.update = (gymusers, profileId, callback) => {
  const sqlString = "CALL sp_UpdateGymUser(?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(
    sqlString,
    [
      profileId,
      gymusers.username,
      gymusers.email,
      gymusers.fullName,
      gymusers.gender,
      gymusers.level,
      gymusers.goal,
      gymusers.sessionsPerWeek,
      gymusers.status,
    ],
    (err, res) => {
      if (err) {
        return callback(err);
      }
      callback(null, res?.[0]?.[0] || null);
    },
  );
};

module.exports = Gymusers;

const db = require("../config/db");

const getProcedureError = (error) => {
  if (error && error.sqlMessage) {
    const procedureError = new Error(error.sqlMessage);
    procedureError.statusCode = 401;
    return procedureError;
  }

  return error;
};

const getResultRow = (result) => {
  const rows = result?.[0]?.[0];
  return rows || null;
};

const Auth = {
  login: (email, password, callback) => {
    db.query("CALL sp_Login(?, ?)", [email, password], (error, result) => {
      if (error) {
        return callback(getProcedureError(error));
      }

      callback(null, getResultRow(result));
    });
  },

  logout: (accountId, loginSessionId, callback) => {
    db.query(
      "CALL sp_Logout(?, ?)",
      [accountId, loginSessionId],
      (error, result) => {
        if (error) {
          return callback(getProcedureError(error));
        }

        callback(null, getResultRow(result));
      },
    );
  },
};

module.exports = Auth;

const db = require("../common/db");

const Dashboard = {
  getSummary: async () => {
    const [result] = await db.promise().query("CALL sp_GetDashboardSummary()");
    return result[0]?.[0] || null;
  },

  getUserGrowth: async (months = 6) => {
    const [result] = await db
      .promise()
      .query("CALL sp_GetDashboardUserGrowth(?)", [months]);
    return result[0] || [];
  },

  getWorkoutActivity: async () => {
    try {
      const [result] = await db
        .promise()
        .query("CALL sp_GetDashboardWorkoutActivity()");
      return result[0] || [];
    } catch (error) {
      const message = error?.sqlMessage || error?.message || "";
      if (/doesn't exist|not exist|routine.*not found/i.test(message)) {
        return [];
      }
      throw error;
    }
  },

  getExerciseStatistics: async () => {
    const [result] = await db
      .promise()
      .query("CALL sp_GetDashboardExerciseStatistics()");
    return result[0] || [];
  },

  getRecentUsers: async (limit = 5) => {
    const [result] = await db
      .promise()
      .query("CALL sp_GetDashboardRecentUsers(?)", [limit]);
    return result[0] || [];
  },

  getRecentWorkoutTemplates: async (limit = 5) => {
    const [result] = await db
      .promise()
      .query("CALL sp_GetDashboardRecentWorkoutTemplates(?)", [limit]);
    return result[0] || [];
  },
};

module.exports = Dashboard;

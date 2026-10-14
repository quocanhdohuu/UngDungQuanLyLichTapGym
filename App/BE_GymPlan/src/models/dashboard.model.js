const db = require("../common/db");
const { resolveDateRange } = require("../utils/dashboardDateRange");

const Dashboard = {
  getSummary: async (period = resolveDateRange()) => {
    const [result] = await db.promise().query("CALL sp_GetDashboardSummary(?, ?)", [period.startDate, period.endDate]);
    return result[0]?.[0] || null;
  },

  getUserGrowth: async (period = resolveDateRange()) => {
    const [result] = await db
      .promise()
      .query("CALL sp_GetDashboardUserGrowth(?, ?, ?)", [period.startDate, period.endDate, period.groupBy]);
    return result[0] || [];
  },

  getWorkoutActivity: async (period = resolveDateRange()) => {
    const [result] = await db.promise().query("CALL sp_GetDashboardWorkoutActivity(?, ?)", [period.startDate, period.endDate]);
    return result[0] || [];
  },

  getExerciseStatistics: async () => {
    const [result] = await db
      .promise()
      .query("CALL sp_GetDashboardExerciseStatistics()");
    return result[0] || [];
  },

  getRecentUsers: async (limit = 5, period = resolveDateRange()) => {
    const [result] = await db
      .promise()
      .query("CALL sp_GetDashboardRecentUsers(?, ?, ?)", [limit, period.startDate, period.endDate]);
    return result[0] || [];
  },

  getRecentWorkoutTemplates: async (limit = 5, period = resolveDateRange()) => {
    const [result] = await db
      .promise()
      .query("CALL sp_GetDashboardRecentWorkoutTemplates(?, ?, ?)", [limit, period.startDate, period.endDate]);
    return result[0] || [];
  },
};

module.exports = Dashboard;

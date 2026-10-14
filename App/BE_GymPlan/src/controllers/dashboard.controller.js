const Dashboard = require("../models/dashboard.model");
const { resolveDateRange, fillUserGrowth } = require("../utils/dashboardDateRange");

const getErrorMessage = (error) => error?.sqlMessage || error?.message;

const DashboardController = {
  getSummary: async (req, res) => {
    try {
      const period = resolveDateRange(req.query);
      const result = await Dashboard.getSummary(period);
      return res.json({
        message: "Lấy dữ liệu tổng quan thành công",
        data: result,
        period,
      });
    } catch (error) {
      return res.status(error.status === 400 ? 400 : 500).json({
        message: getErrorMessage(error) || "Không thể tải dữ liệu tổng quan",
      });
    }
  },

  getUserGrowth: async (req, res) => {
    try {
      const period = resolveDateRange(req.query);
      const result = fillUserGrowth(await Dashboard.getUserGrowth(period), period);
      return res.json({
        message: "Lấy dữ liệu tăng trưởng người dùng thành công",
        data: result,
        period,
      });
    } catch (error) {
      return res.status(error.status === 400 ? 400 : 500).json({
        message: getErrorMessage(error) || "Không thể tải dữ liệu tăng trưởng",
      });
    }
  },

  getWorkoutActivity: async (req, res) => {
    try {
      const period = resolveDateRange(req.query);
      const result = await Dashboard.getWorkoutActivity(period);
      return res.json({
        message: "Lấy dữ liệu hoạt động tập luyện thành công",
        data: result,
        period,
      });
    } catch (error) {
      return res.status(error.status === 400 ? 400 : 500).json({
        message:
          getErrorMessage(error) || "Không thể tải dữ liệu hoạt động tập luyện",
      });
    }
  },

  getExerciseStatistics: async (req, res) => {
    try {
      const result = await Dashboard.getExerciseStatistics();
      return res.json({
        message: "Lấy dữ liệu thống kê bài tập thành công",
        data: result,
      });
    } catch (error) {
      return res.status(error.status === 400 ? 400 : 500).json({
        message: getErrorMessage(error) || "Không thể tải thống kê bài tập",
      });
    }
  },

  getRecentUsers: async (req, res) => {
    const limit = Number(req.query.limit || 5);
    if (!Number.isInteger(limit) || limit <= 0 || limit > 2147483647) {
      return res.status(400).json({ message: "limit không hợp lệ" });
    }

    try {
      const period = resolveDateRange(req.query);
      const result = await Dashboard.getRecentUsers(limit, period);
      return res.json({
        message: "Lấy dữ liệu người dùng mới thành công",
        data: result,
        period,
      });
    } catch (error) {
      return res.status(error.status === 400 ? 400 : 500).json({
        message: getErrorMessage(error) || "Không thể tải người dùng mới",
      });
    }
  },

  getRecentWorkoutTemplates: async (req, res) => {
    const limit = req.query.limit == null || req.query.limit === ""
      ? null : Number(req.query.limit);
    if (limit !== null && (!Number.isInteger(limit) || limit < -2147483648 || limit > 2147483647)) {
      return res.status(400).json({ message: "limit không hợp lệ" });
    }

    try {
      const period = resolveDateRange(req.query);
      const result = await Dashboard.getRecentWorkoutTemplates(limit, period);
      return res.json({
        message: "Lấy dữ liệu lịch tập mẫu gần đây thành công",
        data: result,
        period,
      });
    } catch (error) {
      return res.status(error.status === 400 ? 400 : 500).json({
        message: getErrorMessage(error) || "Không thể tải lịch tập mẫu gần đây",
      });
    }
  },
};

module.exports = DashboardController;

const Gymusers = require("../models/gymusers.model");

const DEFAULT_USER_PASSWORD = "123456";

const GymusersController = {
  getAll: (req, res) => {
    Gymusers.getAll((err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Lỗi khi lấy dữ liệu",
          error: err,
        });
      }
      res.json(result);
    });
  },

  getById: (req, res) => {
    const id = req.params.profileId;

    Gymusers.getById(id, (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Lỗi khi lấy dữ liệu",
          error: err,
        });
      }

      if (!result || result.length === 0) {
        return res.status(404).json({
          message: "Không tìm thấy dữ liệu",
        });
      }

      res.json(result[0]);
    });
  },

  create: (req, res) => {
    const data = { ...req.body };

    data.password = data.password || DEFAULT_USER_PASSWORD;

    if (!data.username || !data.email || !data.fullName) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc" });
    }

    if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    if (
      data.sessionsPerWeek != null &&
      (Number(data.sessionsPerWeek) < 0 || Number(data.sessionsPerWeek) > 7)
    ) {
      return res
        .status(400)
        .json({ message: "Số buổi tập mỗi tuần phải từ 0 đến 7" });
    }

    Gymusers.insert(data, (err, result) => {
      if (err) {
        return res.status(err.sqlMessage ? 400 : 500).json({
          message: err.sqlMessage || "Thêm dữ liệu thất bại",
        });
      }

      res.status(201).json({
        message: "Thêm dữ liệu thành công",
        data: result,
      });
    });
  },

  update: (req, res) => {
    const id = req.params.profileId;
    const data = req.body;

    Gymusers.update(data, id, (err, result) => {
      if (err) {
        return res.status(err.sqlMessage ? 400 : 500).json({
          message: err.sqlMessage || "Cập nhật thất bại",
        });
      }

      res.json({
        message: "Cập nhật thành công",
        data: result,
      });
    });
  },
};

module.exports = GymusersController;

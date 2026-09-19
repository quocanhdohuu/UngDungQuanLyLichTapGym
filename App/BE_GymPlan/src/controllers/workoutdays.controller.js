const Workoutdays = require("../models/workoutdays.model");

const getErrorMessage = (error) => error.sqlMessage || error.message;
const isPositiveId = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;
const validateDayName = (body) =>
  typeof body?.dayName === "string" && body.dayName.trim()
    ? null
    : "Tên ngày tập không được để trống";

const WorkoutdaysController = {
  addWithProcedure: async (req, res) => {
    if (!isPositiveId(req.params.planId))
      return res.status(400).json({ message: "planId không hợp lệ" });
    const validationError = validateDayName(req.body);
    if (validationError)
      return res.status(400).json({ message: validationError });
    try {
      const result = await Workoutdays.addWithProcedure(
        Number(req.params.planId),
        req.body.dayName.trim(),
      );
      return res
        .status(201)
        .json({
          message: result?.message || "Thêm ngày tập thành công",
          data: result,
        });
    } catch (error) {
      return res
        .status(500)
        .json({ message: getErrorMessage(error) || "Thêm ngày tập thất bại" });
    }
  },

  updateWithProcedure: async (req, res) => {
    if (!isPositiveId(req.params.dayId))
      return res.status(400).json({ message: "dayId không hợp lệ" });
    const validationError = validateDayName(req.body);
    if (validationError)
      return res.status(400).json({ message: validationError });
    try {
      const result = await Workoutdays.updateWithProcedure(
        Number(req.params.dayId),
        req.body.dayName.trim(),
      );
      return res.json({
        message: result?.message || "Cập nhật ngày tập thành công",
        data: result,
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          message: getErrorMessage(error) || "Cập nhật ngày tập thất bại",
        });
    }
  },

  getAll: (req, res) => {
    Workoutdays.getAll((err, result) => {
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
    const id = req.params.dayId;

    Workoutdays.getById(id, (err, result) => {
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
    const data = req.body;

    Workoutdays.insert(data, (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Thêm dữ liệu thất bại",
          error: err,
        });
      }

      res.status(201).json({
        message: "Thêm dữ liệu thành công",
        data: result,
      });
    });
  },

  update: (req, res) => {
    const id = req.params.dayId;
    const data = req.body;

    Workoutdays.update(data, id, (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Cập nhật thất bại",
          error: err,
        });
      }

      res.json({
        message: "Cập nhật thành công",
        data: result,
      });
    });
  },

  delete: (req, res) => {
    const id = req.params.dayId;

    Workoutdays.delete(id, (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Xóa thất bại",
          error: err,
        });
      }

      res.json({
        message: "Xóa thành công",
        data: result,
      });
    });
  },
};

module.exports = WorkoutdaysController;

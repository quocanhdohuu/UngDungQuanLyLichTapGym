const Exerciseconfigs = require("../models/exerciseconfigs.model");

const getErrorMessage = (error) => error.sqlMessage || error.message;
const isPositiveId = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;
const validateConfig = (body) => {
  const values = ["sets", "reps", "restTime"].map((key) => Number(body?.[key]));
  if (
    !values.every(Number.isInteger) ||
    values[0] <= 0 ||
    values[1] <= 0 ||
    values[2] < 0
  )
    return "Sets/Reps phải lớn hơn 0 và Rest Time không âm";
  return null;
};

const ExerciseconfigsController = {
  addWithProcedure: async (req, res) => {
    if (!isPositiveId(req.params.dayId) || !isPositiveId(req.body?.exerciseId))
      return res
        .status(400)
        .json({ message: "dayId hoặc exerciseId không hợp lệ" });
    const validationError = validateConfig(req.body);
    if (validationError)
      return res.status(400).json({ message: validationError });
    try {
      const result = await Exerciseconfigs.addWithProcedure(
        Number(req.params.dayId),
        Number(req.body.exerciseId),
        Number(req.body.sets),
        Number(req.body.reps),
        Number(req.body.restTime),
      );
      return res
        .status(201)
        .json({
          message: result?.message || "Thêm bài tập thành công",
          data: result,
        });
    } catch (error) {
      return res
        .status(500)
        .json({ message: getErrorMessage(error) || "Thêm bài tập thất bại" });
    }
  },

  updateWithProcedure: async (req, res) => {
    if (!isPositiveId(req.params.configId))
      return res.status(400).json({ message: "configId không hợp lệ" });
    const validationError = validateConfig(req.body);
    if (validationError)
      return res.status(400).json({ message: validationError });
    try {
      const result = await Exerciseconfigs.updateWithProcedure(
        Number(req.params.configId),
        Number(req.body.sets),
        Number(req.body.reps),
        Number(req.body.restTime),
      );
      return res.json({
        message: result?.message || "Cập nhật cấu hình thành công",
        data: result,
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          message: getErrorMessage(error) || "Cập nhật cấu hình thất bại",
        });
    }
  },

  getAll: (req, res) => {
    Exerciseconfigs.getAll((err, result) => {
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
    const id = req.params.configId;

    Exerciseconfigs.getById(id, (err, result) => {
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

    Exerciseconfigs.insert(data, (err, result) => {
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
    const id = req.params.configId;
    const data = req.body;

    Exerciseconfigs.update(data, id, (err, result) => {
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
    const id = req.params.configId;

    Exerciseconfigs.delete(id, (err, result) => {
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

module.exports = ExerciseconfigsController;

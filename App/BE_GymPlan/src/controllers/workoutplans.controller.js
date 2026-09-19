const Workoutplans = require("../models/workoutplans.model");

const DEFAULT_ADMIN_ID = 2;
const getErrorMessage = (error) => error.sqlMessage || error.message;
const isPositiveId = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;
const validLevels = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
const validatePlan = (body, includeCreator = false) => {
  if (!body || typeof body.title !== "string" || !body.title.trim())
    return "Tên chương trình không được để trống";
  if (!validLevels.has(body.level)) return "Trình độ không hợp lệ";
  if (
    includeCreator &&
    body.creatorId !== undefined &&
    !isPositiveId(body.creatorId)
  )
    return "creatorId không hợp lệ";
  if (typeof body.isTemplate !== "boolean") return "isTemplate phải là boolean";
  return null;
};

const WorkoutplansController = {
  getTemplates: async (req, res) => {
    try {
      return res.json(await Workoutplans.getTemplates());
    } catch (error) {
      return res.status(500).json({
        message: "Không thể tải thư viện giáo án",
        error: getErrorMessage(error),
      });
    }
  },

  getDetail: async (req, res) => {
    if (!isPositiveId(req.params.planId))
      return res.status(400).json({ message: "planId không hợp lệ" });
    try {
      const result = await Workoutplans.getDetail(Number(req.params.planId));
      if (!result)
        return res.status(404).json({ message: "Chương trình không tồn tại" });
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        message: "Không thể tải chi tiết giáo án",
        error: getErrorMessage(error),
      });
    }
  },

  createWithProcedure: async (req, res) => {
    const validationError = validatePlan(req.body, true);
    if (validationError)
      return res.status(400).json({ message: validationError });
    try {
      const data = {
        ...req.body,
        creatorId: Number(req.body.creatorId || DEFAULT_ADMIN_ID),
        title: req.body.title.trim(),
        description: req.body.description ?? null,
      };
      const result = await Workoutplans.createWithProcedure(data);
      return res.status(201).json({
        message: result?.message || "Tạo chương trình thành công",
        data: result,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        message: getErrorMessage(error) || "Tạo chương trình thất bại",
      });
    }
  },

  updateWithProcedure: async (req, res) => {
    if (!isPositiveId(req.params.planId))
      return res.status(400).json({ message: "planId không hợp lệ" });
    const validationError = validatePlan(req.body);
    if (validationError)
      return res.status(400).json({ message: validationError });
    try {
      const data = {
        ...req.body,
        title: req.body.title.trim(),
        description: req.body.description ?? null,
      };
      const result = await Workoutplans.updateWithProcedure(
        Number(req.params.planId),
        data,
      );
      return res.json({
        message: result?.message || "Cập nhật chương trình thành công",
        data: result,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        message: getErrorMessage(error) || "Cập nhật chương trình thất bại",
      });
    }
  },

  getAll: (req, res) => {
    Workoutplans.getAll((err, result) => {
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
    const id = req.params.planId;

    Workoutplans.getById(id, (err, result) => {
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

    Workoutplans.insert(data, (err, result) => {
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
    const id = req.params.planId;
    const data = req.body;

    Workoutplans.update(data, id, (err, result) => {
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
    const id = req.params.planId;

    Workoutplans.delete(id, (err, result) => {
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

module.exports = WorkoutplansController;

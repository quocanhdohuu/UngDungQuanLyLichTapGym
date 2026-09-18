const Exercises = require("../models/exercises.model");
const db = require("../common/db");
const { deleteMedia } = require("../services/cloudinaryService");

const VALID_DIFFICULTIES = new Set(["EASY", "MEDIUM", "HARD"]);
const VALID_ROLES = new Set(["PRIMARY", "SECONDARY"]);
const VALID_MEDIA_TYPES = new Set(["IMAGE", "VIDEO"]);

const normalizePayload = (body) => ({
  name: typeof body.name === "string" ? body.name.trim() : body.name,
  description: body.description ?? null,
  difficulty:
    typeof body.difficulty === "string"
      ? body.difficulty.toUpperCase()
      : body.difficulty,
  muscleGroups: Array.isArray(body.muscleGroups) ? body.muscleGroups : [],
  equipmentIds: Array.isArray(body.equipmentIds) ? body.equipmentIds : [],
  media: Array.isArray(body.media) ? body.media : [],
});

const validatePayload = async (payload) => {
  if (!payload.name) return "Tên bài tập không được để trống";
  if (!VALID_DIFFICULTIES.has(payload.difficulty)) return "Độ khó không hợp lệ";

  const primaryGroups = payload.muscleGroups.filter(
    (item) => item.role === "PRIMARY",
  );
  if (primaryGroups.length === 0) return "Phải có ít nhất một nhóm cơ chính";

  const groupIds = payload.muscleGroups.map((item) => Number(item.groupId));
  if (
    groupIds.some((groupId) => !Number.isInteger(groupId) || groupId <= 0) ||
    new Set(groupIds).size !== groupIds.length ||
    payload.muscleGroups.some((item) => !VALID_ROLES.has(item.role))
  ) {
    return "Nhóm cơ không hợp lệ hoặc bị trùng";
  }

  const primaryIds = new Set(primaryGroups.map((item) => Number(item.groupId)));
  if (
    payload.muscleGroups.some(
      (item) =>
        item.role === "SECONDARY" && primaryIds.has(Number(item.groupId)),
    )
  ) {
    return "Một nhóm cơ không thể vừa là chính vừa là phụ";
  }

  const equipmentIds = payload.equipmentIds.map(Number);
  if (
    equipmentIds.some((id) => !Number.isInteger(id) || id <= 0) ||
    new Set(equipmentIds).size !== equipmentIds.length
  ) {
    return "Thiết bị không hợp lệ hoặc bị trùng";
  }

  if (
    payload.media.some(
      (item, index) =>
        !item.mediaUrl ||
        !item.publicId ||
        !VALID_MEDIA_TYPES.has(item.mediaType) ||
        !Number.isInteger(Number(item.sortOrder)) ||
        Number(item.sortOrder) !== index + 1,
    )
  ) {
    return "Media không hợp lệ";
  }

  const [groups] = await db
    .promise()
    .query("SELECT groupId FROM `musclegroups` WHERE groupId IN (?)", [
      groupIds,
    ]);
  if (groups.length !== new Set(groupIds).size) return "Nhóm cơ không tồn tại";

  if (equipmentIds.length > 0) {
    const [equipment] = await db
      .promise()
      .query("SELECT equipmentId FROM `equipment` WHERE equipmentId IN (?)", [
        equipmentIds,
      ]);
    if (equipment.length !== new Set(equipmentIds).size)
      return "Thiết bị không tồn tại";
  }

  return null;
};

const ExercisesController = {
  getAll: (req, res) => {
    Exercises.getAll((err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Lỗi khi lấy dữ liệu",
          error: err,
        });
      }
      res.json(result);
    });
  },

  getAllWithSummary: (req, res) => {
    Exercises.getAllWithSummary((err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Lỗi khi lấy dữ liệu summary",
          error: err,
        });
      }
      res.json(result);
    });
  },

  getById: async (req, res) => {
    const id = req.params.exerciseId;

    try {
      const result = await Exercises.getDetailsById(id);
      if (!result)
        return res.status(404).json({ message: "Không tìm thấy dữ liệu" });
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Lỗi khi lấy dữ liệu", error });
    }
  },

  create: async (req, res) => {
    try {
      const data = normalizePayload(req.body);
      const validationError = await validatePayload(data);
      if (validationError)
        return res.status(400).json({ message: validationError });

      const result = await Exercises.createWithProcedure(data);
      return res
        .status(201)
        .json({
          message: result?.message || "Thêm bài tập thành công",
          data: result,
        });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Thêm dữ liệu thất bại", error: error.message });
    }
  },

  update: async (req, res) => {
    const id = req.params.exerciseId;

    try {
      const data = normalizePayload(req.body);
      const validationError = await validatePayload(data);
      if (validationError)
        return res.status(400).json({ message: validationError });

      const existing = await Exercises.getDetailsById(id);
      if (!existing)
        return res.status(404).json({ message: "Bài tập không tồn tại" });

      const result = await Exercises.updateWithProcedure(id, data);
      const retainedPublicIds = new Set(
        data.media.map((item) => item.publicId),
      );
      await Promise.all(
        existing.media
          .filter(
            (item) => item.publicId && !retainedPublicIds.has(item.publicId),
          )
          .map((item) => deleteMedia(item.publicId, item.mediaType)),
      );

      return res.json({
        message: result?.message || "Cập nhật bài tập thành công",
        data: result,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Cập nhật thất bại", error: error.message });
    }
  },

  delete: (req, res) => {
    const id = req.params.exerciseId;

    Exercises.delete(id, (err, result) => {
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

module.exports = ExercisesController;

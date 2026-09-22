const Gymusers = require("../models/gymusers.model");

const DEFAULT_USER_PASSWORD = "123456";

const normalizePayload = (body = {}) => ({
  ...body,
  username: typeof body.username === "string" ? body.username.trim() : body.username,
  email: typeof body.email === "string" ? body.email.trim() : body.email,
  fullName: typeof body.fullName === "string" ? body.fullName.trim() : body.fullName,
  gender: body.gender === "" ? null : body.gender ?? null,
  level: body.level === "" ? null : body.level ?? null,
  goal: body.goal ?? null,
  sessionsPerWeek: body.sessionsPerWeek === "" ? null : body.sessionsPerWeek ?? null,
});

const validatePayload = (data, isCreate) => {
  for (const [field, label, maxLength] of [
    ["username", "Username", 50], ["email", "Email", 100], ["fullName", "Họ tên", 100],
  ]) {
    if (typeof data[field] !== "string" || !data[field]) return `${label} không được để trống`;
    if (data[field].length > maxLength) return `${label} tối đa ${maxLength} ký tự`;
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email)) return "Email không hợp lệ";
  if (isCreate && (typeof data.password !== "string" || !data.password || data.password.length > 255))
    return "Mật khẩu phải có từ 1 đến 255 ký tự";
  if (data.gender !== null && !["MALE", "FEMALE", "OTHER"].includes(data.gender))
    return "Giới tính không hợp lệ";
  if (data.level !== null && !["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(data.level))
    return "Trình độ không hợp lệ";
  if (data.goal !== null && (typeof data.goal !== "string" || data.goal.length > 255))
    return "Mục tiêu tối đa 255 ký tự";
  if (data.sessionsPerWeek !== null &&
      (!Number.isInteger(data.sessionsPerWeek) || data.sessionsPerWeek < 1 || data.sessionsPerWeek > 7))
    return "Số buổi tập mỗi tuần phải là số nguyên từ 1 đến 7";
  if (!isCreate && !["ACTIVE", "LOCKED", "INACTIVE"].includes(data.status))
    return "Trạng thái tài khoản không hợp lệ";
  return null;
};

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
    const data = normalizePayload(req.body);
    // Preserve the existing default for omitted passwords; reject explicitly empty input.
    if (data.password === undefined) data.password = DEFAULT_USER_PASSWORD;
    const validationError = validatePayload(data, true);
    if (validationError) return res.status(400).json({ message: validationError });

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
    if (!Number.isInteger(Number(id)) || Number(id) <= 0)
      return res.status(400).json({ message: "profileId không hợp lệ" });
    const data = normalizePayload(req.body);
    const validationError = validatePayload(data, false);
    if (validationError) return res.status(400).json({ message: validationError });

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

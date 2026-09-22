const User = require("../models/user.model");

const positiveId = (value) => /^\d+$/.test(String(value)) &&
  Number.isSafeInteger(Number(value)) && Number(value) > 0;

const handle = (action) => async (req, res) => {
  if (Object.values(req.params).some((id) => !positiveId(id))) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }
  try {
    const data = await action(req);
    return res.json({ data });
  } catch (error) {
    const status = error.statusCode || (error.sqlState === "45000" ? 400 : 500);
    return res.status(status).json({
      message: status === 500 ? "Không thể tải hoặc lưu dữ liệu. Vui lòng thử lại."
        : error.sqlMessage || error.message,
    });
  }
};

const fail = (message, statusCode = 400) => {
  throw Object.assign(new Error(message), { statusCode });
};

const validateProfile = (body = {}) => {
  const { fullName, gender, level, goal, sessionsPerWeek, height, weight } = body;
  if (typeof fullName !== "string" || !fullName.trim() || fullName.trim().length > 100)
    fail("Họ tên phải có từ 1 đến 100 ký tự");
  if (gender != null && !["MALE", "FEMALE", "OTHER"].includes(gender))
    fail("Giới tính không hợp lệ");
  if (!["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(level))
    fail("Trình độ tập luyện không hợp lệ");
  if (goal != null && (typeof goal !== "string" || goal.length > 255))
    fail("Mục tiêu không hợp lệ");
  if (sessionsPerWeek != null &&
    (!Number.isInteger(sessionsPerWeek) || sessionsPerWeek < 1 || sessionsPerWeek > 7))
    fail("Số buổi tập mỗi tuần phải từ 1 đến 7");
  for (const value of [height, weight]) {
    if (value != null && (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 999.99))
      fail("Chiều cao và cân nặng phải lớn hơn 0 và không quá 999.99");
  }
  return {
    fullName: fullName.trim(), gender: gender ?? null, level,
    goal: goal?.trim() || null, sessionsPerWeek: sessionsPerWeek ?? null,
    height: height ?? null, weight: weight ?? null
  };
};

module.exports = {
  getProfile: handle(async (req) => {
    const profile = await User.getProfile(Number(req.params.accountId));
    if (!profile) fail("Chưa có hồ sơ người dùng", 404);
    return profile;
  }),
  updateProfile: handle((req) => User.updateProfile(Number(req.params.profileId), validateProfile(req.body))),
  getActivePlan: handle((req) => User.getActivePlan(Number(req.params.profileId))),
  getTodayWorkout: handle((req) => User.getTodayWorkout(Number(req.params.profileId))),
  getProgressSummary: handle((req) => User.getProgressSummary(Number(req.params.profileId))),
  getPersonalRecords: handle((req) => User.getPersonalRecords(Number(req.params.profileId))),
  getWorkoutHistory: handle((req) => {
    const period = req.query.period ?? "ALL";
    if (!["ALL", "WEEK", "MONTH"].includes(period)) fail("period phải là ALL, WEEK hoặc MONTH");
    return User.getWorkoutHistory(Number(req.params.profileId), period);
  }),
  getWorkoutDetail: handle(async (req) => {
    const detail = await User.getWorkoutDetail(Number(req.params.profileId), Number(req.params.workoutSessionId));
    if (!detail) fail("Không tìm thấy buổi tập", 404);
    return detail;
  }),
};

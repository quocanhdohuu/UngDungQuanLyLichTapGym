const User = require("../models/user.model");

const positiveId = (value) => /^\d+$/.test(String(value)) &&
  Number.isSafeInteger(Number(value)) && Number(value) > 0;

const handle = (action) => async (req, res) => {
  if (Object.values(req.params).some((id) => !positiveId(id))) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }
  try {
    req.body ||= {};
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

const numeric = (value, min, max, label) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)
    fail(`${label} phải từ ${min} đến ${max}`);
};
const integer = (value, min, max, label) => {
  numeric(value, min, max, label);
  if (!Number.isInteger(value)) fail(`${label} phải là số nguyên`);
};
const validateSet = (weight, reps) => {
  numeric(weight, 0, 9999.99, "Khối lượng");
  integer(reps, 1, 10000, "Số lần lặp");
};
const validatePlan = (body) => {
  if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 150) fail("Tên lịch phải có 1–150 ký tự");
  if (body.description != null && (typeof body.description !== "string" || body.description.length > 5000)) fail("Mô tả không hợp lệ");
  if (!["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(body.level)) fail("Trình độ không hợp lệ");
  integer(body.durationWeeks, 1, 104, "Số tuần");
  if (!Array.isArray(body.days) || !body.days.length || body.days.length > 7) fail("Lịch cần có 1–7 ngày tập");
  const weekdays = new Set();
  for (const day of body.days) {
    if (!day || typeof day.dayName !== "string" || !day.dayName.trim() || day.dayName.length > 100) fail("Tên ngày tập không hợp lệ");
    integer(day.weekDay, 1, 7, "Thứ trong tuần");
    if (weekdays.has(day.weekDay)) fail("Các ngày tập không được trùng thứ");
    weekdays.add(day.weekDay);
    if (!Array.isArray(day.exercises) || !day.exercises.length || day.exercises.length > 30) fail("Mỗi ngày cần 1–30 bài tập");
    const exercises = new Set();
    for (const exercise of day.exercises) {
      if (!exercise || !positiveId(exercise.exerciseId) || exercises.has(Number(exercise.exerciseId))) fail("Bài tập không hợp lệ hoặc trùng lặp");
      exercises.add(Number(exercise.exerciseId));
      integer(exercise.sets, 1, 100, "Số hiệp");
      integer(exercise.reps, 1, 1000, "Số lần lặp");
      integer(exercise.restTime, 0, 3600, "Thời gian nghỉ");
    }
  }
  return { ...body, title: body.title.trim(), description: body.description || null };
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
  getActiveSession: handle((req) => User.getActiveSession(Number(req.params.profileId))),
  createCustomPlan: handle((req) => User.createCustomPlan(Number(req.params.profileId), validatePlan(req.body))),
  applyPlan: handle((req) => {
    if (!positiveId(req.body.planId)) fail("planId không hợp lệ");
    return User.applyPlan(Number(req.params.profileId), Number(req.body.planId));
  }),
  startWorkoutSession: handle((req) => {
    if (req.body.dayId != null && !positiveId(req.body.dayId)) fail("dayId không hợp lệ");
    return User.startWorkoutSession(Number(req.params.profileId), req.body.dayId == null ? null : Number(req.body.dayId));
  }),
  addPerformedExercise: handle((req) => {
    if (!positiveId(req.body.exerciseId)) fail("exerciseId không hợp lệ");
    const originalExerciseId = req.body.originalExerciseId != null ? Number(req.body.originalExerciseId) : null;
    if (originalExerciseId != null && !positiveId(originalExerciseId)) fail("originalExerciseId không hợp lệ");
    return User.addPerformedExercise(
      Number(req.params.profileId),
      Number(req.params.workoutSessionId),
      Number(req.body.exerciseId),
      originalExerciseId,
    );
  }),
  addExerciseSet: handle((req) => {
    const { setNumber, weight, reps, preValue = null } = req.body;
    integer(setNumber, 1, 1000, "Số hiệp");
    validateSet(weight, reps);
    if (preValue != null) numeric(preValue, 0, 9999.99, "Thành tích trước");
    return User.addExerciseSet(Number(req.params.profileId), Number(req.params.performedExerciseId), setNumber, weight, reps, preValue);
  }),
  updateExerciseSet: handle((req) => {
    validateSet(req.body.weight, req.body.reps);
    return User.updateExerciseSet(Number(req.params.profileId), Number(req.params.setId), req.body.weight, req.body.reps);
  }),
  deleteExerciseSet: handle((req) => User.deleteExerciseSet(Number(req.params.profileId), Number(req.params.setId))),
  completePerformedExercise: handle((req) => User.completePerformedExercise(Number(req.params.profileId), Number(req.params.performedExerciseId))),
  // Duration is measured by the server in minutes, never trusted from the client.
  completeWorkoutSession: handle((req) => User.completeWorkoutSession(Number(req.params.profileId), Number(req.params.workoutSessionId), null)),
  cancelWorkoutSession: handle((req) => User.cancelWorkoutSession(Number(req.params.profileId), Number(req.params.workoutSessionId))),
  getPreviousPerformance: handle((req) =>
    User.getPreviousPerformance(Number(req.params.profileId), Number(req.params.exerciseId)),
  ),
  getExerciseAlternatives: handle((req) => {
    if (!positiveId(req.params.exerciseId)) fail("exerciseId không hợp lệ");
    return User.getExerciseAlternatives(Number(req.params.exerciseId));
  }),
  changePassword: handle(async (req) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (typeof oldPassword !== "string" || typeof newPassword !== "string" || !oldPassword || !newPassword) fail("Vui lòng nhập mật khẩu cũ và mật khẩu mới");
    if (newPassword.length < 6 || newPassword.length > 255) fail("Mật khẩu mới phải có ít nhất 6 ký tự");
    if (newPassword !== confirmPassword) fail("Mật khẩu xác nhận không khớp");
    return User.changePassword(Number(req.params.accountId), oldPassword, newPassword);
  }),
  getBodyMetrics: handle((req) => User.getBodyMetrics(Number(req.params.profileId))),
};

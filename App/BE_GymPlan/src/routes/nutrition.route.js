const express = require("express");
const multer = require("multer");
const router = express.Router();
const nutritionController = require("../controllers/nutrition.controller");
const { verifyToken } = require("../services/userSessionService");

// Cấu hình Multer lưu ảnh vào Memory Buffer để gửi tiếp sang AI Service hoặc Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Tối đa 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file định dạng hình ảnh (JPEG, PNG, WEBP)."), false);
    }
  },
});

// Middleware xác thực phiên người dùng tùy chọn (Optional Auth)
// Nếu có header Bearer token hợp lệ thì gán req.userSession, nếu không thì cho phép đọc profileId từ body/query
const optionalUserSession = (req, res, next) => {
  const authorization = req.get("Authorization") || "";
  if (authorization.startsWith("Bearer ")) {
    const token = authorization.slice(7);
    const session = verifyToken(token);
    if (session) {
      req.userSession = session;
    }
  }
  next();
};

router.use(optionalUserSession);

// 1. Phân tích ảnh món ăn
router.post("/analyze-image", upload.single("image"), nutritionController.analyzeImage);

// 2. Chốt & lưu nhật ký bữa ăn
router.post("/log-meal", upload.single("image"), nutritionController.logMeal);

// 3. Tìm kiếm danh mục nguyên liệu chuẩn
router.get("/ingredients", nutritionController.searchIngredients);

// 4. Lấy tổng hợp dinh dưỡng trong ngày
router.get("/daily-summary", nutritionController.getDailySummary);

// 5. Lấy chi tiết một bữa ăn
router.get("/meal/:mealLogId", nutritionController.getMealDetail);

// 6. Xóa bữa ăn
router.delete("/meal/:mealLogId", nutritionController.deleteMeal);

module.exports = router;

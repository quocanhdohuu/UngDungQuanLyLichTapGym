const NutritionModel = require("../models/nutrition.model");
const aiNutritionService = require("../services/aiNutritionService");
const cloudinaryService = require("../services/cloudinaryService");

const nutritionController = {
  /**
   * API 1: Phân tích ảnh món ăn từ camera/thư viện ảnh
   * POST /api/nutrition/analyze-image
   */
  analyzeImage: async (req, res) => {
    try {
      let fileBuffer = null;
      let mimetype = "image/jpeg";
      let originalname = "dish.jpg";

      if (req.file) {
        fileBuffer = req.file.buffer;
        mimetype = req.file.mimetype || "image/jpeg";
        originalname = req.file.originalname || "dish.jpg";
      } else if (req.body?.imageBase64 || req.body?.image) {
        const rawBase64 = req.body.imageBase64 || req.body.image;
        const matches = rawBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimetype = matches[1];
          fileBuffer = Buffer.from(matches[2], "base64");
        } else {
          fileBuffer = Buffer.from(rawBase64, "base64");
          mimetype = req.body.mimeType || "image/jpeg";
        }
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({ message: "Vui lòng đính kèm file ảnh suất ăn (field: image hoặc imageBase64)." });
      }

      // 1. Gửi ảnh sang AI Microservice để phân tích
      const aiResult = await aiNutritionService.predictMealFromImage(
        fileBuffer,
        originalname,
        mimetype
      );

      const predictions = aiResult.predictions || [];
      const codes = predictions.map(p => p.code);

      // 2. Tra cứu hệ số dinh dưỡng trong CSDL MySQL
      const dbIngredients = await NutritionModel.getIngredientsByCodes(codes);
      const dbMap = new Map(dbIngredients.map(item => [item.code, item]));

      let totalEstKcal = 0;
      let totalEstProtein = 0;
      let totalEstCarb = 0;
      let totalEstFat = 0;

      // 3. Quy đổi khối lượng gram sang Calo và Macros chi tiết
      const enrichedPredictions = predictions.map(p => {
        const ing = dbMap.get(p.code);
        const estGrams = Number(p.estimated_grams) || (ing ? Number(ing.servingSizeGrams) : 100);

        let kcalPerG = ing ? Number(ing.kcalPerGram) : 1.5;
        let pPerG = ing ? Number(ing.proteinPerGram) : 0.1;
        let cPerG = ing ? Number(ing.carbPerGram) : 0.2;
        let fPerG = ing ? Number(ing.fatPerGram) : 0.05;

        const calculatedKcal = Number((estGrams * kcalPerG).toFixed(1));
        const calculatedProtein = Number((estGrams * pPerG).toFixed(1));
        const calculatedCarb = Number((estGrams * cPerG).toFixed(1));
        const calculatedFat = Number((estGrams * fPerG).toFixed(1));

        totalEstKcal += calculatedKcal;
        totalEstProtein += calculatedProtein;
        totalEstCarb += calculatedCarb;
        totalEstFat += calculatedFat;

        return {
          ingredientId: ing ? ing.ingredientId : null,
          code: p.code,
          nameVi: ing ? ing.nameVi : p.name_vi,
          nameEn: ing ? ing.nameEn : p.name_en,
          category: ing ? ing.category : p.category,
          confidence: Number((p.confidence || 0.85).toFixed(3)),
          estimatedGrams: estGrams,
          servingSizeGrams: ing ? Number(ing.servingSizeGrams) : 100,
          kcalPerGram: kcalPerG,
          proteinPerGram: pPerG,
          carbPerGram: cPerG,
          fatPerGram: fPerG,
          calculatedKcal,
          calculatedProtein,
          calculatedCarb,
          calculatedFat,
        };
      });

      return res.status(200).json({
        status: "success",
        inferenceTimeMs: aiResult.inference_time_ms || 0,
        totalDetected: enrichedPredictions.length,
        summary: {
          totalKcal: Number(totalEstKcal.toFixed(1)),
          totalProtein: Number(totalEstProtein.toFixed(1)),
          totalCarb: Number(totalEstCarb.toFixed(1)),
          totalFat: Number(totalEstFat.toFixed(1)),
        },
        predictions: enrichedPredictions,
      });
    } catch (err) {
      console.error("[nutritionController.analyzeImage] Lỗi:", err);
      return res.status(500).json({ message: "Lỗi phân tích hình ảnh món ăn: " + err.message });
    }
  },

  /**
   * API 2: Chốt và Lưu Bữa Ăn (sau khi user đã kiểm tra và điều chỉnh gram)
   * POST /api/nutrition/log-meal
   */
  logMeal: async (req, res) => {
    try {
      const profileId = req.userSession?.profileId || req.body.profileId;
      if (!profileId) {
        return res.status(400).json({ message: "Thiếu thông tin profileId người dùng." });
      }

      let items = req.body.items;
      if (typeof items === "string") {
        try {
          items = JSON.parse(items);
        } catch {
          return res.status(400).json({ message: "Định dạng danh sách nguyên liệu (items) không hợp lệ." });
        }
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Bữa ăn phải có ít nhất 1 nguyên liệu." });
      }

      let imageUrl = req.body.imageUrl || null;

      // Nếu có gửi kèm file ảnh trực tiếp thì upload lên Cloudinary
      if (req.file) {
        try {
          const uploadResult = await cloudinaryService.uploadMedia(req.file.buffer, req.file.mimetype);
          imageUrl = uploadResult.secure_url;
        } catch (uploadErr) {
          console.warn("[nutritionController.logMeal] Upload Cloudinary thất bại, tiếp tục lưu không ảnh:", uploadErr.message);
        }
      }

      const mealData = {
        profileId: Number(profileId),
        mealType: req.body.mealType || "LUNCH",
        mealDate: req.body.mealDate || new Date().toISOString().slice(0, 10),
        imageUrl,
        note: req.body.note || null,
        items,
      };

      const savedMeal = await NutritionModel.createMealLog(mealData);

      return res.status(201).json({
        status: "success",
        message: "Lưu bữa ăn thành công!",
        data: savedMeal,
      });
    } catch (err) {
      console.error("[nutritionController.logMeal] Lỗi:", err);
      return res.status(500).json({ message: "Lỗi lưu nhật ký bữa ăn: " + err.message });
    }
  },

  /**
   * API 3: Lấy tổng hợp dinh dưỡng và danh sách bữa ăn theo ngày
   * GET /api/nutrition/daily-summary?date=YYYY-MM-DD&profileId=...
   */
  getDailySummary: async (req, res) => {
    try {
      const profileId = req.userSession?.profileId || req.query.profileId;
      if (!profileId) {
        return res.status(400).json({ message: "Thiếu thông tin profileId người dùng." });
      }

      const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
      const summaryData = await NutritionModel.getDailySummary(Number(profileId), dateStr);

      return res.status(200).json({
        status: "success",
        data: summaryData,
      });
    } catch (err) {
      console.error("[nutritionController.getDailySummary] Lỗi:", err);
      return res.status(500).json({ message: "Lỗi lấy dữ liệu dinh dưỡng: " + err.message });
    }
  },

  /**
   * API 4: Tìm kiếm danh mục nguyên liệu (phục vụ chọn thêm món thủ công)
   * GET /api/nutrition/ingredients?q=...&category=...
   */
  searchIngredients: async (req, res) => {
    try {
      const keyword = req.query.q || "";
      const category = req.query.category || null;

      const ingredients = await NutritionModel.searchIngredients(keyword, category);

      return res.status(200).json({
        status: "success",
        total: ingredients.length,
        data: ingredients,
      });
    } catch (err) {
      console.error("[nutritionController.searchIngredients] Lỗi:", err);
      return res.status(500).json({ message: "Lỗi tra cứu danh mục nguyên liệu: " + err.message });
    }
  },

  /**
   * API 5: Lấy chi tiết 1 bữa ăn
   * GET /api/nutrition/meal/:mealLogId
   */
  getMealDetail: async (req, res) => {
    try {
      const profileId = req.userSession?.profileId || req.query.profileId;
      const mealLogId = req.params.mealLogId;

      const meal = await NutritionModel.getMealDetail(Number(mealLogId), Number(profileId));
      if (!meal) {
        return res.status(404).json({ message: "Không tìm thấy bữa ăn hoặc bạn không có quyền xem." });
      }

      return res.status(200).json({
        status: "success",
        data: meal,
      });
    } catch (err) {
      console.error("[nutritionController.getMealDetail] Lỗi:", err);
      return res.status(500).json({ message: "Lỗi lấy chi tiết bữa ăn: " + err.message });
    }
  },

  /**
   * API 6: Xóa bữa ăn
   * DELETE /api/nutrition/meal/:mealLogId
   */
  deleteMeal: async (req, res) => {
    try {
      const profileId = req.userSession?.profileId || req.body.profileId || req.query.profileId;
      const mealLogId = req.params.mealLogId;

      const deleted = await NutritionModel.deleteMealLog(Number(mealLogId), Number(profileId));
      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy bữa ăn để xóa." });
      }

      return res.status(200).json({
        status: "success",
        message: "Đã xóa bữa ăn thành công.",
      });
    } catch (err) {
      console.error("[nutritionController.deleteMeal] Lỗi:", err);
      return res.status(500).json({ message: "Lỗi xóa bữa ăn: " + err.message });
    }
  },
};

module.exports = nutritionController;

const AI_SERVICE_URL = process.env.AI_NUTRITION_SERVICE_URL || "http://127.0.0.1:5001";

/**
 * Service giao tiếp với AI Nutrition Inference Service (FastAPI)
 * Sử dụng native fetch và FormData chuẩn của Node.js 18+
 */
const aiNutritionService = {
  /**
   * Gửi file ảnh buffer sang AI Microservice để nhận diện món ăn và ước lượng gram
   */
  predictMealFromImage: async (fileBuffer, filename = "meal.jpg", mimetype = "image/jpeg") => {
    try {
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: mimetype });
      formData.append("file", blob, filename);

      const targetUrl = `${AI_SERVICE_URL}/predict?threshold=0.20&top_k=6`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(targetUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Service phản hồi lỗi [${response.status}]: ${errorText}`);
      }

      return await response.json();
    } catch (err) {
      console.warn("[aiNutritionService] Chuyển hướng sang cơ chế fallback an toàn:", err.message);
      // Fallback an toàn nếu service AI chưa chạy hoặc timeout
      return {
        status: "fallback",
        inference_time_ms: 0,
        total_detected: 2,
        predictions: [
          { code: "white_rice", confidence: 0.88, estimated_grams: 180.0 },
          { code: "chicken_breast", confidence: 0.92, estimated_grams: 150.0 },
        ],
      };
    }
  },

  /**
   * Kiểm tra trạng thái AI Service
   */
  checkHealth: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${AI_SERVICE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
      return { status: "unavailable" };
    } catch {
      return { status: "unavailable" };
    }
  },
};

module.exports = aiNutritionService;

import { API_BASE_URL } from "./api";
import { getAuthSession } from "@/auth-session";

export interface PredictedIngredient {
  ingredientId: number | null;
  code: string;
  nameVi: string;
  nameEn?: string;
  category: "PROTEIN" | "CARB" | "FAT" | "VEG" | "FRUIT" | "DAIRY" | "BEVERAGE" | "OTHER";
  confidence: number;
  estimatedGrams: number;
  servingSizeGrams: number;
  kcalPerGram: number;
  proteinPerGram: number;
  carbPerGram: number;
  fatPerGram: number;
  calculatedKcal: number;
  calculatedProtein: number;
  calculatedCarb: number;
  calculatedFat: number;
}

export interface AnalyzeImageResponse {
  status: string;
  inferenceTimeMs: number;
  totalDetected: number;
  summary: {
    totalKcal: number;
    totalProtein: number;
    totalCarb: number;
    totalFat: number;
  };
  predictions: PredictedIngredient[];
}

export interface MealLogItemPayload {
  ingredientId: number;
  aiConfidence?: number | null;
  aiEstimatedGrams?: number | null;
  userFinalGrams: number;
}

export interface MealLogPayload {
  profileId: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "PRE_WORKOUT" | "POST_WORKOUT";
  mealDate: string; // YYYY-MM-DD
  imageUrl?: string | null;
  note?: string | null;
  items: MealLogItemPayload[];
}

export interface NutritionSummary {
  totalKcal: number;
  totalProtein: number;
  totalCarb: number;
  totalFat: number;
  totalMeals: number;
}

export interface MealDetail {
  mealLogId: number;
  profileId: number;
  mealType: string;
  mealDate: string;
  imageUrl?: string | null;
  totalKcal: number;
  totalProtein: number;
  totalCarb: number;
  totalFat: number;
  note?: string | null;
  createdAt: string;
  items: {
    itemId: number;
    ingredientId: number;
    code: string;
    nameVi: string;
    category: string;
    userFinalGrams: number;
    calculatedKcal: number;
    calculatedProtein: number;
    calculatedCarb: number;
    calculatedFat: number;
  }[];
}

export interface DailySummaryResponse {
  status: string;
  data: {
    date: string;
    summary: NutritionSummary;
    meals: MealDetail[];
  };
}

/**
 * Service API cho phân hệ dinh dưỡng
 */
export const nutritionApi = {
  /**
   * Gửi file ảnh lên backend để phân tích qua AI
   * Hỗ trợ Base64 (tránh lỗi FormDataPart trên iOS/Expo) hoặc FormData
   */
  analyzeImage: async (imageUri: string, base64?: string | null, mimeType = "image/jpeg"): Promise<AnalyzeImageResponse> => {
    const session = getAuthSession();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      let response: Response;

      if (base64) {
        // Gửi qua JSON Base64: 100% an toàn trên mọi thiết bị iOS/Android
        response = await fetch(`${API_BASE_URL}/api/nutrition/analyze-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
          },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType,
          }),
          signal: controller.signal,
        });
      } else {
        const formData = new FormData();
        const filename = imageUri.split("/").pop() || "dish.jpg";
        try {
          const resBlob = await fetch(imageUri);
          const blob = await resBlob.blob();
          formData.append("image", blob, filename);
        } catch {
          formData.append("image", {
            uri: imageUri,
            name: filename,
            type: mimeType,
          } as any);
        }

        response = await fetch(`${API_BASE_URL}/api/nutrition/analyze-image`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
          headers: {
            ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
          },
        });
      }

      clearTimeout(timeout);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Không thể phân tích ảnh món ăn.");
      }
      return payload as AnalyzeImageResponse;
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === "AbortError") {
        throw new Error("Quá thời gian kết nối (Timeout). Vui lòng thử lại.");
      }
      throw error;
    }
  },

  /**
   * Lưu nhật ký bữa ăn
   */
  logMeal: async (payload: MealLogPayload, imageUri?: string): Promise<any> => {
    const session = getAuthSession();
    const headers: Record<string, string> = {
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    };

    if (imageUri) {
      // Gửi dạng multipart nếu có kèm file ảnh trực tiếp
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "dish.jpg";
      formData.append("image", {
        uri: imageUri,
        name: filename,
        type: "image/jpeg",
      } as any);

      formData.append("profileId", String(payload.profileId));
      formData.append("mealType", payload.mealType);
      formData.append("mealDate", payload.mealDate);
      if (payload.note) formData.append("note", payload.note);
      formData.append("items", JSON.stringify(payload.items));

      const response = await fetch(`${API_BASE_URL}/api/nutrition/log-meal`, {
        method: "POST",
        body: formData,
        headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Lỗi lưu bữa ăn");
      return data;
    } else {
      // Gửi JSON thông thường
      headers["Content-Type"] = "application/json";
      const response = await fetch(`${API_BASE_URL}/api/nutrition/log-meal`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Lỗi lưu bữa ăn");
      return data;
    }
  },

  /**
   * Lấy tổng hợp dinh dưỡng trong ngày
   */
  getDailySummary: async (profileId: number, dateStr?: string): Promise<DailySummaryResponse> => {
    const session = getAuthSession();
    const query = new URLSearchParams({
      profileId: String(profileId),
      ...(dateStr ? { date: dateStr } : {}),
    });

    const response = await fetch(`${API_BASE_URL}/api/nutrition/daily-summary?${query.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Lỗi lấy dữ liệu dinh dưỡng");
    return data as DailySummaryResponse;
  },

  /**
   * Tìm kiếm nguyên liệu
   */
  searchIngredients: async (keyword = "", category?: string): Promise<any[]> => {
    const session = getAuthSession();
    const query = new URLSearchParams();
    if (keyword) query.append("q", keyword);
    if (category) query.append("category", category);

    const response = await fetch(`${API_BASE_URL}/api/nutrition/ingredients?${query.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Lỗi tìm kiếm nguyên liệu");
    return data.data || [];
  },

  /**
   * Xóa bữa ăn
   */
  deleteMeal: async (mealLogId: number, profileId: number): Promise<void> => {
    const session = getAuthSession();
    const response = await fetch(`${API_BASE_URL}/api/nutrition/meal/${mealLogId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
      body: JSON.stringify({ profileId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Lỗi xóa bữa ăn");
  },
};

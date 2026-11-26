import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { getAuthSession } from "@/auth-session";
import { nutritionApi, AnalyzeImageResponse } from "@/services/nutrition-api";
import { IngredientSearchModal } from "@/components/nutrition/ingredient-search-modal";

interface EditableMealItem {
  ingredientId: number;
  code: string;
  nameVi: string;
  category: string;
  confidence?: number | null;
  aiEstimatedGrams?: number | null;
  userFinalGrams: number;
  kcalPerGram: number;
  proteinPerGram: number;
  carbPerGram: number;
  fatPerGram: number;
}

const MEAL_TYPES = [
  { id: "BREAKFAST", label: "Bữa sáng" },
  { id: "LUNCH", label: "Bữa trưa" },
  { id: "DINNER", label: "Bữa tối" },
  { id: "SNACK", label: "Bữa phụ" },
  { id: "PRE_WORKOUT", label: "Pre-workout" },
  { id: "POST_WORKOUT", label: "Post-workout" },
] as const;

export default function NutritionReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string; analysisData?: string }>();

  // Giải mã dữ liệu ảnh và kết quả AI truyền từ Camera
  const rawImageUri = params.imageUri ? decodeURIComponent(params.imageUri) : null;
  
  const parsedAnalysis: AnalyzeImageResponse | null = useMemo(() => {
    if (!params.analysisData) return null;
    try {
      return JSON.parse(decodeURIComponent(params.analysisData));
    } catch {
      return null;
    }
  }, [params.analysisData]);

  // Xác định bữa ăn mặc định theo giờ trong ngày
  const defaultMealType = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return "BREAKFAST";
    if (hour >= 10 && hour < 14) return "LUNCH";
    if (hour >= 14 && hour < 17) return "SNACK";
    if (hour >= 17 && hour < 21) return "DINNER";
    return "POST_WORKOUT";
  }, []);

  const [mealType, setMealType] = useState<typeof MEAL_TYPES[number]["id"]>(defaultMealType);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Danh sách các nguyên liệu có thể chỉnh sửa số gram
  const [items, setItems] = useState<EditableMealItem[]>(() => {
    if (!parsedAnalysis?.predictions?.length) return [];
    return parsedAnalysis.predictions.map((p, idx) => ({
      ingredientId: p.ingredientId || (idx + 1),
      code: p.code,
      nameVi: p.nameVi,
      category: p.category,
      confidence: p.confidence,
      aiEstimatedGrams: p.estimatedGrams,
      userFinalGrams: p.estimatedGrams || 100,
      kcalPerGram: p.kcalPerGram,
      proteinPerGram: p.proteinPerGram,
      carbPerGram: p.carbPerGram,
      fatPerGram: p.fatPerGram,
    }));
  });

  // Tính toán Tổng Calo & Macros Real-time mỗi khi user thay đổi gram
  const liveTotals = useMemo(() => {
    let totalKcal = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;

    for (const item of items) {
      const g = item.userFinalGrams || 0;
      totalKcal += g * item.kcalPerGram;
      totalP += g * item.proteinPerGram;
      totalC += g * item.carbPerGram;
      totalF += g * item.fatPerGram;
    }

    return {
      totalKcal: Math.round(totalKcal),
      protein: Math.round(totalP * 10) / 10,
      carb: Math.round(totalC * 10) / 10,
      fat: Math.round(totalF * 10) / 10,
    };
  }, [items]);

  // Cập nhật số gram
  const updateGrams = (index: number, newGrams: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const clamped = Math.max(5, Math.min(2000, newGrams));
      updated[index] = { ...updated[index], userFinalGrams: clamped };
      return updated;
    });
  };

  // Tăng giảm nhanh theo delta
  const adjustGrams = (index: number, delta: number) => {
    const current = items[index].userFinalGrams;
    updateGrams(index, current + delta);
  };

  // Xóa món
  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Thêm món mới từ Modal
  const handleAddIngredient = (ingredient: any, grams: number) => {
    setItems((prev) => [
      ...prev,
      {
        ingredientId: ingredient.ingredientId,
        code: ingredient.code,
        nameVi: ingredient.nameVi,
        category: ingredient.category,
        confidence: null, // Thêm thủ công
        aiEstimatedGrams: null,
        userFinalGrams: grams,
        kcalPerGram: Number(ingredient.kcalPerGram),
        proteinPerGram: Number(ingredient.proteinPerGram),
        carbPerGram: Number(ingredient.carbPerGram),
        fatPerGram: Number(ingredient.fatPerGram),
      },
    ]);
  };

  // Chốt và lưu bữa ăn
  const handleSaveMeal = async () => {
    if (!items.length) {
      Alert.alert("Chưa có món ăn", "Bữa ăn cần ít nhất 1 nguyên liệu để lưu.");
      return;
    }

    const session = getAuthSession();
    const profileId = session?.profileId || 1; // Fallback profile 1 nếu chưa đăng nhập

    setIsSaving(true);
    try {
      const payload = {
        profileId,
        mealType,
        mealDate: new Date().toISOString().slice(0, 10),
        note: note.trim() || undefined,
        items: items.map((it) => ({
          ingredientId: it.ingredientId,
          aiConfidence: it.confidence,
          aiEstimatedGrams: it.aiEstimatedGrams,
          userFinalGrams: it.userFinalGrams,
        })),
      };

      await nutritionApi.logMeal(payload, rawImageUri || undefined);
      setIsSaving(false);

      Alert.alert(
        "🎉 Lưu bữa ăn thành công!",
        `Đã nạp ${liveTotals.totalKcal} kcal vào nhật ký hôm nay.`,
        [
          {
            text: "Xem lịch sử",
            onPress: () => router.replace("/nutrition/history" as any),
          },
          {
            text: "Về trang chủ",
            onPress: () => router.replace("/home"),
          },
        ]
      );
    } catch (error: any) {
      setIsSaving(false);
      Alert.alert("Lỗi lưu bữa ăn", error.message || "Không thể lưu nhật ký bữa ăn.");
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header điều hướng */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <Text style={styles.navBtnText}>← Chụp lại</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Hiệu chỉnh khẩu phần</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Thumbnail ảnh và Chọn loại bữa ăn */}
        <View style={styles.topCard}>
          {rawImageUri && (
            <Image source={{ uri: rawImageUri }} style={styles.mealThumb} contentFit="cover" />
          )}
          <View style={styles.topCardInfo}>
            <Text style={styles.topCardTitle}>Loại bữa ăn</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((type) => {
                const isSelected = mealType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typePill, isSelected && styles.typePillActive]}
                    onPress={() => setMealType(type.id)}
                  >
                    <Text style={[styles.typeText, isSelected && styles.typeTextActive]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Thanh tổng quan Calo & Macros Real-time (Dynamic Macro Bar) */}
        <View style={styles.macroBanner}>
          <View style={styles.calorieBox}>
            <Text style={styles.calorieValue}>{liveTotals.totalKcal}</Text>
            <Text style={styles.calorieUnit}>Tổng Kcal</Text>
          </View>
          <View style={styles.macroPillsRow}>
            <View style={styles.macroPill}>
              <Text style={[styles.macroPillLabel, { color: "#FF5252" }]}>Protein</Text>
              <Text style={styles.macroPillValue}>{liveTotals.protein}g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={[styles.macroPillLabel, { color: "#FFB300" }]}>Carb</Text>
              <Text style={styles.macroPillValue}>{liveTotals.carb}g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={[styles.macroPillLabel, { color: "#00BCD4" }]}>Fat</Text>
              <Text style={styles.macroPillValue}>{liveTotals.fat}g</Text>
            </View>
          </View>
        </View>

        {/* Danh sách thành phần chi tiết */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Thành phần món ăn ({items.length})
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowSearchModal(true)}
          >
            <Text style={styles.addBtnText}>+ Thêm món</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => {
          const itemKcal = Math.round(item.userFinalGrams * item.kcalPerGram);
          const itemP = (item.userFinalGrams * item.proteinPerGram).toFixed(1);
          const itemC = (item.userFinalGrams * item.carbPerGram).toFixed(1);
          const itemF = (item.userFinalGrams * item.fatPerGram).toFixed(1);

          return (
            <View key={`${item.code}-${index}`} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.itemName}>{item.nameVi}</Text>
                  <Text style={styles.itemMacroSub}>
                    {itemKcal} kcal • P: {itemP}g | C: {itemC}g | F: {itemF}g
                  </Text>
                </View>
                {item.confidence && (
                  <View style={styles.aiConfidenceBadge}>
                    <Text style={styles.aiConfidenceText}>
                      AI: {Math.round(item.confidence * 100)}%
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeItem(index)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Bộ điều khiển tăng giảm Gram */}
              <View style={styles.gramsControlRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => adjustGrams(index, -50)}
                >
                  <Text style={styles.stepBtnText}>-50</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => adjustGrams(index, -10)}
                >
                  <Text style={styles.stepBtnText}>-10</Text>
                </TouchableOpacity>

                <View style={styles.gramInputBox}>
                  <TextInput
                    style={styles.gramInput}
                    keyboardType="numeric"
                    value={String(item.userFinalGrams)}
                    onChangeText={(val) => {
                      const num = parseInt(val, 10);
                      updateGrams(index, isNaN(num) ? 0 : num);
                    }}
                  />
                  <Text style={styles.gramUnitText}>g</Text>
                </View>

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => adjustGrams(index, 10)}
                >
                  <Text style={styles.stepBtnText}>+10</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => adjustGrams(index, 50)}
                >
                  <Text style={styles.stepBtnText}>+50</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Ô nhập ghi chú */}
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Ghi chú bữa ăn (tùy chọn):</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Ví dụ: Ăn sau buổi tập ngực, uống kèm 1 cốc whey..."
            placeholderTextColor="#777"
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Nút Chốt & Lưu cố định phía dưới màn hình */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSaveMeal}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              ✓ Chốt & Lưu bữa ăn ({liveTotals.totalKcal} kcal)
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal tìm kiếm thêm nguyên liệu */}
      <IngredientSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelect={handleAddIngredient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 32,
    paddingBottom: 24,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: {
    backgroundColor: "#1E1E1E",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navBtnText: {
    color: "#E0E0E0",
    fontSize: 14,
    fontWeight: "600",
  },
  navTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  topCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  mealThumb: {
    width: 74,
    height: 74,
    borderRadius: 12,
    marginRight: 12,
  },
  topCardInfo: {
    flex: 1,
  },
  topCardTitle: {
    color: "#A0A0A0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  mealTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#2C2C2E",
  },
  typePillActive: {
    backgroundColor: "#FF5722",
  },
  typeText: {
    color: "#AAAAAA",
    fontSize: 12,
    fontWeight: "600",
  },
  typeTextActive: {
    color: "#FFFFFF",
  },
  macroBanner: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  calorieBox: {
    alignItems: "center",
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  calorieValue: {
    color: "#FF5722",
    fontSize: 28,
    fontWeight: "800",
  },
  calorieUnit: {
    color: "#888888",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  macroPillsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingLeft: 8,
  },
  macroPill: {
    alignItems: "center",
  },
  macroPillLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  macroPillValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  addBtn: {
    backgroundColor: "rgba(255, 87, 34, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 87, 34, 0.4)",
  },
  addBtnText: {
    color: "#FF5722",
    fontSize: 13,
    fontWeight: "700",
  },
  itemCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  itemName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  itemMacroSub: {
    color: "#9E9E9E",
    fontSize: 12,
    marginTop: 3,
  },
  aiConfidenceBadge: {
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  aiConfidenceText: {
    color: "#4CAF50",
    fontSize: 11,
    fontWeight: "700",
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2E2E2E",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#AAA",
    fontSize: 14,
    fontWeight: "bold",
  },
  gramsControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#161616",
    borderRadius: 10,
    padding: 6,
  },
  stepBtn: {
    backgroundColor: "#262626",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  stepBtnText: {
    color: "#E0E0E0",
    fontSize: 12,
    fontWeight: "700",
  },
  gramInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202020",
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 34,
  },
  gramInput: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    minWidth: 42,
    textAlign: "center",
    padding: 0,
  },
  gramUnitText: {
    color: "#888",
    fontSize: 13,
    marginLeft: 3,
  },
  noteBox: {
    marginTop: 8,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 12,
  },
  noteLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 6,
  },
  noteInput: {
    color: "#FFF",
    fontSize: 14,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#181818",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  saveButton: {
    backgroundColor: "#FF5722",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

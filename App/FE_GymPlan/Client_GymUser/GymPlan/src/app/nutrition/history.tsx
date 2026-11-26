import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { getAuthSession } from "@/auth-session";
import { nutritionApi, DailySummaryResponse, MealDetail } from "@/services/nutrition-api";

export default function NutritionHistoryScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summaryData, setSummaryData] = useState<DailySummaryResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const session = getAuthSession();
    const profileId = session?.profileId || 1;

    try {
      const res = await nutritionApi.getDailySummary(profileId, selectedDate);
      setSummaryData(res.data);
    } catch (err: any) {
      console.warn("Lỗi tải lịch sử dinh dưỡng:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const changeDate = (daysDelta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + daysDelta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleDeleteMeal = (mealLogId: number) => {
    Alert.alert("Xóa bữa ăn", "Bạn có chắc chắn muốn xóa bữa ăn này khỏi nhật ký?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const session = getAuthSession();
          const profileId = session?.profileId || 1;
          try {
            await nutritionApi.deleteMeal(mealLogId, profileId);
            loadData();
          } catch (err: any) {
            Alert.alert("Lỗi", err.message || "Không thể xóa bữa ăn.");
          }
        },
      },
    ]);
  };

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case "BREAKFAST": return "Bữa sáng";
      case "LUNCH": return "Bữa trưa";
      case "DINNER": return "Bữa tối";
      case "SNACK": return "Bữa phụ";
      case "PRE_WORKOUT": return "Pre-workout";
      case "POST_WORKOUT": return "Post-workout";
      default: return type;
    }
  };

  const summary = summaryData?.summary || {
    totalKcal: 0,
    totalProtein: 0,
    totalCarb: 0,
    totalFat: 0,
    totalMeals: 0,
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />}
      >
        {/* Navigation Header */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <Text style={styles.navBtnText}>← Trang chủ</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Nhật ký Dinh dưỡng</Text>
          <TouchableOpacity
            style={styles.addNavBtn}
            onPress={() => router.push("/nutrition/camera" as any)}
          >
            <Text style={styles.addNavBtnText}>+ Quét</Text>
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity style={styles.dateArrowBtn} onPress={() => changeDate(-1)}>
            <Text style={styles.dateArrowText}>◀</Text>
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text style={styles.dateMainText}>{selectedDate}</Text>
            <Text style={styles.dateSubText}>{isToday ? "Hôm nay" : "Nhật ký quá khứ"}</Text>
          </View>
          <TouchableOpacity style={styles.dateArrowBtn} onPress={() => changeDate(1)}>
            <Text style={styles.dateArrowText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Tổng quan Calo & Macros trong ngày */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryKcalValue}>{Math.round(summary.totalKcal)}</Text>
              <Text style={styles.summaryKcalLabel}>Tổng Calo nạp (kcal)</Text>
            </View>
            <View style={styles.mealsCountBadge}>
              <Text style={styles.mealsCountText}>{summary.totalMeals} Bữa ăn</Text>
            </View>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroCol}>
              <Text style={[styles.macroLabel, { color: "#FF5252" }]}>Protein</Text>
              <Text style={styles.macroVal}>{Math.round(summary.totalProtein)}g</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={[styles.macroLabel, { color: "#FFB300" }]}>Carb</Text>
              <Text style={styles.macroVal}>{Math.round(summary.totalCarb)}g</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={[styles.macroLabel, { color: "#00BCD4" }]}>Fat</Text>
              <Text style={styles.macroVal}>{Math.round(summary.totalFat)}g</Text>
            </View>
          </View>
        </View>

        {/* Danh sách các bữa ăn */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Các bữa ăn trong ngày</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FF5722" />
            <Text style={styles.loadingText}>Đang tải nhật ký bữa ăn...</Text>
          </View>
        ) : summaryData?.meals && summaryData.meals.length > 0 ? (
          summaryData.meals.map((meal) => (
            <View key={meal.mealLogId} style={styles.mealCard}>
              <View style={styles.mealCardHeader}>
                <View style={styles.mealTypeBadge}>
                  <Text style={styles.mealTypeBadgeText}>{getMealTypeLabel(meal.mealType)}</Text>
                </View>
                <Text style={styles.mealKcalText}>{Math.round(meal.totalKcal)} kcal</Text>
                <TouchableOpacity
                  style={styles.mealDeleteBtn}
                  onPress={() => handleDeleteMeal(meal.mealLogId)}
                >
                  <Text style={styles.mealDeleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {meal.imageUrl && (
                <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} contentFit="cover" />
              )}

              {/* Chi tiết nguyên liệu */}
              <View style={styles.itemsList}>
                {meal.items.map((item, idx) => (
                  <View key={`${item.ingredientId}-${idx}`} style={styles.itemRow}>
                    <Text style={styles.itemBullet}>•</Text>
                    <Text style={styles.itemDesc}>
                      {item.nameVi}: <Text style={styles.itemBold}>{item.userFinalGrams}g</Text> ({Math.round(item.calculatedKcal)} kcal)
                    </Text>
                  </View>
                ))}
              </View>

              {meal.note ? (
                <Text style={styles.mealNote}>💬 {meal.note}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🥗</Text>
            <Text style={styles.emptyTitle}>Chưa có bữa ăn nào được ghi nhận</Text>
            <Text style={styles.emptySub}>Chụp ảnh bữa ăn để AI tự động tính Calo và Macro ngay!</Text>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => router.push("/nutrition/camera" as any)}
            >
              <Text style={styles.scanBtnText}>📸 Quét bữa ăn bằng AI</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 40,
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
  addNavBtn: {
    backgroundColor: "#FF5722",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addNavBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  dateArrowBtn: {
    padding: 8,
  },
  dateArrowText: {
    color: "#FF5722",
    fontSize: 16,
    fontWeight: "bold",
  },
  dateCenter: {
    alignItems: "center",
  },
  dateMainText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  dateSubText: {
    color: "#888888",
    fontSize: 12,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  summaryKcalValue: {
    color: "#FF5722",
    fontSize: 32,
    fontWeight: "800",
  },
  summaryKcalLabel: {
    color: "#A0A0A0",
    fontSize: 13,
    marginTop: 2,
  },
  mealsCountBadge: {
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mealsCountText: {
    color: "#E0E0E0",
    fontSize: 13,
    fontWeight: "600",
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  macroCol: {
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  macroVal: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  loadingBox: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    color: "#888",
    marginTop: 10,
  },
  mealCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  mealCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mealTypeBadge: {
    backgroundColor: "rgba(255, 87, 34, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 87, 34, 0.3)",
  },
  mealTypeBadgeText: {
    color: "#FF5722",
    fontSize: 12,
    fontWeight: "700",
  },
  mealKcalText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  mealDeleteBtn: {
    padding: 4,
  },
  mealDeleteBtnText: {
    fontSize: 16,
  },
  mealImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemsList: {
    backgroundColor: "#161616",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemBullet: {
    color: "#FF5722",
    fontSize: 16,
    marginRight: 6,
  },
  itemDesc: {
    color: "#CCCCCC",
    fontSize: 13,
    flex: 1,
  },
  itemBold: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  mealNote: {
    color: "#888888",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#181818",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySub: {
    color: "#888888",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  scanBtn: {
    backgroundColor: "#FF5722",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  scanBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

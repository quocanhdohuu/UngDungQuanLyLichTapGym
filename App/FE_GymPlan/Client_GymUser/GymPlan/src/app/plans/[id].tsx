import { DataState } from "@/components/common/data-state";
import { colors, styles } from "@/components/plans/plan-styles";
import { RoutineCard, WorkoutDay } from "@/components/plans/workout-plan";
import { useApiData } from "@/hooks/use-api-data";
import { userApi } from "@/services/user-api";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivePlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // The active-plan API already includes sp_GetWorkoutPlanDetail's days and media.
  const state = useApiData(userApi.activePlan, id);
  const plan = state.data?.planId === Number(id) ? state.data : null;
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const expandedDay = selectedDay ?? plan?.days[0]?.dayId;
  const emptyMessage = state.data
    ? "Lịch tập không tồn tại hoặc không còn là lịch đang hoạt động của bạn."
    : "Bạn chưa có lịch tập đang hoạt động";

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={state.loading} onRefresh={state.refresh} tintColor={colors.green} />
        }
      >
        <View style={styles.detailHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại lịch tập"
            hitSlop={8}
            style={styles.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/plans")}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.detailTitle}>Chi tiết lịch tập</Text>
        </View>
        <DataState {...state} retry={state.refresh} empty={!plan && emptyMessage} />
        {plan && (
          <>
            <RoutineCard plan={plan} showDetails />
            {plan.days.map((day) => (
              <WorkoutDay
                key={day.dayId}
                title={`DAY ${day.dayOrder} – ${day.dayName}`}
                details={[
                  day.weekDay ? day.weekDay === 7 ? "Chủ nhật" : `Thứ ${day.weekDay + 1}` : null,
                  `${day.exercises.length} bài tập`,
                ].filter(Boolean).join(" • ")}
                icon="⚒"
                expanded={expandedDay === day.dayId}
                onPress={() => setSelectedDay(expandedDay === day.dayId ? 0 : day.dayId)}
                today={false}
                exercises={day.exercises}
                showVideoPreview
              />
            ))}
            {!plan.days.length && <Text style={styles.dayDetails}>Lịch tập chưa có ngày tập</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import { router } from "expo-router";
import { useStartWorkout } from "@/hooks/use-start-workout";
import { DataState } from "@/components/common/data-state";
import { useApiData } from "@/hooks/use-api-data";
import { userApi } from "@/services/user-api";
import { SharedHeader } from "@/components/common/shared-header";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RoutineCard, WorkoutDay } from "@/components/plans/workout-plan";
import { colors, styles } from "@/components/plans/plan-styles";

export default function PlansScreen() {
  const workout = useStartWorkout();
  const state = useApiData(async (signal) => {
    const [plan, today] = await Promise.all([
      userApi.activePlan(signal),
      userApi.todayWorkout(signal),
    ]);
    return { plan, today };
  });
  const plan = state.data?.plan;
  const today = state.data?.today;
  const [selectedDay, setExpandedDay] = useState<number | null>(null);
  const expandedDay = selectedDay ?? today?.dayId ?? plan?.days[0]?.dayId;
  const toggleDay = (day: number) =>
    setExpandedDay(expandedDay === day ? 0 : day);

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={state.loading}
            onRefresh={state.refresh}
            tintColor={colors.green}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SharedHeader
          title="Lịch Tập"
          parentHorizontalPadding={23}
          parentTopPadding={13}
        />
        <DataState
          {...state}
          retry={state.refresh}
          empty={!plan && "Chưa có lịch tập"}
        />
        {state.data && (
          <>
            <View style={styles.personalHeader}>
              <Text style={styles.eyebrow}>KẾ HOẠCH CÁ NHÂN</Text>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>
                  {plan ? "Đang kích hoạt" : "Chưa có lịch tập"}
                </Text>
              </View>
            </View>
            <Text style={styles.heading}>Chương trình của tôi</Text>
            {plan && (
              <RoutineCard
                plan={plan}
                onPress={() => router.push({ pathname: "/plans/[id]", params: { id: plan.planId } })}
              />
            )}
            <View style={styles.actionRow}>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.push("/plans/create")}
              >
                <Text style={styles.actionPlus}>＋</Text>
                <Text style={styles.actionText}>Tạo lịch mới</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.push("/templates")}
              >
                <Text style={styles.actionIcon}>▣</Text>
                <Text style={styles.actionText}>Tham gia mẫu</Text>
              </Pressable>
            </View>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>Lộ trình tập tuần này</Text>
              <Text style={styles.routeCount}>
                {plan?.completedThisWeek ?? 0}/{plan?.totalDays ?? 0} buổi đã
                tập
              </Text>
            </View>
            {plan?.days.map((day) => (
              <WorkoutDay
                key={day.dayId}
                title={day.dayName}
                details={`${day.exercises.length} bài • ${day.exercises.reduce((sum, exercise) => sum + Number(exercise.sets), 0)} sets`}
                icon="⚒"
                expanded={expandedDay === day.dayId}
                onPress={() => toggleDay(day.dayId)}
                today={today?.dayId === day.dayId}
                exercises={day.exercises}
              />
            ))}
            {plan && !plan.days.length && (
              <Text style={styles.dayDetails}>Chưa có ngày tập</Text>
            )}
            <DataState loading={false} error={workout.error} />
            <Pressable
              style={styles.startButton}
              disabled={!expandedDay || workout.busy}
              onPress={() => workout.start(expandedDay)}
            >
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.startText}>
                {workout.busy
                  ? "ĐANG MỞ…"
                  : expandedDay
                    ? `START WORKOUT (${plan?.days.find((day) => day.dayId === expandedDay)?.dayName})`
                    : "Chọn ngày tập"}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

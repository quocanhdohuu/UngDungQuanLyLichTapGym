import { router } from "expo-router";
import { useStartWorkout } from "@/hooks/use-start-workout";
import { DataState } from "@/components/common/data-state";
import { useApiData } from "@/hooks/use-api-data";
import {
  RecommendedPlan,
  Template,
  goalLabel,
  levelLabel,
  userApi,
} from "@/services/user-api";
import { SharedHeader } from "@/components/common/shared-header";
import { Confirm, useAction } from "@/components/common/flow-ui";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RoutineCard, WorkoutDay } from "@/components/plans/workout-plan";
import { colors, styles } from "@/components/plans/plan-styles";

export default function PlansScreen() {
  const workout = useStartWorkout();
  const action = useAction();
  const [confirmPlan, setConfirmPlan] = useState<RecommendedPlan | Template | null>(null);

  const state = useApiData(async (signal) => {
    const [plan, today] = await Promise.all([
      userApi.activePlan(signal),
      userApi.todayWorkout(signal),
    ]);
    if (!plan) {
      const [recRes, allTemplates] = await Promise.all([
        userApi.getRecommendations(signal).catch(() => null),
        userApi.getTemplates(signal).catch(() => []),
      ]);
      return {
        plan: null,
        today: null,
        recommendations: recRes,
        allTemplates: Array.isArray(allTemplates) ? allTemplates : [],
      };
    }
    return {
      plan,
      today,
      recommendations: null,
      allTemplates: [],
    };
  });

  const plan = state.data?.plan;
  const today = state.data?.today;
  const recommendations = state.data?.recommendations;
  const allTemplates = state.data?.allTemplates || [];

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
          loading={state.loading && !state.data}
          error={state.error}
          retry={state.refresh}
        />

        {state.data && (
          <>
            <View style={styles.personalHeader}>
              <Text style={styles.eyebrow}>KẾ HOẠCH CÁ NHÂN</Text>
              <View style={styles.activeBadge}>
                <View
                  style={[
                    styles.activeDot,
                    !plan && { backgroundColor: colors.muted },
                  ]}
                />
                <Text
                  style={[
                    styles.activeText,
                    !plan && { color: colors.muted },
                  ]}
                >
                  {plan ? "Đang kích hoạt" : "Chưa có lịch tập"}
                </Text>
              </View>
            </View>

            {/* TRƯỜNG HỢP 1: NGƯỜI DÙNG ĐÃ CÓ LỊCH TẬP ACTIVE */}
            {plan && (
              <>
                <Text style={styles.heading}>Chương trình của tôi</Text>
                <RoutineCard
                  plan={plan}
                  onPress={() =>
                    router.push({
                      pathname: "/plans/[id]",
                      params: { id: plan.planId },
                    })
                  }
                />
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
                {!plan.days.length && (
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

            {/* TRƯỜNG HỢP 2: NGƯỜI DÙNG CHƯA CÓ LỊCH TẬP */}
            {!plan && (
              <>
                <Text style={styles.heading}>Lộ trình tập luyện</Text>

                {/* A. Nếu hồ sơ chưa hoàn thiện (PROFILE_INCOMPLETE) */}
                {recommendations?.status === "PROFILE_INCOMPLETE" && (
                  <View style={recStyles.incompleteCard}>
                    <View style={recStyles.incompleteHeader}>
                      <View style={recStyles.incompleteBadge}>
                        <Text style={recStyles.incompleteBadgeText}>
                          ⚠️ CẦN BỔ SUNG THÔNG TIN
                        </Text>
                      </View>
                    </View>
                    <Text style={recStyles.incompleteTitle}>
                      Hoàn thiện hồ sơ để nhận gợi ý chuẩn khoa học
                    </Text>
                    <Text style={recStyles.incompleteDesc}>
                      Hệ thống cần biết Trình độ, Mục tiêu tập luyện và Số buổi có thể tập mỗi tuần của bạn để gợi ý giáo án tối ưu nhất.
                    </Text>
                    <Pressable
                      style={recStyles.incompleteButton}
                      onPress={() => router.push("/profile")}
                    >
                      <Text style={recStyles.incompleteButtonText}>
                        ⚙ Cập nhật thông tin tại Trang cá nhân
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* B. Nếu có danh sách gợi ý cá nhân hóa (SUCCESS) */}
                {recommendations?.status === "SUCCESS" &&
                  recommendations.plans &&
                  recommendations.plans.length > 0 && (
                    <View style={recStyles.recSection}>
                      <View style={recStyles.recHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.eyebrow}>ĐỀ XUẤT CHO BẠN</Text>
                          <Text style={styles.routeTitle}>Lịch tập dành cho bạn</Text>
                        </View>
                        <View style={recStyles.recBadgeCount}>
                          <Text style={recStyles.recBadgeCountText}>
                            {recommendations.plans.length} giáo án phù hợp
                          </Text>
                        </View>
                      </View>

                      {recommendations.plans.map((rec) => (
                        <View key={rec.planId} style={recStyles.recCard}>
                          <View style={recStyles.recTop}>
                            <Text style={recStyles.recTitle}>{rec.title}</Text>
                            <View style={recStyles.scoreBadge}>
                              <Text style={recStyles.scoreText}>
                                ★ {rec.matchScore}% Phù hợp
                              </Text>
                            </View>
                          </View>

                          <View style={recStyles.tagsRow}>
                            <View style={recStyles.tagGoal}>
                              <Text style={recStyles.tagGoalText}>
                                {goalLabel(rec.goal)}
                              </Text>
                            </View>
                            <View style={recStyles.tagLevel}>
                              <Text style={recStyles.tagLevelText}>
                                {levelLabel(rec.level)}
                              </Text>
                            </View>
                            <View style={recStyles.tagMeta}>
                              <Text style={recStyles.tagMetaText}>
                                {rec.totalDays} ngày / tuần
                              </Text>
                            </View>
                            <View style={recStyles.tagMeta}>
                              <Text style={recStyles.tagMetaText}>
                                {rec.durationWeeks} tuần
                              </Text>
                            </View>
                          </View>

                          {rec.description ? (
                            <Text style={recStyles.recDesc} numberOfLines={2}>
                              {rec.description}
                            </Text>
                          ) : null}

                          <View style={recStyles.reasonBox}>
                            <Text style={recStyles.reasonTitle}>💡 Lý do gợi ý:</Text>
                            <Text style={recStyles.reasonText}>
                              {rec.recommendReason}
                            </Text>
                          </View>

                          <View style={recStyles.recButtonRow}>
                            <Pressable
                              style={recStyles.btnSecondary}
                              onPress={() =>
                                router.push({
                                  pathname: "/templates/[id]",
                                  params: { id: rec.planId },
                                })
                              }
                            >
                              <Text style={recStyles.btnSecondaryText}>Chi tiết</Text>
                            </Pressable>
                            <Pressable
                              style={recStyles.btnPrimary}
                              onPress={() => setConfirmPlan(rec)}
                            >
                              <Text style={recStyles.btnPrimaryText}>
                                ✓ Áp dụng lịch này
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                {/* C. Nếu không có lịch tập nào đạt điểm ngưỡng (NO_MATCH) */}
                {recommendations?.status === "NO_MATCH" && (
                  <View style={recStyles.noticeBox}>
                    <Text style={recStyles.noticeText}>
                      Chưa tìm thấy giáo án mẫu đạt độ tương thích tối thiểu (50%). Bạn có thể tham khảo thư viện giáo án mẫu bên dưới hoặc tự tạo lịch mới.
                    </Text>
                  </View>
                )}

                {/* Nút hành động nhanh */}
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
                    <Text style={styles.actionText}>Tất cả mẫu ({allTemplates.length})</Text>
                  </Pressable>
                </View>

                {/* D. Danh sách tất cả giáo án mẫu */}
                {allTemplates.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <View style={styles.routeHeader}>
                      <Text style={styles.routeTitle}>Thư viện lịch tập mẫu</Text>
                      <Pressable onPress={() => router.push("/templates")}>
                        <Text style={{ color: colors.green, fontSize: 14, fontWeight: "700" }}>
                          Xem tất cả ›
                        </Text>
                      </Pressable>
                    </View>

                    {allTemplates.map((tpl) => (
                      <View key={tpl.planId} style={recStyles.templateCard}>
                        <View style={recStyles.recTop}>
                          <Text style={recStyles.templateTitle}>{tpl.title}</Text>
                          <View style={recStyles.tagGoal}>
                            <Text style={recStyles.tagGoalText}>{goalLabel(tpl.goal)}</Text>
                          </View>
                        </View>
                        <Text style={recStyles.templateMeta}>
                          {levelLabel(tpl.level)} • {tpl.totalDays} ngày / tuần • {tpl.durationWeeks} tuần
                        </Text>
                        {tpl.description ? (
                          <Text style={recStyles.templateDesc} numberOfLines={2}>
                            {tpl.description}
                          </Text>
                        ) : null}
                        <View style={[recStyles.recButtonRow, { marginTop: 12 }]}>
                          <Pressable
                            style={recStyles.btnSecondary}
                            onPress={() =>
                              router.push({
                                pathname: "/templates/[id]",
                                params: { id: tpl.planId },
                              })
                            }
                          >
                            <Text style={recStyles.btnSecondaryText}>Xem chi tiết</Text>
                          </Pressable>
                          <Pressable
                            style={recStyles.btnPrimary}
                            onPress={() => setConfirmPlan(tpl)}
                          >
                            <Text style={recStyles.btnPrimaryText}>Áp dụng</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal xác nhận áp dụng lịch tập */}
      <Confirm
        visible={Boolean(confirmPlan)}
        title="Áp dụng lịch tập này?"
        confirmLabel="✓ Bắt đầu lịch tập"
        message="Lịch tập này sẽ được kích hoạt làm kế hoạch tập luyện chính của bạn. Tiến trình và lịch sử tập luyện trước đây vẫn được lưu lại an toàn."
        details={
          confirmPlan ? (
            <View style={[styles.routineCard, { backgroundColor: "#202526", marginVertical: 8 }]}>
              <Text style={styles.routineName}>{confirmPlan.title}</Text>
              <Text style={{ color: colors.green, fontSize: 13, fontWeight: "700", marginTop: 6 }}>
                {goalLabel(confirmPlan.goal)} • {levelLabel(confirmPlan.level)} • {confirmPlan.totalDays} ngày / tuần • {confirmPlan.durationWeeks} tuần
              </Text>
            </View>
          ) : null
        }
        busy={action.busy}
        error={action.error}
        onClose={() => setConfirmPlan(null)}
        onConfirm={() =>
          action.run(async () => {
            if (!confirmPlan) return;
            await userApi.applyPlan(confirmPlan.planId);
            setConfirmPlan(null);
            await state.refresh();
          })
        }
      />
    </SafeAreaView>
  );
}

const recStyles = StyleSheet.create({
  incompleteCard: {
    backgroundColor: "#202425",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5A93C",
    gap: 12,
    marginBottom: 24,
  },
  incompleteHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  incompleteBadge: {
    backgroundColor: "rgba(229, 169, 60, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  incompleteBadgeText: {
    color: "#F5B041",
    fontSize: 12,
    fontWeight: "800",
  },
  incompleteTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  incompleteDesc: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  incompleteButton: {
    backgroundColor: "#F5B041",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  incompleteButtonText: {
    color: "#0D1112",
    fontSize: 14,
    fontWeight: "800",
  },
  recSection: {
    marginBottom: 24,
  },
  recHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recBadgeCount: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  recBadgeCountText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  recCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2B3335",
  },
  recTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  recTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
  },
  scoreBadge: {
    backgroundColor: "#163321",
    borderWidth: 1,
    borderColor: colors.green,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  scoreText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "800",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  tagGoal: {
    backgroundColor: "rgba(106, 215, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(106, 215, 255, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagGoalText: {
    color: "#6ad7ff",
    fontSize: 12,
    fontWeight: "700",
  },
  tagLevel: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagLevelText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  tagMeta: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagMetaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  recDesc: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  reasonBox: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.green,
  },
  reasonTitle: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },
  reasonText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  recButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  btnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  btnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: {
    color: "#071812",
    fontSize: 13,
    fontWeight: "800",
  },
  noticeBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#303A33",
  },
  noticeText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  templateCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#252B2C",
  },
  templateTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
  },
  templateMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
  },
  templateDesc: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});

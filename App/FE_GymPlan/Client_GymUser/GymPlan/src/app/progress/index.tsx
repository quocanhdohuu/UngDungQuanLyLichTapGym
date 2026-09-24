import { DataState } from "@/components/common/data-state";
import { router } from "expo-router";
import { useApiData } from "@/hooks/use-api-data";
import { formatDate, formatNumber, Period, ProgressSummary, WorkoutHistory, userApi } from "@/services/user-api";
import { SharedHeader } from "@/components/common/shared-header";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = {
  background: "#0D1112",
  card: "#1B1F20",
  cardRaised: "#202425",
  dark: "#0D1011",
  soft: "#2A302F",
  text: "#EEF0ED",
  muted: "#B5BDB2",
  dim: "#737D76",
  green: "#8CFF2E",
  greenDark: "#21431E",
  orange: "#FF8B2B",
};

function OverviewCard({ summary }: { summary: ProgressSummary | null }) {
  return (
    <View style={styles.overviewCard}>
      <View style={styles.overviewItem}>
        <Text style={styles.overviewIcon}>⌁</Text>
        <Text style={styles.overviewLabel}>Buổi tập</Text>
        <Text style={styles.overviewValue}>{formatNumber(summary?.totalSessions)}</Text>
        <Text style={styles.overviewHint}>Tổng số</Text>
      </View>
      <View style={styles.overviewItem}>
        <Text style={styles.overviewIcon}>♧</Text>
        <Text style={styles.overviewLabel}>Khối lượng</Text>
        <Text style={styles.overviewValue}>{formatNumber(summary?.totalVolumeTon)}</Text>
        <Text style={styles.overviewHint}>Tấn tập</Text>
      </View>
      <View style={styles.overviewItem}>
        <Text style={styles.overviewIcon}>♨</Text>
        <Text style={styles.overviewLabel}>Chuỗi ngày</Text>
        <Text style={[styles.overviewValue, styles.orangeValue]}>
          {formatNumber(summary?.currentStreak)} <Text style={styles.fire}>ngày 🔥</Text>
        </Text>
        <Text style={styles.overviewHint}>Liên tiếp hiện tại</Text>
      </View>
    </View>
  );
}

function WorkoutDetails({ id }: { id: number }) {
  const state = useApiData((signal) => userApi.workoutDetail(id, signal), String(id));
  return <View style={styles.detailBlock}>
    <View style={styles.detailHeader}>
      <Text style={styles.detailHeaderTitle}>CHI TIẾT PHIÊN TẬP LUYỆN</Text>
    </View>
    <DataState {...state} retry={state.refresh} empty={!!state.data && !state.data.exercises.length && "Chưa có chi tiết bài tập"} />
    {state.data?.exercises.map((exercise, index) => <View key={exercise.performedExerciseId} style={styles.detailExercise}>
      <View style={styles.detailTitleRow}>
        <Text style={styles.numberBadge}>{index + 1}</Text>
        <Text numberOfLines={1} style={styles.detailTitle}>{exercise.exerciseName}</Text>
        <Text style={styles.setCount}>{exercise.sets.length} hiệp</Text>
      </View>
      <View style={styles.setRow}>
        {exercise.sets.map((set) => <View key={set.setId} style={styles.setBox}>
          <Text style={styles.setLabel}>Hiệp {set.setNumber}</Text>
          <Text style={styles.setValue}>{formatNumber(set.weight)}kg ×</Text>
          <Text style={styles.setValue}>{set.reps ?? "—"}</Text>
        </View>)}
        {!exercise.sets.length && <Text style={styles.setLabel}>Chưa ghi nhận hiệp tập</Text>}
      </View>
    </View>)}
  </View>;
}

function HistoryCard({ workout, first }: { workout: WorkoutHistory; first: boolean }) {
  const [expanded, setExpanded] = useState(first);
  const duration = workout.endTime ? Math.max(0, Math.round((new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / 60000)) : null;
  const stats = `◷ ${duration == null ? "—" : duration} phút   •   ♧ ${formatNumber(Number(workout.totalVolume) / 1000)} Tấn   •   ${workout.totalExercises} bài tập`;
  return <View style={first ? styles.workoutCard : styles.compactCard}>
    <Pressable onPress={() => setExpanded(!expanded)}>
      <View style={first ? styles.workoutTopLine : styles.compactTop}>
        <Text style={first ? styles.dateText : styles.compactDate}>{formatDate(workout.startTime)}</Text>
        <Text style={first ? styles.completeBadge : styles.savedBadge}>✓ Hoàn thành</Text>
      </View>
      <View style={first ? styles.workoutTitleRow : styles.compactTitleRow}>
        <View>
          <Text style={first ? styles.workoutTitle : styles.compactTitle}>{workout.dayName || workout.planTitle || "Buổi tập"}</Text>
          <Text style={first ? styles.workoutStatsText : styles.compactStats}>{stats}</Text>
        </View>
      </View>
      {!first && <View style={styles.compactFooter}>
        <Text style={styles.compactHint}>{workout.planTitle || "—"}</Text>
        <Text style={styles.detailLink}>{expanded ? "Thu gọn ˆ" : "Xem chi tiết ›"}</Text>
      </View>}
    </Pressable>
    {expanded && <WorkoutDetails id={workout.workoutSessionId} />}
    {expanded && first && <View style={styles.workoutFooter}>
      <Text style={styles.shareText}>{workout.planTitle || "—"}</Text>
      <Pressable onPress={() => setExpanded(false)}><Text style={styles.collapseText}>Thu gọn tóm tắt ˆ</Text></Pressable>
    </View>}
  </View>;
}

export default function ProgressScreen() {
  const [period, setPeriod] = useState<Period>("ALL");
  const overview = useApiData(async (signal) => {
    const [summary, records] = await Promise.all([userApi.progressSummary(signal), userApi.personalRecords(signal)]);
    return { summary, records };
  });
  const history = useApiData((signal) => userApi.history(period, signal), period);
  const refresh = () => Promise.all([overview.refresh(), history.refresh()]);
  const filters: [Period, string][] = [["ALL", "Tất cả"], ["WEEK", "Tuần này"], ["MONTH", "Tháng này"]];
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={overview.loading || history.loading} onRefresh={refresh} tintColor={colors.green} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SharedHeader title="Tiến Trình" parentHorizontalPadding={17} parentTopPadding={9} />
        <DataState {...overview} retry={overview.refresh} empty={!!overview.data && !overview.data.summary?.totalSessions && "Chưa có dữ liệu tiến trình"} />
        {overview.data && <OverviewCard summary={overview.data.summary} />}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map(([value, label]) => <Pressable key={value} onPress={() => setPeriod(value)}>
            <Text style={period === value ? styles.activeFilter : styles.filter}>
              ▣ {label}{value === "ALL" && overview.data?.summary ? ` (${overview.data.summary.totalSessions})` : ""}
            </Text>
          </Pressable>)}
        </ScrollView>
        <DataState {...history} retry={history.refresh} empty={!!history.data && !history.data.length && "Chưa có lịch sử tập luyện trong khoảng thời gian này"} />
        {history.data?.map((workout, index) => <HistoryCard key={workout.workoutSessionId} workout={workout} first={index === 0} />)}
        {overview.data && <View style={styles.workoutCard}>
          <View style={styles.detailHeader}><Text style={styles.detailHeaderTitle}>PERSONAL RECORD</Text></View>
          {!overview.data.records.length && <Text style={styles.compactHint}>Chưa có Personal Record</Text>}
          {overview.data.records.map((record) => <View key={record.exerciseId} style={styles.detailExercise}>
            <View style={styles.detailTitleRow}>
              <Text style={styles.detailTitle}>{record.exerciseName}</Text>
              <Text style={styles.recordBadge}>★ {formatNumber(record.maxWeight)} KG</Text>
              {record.achievedAt && new Date(record.achievedAt).toDateString() === new Date().toDateString() && <Text style={styles.recordBadge}>PR MỚI</Text>}
            </View>
            <Text style={styles.compactHint}>Tập gần nhất: {formatDate(record.latestWorkout)}</Text>
          </View>)}
        </View>}
        <Pressable style={styles.previousButton} onPress={() => router.push("/history")}>
          <Text style={styles.previousText}>◴ Xem lịch sử tập luyện</Text>
        </Pressable>
        <Text style={styles.cloudText}>{history.data ? `${history.data.length} buổi tập` : ""}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 17, paddingTop: 9, paddingBottom: 105 },
  header: {
    height: 51,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  brandMark: {
    width: 33,
    height: 33,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { color: colors.green, fontSize: 23 },
  brand: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 9,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    marginLeft: 9,
  },
  headerActions: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 16,
    backgroundColor: "#35423C",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.text, fontSize: 8, fontWeight: "900" },
  overviewCard: {
    height: 110,
    borderRadius: 10,
    backgroundColor: colors.card,
    padding: 10,
    flexDirection: "row",
    gap: 6,
    marginBottom: 13,
  },
  overviewItem: {
    flex: 1,
    borderRadius: 7,
    backgroundColor: colors.cardRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewIcon: { color: colors.green, fontSize: 14, height: 17 },
  overviewLabel: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  overviewValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  overviewHint: { color: colors.muted, fontSize: 9, marginTop: 1 },
  orangeValue: { color: colors.orange },
  fire: { fontSize: 10, color: colors.orange },
  filterRow: { gap: 7, paddingBottom: 14 },
  activeFilter: {
    backgroundColor: colors.green,
    color: "#11180D",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 9,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
  },
  filter: {
    backgroundColor: colors.cardRaised,
    color: colors.muted,
    borderRadius: 18,
    paddingHorizontal: 17,
    paddingVertical: 9,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
  },
  workoutCard: {
    borderRadius: 11,
    backgroundColor: colors.card,
    padding: 13,
    marginBottom: 13,
  },
  workoutTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  completeBadge: {
    color: colors.green,
    backgroundColor: colors.greenDark,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 9,
    fontWeight: "900",
  },
  workoutTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 9,
  },
  workoutTitle: { color: colors.text, fontSize: 21, fontWeight: "900" },
  workoutStats: { flexDirection: "row", gap: 8, marginTop: 6 },
  workoutStatsText: { color: colors.muted, fontSize: 10 },
  prColumn: { alignItems: "flex-end" },
  prBadge: {
    color: "#371B0A",
    backgroundColor: colors.orange,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: "900",
  },
  prBench: { color: colors.text, fontSize: 10, marginTop: 4 },
  detailBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.soft,
    marginTop: 12,
    paddingTop: 11,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  detailHeaderTitle: { color: colors.muted, fontSize: 10, fontWeight: "900" },
  heartLink: { color: colors.green, fontSize: 9, fontWeight: "900" },
  detailExercise: {
    backgroundColor: colors.cardRaised,
    borderRadius: 8,
    padding: 9,
    marginBottom: 8,
  },
  detailTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  numberBadge: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: colors.soft,
    color: colors.muted,
    textAlign: "center",
    paddingTop: 3,
    fontSize: 10,
    fontWeight: "900",
  },
  detailTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "900" },
  recordBadge: {
    color: colors.orange,
    backgroundColor: "#55331F",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: "900",
  },
  setCount: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  setRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  setBox: {
    flex: 1,
    minHeight: 59,
    borderRadius: 4,
    backgroundColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  prSetBox: { backgroundColor: "#3F2615" },
  setLabel: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  setValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 16,
  },
  prSetValue: { color: colors.orange },
  workoutFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  shareText: { color: colors.muted, fontSize: 9 },
  collapseText: { color: colors.green, fontSize: 10, fontWeight: "900" },
  compactCard: {
    borderRadius: 11,
    backgroundColor: colors.card,
    padding: 13,
    marginBottom: 13,
  },
  compactTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compactDate: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  savedBadge: {
    color: colors.muted,
    backgroundColor: colors.greenDark,
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 9,
    fontWeight: "800",
  },
  compactTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  compactTitle: { color: colors.text, fontSize: 19, fontWeight: "900" },
  compactStats: { color: colors.muted, fontSize: 10, marginTop: 4 },
  compactIcon: {
    color: colors.green,
    backgroundColor: colors.greenDark,
    borderRadius: 7,
    padding: 9,
    fontSize: 20,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  tag: {
    color: colors.muted,
    backgroundColor: colors.cardRaised,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    fontSize: 9,
    fontWeight: "700",
  },
  compactFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 13,
  },
  compactHint: { color: colors.muted, fontSize: 9, fontWeight: "700" },
  detailLink: { color: colors.green, fontSize: 10, fontWeight: "900" },
  previousButton: {
    height: 40,
    borderRadius: 9,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  previousText: { color: colors.muted, fontSize: 11, fontWeight: "900" },
  cloudText: {
    color: colors.dim,
    fontSize: 10,
    textAlign: "center",
    marginTop: 10,
  },
});

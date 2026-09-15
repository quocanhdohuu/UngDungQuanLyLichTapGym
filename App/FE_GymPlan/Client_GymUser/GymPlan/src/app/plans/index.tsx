import { SharedHeader } from "@/components/common/shared-header";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = {
  background: "#0D1112",
  surface: "#1B1F20",
  surfaceRaised: "#202425",
  surfaceSoft: "#2B3031",
  text: "#E9EBE8",
  muted: "#B5BDB2",
  green: "#8CFF2E",
  greenDark: "#1D411D",
  peach: "#FFB08F",
  red: "#FF9D9D",
};

const exercises = [
  ["Barbell Bench Press", "4 × 10", "60 KG", "90s nghỉ", "#173331"],
  ["Incline Dumbbell Press", "3 × 12", "22 KG", "60s nghỉ", "#26333B"],
  ["Overhead Shoulder Press", "3 × 10", "20 KG", "60s nghỉ", "#273239"],
  ["Dips / Triceps", "3 × 15", "15 KG", "45s nghỉ", "#342E2B"],
] as const;

function RoutineCard() {
  return (
    <View style={styles.routineCard}>
      <View style={styles.routineTop}>
        <View>
          <Text style={styles.routineLabel}>CURRENT ROUTINE</Text>
          <Text style={styles.routineName}>Push Pull Legs</Text>
          <Text style={styles.routineSubtitle}>
            PPL 6-Day Hypertrophy Split
          </Text>
        </View>
        <Text style={styles.levelBadge}>Intermediate</Text>
      </View>
      <View style={styles.routineProgressHeader}>
        <Text style={styles.weekText}>♨ Tuần 4 / 8</Text>
        <Text style={styles.completeText}>Hoàn thành 75%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>
    </View>
  );
}

function ExerciseRow({
  exercise,
}: {
  exercise: readonly [string, string, string, string, string];
}) {
  return (
    <View style={styles.exerciseRow}>
      <Text style={styles.dragHandle}>⁙</Text>
      <View style={[styles.thumbnail, { backgroundColor: exercise[4] }]}>
        <Text style={styles.thumbnailIcon}>⚒</Text>
      </View>
      <View style={styles.exerciseCopy}>
        <Text numberOfLines={1} style={styles.exerciseName}>
          {exercise[0]}
        </Text>
        <View style={styles.exerciseStats}>
          <Text style={styles.sets}>{exercise[1]}</Text>
          <Text style={styles.weight}>• {exercise[2]}</Text>
        </View>
        <Text style={styles.rest}>• {exercise[3]}</Text>
      </View>
      <View style={styles.exerciseActions}>
        <Pressable hitSlop={8}>
          <Text style={styles.editIcon}>⌕</Text>
        </Pressable>
        <Pressable hitSlop={8}>
          <Text style={styles.deleteIcon}>▥</Text>
        </Pressable>
      </View>
    </View>
  );
}

function WorkoutDay({
  title,
  details,
  icon,
  expanded,
  onPress,
}: {
  title: string;
  details: string;
  icon: string;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.dayCard, expanded && styles.expandedDayCard]}
    >
      <View style={styles.dayHeader}>
        <View style={[styles.dayIcon, expanded && styles.dayIconActive]}>
          <Text style={styles.dayIconText}>{icon}</Text>
        </View>
        <View style={styles.dayCopy}>
          <View style={styles.dayTitleRow}>
            <Text style={styles.dayTitle}>{title}</Text>
            {expanded && <Text style={styles.todayBadge}>Hôm nay</Text>}
          </View>
          <Text style={styles.dayDetails}>{details}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? "⌃" : "⌄"}</Text>
      </View>
      {expanded && (
        <View style={styles.exerciseList}>
          {exercises.map((exercise) => (
            <ExerciseRow key={exercise[0]} exercise={exercise} />
          ))}
        </View>
      )}
    </Pressable>
  );
}

export default function PlansScreen() {
  const [expandedDay, setExpandedDay] = useState(1);
  const toggleDay = (day: number) =>
    setExpandedDay(expandedDay === day ? 0 : day);

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SharedHeader
          title="Lịch Tập"
          parentHorizontalPadding={23}
          parentTopPadding={13}
        />
        <View style={styles.personalHeader}>
          <Text style={styles.eyebrow}>KẾ HOẠCH CÁ NHÂN</Text>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Đang kích hoạt</Text>
          </View>
        </View>
        <Text style={styles.heading}>Chương trình của tôi</Text>
        <RoutineCard />
        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionPlus}>＋</Text>
            <Text style={styles.actionText}>Tạo lịch mới</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionIcon}>▣</Text>
            <Text style={styles.actionText}>Tham gia mẫu</Text>
          </Pressable>
        </View>
        <View style={styles.routeHeader}>
          <Text style={styles.routeTitle}>Lộ trình tập tuần này</Text>
          <Text style={styles.routeCount}>3/6 buổi đã tập</Text>
        </View>
        <WorkoutDay
          title="DAY 1 – PUSH DAY"
          details="5 bài • 45 phút"
          icon="⚒"
          expanded={expandedDay === 1}
          onPress={() => toggleDay(1)}
        />
        <WorkoutDay
          title="DAY 2 – PULL DAY"
          details="5 bài • 50 phút"
          icon="↗"
          expanded={expandedDay === 2}
          onPress={() => toggleDay(2)}
        />
        <WorkoutDay
          title="DAY 3 – LEG DAY"
          details="6 bài • 55 phút"
          icon="♙"
          expanded={expandedDay === 3}
          onPress={() => toggleDay(3)}
        />
        <Pressable style={styles.startButton}>
          <Text style={styles.playIcon}>▶</Text>
          <Text style={styles.startText}>START WORKOUT (PUSH DAY)</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 23, paddingTop: 13, paddingBottom: 105 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 38,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40 },
  brand: {
    color: colors.green,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "800",
    marginTop: 1,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 21 },
  headerIcon: { padding: 4 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 19,
    backgroundColor: "#27312F",
    borderWidth: 1,
    borderColor: "#53625A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.text, fontSize: 10, fontWeight: "800" },
  personalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  activeText: { color: colors.green, fontSize: 12, fontWeight: "700" },
  heading: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 7,
    marginBottom: 20,
  },
  routineCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#222829",
  },
  routineTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  routineLabel: {
    color: colors.peach,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  routineName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  routineSubtitle: { color: colors.muted, fontSize: 16, marginTop: 5 },
  levelBadge: {
    color: colors.text,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: "700",
  },
  routineProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 29,
    marginBottom: 10,
  },
  weekText: { color: colors.text, fontSize: 14, fontWeight: "800" },
  completeText: { color: colors.green, fontSize: 14, fontWeight: "800" },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: "#303535",
    overflow: "hidden",
  },
  progressFill: {
    width: "75%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: colors.green,
  },
  actionRow: { flexDirection: "row", gap: 14, marginBottom: 29 },
  actionButton: {
    flex: 1,
    height: 57,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionPlus: { color: colors.green, fontSize: 27, lineHeight: 27 },
  actionIcon: { color: colors.muted, fontSize: 20 },
  actionText: { color: colors.text, fontSize: 16, fontWeight: "800" },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  routeTitle: { color: colors.text, fontSize: 21, fontWeight: "800" },
  routeCount: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 16,
    padding: 18,
  },
  expandedDayCard: { paddingBottom: 17 },
  dayHeader: { flexDirection: "row", alignItems: "center" },
  dayIcon: {
    width: 47,
    height: 47,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  dayIconActive: { backgroundColor: colors.greenDark },
  dayIconText: { color: colors.muted, fontSize: 22 },
  dayCopy: { flex: 1, minWidth: 0 },
  dayTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  dayTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    flexShrink: 1,
  },
  todayBadge: {
    color: "#0D170B",
    backgroundColor: colors.green,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: "900",
  },
  dayDetails: { color: colors.muted, fontSize: 14, marginTop: 4 },
  chevron: { color: colors.muted, fontSize: 24, marginLeft: 8 },
  exerciseList: { gap: 9, marginTop: 18 },
  exerciseRow: {
    minHeight: 101,
    borderRadius: 11,
    backgroundColor: colors.surfaceRaised,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dragHandle: {
    color: colors.muted,
    fontSize: 24,
    width: 22,
    textAlign: "center",
    marginRight: 11,
  },
  thumbnail: {
    width: 48,
    height: 58,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  thumbnailIcon: { color: "#C8D6C9", fontSize: 22 },
  exerciseCopy: { flex: 1, minWidth: 0 },
  exerciseName: { color: colors.text, fontSize: 18, fontWeight: "800" },
  exerciseStats: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  sets: { color: colors.green, fontSize: 14, fontWeight: "900" },
  weight: { color: colors.muted, fontSize: 14, marginLeft: 6 },
  rest: { color: colors.muted, fontSize: 14, marginTop: 7 },
  exerciseActions: {
    alignSelf: "stretch",
    justifyContent: "space-around",
    marginLeft: 9,
  },
  editIcon: {
    color: colors.muted,
    fontSize: 23,
    transform: [{ rotate: "-35deg" }],
  },
  deleteIcon: { color: colors.red, fontSize: 21 },
  startButton: {
    height: 66,
    borderRadius: 15,
    backgroundColor: colors.green,
    marginTop: 35,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 14,
    shadowColor: colors.green,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 4,
  },
  playIcon: { color: "#0D170B", fontSize: 19 },
  startText: {
    color: "#0D170B",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});

import { SharedHeader } from "@/components/common/shared-header";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = {
  background: "#080A0C",
  surface: "#111618",
  surfaceRaised: "#171C1E",
  surfaceSoft: "#202628",
  line: "#2A3133",
  text: "#F5F7F8",
  muted: "#9EA7AA",
  dim: "#697477",
  green: "#8CFF2E",
  orange: "#FF6D35",
};

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && <Text style={styles.sectionAction}>{action}</Text>}
    </View>
  );
}

function WorkoutBackdrop() {
  return (
    <View pointerEvents="none" style={styles.workoutBackdrop}>
      <View style={styles.weightPlateLarge} />
      <View style={styles.weightPlateSmall} />
      <View style={styles.barbell} />
      <View style={styles.backdropShade} />
    </View>
  );
}

function StatCard({
  label,
  value,
  suffix,
  children,
}: {
  label: string;
  value: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statSpark}>⌁</Text>
      </View>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {suffix && <Text style={styles.statSuffix}>{suffix}</Text>}
      </View>
      {children}
    </View>
  );
}

function ExerciseRow({
  number,
  name,
  detail,
  status,
  completed,
}: {
  number: string;
  name: string;
  detail: string;
  status: string;
  completed?: boolean;
}) {
  return (
    <Pressable style={styles.exerciseRow}>
      <View style={[styles.numberBadge, completed && styles.numberBadgeDone]}>
        <Text style={[styles.numberText, completed && styles.numberTextDone]}>
          {completed ? "✓" : number}
        </Text>
      </View>
      <View style={styles.exerciseCopy}>
        <Text numberOfLines={1} style={styles.exerciseName}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.exerciseDetail}>
          {detail}
        </Text>
      </View>
      <View style={styles.exerciseMeta}>
        <Text style={styles.exerciseWeight}>{status}</Text>
        <Text style={styles.exerciseSets}>
          {completed ? "8 reps" : number === "02" ? "3 sets" : "4 sets"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SharedHeader
          title="Trang Chủ"
          parentHorizontalPadding={16}
          parentTopPadding={12}
          onAvatarPress={() => router.push("/profile")}
        />

        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text style={styles.greeting}>
              Xin chào, Quoc Anh <Text style={styles.wave}>👋</Text>
            </Text>
            <Text style={styles.subtitle}>
              Cùng cố gắng hoàn thành mục tiêu...
            </Text>
          </View>
          <View style={styles.streak}>
            <Text style={styles.streakText}>🔥 5 DAY STREAK</Text>
          </View>
        </View>

        <View style={styles.workoutCard}>
          <WorkoutBackdrop />
          <View style={styles.workoutTopline}>
            <Text style={styles.todayBadge}>● BUỔI TẬP HÔM NAY</Text>
            <Text style={styles.dateBadge}>◷ Thứ Năm</Text>
          </View>
          <View style={styles.workoutInfo}>
            <View style={styles.pushTitleRow}>
              <Text style={styles.pushTitle}>Push Day</Text>
              <Text style={styles.levelBadge}>A1</Text>
            </View>
            <Text style={styles.workoutDetails}>
              5 bài tập • 45 phút • Ngực &amp; Vai
            </Text>
            <View style={styles.progressRow}>
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>
            <Pressable style={styles.startButton}>
              <Text style={styles.startIcon}>▶</Text>
              <Text style={styles.startText}>START WORKOUT</Text>
            </Pressable>
          </View>
        </View>

        <SectionHeader title="TIẾN TRÌNH TUẦN NÀY" action="Chi tiết →" />
        <View style={styles.statsRow}>
          <StatCard label="Số buổi" value="3" suffix="/4">
            <View style={styles.miniDots}>
              <View style={styles.dotActive} />
              <View style={styles.dotActive} />
              <View style={styles.dotActive} />
              <View style={styles.dot} />
            </View>
          </StatCard>
          <StatCard label="Khối lượng" value="12.5" suffix="T">
            <View style={styles.miniBars}>
              <View style={styles.barShort} />
              <View style={styles.barTall} />
              <View style={styles.barMedium} />
            </View>
          </StatCard>
          <StatCard label="Kỷ lục mới" value="60" suffix="KG">
            <Text style={styles.recordText}>Bench Press</Text>
            <Text style={styles.recordDelta}>↗ +2.5 kg</Text>
          </StatCard>
        </View>

        <SectionHeader
          title="DANH SÁCH BÀI TẬP HÔM NAY"
          action="5 bài • 16 sets"
        />
        <View style={styles.exerciseList}>
          <ExerciseRow
            number="01"
            name="Barbell Bench Press"
            detail="4 sets • Đã hoàn thành"
            status="60 KG"
            completed
          />
          <ExerciseRow
            number="02"
            name="Incline Dumbbell Press"
            detail="3 sets • Mục tiêu: 22kg"
            status="Sắp tập"
          />
          <ExerciseRow
            number="03"
            name="Standing Overhead Press"
            detail="3 sets • 10-12 reps"
            status="—"
          />
        </View>

        <SectionHeader title="LỐI TẮT NHANH" />
        <View style={styles.shortcutsGrid}>
          <Pressable style={styles.shortcut}>
            <Text style={styles.shortcutIcon}>▣</Text>
            <View>
              <Text style={styles.shortcutTitle}>Lịch tập</Text>
              <Text style={styles.shortcutDetail}>Tuần này: 4/5</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push("/templates")}
            style={styles.shortcut}
          >
            <Text style={styles.shortcutIcon}>▤</Text>
            <View>
              <Text style={styles.shortcutTitle}>Thư viện</Text>
              <Text style={styles.shortcutDetail}>300+ động tác</Text>
            </View>
          </Pressable>
          <Pressable style={styles.shortcut}>
            <Text style={styles.shortcutIcon}>✣</Text>
            <View>
              <Text style={styles.shortcutTitle}>Lịch mẫu</Text>
              <Text style={styles.shortcutDetail}>PPL, Upper/Lower</Text>
            </View>
          </Pressable>
          <Pressable style={styles.shortcut}>
            <Text style={styles.shortcutIcon}>◷</Text>
            <View>
              <Text style={styles.shortcutTitle}>Lịch sử</Text>
              <Text style={styles.shortcutDetail}>42 buổi tập</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.quoteCard}>
          <Text style={styles.quoteIcon}>ϟ</Text>
          <View style={styles.quoteCopy}>
            <Text style={styles.quoteTitle}>
              "Consistency over perfection."
            </Text>
            <Text style={styles.quoteDetail}>
              Tập đều đặn, kết quả sẽ tự đến.
            </Text>
          </View>
          <Text style={styles.quoteNumber}>99</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 88 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  logo: { width: 30, height: 30 },
  brand: {
    color: colors.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 1,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconButton: { padding: 4 },
  avatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.green, fontSize: 9, fontWeight: "900" },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  greetingCopy: { flex: 1 },
  greeting: { color: colors.text, fontSize: 16, fontWeight: "800" },
  wave: { fontSize: 15 },
  subtitle: { color: colors.muted, fontSize: 10, marginTop: 4 },
  streak: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: 7,
  },
  streakText: { color: "#F5B54B", fontSize: 9, fontWeight: "900" },
  workoutCard: {
    minHeight: 246,
    overflow: "hidden",
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 20,
    position: "relative",
  },
  workoutBackdrop: {
    ...StyleSheet.absoluteFill,
    opacity: 0.65,
    backgroundColor: "#152222",
  },
  weightPlateLarge: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 100,
    backgroundColor: "#223235",
    right: -38,
    bottom: -60,
    borderWidth: 16,
    borderColor: "#2D4141",
  },
  weightPlateSmall: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: "#1C2C2D",
    left: 12,
    bottom: -26,
    borderWidth: 9,
    borderColor: "#304343",
  },
  barbell: {
    position: "absolute",
    height: 7,
    width: "120%",
    backgroundColor: "#5C6B67",
    transform: [{ rotate: "-7deg" }],
    left: -12,
    bottom: 70,
  },
  backdropShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(3, 7, 8, .56)",
  },
  workoutTopline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 13,
  },
  todayBadge: {
    color: colors.green,
    backgroundColor: "#163B18",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 8,
    fontWeight: "900",
  },
  dateBadge: {
    color: colors.muted,
    backgroundColor: "#2A3030",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 9,
    fontWeight: "700",
  },
  workoutInfo: { marginTop: 59, padding: 13 },
  pushTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  pushTitle: { color: colors.text, fontSize: 22, fontWeight: "900" },
  levelBadge: {
    color: colors.orange,
    backgroundColor: "#42291E",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
    fontSize: 8,
    fontWeight: "900",
  },
  workoutDetails: { color: colors.text, fontSize: 10, marginTop: 3 },
  progressRow: { flexDirection: "row", gap: 5, marginTop: 11 },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#465151",
  },
  progressActive: { backgroundColor: colors.green },
  startButton: {
    height: 35,
    borderRadius: 9,
    backgroundColor: colors.green,
    marginTop: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  startIcon: { color: "#0D170B", fontSize: 11 },
  startText: { color: "#0D170B", fontSize: 11, fontWeight: "900" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  sectionAction: { color: colors.green, fontSize: 9, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 7, marginBottom: 20 },
  statCard: {
    flex: 1,
    minHeight: 84,
    padding: 9,
    borderRadius: 9,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: "#222A2C",
  },
  statLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  statLabel: { color: colors.muted, fontSize: 8, fontWeight: "700" },
  statSpark: { color: colors.green, fontSize: 11 },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 9,
    gap: 3,
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "900" },
  statSuffix: { color: colors.green, fontSize: 9, fontWeight: "800" },
  miniDots: { flexDirection: "row", gap: 7, marginTop: 9 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.dim },
  dotActive: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  miniBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    height: 17,
    marginTop: 5,
  },
  barShort: { width: 4, height: 7, backgroundColor: colors.green },
  barMedium: { width: 4, height: 12, backgroundColor: colors.green },
  barTall: { width: 4, height: 17, backgroundColor: colors.green },
  recordText: { color: colors.muted, fontSize: 8, marginTop: 4 },
  recordDelta: {
    color: colors.orange,
    fontSize: 8,
    fontWeight: "700",
    marginTop: 3,
  },
  exerciseList: { gap: 7, marginBottom: 20 },
  exerciseRow: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 9,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: "#222A2C",
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  numberBadgeDone: { backgroundColor: "#1B461B" },
  numberText: { color: colors.muted, fontSize: 10, fontWeight: "900" },
  numberTextDone: { color: colors.green, fontSize: 15 },
  exerciseCopy: { flex: 1, minWidth: 0 },
  exerciseName: { color: colors.text, fontSize: 12, fontWeight: "800" },
  exerciseDetail: { color: colors.muted, fontSize: 8, marginTop: 3 },
  exerciseMeta: { alignItems: "flex-end", marginLeft: 8 },
  exerciseWeight: { color: colors.text, fontSize: 9, fontWeight: "900" },
  exerciseSets: { color: colors.muted, fontSize: 8, marginTop: 2 },
  shortcutsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 15,
  },
  shortcut: {
    width: "48.8%",
    minHeight: 55,
    borderRadius: 9,
    backgroundColor: colors.surfaceRaised,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 9,
  },
  shortcutIcon: {
    color: colors.green,
    fontSize: 19,
    width: 20,
    textAlign: "center",
  },
  shortcutTitle: { color: colors.text, fontSize: 10, fontWeight: "800" },
  shortcutDetail: { color: colors.muted, fontSize: 8, marginTop: 3 },
  quoteCard: {
    minHeight: 57,
    borderRadius: 9,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#222A2C",
  },
  quoteIcon: {
    color: colors.orange,
    fontSize: 25,
    fontWeight: "900",
    marginRight: 9,
  },
  quoteCopy: { flex: 1 },
  quoteTitle: { color: colors.text, fontSize: 9, fontWeight: "800" },
  quoteDetail: { color: colors.muted, fontSize: 8, marginTop: 3 },
  quoteNumber: { color: colors.green, fontSize: 10, fontWeight: "900" },
});

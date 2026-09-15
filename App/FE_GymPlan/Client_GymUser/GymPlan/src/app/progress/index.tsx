import { SharedHeader } from "@/components/common/shared-header";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

const sets = [
  ["Hiệp 1", "50kg ×", "10"],
  ["Hiệp 2", "55kg ×", "10"],
  ["Hiệp 3 (PR)", "60kg ×", "8"],
] as const;

function OverviewCard() {
  return (
    <View style={styles.overviewCard}>
      <View style={styles.overviewItem}>
        <Text style={styles.overviewIcon}>⌁</Text>
        <Text style={styles.overviewLabel}>Buổi tập</Text>
        <Text style={styles.overviewValue}>24</Text>
        <Text style={styles.overviewHint}>Tổng số</Text>
      </View>
      <View style={styles.overviewItem}>
        <Text style={styles.overviewIcon}>♧</Text>
        <Text style={styles.overviewLabel}>Khối lượng</Text>
        <Text style={styles.overviewValue}>142.8</Text>
        <Text style={styles.overviewHint}>Tấn tập</Text>
      </View>
      <View style={styles.overviewItem}>
        <Text style={styles.overviewIcon}>♨</Text>
        <Text style={styles.overviewLabel}>Chuỗi ngày</Text>
        <Text style={[styles.overviewValue, styles.orangeValue]}>
          5 <Text style={styles.fire}>ngày 🔥</Text>
        </Text>
        <Text style={styles.overviewHint}>Kỷ lục tuần</Text>
      </View>
    </View>
  );
}

function SetBoxes({ highlight }: { highlight?: boolean }) {
  return (
    <View style={styles.setRow}>
      {sets.map(([label, value, reps], index) => (
        <View
          key={label}
          style={[styles.setBox, highlight && index === 2 && styles.prSetBox]}
        >
          <Text style={styles.setLabel}>{label}</Text>
          <Text
            style={[
              styles.setValue,
              highlight && index === 2 && styles.prSetValue,
            ]}
          >
            {value}
          </Text>
          <Text
            style={[
              styles.setValue,
              highlight && index === 2 && styles.prSetValue,
            ]}
          >
            {reps}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DetailExercise({
  number,
  title,
  record,
  highlight,
}: {
  number: string;
  title: string;
  record?: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailExercise}>
      <View style={styles.detailTitleRow}>
        <Text style={styles.numberBadge}>{number}</Text>
        <Text numberOfLines={1} style={styles.detailTitle}>
          {title}
        </Text>
        {record ? (
          <Text style={styles.recordBadge}>{record}</Text>
        ) : (
          <Text style={styles.setCount}>3 hiệp</Text>
        )}
      </View>
      <SetBoxes highlight={highlight} />
    </View>
  );
}

function PushWorkout() {
  const [expanded, setExpanded] = useState(true);
  return (
    <View style={styles.workoutCard}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <View style={styles.workoutTopLine}>
          <Text style={styles.dateText}>● 21 THÁNG 7 • 08:30 (HÔM NAY)</Text>
          <Text style={styles.completeBadge}>✓ Hoàn thành</Text>
        </View>
        <View style={styles.workoutTitleRow}>
          <View>
            <Text style={styles.workoutTitle}>Push Day</Text>
            <View style={styles.workoutStats}>
              <Text style={styles.workoutStatsText}>◷ 45 phút</Text>
              <Text style={styles.workoutStatsText}>• ♧ 12.5 Tấn</Text>
              <Text style={styles.workoutStatsText}>• 5 bài tập</Text>
            </View>
          </View>
          <View style={styles.prColumn}>
            <Text style={styles.prBadge}>★ PR MỚI</Text>
            <Text style={styles.prBench}>Bench 60 KG</Text>
          </View>
        </View>
      </Pressable>
      {expanded && (
        <View style={styles.detailBlock}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailHeaderTitle}>
              CHI TIẾT PHIÊN TẬP LUYỆN
            </Text>
            <Text style={styles.heartLink}>Xem biểu đồ nhịp tim</Text>
          </View>
          <DetailExercise
            number="1"
            title="Bench Press (Đẩy ngực phẳng)"
            record="★ Kỷ lục mới"
            highlight
          />
          <DetailExercise number="2" title="Incline Dumbbell Press" />
          <DetailExercise number="3" title="Overhead Shoulder Press" />
          <View style={styles.workoutFooter}>
            <Text style={styles.shareText}>⌯ Chia sẻ buổi tập</Text>
            <Pressable onPress={() => setExpanded(false)}>
              <Text style={styles.collapseText}>Thu gọn tóm tắt ˆ</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function CompactWorkout({
  title,
  date,
  stats,
  tags,
  footer,
  icon,
}: {
  title: string;
  date: string;
  stats: string;
  tags: string[];
  footer: string;
  icon: string;
}) {
  return (
    <View style={styles.compactCard}>
      <View style={styles.compactTop}>
        <Text style={styles.compactDate}>{date}</Text>
        <Text style={styles.savedBadge}>✓ Đã lưu</Text>
      </View>
      <View style={styles.compactTitleRow}>
        <View>
          <Text style={styles.compactTitle}>{title}</Text>
          <Text style={styles.compactStats}>{stats}</Text>
        </View>
        <Text style={styles.compactIcon}>{icon}</Text>
      </View>
      <View style={styles.tags}>
        {tags.map((tag) => (
          <Text key={tag} style={styles.tag}>
            {tag}
          </Text>
        ))}
      </View>
      <View style={styles.compactFooter}>
        <Text style={styles.compactHint}>{footer}</Text>
        <Text style={styles.detailLink}>Xem chi tiết ›</Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SharedHeader
          title="Tiến Trình"
          parentHorizontalPadding={17}
          parentTopPadding={9}
        />
        <OverviewCard />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Text style={styles.activeFilter}>▦ Tất cả (24)</Text>
          <Text style={styles.filter}>▣ Tuần này</Text>
          <Text style={styles.filter}>▣ Tháng này</Text>
        </ScrollView>
        <PushWorkout />
        <CompactWorkout
          title="Pull Day"
          date="18 THÁNG 7 • 17:45 (THỨ SÁU)"
          stats="◷ 50 phút   •   ♧ 15.2 TẤN   •   6 bài tập"
          tags={[
            "Deadlift (120kg)",
            "Lat Pulldown",
            "Barbell Row",
            "Bicep Curls",
          ]}
          footer="4 hiệp mỗi bài • Nghỉ 90s"
          icon="↗"
        />
        <CompactWorkout
          title="Leg Day"
          date="16 THÁNG 7 • 07:15 (THỨ TƯ)"
          stats="◷ 55 phút   •   ♧ 18.0 TẤN   •   5 bài tập"
          tags={[
            "Barbell Squat (100kg)",
            "Leg Press (240kg)",
            "Romanian Deadlift",
          ]}
          footer="Khối lượng cao nhất tháng"
          icon="♨"
        />
        <Pressable style={styles.previousButton}>
          <Text style={styles.previousText}>
            ◴ Xem các tuần trước (19 buổi tập)
          </Text>
        </Pressable>
        <Text style={styles.cloudText}>Tải thêm dữ liệu đồng bộ đám mây</Text>
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

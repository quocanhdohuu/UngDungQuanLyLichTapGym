import { SharedHeader } from "@/components/common/shared-header";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = {
  background: "#0D1112",
  card: "#1B1F20",
  cardRaised: "#202425",
  soft: "#2A2F30",
  text: "#F0F2EF",
  muted: "#B4BCB3",
  dim: "#78817B",
  green: "#8CFF2E",
  orange: "#FF9A32",
};

const filters = ["Tất cả", "Ngực", "Lưng", "Chân", "Vai", "Tay"];
const muscleGroups = [
  ["💪", "Ngực", "24 bài"],
  ["🏋️", "Lưng", "28 bài"],
  ["🦵", "Chân", "32 bài"],
  ["⚡", "Vai", "18 bài"],
  ["💥", "Tay", "22 bài"],
  ["🔥", "Bụng", "16 bài"],
] as const;

const exercises = [
  [
    "NGỰC • BARBELL",
    "Barbell Bench Press",
    "Intermediate",
    "Đẩy ngực ngang thanh đòn",
    "145 kcal",
    "4 sets",
    "#153B35",
  ],
  [
    "NGỰC TRÊN • DUMBBELL",
    "Incline Dumbbell Press",
    "Intermediate",
    "Đẩy ngực trên tạ đơn",
    "130 kcal",
    "3-4 sets",
    "#24404A",
  ],
  [
    "ĐÙI TRƯỚC & MÔNG • BARBELL",
    "Barbell Back Squat",
    "Advanced",
    "Gánh tạ đòn sau lưng",
    "210 kcal",
    "5 sets",
    "#343D30",
  ],
  [
    "LƯNG XÔ • MACHINE",
    "Wide-Grip Lat Pulldown",
    "Beginner",
    "Kéo xô máy tay rộng",
    "110 kcal",
    "3 sets",
    "#302E43",
  ],
  [
    "VAI • BARBELL",
    "Overhead Shoulder Press",
    "Intermediate",
    "Đẩy vai qua đầu với thanh đòn",
    "160 kcal",
    "4 sets",
    "#263B48",
  ],
  [
    "ĐÙI SAU / LƯNG • BARBELL",
    "Romanian Deadlift (RDL)",
    "Intermediate",
    "Kéo tạ đùi sau kích hoạt chuỗi cơ...",
    "190 kcal",
    "4 sets",
    "#303438",
  ],
  [
    "TAY TRƯỚC • DUMBBELL",
    "Incline DB Bicep Curl",
    "Beginner",
    "Cuốn bắp tay ghế dốc",
    "95 kcal",
    "3 sets",
    "#24413C",
  ],
  [
    "BỤNG / CORE • BODYWEIGHT",
    "Hanging Leg Raise",
    "Intermediate",
    "Treo người gập bụng nâng chân",
    "105 kcal",
    "3 sets",
    "#3B3028",
  ],
] as const;

function ExerciseCard({
  exercise,
}: {
  exercise: readonly [string, string, string, string, string, string, string];
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const levelStyle =
    exercise[2] === "Beginner"
      ? styles.beginner
      : exercise[2] === "Advanced"
        ? styles.advanced
        : styles.intermediate;

  return (
    <View style={styles.exerciseCard}>
      <View style={[styles.thumbnail, { backgroundColor: exercise[6] }]}>
        <Text style={styles.thumbnailFigure}>⚒</Text>
      </View>
      <View style={styles.exerciseCopy}>
        <View style={styles.exerciseMetaTop}>
          <Text numberOfLines={1} style={styles.category}>
            {exercise[0]}
          </Text>
          <Text style={[styles.level, levelStyle]}>{exercise[2]}</Text>
        </View>
        <Text numberOfLines={1} style={styles.exerciseName}>
          {exercise[1]}
        </Text>
        <Text numberOfLines={1} style={styles.description}>
          {exercise[3]}
        </Text>
        <View style={styles.exerciseStats}>
          <Text style={styles.stat}>◉ {exercise[4]}</Text>
          <Text style={styles.stat}>◷ {exercise[5]}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => setBookmarked(!bookmarked)}
        hitSlop={8}
        style={styles.bookmark}
      >
        <Text style={[styles.bookmarkIcon, bookmarked && styles.bookmarked]}>
          {bookmarked ? "▮" : "▯"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function TemplatesScreen() {
  const [activeFilter, setActiveFilter] = useState("Tất cả");

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SharedHeader
          title="Thư Viện"
          parentHorizontalPadding={12}
          parentTopPadding={9}
        />
        <Text style={styles.eyebrow}>KHÁM PHÁ &amp; XÂY DỰNG SỨC MẠNH</Text>
        <Text style={styles.heading}>THƯ VIỆN</Text>
        <Text style={styles.intro}>
          Hơn 300 bài tập chuẩn kỹ thuật kèm video 4K và{`\n`}hướng dẫn chi tiết
        </Text>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <SymbolView
              name={{
                ios: "magnifyingglass",
                android: "search",
                web: "search",
              }}
              tintColor={colors.muted}
              size={16}
            />
            <TextInput
              placeholder="Tìm kiếm bài tập (vd: Bench, Squa..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
            <Text style={styles.clear}>×</Text>
          </View>
          <Pressable style={styles.filterButton}>
            <Text style={styles.filterIcon}>☷</Text>
            <Text style={styles.filterDot}>2</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NHÓM CƠ</Text>
          <Text style={styles.sectionAction}>Xem giải phẫu</Text>
        </View>
        <View style={styles.muscleGrid}>
          {muscleGroups.map(([icon, name, count]) => (
            <Pressable key={name} style={styles.muscleCard}>
              <Text style={styles.muscleIcon}>{icon}</Text>
              <Text style={styles.muscleName}>{name}</Text>
              <Text style={styles.muscleCount}>{count}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.sectionHeader, styles.exerciseHeader]}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>DANH SÁCH BÀI TẬP</Text>
            <Text style={styles.countBadge}>24 bài tập</Text>
          </View>
          <Text style={styles.sortText}>≡ Phổ biến nhất</Text>
        </View>
        <View style={styles.exerciseList}>
          {exercises.map((exercise) => (
            <ExerciseCard key={exercise[1]} exercise={exercise} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 12, paddingTop: 9, paddingBottom: 104 },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  brandMark: {
    width: 37,
    height: 37,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { color: colors.green, fontSize: 27, fontWeight: "900" },
  brandCopy: { marginLeft: 10 },
  brand: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 1,
  },
  headerTools: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  headerSpark: { color: colors.muted, fontSize: 21 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 17,
    backgroundColor: "#34403B",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.text, fontSize: 9, fontWeight: "800" },
  eyebrow: {
    color: colors.green,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  heading: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 5,
  },
  intro: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
    marginBottom: 15,
  },
  searchRow: { flexDirection: "row", gap: 7, marginBottom: 10 },
  searchBox: {
    height: 34,
    flex: 1,
    borderRadius: 9,
    backgroundColor: colors.soft,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: 0,
    fontSize: 10,
  },
  clear: { color: colors.muted, fontSize: 17 },
  filterButton: {
    width: 35,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  filterIcon: { color: colors.text, fontSize: 21 },
  filterDot: {
    position: "absolute",
    right: 4,
    top: 3,
    color: colors.orange,
    fontSize: 8,
    fontWeight: "900",
  },
  filterRow: { gap: 8, paddingBottom: 16 },
  filterPill: {
    height: 25,
    borderRadius: 14,
    backgroundColor: colors.soft,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: { backgroundColor: colors.green },
  filterText: { color: colors.text, fontSize: 10, fontWeight: "700" },
  filterTextActive: { color: "#11180D" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  sectionAction: { color: colors.green, fontSize: 9, fontWeight: "800" },
  muscleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 16,
  },
  muscleCard: {
    width: "31.8%",
    height: 67,
    borderRadius: 9,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  muscleIcon: { fontSize: 19, marginBottom: 2 },
  muscleName: { color: colors.text, fontSize: 10, fontWeight: "800" },
  muscleCount: { color: colors.dim, fontSize: 8, marginTop: 1 },
  exerciseHeader: { marginBottom: 8 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  countBadge: {
    color: colors.muted,
    backgroundColor: colors.soft,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 8,
  },
  sortText: { color: colors.green, fontSize: 9, fontWeight: "800" },
  exerciseList: { gap: 7 },
  exerciseCard: {
    minHeight: 89,
    borderRadius: 10,
    backgroundColor: colors.card,
    padding: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 70,
    height: 74,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  thumbnailFigure: { color: "#BFD5C5", fontSize: 28 },
  exerciseCopy: { flex: 1, minWidth: 0 },
  exerciseMetaTop: { flexDirection: "row", alignItems: "center", gap: 5 },
  category: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 7,
    fontWeight: "900",
  },
  level: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 7,
    fontWeight: "900",
  },
  beginner: { color: "#1A270F", backgroundColor: colors.green },
  intermediate: { color: "#281C0B", backgroundColor: "#F2A632" },
  advanced: { color: "#45160D", backgroundColor: "#E67C61" },
  exerciseName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
  },
  description: { color: colors.muted, fontSize: 9, marginTop: 2 },
  exerciseStats: { flexDirection: "row", gap: 11, marginTop: 5 },
  stat: { color: colors.muted, fontSize: 8 },
  bookmark: { alignSelf: "flex-start", padding: 3, marginLeft: 4 },
  bookmarkIcon: { color: colors.muted, fontSize: 19 },
  bookmarked: { color: colors.green },
});

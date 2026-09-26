import { View } from "react-native";

export const muscleCategories = ["Ngực", "Lưng", "Chân", "Vai", "Tay", "Bụng"] as const;
export type MuscleCategory = typeof muscleCategories[number];
export const normalizeSearch = (text: string) => text.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
const groups: Record<MuscleCategory, string[]> = {
  Ngực: ["chest", "pectorals", "nguc"],
  Lưng: ["lats", "upper back", "lower back", "traps", "lung"],
  Chân: ["quadriceps", "hamstrings", "glutes", "calves", "chan", "mong", "dui", "bap chan"],
  Vai: ["front delts", "rear delts", "side delts", "shoulders", "vai"],
  Tay: ["biceps", "triceps", "forearms", "tay", "tay truoc", "tay sau", "cang tay"],
  Bụng: ["abs", "abdominals", "obliques", "bung"],
};
export function categoriesFor(muscles: string | null | undefined): MuscleCategory[] {
  const names = (muscles || "").split(",").map(name => normalizeSearch(name.trim()));
  return muscleCategories.filter(category => groups[category].some(name => names.includes(name)));
}

// A schematic body map drawn with native shapes, usable offline on all platforms.
export function MuscleMap({ category }: { category: MuscleCategory }) {
  const fill = (region: MuscleCategory) => category === region ? "#8CFF2E" : "#52615B";
  const shape = (left: number, top: number, width: number, height: number, color: string, radius = 7) =>
    ({ position: "absolute" as const, left, top, width, height, borderRadius: radius, backgroundColor: color });
  return <View accessible accessibilityLabel={"Sơ đồ vùng cơ " + category.toLowerCase()} style={{ width: 70, height: 110, alignSelf: "center", marginBottom: 8 }}>
    <View style={shape(27, 0, 16, 18, "#83948B", 10)} />
    <View style={shape(20, 21, 30, 45, "#52615B")} />
    <View style={shape(10, 22, 12, 16, fill("Vai"))} /><View style={shape(48, 22, 12, 16, fill("Vai"))} />
    <View style={shape(8, 39, 10, 30, fill("Tay"))} /><View style={shape(52, 39, 10, 30, fill("Tay"))} />
    {category === "Lưng" ? <View style={shape(22, 24, 26, 37, fill("Lưng"))} /> : <>
      <View style={shape(22, 25, 12, 15, fill("Ngực"), 4)} /><View style={shape(36, 25, 12, 15, fill("Ngực"), 4)} />
      <View style={shape(26, 43, 18, 19, fill("Bụng"), 4)} />
    </>}
    <View style={shape(21, 67, 12, 40, fill("Chân"))} /><View style={shape(37, 67, 12, 40, fill("Chân"))} />
  </View>;
}

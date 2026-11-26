import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { nutritionApi } from "@/services/nutrition-api";

interface IngredientItem {
  ingredientId: number;
  code: string;
  nameVi: string;
  nameEn?: string;
  category: string;
  kcalPerGram: number;
  proteinPerGram: number;
  carbPerGram: number;
  fatPerGram: number;
  servingSizeGrams: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (ingredient: IngredientItem, grams: number) => void;
}

const CATEGORIES = [
  { id: "ALL", label: "Tất cả" },
  { id: "PROTEIN", label: "Đạm (Protein)" },
  { id: "CARB", label: "Tinh bột (Carb)" },
  { id: "VEG", label: "Rau củ" },
  { id: "FAT", label: "Chất béo tốt" },
  { id: "DAIRY", label: "Sữa" },
];

export function IngredientSearchModal({ visible, onClose, onSelect }: Props) {
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadIngredients();
    }
  }, [visible, keyword, selectedCategory]);

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const data = await nutritionApi.searchIngredients(
        keyword,
        selectedCategory === "ALL" ? undefined : selectedCategory
      );
      setIngredients(data);
    } catch (error) {
      console.warn("Lỗi tải danh mục nguyên liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoose = (item: IngredientItem) => {
    const defaultGrams = Number(item.servingSizeGrams) || 100;
    onSelect(item, defaultGrams);
    onClose();
  };

  const renderBadge = (category: string) => {
    let color = "#757575";
    let bg = "#2C2C2C";
    if (category === "PROTEIN") {
      color = "#FF5252";
      bg = "rgba(255, 82, 82, 0.15)";
    } else if (category === "CARB") {
      color = "#FFB300";
      bg = "rgba(255, 179, 0, 0.15)";
    } else if (category === "VEG") {
      color = "#4CAF50";
      bg = "rgba(76, 175, 80, 0.15)";
    } else if (category === "FAT") {
      color = "#00BCD4";
      bg = "rgba(0, 188, 212, 0.15)";
    }
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>{category}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Thêm món ăn / Nguyên liệu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Ô tìm kiếm */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm: ức gà, cơm, trứng, chuối..."
              placeholderTextColor="#888"
              value={keyword}
              onChangeText={setKeyword}
              autoCapitalize="none"
            />
            {keyword.length > 0 && (
              <TouchableOpacity onPress={() => setKeyword("")}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Phân loại danh mục */}
          <View style={styles.categoryScroll}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const active = selectedCategory === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.catPill, active && styles.catPillActive]}
                    onPress={() => setSelectedCategory(item.id)}
                  >
                    <Text style={[styles.catText, active && styles.catTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Danh sách kết quả */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#FF5722" />
              <Text style={styles.loadingText}>Đang tra cứu danh mục...</Text>
            </View>
          ) : (
            <FlatList
              data={ingredients}
              keyExtractor={(item) => String(item.ingredientId)}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Không tìm thấy nguyên liệu phù hợp.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const kcal100 = (Number(item.kcalPerGram) * 100).toFixed(0);
                const p100 = (Number(item.proteinPerGram) * 100).toFixed(1);
                const c100 = (Number(item.carbPerGram) * 100).toFixed(1);
                const f100 = (Number(item.fatPerGram) * 100).toFixed(1);

                return (
                  <TouchableOpacity style={styles.itemCard} onPress={() => handleChoose(item)}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.nameVi}</Text>
                      {renderBadge(item.category)}
                    </View>
                    <Text style={styles.itemSub}>
                      Khẩu phần mẫu: {item.servingSizeGrams}g | Trong 100g: {kcal100} kcal (P: {p100}g • C: {c100}g • F: {f100}g)
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "65%",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#CCC",
    fontSize: 16,
    fontWeight: "bold",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  clearIcon: {
    color: "#999",
    fontSize: 16,
    paddingHorizontal: 4,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#2C2C2E",
    marginRight: 8,
  },
  catPillActive: {
    backgroundColor: "#FF5722",
  },
  catText: {
    color: "#AAAAAA",
    fontSize: 13,
    fontWeight: "500",
  },
  catTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: "#252528",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333336",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  itemSub: {
    color: "#999999",
    fontSize: 12,
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  loadingBox: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    color: "#888",
    marginTop: 8,
    fontSize: 13,
  },
  emptyBox: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
  },
});

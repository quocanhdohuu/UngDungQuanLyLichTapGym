import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BodyMetricItem,
  formatDate,
  formatNumber,
  levelLabel,
  userApi,
} from "@/services/user-api";

const colors = {
  background: "#0D1112",
  card: "#1B1F20",
  surface: "#272B2D",
  soft: "#303436",
  text: "#ECEFEC",
  muted: "#BBC2B8",
  dim: "#7C857C",
  green: "#8CFF2E",
  greenDark: "#21451E",
  red: "#FF9C9C",
};

export function BodyMetricHistory({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<BodyMetricItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const items = await userApi.bodyMetrics();
      setData(items || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải lịch sử thể trạng. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchHistory();
    }
  }, [visible, fetchHistory]);

  const formatRecordedDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return formatDate(dateStr);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return formatDate(dateStr);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <View style={styles.topNav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={onClose}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹ Quay lại</Text>
          </Pressable>
          <Text style={styles.navTitle}>Chi tiết thể trạng</Text>
          <View style={styles.navPlaceholder} />
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchHistory(true)}
              tintColor={colors.green}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {loading && !refreshing && (
            <View style={styles.centerBox}>
              <ActivityIndicator
                size="large"
                color={colors.green}
                accessibilityLabel="Đang tải lịch sử thể trạng"
              />
              <Text style={styles.loadingText}>Đang tải lịch sử thể trạng...</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => fetchHistory()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          )}

          {!loading && !error && data && data.length === 0 && (
            <View style={styles.centerBox}>
              <Text style={styles.emptyIcon}>▤</Text>
              <Text style={styles.emptyText}>Chưa có lịch sử thể trạng nào.</Text>
            </View>
          )}

          {!loading &&
            !error &&
            data &&
            data.length > 0 && (
              <View style={styles.listContainer}>
                <Text style={styles.sectionSubtitle}>
                  TỔNG CỘNG {data.length} LẦN GHI NHẬN
                </Text>

                {data.map((item, index) => {
                  const isLatest = index === 0;
                  return (
                    <View
                      key={item.metricId || index}
                      style={[
                        styles.recordCard,
                        isLatest && styles.recordCardLatest,
                      ]}
                    >
                      <View style={styles.recordHeader}>
                        <View style={styles.dateGroup}>
                          <Text style={styles.calendarIcon}>▤</Text>
                          <Text style={styles.recordDate}>
                            {formatRecordedDate(item.recordedAt)}
                          </Text>
                        </View>
                        {isLatest && (
                          <View style={styles.latestBadge}>
                            <Text style={styles.latestBadgeText}>MỚI NHẤT</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.measureRow}>
                        <View style={styles.measureBox}>
                          <Text style={styles.measureLabel}>Chiều cao</Text>
                          <Text style={styles.measureValue}>
                            {item.height != null
                              ? `${formatNumber(item.height)} cm`
                              : "—"}
                          </Text>
                        </View>
                        <View style={styles.measureBox}>
                          <Text style={styles.measureLabel}>Cân nặng</Text>
                          <Text style={styles.measureValue}>
                            {item.weight != null
                              ? `${formatNumber(item.weight)} kg`
                              : "—"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailList}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>• Trình độ:</Text>
                          <Text style={styles.detailValue}>
                            {item.level ? levelLabel(item.level) : "—"}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>• Mục tiêu:</Text>
                          <Text style={styles.detailValue}>
                            {item.goal || "—"}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>• Tần suất:</Text>
                          <Text style={styles.detailValue}>
                            {item.sessionsPerWeek != null
                              ? `${item.sessionsPerWeek} buổi/tuần`
                              : "—"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
    paddingTop:60,
  },
  backButton: {
    paddingRight: 12,
  },
  backText: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "800",
  },
  navTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  navPlaceholder: {
    width: 60,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 40,
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  errorText: {
    color: colors.red,
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: colors.green,
    fontWeight: "800",
    fontSize: 13,
  },
  emptyIcon: {
    color: colors.dim,
    fontSize: 32,
    marginBottom: 4,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
  },
  listContainer: {
    gap: 16,
  },
  sectionSubtitle: {
    color: colors.dim,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recordCard: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: "#262C2E",
  },
  recordCardLatest: {
    borderColor: colors.greenDark,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#252B2D",
  },
  dateGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarIcon: {
    color: colors.green,
    fontSize: 16,
  },
  recordDate: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  latestBadge: {
    backgroundColor: "#202A1F",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.greenDark,
  },
  latestBadgeText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "900",
  },
  measureRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  measureBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
  },
  measureLabel: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6,
  },
  measureValue: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  detailList: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
});

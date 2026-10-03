import { DataState } from "@/components/common/data-state";
import { ChangePassword } from "@/components/common/change-password";
import { BodyMetricHistory } from "@/components/common/body-metric-history";
import { useApiData } from "@/hooks/use-api-data";
import { apiRequest } from "@/services/api";
import {
  formatDate,
  levelLabel,
  Profile,
  ProfileUpdate,
  userApi,
} from "@/services/user-api";
import { clearAuthSession, getAuthSession, initials } from "@/auth-session";
import { SharedHeader } from "@/components/common/shared-header";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  orange: "#FF951F",
  red: "#FF9C9C",
};

function Stepper({
  value,
  unit,
  onChange,
}: {
  value: string;
  unit: string;
  onChange: (value: string) => void;
}) {
  const step = (delta: number) => {
    if (!value.trim() || !Number.isFinite(Number(value))) return;
    onChange(
      String(
        Math.min(
          999.99,
          Math.max(0.1, Math.round((Number(value) + delta) * 100) / 100),
        ),
      ),
    );
  };
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepButton} onPress={() => step(-1)}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <View
        style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}
      >
        <TextInput
          accessibilityLabel={unit === "cm" ? "Chiều cao" : "Cân nặng"}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={colors.muted}
          style={styles.stepValue}
        />
        <Text style={[styles.stepValue, styles.stepUnit]}> {unit}</Text>
      </View>
      <Pressable style={styles.stepButton} onPress={() => step(1)}>
        <Text style={styles.stepText}>＋</Text>
      </Pressable>
    </View>
  );
}

function OptionRow({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.optionSection}>
      <Text style={styles.optionTitle}>{title}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.option, option === selected && styles.optionActive]}
          >
            <Text
              style={[
                styles.optionText,
                option === selected && styles.optionTextActive,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AccountRow({
  icon,
  title,
  detail,
  toggle,
  danger,
  onPress,
}: {
  icon: string;
  title: string;
  detail?: string;
  toggle?: boolean;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.accountRow}>
      <View style={[styles.accountIcon, danger && styles.dangerIcon]}>
        <Text style={[styles.accountIconText, danger && styles.dangerText]}>
          {icon}
        </Text>
      </View>
      <View style={styles.accountCopy}>
        <Text style={[styles.accountTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {detail && (
          <Text
            style={[
              styles.accountDetail,
              detail === "Đang kích hoạt" && styles.activeDetail,
            ]}
          >
            {detail}
          </Text>
        )}
      </View>
      {toggle ? (
        <View style={styles.toggle}>
          <View style={styles.toggleKnob} />
        </View>
      ) : (
        <Text style={[styles.accountArrow, danger && styles.dangerText]}>
          ›
        </Text>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const [changingPassword, setChangingPassword] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(false);
  const state = useApiData(userApi.profile);
  const profile = state.data;
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Profile["gender"]>(null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [frequency, setFrequency] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setGender(profile.gender);
    setHeight(profile.height == null ? "" : String(profile.height));
    setWeight(profile.weight == null ? "" : String(profile.weight));
    setLevel(levelLabel(profile.level));
    setGoal(profile.goal || "");
    setFrequency(
      profile.sessionsPerWeek == null ? "" : `${profile.sessionsPerWeek} buổi`,
    );
  }, [profile]);

  const save = async () => {
    if (saving || !profile) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const metric = (value: string) => {
        if (!value.trim()) return null;
        const result = Number(value.replace(",", "."));
        if (!Number.isFinite(result) || result <= 0 || result > 999.99)
          throw new Error("Chiều cao/cân nặng không hợp lệ.");
        return result;
      };
      if (!fullName.trim()) throw new Error("Họ tên không được để trống.");
      await userApi.updateProfile({
        fullName: fullName.trim(),
        gender,
        level: level.toUpperCase() as ProfileUpdate["level"],
        goal: goal || null,
        sessionsPerWeek: frequency ? Number.parseInt(frequency, 10) : null,
        height: metric(height),
        weight: metric(weight),
      });
      await state.refresh();
      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Không thể lưu hồ sơ.",
      );
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const session = getAuthSession();
      if (session) {
        await apiRequest("/auth/logout", {
          method: "POST",
          body: JSON.stringify({
            accountId: session.accountId,
            loginSessionId: session.loginSessionId,
          }),
        });
      }
    } catch {
      // Always clear this device session, including when the server is unavailable.
    } finally {
      clearAuthSession();
      router.replace("/");
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={state.loading}
            onRefresh={state.refresh}
            enabled={!saving}
            tintColor={colors.green}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SharedHeader
          title="Cá Nhân"
          parentHorizontalPadding={34}
          parentTopPadding={13}
        />

        <DataState {...state} retry={state.refresh} />
        <DataState loading={false} error={saveError} retry={save} />
        {saved && (
          <Text style={styles.updated}>
            Đã lưu thay đổi{state.error ? "; vui lòng thử tải lại hồ sơ" : ""}.
          </Text>
        )}
        {profile && (
          <View pointerEvents={saving ? "none" : "auto"}>
            <View style={styles.profileCard}>
              <View style={styles.largeAvatar}>
                <Text style={styles.largeAvatarText}>
                  {initials(profile.fullName)}
                </Text>
                <View style={styles.camera}>
                  <Text style={styles.cameraText}>▣</Text>
                </View>
              </View>
              <View style={styles.profileCopy}>
                <View style={styles.nameRow}>
                  <TextInput
                    accessibilityLabel="Họ tên"
                    value={fullName}
                    onChangeText={setFullName}
                    maxLength={100}
                    style={styles.profileName}
                  />
                </View>
                <Text style={styles.email}>{profile.email}</Text>
                <Pressable
                  accessibilityLabel="Thay đổi giới tính"
                  onPress={() =>
                    setGender(
                      gender === "MALE"
                        ? "FEMALE"
                        : gender === "FEMALE"
                          ? "OTHER"
                          : "MALE",
                    )
                  }
                >
                  <Text style={styles.proBadge}>
                    {gender === "MALE"
                      ? "Nam"
                      : gender === "FEMALE"
                        ? "Nữ"
                        : gender === "OTHER"
                          ? "Khác"
                          : "Chưa có giới tính"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.bodyCard}>
              <View style={styles.cardTitleRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xem chi tiết thể trạng"
                  onPress={() => setViewingHistory(true)}
                  style={styles.cardTitleGroup}
                >
                  <Text style={styles.cardTitleIcon}>▤</Text>
                  <Text style={styles.cardTitle}>Thông tin thể trạng</Text>
                  <Text style={styles.updated}>
                    {profile.bodyMetricUpdatedAt
                      ? formatDate(profile.bodyMetricUpdatedAt)
                      : "Chưa có chỉ số"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Chi tiết thể trạng"
                  onPress={() => setViewingHistory(true)}
                  style={styles.detailLink}
                >
                  <Text style={styles.detailLinkText}>Chi tiết ›</Text>
                </Pressable>
              </View>
              <View style={styles.measureRow}>
                <View style={styles.measure}>
                  <Text style={styles.measureLabel}>Chiều cao</Text>
                  <Stepper value={height} unit="cm" onChange={setHeight} />
                </View>
                <View style={styles.measure}>
                  <Text style={styles.measureLabel}>Cân nặng</Text>
                  <Stepper value={weight} unit="kg" onChange={setWeight} />
                </View>
              </View>
              <OptionRow
                title="TRÌNH ĐỘ LUYỆN TẬP"
                options={["Beginner", "Intermediate", "Advanced"]}
                selected={level}
                onSelect={setLevel}
              />
              <OptionRow
                title="MỤC TIÊU CHÍNH"
                options={Array.from(
                  new Set([
                    "Tăng cơ",
                    "Giảm mỡ",
                    "Sức bền",
                    ...(goal ? [goal] : []),
                  ]),
                )}
                selected={goal}
                onSelect={setGoal}
              />
              <OptionRow
                title="TẦN SUẤT TẬP / TUẦN"
                options={Array.from(
                  new Set([
                    "3 buổi",
                    "4 buổi",
                    "5 buổi",
                    "6 buổi",
                    ...(frequency ? [frequency] : []),
                  ]),
                )}
                selected={frequency}
                onSelect={setFrequency}
              />
            </View>

            <Pressable
              style={styles.saveButton}
              onPress={save}
              disabled={saving || state.loading}
            >
              <Text style={styles.saveText}>
                {saving ? "ĐANG LƯU..." : "✓ LƯU THAY ĐỔI"}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <Text style={styles.accountHeaderIcon}>☷</Text>
            <Text style={styles.accountHeaderTitle}>Cài đặt tài khoản</Text>
          </View>
          <AccountRow
            icon="▣"
            title="Đổi mật khẩu & Bảo mật"
            onPress={() => setChangingPassword(true)}
          />
          <AccountRow
            icon="⇥"
            title={loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            danger
            onPress={logout}
          />
        </View>
      </ScrollView>
      <ChangePassword
        visible={changingPassword}
        onClose={() => setChangingPassword(false)}
      />
      <BodyMetricHistory
        visible={viewingHistory}
        onClose={() => setViewingHistory(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 34, paddingTop: 13, paddingBottom: 105 },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 39,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 39, height: 39 },
  brand: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 1,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 22 },
  notification: { position: "relative", padding: 4 },
  notificationDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: colors.green,
    top: 1,
    right: 0,
  },
  smallAvatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#38443E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.text, fontSize: 9, fontWeight: "900" },
  profileCard: {
    minHeight: 147,
    borderRadius: 15,
    backgroundColor: colors.card,
    padding: 25,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  largeAvatar: {
    width: 91,
    height: 91,
    borderRadius: 47,
    backgroundColor: "#35453F",
    borderWidth: 6,
    borderColor: "#303838",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  largeAvatarText: { color: colors.text, fontSize: 25, fontWeight: "900" },
  camera: {
    position: "absolute",
    right: -5,
    bottom: -2,
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraText: { color: "#13200E", fontSize: 18 },
  profileCopy: { flex: 1, marginLeft: 19, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { color: colors.text, fontSize: 23, fontWeight: "900" },
  vip: {
    color: "#3A2007",
    backgroundColor: colors.orange,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 15,
    fontWeight: "900",
  },
  email: { color: colors.muted, fontSize: 15, marginTop: 7 },
  proBadge: {
    color: colors.green,
    backgroundColor: "#202526",
    alignSelf: "flex-start",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 14,
  },
  bodyCard: {
    borderRadius: 15,
    backgroundColor: colors.card,
    padding: 19,
    marginBottom: 24,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cardTitleGroup: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  cardTitleIcon: { color: colors.green, fontSize: 20 },
  cardTitle: { color: colors.text, fontSize: 21, fontWeight: "900" },
  updated: { color: colors.muted, fontSize: 13 },
  detailLink: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 7,
    backgroundColor: colors.surface,
  },
  detailLinkText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "800",
  },
  measureRow: { flexDirection: "row", gap: 14, marginBottom: 20 },
  measure: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
  },
  measureLabel: { color: colors.muted, fontSize: 15, marginBottom: 10 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepButton: {
    width: 39,
    height: 39,
    borderRadius: 9,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: colors.text, fontSize: 24, lineHeight: 26 },
  stepValue: { color: colors.text, fontSize: 23, fontWeight: "900" },
  stepUnit: { fontSize: 16, fontWeight: "800" },
  optionSection: { marginBottom: 18 },
  optionTitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  optionRow: { flexDirection: "row", gap: 9 },
  option: {
    flex: 1,
    minHeight: 49,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  optionActive: { backgroundColor: colors.green },
  optionText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  optionTextActive: { color: "#203012" },
  saveButton: {
    height: 58,
    borderRadius: 15,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: colors.green,
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 4,
  },
  saveText: { color: "#18300D", fontSize: 19, fontWeight: "900" },
  accountCard: { borderRadius: 15, backgroundColor: colors.card, padding: 19 },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  accountHeaderIcon: { color: colors.muted, fontSize: 23 },
  accountHeaderTitle: { color: colors.text, fontSize: 22, fontWeight: "900" },
  accountRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 9,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  accountIconText: { color: colors.text, fontSize: 21 },
  accountCopy: { flex: 1, minWidth: 0 },
  accountTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  accountDetail: { color: colors.muted, fontSize: 14, marginTop: 3 },
  activeDetail: { color: colors.green },
  accountArrow: { color: colors.muted, fontSize: 28 },
  dangerIcon: { backgroundColor: "#402021" },
  dangerText: { color: colors.red },
  toggle: {
    width: 51,
    height: 29,
    borderRadius: 16,
    backgroundColor: "#0C0F10",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignSelf: "flex-end",
  },
});

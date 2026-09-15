import { clearAuthSession, getAuthSession } from "@/auth-session";
import { SharedHeader } from "@/components/common/shared-header";
import { router } from "expo-router";
import { useState } from "react";
import {
  Platform,
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

function Stepper({ value, unit }: { value: string; unit: string }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepButton}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>
        {value} <Text style={styles.stepUnit}>{unit}</Text>
      </Text>
      <Pressable style={styles.stepButton}>
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
  const [level, setLevel] = useState("Intermediate");
  const [goal, setGoal] = useState("Tăng cơ");
  const [frequency, setFrequency] = useState("5 buổi");
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const session = getAuthSession();
      if (session) {
        const apiBaseUrl =
          Platform.OS === "web" && typeof window !== "undefined"
            ? `http://${window.location.hostname}:3000`
            : "http://172.20.10.6:3000";

        await fetch(`${apiBaseUrl}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(session),
        });
      }
    } finally {
      clearAuthSession();
      router.replace("/");
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SharedHeader
          title="Cá Nhân"
          parentHorizontalPadding={34}
          parentTopPadding={13}
        />

        <View style={styles.profileCard}>
          <View style={styles.largeAvatar}>
            <Text style={styles.largeAvatarText}>QA</Text>
            <View style={styles.camera}>
              <Text style={styles.cameraText}>▣</Text>
            </View>
          </View>
          <View style={styles.profileCopy}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>Quoc Anh</Text>
              <Text style={styles.vip}>VIP</Text>
            </View>
            <Text style={styles.email}>quocanh.fit@gymforlife.app</Text>
            <Text style={styles.proBadge}>✿ PRO ATHLETE</Text>
          </View>
        </View>

        <View style={styles.bodyCard}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardTitleIcon}>▤</Text>
              <Text style={styles.cardTitle}>Thông tin thể trạng</Text>
            </View>
            <Text style={styles.updated}>Cập nhật hôm nay</Text>
          </View>
          <View style={styles.measureRow}>
            <View style={styles.measure}>
              <Text style={styles.measureLabel}>Chiều cao</Text>
              <Stepper value="175" unit="cm" />
            </View>
            <View style={styles.measure}>
              <Text style={styles.measureLabel}>Cân nặng</Text>
              <Stepper value="67.0" unit="kg" />
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
            options={["Tăng cơ", "Giảm mỡ", "Sức bền"]}
            selected={goal}
            onSelect={setGoal}
          />
          <OptionRow
            title="TẦN SUẤT TẬP / TUẦN"
            options={["3 buổi", "4 buổi", "5 buổi", "6 buổi"]}
            selected={frequency}
            onSelect={setFrequency}
          />
        </View>

        <Pressable style={styles.saveButton}>
          <Text style={styles.saveText}>✓ LƯU THAY ĐỔI</Text>
        </Pressable>

        <View style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <Text style={styles.accountHeaderIcon}>☷</Text>
            <Text style={styles.accountHeaderTitle}>Cài đặt tài khoản</Text>
          </View>
          <AccountRow icon="▣" title="Đổi mật khẩu & Bảo mật" />
          <AccountRow
            icon="♡"
            title="Đồng bộ Apple Health / Fit"
            detail="Đang kích hoạt"
            toggle
          />
          <AccountRow
            icon="♧"
            title="Thông báo & Lời nhắc"
            detail="18:00 mỗi ngày"
          />
          <AccountRow
            icon="⇥"
            title={loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            danger
            onPress={logout}
          />
        </View>
      </ScrollView>
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
  cardTitleGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitleIcon: { color: colors.green, fontSize: 20 },
  cardTitle: { color: colors.text, fontSize: 21, fontWeight: "900" },
  updated: { color: colors.muted, fontSize: 13 },
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

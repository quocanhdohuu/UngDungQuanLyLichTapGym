import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthMode = "login" | "register";

const GREEN = "#8CFF2E";
const colors = {
  background: "#080A0C",
  card: "#101416",
  input: "#202427",
  surface: "#171B1D",
  border: "#3A4044",
  text: "#F5F7F8",
  secondary: "#A7ADB0",
  muted: "#6E777B",
};

function Glyph({ children, style }: { children: string; style?: object }) {
  return <Text style={[styles.glyph, style]}>{children}</Text>;
}

function AuthLogo() {
  return (
    <View style={styles.logoBlock}>
      <View style={styles.logoMark}>
        <Image
          source={require("../components/image/logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.brand}>GYMFORLIFE</Text>
      <Text style={styles.slogan}>STRONGER • HEALTHIER • HAPPIER</Text>
    </View>
  );
}

function AuthTabs({
  mode,
  onChange,
}: {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
}) {
  return (
    <View style={styles.tabs}>
      {(["login", "register"] as const).map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onChange(tab)}
          style={[styles.tab, mode === tab && styles.activeTab]}
        >
          <Text style={[styles.tabText, mode === tab && styles.activeTabText]}>
            {tab === "login" ? "Đăng nhập" : "Đăng ký"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function AuthInput({
  label,
  value,
  onChangeText,
  icon,
  secureTextEntry,
  onToggleSecure,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: string;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error && styles.inputError]}>
        <Glyph>{icon}</Glyph>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          style={styles.input}
        />
        {onToggleSecure && (
          <Pressable onPress={onToggleSecure} hitSlop={10}>
            <Glyph style={styles.eye}>{secureTextEntry ? "◉" : "◌"}</Glyph>
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function Checkbox({
  checked,
  onPress,
}: {
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.checkbox, checked && styles.checked]}
    >
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </Pressable>
  );
}

function AuthDivider({ register }: { register: boolean }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.divider} />
      <Text style={styles.dividerText}>
        {register ? "HOẶC ĐĂNG KÝ VỚI" : "HOẶC TIẾP TỤC VỚI"}
      </Text>
      <View style={styles.divider} />
    </View>
  );
}

function SocialLoginButtons() {
  return (
    <View style={styles.socialRow}>
      <Pressable style={styles.socialButton}>
        <Text style={[styles.socialIcon, { color: "#4285F4" }]}>G</Text>
      </Pressable>
      <Pressable style={styles.socialButton}>
        <Image
          source={require("../components/image/logoApple.png")}
          style={styles.imageApple}
          resizeMode="contain"
        />
      </Pressable>
      <Pressable style={styles.socialButton}>
        <Text style={[styles.socialIcon, { color: "#1877F2" }]}>f</Text>
      </Pressable>
    </View>
  );
}

function AuthFooter({
  register,
  onPress,
}: {
  register: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerPrompt}>
        {register ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
        <Text onPress={onPress} style={styles.greenText}>
          {register ? "Đăng nhập ngay" : "Đăng ký ngay"}
        </Text>
      </Text>
      <View style={styles.performance}>
        <Text style={styles.flash}>ϟ</Text>
        <Text style={styles.performanceText}>READY FOR PEAK PERFORMANCE</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("athlete@gymforlife.app");
  const [name, setName] = useState("Nguyễn Văn A");
  const [password, setPassword] = useState("strongpassword");
  const [confirmPassword, setConfirmPassword] = useState("strongpassword");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(true);
  const [terms, setTerms] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (mode === "login") {
      if (!email.includes("@")) nextErrors.email = "Email không hợp lệ.";
      if (!password) nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else {
      if (!name.trim()) nextErrors.name = "Vui lòng nhập họ và tên.";
      if (!email.includes("@")) nextErrors.email = "Email không hợp lệ.";
      if (password.length < 8)
        nextErrors.password = "Mật khẩu chưa đáp ứng yêu cầu.";
      if (password !== confirmPassword)
        nextErrors.confirm = "Mật khẩu xác nhận không khớp.";
      if (!terms) nextErrors.terms = "Vui lòng đồng ý với điều khoản sử dụng.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 900);
  };

  const register = mode === "register";
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <AuthLogo />
          <AuthTabs
            mode={mode}
            onChange={(nextMode) => {
              setMode(nextMode);
              setErrors({});
            }}
          />
          {register && (
            <AuthInput
              label="HỌ VÀ TÊN"
              value={name}
              onChangeText={setName}
              icon="👤"
              error={errors.name}
            />
          )}
          <AuthInput
            label={register ? "EMAIL" : "EMAIL HOẶC SỐ ĐIỆN THOẠI"}
            value={email}
            onChangeText={setEmail}
            icon="✉"
            error={errors.email}
          />
          <AuthInput
            label="MẬT KHẨU"
            value={password}
            onChangeText={setPassword}
            icon="♙"
            secureTextEntry={!showPassword}
            onToggleSecure={() => setShowPassword(!showPassword)}
            error={errors.password}
          />
          {register && (
            <AuthInput
              label="XÁC NHẬN MẬT KHẨU"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon="ↄ"
              secureTextEntry={!showConfirm}
              onToggleSecure={() => setShowConfirm(!showConfirm)}
              error={errors.confirm}
            />
          )}
          {!register ? (
            <View style={styles.rememberRow}>
              <Pressable
                onPress={() => setRemember(!remember)}
                style={styles.rememberGroup}
              >
                <Checkbox
                  checked={remember}
                  onPress={() => setRemember(!remember)}
                />
                <Text style={styles.smallText}>Ghi nhớ đăng nhập</Text>
              </Pressable>
              <Pressable>
                <Text style={styles.greenText}>Quên mật khẩu?</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.termsRow}>
              <Checkbox checked={terms} onPress={() => setTerms(!terms)} />
              <Text style={styles.termsText}>
                Tôi đồng ý với{" "}
                <Text style={styles.link}>Điều khoản sử dụng</Text> và{" "}
                <Text style={styles.link}>Chính sách bảo mật</Text> của
                GYMFORLIFE.
              </Text>
            </View>
          )}
          {!!errors.terms && (
            <Text style={styles.errorText}>{errors.terms}</Text>
          )}
          <Pressable
            onPress={submit}
            style={styles.primaryButton}
            disabled={loading}
          >
            <Text style={styles.primaryText}>
              {loading
                ? register
                  ? "ĐANG TẠO TÀI KHOẢN..."
                  : "ĐANG ĐĂNG NHẬP..."
                : register
                  ? "TẠO TÀI KHOẢN  →"
                  : "ĐĂNG NHẬP  →"}
            </Text>
          </Pressable>
          <AuthDivider register={register} />
          <SocialLoginButtons />
          <AuthFooter
            register={register}
            onPress={() => {
              setMode(register ? "login" : "register");
              setErrors({});
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1, width: "100%", backgroundColor: colors.background },
  scrollView: { flex: 1, width: "100%" },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    alignItems: "stretch",
    padding: 0,
  },
  card: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.card,
    padding: 16,
    zIndex: 1,
  },
  logoBlock: { alignItems: "center", marginBottom: 14 },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#1D2425",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  imageApple: {
    width: 18,
    height: 18,
    tintColor: "#FFFFFF",
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  logoArc: {
    position: "absolute",
    color: GREEN,
    fontSize: 47,
    fontWeight: "700",
    transform: [{ rotate: "-45deg" }],
  },
  logoBolt: { color: GREEN, fontSize: 26, fontWeight: "900", marginLeft: 15 },
  brand: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  slogan: {
    color: GREEN,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  tabs: {
    height: 35,
    backgroundColor: colors.surface,
    borderRadius: 9,
    flexDirection: "row",
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: { backgroundColor: GREEN },
  tabText: { color: colors.secondary, fontSize: 11, fontWeight: "700" },
  activeTabText: { color: "#101510" },
  field: { marginBottom: 10 },
  label: {
    color: colors.text,
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 6,
  },
  inputShell: {
    height: 36,
    borderRadius: 9,
    backgroundColor: colors.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  inputError: { borderWidth: 1, borderColor: "#FF6B6B" },
  glyph: { color: "#C8D6C7", fontSize: 15, width: 22, textAlign: "center" },
  input: { flex: 1, color: colors.secondary, fontSize: 11, paddingVertical: 0 },
  eye: { color: "#C8E5C0", width: 18 },
  errorText: { color: "#FF8585", fontSize: 9, marginTop: 4 },
  rememberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 17,
  },
  rememberGroup: { flexDirection: "row", alignItems: "center", gap: 7 },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 3,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  checked: { backgroundColor: GREEN, borderColor: GREEN },
  checkmark: {
    color: "#15210D",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "900",
  },
  smallText: { color: colors.secondary, fontSize: 10 },
  greenText: { color: GREEN, fontSize: 10, fontWeight: "700" },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 2,
    marginBottom: 16,
  },
  termsText: { flex: 1, color: colors.text, fontSize: 10, lineHeight: 14 },
  link: { color: GREEN, textDecorationLine: "underline", fontWeight: "700" },
  primaryButton: {
    height: 36,
    borderRadius: 9,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  primaryText: { color: "#121911", fontSize: 12, fontWeight: "900" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  divider: { height: 1, flex: 1, backgroundColor: "#303638" },
  dividerText: { color: "#C0A967", fontSize: 8, fontWeight: "700" },
  socialRow: { flexDirection: "row", gap: 9 },
  socialButton: {
    flex: 1,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  socialIcon: { fontSize: 20, fontWeight: "900" },
  appleIcon: { color: colors.text, fontSize: 17 },
  footer: { alignItems: "center", marginTop: 20 },
  footerPrompt: { color: colors.secondary, fontSize: 10, textAlign: "center" },
  performance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
  },
  flash: { color: "#FF6B22", fontSize: 13 },
  performanceText: {
    color: "#C7D3C5",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#252D30",
  },
});

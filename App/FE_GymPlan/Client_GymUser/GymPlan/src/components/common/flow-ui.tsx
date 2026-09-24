import { router } from "expo-router";
import { ReactNode, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const palette = { background: "#0D1112", card: "#1B1F20", text: "#EEF0ED", muted: "#ABB5AA", green: "#8CFF2E", line: "#303A33", red: "#FF9C9C" };
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 20, paddingBottom: 40, gap: 16, width: "100%", maxWidth: 760, alignSelf: "center" },
  title: { color: palette.text, fontSize: 28, fontWeight: "900" },
  heading: { color: palette.text, fontSize: 18, fontWeight: "800" },
  text: { color: palette.text, fontSize: 14, lineHeight: 22 },
  muted: { color: palette.muted, fontSize: 12, lineHeight: 20 },
  accent: { color: palette.green, fontSize: 13, fontWeight: "800" },
  error: { color: palette.red, fontSize: 13, lineHeight: 21 },
  card: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 16, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  input: { minHeight: 44, backgroundColor: "#252D28", color: palette.text, borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 12, fontSize: 15 },
  button: { backgroundColor: palette.green, minHeight: 46, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  secondary: { backgroundColor: "#283129" },
  buttonText: { color: "#10200C", fontWeight: "800", fontSize: 13 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,.75)", justifyContent: "center", padding: 24 },
});

export function Button({ title, onPress, disabled, secondary }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={[ui.button, secondary && ui.secondary, disabled && { opacity: 0.45 }]}>
    <Text style={[ui.buttonText, secondary && { color: palette.text }]}>{title}</Text>
  </Pressable>;
}
export function Field({ label, containerStyle, ...props }: TextInputProps & { label: string; containerStyle?: StyleProp<ViewStyle> }) {
  return <View style={[{ gap: 6, flexGrow: 1 }, containerStyle]}><Text style={ui.muted}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={palette.muted} {...props} style={[ui.input, props.style]} /></View>;
}
export function Page({ title, children, onBack, footer }: { title: string; children: ReactNode; onBack?: () => void; footer?: ReactNode }) {
  return <SafeAreaView style={ui.screen} edges={["top", "bottom"]}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>
    <Pressable accessibilityRole="button" onPress={onBack || (() => router.canGoBack() ? router.back() : router.replace("/home"))}><Text style={ui.accent}>‹ Quay lại</Text></Pressable>
    <Text style={ui.title}>{title}</Text>{children}
  </ScrollView>{footer}</SafeAreaView>;
}
export function Confirm({ visible, title, message, busy, error, onConfirm, onClose }: { visible: boolean; title: string; message: string; busy: boolean; error?: string | null; onConfirm: () => void; onClose: () => void }) {
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={() => { if (!busy) onClose(); }}>
    <View style={ui.overlay}><View style={ui.card}><Text style={ui.heading}>{title}</Text><Text style={ui.text}>{message}</Text>
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      <Button title={busy ? "Đang xử lý…" : "Xác nhận"} onPress={onConfirm} disabled={busy} />
      <Button title="Quay lại" onPress={onClose} disabled={busy} secondary />
    </View></View>
  </Modal>;
}
export function useAction() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<unknown>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(null);
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Không thể lưu. Vui lòng thử lại."); }
    finally { locked.current = false; setBusy(false); }
  };
  return { busy, error, setError, run };
}

import { ActivityIndicator, Pressable, Text, View } from "react-native";

export function DataState({ loading, error, empty, retry }: {
  loading: boolean; error: string | null; empty?: string | false; retry?: () => unknown;
}) {
  if (loading) return <ActivityIndicator color="#8CFF2E" accessibilityLabel="Đang tải dữ liệu" />;
  if (!error && !empty) return null;
  return <View accessibilityLiveRegion="polite">
    <Text style={{ color: "#B5BDB2", paddingVertical: 12 }}>{error || empty}</Text>
    {error && retry && <Pressable onPress={() => { void retry(); }}><Text style={{ color: "#8CFF2E" }}>Thử lại</Text></Pressable>}
  </View>;
}

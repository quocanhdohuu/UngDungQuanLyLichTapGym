import { Href, router, usePathname } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACTIVE_COLOR = "#8CFF2E";
const INACTIVE_COLOR = "#A7ADB0";
const NAV_BACKGROUND = "#101416";

const tabs = [
  {
    label: "Trang chủ",
    route: "/home",
    icon: { ios: "house.fill", android: "home", web: "home" },
  },
  {
    label: "Lịch tập",
    route: "/plans",
    icon: { ios: "calendar", android: "calendar_month", web: "calendar_month" },
  },
  {
    label: "Thư viện",
    route: "/templates",
    icon: {
      ios: "books.vertical.fill",
      android: "library_books",
      web: "library_books",
    },
  },
  {
    label: "Tiến độ",
    route: "/progress",
    icon: {
      ios: "chart.line.uptrend.xyaxis",
      android: "trending_up",
      web: "trending_up",
    },
  },
  {
    label: "Cá nhân",
    route: "/profile",
    icon: { ios: "person.fill", android: "person", web: "person" },
  },
] as const;

export default function AppTabs() {
  const pathname = usePathname();

  if (!tabs.some((tab) => pathname === tab.route)) {
    return null;
  }

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.route;
          const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

          return (
            <Pressable
              key={tab.route}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => router.replace(tab.route as Href)}
              style={styles.tab}
            >
              <SymbolView
                name={tab.icon}
                tintColor={color}
                size={21}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.label,
                  { color },
                  isActive && styles.activeLabel,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: NAV_BACKGROUND,
  },
  container: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#303638",
    backgroundColor: NAV_BACKGROUND,
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  icon: {
    width: 21,
    height: 21,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "500",
  },
  activeLabel: {
    fontWeight: "700",
  },
});

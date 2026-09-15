import { SymbolView } from "expo-symbols";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const colors = {
  muted: "#B8C0B7",
  text: "#ECEFEC",
  green: "#8CFF2E",
};

type SharedHeaderProps = {
  title: string;
  parentHorizontalPadding: number;
  parentTopPadding: number;
  showNotificationDot?: boolean;
  onAvatarPress?: () => void;
};

export function SharedHeader({
  title,
  parentHorizontalPadding,
  parentTopPadding,
  showNotificationDot = true,
  onAvatarPress,
}: SharedHeaderProps) {
  return (
    <View
      style={[
        styles.header,
        {
          marginHorizontal: -parentHorizontalPadding,
          marginTop: -parentTopPadding,
        },
      ]}
    >
      <View style={styles.brandRow}>
        <Image
          source={require("../../components/image/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.brand}>GYMFORLIFE</Text>
          <Text style={styles.pageTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <View style={styles.notification}>
          <SymbolView
            name={{
              ios: "bell",
              android: "notifications",
              web: "notifications",
            }}
            tintColor={colors.muted}
            size={21}
          />
          {showNotificationDot && <View style={styles.notificationDot} />}
        </View>
        <Pressable
          disabled={!onAvatarPress}
          onPress={onAvatarPress}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>QA</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 17,
    marginBottom: 39,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 39,
    height: 39,
  },
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },
  notification: {
    position: "relative",
    padding: 4,
  },
  notificationDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: colors.green,
    top: 1,
    right: 0,
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#38443E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: "900",
  },
});

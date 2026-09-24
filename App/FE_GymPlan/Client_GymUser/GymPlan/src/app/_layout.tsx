import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { restoreAuthSession, useAuthSession } from "@/auth-session";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, useColorScheme, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const session = useAuthSession();
  const [ready, setReady] = useState(false);
  useEffect(() => { void restoreAuthSession().finally(() => setReady(true)); }, []);
  if (!ready) return <View style={{ flex: 1, backgroundColor: "#0D1112", justifyContent: "center" }}><ActivityIndicator color="#8CFF2E" /></View>;
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 250,
        }}
      >
        <Stack.Protected guard={!session}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/forgot-password" />
        </Stack.Protected>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="home/index" />
          <Stack.Screen name="plans/index" />
          <Stack.Screen name="plans/create" />
          <Stack.Screen name="plans/[id]" />
          <Stack.Screen name="exercises/index" />
          <Stack.Screen name="exercises/[id]" />
          <Stack.Screen name="templates/index" />
          <Stack.Screen name="templates/[id]" />
          <Stack.Screen name="workout/index" />
          <Stack.Screen name="history/index" />
          <Stack.Screen name="history/[id]" />
          <Stack.Screen name="progress/index" />
          <Stack.Screen name="profile/index" />
          <Stack.Screen name="explore" />
        </Stack.Protected>
      </Stack>
      <AppTabs />
    </ThemeProvider>
  );
}

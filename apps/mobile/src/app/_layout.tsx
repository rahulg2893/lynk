import { useEffect, useState } from "react";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { addNetworkStateListener, getNetworkStateAsync } from "expo-network";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { hydrateAccount, useAccount } from "@/lib/account";
import { setNetworkOnline } from "@/lib/connection";
import { loadChats, resetStore, useChatStore } from "@/lib/store";
import { palette, useScheme } from "@/lib/theme";
import { SideSafe } from "@/components/SideSafe";
import { SplashOverlay } from "@/components/Splash";
import { Banners } from "@/components/Banners";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [hydrated, setHydrated] = useState(false);
  const account = useAccount();
  const store = useChatStore();
  const scheme = useScheme();
  const c = palette[scheme];
  const signedIn = Boolean(account?.session);
  const username = account?.profile.username;
  const seeded = account?.seeded ?? true;

  // Open the encrypted store and read the account.
  useEffect(() => {
    void hydrateAccount().finally(() => setHydrated(true));
  }, []);

  // Then this account's chats.
  useEffect(() => {
    if (!hydrated) return;
    if (signedIn && username) void loadChats(username, seeded);
    else resetStore();
  }, [hydrated, signedIn, username, seeded]);

  // Follow the phone's connection so the outbox knows when to send.
  useEffect(() => {
    void getNetworkStateAsync().then((s) => setNetworkOnline(s.isConnected !== false && s.isInternetReachable !== false));
    const sub = addNetworkStateListener((s) => setNetworkOnline(s.isConnected !== false && s.isInternetReachable !== false));
    return () => sub.remove();
  }, []);

  const ready = hydrated && (!signedIn || store.loaded);
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: c.bg, card: c.bg, text: c.ink, border: c.line, primary: c.accent } };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          {hydrated ? (
            <Stack
              screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}
              // Every screen stays clear of side bars; the tab screens and the full-bleed welcome handle their own.
              screenLayout={({ route, children }) => (route.name === "(tabs)" || route.name === "welcome" ? children : <SideSafe>{children}</SideSafe>)}
            >
              <Stack.Protected guard={signedIn}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="chat/[id]" />
                <Stack.Screen name="chat-info/[id]" options={{ presentation: "modal" }} />
                <Stack.Screen name="new-chat" options={{ presentation: "modal" }} />
                <Stack.Screen name="ask" options={{ presentation: "modal" }} />
                <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
                <Stack.Screen name="plan" options={{ presentation: "formSheet", sheetAllowedDetents: [0.75, 1], sheetGrabberVisible: true }} />
                <Stack.Screen name="person/[id]" />
                <Stack.Screen name="settings/[pane]" />
              </Stack.Protected>
              <Stack.Protected guard={!signedIn}>
                <Stack.Screen name="welcome" />
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="sign-up" />
              </Stack.Protected>
            </Stack>
          ) : null}
          {signedIn && ready ? <Banners /> : null}
          <SplashOverlay ready={ready} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

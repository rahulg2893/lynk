import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";

const BG = "#070c16";

/**
 * Takes over from the native splash (the Lynk wordmark on navy) with the same
 * image in the same place, so the hand-off is invisible, then, once the
 * encrypted store is open and chats are loaded, the wordmark lifts and the
 * whole layer fades into the app.
 */
export function SplashOverlay({ ready }: { ready: boolean }) {
  const [gone, setGone] = useState(false);
  const fade = useState(() => new Animated.Value(1))[0];
  const lift = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (!ready) return;
    Animated.parallel([
      Animated.timing(lift, { toValue: 1, duration: 520, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 420, delay: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => setGone(true));
  }, [ready, fade, lift]);

  if (gone) return null;
  return (
    <Animated.View
      pointerEvents={ready ? "none" : "auto"}
      style={[StyleSheet.absoluteFill, { backgroundColor: BG, alignItems: "center", justifyContent: "center", opacity: fade, zIndex: 100 }]}
      // Hide the native splash only once this identical frame is on screen.
      onLayout={() => void SplashScreen.hideAsync().catch(() => undefined)}
    >
      <Animated.Image
        source={require("@/assets/images/splash-icon.png")}
        resizeMode="contain"
        style={{
          width: 280,
          height: 280,
          transform: [
            { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
            { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
          ],
        }}
      />
    </Animated.View>
  );
}

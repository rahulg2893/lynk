import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LockSimple } from "phosphor-react-native";
import { Button, LogoMark, Text } from "@/components/ui";
import { useTopMargin } from "@/lib/layout";
import { t } from "@shared/i18n";

const LINES = ["Chat with the people", "who matter.", "Lynk remembers the plan."];

/** The first screen when signed out: a dark stage, the rings, and a headline that arrives word by word. */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const topMargin = useTopMargin();
  const anims = useState(() => LINES.map(() => new Animated.Value(0)))[0];
  const cta = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.stagger(140, [
      ...anims.map((a) => Animated.timing(a, { toValue: 1, duration: 600, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true })),
      Animated.timing(cta, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [anims, cta]);

  return (
    <LinearGradient colors={["#0f2250", "#070c16", "#05070d"]} locations={[0, 0.55, 1]} style={{ flex: 1, paddingTop: insets.top + topMargin + 24, paddingBottom: insets.bottom + 16, paddingLeft: insets.left + 24, paddingRight: insets.right + 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <LogoMark height={30} />
        <Text variant="title2" style={{ color: "#f5f5f7" }}>
          {t("Lynk")}
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: "center" }}>
        {LINES.map((line, i) => (
          <Animated.View key={line} style={{ opacity: anims[i], transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
            <Text style={{ fontSize: 42, lineHeight: 46, fontWeight: "700", letterSpacing: -1, color: i === 2 ? "#5aa0ff" : "#f5f5f7" }}>{t(line)}</Text>
          </Animated.View>
        ))}
        <Animated.View style={{ opacity: cta, marginTop: 20 }}>
          <Text variant="callout" style={{ color: "#a1a1a6", maxWidth: 320 }}>
            {t("Group chats, plans, lists and the little things worth remembering. Every chat is end-to-end encrypted.")}
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: cta, gap: 10 }}>
        <Button title={t("Create an account")} variant="primary" size="lg" onPress={() => router.push("/sign-up")} />
        <Button title={t("I already have an account")} variant="ghost" size="lg" onPress={() => router.push("/sign-in")} style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
          <LockSimple size={13} color="#a1a1a6" weight="fill" />
          <Text variant="caption" style={{ color: "#a1a1a6" }}>
            {t("No passwords. Sign in with your phone number.")}
          </Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

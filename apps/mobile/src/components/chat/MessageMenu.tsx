import { useEffect, type ReactNode, useState } from "react";
import { Animated, Modal, Pressable, View } from "react-native";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ArrowUUpLeft, BookmarkSimple, CalendarPlus, CheckSquareOffset, Copy, GitBranch, PencilSimple, PushPin, Translate, Trash } from "phosphor-react-native";
import { messagePreview, personName, type Message } from "@shared/chat";
import { radius, useColors, useScheme } from "@/lib/theme";
import { Text } from "../ui";
import { t } from "@shared/i18n";

export const QUICK = ["👍", "❤️", "😂", "🙌", "😮", "🙏"];

export type MenuAction = "reply" | "save" | "pin" | "side" | "plan" | "todo" | "translate" | "copy" | "edit" | "delete";

/**
 * Long-press on a message: the page blurs, the message lifts, reactions spring
 * in one after another, and the actions sit underneath.
 */
export function MessageMenu({
  message,
  canSide,
  sideExists,
  translated,
  onReact,
  onAction,
  onClose,
}: {
  message: Message | null;
  canSide: boolean;
  sideExists: boolean;
  translated: boolean;
  onReact: (emoji: string) => void;
  onAction: (a: MenuAction) => void;
  onClose: () => void;
}) {
  const c = useColors();
  const dark = useScheme() === "dark";
  const lift = useState(() => new Animated.Value(0))[0];
  const pops = useState(() => QUICK.map(() => new Animated.Value(0)))[0];

  useEffect(() => {
    if (!message) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    lift.setValue(0);
    pops.forEach((p) => p.setValue(0));
    Animated.parallel([
      Animated.spring(lift, { toValue: 1, useNativeDriver: true, stiffness: 320, damping: 24 }),
      Animated.stagger(35, pops.map((p) => Animated.spring(p, { toValue: 1, useNativeDriver: true, stiffness: 500, damping: 14 }))),
    ]).start();
  }, [message, lift, pops]);

  if (!message) return null;
  const mine = message.from === "me";
  const actions: { key: MenuAction; label: string; icon: ReactNode; danger?: boolean }[] = [
    { key: "reply", label: t("Reply"), icon: <ArrowUUpLeft size={20} color={c.ink} /> },
    { key: "save", label: message.saved ? t("Remove from Saved") : t("Save"), icon: <BookmarkSimple size={20} color={c.ink} weight={message.saved ? "fill" : "regular"} /> },
    ...(canSide ? [{ key: "side" as const, label: sideExists ? t("Open side chat") : t("Start a side chat"), icon: <GitBranch size={20} color={c.ink} /> }] : []),
    ...(canSide ? [{ key: "pin" as const, label: message.pinned ? t("Unpin") : t("Pin to Up next"), icon: <PushPin size={20} color={c.ink} weight={message.pinned ? "fill" : "regular"} /> }] : []),
    { key: "plan", label: t("Make a plan from this"), icon: <CalendarPlus size={20} color={c.ink} /> },
    ...(canSide ? [{ key: "todo" as const, label: t("Make a to-do from this"), icon: <CheckSquareOffset size={20} color={c.ink} /> }] : []),
    ...(!mine && message.text ? [{ key: "translate" as const, label: translated ? t("View original") : t("Translate"), icon: <Translate size={20} color={c.ink} /> }] : []),
    ...(message.text ? [{ key: "copy" as const, label: t("Copy"), icon: <Copy size={20} color={c.ink} /> }] : []),
    ...(mine ? [{ key: "edit" as const, label: t("Edit"), icon: <PencilSimple size={20} color={c.ink} /> }] : []),
    ...(mine ? [{ key: "delete" as const, label: t("Delete for everyone"), icon: <Trash size={20} color={c.dangerInk} />, danger: true }] : []),
  ];

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* The backdrop closes on tap; it isn't one accessible element, so VoiceOver can reach the actions (and its escape gesture closes the menu). */}
      <Pressable style={{ flex: 1 }} onPress={onClose} accessible={false} onAccessibilityEscape={onClose}>
        <BlurView intensity={40} tint={dark ? "dark" : "light"} style={{ flex: 1, backgroundColor: c.scrim }}>
          <SafeAreaView edges={["left", "right"]} style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
          <Animated.View style={{ opacity: lift, transform: [{ scale: lift.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }}>
            <View style={{ flexDirection: "row", alignSelf: mine ? "flex-end" : "flex-start", gap: 4, padding: 6, borderRadius: radius.pill, backgroundColor: c.surface, marginBottom: 10 }}>
              {QUICK.map((e, i) => (
                <Animated.View key={e} style={{ transform: [{ scale: pops[i] }] }}>
                  <Pressable
                    accessibilityLabel={t("React with {emoji}", { emoji: e })}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
                      onReact(e);
                    }}
                    style={({ pressed }) => ({ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: pressed ? c.surface2 : "transparent", transform: [{ scale: pressed ? 1.25 : 1 }] })}
                  >
                    <Text style={{ fontSize: 26 }}>{e}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
            <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "88%", padding: 14, borderRadius: radius.lg, backgroundColor: mine ? c.accentSoft : c.surface, marginBottom: 10 }}>
              <Text variant="caption" tone="muted" weight="600">
                {mine ? t("You") : personName(message.from)}
              </Text>
              <Text numberOfLines={6} style={{ marginTop: 2 }}>
                {messagePreview(message)}
              </Text>
            </View>
            <View style={{ alignSelf: mine ? "flex-end" : "flex-start", width: 260, borderRadius: radius.lg, backgroundColor: c.surface, overflow: "hidden" }}>
              {actions.map((a, i) => (
                <Pressable
                  key={a.key}
                  onPress={() => onAction(a.key)}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 48, backgroundColor: pressed ? c.surface2 : "transparent", borderTopWidth: i ? 0.5 : 0, borderTopColor: c.line })}
                >
                  <Text tone={a.danger ? "danger" : "ink"}>{a.label}</Text>
                  {a.icon}
                </Pressable>
              ))}
            </View>
          </Animated.View>
          </SafeAreaView>
        </BlurView>
      </Pressable>
    </Modal>
  );
}

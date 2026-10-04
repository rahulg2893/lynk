import { useEffect, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { CloudCheck, CloudSlash } from "phosphor-react-native";
import { messagePreview, personName, resolveChat, type Message } from "@shared/chat";
import { notifies } from "@shared/notify";
import { getAccount } from "@/lib/account";
import { isSimulatedOffline, setSimulatedOffline, useOnline } from "@/lib/connection";
import { getState, onIncoming, useChatStore, waitingCount } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { Avatar, Text } from "./ui";
import { t } from "@shared/i18n";

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

function useDrop(show: boolean) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.spring(v, { toValue: show ? 1 : 0, useNativeDriver: true, stiffness: 320, damping: 26, mass: 0.9 }).start();
  }, [show, v]);
  return {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
  };
}

/** The connection pill and in-app alerts for messages in other chats. */
export function Banners() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const online = useOnline();
  useChatStore(); // re-render as the outbox changes
  const waiting = waitingCount();
  const [back, setBack] = useState<number | null>(null);
  const [prev, setPrev] = useState(online);
  const [alert, setAlert] = useState<{ threadId: string; message: Message } | null>(null);

  if (online !== prev) {
    setPrev(online);
    setBack(online ? waiting : null);
  }
  useEffect(() => {
    if (back === null) return;
    const t = setTimeout(() => setBack(null), 2600);
    return () => clearTimeout(t);
  }, [back]);

  // A reply that lands while you're somewhere else, following your notification settings.
  useEffect(() => {
    onIncoming((threadId, message) => {
      const chat = resolveChat(getState().chats, threadId);
      const a = getAccount();
      if (!chat || !notifies(chat, message, a.notifications, a.profile.name.split(" ")[0])) return;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setAlert({ threadId, message });
    });
    return () => onIncoming(null);
  }, []);
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(t);
  }, [alert]);

  const connection = useDrop(!online || back !== null);
  const incoming = useDrop(Boolean(alert));
  const chat = alert ? resolveChat(getState().chats, alert.threadId) : null;
  const previews = getAccount().notifications.previews;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: insets.top + 6, left: 12, right: 12, alignItems: "center", gap: 8 }}>
      <Animated.View style={connection} pointerEvents={!online || back !== null ? "auto" : "none"}>
        <View
          accessibilityRole="alert"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 10,
            paddingLeft: 14,
            paddingRight: online ? 16 : 8,
            borderRadius: radius.pill,
            backgroundColor: online ? c.surface : c.ink,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          {online ? <CloudCheck size={20} weight="fill" color={c.accentInk} /> : <CloudSlash size={20} weight="fill" color={c.bg} />}
          <Text variant="footnote" style={{ color: online ? c.ink : c.bg, flexShrink: 1 }}>
            <Text variant="footnote" weight="700" style={{ color: online ? c.ink : c.bg }}>
              {online ? t("Back online") : t("You're offline")}
            </Text>
            {online ? (back ? ` · sending ${plural(back, "message")}` : "") : waiting ? ` · ${plural(waiting, "message")} will send when you reconnect` : " · messages will wait"}
          </Text>
          {!online && isSimulatedOffline() ? (
            <Pressable onPress={() => setSimulatedOffline(false)} style={{ height: 30, paddingHorizontal: 12, borderRadius: radius.pill, justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" }}>
              <Text variant="footnote" weight="600" style={{ color: c.bg }}>
                {t("Reconnect")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View style={[incoming, { alignSelf: "stretch" }]} pointerEvents={alert ? "auto" : "none"}>
        {alert && chat ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("New message from {name}. Open", { name: personName(alert.message.from) })}
            onPress={() => {
              setAlert(null);
              router.push({ pathname: "/chat/[id]", params: { id: alert.threadId } });
            }}
            style={{
              flexDirection: "row",
              gap: 12,
              padding: 12,
              borderRadius: 22,
              backgroundColor: c.surface,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            <Avatar id={alert.message.from} name={personName(alert.message.from)} size={40} />
            <View style={{ flex: 1 }}>
              <Text variant="subhead" weight="600" numberOfLines={1}>
                {chat.kind === "group" ? t("{name} in {chat}", { name: personName(alert.message.from), chat: chat.name }) : personName(alert.message.from)}
              </Text>
              <Text variant="subhead" tone="muted" numberOfLines={2}>
                {previews ? messagePreview(alert.message) : t("New message")}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

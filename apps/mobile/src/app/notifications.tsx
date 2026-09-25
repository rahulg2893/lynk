import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GearSix, X } from "phosphor-react-native";
import { firstName, formatListTime } from "@shared/chat";
import { notificationGroups, notificationText } from "@shared/notify";
import { updateAccount, useAccount } from "@/lib/account";
import { useChatStore } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { ChatAvatar, Empty, Text } from "@/components/ui";

/** One row per chat, so a busy group reads "and 6 more". Opening this marks everything as seen. */
export default function Notifications() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const account = useAccount();
  const { chats, now } = useChatStore();
  // Keep the "new" dots for this visit; mark seen when leaving.
  const [seenAt] = useState(account?.notifications.seenAt ?? 0);
  useEffect(() => () => updateAccount((a) => ({ ...a, notifications: { ...a.notifications, seenAt: Date.now() } })), []);
  if (!account) return null;
  const settings = { ...account.notifications, seenAt };
  const groups = notificationGroups(chats, settings, account.profile.name.split(" ")[0], now);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
        <Text variant="title2">Notifications</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => router.push({ pathname: "/settings/[pane]", params: { pane: "notifications" } })} accessibilityLabel="Notification settings" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
            <GearSix size={16} color={c.muted} />
          </Pressable>
          <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
            <X size={15} color={c.muted} weight="bold" />
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 24, gap: 4 }}>
        {groups.length === 0 ? (
          <Empty title="Nothing new" body={`Messages from your chats land here${settings.groups === "mentions" ? ", and from groups when someone mentions you" : ""}.`} />
        ) : (
          groups.map((g) => (
            <Pressable
              key={g.chat.id}
              onPress={() => {
                router.back();
                setTimeout(() => router.push({ pathname: "/chat/[id]", params: { id: g.chat.id, m: g.latest.id } }), 250);
              }}
              style={({ pressed }) => ({ flexDirection: "row", gap: 12, padding: 12, borderRadius: radius.lg, backgroundColor: pressed ? c.surface2 : "transparent" })}
            >
              <ChatAvatar chat={g.chat} size={44} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                  <Text weight={g.unread ? "700" : "500"} style={{ flex: 1 }} numberOfLines={1}>
                    {g.chat.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {formatListTime(g.latest.at, now)}
                  </Text>
                </View>
                <Text variant="subhead" tone={g.unread ? "ink" : "muted"} numberOfLines={2}>
                  {g.chat.kind === "group" ? `${firstName(g.latest.from)}: ` : ""}
                  {notificationText(g.latest, settings)}
                </Text>
                {g.count > 1 || g.mention ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    {g.mention ? (
                      <View style={{ paddingHorizontal: 7, height: 18, borderRadius: 9, backgroundColor: c.ink, justifyContent: "center" }}>
                        <Text variant="caption" weight="700" style={{ color: c.bg }}>
                          @ you
                        </Text>
                      </View>
                    ) : null}
                    {g.count > 1 ? (
                      <Text variant="caption" tone="muted">
                        and {g.count - 1} more
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
              {g.unread ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.accent, marginTop: 6 }} /> : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

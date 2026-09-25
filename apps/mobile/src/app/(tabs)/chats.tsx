import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, BellRinging, BellSlash, MagnifyingGlass, NotePencil, PushPin, Sparkle, XCircle } from "phosphor-react-native";
import { firstName, formatListTime, messagePreview, type Chat } from "@shared/chat";
import { notificationGroups } from "@shared/notify";
import { useAccount } from "@/lib/account";
import { useOnline } from "@/lib/connection";
import { actionSheet } from "@/lib/sheet";
import { toggleMute, togglePin, useChatStore } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { Badge, ChatAvatar, Empty, IconButton, Pill, StatusNode, Text, tap } from "@/components/ui";

type Filter = "all" | "unread" | "groups";

export default function Chats() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const account = useAccount();
  const online = useOnline();
  const { chats, loaded, now } = useChatStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { pinned, recent } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...chats]
      .sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0))
      .filter((ch) => (filter === "unread" ? ch.unread > 0 : filter === "groups" ? ch.kind === "group" : true))
      .filter((ch) => !q || ch.name.toLowerCase().includes(q) || ch.messages.some((m) => m.text.toLowerCase().includes(q)));
    return { pinned: list.filter((ch) => ch.pinned), recent: list.filter((ch) => !ch.pinned) };
  }, [chats, query, filter]);

  const unreadTotal = chats.reduce((n, ch) => n + (ch.muted ? 0 : ch.unread), 0);
  const groups = account ? notificationGroups(chats, account.notifications, account.profile.name.split(" ")[0], now) : [];
  const newAlerts = groups.filter((g) => g.unread).length;
  const showStrip = filter === "all" && !query && pinned.length > 0;
  const rows = showStrip ? recent : [...pinned, ...recent];

  const open = (id: string) => router.push({ pathname: "/chat/[id]", params: { id } });
  const menu = (ch: Chat) =>
    actionSheet(ch.name, [
      { label: ch.pinned ? "Unpin" : "Pin", onPress: () => togglePin(ch.id) },
      { label: ch.muted ? "Unmute" : "Mute", onPress: () => toggleMute(ch.id) },
      { label: "Chat info", onPress: () => router.push({ pathname: "/chat-info/[id]", params: { id: ch.id } }) },
    ]);

  const header = (
    <View>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View style={{ flexShrink: 1 }}>
          <Text variant="largeTitle">Chats</Text>
          <Text variant="footnote" tone="muted">
            {!online ? "Offline" : !loaded ? "Syncing" : unreadTotal ? `${unreadTotal} unread` : "All caught up"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6, paddingBottom: 4 }}>
          <IconButton label="Ask Lynk" onPress={() => router.push("/ask")} style={{ backgroundColor: c.surface }}>
            <Sparkle size={20} color={c.accentInk} weight="fill" />
          </IconButton>
          <View>
            <IconButton label={newAlerts ? `Notifications, ${newAlerts} new` : "Notifications"} onPress={() => router.push("/notifications")} style={{ backgroundColor: c.surface }}>
              {newAlerts ? <BellRinging size={20} color={c.ink} weight="bold" /> : <Bell size={20} color={c.ink} weight="bold" />}
            </IconButton>
            {newAlerts ? (
              <View pointerEvents="none" style={{ position: "absolute", top: -3, right: -3 }}>
                <Badge count={newAlerts} />
              </View>
            ) : null}
          </View>
          <IconButton label="New chat" filled onPress={() => router.push("/new-chat")}>
            <NotePencil size={19} color={c.onAccent} weight="bold" />
          </IconButton>
        </View>
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8, height: 40, borderRadius: radius.pill, backgroundColor: c.surface2, paddingHorizontal: 12 }}>
        <MagnifyingGlass size={18} color={c.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search chats"
          placeholderTextColor={c.muted}
          accessibilityLabel="Search chats"
          style={{ flex: 1, fontSize: 17, color: c.ink }}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} accessibilityLabel="Clear search" hitSlop={8}>
            <XCircle size={18} color={c.muted} weight="fill" />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", gap: 4, paddingHorizontal: 12, marginTop: 10 }}>
        {(["all", "unread", "groups"] as Filter[]).map((f) => (
          <Pill key={f} active={filter === f} onPress={() => setFilter(f)}>
            {f === "all" ? "All" : f === "unread" ? "Unread" : "Groups"}
          </Pill>
        ))}
      </View>

      {showStrip ? (
        <View style={{ marginTop: 14 }}>
          <Text variant="footnote" tone="muted" weight="600" style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            Pinned
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 12 }}>
            {pinned.map((ch) => (
              <Pressable
                key={ch.id}
                onPress={() => open(ch.id)}
                onLongPress={() => menu(ch)}
                accessibilityLabel={`${ch.name}${ch.unread ? `, ${ch.unread} unread` : ""}`}
                style={({ pressed }) => ({ alignItems: "center", width: 76, opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{ borderRadius: 24, padding: 3, borderWidth: 2.5, borderColor: ch.unread && !ch.muted ? c.accent : "transparent" }}>
                  <ChatAvatar chat={ch} size={60} />
                </View>
                {ch.unread ? (
                  <View style={{ position: "absolute", top: -2, right: 4 }}>
                    <Badge count={ch.unread} muted={ch.muted} />
                  </View>
                ) : null}
                <Text variant="caption" weight={ch.unread ? "700" : "500"} numberOfLines={1} style={{ marginTop: 6 }}>
                  {ch.name.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {rows.length ? (
        <Text variant="footnote" tone="muted" weight="600" style={{ paddingHorizontal: 20, marginTop: 18, marginBottom: 4 }}>
          {showStrip ? "All chats" : "Recent"}
        </Text>
      ) : null}
    </View>
  );

  return (
    <FlatList
      contentInsetAdjustmentBehavior="never"
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      data={loaded ? rows : []}
      keyExtractor={(ch) => ch.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ListEmptyComponent={
        !loaded ? (
          <Empty title="Syncing your chats" body="Opening your encrypted storage…" />
        ) : chats.length === 0 ? (
          <Empty
            icon={<NotePencil size={34} color={c.accentInk} />}
            title="No chats yet"
            body="Start one, or share your invite link from You."
            action={
              <Pressable onPress={() => router.push("/new-chat")} style={{ height: 44, paddingHorizontal: 20, borderRadius: radius.pill, backgroundColor: c.accent, justifyContent: "center" }}>
                <Text weight="600" tone="onAccent">
                  Start a chat
                </Text>
              </Pressable>
            }
          />
        ) : rows.length === 0 && !showStrip ? (
          <Empty title={query ? `Nothing matches “${query}”` : "Nothing here right now"} body={query ? "Try Ask Lynk to search inside messages." : "Switch the filter back to All."} />
        ) : null
      }
      renderItem={({ item }) => <ChatRow chat={item} now={now} onPress={() => open(item.id)} onLongPress={() => menu(item)} />}
    />
  );
}

function ChatRow({ chat, now, onPress, onLongPress }: { chat: Chat; now: number; onPress: () => void; onLongPress: () => void }) {
  const c = useColors();
  const last = chat.messages.at(-1);
  const mine = last?.from === "me";
  const who = !last ? "" : mine ? "You: " : chat.kind === "dm" ? "" : `${firstName(last.from)}: `;
  const hot = chat.unread > 0 && !chat.muted;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${chat.name}${chat.unread ? `, ${chat.unread} unread` : ""}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: pressed ? c.surface2 : "transparent" })}
    >
      <ChatAvatar chat={chat} size={52} />
      <View style={{ flex: 1, gap: 3, borderBottomWidth: 0.5, borderBottomColor: c.line, paddingBottom: 10, paddingTop: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text variant="headline" weight={hot ? "700" : "600"} numberOfLines={1} style={{ flex: 1 }}>
            {chat.name}
          </Text>
          <Text variant="footnote" tone={hot ? "accent" : "muted"} style={{ fontVariant: ["tabular-nums"] }}>
            {last ? formatListTime(last.at, now) : ""}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {chat.typing ? (
            <Text variant="subhead" tone="accent" style={{ flex: 1 }} numberOfLines={1}>
              {firstName(chat.typing)} is typing…
            </Text>
          ) : (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
              {mine && last?.status ? <StatusNode status={last.status} size={9} /> : null}
              <Text variant="subhead" tone={hot ? "ink" : "muted"} numberOfLines={2} style={{ flex: 1 }}>
                {!last ? "No messages yet" : last.deleted ? "Message deleted" : `${mine && last.status === "waiting" ? "Waiting to send · " : who}${messagePreview(last)}`}
              </Text>
            </View>
          )}
          {chat.pinned ? <PushPin size={14} color={c.muted} weight="fill" /> : null}
          {chat.muted ? <BellSlash size={15} color={c.muted} /> : null}
          {chat.mentions ? (
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c.ink, alignItems: "center", justifyContent: "center" }}>
              <Text variant="caption" weight="800" style={{ color: c.bg }}>
                @
              </Text>
            </View>
          ) : null}
          {chat.unread ? <Badge count={chat.unread} muted={chat.muted} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

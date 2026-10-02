import { useMemo, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import { BookmarkSimple, GitBranch, MagnifyingGlass } from "phosphor-react-native";
import { formatListTime, messagePreview, personName, sideChatId, type Chat, type Message } from "@shared/chat";
import { toggleSave, useChatStore } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { Avatar, Empty, Text } from "@/components/ui";
import { FoldSplit } from "@/components/FoldSplit";
import { SideSafe } from "@/components/SideSafe";
import { useTopMargin } from "@/lib/layout";

type Entry = { chat: Chat; threadId: string; sideName?: string; message: Message };

/** Everything you bookmarked, newest first. Only you can see what you save. */
function SavedContent() {
  const topMargin = useTopMargin();
  const c = useColors();
  const { chats, now } = useChatStore();
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const all: Entry[] = chats.flatMap((chat) => [
      ...chat.messages.filter((m) => m.saved && !m.deleted).map((message) => ({ chat, threadId: chat.id, message })),
      ...(chat.sideChats ?? []).flatMap((s) => s.messages.filter((m) => m.saved && !m.deleted).map((message) => ({ chat, threadId: sideChatId(chat.id, s.id), sideName: s.name, message }))),
    ]);
    const q = query.trim().toLowerCase();
    return all.filter((e) => !q || e.message.text.toLowerCase().includes(q) || e.chat.name.toLowerCase().includes(q)).sort((a, b) => b.message.at - a.message.at);
  }, [chats, query]);

  const list = (data: Entry[], withHeader: boolean) => (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: 16 + topMargin, paddingBottom: 32, paddingHorizontal: 16, gap: 10 }}
      data={data}
      keyExtractor={(e) => `${e.threadId}-${e.message.id}`}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        !withHeader ? null : <View style={{ gap: 12, marginBottom: 6 }}>
          <Text variant="largeTitle">Saved</Text>
          <Text variant="subhead" tone="muted">
            Messages you bookmarked, from every chat. Hold a message and choose Save.
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 40, borderRadius: radius.pill, backgroundColor: c.surface2, paddingHorizontal: 12 }}>
            <MagnifyingGlass size={18} color={c.muted} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search saved" placeholderTextColor={c.muted} style={{ flex: 1, fontSize: 17, color: c.ink }} />
          </View>
        </View>
      }
      ListEmptyComponent={
        !withHeader ? null : <Empty
          icon={<BookmarkSimple size={40} color={c.accentInk} weight="fill" />}
          title={query ? `Nothing saved matches “${query}”` : "Nothing saved yet"}
          body={query ? undefined : "Addresses, recipes, that link you'll need later: hold a message and choose Save to keep it here."}
        />
      }
      renderItem={({ item: e }) => (
        <View style={{ flex: 1, padding: 14, borderRadius: radius.lg, backgroundColor: c.surface, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text variant="caption" weight="700" numberOfLines={1}>
              {e.chat.name}
            </Text>
            {e.sideName ? (
              <>
                <GitBranch size={11} color={c.accentInk} />
                <Text variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {e.sideName}
                </Text>
              </>
            ) : null}
            <Text variant="caption" tone="muted" style={{ marginLeft: "auto" }}>
              {formatListTime(e.message.at, now)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Avatar id={e.message.from} name={personName(e.message.from)} size={32} />
            <View style={{ flex: 1 }}>
              <Text variant="footnote" weight="700">
                {e.message.from === "me" ? "You" : personName(e.message.from)}
              </Text>
              <Text style={{ marginTop: 2 }}>{messagePreview(e.message)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => router.push({ pathname: "/chat/[id]", params: { id: e.threadId, m: e.message.id } })} style={{ height: 34, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: c.surface2, justifyContent: "center" }}>
              <Text variant="footnote" weight="600">
                Show in chat
              </Text>
            </Pressable>
            <Pressable onPress={() => toggleSave(e.threadId, e.message.id)} style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 34, paddingHorizontal: 14, borderRadius: radius.pill }}>
              <BookmarkSimple size={15} color={c.accentInk} weight="fill" />
              <Text variant="footnote" weight="600" tone="muted">
                Unsave
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );

  // Partly folded Duo: the header and every other card on the left, the rest on the right, clear of the crease.
  return <FoldSplit single={list(entries, true)} left={list(entries.filter((_, n) => n % 2 === 0), true)} right={list(entries.filter((_, n) => n % 2 === 1), false)} />;
}

export default function Saved() {
  return (
    <SideSafe>
      <SavedContent />
    </SideSafe>
  );
}

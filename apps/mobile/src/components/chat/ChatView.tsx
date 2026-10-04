import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft, GitBranch, Info, LockSimple } from "phosphor-react-native";
import { displayName, firstName, messagePreview, personName, presence, smartIn, type Attachment, type Decision, type Message, type Task } from "@shared/chat";
import { planFromPoll } from "@shared/spot";
import { useAccount } from "@/lib/account";
import { useTopMargin } from "@/lib/layout";
import { useOnline } from "@/lib/connection";
import { confirm } from "@/lib/sheet";
import {
  deleteMessage,
  editMessage,
  getState,
  react,
  retry,
  send,
  setActive,
  setDecision,
  setDraft,
  setTask,
  sideChatFor,
  toggleSave,
  castVote,
  togglePinnedMessage,
  useChatStore,
  useThread,
} from "@/lib/store";
import { languageName, translateSample } from "@/lib/translate";
import { radius, useColors } from "@/lib/theme";
import { SuggestionCard } from "@/components/chat/Cards";
import { UpNext } from "@/components/chat/UpNext";
import { Composer } from "@/components/chat/Composer";
import { MessageItem, type Translation } from "@/components/chat/MessageItem";
import { MessageMenu, type MenuAction } from "@/components/chat/MessageMenu";
import { PhotoViewer } from "@/components/chat/PhotoViewer";
import { Avatar, ChatAvatar, Text } from "@/components/ui";
import { t } from "@shared/i18n";

type Item = { type: "message"; m: Message; i: number } | { type: "plan"; plan: Decision } | { type: "task"; task: Task };

/**
 * A conversation. Full screen on its own route, or embedded as the right-hand
 * pane of the two-pane Chats layout on wide screens (the iPhone Duo's inner
 * display), where it has no back button and sits above the tab bar.
 */
export function ChatView({ id, jumpTo, embedded = false }: { id: string; jumpTo?: string; embedded?: boolean }) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const account = useAccount();
  const online = useOnline();
  const { chats, now } = useChatStore();
  const chat = useThread(id);
  const parent = chat?.side ? chats.find((x) => x.id === chat.side!.parentId) : chat;
  const list = useRef<FlatList<Item>>(null);
  const [menu, setMenu] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  const [photos, setPhotos] = useState<{ items: Attachment[]; index: number } | null>(null);
  const [translated, setTranslated] = useState<Record<string, Translation>>({});
  const [highlight, setHighlight] = useState<string | null>(jumpTo ?? null);
  const [initial] = useState(() => new Set(chat?.messages.map((x) => x.id) ?? []));
  const [keyboard, setKeyboard] = useState(false);
  const topMargin = useTopMargin();
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboard(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const me = (account?.profile.name ?? "You").split(" ")[0];
  const smart = account?.smart;

  useFocusEffect(
    useCallback(() => {
      setActive(id);
      return () => setActive(null);
    }, [id]),
  );

  const items: Item[] = useMemo(() => {
    if (!chat) return [];
    const byLastSource = new Map<string, Item[]>();
    const allowed = smartIn(chat, smart ?? null);
    if (!chat.side) {
      for (const d of chat.decisions) if (d.status === "proposed" && d.sources.length && allowed.plans) byLastSource.set(d.sources.at(-1)!, [...(byLastSource.get(d.sources.at(-1)!) ?? []), { type: "plan", plan: d }]);
      for (const t of chat.tasks) if (t.status === "proposed" && t.sources.length && allowed.todos) byLastSource.set(t.sources.at(-1)!, [...(byLastSource.get(t.sources.at(-1)!) ?? []), { type: "task", task: t }]);
    }
    return chat.messages.flatMap((m, i) => [{ type: "message" as const, m, i }, ...(byLastSource.get(m.id) ?? [])]);
  }, [chat, smart]);

  // Jump to a message from Saved, the calendar, Ask Lynk or a plan's sources.
  useEffect(() => {
    if (!highlight) return;
    const at = items.findIndex((x) => x.type === "message" && x.m.id === highlight);
    const t1 = setTimeout(() => at >= 0 && list.current?.scrollToIndex({ index: at, viewPosition: 0.5, animated: true }), 350);
    const t2 = setTimeout(() => setHighlight(null), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // Only when a jump is requested.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight]);

  if (!chat) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg }}>
        <Text tone="muted">{t("This chat isn't here any more.")}</Text>
      </View>
    );
  }

  const byId = new Map(chat.messages.map((x) => [x.id, x]));
  const lastMine = [...chat.messages].reverse().find((x) => x.from === "me" && !x.deleted);
  const names = [...chat.members.map((x) => firstName(x)), me];
  const root = chat.side ? parent?.messages.find((x) => x.id === chat.side!.rootId) : undefined;

  const openSide = (m: Message) => {
    const sid = sideChatFor(chat.id, m.id);
    if (sid) router.push({ pathname: "/chat/[id]", params: { id: sid } });
  };
  const openInfo = () => parent && router.push({ pathname: "/chat-info/[id]", params: { id: parent.id } });
  const toggleTranslation = (m: Message) => {
    const cur = translated[m.id];
    if (cur && cur !== "none") return setTranslated((t) => ({ ...t, [m.id]: { ...cur, original: !cur.original } }));
    const s = translateSample(m.id, smart?.translateTo ?? "en");
    setTranslated((t) => ({ ...t, [m.id]: s ? { ...s, sample: true, original: false } : "none" }));
  };

  const onAction = (a: MenuAction) => {
    const m = menu;
    setMenu(null);
    if (!m) return;
    if (a === "reply") setReplyTo(m);
    if (a === "save") toggleSave(chat.id, m.id);
    if (a === "pin") togglePinnedMessage(chat.id, m.id);
    if (a === "todo") router.push({ pathname: "/todo", params: { chatId: chat.id, title: m.text.slice(0, 80), sources: m.id } });
    if (a === "side") openSide(m);
    if (a === "plan" && parent) router.push({ pathname: "/plan", params: { chatId: parent.id, title: m.text.slice(0, 80), sources: chat.side ? "" : m.id } });
    if (a === "translate") toggleTranslation(m);
    if (a === "copy") void Clipboard.setStringAsync(m.text);
    if (a === "edit") {
      setEditing(m);
      setEditText(m.text);
    }
    if (a === "delete") confirm(t("Delete this message?"), t("It's removed for everyone in the chat. A note shows where it was."), t("Delete"), () => deleteMessage(chat.id, m.id));
  };

  const value = editing ? editText : chat.draft;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={{ paddingTop: embedded ? 10 + topMargin : insets.top + 4 + topMargin, paddingBottom: 8, paddingHorizontal: embedded ? 12 : 6, flexDirection: "row", alignItems: "center", gap: 6, borderBottomWidth: 0.5, borderBottomColor: c.line, backgroundColor: c.bg }}>
        {embedded ? null : (
          <Pressable onPress={() => router.back()} accessibilityLabel={chat.side ? t("Back to {name}", { name: chat.side.parentName }) : t("Back to chats")} hitSlop={8} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <CaretLeft size={26} color={c.accentInk} weight="bold" />
          </Pressable>
        )}
        <Pressable onPress={openInfo} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }} accessibilityRole="button" accessibilityLabel={t("{name}, chat info", { name: displayName(chat) })}>
          {chat.side ? (
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
              <GitBranch size={20} color={c.accentInk} weight="bold" />
            </View>
          ) : (
            <ChatAvatar chat={chat} size={38} />
          )}
          <View style={{ flex: 1 }}>
            <Text variant="headline" numberOfLines={1}>
              {displayName(chat)}
            </Text>
            <Text variant="caption" tone={chat.typing ? "accent" : "muted"} numberOfLines={1}>
              {chat.side && !chat.typing ? t("Side chat in {name}", { name: chat.side.parentName }) : presence(chat)}
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={openInfo} accessibilityLabel={t("Chat info")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Info size={24} color={c.accentInk} />
        </Pressable>
      </View>
      {chat.side ? null : <UpNext chat={chat} now={now} onJump={setHighlight} />}

      <FlatList
        ref={list}
        data={items}
        keyExtractor={(x) => (x.type === "message" ? x.m.id : x.type === "plan" ? `p-${x.plan.id}` : `t-${x.task.id}`)}
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 12, paddingBottom: 16 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => !highlight && list.current?.scrollToEnd({ animated: false })}
        onScrollToIndexFailed={() => undefined}
        ListHeaderComponent={
          <View>
            <View style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: c.surface2, marginBottom: 14, maxWidth: "95%" }}>
              <LockSimple size={12} color={c.muted} weight="fill" />
              <Text variant="caption" tone="muted" style={{ flexShrink: 1 }}>
                {t("End-to-end encrypted. Only people in this chat can read it, not even Lynk.")}
              </Text>
            </View>
            {chat.side ? (
              <View style={{ marginLeft: 52, marginBottom: 12, padding: 14, borderRadius: radius.lg, backgroundColor: c.surface }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <GitBranch size={13} color={c.accentInk} weight="bold" />
                  <Text variant="caption" tone="muted" weight="700">
                    {t("Started from")}
                  </Text>
                </View>
                {root ? (
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <Avatar id={root.from} name={personName(root.from)} size={24} />
                    <Text variant="subhead" style={{ flex: 1 }}>
                      <Text variant="subhead" weight="700">
                        {root.from === "me" ? t("You") : personName(root.from)}{" "}
                      </Text>
                      <Text variant="subhead" tone="muted">
                        {messagePreview(root)}
                      </Text>
                    </Text>
                  </View>
                ) : null}
                <Pressable onPress={() => router.back()} style={{ marginTop: 10 }}>
                  <Text variant="footnote" tone="accent" weight="600">
                    {t("See it in {name}", { name: chat.side.parentName })}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {chat.messages.length === 0 ? (
              <View style={{ alignItems: "center", paddingHorizontal: 24, paddingTop: chat.side ? 8 : 40, gap: 10 }}>
                {chat.side ? null : <ChatAvatar chat={chat} size={72} />}
                <Text variant="title2" style={{ textAlign: "center" }}>
                  {chat.side ? "" : chat.kind === "group" ? t("You created {name}", { name: chat.name }) : t("This is the start of your chat with {name}", { name: firstName(chat.members[0]) })}
                </Text>
                <Text variant="subhead" tone="muted" style={{ textAlign: "center" }}>
                  {chat.side ? t("Talk it through here so {name} stays on topic.", { name: chat.side.parentName }) : chat.kind === "group" ? t("{n} people are here. Say hi.", { n: chat.members.length + 1 }) : t("Say hi. Plans and lists you make here stay in this chat.")}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListFooterComponent={
          chat.typing ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12 }}>
              <View style={{ width: 40, alignItems: "center" }}>
                <Avatar id={chat.typing} name={personName(chat.typing)} size={30} />
              </View>
              <Text variant="footnote" tone="accent">
                {firstName(chat.typing)} is typing…
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.type === "plan")
            return (
              <SuggestionCard
                plan={item.plan}
                onSave={() => setDecision(chat.id, item.plan.id, "confirmed")}
                onDismiss={() => setDecision(chat.id, item.plan.id, "rejected")}
                onEdit={() => router.push({ pathname: "/plan", params: { chatId: chat.id, planId: item.plan.id, confirmOnSave: "1" } })}
              />
            );
          if (item.type === "task") return <SuggestionCard task={item.task} onSave={() => setTask(chat.id, item.task.id, "confirmed")} onDismiss={() => setTask(chat.id, item.task.id, "rejected")} />;
          const m = item.m;
          return (
            <MessageItem
              message={m}
              prev={chat.messages[item.i - 1]}
              next={chat.messages[item.i + 1]}
              chat={chat}
              now={now}
              names={names}
              me={me}
              quoted={m.replyTo ? byId.get(m.replyTo) : undefined}
              side={chat.sideChats?.find((s) => s.rootId === m.id)}
              seenBy={chat.kind === "group" && m.id === lastMine?.id ? (m.readBy ?? []) : []}
              highlighted={highlight === m.id}
              isNew={!initial.has(m.id)}
              online={online}
              showTranscript={Boolean(smart?.enabled && smart.transcripts)}
              translation={translated[m.id]}
              languageName={languageName}
              onLongPress={setMenu}
              onReact={(msg, e) => react(chat.id, msg.id, e)}
              onOpenPhotos={(p, index) => setPhotos({ items: p, index })}
              onSideChat={openSide}
              onRetry={(msg) => retry(chat.id, msg.id)}
              onToggleTranslation={toggleTranslation}
              onVote={(msg, optionId) => castVote(chat.id, msg.id, optionId)}
              onDecidePoll={(msg, optionId) => {
                const option = msg.poll?.options.find((o) => o.id === optionId);
                if (!msg.poll || !option) return;
                const plan = planFromPoll(msg.poll.question, option.text, Date.now());
                router.push({
                  pathname: "/plan",
                  params: { chatId: chat.id, title: plan.title, when: plan.when ? String(plan.when) : undefined, where: plan.where, sources: msg.id, poll: `${msg.id}:${optionId}` },
                });
              }}
            />
          );
        }}
      />

      {/*
        Pad for the home indicator only while the keyboard is down. Embedded, a native safe area
        clears the tab bar exactly where it is: under the pane, or nothing when it's on the side (iPhone Duo).
      */}
      <SafeAreaView edges={embedded && !keyboard ? ["bottom"] : []} style={{ paddingBottom: keyboard || embedded ? 8 : Math.max(insets.bottom, 8), backgroundColor: c.bg }}>
        <Composer
          chat={chat}
          value={value}
          onChange={(t) => (editing ? setEditText(t) : setDraft(chat.id, t))}
          replyTo={replyTo}
          editing={editing}
          onCancelReply={() => setReplyTo(null)}
          onCancelEdit={() => {
            setEditing(null);
            setEditText("");
          }}
          onSend={(text, attachments) => {
            if (editing) {
              if (text !== editing.text) editMessage(chat.id, editing.id, text);
              setEditing(null);
              setEditText("");
              return;
            }
            send(chat.id, text, replyTo?.id, attachments);
            setReplyTo(null);
            setTimeout(() => list.current?.scrollToEnd({ animated: true }), 60);
          }}
        />
      </SafeAreaView>

      <MessageMenu
        message={menu}
        canSide={!chat.side}
        sideExists={Boolean(menu && chat.sideChats?.some((s) => s.rootId === menu.id))}
        translated={Boolean(menu && translated[menu.id] && translated[menu.id] !== "none")}
        onReact={(e) => {
          if (menu) react(chat.id, menu.id, e);
          setMenu(null);
        }}
        onAction={onAction}
        onClose={() => setMenu(null)}
      />
      {photos ? <PhotoViewer photos={photos.items} index={photos.index} onClose={() => setPhotos(null)} /> : null}
    </KeyboardAvoidingView>
  );
}

// Keep the store import used for debugging jumps without re-rendering on every change.
void getState;

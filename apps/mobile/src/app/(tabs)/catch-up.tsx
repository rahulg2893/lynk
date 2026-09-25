import { useEffect, useMemo, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { At, Check, ListChecks, Sparkle, X } from "phosphor-react-native";
import { messagePreview, personName, type Chat } from "@shared/chat";
import { useAccount } from "@/lib/account";
import { setDecision, setTask, useChatStore } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { Avatar, Button, ChatAvatar, Text } from "@/components/ui";

const SERIF = Platform.select({ ios: "Georgia", default: "serif" });

type Card = { kind: "plan" | "todo"; key: string; chat: Chat; id: string; title: string; detail: string };

function Count({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setN(Math.round((to * i) / 16));
      if (i >= 16) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [to]);
  return (
    <Text style={{ fontSize: 34, lineHeight: 40, fontWeight: "700", color: "#f5f5f7", fontVariant: ["tabular-nums"], marginTop: 4 }}>
      {n}
    </Text>
  );
}

/** "While you were away": what needs you across every chat. */
export default function CatchUp() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const account = useAccount();
  const { chats, loaded } = useChatStore();
  const name = (account?.profile.name ?? "there").split(" ")[0];

  const data = useMemo(() => {
    const mentions = chats.filter((ch) => ch.mentions > 0).map((ch) => ({ chat: ch, msg: [...ch.messages].reverse().find((m) => m.from !== "me") }));
    const deck: Card[] = [
      ...chats.flatMap((ch) => ch.decisions.filter((d) => d.status === "proposed").map((d) => ({ kind: "plan" as const, key: `p-${d.id}`, chat: ch, id: d.id, title: d.title, detail: d.detail }))),
      ...chats.flatMap((ch) => ch.tasks.filter((t) => t.assignee === "me" && t.status === "proposed").map((t) => ({ kind: "todo" as const, key: `t-${t.id}`, chat: ch, id: t.id, title: t.title, detail: t.due }))),
    ];
    const tasks = chats.flatMap((ch) => ch.tasks.filter((t) => t.assignee === "me" && t.status === "confirmed").map((t) => ({ chat: ch, t })));
    const unread = chats.reduce((n, ch) => n + (ch.muted ? 0 : ch.unread), 0);
    return { mentions, deck, tasks, unread };
  }, [chats]);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Up late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const open = (id: string, m?: string) => router.push({ pathname: "/chat/[id]", params: m ? { id, m } : { id } });

  return (
    <ScrollView contentInsetAdjustmentBehavior="never" style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 100, paddingHorizontal: 16, gap: 22 }}>
      <LinearGradient colors={["#132a5c", "#0b0c10", "#0b0c10"]} locations={[0, 0.6, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: 22 }}>
        <Text variant="footnote" weight="600" style={{ color: "rgba(255,255,255,0.6)" }}>
          {chats.length ? "While you were away" : "Welcome to Lynk"}
        </Text>
        <Text style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 44, color: "#f5f5f7", marginTop: 6 }}>
          {chats.length ? `${greeting}, ${name}.` : "Bring your people over."}
        </Text>
        {chats.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
            {[
              { label: "Unread", value: data.unread },
              { label: "Mentions", value: data.mentions.length },
              { label: "Waiting on you", value: data.deck.length },
              { label: "On your list", value: data.tasks.length },
            ].map((s) => (
              <View key={s.label} style={{ width: "47%", flexGrow: 1, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.05)" }}>
                <Text variant="caption" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {s.label}
                </Text>
                {loaded ? <Count to={s.value} /> : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 20 }}>
            <Button title="Start a chat" onPress={() => router.push("/new-chat")} />
          </View>
        )}
      </LinearGradient>

      {data.deck.length ? (
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Sparkle size={18} color={c.accentInk} weight="fill" />
            <Text variant="title2" style={{ flex: 1 }}>
              Waiting on you
            </Text>
            <Text variant="caption" tone="muted">
              Swipe right to save
            </Text>
          </View>
          <Deck cards={data.deck} onOpen={open} />
        </View>
      ) : null}

      {data.tasks.length ? (
        <View style={{ gap: 8 }}>
          <Text variant="title2">On your list</Text>
          {data.tasks.map(({ chat, t }) => (
            <Pressable key={t.id} onPress={() => open(chat.id, t.sources[0])} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: c.surface }}>
              <Pressable onPress={() => setTask(chat.id, t.id, "done")} accessibilityLabel={`Mark ${t.title} done`} hitSlop={8} style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: c.muted }} />
              <View style={{ flex: 1 }}>
                <Text weight="600">{t.title}</Text>
                <Text variant="footnote" tone="muted">
                  {chat.name} · {t.due}
                </Text>
              </View>
              <ListChecks size={18} color={c.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {data.mentions.length ? (
        <View style={{ gap: 8 }}>
          <Text variant="title2">Mentions</Text>
          {data.mentions.map(({ chat, msg }) => (
            <Pressable key={chat.id} onPress={() => open(chat.id, msg?.id)} style={{ flexDirection: "row", gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: c.surface }}>
              <ChatAvatar chat={chat} size={40} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <At size={14} color={c.accentInk} weight="bold" />
                  <Text weight="600">{chat.name}</Text>
                </View>
                {msg ? (
                  <Text variant="subhead" tone="muted" numberOfLines={2}>
                    {personName(msg.from).split(" ")[0]}: {messagePreview(msg)}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

/** Suggestions as a card deck: swipe right to save, left to dismiss, or use the buttons. */
function Deck({ cards, onOpen }: { cards: Card[]; onOpen: (chatId: string) => void }) {
  const c = useColors();
  const pos = useState(() => new Animated.ValueXY())[0];
  const top = cards[0];

  const decide = (keep: boolean) => {
    const card = top;
    if (!card) return;
    void Haptics.notificationAsync(keep ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    Animated.timing(pos, { toValue: { x: keep ? 500 : -500, y: 40 }, duration: 240, useNativeDriver: false }).start(() => {
      if (card.kind === "plan") setDecision(card.chat.id, card.id, keep ? "confirmed" : "rejected");
      else setTask(card.chat.id, card.id, keep ? "confirmed" : "rejected");
      pos.setValue({ x: 0, y: 0 });
    });
  };

  // Drag the top card; far enough right saves it, left dismisses it.
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-8, 8])
    .onUpdate((e) => pos.setValue({ x: e.translationX, y: e.translationY }))
    .onEnd((e) => {
      if (e.translationX > 110) decide(true);
      else if (e.translationX < -110) decide(false);
      else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
    });

  if (!top) return null;
  const rotate = pos.x.interpolate({ inputRange: [-300, 0, 300], outputRange: ["-12deg", "0deg", "12deg"] });
  const saveOpacity = pos.x.interpolate({ inputRange: [0, 110], outputRange: [0, 1], extrapolate: "clamp" });
  const skipOpacity = pos.x.interpolate({ inputRange: [-110, 0], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <View>
      <View style={{ height: 210 }}>
        {cards
          .slice(0, 3)
          .reverse()
          .map((card, ri, arr) => {
            const depth = arr.length - 1 - ri;
            const isTop = depth === 0;
            return (
              <GestureDetector key={card.key} gesture={isTop ? pan : Gesture.Tap().enabled(false)}>
              <Animated.View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: depth * 10,
                  height: 190,
                  borderRadius: radius.xl,
                  padding: 18,
                  backgroundColor: c.surface,
                  borderWidth: 0.5,
                  borderColor: c.line,
                  shadowColor: "#000",
                  shadowOpacity: isTop ? 0.12 : 0.05,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                  transform: isTop ? [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] : [{ scale: 1 - depth * 0.05 }],
                  opacity: isTop ? 1 : 1 - depth * 0.25,
                }}
              >
                {isTop ? (
                  <>
                    <Animated.View style={{ position: "absolute", top: 16, right: 16, opacity: saveOpacity, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 2, borderColor: c.positive }}>
                      <Text weight="800" style={{ color: c.positive }}>
                        SAVE
                      </Text>
                    </Animated.View>
                    <Animated.View style={{ position: "absolute", top: 16, right: 16, opacity: skipOpacity, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 2, borderColor: c.muted }}>
                      <Text weight="800" tone="muted">
                        SKIP
                      </Text>
                    </Animated.View>
                  </>
                ) : null}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Sparkle size={13} color={c.accentInk} weight="fill" />
                  <Text variant="caption" tone="accent" weight="700">
                    {card.kind === "plan" ? "Plan spotted" : "To-do for you"}
                  </Text>
                </View>
                <Text variant="title2" numberOfLines={2} style={{ marginTop: 8 }}>
                  {card.title}
                </Text>
                <Text variant="subhead" tone="muted" numberOfLines={1} style={{ marginTop: 4 }}>
                  {card.detail}
                </Text>
                <Pressable onPress={() => onOpen(card.chat.id)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: "auto" }}>
                  <Avatar id={card.chat.members[0] ?? card.chat.id} name={card.chat.name} group={card.chat.kind === "group"} size={24} />
                  <Text variant="footnote" tone="muted">
                    {card.chat.name}
                  </Text>
                </Pressable>
              </Animated.View>
              </GestureDetector>
            );
          })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 18, marginTop: 8 }}>
        <Pressable onPress={() => decide(false)} accessibilityLabel="Dismiss" style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}>
          <X size={24} color={c.muted} weight="bold" />
        </Pressable>
        <Pressable onPress={() => decide(true)} accessibilityLabel="Save" style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
          <Check size={26} color={c.onAccent} weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}

import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { CalendarBlank, CaretUp, ListChecks } from "phosphor-react-native";
import { formatWhen, upNext, upNextSummary, type Chat } from "@shared/chat";
import { applyListOp, setRsvp } from "@shared/chat-ops";
import { change, setTask } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { SideSafe } from "../SideSafe";
import { Text, tap } from "../ui";
import { Lists, PlanCard, TaskCard } from "./Cards";

/**
 * A pinned bar under the chat header: the next plan and what's still open.
 * Tap it for a sheet with this chat's plans, to-dos and lists, without leaving
 * the conversation. Hidden when the chat has nothing saved that's still ahead.
 */
export function UpNext({ chat, now, onJump }: { chat: Chat; now: number; onJump: (messageId: string) => void }) {
  const c = useColors();
  // What was open when the sheet opened, so ticking something off doesn't make it vanish mid-tap.
  const [shown, setShown] = useState<Set<string> | null>(null);
  // Every list id at open, so a list made from the sheet shows up in it too.
  const [known, setKnown] = useState<Set<string>>(new Set());
  const u = upNext(chat, now);
  if (!u && !shown) return null;
  const open = Boolean(shown);
  const sheet = {
    plans: chat.decisions.filter((d) => shown?.has(d.id)),
    todos: chat.tasks.filter((t) => shown?.has(t.id)),
    lists: (chat.lists ?? []).filter((l) => shown?.has(l.id) || (shown && !known.has(l.id))),
  };

  const plan = u?.plans[0];
  const title = !u ? "" : plan ? plan.title : u.todos[0]?.title ?? `${u.lists[0].title} list`;
  const summary = u ? [plan?.when ? formatWhen(plan) : "", upNextSummary(u)].filter(Boolean).join(" · ") : "";
  const close = (then?: () => void) => {
    setShown(null);
    if (then) setTimeout(then, 300);
  };

  return (
    <>
      {u ? (
      <Pressable
        onPress={() => {
          tap();
          setShown(new Set([...u.plans, ...u.todos, ...u.lists].map((x) => x.id)));
          setKnown(new Set((chat.lists ?? []).map((l) => l.id)));
        }}
        accessibilityRole="button"
        accessibilityLabel={`Up next: ${title}${summary ? `, ${summary}` : ""}. Show plans, to-dos and lists`}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: pressed ? c.surface2 : c.surface, borderBottomWidth: 0.5, borderBottomColor: c.line })}
      >
        <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
          {plan ? <CalendarBlank size={18} color={c.accentInk} weight="bold" /> : <ListChecks size={18} color={c.accentInk} weight="bold" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="subhead" weight="600" numberOfLines={1}>
            {title}
          </Text>
          {summary ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {summary}
            </Text>
          ) : null}
        </View>
        <CaretUp size={16} color={c.muted} weight="bold" />
      </Pressable>
      ) : null}

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => close()}>
        {/* A native modal sits outside the app's side insets, so it keeps clear of the Duo's side bars itself. */}
        <SideSafe>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text variant="title2">Up next</Text>
              <Text variant="footnote" tone="muted" numberOfLines={1}>
                Saved in {chat.name}
              </Text>
            </View>
            <Text tone="accent" weight="600" onPress={() => close()}>
              Done
            </Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }} keyboardShouldPersistTaps="handled">
            {sheet.plans.length ? <Heading>Plans</Heading> : null}
            {sheet.plans.map((d) => (
              <PlanCard
                key={d.id}
                chat={chat}
                plan={d}
                onRsvp={(a) => change(chat.id, (ch) => setRsvp(ch, d.id, "me", a))}
                onEdit={() => close(() => router.push({ pathname: "/plan", params: { chatId: chat.id, planId: d.id } }))}
                onJump={(m) => close(() => onJump(m))}
              />
            ))}
            {sheet.todos.length ? <Heading>To-dos</Heading> : null}
            {sheet.todos.map((t) => (
              <TaskCard key={t.id} task={t} onStatus={(s) => setTask(chat.id, t.id, s)} onJump={(m) => close(() => onJump(m))} />
            ))}
            <Heading>Lists</Heading>
            <Lists lists={sheet.lists} onChange={(op) => change(chat.id, (ch) => applyListOp(ch, op))} />
            <Pressable
              onPress={() => close(() => router.push({ pathname: "/chat-info/[id]", params: { id: chat.id } }))}
              style={{ alignSelf: "center", marginTop: 8, paddingHorizontal: 16, height: 40, borderRadius: radius.pill, justifyContent: "center" }}
            >
              <Text variant="subhead" tone="accent" weight="600">
                Past plans, done to-dos and memories
              </Text>
            </Pressable>
          </ScrollView>
        </SideSafe>
      </Modal>
    </>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <Text variant="footnote" tone="muted" weight="600" style={{ marginTop: 6, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {children}
    </Text>
  );
}

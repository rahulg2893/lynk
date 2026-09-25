import { useMemo, useState } from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarBlank, CaretLeft, CaretRight, DownloadSimple, Plus } from "phosphor-react-native";
import { allPlans, formatTime, type Chat, type Decision } from "@shared/chat";
import { setRsvp } from "@shared/chat-ops";
import { shareIcs } from "@/lib/calendar-export";
import { change, setDecision, useChatStore } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { PlanCard } from "@/components/chat/Cards";
import { IconButton, Text, tap } from "@/components/ui";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const startOfDay = (at: number) => new Date(at).setHours(0, 0, 0, 0);
const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);

function monthDays(year: number, month: number) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - offset + i).getTime());
}

/** Every plan from every chat: a month grid, the chosen day's agenda, and what's coming up. */
export default function CalendarTab() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { chats, now } = useChatStore();
  const [cursor, setCursor] = useState(() => ({ year: new Date(now).getFullYear(), month: new Date(now).getMonth() }));
  const [selected, setSelected] = useState(() => startOfDay(now));
  const slide = useState(() => new Animated.Value(0))[0];

  const plans = useMemo(() => allPlans(chats), [chats]);
  const byDay = useMemo(() => {
    const m = new Map<number, { chat: Chat; plan: Decision }[]>();
    for (const e of plans) {
      const k = startOfDay(e.plan.when!);
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return m;
  }, [plans]);

  const shift = (d: number) => {
    tap();
    slide.setValue(d * 40);
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, stiffness: 300, damping: 30 }).start();
    const n = new Date(cursor.year, cursor.month + d, 1);
    setCursor({ year: n.getFullYear(), month: n.getMonth() });
  };
  // Swipe the month sideways to change it.
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationX < -50) shift(1);
      else if (e.translationX > 50) shift(-1);
    });

  const goTo = (at: number) => {
    const d = new Date(at);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(startOfDay(at));
  };

  const days = monthDays(cursor.year, cursor.month);
  const onDay = byDay.get(selected) ?? [];
  const upcoming = plans.filter((e) => e.plan.when! >= startOfDay(now) && !sameDay(e.plan.when!, selected)).slice(0, 5);
  const exportable = plans.filter((e) => e.plan.status === "confirmed" && e.plan.when! >= startOfDay(now));
  const label = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(cursor.year, cursor.month, 1));
  const newPlan = (day: number) => router.push({ pathname: "/plan", params: { when: String(day + 19 * 3_600_000) } });

  return (
    <ScrollView contentInsetAdjustmentBehavior="never" style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 100, paddingHorizontal: 16, gap: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View>
          <Text variant="footnote" tone="muted" weight="600">
            Calendar
          </Text>
          <Text variant="largeTitle">{label}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6, paddingBottom: 4 }}>
          <IconButton label="Export upcoming plans" onPress={() => exportable.length && void shareIcs(exportable)} style={{ backgroundColor: c.surface, opacity: exportable.length ? 1 : 0.4 }}>
            <DownloadSimple size={19} color={c.ink} weight="bold" />
          </IconButton>
          <IconButton label="New plan" filled onPress={() => newPlan(selected)}>
            <Plus size={19} color={c.onAccent} weight="bold" />
          </IconButton>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <IconButton label="Previous month" onPress={() => shift(-1)}>
          <CaretLeft size={20} color={c.accentInk} weight="bold" />
        </IconButton>
        <Pressable onPress={() => goTo(now)} style={{ paddingHorizontal: 14, height: 32, borderRadius: radius.pill, backgroundColor: c.surface, justifyContent: "center" }}>
          <Text variant="footnote" weight="600">
            Today
          </Text>
        </Pressable>
        <IconButton label="Next month" onPress={() => shift(1)}>
          <CaretRight size={20} color={c.accentInk} weight="bold" />
        </IconButton>
      </View>

      <GestureDetector gesture={swipe}>
      <View style={{ borderRadius: radius.xl, backgroundColor: c.surface, padding: 8 }}>
        <View style={{ flexDirection: "row" }}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} variant="caption" tone="muted" weight="700" style={{ flex: 1, textAlign: "center", paddingVertical: 6 }}>
              {w}
            </Text>
          ))}
        </View>
        <Animated.View style={{ flexDirection: "row", flexWrap: "wrap", transform: [{ translateX: slide }] }}>
          {days.map((d) => {
            const inMonth = new Date(d).getMonth() === cursor.month;
            const isToday = sameDay(d, now);
            const on = d === selected;
            const items = byDay.get(d) ?? [];
            return (
              <Pressable
                key={d}
                onPress={() => {
                  tap();
                  setSelected(d);
                }}
                accessibilityLabel={`${new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(d)}${items.length ? `, ${items.length} plans` : ""}`}
                accessibilityState={{ selected: on }}
                style={{ width: `${100 / 7}%`, height: 52, alignItems: "center", paddingTop: 4, opacity: inMonth ? 1 : 0.35 }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: isToday ? c.accent : on ? c.accentSoft : "transparent", borderWidth: on && !isToday ? 1.5 : 0, borderColor: c.accent }}>
                  <Text variant="subhead" weight={isToday || on ? "700" : "400"} style={{ color: isToday ? c.onAccent : c.ink }}>
                    {new Date(d).getDate()}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 3, marginTop: 3 }}>
                  {items.slice(0, 3).map(({ plan }, i) => (
                    <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: plan.status === "proposed" ? "transparent" : c.accent, borderWidth: 1, borderColor: c.accent }} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      </View>
      </GestureDetector>

      <View style={{ gap: 10 }}>
        <Text variant="title2">{sameDay(selected, now) ? "Today" : new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(selected)}</Text>
        {onDay.length ? (
          onDay.map(({ chat, plan }) => (
            <PlanCard
              key={`${chat.id}-${plan.id}`}
              chat={chat}
              plan={plan}
              showChat
              onRsvp={(a) => change(chat.id, (ch) => setRsvp(ch, plan.id, "me", a))}
              onEdit={() => router.push({ pathname: "/plan", params: { chatId: chat.id, planId: plan.id } })}
              onConfirm={() => setDecision(chat.id, plan.id, "confirmed")}
              onReject={() => setDecision(chat.id, plan.id, "rejected")}
              onJump={(m) => router.push({ pathname: "/chat/[id]", params: { id: chat.id, m } })}
            />
          ))
        ) : (
          <View style={{ alignItems: "center", gap: 8, padding: 22, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: c.line }}>
            <CalendarBlank size={26} color={c.muted} />
            <Text tone="muted">Nothing planned.</Text>
            <Pressable onPress={() => newPlan(selected)} style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: c.surface2 }}>
              <Plus size={14} color={c.ink} weight="bold" />
              <Text variant="footnote" weight="600">
                Plan something
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {upcoming.length ? (
        <View style={{ gap: 6 }}>
          <Text variant="footnote" tone="muted" weight="700">
            Coming up
          </Text>
          {upcoming.map(({ chat, plan }) => (
            <Pressable key={`${chat.id}-${plan.id}`} onPress={() => goTo(plan.when!)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: radius.lg, backgroundColor: pressed ? c.surface2 : "transparent" })}>
              <View style={{ width: 48, paddingVertical: 4, borderRadius: 12, backgroundColor: c.surface, alignItems: "center" }}>
                <Text variant="caption" tone="accent" weight="700">
                  {new Intl.DateTimeFormat(undefined, { month: "short" }).format(plan.when).toUpperCase()}
                </Text>
                <Text variant="title2">{new Date(plan.when!).getDate()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text weight="600" numberOfLines={1}>
                  {plan.title}
                </Text>
                <Text variant="footnote" tone="muted" numberOfLines={1}>
                  {plan.allDay ? "All day" : formatTime(plan.when!)} · {chat.name}
                  {plan.status === "proposed" ? " · suggested" : ""}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

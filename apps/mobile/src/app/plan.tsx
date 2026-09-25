import { useState } from "react";
import { Platform, Pressable, ScrollView, Switch, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check } from "phosphor-react-native";
import { removePlan, setRsvp, upsertPlan } from "@shared/chat-ops";
import { confirm } from "@/lib/sheet";
import { change, setDecision, simulateRsvp, useChatStore } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { Button, ChatAvatar, Field, Text } from "@/components/ui";

/**
 * Make or edit a plan by hand: what, when and where. The time is optional;
 * without one it's an all-day event in calendars. Opened from a chat, a
 * message, a suggestion card or the calendar (which asks which chat).
 */
export default function PlanScreen() {
  const params = useLocalSearchParams<{ chatId?: string; planId?: string; title?: string; sources?: string; when?: string; confirmOnSave?: string }>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { chats } = useChatStore();
  const existing = params.chatId && params.planId ? chats.find((x) => x.id === params.chatId)?.decisions.find((d) => d.id === params.planId) : undefined;

  const [title, setTitle] = useState(existing?.title ?? params.title ?? "");
  const [where, setWhere] = useState(existing?.where ?? "");
  const [chatId, setChatId] = useState(params.chatId ?? chats[0]?.id ?? "");
  const start = existing?.when ?? (params.when ? Number(params.when) : null);
  const [date, setDate] = useState<Date | null>(start ? new Date(start) : null);
  const [hasTime, setHasTime] = useState(Boolean(start) ? !existing?.allDay : true);
  const [error, setError] = useState<string | null>(null);

  const when = date ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    return d;
  })();

  const pickAndroid = (mode: "date" | "time") =>
    DateTimePickerAndroid.open({ value: when, mode, is24Hour: false, onValueChange: (_, d) => setDate(d) });

  const save = () => {
    if (!title.trim()) return setError("Say what the plan is.");
    if (!chatId) return setError("Pick a chat for this plan.");
    const at = date ? new Date(date) : null;
    if (at && !hasTime) at.setHours(9, 0, 0, 0);
    const input = {
      id: existing?.id,
      title: title.trim(),
      when: at?.getTime(),
      allDay: Boolean(at && !hasTime),
      where: where.trim() || undefined,
      sources: params.sources ? params.sources.split(",").filter(Boolean) : undefined,
    };
    const before = chats.find((x) => x.id === chatId)?.decisions.length ?? 0;
    change(chatId, (ch) => upsertPlan(ch, input));
    if (existing && params.confirmOnSave) setDecision(chatId, existing.id, "confirmed");
    // Someone in the chat answers shortly after a new plan appears.
    if (!existing)
      simulateRsvp(chatId, "", (ch, _id, who) => {
        const p = ch.decisions[before];
        return p ? setRsvp(ch, p.id, who, "going") : ch;
      });
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 18 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text tone="accent">Cancel</Text>
        </Pressable>
        <Text variant="headline">{existing ? "Edit plan" : "New plan"}</Text>
        <Pressable onPress={save} hitSlop={8}>
          <Text tone="accent" weight="700">
            {existing ? "Save" : "Make"}
          </Text>
        </Pressable>
      </View>
      {!existing ? (
        <Text variant="subhead" tone="muted">
          Everyone in the chat sees it and can say if they&apos;re coming.
        </Text>
      ) : null}

      <Field
        label="What"
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          setError(null);
        }}
        placeholder="Climbing at Boulder Barn"
        maxLength={80}
        autoFocus={!existing}
        error={error}
      />

      <View style={{ borderRadius: radius.lg, backgroundColor: c.surface, padding: 14, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text weight="600">Date</Text>
          {date ? null : (
            <Pressable onPress={() => setDate(when)}>
              <Text tone="accent" weight="600">
                Add a date
              </Text>
            </Pressable>
          )}
          {date && Platform.OS === "ios" ? <DateTimePicker value={date} mode="date" display="compact" onValueChange={(_, d) => setDate(d)} accentColor={c.accent} /> : null}
          {date && Platform.OS === "android" ? (
            <Pressable onPress={() => pickAndroid("date")}>
              <Text tone="accent">{new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(date)}</Text>
            </Pressable>
          ) : null}
        </View>
        {date ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text weight="600">At a time</Text>
              <Switch value={hasTime} onValueChange={setHasTime} trackColor={{ true: c.accent, false: c.surface2 }} />
            </View>
            {hasTime ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text weight="600">Time</Text>
                {Platform.OS === "ios" ? (
                  <DateTimePicker value={date} mode="time" display="compact" onValueChange={(_, d) => setDate(d)} accentColor={c.accent} />
                ) : (
                  <Pressable onPress={() => pickAndroid("time")}>
                    <Text tone="accent">{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)}</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Text variant="footnote" tone="muted">
                All day in your calendar.
              </Text>
            )}
          </>
        ) : null}
      </View>

      <Field label="Where" value={where} onChangeText={setWhere} placeholder="Add a place" optional maxLength={80} />

      {!params.chatId ? (
        <View>
          <Text variant="footnote" weight="600" style={{ paddingHorizontal: 16, marginBottom: 6 }}>
            Chat
          </Text>
          <View style={{ borderRadius: radius.lg, backgroundColor: c.surface, overflow: "hidden" }}>
            {chats.map((ch, i) => (
              <Pressable key={ch.id} onPress={() => setChatId(ch.id)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: pressed ? c.surface2 : "transparent", borderTopWidth: i ? 0.5 : 0, borderTopColor: c.line })}>
                <ChatAvatar chat={ch} size={32} />
                <Text style={{ flex: 1 }}>{ch.name}</Text>
                {chatId === ch.id ? <Check size={18} color={c.accentInk} weight="bold" /> : null}
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Button title={existing ? "Save plan" : "Make plan"} variant="primary" size="lg" onPress={save} />
      {existing && params.chatId ? (
        <Button
          title="Remove plan"
          variant="dangerQuiet"
          onPress={() =>
            confirm("Remove this plan?", "It's removed for everyone in the chat.", "Remove", () => {
              change(params.chatId!, (ch) => removePlan(ch, existing.id));
              router.back();
            })
          }
        />
      ) : null}
    </ScrollView>
  );
}

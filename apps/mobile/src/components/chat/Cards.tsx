import { useEffect, useState } from "react";
import { Animated, Pressable, TextInput, View } from "react-native";
import { CalendarPlus, Check, CheckSquare, Clock, DotsThree, ListChecks, MapPin, PencilSimple, Plus, Sparkle, Square, X } from "phosphor-react-native";
import { firstName, formatWhen, newId, personName, rsvpSummary, RSVP_LABEL, type Chat, type Decision, type Rsvp, type SharedList, type Task } from "@shared/chat";
import type { ListOp } from "@shared/chat-ops";
import { shareIcs } from "@/lib/calendar-export";
import { actionSheet } from "@/lib/sheet";
import { radius, useColors } from "@/lib/theme";
import { Avatar, Text, tap } from "../ui";

const ANSWERS: Rsvp[] = ["going", "maybe", "no"];

/** A plan: what, when, where and who's coming. Suggested ones ask to be confirmed; confirmed ones take RSVPs. */
export function PlanCard({
  chat,
  plan,
  showChat,
  onRsvp,
  onEdit,
  onConfirm,
  onReject,
  onJump,
}: {
  chat: Chat;
  plan: Decision;
  showChat?: boolean;
  onRsvp: (a: Rsvp | null) => void;
  onEdit?: () => void;
  onConfirm?: () => void;
  onReject?: () => void;
  onJump?: (messageId: string) => void;
}) {
  const c = useColors();
  const proposed = plan.status === "proposed";
  const mine = plan.rsvp?.me;
  const people = Object.entries(plan.rsvp ?? {}).filter(([, a]) => a !== "no");
  return (
    <View style={{ borderRadius: radius.lg, padding: 14, backgroundColor: proposed ? c.bg : c.surface, borderWidth: 1, borderStyle: proposed ? "dashed" : "solid", borderColor: c.line, opacity: plan.status === "rejected" ? 0.6 : 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {proposed ? <Sparkle size={13} color={c.accentInk} weight="fill" /> : null}
        <Text variant="caption" tone="muted" weight="600" style={{ flex: 1 }} numberOfLines={1}>
          {proposed ? "Suggested by Lynk" : plan.status === "rejected" ? "Rejected" : plan.by ? `Made by ${plan.by === "me" ? "you" : firstName(plan.by)}` : "Confirmed"}
          {showChat ? ` · ${chat.name}` : ""}
        </Text>
        {onEdit && !proposed ? (
          <Pressable onPress={onEdit} accessibilityLabel={`Edit ${plan.title}`} hitSlop={8}>
            <PencilSimple size={16} color={c.muted} />
          </Pressable>
        ) : null}
      </View>
      <Text variant="headline" style={{ marginTop: 4 }}>
        {plan.title}
      </Text>
      <View style={{ marginTop: 6, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Clock size={14} color={c.muted} />
          <Text variant="footnote" tone="muted">
            {formatWhen(plan)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MapPin size={14} color={c.muted} />
          <Text variant="footnote" tone="muted">
            {plan.where ?? "Place still open"}
          </Text>
        </View>
      </View>

      {proposed ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <SmallButton label="Confirm" icon={<Check size={14} color={c.bg} weight="bold" />} dark onPress={onConfirm} />
          <SmallButton label="Not this" icon={<X size={14} color={c.ink} />} onPress={onReject} />
        </View>
      ) : plan.status === "confirmed" ? (
        <>
          <View accessibilityRole="radiogroup" style={{ flexDirection: "row", marginTop: 12, padding: 3, borderRadius: radius.pill, backgroundColor: c.surface2 }}>
            {ANSWERS.map((a) => {
              const on = mine === a;
              return (
                <Pressable
                  key={a}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    tap();
                    onRsvp(on ? null : a);
                  }}
                  style={{ flex: 1, height: 32, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: on ? (a === "going" ? c.accent : c.surface) : "transparent" }}
                >
                  <Text variant="footnote" weight="600" style={{ color: on ? (a === "going" ? c.onAccent : c.ink) : c.muted }}>
                    {RSVP_LABEL[a]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
            <View style={{ flexDirection: "row" }}>
              {people.slice(0, 4).map(([id], i) => (
                <View key={id} style={{ marginLeft: i ? -6 : 0, borderRadius: 7, borderWidth: 2, borderColor: c.surface }}>
                  <Avatar id={id} name={personName(id)} size={18} />
                </View>
              ))}
            </View>
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              {rsvpSummary(plan)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <SmallButton label="Add to calendar" icon={<CalendarPlus size={15} color={c.ink} />} disabled={!plan.when} onPress={() => void shareIcs([{ chat, plan }])} />
          </View>
        </>
      ) : null}

      {plan.sources.length && onJump ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, marginTop: 10 }}>
          <Text variant="caption" tone="muted">
            From
          </Text>
          {plan.sources.map((id, i) => (
            <Pressable key={id} onPress={() => onJump(id)} accessibilityLabel={`Jump to source message ${i + 1}`} style={{ minWidth: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" }}>
              <Text variant="caption">{i + 1}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function SmallButton({ label, icon, onPress, dark, primary, disabled }: { label: string; icon?: React.ReactNode; onPress?: () => void; dark?: boolean; primary?: boolean; disabled?: boolean }) {
  const c = useColors();
  const bg = primary ? c.accent : dark ? c.ink : c.surface;
  const fg = primary ? c.onAccent : dark ? c.bg : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        backgroundColor: bg,
        borderWidth: primary || dark ? 0 : 1,
        borderColor: c.line,
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      })}
    >
      {icon}
      <Text variant="footnote" weight="600" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** What Lynk spotted, right under the message it came from. Nothing is kept until someone taps Save. */
export function SuggestionCard({ plan, task, onSave, onDismiss, onEdit }: { plan?: Decision; task?: Task; onSave: () => void; onDismiss: () => void; onEdit?: () => void }) {
  const c = useColors();
  const enter = useState(() => new Animated.Value(0))[0];
  const shine = useState(() => new Animated.Value(0))[0];
  const [w, setW] = useState(300);
  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, stiffness: 300, damping: 24 }).start();
    Animated.timing(shine, { toValue: 1, duration: 1300, delay: 200, useNativeDriver: true }).start();
  }, [enter, shine]);
  return (
    <Animated.View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{
        marginLeft: 52,
        marginRight: 8,
        marginVertical: 6,
        borderRadius: radius.lg,
        padding: 14,
        overflow: "hidden",
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.accent + "66",
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }, { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, bottom: 0, width: 80, backgroundColor: c.accent, opacity: 0.08, transform: [{ translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-100, w + 100] }) }, { skewX: "-20deg" }] }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Sparkle size={13} color={c.accentInk} weight="fill" />
        <Text variant="caption" tone="accent" weight="700">
          {plan ? "Save this plan?" : "Add to your to-dos?"}
        </Text>
      </View>
      {plan ? (
        <>
          <Text variant="headline" style={{ marginTop: 4 }}>
            {plan.title}
          </Text>
          <Text variant="footnote" tone="muted" style={{ marginTop: 4 }}>
            {formatWhen(plan)} · {plan.where ?? "Place still open"}
          </Text>
        </>
      ) : task ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <ListChecks size={16} color={c.accentInk} />
            <Text variant="headline" style={{ flex: 1 }}>
              {task.title}
            </Text>
          </View>
          <Text variant="footnote" tone="muted" style={{ marginTop: 4 }}>
            {task.assignee === "me" ? "For you" : `For ${firstName(task.assignee)}`}, {task.due}
          </Text>
        </>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <SmallButton label="Save" primary icon={<Check size={14} color={c.onAccent} weight="bold" />} onPress={onSave} />
        {onEdit ? <SmallButton label="Edit" icon={<PencilSimple size={14} color={c.ink} />} onPress={onEdit} /> : null}
        <SmallButton label="Dismiss" icon={<X size={14} color={c.ink} />} onPress={onDismiss} />
      </View>
    </Animated.View>
  );
}

/** Shared checklists: anyone can add, tick off and clear. */
export function Lists({ lists, onChange }: { lists: SharedList[]; onChange: (op: ListOp) => void }) {
  const c = useColors();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const create = (t: string) => {
    if (!t.trim()) return;
    onChange({ op: "create", title: t.trim(), listId: newId("l") });
    setTitle("");
    setCreating(false);
  };
  return (
    <View style={{ gap: 12 }}>
      {lists.length === 0 && !creating ? (
        <Text variant="subhead" tone="muted" style={{ textAlign: "center", paddingVertical: 24 }}>
          Shopping, packing, ideas for the party: lists everyone here can tick off.
        </Text>
      ) : null}
      {lists.map((l) => (
        <ListCard key={l.id} list={l} onChange={onChange} />
      ))}
      {creating ? (
        <View style={{ borderRadius: radius.lg, padding: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.accent }}>
          <Text variant="caption" tone="muted" weight="600">
            New list
          </Text>
          <TextInput value={title} onChangeText={setTitle} autoFocus placeholder="What's it for?" placeholderTextColor={c.muted} onSubmitEditing={() => create(title)} returnKeyType="done" style={{ fontSize: 17, fontWeight: "600", color: c.ink, paddingVertical: 6 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {["Shopping", "Packing", "Ideas"].map((s) => (
              <SmallButton key={s} label={s} onPress={() => create(s)} />
            ))}
            <View style={{ flex: 1 }} />
            <SmallButton label="Create" primary disabled={!title.trim()} onPress={() => create(title)} />
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            tap();
            setCreating(true);
          }}
          style={{ height: 44, borderRadius: radius.pill, borderWidth: 1, borderStyle: "dashed", borderColor: c.line, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Plus size={16} color={c.muted} weight="bold" />
          <Text weight="600" tone="muted">
            New list
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function ListCard({ list, onChange }: { list: SharedList; onChange: (op: ListOp) => void }) {
  const c = useColors();
  const [text, setText] = useState("");
  const done = list.items.filter((i) => i.done).length;
  const total = list.items.length;
  const add = () => {
    if (!text.trim()) return;
    onChange({ op: "add", listId: list.id, text: text.trim(), by: "me" });
    setText("");
  };
  return (
    <View style={{ borderRadius: radius.lg, padding: 14, backgroundColor: c.surface }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text variant="headline" style={{ flex: 1 }} numberOfLines={1}>
          {list.title}
        </Text>
        <Text variant="caption" tone="muted">
          {total ? `${done} of ${total}` : "Empty"}
        </Text>
        <Pressable
          accessibilityLabel={`More for ${list.title}`}
          hitSlop={8}
          onPress={() =>
            actionSheet(list.title, [
              ...(done ? [{ label: "Clear ticked items", onPress: () => onChange({ op: "clear", listId: list.id }) }] : []),
              { label: "Delete list", destructive: true, onPress: () => onChange({ op: "delete", listId: list.id }) },
            ])
          }
        >
          <DotsThree size={22} color={c.muted} weight="bold" />
        </Pressable>
      </View>
      {total ? (
        <View style={{ height: 4, borderRadius: 2, backgroundColor: c.surface2, marginTop: 10, overflow: "hidden" }}>
          <View style={{ height: 4, width: `${(done / total) * 100}%`, backgroundColor: c.accent }} />
        </View>
      ) : null}
      <View style={{ marginTop: 6 }}>
        {list.items.map((i) => (
          <Pressable
            key={i.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: i.done }}
            onPress={() => {
              tap();
              onChange({ op: "toggle", listId: list.id, itemId: i.id });
            }}
            onLongPress={() => actionSheet(i.text, [{ label: "Remove", destructive: true, onPress: () => onChange({ op: "remove", listId: list.id, itemId: i.id }) }])}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}
          >
            {i.done ? <CheckSquare size={22} color={c.accent} weight="fill" /> : <Square size={22} color={c.muted} />}
            <Text style={{ flex: 1, color: i.done ? c.muted : c.ink, textDecorationLine: i.done ? "line-through" : "none" }}>{i.text}</Text>
            {i.by !== "me" ? (
              <Text variant="caption" tone="muted">
                {firstName(i.by)}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 }}>
        <Plus size={18} color={c.muted} />
        <TextInput value={text} onChangeText={setText} placeholder="Add an item" placeholderTextColor={c.muted} onSubmitEditing={add} returnKeyType="done" blurOnSubmit={false} style={{ flex: 1, fontSize: 17, color: c.ink, paddingVertical: 8 }} />
      </View>
    </View>
  );
}

import { useEffect, useState } from "react";
import { Animated, Pressable, Share, TextInput, View } from "react-native";
import { BellRinging, CalendarPlus, ChartBar, Check, ShareNetwork, CheckCircle, CheckSquare, Clock, DotsThree, ListChecks, MapPin, PencilSimple, Plus, Sparkle, Square, X } from "phosphor-react-native";
import { firstName, formatWhen, newId, notAnswered, personName, rsvpSummary, RSVP_LABEL, type Chat, type Decision, type Poll, type Rsvp, type SharedList, type Task } from "@shared/chat";
import type { ListOp } from "@shared/chat-ops";
import { shareIcs } from "@/lib/calendar-export";
import { useAccount } from "@/lib/account";
import { planInviteText } from "@shared/plan-link";
import { askForReminders } from "@/lib/reminders";
import { actionSheet } from "@/lib/sheet";
import { radius, useColors } from "@/lib/theme";
import { Avatar, Text, tap } from "../ui";
import { t } from "@shared/i18n";

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
  onNudge,
  answersLater = false,
}: {
  chat: Chat;
  plan: Decision;
  showChat?: boolean;
  onRsvp: (a: Rsvp | null) => void;
  onEdit?: () => void;
  onConfirm?: () => void;
  onReject?: () => void;
  onJump?: (messageId: string) => void;
  /** Post a message asking the people who haven't answered. */
  onNudge?: () => void;
  /** A later week of a weekly plan: people answer once the week before is over. */
  answersLater?: boolean;
}) {
  const c = useColors();
  const me = useAccount()?.profile.name.split(" ")[0] || "A friend";
  const waiting = notAnswered(chat, plan);
  const proposed = plan.status === "proposed";
  const mine = plan.rsvp?.me;
  const people = Object.entries(plan.rsvp ?? {}).filter(([, a]) => a !== "no");
  return (
    <View style={{ borderRadius: radius.lg, padding: 14, backgroundColor: proposed ? c.bg : c.surface, borderWidth: 1, borderStyle: proposed ? "dashed" : "solid", borderColor: c.line, opacity: plan.status === "rejected" ? 0.6 : 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {proposed ? <Sparkle size={13} color={c.accentInk} weight="fill" /> : null}
        <Text variant="caption" tone="muted" weight="600" style={{ flex: 1 }} numberOfLines={1}>
          {proposed ? t("Suggested by Lynk") : plan.status === "rejected" ? t("Rejected") : plan.by ? t("Made by {name}", { name: plan.by === "me" ? t("you") : firstName(plan.by) }) : t("Confirmed")}
          {showChat ? ` · ${chat.name}` : ""}
        </Text>
        {onEdit && !proposed ? (
          <Pressable onPress={onEdit} accessibilityLabel={t("Edit {name}", { name: plan.title })} hitSlop={8}>
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
            {plan.where ?? t("Place still open")}
          </Text>
        </View>
      </View>

      {proposed ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <SmallButton label={t("Confirm")} icon={<Check size={14} color={c.bg} weight="bold" />} dark onPress={onConfirm} />
          <SmallButton label={t("Not this")} icon={<X size={14} color={c.ink} />} onPress={onReject} />
        </View>
      ) : plan.status === "confirmed" && answersLater ? (
        <Text variant="footnote" tone="muted" style={{ marginTop: 12 }}>
          {t("Every week. Answers open once the week before is over.")}
        </Text>
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
                    if (!on && a !== "no") void askForReminders();
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
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <SmallButton label={t("Add to calendar")} icon={<CalendarPlus size={15} color={c.ink} />} disabled={!plan.when} onPress={() => void shareIcs([{ chat, plan }])} />
            <SmallButton label={t("Invite friends")} icon={<ShareNetwork size={15} color={c.ink} />} onPress={() => void Share.share({ message: planInviteText(chat, plan, me) })} />
            {onNudge && waiting.length ? (
              <SmallButton
                label={waiting.length === 1 ? t("Ask {name}", { name: firstName(waiting[0]) }) : t("Ask the {n} who haven't answered", { n: waiting.length })}
                icon={<BellRinging size={15} color={c.ink} />}
                onPress={onNudge}
              />
            ) : null}
          </View>
        </>
      ) : null}

      {plan.sources.length && onJump ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, marginTop: 10 }}>
          <Text variant="caption" tone="muted">
            {t("From")}
          </Text>
          {plan.sources.map((id, i) => (
            <Pressable key={id} onPress={() => onJump(id)} accessibilityLabel={t("Jump to source message {n}", { n: i + 1 })} style={{ minWidth: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" }}>
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
          {plan ? t("Save this plan?") : t("Add to your to-dos?")}
        </Text>
      </View>
      {plan ? (
        <>
          <Text variant="headline" style={{ marginTop: 4 }}>
            {plan.title}
          </Text>
          <Text variant="footnote" tone="muted" style={{ marginTop: 4 }}>
            {formatWhen(plan)} · {plan.where ?? t("Place still open")}
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
            {task.assignee === "me" ? t("For you") : t("For {name}", { name: firstName(task.assignee) })}, {t(task.due)}
          </Text>
        </>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <SmallButton label={t("Save")} primary icon={<Check size={14} color={c.onAccent} weight="bold" />} onPress={onSave} />
        {onEdit ? <SmallButton label={t("Edit")} icon={<PencilSimple size={14} color={c.ink} />} onPress={onEdit} /> : null}
        <SmallButton label={t("Dismiss")} icon={<X size={14} color={c.ink} />} onPress={onDismiss} />
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
          {t("Shopping, packing, ideas for the party: lists everyone here can tick off.")}
        </Text>
      ) : null}
      {lists.map((l) => (
        <ListCard key={l.id} list={l} onChange={onChange} />
      ))}
      {creating ? (
        <View style={{ borderRadius: radius.lg, padding: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.accent }}>
          <Text variant="caption" tone="muted" weight="600">
            {t("New list")}
          </Text>
          <TextInput value={title} onChangeText={setTitle} autoFocus placeholder={t("What's it for?")} placeholderTextColor={c.muted} onSubmitEditing={() => create(title)} returnKeyType="done" style={{ fontSize: 17, fontWeight: "600", color: c.ink, paddingVertical: 6 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {[t("Shopping"), t("Packing"), t("Ideas")].map((s) => (
              <SmallButton key={s} label={s} onPress={() => create(s)} />
            ))}
            <View style={{ flex: 1 }} />
            <SmallButton label={t("Create")} primary disabled={!title.trim()} onPress={() => create(title)} />
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
            {t("New list")}
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
          {total ? t("{done} of {total}", { done, total }) : t("Empty")}
        </Text>
        <Pressable
          accessibilityLabel={t("More for {name}", { name: list.title })}
          hitSlop={8}
          onPress={() =>
            actionSheet(list.title, [
              ...(done ? [{ label: t("Clear ticked items"), onPress: () => onChange({ op: "clear", listId: list.id }) }] : []),
              { label: t("Delete list"), destructive: true, onPress: () => onChange({ op: "delete", listId: list.id }) },
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
            onLongPress={() => actionSheet(i.text, [{ label: t("Remove"), destructive: true, onPress: () => onChange({ op: "remove", listId: list.id, itemId: i.id }) }])}
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
        <TextInput value={text} onChangeText={setText} placeholder={t("Add an item")} placeholderTextColor={c.muted} onSubmitEditing={add} returnKeyType="done" blurOnSubmit={false} style={{ flex: 1, fontSize: 17, color: c.ink, paddingVertical: 8 }} />
      </View>
    </View>
  );
}

/** A to-do: suggested ones ask to be confirmed; yours can be marked done. */
export function TaskCard({ task, onStatus, onJump }: { task: Task; onStatus: (s: Task["status"]) => void; onJump: (id: string) => void }) {
  const c = useColors();
  const proposed = task.status === "proposed";
  return (
    <View style={{ borderRadius: radius.lg, padding: 14, backgroundColor: proposed ? c.bg : c.surface, borderWidth: 1, borderStyle: proposed ? "dashed" : "solid", borderColor: c.line, opacity: task.status === "rejected" ? 0.6 : 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {proposed ? <Sparkle size={13} color={c.accentInk} weight="fill" /> : <CheckCircle size={14} color={c.positive} weight="fill" />}
        <Text variant="caption" tone="muted" weight="600">
          {proposed ? t("Suggested") : task.status === "done" ? t("Done") : task.status === "rejected" ? t("Rejected") : t("Confirmed")}
        </Text>
      </View>
      <Text variant="headline" style={{ marginTop: 4, textDecorationLine: task.status === "done" ? "line-through" : "none" }}>
        {task.title}
      </Text>
      <Text variant="footnote" tone="muted" style={{ marginTop: 2 }}>
        {task.assignee === "me" ? t("You") : firstName(task.assignee)}, {t(task.due)}
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {proposed ? (
          <>
            <SmallButton label={t("Confirm")} primary onPress={() => onStatus("confirmed")} />
            <SmallButton label={t("Reject")} onPress={() => onStatus("rejected")} />
          </>
        ) : task.status === "confirmed" && task.assignee === "me" ? (
          <SmallButton label={t("Mark done")} icon={<CheckCircle size={15} color={c.ink} />} onPress={() => onStatus("done")} />
        ) : null}
        {task.sources.length ? <SmallButton label={t("Source")} onPress={() => onJump(task.sources[0])} /> : null}
      </View>
    </View>
  );
}

/**
 * A poll inside a message: one vote each, live counts, and for whoever asked,
 * "Make it the plan" on the leading option once someone has voted.
 */
export function PollCard({ poll, mine, onVote, onDecide }: { poll: Poll; mine: boolean; onVote: (optionId: string) => void; onDecide: (optionId: string) => void }) {
  const c = useColors();
  const total = poll.options.reduce((n, o) => n + o.votes.length, 0);
  const lead = [...poll.options].sort((a, b) => b.votes.length - a.votes.length)[0];
  const decided = poll.options.find((o) => o.id === poll.decided);
  return (
    <View style={{ marginTop: 6, maxWidth: 320, borderRadius: radius.lg, padding: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <ChartBar size={13} color={c.muted} weight="bold" />
        <Text variant="caption" tone="muted" weight="600">
          Poll · {total} {total === 1 ? "vote" : "votes"}
        </Text>
      </View>
      <Text variant="headline" style={{ marginTop: 4 }}>
        {poll.question}
      </Text>
      <View style={{ gap: 6, marginTop: 10 }}>
        {poll.options.map((o) => {
          const chosen = o.votes.includes("me");
          const share = total ? o.votes.length / total : 0;
          return (
            <Pressable
              key={o.id}
              disabled={Boolean(poll.decided)}
              onPress={() => {
                tap();
                onVote(o.id);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: chosen, disabled: Boolean(poll.decided) }}
              accessibilityLabel={`${o.text}, ${o.votes.length} ${o.votes.length === 1 ? "vote" : "votes"}`}
              style={{ minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: chosen ? c.accent : c.line, overflow: "hidden", justifyContent: "center", paddingHorizontal: 12 }}
            >
              <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${share * 100}%`, backgroundColor: c.accentSoft }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {chosen ? <Check size={14} color={c.accentInk} weight="bold" /> : null}
                <Text weight="600" style={{ flex: 1 }} numberOfLines={1}>
                  {o.text}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1} style={{ maxWidth: 120 }}>
                  {o.votes.length ? o.votes.map((v) => firstName(v)).join(", ") : "0"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {decided ? (
        <Text variant="footnote" tone="muted" style={{ marginTop: 10 }}>
          Made into a plan: {decided.text}
        </Text>
      ) : mine && lead?.votes.length ? (
        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <SmallButton label={t("Make “{option}” the plan", { option: lead.text })} icon={<CalendarPlus size={15} color={c.bg} />} dark onPress={() => onDecide(lead.id)} />
        </View>
      ) : null}
    </View>
  );
}

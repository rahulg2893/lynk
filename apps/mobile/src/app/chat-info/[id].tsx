import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BellSlash, CalendarPlus, LockSimple, PencilSimple, PushPin, SignOut, UserMinus, UserPlus, X } from "phosphor-react-native";
import { PEOPLE, personName, type Memory } from "@shared/chat";
import { applyListOp, editMemory, removeMemory, setRsvp } from "@shared/chat-ops";
import { useAccount } from "@/lib/account";
import { actionSheet, confirm } from "@/lib/sheet";
import { change, changeMembers, leaveChat, renameChat, setDecision, setTask, toggleMute, togglePin, useChatStore } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { Lists, PlanCard, SmallButton, TaskCard } from "@/components/chat/Cards";
import { Avatar, Button, ChatAvatar, Row, Section, Segmented, SwitchRow, Text } from "@/components/ui";

type Tab = "plans" | "tasks" | "lists" | "memory" | "info";

/** What a chat remembers, and its settings. */
export default function ChatInfo() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const account = useAccount();
  const { chats } = useChatStore();
  const chat = chats.find((x) => x.id === id);
  const [tab, setTab] = useState<Tab>(initialTab ?? (chat?.decisions.length ? "plans" : "info"));
  if (!chat) return null;

  const jump = (messageId: string) => {
    router.back();
    setTimeout(() => router.push({ pathname: "/chat/[id]", params: { id: chat.id, m: messageId } }), 250);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ alignItems: "center", paddingTop: 20, paddingHorizontal: 16, gap: 8 }}>
        <View style={{ position: "absolute", right: 12, top: 12 }}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
            <X size={15} color={c.muted} weight="bold" />
          </Pressable>
        </View>
        <ChatAvatar chat={chat} size={72} />
        <Text variant="title2" style={{ textAlign: "center" }}>
          {chat.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <LockSimple size={12} color={c.muted} weight="fill" />
          <Text variant="caption" tone="muted">
            End-to-end encrypted{chat.kind === "group" ? ` · ${chat.members.length + 1} members` : ""}
          </Text>
        </View>
        <View style={{ alignSelf: "stretch", marginTop: 8 }}>
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: "plans", label: "Plans" },
              { value: "tasks", label: "To-dos" },
              { value: "lists", label: "Lists" },
              { value: "memory", label: "Memories" },
              { value: "info", label: "Info" },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 12 }} keyboardShouldPersistTaps="handled">
        {tab === "plans" ? (
          <>
            <Button title="New plan" variant="primary" icon={<CalendarPlus size={18} color={c.onAccent} weight="bold" />} onPress={() => router.push({ pathname: "/plan", params: { chatId: chat.id } })} />
            {chat.decisions.length === 0 ? (
              <Text variant="subhead" tone="muted" style={{ textAlign: "center", paddingVertical: 24 }}>
                No plans yet. Make one, or Lynk suggests one when everyone agrees on a time or place.
              </Text>
            ) : (
              chat.decisions.map((d) => (
                <PlanCard
                  key={d.id}
                  chat={chat}
                  plan={d}
                  onRsvp={(a) => change(chat.id, (ch) => setRsvp(ch, d.id, "me", a))}
                  onEdit={() => router.push({ pathname: "/plan", params: { chatId: chat.id, planId: d.id } })}
                  onConfirm={() => setDecision(chat.id, d.id, "confirmed")}
                  onReject={() => setDecision(chat.id, d.id, "rejected")}
                  onJump={jump}
                />
              ))
            )}
          </>
        ) : null}

        {tab === "tasks" ? (
          chat.tasks.length === 0 ? (
            <Text variant="subhead" tone="muted" style={{ textAlign: "center", paddingVertical: 24 }}>
              Nothing to do. Asks like “can you bring the snacks?” show up here to confirm.
            </Text>
          ) : (
            chat.tasks.map((t) => <TaskCard key={t.id} task={t} onStatus={(s) => setTask(chat.id, t.id, s)} onJump={jump} />)
          )
        ) : null}

        {tab === "lists" ? <Lists lists={chat.lists ?? []} onChange={(op) => change(chat.id, (ch) => applyListOp(ch, op))} /> : null}

        {tab === "memory" ? (
          chat.memory.length === 0 ? (
            <Text variant="subhead" tone="muted" style={{ textAlign: "center", paddingVertical: 24 }}>
              Nothing remembered yet. Birthdays, favourite places and other little things collect here.
            </Text>
          ) : (
            chat.memory.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                onJump={jump}
                onSave={(v) => change(chat.id, (ch) => editMemory(ch, m.id, v))}
                onForget={() => confirm(`Forget “${m.value}”?`, "Lynk stops remembering this in this chat.", "Forget", () => change(chat.id, (ch) => removeMemory(ch, m.id)))}
              />
            ))
          )
        ) : null}

        {tab === "info" ? <InfoTab chatId={chat.id} meIsAdmin={Boolean(chat.admins?.includes("me"))} blocked={account?.blocked ?? []} /> : null}
      </ScrollView>
    </View>
  );
}

function MemoryCard({ memory, onJump, onSave, onForget }: { memory: Memory; onJump: (id: string) => void; onSave: (v: string) => void; onForget: () => void }) {
  const c = useColors();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.value);
  return (
    <View style={{ borderRadius: radius.lg, padding: 14, backgroundColor: c.surface }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text variant="caption" tone="muted" weight="700" style={{ flex: 1 }}>
          {memory.kind}
        </Text>
        {!editing ? (
          <>
            <Pressable onPress={() => setEditing(true)} accessibilityLabel={`Edit ${memory.kind}`} hitSlop={8} style={{ padding: 4 }}>
              <PencilSimple size={16} color={c.muted} />
            </Pressable>
            <Pressable onPress={onForget} accessibilityLabel={`Forget ${memory.kind}`} hitSlop={8} style={{ padding: 4, marginLeft: 6 }}>
              <X size={16} color={c.muted} weight="bold" />
            </Pressable>
          </>
        ) : null}
      </View>
      {editing ? (
        <View style={{ marginTop: 8, gap: 10 }}>
          <TextInput value={draft} onChangeText={setDraft} autoFocus style={{ borderWidth: 1, borderColor: c.accent, borderRadius: 12, padding: 10, fontSize: 17, color: c.ink }} />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
            <SmallButton label="Cancel" onPress={() => setEditing(false)} />
            <SmallButton
              label="Save"
              primary
              onPress={() => {
                if (draft.trim()) onSave(draft.trim());
                setEditing(false);
              }}
            />
          </View>
        </View>
      ) : (
        <Text variant="headline" style={{ marginTop: 4 }}>
          {memory.value}
        </Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, marginTop: 10 }}>
        <Text variant="caption" tone="muted">
          Sources
        </Text>
        {memory.sources.map((s, i) => (
          <Pressable key={s} onPress={() => onJump(s)} style={{ minWidth: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" }}>
            <Text variant="caption">{i + 1}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function InfoTab({ chatId, meIsAdmin, blocked }: { chatId: string; meIsAdmin: boolean; blocked: string[] }) {
  const c = useColors();
  const { chats } = useChatStore();
  const chat = chats.find((x) => x.id === chatId)!;
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(chat.name);
  const [adding, setAdding] = useState(false);
  const candidates = Object.values(PEOPLE).filter((p) => !chat.members.includes(p.id) && !blocked.includes(p.id));

  return (
    <View style={{ marginHorizontal: -16 }}>
      {chat.kind === "group" ? (
        <Section title="Group">
          {renaming ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12 }}>
              <TextInput value={name} onChangeText={setName} autoFocus style={{ flex: 1, fontSize: 17, color: c.ink }} />
              <SmallButton
                label="Save"
                primary
                onPress={() => {
                  if (name.trim()) renameChat(chatId, name.trim());
                  setRenaming(false);
                }}
              />
            </View>
          ) : (
            <Row label="Group name" detail={chat.name} onPress={meIsAdmin ? () => setRenaming(true) : undefined} right={meIsAdmin ? <PencilSimple size={18} color={c.muted} /> : undefined} last />
          )}
        </Section>
      ) : null}

      <Section title={chat.kind === "group" ? `${chat.members.length + 1} members` : "Person"} footnote={chat.kind === "group" && !meIsAdmin ? "Only admins can add or remove people." : undefined}>
        <Row label="You" icon={<Avatar id="me" name="You" size={32} />} detail={chat.admins?.includes("me") ? "Admin" : undefined} />
        {chat.members.map((m, i) => (
          <Row
            key={m}
            label={personName(m)}
            detail={chat.admins?.includes(m) ? "Admin" : `@${PEOPLE[m]?.handle ?? m}`}
            icon={<Avatar id={m} name={personName(m)} size={32} />}
            last={i === chat.members.length - 1 && !(meIsAdmin && chat.kind === "group")}
            onPress={() =>
              actionSheet(personName(m), [
                { label: "View profile", onPress: () => router.push({ pathname: "/person/[id]", params: { id: m } }) },
                ...(meIsAdmin && chat.kind === "group" ? [{ label: "Remove from group", destructive: true, onPress: () => changeMembers(chatId, [], [m]) }] : []),
              ])
            }
            right={meIsAdmin && chat.kind === "group" ? <UserMinus size={18} color={c.muted} /> : undefined}
          />
        ))}
        {meIsAdmin && chat.kind === "group" ? <Row label="Add people" icon={<UserPlus size={22} color={c.accentInk} />} onPress={() => setAdding((a) => !a)} last /> : null}
      </Section>

      {adding ? (
        <Section title="Add to the group">
          {candidates.length ? (
            candidates.map((p, i) => (
              <Row
                key={p.id}
                label={p.name}
                detail={`@${p.handle}`}
                icon={<Avatar id={p.id} name={p.name} size={32} />}
                last={i === candidates.length - 1}
                onPress={() => {
                  changeMembers(chatId, [p.id]);
                  setAdding(false);
                }}
                right={<UserPlus size={18} color={c.accentInk} />}
              />
            ))
          ) : (
            <Row label="Everyone you know is already here" last />
          )}
        </Section>
      ) : null}

      <Section>
        <SwitchRow label="Pin chat" value={Boolean(chat.pinned)} onChange={() => togglePin(chatId)} />
        <SwitchRow label="Mute notifications" detail={chat.muted ? "No alerts from this chat." : undefined} value={chat.muted} onChange={() => toggleMute(chatId)} last />
      </Section>
      <View style={{ flexDirection: "row", gap: 16, paddingHorizontal: 24, marginTop: 10 }}>
        {chat.pinned ? <PushPin size={14} color={c.muted} weight="fill" /> : null}
        {chat.muted ? <BellSlash size={14} color={c.muted} /> : null}
      </View>

      {chat.kind === "group" ? (
        <Section>
          <Row
            label="Leave group"
            destructive
            icon={<SignOut size={22} color={c.dangerInk} />}
            last
            onPress={() =>
              confirm(`Leave ${chat.name}?`, "You'll stop getting its messages, and it disappears from your chats.", "Leave", () => {
                router.dismissAll();
                leaveChat(chatId);
              })
            }
          />
        </Section>
      ) : (
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Button title="View profile" onPress={() => router.push({ pathname: "/person/[id]", params: { id: chat.members[0] } })} />
        </View>
      )}
    </View>
  );
}

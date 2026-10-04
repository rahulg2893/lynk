import { useSyncExternalStore } from "react";
import {
  createMockChats,
  DEMO_MEMBERS,
  DEMO_SCRIPT,
  newId,
  PEOPLE,
  REPLIES,
  resolveChat,
  rollRepeats,
  SIDE_REPLIES,
  sideChatId,
  smartIn,
  splitChatId,
  threadsOf,
  type Attachment,
  type Chat,
  type KnowledgeStatus,
  type Message,
  type Status,
  type Task,
} from "@shared/chat";
import { addSideChat, suggestPlan, togglePinned, updateThread, vote } from "@shared/chat-ops";
import { spotPlan } from "@shared/spot";
import { getAccount } from "./account";
import { isOnline, onConnectionChange } from "./connection";
import { getJSON, setJSON } from "./storage";

/**
 * All chats for the signed-in account, shared by every screen. The logic is
 * the web app's (same shared helpers, same delivery lifecycle, outbox and
 * simulated replies); only storage differs: the encrypted SQLCipher database.
 */

type State = { chats: Chat[]; loaded: boolean; now: number; username: string | null; activeId: string | null };

let state: State = { chats: [], loaded: false, now: Date.now(), username: null, activeId: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (!state.username || !state.loaded) return;
  if (saveTimer) clearTimeout(saveTimer);
  const { username, chats } = state;
  saveTimer = setTimeout(() => void setJSON(`chats:${username}`, portable(chats)), 300);
}

/** Typing indicators are momentary; never store them. */
const portable = (chats: Chat[]) => chats.map((c) => ({ ...c, typing: null, sideChats: c.sideChats?.map((s) => ({ ...s, typing: null })) }));

function set(next: Partial<State>, save = true) {
  state = { ...state, ...next };
  emit();
  if (save && next.chats) persist();
}

export const getState = () => state;

export function useChatStore() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getState,
    getState,
  );
}

export function useThread(id: string | null) {
  const s = useChatStore();
  return resolveChat(s.chats, id);
}

const requeue = (messages: Message[]) =>
  messages.some((m) => m.status === "sending") ? messages.map((m) => (m.status === "sending" ? { ...m, status: "waiting" as const } : m)) : messages;

export async function loadChats(username: string, seeded: boolean) {
  if (state.username === username && state.loaded) return;
  set({ loaded: false, username, chats: [] }, false);
  const now = Date.now();
  const saved = await getJSON<Chat[]>(`chats:${username}`).catch(() => null);
  const loaded = (saved ?? (seeded ? createMockChats(now) : [])).map((c) => ({
    ...c,
    typing: null,
    messages: requeue(c.messages),
    sideChats: c.sideChats?.map((s) => ({ ...s, typing: null, messages: requeue(s.messages) })),
  }));
  const chats = rollRepeats(loaded, now);
  set({ chats, loaded: true, now }, !saved || chats !== loaded);
  flushOutbox();
}

/** The clock moved on: weekly plans whose date has passed move to their next one. */
export function tick() {
  const now = Date.now();
  const chats = rollRepeats(state.chats, now);
  set(chats === state.chats ? { now } : { now, chats }, chats !== state.chats);
}

export function resetStore() {
  set({ chats: [], loaded: false, username: null, activeId: null }, false);
}

/** Apply a change to a chat, or a side chat when `id` is "<chat>~<side>". */
export function change(id: string, fn: (c: Chat) => Chat) {
  set({ chats: updateThread(state.chats, id, fn) });
}

export function setActive(id: string | null) {
  state = { ...state, activeId: id };
  if (id) change(splitChatId(id).chatId, (c) => ({ ...c, unread: 0, mentions: 0 }));
  else emit();
}

/* ---------- Sending, delivery and the outbox ---------- */

const timers: ReturnType<typeof setTimeout>[] = [];
const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
const inFlight = new Set<string>();
const replyIndex: Record<string, number> = {};
let incoming: ((threadId: string, message: Message) => void) | null = null;

/** Let the app show an in-app banner for messages that arrive elsewhere. */
export function onIncoming(fn: typeof incoming) {
  incoming = fn;
}

function setStatus(threadId: string, messageId: string, status: Status) {
  change(threadId, (c) => ({
    ...c,
    messages: c.messages.map((m) =>
      m.id === messageId ? { ...m, status, readBy: status === "read" && c.kind === "group" ? c.members : m.readBy } : m,
    ),
  }));
}

function append(threadId: string, message: Message) {
  change(threadId, (c) => ({
    ...c,
    messages: [...c.messages, message],
    draft: message.from === "me" ? "" : c.draft,
    unread: message.from !== "me" && state.activeId !== c.id ? c.unread + 1 : c.unread,
  }));
}

const setTyping = (threadId: string, who: string | null) => change(threadId, (c) => ({ ...c, typing: who }));

/** Sending, sent, delivered, read; the message id is the idempotency key. */
function deliver(threadId: string, id: string) {
  if (inFlight.has(id)) return;
  inFlight.add(id);
  setStatus(threadId, id, "sending");
  later(350, () => {
    inFlight.delete(id);
    if (!isOnline()) return setStatus(threadId, id, "waiting");
    setStatus(threadId, id, "sent");
    later(550, () => setStatus(threadId, id, "delivered"));

    const chat = resolveChat(state.chats, threadId);
    if (!chat?.members.length) return;
    const replier = chat.members[Math.floor(Math.random() * chat.members.length)];
    const pool = chat.side ? SIDE_REPLIES : (REPLIES[chat.id] ?? ["👍"]);
    const n = replyIndex[threadId] ?? 0;
    replyIndex[threadId] = n + 1;
    if (n >= pool.length) return;
    later(1250, () => {
      setStatus(threadId, id, "read");
      setTyping(threadId, replier);
    });
    later(3050, () => {
      const reply: Message = { id: newId(), from: replier, text: pool[n], at: Date.now() };
      setTyping(threadId, null);
      append(threadId, reply);
      if (state.activeId !== threadId) incoming?.(threadId, reply);
    });
  });
}

export function send(threadId: string, text: string, replyTo?: string, attachments?: Attachment[]) {
  const id = newId();
  const status: Status = isOnline() ? "sending" : "waiting";
  append(threadId, { id, from: "me", text, at: Date.now(), status, replyTo, attachments });
  if (status === "sending") setTimeout(() => deliver(threadId, id), 0);

  // Spot a plan in what you just wrote, as a suggestion to save.
  const smart = getAccount().smart;
  const chat = resolveChat(state.chats, threadId);
  const plan = chat && !chat.side && smartIn(chat, smart).plans ? spotPlan(text, id, Date.now()) : null;
  if (plan) later(900, () => change(threadId, (c) => suggestPlan(c, plan)));
}

/** Post a poll; the others in the chat vote over the next few seconds. */
export function sendPoll(chatId: string, question: string, options: string[]) {
  const id = newId();
  const poll = { question, options: options.map((text) => ({ id: newId("o"), text, votes: [] as string[] })) };
  const status: Status = isOnline() ? "sending" : "waiting";
  append(chatId, { id, from: "me", text: "", at: Date.now(), status, poll });
  if (status === "sending") setTimeout(() => deliver(chatId, id), 0);
  const chat = state.chats.find((c) => c.id === chatId);
  chat?.members.forEach((who, i) => {
    const pick = poll.options[Math.random() < 0.6 ? 0 : Math.floor(Math.random() * poll.options.length)];
    later(1600 + i * 1300, () => change(chatId, (c) => vote(c, id, pick.id, who)));
  });
}

export const castVote = (chatId: string, messageId: string, optionId: string) => change(chatId, (c) => vote(c, messageId, optionId, "me"));

/**
 * The first-run demo: a group where friends agree on dinner, one message at a
 * time with typing in between, and Lynk spots the plan on the last line.
 * Returns the new chat's id.
 */
export function startDemo() {
  const id = newId("c");
  set({ chats: [blank({ id, kind: "group", name: "Lynk demo", topic: "A demo group to show what Lynk does", members: DEMO_MEMBERS, admins: ["me"] }), ...state.chats] });
  let at = 0;
  DEMO_SCRIPT.forEach((line, i) => {
    at += line.after;
    later(at - 900, () => setTyping(id, line.from));
    later(at, () => {
      const message: Message = { id: newId(), from: line.from, text: line.text, at: Date.now() };
      setTyping(id, null);
      append(id, message);
      const plan = i === DEMO_SCRIPT.length - 1 && smartIn(undefined, getAccount().smart).plans ? spotPlan(line.text, message.id, Date.now()) : null;
      if (plan) later(900, () => change(id, (c) => suggestPlan(c, plan)));
    });
  });
  return id;
}

export const retry = (threadId: string, messageId: string) => isOnline() && deliver(threadId, messageId);

export function waitingCount() {
  return state.chats.reduce((n, c) => n + threadsOf(c).reduce((k, t) => k + t.messages.filter((m) => m.status === "waiting").length, 0), 0);
}

/** Send what's waiting, oldest first; deliver() skips anything already on its way. */
export function flushOutbox() {
  if (!isOnline() || !state.loaded) return;
  const waiting = state.chats.flatMap((c) =>
    threadsOf(c).flatMap((t) => t.messages.filter((m) => m.status === "waiting").map((m) => ({ threadId: t.id, id: m.id }))),
  );
  waiting.forEach((m, i) => later(i * 220, () => deliver(m.threadId, m.id)));
}

let wasOnline = isOnline();
onConnectionChange(() => {
  const now = isOnline();
  if (now && !wasOnline) flushOutbox();
  wasOnline = now;
});

/* ---------- Message actions ---------- */

export const setDraft = (threadId: string, text: string) => {
  state = { ...state, chats: updateThread(state.chats, threadId, (c) => ({ ...c, draft: text })) };
  emit();
  persist();
};

export function editMessage(threadId: string, messageId: string, text: string) {
  change(threadId, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, text, editedAt: Date.now() } : m)) }));
}

export function deleteMessage(threadId: string, messageId: string) {
  change(threadId, (c) => ({
    ...c,
    messages: c.messages.map((m) => (m.id === messageId ? { ...m, text: "", attachments: undefined, reactions: undefined, deleted: true } : m)),
  }));
}

export function react(threadId: string, messageId: string, emoji: string) {
  change(threadId, (c) => ({
    ...c,
    messages: c.messages.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = [...(m.reactions ?? [])];
      const at = reactions.findIndex((r) => r.emoji === emoji);
      if (at === -1) reactions.push({ emoji, count: 1, mine: true });
      else if (reactions[at].mine) {
        const count = reactions[at].count - 1;
        if (count === 0) reactions.splice(at, 1);
        else reactions[at] = { ...reactions[at], count, mine: false };
      } else reactions[at] = { ...reactions[at], count: reactions[at].count + 1, mine: true };
      return { ...m, reactions };
    }),
  }));
}

export const togglePinnedMessage = (threadId: string, messageId: string) => change(threadId, (c) => togglePinned(c, messageId));

export const toggleSave = (threadId: string, messageId: string) =>
  change(threadId, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, saved: !m.saved } : m)) }));

/* ---------- Chats ---------- */

function blank(partial: Pick<Chat, "id" | "kind" | "name" | "members"> & Partial<Chat>): Chat {
  return { unread: 0, mentions: 0, muted: false, typing: null, draft: "", messages: [], decisions: [], tasks: [], memory: [], ...partial };
}

/** The one-to-one chat with someone, created the first time. Returns its id. */
export function startChat(personId: string) {
  const existing = state.chats.find((c) => c.kind === "dm" && c.members[0] === personId);
  if (existing) return existing.id;
  const id = newId("c");
  set({ chats: [blank({ id, kind: "dm", name: PEOPLE[personId]?.name ?? personId, members: [personId] }), ...state.chats] });
  return id;
}

export function createGroup(name: string, members: string[]) {
  const id = newId("c");
  set({ chats: [blank({ id, kind: "group", name, members, admins: ["me"] }), ...state.chats] });
  return id;
}

export const togglePin = (id: string) => change(id, (c) => ({ ...c, pinned: !c.pinned }));
export const toggleMute = (id: string) => change(id, (c) => ({ ...c, muted: !c.muted }));
export const renameChat = (id: string, name: string) => change(id, (c) => ({ ...c, name }));
export function changeMembers(id: string, add: string[] = [], remove: string[] = []) {
  change(id, (c) => ({
    ...c,
    members: [...c.members.filter((m) => !remove.includes(m)), ...add.filter((m) => !c.members.includes(m))],
    admins: c.admins?.filter((m) => !remove.includes(m)),
  }));
}
export const leaveChat = (id: string) => set({ chats: state.chats.filter((c) => c.id !== id) });

export const setDecision = (chatId: string, itemId: string, status: KnowledgeStatus) =>
  change(chatId, (c) => ({ ...c, decisions: c.decisions.map((d) => (d.id === itemId ? { ...d, status } : d)) }));

export const setTask = (chatId: string, itemId: string, status: Task["status"]) =>
  change(chatId, (c) => ({ ...c, tasks: c.tasks.map((t) => (t.id === itemId ? { ...t, status } : t)) }));

/** Open the side chat that starts at a message, creating it the first time. Returns its thread id. */
export function sideChatFor(chatId: string, messageId: string): string | null {
  const chat = state.chats.find((c) => c.id === chatId);
  const root = chat?.messages.find((m) => m.id === messageId);
  if (!chat || !root) return null;
  const existing = chat.sideChats?.find((s) => s.rootId === messageId);
  if (existing) return sideChatId(chatId, existing.id);
  const text = root.text.replace(/\s+/g, " ").trim();
  const name = root.branch?.name ?? (text ? (text.length > 42 ? `${text.slice(0, 40).trimEnd()}…` : text) : "Photo");
  const id = newId("s");
  change(chatId, (c) => addSideChat(c, { id, rootId: messageId, name, messages: [], draft: "", typing: null }));
  return sideChatId(chatId, id);
}

/** Someone in the chat answers shortly after a new plan appears. */
export function simulateRsvp(chatId: string, planId: string, setRsvp: (c: Chat, planId: string, who: string) => Chat) {
  const chat = state.chats.find((c) => c.id === chatId);
  if (!chat?.members.length) return;
  const who = chat.members[Math.floor(Math.random() * chat.members.length)];
  later(2400, () => change(chatId, (c) => setRsvp(c, planId, who)));
}

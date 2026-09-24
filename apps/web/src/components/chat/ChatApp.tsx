"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GearSix } from "@phosphor-icons/react";
import { Logo } from "@/components/landing/Logo";
import { updateAccount, useAccount } from "@/lib/account";
import { isOnline, isSimulatedOffline, setSimulatedOffline, useOnline } from "@/lib/connection";
import { notificationGroups, notifies, permission, showBrowserNotification } from "@/lib/notify";
import { ConnectionBanner, NotificationPrompt } from "./Connection";
import { Avatar } from "./primitives";
import { NewChatDialog, type NewChatTab } from "./NewChatDialog";
import { CatchUp } from "./CatchUp";
import { loadChats, saveChats } from "@/lib/chat-store";
import { ChatList } from "./ChatList";
import { Thread } from "./Thread";
import { ContextPanel, type PanelTab } from "./ContextPanel";
import { CommandPalette, type PaletteAction } from "./CommandPalette";
import {
  PEOPLE,
  REPLIES,
  newId,
  type Attachment,
  type Chat,
  type KnowledgeStatus,
  type Message,
  type Status,
  type Task,
} from "@/lib/chat";

type State = { chats: Chat[]; activeId: string | null; loaded: boolean; now: number };

type Action =
  | { type: "load"; chats: Chat[]; now: number }
  | { type: "select"; id: string | null }
  | { type: "draft"; id: string; text: string }
  | { type: "append"; id: string; message: Message }
  | { type: "status"; id: string; messageId: string; status: Status }
  | { type: "typing"; id: string; who: string | null }
  | { type: "react"; id: string; messageId: string; emoji: string }
  | { type: "mute"; id: string }
  | { type: "decision"; id: string; itemId: string; status: KnowledgeStatus }
  | { type: "task"; id: string; itemId: string; status: Task["status"] }
  | { type: "create"; chat: Chat }
  | { type: "edit"; id: string; messageId: string; text: string }
  | { type: "remove"; id: string; messageId: string }
  | { type: "pin"; id: string }
  | { type: "rename"; id: string; name: string }
  | { type: "members"; id: string; add?: string[]; remove?: string[] }
  | { type: "leave"; id: string }
  | { type: "tick"; now: number };

function update(state: State, id: string, fn: (chat: Chat) => Chat): State {
  return { ...state, chats: state.chats.map((c) => (c.id === id ? fn(c) : c)) };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "load":
      // A send interrupted by a reload goes back to the outbox and tries again.
      return {
        ...state,
        loaded: true,
        now: action.now,
        chats: action.chats.map((c) =>
          c.messages.some((m) => m.status === "sending")
            ? { ...c, messages: c.messages.map((m) => (m.status === "sending" ? { ...m, status: "waiting" as const } : m)) }
            : c,
        ),
      };
    case "select":
      return action.id
        ? update({ ...state, activeId: action.id }, action.id, (c) => ({ ...c, unread: 0, mentions: 0 }))
        : { ...state, activeId: null };
    case "draft":
      return update(state, action.id, (c) => ({ ...c, draft: action.text }));
    case "append":
      return update(state, action.id, (c) => ({
        ...c,
        messages: [...c.messages, action.message],
        draft: action.message.from === "me" ? "" : c.draft,
        unread: action.message.from !== "me" && state.activeId !== c.id ? c.unread + 1 : c.unread,
      }));
    case "status":
      return update(state, action.id, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === action.messageId
            ? { ...m, status: action.status, readBy: action.status === "read" && c.kind === "group" ? c.members : m.readBy }
            : m,
        ),
      }));
    case "create":
      return { ...state, chats: [action.chat, ...state.chats] };
    case "edit":
      return update(state, action.id, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === action.messageId ? { ...m, text: action.text, editedAt: Date.now() } : m)),
      }));
    case "remove":
      return update(state, action.id, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === action.messageId ? { ...m, text: "", attachments: undefined, reactions: undefined, deleted: true } : m,
        ),
      }));
    case "pin":
      return update(state, action.id, (c) => ({ ...c, pinned: !c.pinned }));
    case "rename":
      return update(state, action.id, (c) => ({ ...c, name: action.name }));
    case "members":
      return update(state, action.id, (c) => ({
        ...c,
        members: [...c.members.filter((m) => !action.remove?.includes(m)), ...(action.add ?? []).filter((m) => !c.members.includes(m))],
        admins: c.admins?.filter((m) => !action.remove?.includes(m)),
      }));
    case "leave":
      return { ...state, chats: state.chats.filter((c) => c.id !== action.id), activeId: state.activeId === action.id ? null : state.activeId };
    case "typing":
      return update(state, action.id, (c) => ({ ...c, typing: action.who }));
    case "tick":
      return { ...state, now: action.now };
    case "react":
      return update(state, action.id, (c) => ({
        ...c,
        messages: c.messages.map((m) => {
          if (m.id !== action.messageId) return m;
          const reactions = [...(m.reactions ?? [])];
          const at = reactions.findIndex((r) => r.emoji === action.emoji);
          if (at === -1) {
            reactions.push({ emoji: action.emoji, count: 1, mine: true });
          } else if (reactions[at].mine) {
            const count = reactions[at].count - 1;
            if (count === 0) reactions.splice(at, 1);
            else reactions[at] = { ...reactions[at], count, mine: false };
          } else {
            reactions[at] = { ...reactions[at], count: reactions[at].count + 1, mine: true };
          }
          return { ...m, reactions };
        }),
      }));
    case "mute":
      return update(state, action.id, (c) => ({ ...c, muted: !c.muted }));
    case "decision":
      return update(state, action.id, (c) => ({
        ...c,
        decisions: c.decisions.map((d) => (d.id === action.itemId ? { ...d, status: action.status } : d)),
      }));
    case "task":
      return update(state, action.id, (c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === action.itemId ? { ...t, status: action.status } : t)),
      }));
  }
}

/** Deep links: /app?chat=<id> opens a conversation, /app is the inbox. */
function chatUrl(chatId: string | null) {
  return chatId ? `/app?chat=${encodeURIComponent(chatId)}` : "/app";
}

export function ChatApp() {
  const router = useRouter();
  const account = useAccount();
  const chatParam = useSearchParams().get("chat");
  const [state, dispatch] = useReducer(reducer, { chats: [], activeId: null, loaded: false, now: 0 });
  const [panel, setPanel] = useState<PanelTab | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [newChat, setNewChat] = useState<NewChatTab | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const replyIndex = useRef<Record<string, number>>({});
  // Message ids on their way to the server, so a flush never sends one twice.
  const inFlight = useRef(new Set<string>());
  const online = useOnline();
  const [asking, setAsking] = useState(false);

  const username = account?.profile.username;
  const seeded = account?.seeded ?? true;

  // Simulated fetch so the loading state is visible, then this account's chats.
  useEffect(() => {
    if (!username) return;
    const t = window.setTimeout(() => {
      const now = Date.now();
      dispatch({ type: "load", chats: loadChats(username, seeded, now), now });
    }, 450);
    const pending = timers.current;
    return () => {
      clearTimeout(t);
      pending.forEach(clearTimeout);
    };
  }, [username, seeded]);

  // Keep chats in this browser until the server exists.
  useEffect(() => {
    if (!state.loaded || !username) return;
    const t = window.setTimeout(() => saveChats(username, state.chats), 400);
    return () => window.clearTimeout(t);
  }, [state.chats, state.loaded, username]);

  // ⌘K / Ctrl+K opens the command palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A jumped-to message stays highlighted briefly, then settles back.
  useEffect(() => {
    if (!highlight) return;
    const t = window.setTimeout(() => setHighlight(null), 2500);
    return () => window.clearTimeout(t);
  }, [highlight]);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  // The URL is the source of truth for the open chat, so links, reloads and
  // the back button all land in the right place.
  useEffect(() => {
    if (state.loaded && chatParam !== state.activeId) dispatch({ type: "select", id: chatParam });
  }, [chatParam, state.loaded, state.activeId]);

  const active = state.chats.find((c) => c.id === state.activeId) ?? null;

  // Timers outlive renders, so they read the latest chats and open chat from refs.
  const chatsRef = useRef(state.chats);
  const activeRef = useRef(state.activeId);
  const settingsRef = useRef(account?.notifications);
  const meRef = useRef((account?.profile.name ?? "You").split(" ")[0]);
  useEffect(() => {
    chatsRef.current = state.chats;
    activeRef.current = state.activeId;
    settingsRef.current = account?.notifications;
    meRef.current = (account?.profile.name ?? "You").split(" ")[0];
  });

  const open = useCallback((chatId: string | null, messageId?: string) => {
    // Native pushState keeps this a client-only change (no server round trip).
    if (new URLSearchParams(window.location.search).get("chat") !== chatId) {
      window.history.pushState(null, "", chatUrl(chatId));
    }
    setHighlight(messageId ?? null);
  }, []);

  /** Open the one-to-one chat with someone, starting it if it doesn't exist yet. */
  const startChat = useCallback(
    (personId: string) => {
      setNewChat(null);
      const existing = state.chats.find((c) => c.kind === "dm" && c.members[0] === personId);
      if (existing) return open(existing.id);
      const id = newId("c");
      dispatch({
        type: "create",
        chat: {
          id,
          kind: "dm",
          name: PEOPLE[personId]?.name ?? personId,
          members: [personId],
          unread: 0,
          mentions: 0,
          muted: false,
          typing: null,
          draft: "",
          messages: [],
          decisions: [],
          tasks: [],
          memory: [],
        },
      });
      open(id);
    },
    [state.chats, open],
  );

  const createGroup = useCallback(
    (name: string, members: string[]) => {
      setNewChat(null);
      const id = newId("c");
      dispatch({
        type: "create",
        chat: {
          id,
          kind: "group",
          name,
          members,
          admins: ["me"],
          unread: 0,
          mentions: 0,
          muted: false,
          typing: null,
          draft: "",
          messages: [],
          decisions: [],
          tasks: [],
          memory: [],
        },
      });
      open(id);
    },
    [open],
  );

  /** A message that arrived while you weren't looking becomes a browser notification. */
  const alert = useCallback(
    (chatId: string, message: Message) => {
      const chat = chatsRef.current.find((c) => c.id === chatId);
      const settings = settingsRef.current;
      if (!chat || !settings) return;
      if (!document.hidden && activeRef.current === chatId) return;
      if (!notifies(chat, message, settings, meRef.current)) return;
      showBrowserNotification(chat, message, settings, () => open(chatId, message.id));
    },
    [open],
  );

  /**
   * The delivery lifecycle the real gateway will drive: sending, sent,
   * delivered, read. The message id doubles as the idempotency key, and a
   * connection lost mid-send puts the message back in the outbox.
   */
  const deliver = useCallback(
    (chatId: string, id: string) => {
      if (inFlight.current.has(id)) return;
      inFlight.current.add(id);
      dispatch({ type: "status", id: chatId, messageId: id, status: "sending" });
      later(350, () => {
        inFlight.current.delete(id);
        if (!isOnline()) return dispatch({ type: "status", id: chatId, messageId: id, status: "waiting" });
        dispatch({ type: "status", id: chatId, messageId: id, status: "sent" });
        later(550, () => dispatch({ type: "status", id: chatId, messageId: id, status: "delivered" }));

        const chat = chatsRef.current.find((c) => c.id === chatId);
        if (!chat?.members.length) return;
        const replier = chat.members[Math.floor(Math.random() * chat.members.length)];
        const pool = REPLIES[chat.id] ?? ["👍"];
        const n = replyIndex.current[chat.id] ?? 0;
        replyIndex.current[chat.id] = n + 1;
        if (n >= pool.length) return;

        later(1250, () => {
          dispatch({ type: "status", id: chatId, messageId: id, status: "read" });
          dispatch({ type: "typing", id: chatId, who: replier });
        });
        later(3050, () => {
          const reply: Message = { id: newId(), from: replier, text: pool[n], at: Date.now() };
          dispatch({ type: "typing", id: chatId, who: null });
          dispatch({ type: "append", id: chatId, message: reply });
          alert(chatId, reply);
        });
      });
    },
    [later, alert],
  );

  const send = useCallback(
    (chat: Chat, text: string, replyTo?: string, attachments?: Attachment[]) => {
      const id = newId();
      // Offline, the message still appears right away and waits in the outbox.
      const status: Status = isOnline() ? "sending" : "waiting";
      dispatch({ type: "append", id: chat.id, message: { id, from: "me", text, at: Date.now(), status, replyTo, attachments } });
      if (status === "sending") window.setTimeout(() => deliver(chat.id, id), 0);
    },
    [deliver],
  );

  const retry = useCallback((chatId: string, messageId: string) => isOnline() && deliver(chatId, messageId), [deliver]);

  const waiting = useMemo(
    () => state.chats.flatMap((c) => c.messages.filter((m) => m.status === "waiting").map((m) => ({ chatId: c.id, id: m.id }))),
    [state.chats],
  );

  // Back online (or loaded with a full outbox): send what's waiting, oldest first.
  useEffect(() => {
    if (!online || !state.loaded) return;
    waiting.forEach((m, i) => later(i * 220, () => deliver(m.chatId, m.id)));
    // Flush on reconnect and on load only; deliver() skips anything already sent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, state.loaded]);

  // Ask about notifications the first time a chat is opened, not on page load.
  useEffect(() => {
    if (!state.activeId || !account || account.notifications.asked || permission() !== "default") return;
    const t = window.setTimeout(() => setAsking(true), 1400);
    return () => window.clearTimeout(t);
  }, [state.activeId, account]);

  const markAsked = () => {
    setAsking(false);
    updateAccount((a) => ({ ...a, notifications: { ...a.notifications, asked: true } }));
  };

  const enableAlerts = async () => {
    markAsked();
    if (permission() !== "default") return;
    try {
      await Notification.requestPermission();
    } catch {
      // Older Safari takes a callback; it simply stays undecided here.
    }
    dispatch({ type: "tick", now: Date.now() });
  };

  const groups = useMemo(
    () => (account ? notificationGroups(state.chats, account.notifications, (account.profile.name || "You").split(" ")[0], state.now) : []),
    [state.chats, state.now, account],
  );

  const runPalette = (action: PaletteAction) => {
    setPaletteOpen(false);
    if (action.type === "open") open(action.chatId);
    else if (action.type === "message") open(action.chatId, action.messageId);
    else if (action.type === "catchup") open(null);
    else if (action.type === "panel") setPanel(action.tab);
    else if (action.type === "go") router.push(action.href);
    else if (action.type === "new") setNewChat(action.tab);
    else if (action.type === "offline") setSimulatedOffline(!isSimulatedOffline());
  };

  return (
    <div className="flex h-dvh min-w-0 flex-1">
      <aside
        className={[
          "h-full w-full shrink-0 flex-col bg-surface/80 md:my-3 md:flex md:h-auto md:w-84 md:overflow-hidden md:rounded-[1.75rem] md:border md:border-line/70 md:shadow-soft",
          active ? "hidden" : "flex",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3 md:hidden">
          <Link href="/" aria-label="Lynk home">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/app/settings"
              className="inline-flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            >
              <GearSix size={22} aria-hidden />
              <span className="sr-only">Settings</span>
            </Link>
            <Link href="/app/profile" className="inline-flex size-11 items-center justify-center rounded-full">
              <Avatar id="me" name={account?.profile.name ?? "You"} photo={account?.profile.photo} size={32} />
              <span className="sr-only">Your profile</span>
            </Link>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <ChatList
            chats={state.chats}
            activeId={state.activeId}
            loaded={state.loaded}
            now={state.now}
            onSelect={(id) => open(id)}
            onOpenPalette={() => setPaletteOpen(true)}
            onNewChat={(tab) => setNewChat(tab)}
            online={online}
            notifications={
              account
                ? {
                    groups,
                    settings: account.notifications,
                    permission: permission(),
                    onOpenChat: (chatId, messageId) => open(chatId, messageId),
                    onSeen: () => updateAccount((a) => ({ ...a, notifications: { ...a.notifications, seenAt: Date.now() } })),
                    onEnable: () => void enableAlerts(),
                  }
                : null
            }
          />
        </div>
      </aside>

      <main
        className={[
          "min-w-0 flex-1 md:m-3 md:overflow-hidden md:rounded-[1.75rem] md:border md:border-line/70 md:bg-surface/55 md:shadow-soft",
          active ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        {active ? (
          <div className="min-w-0 flex-1">
            <Thread
              key={active.id}
              chat={active}
              now={state.now}
              highlightId={highlight}
              me={(account?.profile.name ?? "You").split(" ")[0]}
              onSend={(text, replyTo, attachments) => send(active, text, replyTo, attachments)}
              onRetry={(messageId) => retry(active.id, messageId)}
              online={online}
              onEdit={(messageId, text) => dispatch({ type: "edit", id: active.id, messageId, text })}
              onDelete={(messageId) => dispatch({ type: "remove", id: active.id, messageId })}
              onDraft={(text) => dispatch({ type: "draft", id: active.id, text })}
              onReact={(messageId, emoji) => dispatch({ type: "react", id: active.id, messageId, emoji })}
              onBack={() => open(null)}
              onToggleInfo={() => setPanel((p) => (p ? null : active.decisions.length ? "decisions" : "about"))}
            />
          </div>
        ) : (
          <CatchUp
            chats={state.chats}
            loaded={state.loaded}
            name={(account?.profile.name ?? "there").split(" ")[0]}
            onOpen={open}
            onNewChat={setNewChat}
            onDecision={(chatId, itemId, status) => dispatch({ type: "decision", id: chatId, itemId, status })}
            onTask={(chatId, itemId, status) => dispatch({ type: "task", id: chatId, itemId, status })}
          />
        )}

        {active && panel ? (
          <ContextPanel
            chat={active}
            tab={panel}
            onTab={setPanel}
            onClose={() => setPanel(null)}
            onJump={(messageId) => {
              setHighlight(null);
              window.requestAnimationFrame(() => setHighlight(messageId));
            }}
            onDecision={(itemId, status) => dispatch({ type: "decision", id: active.id, itemId, status })}
            onTask={(itemId, status) => dispatch({ type: "task", id: active.id, itemId, status })}
            onMute={() => dispatch({ type: "mute", id: active.id })}
            onPin={() => dispatch({ type: "pin", id: active.id })}
            onRename={(name) => dispatch({ type: "rename", id: active.id, name })}
            onMembers={(change) => dispatch({ type: "members", id: active.id, ...change })}
            onLeave={() => {
              setPanel(null);
              dispatch({ type: "leave", id: active.id });
              open(null);
            }}
          />
        ) : null}
      </main>

      <NewChatDialog
        open={newChat !== null}
        initialTab={newChat ?? "chat"}
        username={account?.profile.username ?? ""}
        blocked={account?.blocked ?? []}
        onClose={() => setNewChat(null)}
        onStart={startChat}
        onCreateGroup={createGroup}
      />

      <ConnectionBanner
        online={online}
        waiting={waiting.length}
        simulated={isSimulatedOffline()}
        onReconnect={() => setSimulatedOffline(false)}
      />
      <NotificationPrompt open={asking} onEnable={() => void enableAlerts()} onDismiss={markAsked} />

      <CommandPalette
        open={paletteOpen}
        online={online}
        chats={state.chats}
        hasActive={Boolean(active)}
        onClose={() => setPaletteOpen(false)}
        onRun={runPalette}
      />
    </div>
  );
}

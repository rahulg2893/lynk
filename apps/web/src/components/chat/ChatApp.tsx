"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, At, GearSix, Lightbulb, ListChecks } from "@phosphor-icons/react";
import { Logo } from "@/components/landing/Logo";
import { useAccount } from "@/lib/account";
import { Avatar } from "./primitives";
import { ChatList } from "./ChatList";
import { Thread } from "./Thread";
import { ContextPanel, type PanelTab } from "./ContextPanel";
import { CommandPalette, type PaletteAction } from "./CommandPalette";
import {
  REPLIES,
  createMockChats,
  displayName,
  firstName,
  newId,
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
  | { type: "task"; id: string; itemId: string; status: Task["status"] };

function update(state: State, id: string, fn: (chat: Chat) => Chat): State {
  return { ...state, chats: state.chats.map((c) => (c.id === id ? fn(c) : c)) };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "load":
      return { ...state, chats: action.chats, loaded: true, now: action.now };
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
        messages: c.messages.map((m) => (m.id === action.messageId ? { ...m, status: action.status } : m)),
      }));
    case "typing":
      return update(state, action.id, (c) => ({ ...c, typing: action.who }));
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
  const [highlight, setHighlight] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const replyIndex = useRef<Record<string, number>>({});

  // Simulated fetch so the loading state is visible, then the mock inbox.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const now = Date.now();
      dispatch({ type: "load", chats: createMockChats(now), now });
    }, 650);
    const pending = timers.current;
    return () => {
      clearTimeout(t);
      pending.forEach(clearTimeout);
    };
  }, []);

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

  const open = useCallback((chatId: string | null, messageId?: string) => {
    // Native pushState keeps this a client-only change (no server round trip).
    if (new URLSearchParams(window.location.search).get("chat") !== chatId) {
      window.history.pushState(null, "", chatUrl(chatId));
    }
    setHighlight(messageId ?? null);
  }, []);

  const send = useCallback(
    (chat: Chat, text: string, replyTo?: string) => {
      const id = newId();
      dispatch({ type: "append", id: chat.id, message: { id, from: "me", text, at: Date.now(), status: "sending", replyTo } });
      // The delivery lifecycle the real gateway will drive: sent, delivered, read.
      later(350, () => dispatch({ type: "status", id: chat.id, messageId: id, status: "sent" }));
      later(900, () => dispatch({ type: "status", id: chat.id, messageId: id, status: "delivered" }));

      const replier = chat.members[Math.floor(Math.random() * chat.members.length)];
      const pool = REPLIES[chat.id] ?? ["👍"];
      const n = replyIndex.current[chat.id] ?? 0;
      replyIndex.current[chat.id] = n + 1;
      if (n >= pool.length) return;

      later(1600, () => {
        dispatch({ type: "status", id: chat.id, messageId: id, status: "read" });
        dispatch({ type: "typing", id: chat.id, who: replier });
      });
      later(3400, () => {
        dispatch({ type: "typing", id: chat.id, who: null });
        dispatch({ type: "append", id: chat.id, message: { id: newId(), from: replier, text: pool[n], at: Date.now() } });
      });
    },
    [later],
  );

  const runPalette = (action: PaletteAction) => {
    setPaletteOpen(false);
    if (action.type === "open") open(action.chatId);
    else if (action.type === "message") open(action.chatId, action.messageId);
    else if (action.type === "catchup") open(null);
    else if (action.type === "panel") setPanel(action.tab);
    else if (action.type === "go") router.push(action.href);
  };

  return (
    <div className="flex h-dvh min-w-0 flex-1">
      <aside
        className={[
          "h-full w-full shrink-0 flex-col border-r border-line bg-surface/60 md:flex md:w-84",
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
          />
        </div>
      </aside>

      <main className={["min-w-0 flex-1", active ? "flex" : "hidden md:flex"].join(" ")}>
        {active ? (
          <div className="min-w-0 flex-1">
            <Thread
              key={active.id}
              chat={active}
              now={state.now}
              highlightId={highlight}
              onSend={(text, replyTo) => send(active, text, replyTo)}
              onDraft={(text) => dispatch({ type: "draft", id: active.id, text })}
              onReact={(messageId, emoji) => dispatch({ type: "react", id: active.id, messageId, emoji })}
              onBack={() => open(null)}
              onToggleInfo={() => setPanel((p) => (p ? null : active.decisions.length ? "decisions" : "about"))}
            />
          </div>
        ) : (
          <CatchUp chats={state.chats} loaded={state.loaded} onOpen={open} />
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
          />
        ) : null}
      </main>

      <CommandPalette
        open={paletteOpen}
        chats={state.chats}
        hasActive={Boolean(active)}
        onClose={() => setPaletteOpen(false)}
        onRun={runPalette}
      />
    </div>
  );
}

/**
 * "While you were away": mentions, plans to confirm and things on your list
 * come first; everything links to the message behind it.
 */
function CatchUp({
  chats,
  loaded,
  onOpen,
}: {
  chats: Chat[];
  loaded: boolean;
  onOpen: (chatId: string, messageId?: string) => void;
}) {
  const data = useMemo(() => {
    const mentions = chats
      .filter((c) => c.mentions > 0)
      .map((c) => {
        const msg = [...c.messages].reverse().find((m) => m.from !== "me");
        return { chat: c, msg };
      });
    const decisions = chats.flatMap((c) =>
      c.decisions.filter((d) => d.status === "proposed").map((d) => ({ chat: c, d })),
    );
    const tasks = chats.flatMap((c) =>
      c.tasks.filter((t) => t.assignee === "me" && t.status !== "done" && t.status !== "rejected").map((t) => ({ chat: c, t })),
    );
    const unread = chats.reduce((n, c) => n + (c.muted ? 0 : c.unread), 0);
    return { mentions, decisions, tasks, unread };
  }, [chats]);

  if (!loaded) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted" role="status">
        Syncing your chats
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 overflow-y-auto px-6 py-10 md:px-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-[12px] font-semibold text-muted">
          While you were away · {data.unread} unread
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Here&apos;s what you missed.</h2>

        <Group title="You were mentioned" icon={<At size={16} weight="bold" />} empty="No new mentions.">
          {data.mentions.map(({ chat, msg }) => (
            <Row
              key={chat.id}
              onClick={() => onOpen(chat.id, msg?.id)}
              title={msg ? `${firstName(msg.from)}: ${msg.text}` : displayName(chat)}
              meta={displayName(chat)}
            />
          ))}
        </Group>

        <Group title="Plans to confirm" icon={<Lightbulb size={16} weight="fill" />} empty="No plans waiting.">
          {data.decisions.map(({ chat, d }) => (
            <Row key={d.id} onClick={() => onOpen(chat.id, d.sources.at(-1))} title={d.title} meta={`${displayName(chat)}, from ${d.sources.length} messages`} />
          ))}
        </Group>

        <Group title="On your list" icon={<ListChecks size={16} weight="bold" />} empty="Nothing on your list.">
          {data.tasks.map(({ chat, t }) => (
            <Row
              key={t.id}
              onClick={() => onOpen(chat.id, t.sources[0])}
              title={t.title}
              meta={`${displayName(chat)}, ${t.due}${t.status === "proposed" ? ", not confirmed yet" : ""}`}
            />
          ))}
        </Group>

        <p className="mt-10 text-sm text-muted">
          Press <kbd className="rounded-md border border-line px-1.5 text-[12px]">⌘K</kbd> to jump anywhere.
        </p>
      </div>
    </div>
  );
}

function Group({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <section className="mt-8">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-accent-ink">{icon}</span>
        {title}
      </h3>
      {children.length ? (
        <ul className="mt-3 grid gap-2">{children}</ul>
      ) : (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}

function Row({ title, meta, onClick }: { title: string; meta: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-ink/30"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{title}</span>
          <span className="block truncate text-[13px] text-muted">{meta}</span>
        </span>
        <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
      </button>
    </li>
  );
}

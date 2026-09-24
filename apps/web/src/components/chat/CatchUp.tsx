"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "motion/react";
import { ArrowRight, At, Check, CheckCircle, Lightbulb, ListChecks, Sparkle, X } from "@phosphor-icons/react";
import { ChatAvatar } from "./primitives";
import { displayName, firstName, type Chat, type KnowledgeStatus, type Task } from "@/lib/chat";
import type { NewChatTab } from "./NewChatDialog";

type Card =
  | { kind: "plan"; key: string; chat: Chat; id: string; title: string; detail: string; sources: string[] }
  | { kind: "todo"; key: string; chat: Chat; id: string; title: string; detail: string; sources: string[] };

/**
 * "While you were away", as a stage: a greeting, numbers that count up, and
 * the things waiting on you as a deck of cards. Swipe right to save, left to
 * dismiss, or use the buttons. Mentions and your list follow below.
 */
export function CatchUp({
  chats,
  loaded,
  name,
  onOpen,
  onNewChat,
  onDecision,
  onTask,
}: {
  chats: Chat[];
  loaded: boolean;
  name: string;
  onOpen: (chatId: string, messageId?: string) => void;
  onNewChat: (tab: NewChatTab) => void;
  onDecision: (chatId: string, itemId: string, status: KnowledgeStatus) => void;
  onTask: (chatId: string, itemId: string, status: Task["status"]) => void;
}) {
  const data = useMemo(() => {
    const mentions = chats
      .filter((c) => c.mentions > 0)
      .map((c) => ({ chat: c, msg: [...c.messages].reverse().find((m) => m.from !== "me") }));
    const deck: Card[] = [
      ...chats.flatMap((c) =>
        c.decisions
          .filter((d) => d.status === "proposed")
          .map((d) => ({ kind: "plan" as const, key: `p-${d.id}`, chat: c, id: d.id, title: d.title, detail: d.detail, sources: d.sources })),
      ),
      ...chats.flatMap((c) =>
        c.tasks
          .filter((t) => t.assignee === "me" && t.status === "proposed")
          .map((t) => ({ kind: "todo" as const, key: `t-${t.id}`, chat: c, id: t.id, title: t.title, detail: t.due, sources: t.sources })),
      ),
    ];
    const tasks = chats.flatMap((c) => c.tasks.filter((t) => t.assignee === "me" && t.status === "confirmed").map((t) => ({ chat: c, t })));
    const unread = chats.reduce((n, c) => n + (c.muted ? 0 : c.unread), 0);
    return { mentions, deck, tasks, unread };
  }, [chats]);

  if (!loaded) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted" role="status">
        Syncing your chats
      </div>
    );
  }

  if (!chats.length) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-center p-6">
        <Stage>
          <p className="text-[13px] font-semibold text-white/60">Welcome to Lynk</p>
          <h2 className="mt-3 text-5xl leading-[1.02] tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            Bring your people over.
          </h2>
          <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-white/70">
            Start a chat with someone on Lynk, make a group for the people you plan things with, or share your QR code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => onNewChat("chat")} className="inline-flex h-12 items-center rounded-full bg-white px-6 font-medium text-[#0b0c10] active:scale-95">
              Start a chat
            </button>
            <button type="button" onClick={() => onNewChat("group")} className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 font-medium hover:bg-white/10">
              New group
            </button>
            <button type="button" onClick={() => onNewChat("invite")} className="inline-flex h-12 items-center rounded-full px-5 font-medium text-[#8ec0ff] hover:bg-white/10">
              Show my QR code
            </button>
          </div>
        </Stage>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Up late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        <Stage>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-semibold text-white/60">
            While you were away
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="mt-2 text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.02] tracking-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {greeting}, {name}.
          </motion.h2>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Unread", value: data.unread },
              { label: "Mentions", value: data.mentions.length },
              { label: "Waiting on you", value: data.deck.length },
              { label: "On your list", value: data.tasks.length },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 + i * 0.07 }}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3.5"
              >
                <dt className="text-[12px] text-white/55">{s.label}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                  <CountUp value={s.value} />
                </dd>
              </motion.div>
            ))}
          </dl>
        </Stage>

        <section className="mt-10" aria-labelledby="deck-title">
          <div className="flex items-end justify-between gap-3">
            <h3 id="deck-title" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Sparkle size={18} weight="fill" className="text-accent-ink" aria-hidden /> Waiting on you
            </h3>
            <p className="hidden text-[13px] text-muted sm:block">Swipe right to save, left to dismiss</p>
          </div>
          <Deck cards={data.deck} onOpen={onOpen} onDecision={onDecision} onTask={onTask} />
        </section>

        <List title="You were mentioned" icon={<At size={16} weight="bold" />} empty="No new mentions.">
          {data.mentions.map(({ chat, msg }) => (
            <Row key={chat.id} chat={chat} onClick={() => onOpen(chat.id, msg?.id)} title={msg ? `${firstName(msg.from)}: ${msg.text}` : displayName(chat)} meta={displayName(chat)} />
          ))}
        </List>

        <List title="On your list" icon={<ListChecks size={16} weight="bold" />} empty="Nothing on your list.">
          {data.tasks.map(({ chat, t }) => (
            <Row key={t.id} chat={chat} onClick={() => onOpen(chat.id, t.sources[0])} title={t.title} meta={`${displayName(chat)} · ${t.due}`} />
          ))}
        </List>

        <p className="mt-10 mb-6 text-sm text-muted">
          Press <kbd className="rounded-md border border-line px-1.5 text-[12px]">⌘K</kbd> to jump anywhere.
        </p>
      </div>
    </div>
  );
}

/** A dark rounded stage with a glow that follows the pointer. */
function Stage({ children }: { children: React.ReactNode }) {
  const x = useSpring(useMotionValue(30), { stiffness: 60, damping: 18 });
  const y = useSpring(useMotionValue(20), { stiffness: 60, damping: 18 });
  const bg = useMotionTemplate`radial-gradient(420px circle at ${x}% ${y}%, rgb(47 123 255 / 0.35), transparent 70%)`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 22 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width) * 100);
        y.set(((e.clientY - r.top) / r.height) * 100);
      }}
      className="stage-dark relative isolate w-full overflow-hidden rounded-[2rem] p-7 shadow-soft md:p-10"
    >
      <motion.div aria-hidden className="absolute inset-0 -z-10" style={{ background: bg }} />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.06] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />
      {children}
    </motion.div>
  );
}

function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [value]);
  return <>{shown}</>;
}

/** The stack of cards. The top one is draggable; the next two peek out behind it. */
function Deck({
  cards,
  onOpen,
  onDecision,
  onTask,
}: {
  cards: Card[];
  onOpen: (chatId: string, messageId?: string) => void;
  onDecision: (chatId: string, itemId: string, status: KnowledgeStatus) => void;
  onTask: (chatId: string, itemId: string, status: Task["status"]) => void;
}) {
  const [gone, setGone] = useState<string[]>([]);
  const live = cards.filter((c) => !gone.includes(c.key));

  const decide = (card: Card, keep: boolean) => {
    setGone((g) => [...g, card.key]);
    // Let the card fly out before the item changes underneath it.
    window.setTimeout(() => {
      if (card.kind === "plan") onDecision(card.chat.id, card.id, keep ? "confirmed" : "rejected");
      else onTask(card.chat.id, card.id, keep ? "confirmed" : "rejected");
    }, 250);
  };

  return (
    <div className="relative mt-4 h-[17rem]">
      <AnimatePresence>
        {live.length === 0 ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-dashed border-line text-center"
          >
            <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.1 }}>
              <CheckCircle size={44} weight="fill" className="text-positive" aria-hidden />
            </motion.span>
            <p className="mt-3 font-semibold">All caught up</p>
            <p className="text-[14px] text-muted">Nothing is waiting on you.</p>
          </motion.div>
        ) : null}
        {live
          .slice(0, 3)
          .reverse()
          .map((card) => {
            const depth = live.indexOf(card);
            return (
              <DeckCard
                key={card.key}
                card={card}
                depth={depth}
                onDecide={(keep) => decide(card, keep)}
                onOpen={() => onOpen(card.chat.id, card.sources.at(-1))}
              />
            );
          })}
      </AnimatePresence>
    </div>
  );
}

function DeckCard({ card, depth, onDecide, onOpen }: { card: Card; depth: number; onDecide: (keep: boolean) => void; onOpen: () => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-16, 16]);
  const saveOpacity = useTransform(x, [30, 130], [0, 1]);
  const skipOpacity = useTransform(x, [-130, -30], [1, 0]);
  const top = depth === 0;
  const [exitX, setExitX] = useState(0);

  const end = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120 || info.velocity.x > 600) {
      setExitX(700);
      onDecide(true);
    } else if (info.offset.x < -120 || info.velocity.x < -600) {
      setExitX(-700);
      onDecide(false);
    }
  };

  return (
    <motion.article
      aria-label={`${card.kind === "plan" ? "Plan" : "To-do"}: ${card.title}`}
      style={{ x: top ? x : 0, rotate: top ? rotate : 0, zIndex: 10 - depth }}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: depth * 14, scale: 1 - depth * 0.05 }}
      exit={{ x: exitX, opacity: 0, rotate: exitX / 30, transition: { type: "spring", stiffness: 200, damping: 24 } }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      drag={top ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={end}
      whileDrag={{ scale: 1.03, cursor: "grabbing" }}
      className={`absolute inset-x-0 top-0 flex h-[15rem] origin-bottom flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft ${top ? "cursor-grab" : "pointer-events-none"}`}
    >
      {top ? (
        <>
          <motion.span style={{ opacity: saveOpacity }} className="absolute top-5 right-5 rotate-12 rounded-xl border-2 border-positive px-3 py-1 text-sm font-bold text-positive" aria-hidden>
            Save
          </motion.span>
          <motion.span style={{ opacity: skipOpacity }} className="absolute top-5 right-5 -rotate-12 rounded-xl border-2 border-danger-ink px-3 py-1 text-sm font-bold text-danger-ink" aria-hidden>
            Dismiss
          </motion.span>
        </>
      ) : null}
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
        {card.kind === "plan" ? <Lightbulb size={14} weight="fill" className="text-accent-ink" /> : <ListChecks size={14} weight="bold" className="text-accent-ink" />}
        {card.kind === "plan" ? "Plan spotted" : "Asked of you"}
      </p>
      <h4 className="mt-2 text-2xl font-semibold tracking-tight">{card.title}</h4>
      <p className="mt-1 text-[14px] text-muted">{card.detail}</p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-2 rounded-full pr-2 text-[13px] text-muted hover:text-ink" tabIndex={top ? 0 : -1}>
          <ChatAvatar chat={card.chat} size={24} />
          <span className="truncate">
            {displayName(card.chat)} · from {card.sources.length} message{card.sources.length === 1 ? "" : "s"}
          </span>
        </button>
        {top ? (
          <div className="flex shrink-0 gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setExitX(-700);
                onDecide(false);
              }}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-danger-ink"
              aria-label={`Dismiss ${card.title}`}
            >
              <X size={18} weight="bold" />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setExitX(700);
                onDecide(true);
              }}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-accent px-5 text-[14px] font-semibold text-on-accent shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--accent)_80%,transparent)]"
            >
              <Check size={16} weight="bold" aria-hidden /> Save
            </motion.button>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

function List({ title, icon, empty, children }: { title: string; icon: React.ReactNode; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="mt-10">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-accent-ink">{icon}</span>
        {title}
      </h3>
      {children.length ? <ul className="mt-3 grid gap-2">{children}</ul> : <p className="mt-2 text-sm text-muted">{empty}</p>}
    </section>
  );
}

function Row({ chat, title, meta, onClick }: { chat: Chat; title: string; meta: string; onClick: () => void }) {
  return (
    <motion.li initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left shadow-soft"
      >
        <ChatAvatar chat={chat} size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{title}</span>
          <span className="block truncate text-[13px] text-muted">{meta}</span>
        </span>
        <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-1" aria-hidden />
      </motion.button>
    </motion.li>
  );
}

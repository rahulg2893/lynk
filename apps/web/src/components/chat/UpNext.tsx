"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarBlank, CaretDown, Check, ListChecks } from "@phosphor-icons/react";
import { PlanCard } from "./PlanCard";
import { Lists } from "./Lists";
import { firstName, formatWhen, upNext, upNextSummary, type Chat, type Decision, type Rsvp } from "@/lib/chat";
import type { ListOp } from "@/lib/chat-ops";
import { MOTION } from "@/lib/motion";

/**
 * A pinned bar under the chat header: the next plan and what's still open.
 * Click it for this chat's plans, to-dos and lists in a drop-down, without
 * opening chat info. Hidden when nothing saved is still ahead.
 */
export function UpNext({
  chat,
  now,
  onJump,
  onRsvp,
  onEditPlan,
  onDone,
  onList,
  onMore,
}: {
  chat: Chat;
  now: number;
  onJump: (messageId: string) => void;
  onRsvp: (planId: string, answer: Rsvp | null) => void;
  onEditPlan: (plan: Decision) => void;
  onDone: (taskId: string) => void;
  onList: (op: ListOp) => void;
  /** Everything else (past plans, memories) in chat info. */
  onMore: () => void;
}) {
  // What was open when the drop-down opened, so ticking something off doesn't make it vanish mid-click.
  const [shown, setShown] = useState<Set<string> | null>(null);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const root = useRef<HTMLDivElement>(null);
  const open = Boolean(shown);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShown(null);
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setShown(null);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const u = upNext(chat, now);
  if (!u && !open) return null;

  const plan = u?.plans[0];
  const title = !u ? "Up next" : plan ? plan.title : (u.todos[0]?.title ?? `${u.lists[0].title} list`);
  const summary = u ? [plan?.when ? formatWhen(plan) : "", upNextSummary(u)].filter(Boolean).join(" · ") : "";
  const sheet = {
    plans: chat.decisions.filter((d) => shown?.has(d.id)),
    todos: chat.tasks.filter((t) => shown?.has(t.id)),
    lists: (chat.lists ?? []).filter((l) => shown?.has(l.id) || (open && !known.has(l.id))),
  };
  const jump = (id: string) => {
    setShown(null);
    onJump(id);
  };

  return (
    <div ref={root} className="relative z-20 border-b border-line/70">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          if (open || !u) return setShown(null);
          setShown(new Set([...u.plans, ...u.todos, ...u.lists].map((x) => x.id)));
          setKnown(new Set((chat.lists ?? []).map((l) => l.id)));
        }}
        className="flex w-full items-center gap-3 bg-surface/70 px-3 py-2.5 text-left hover:bg-surface-2/70 md:px-6"
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent-ink">
          {plan ? <CalendarBlank size={18} weight="bold" aria-hidden /> : <ListChecks size={18} weight="bold" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{title}</span>
          {summary ? <span className="block truncate text-[12px] text-muted">{summary}</span> : null}
        </span>
        <CaretDown size={15} weight="bold" className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={MOTION.item}
            className="absolute inset-x-2 top-full mt-2 max-h-[70vh] overflow-y-auto rounded-3xl border border-line bg-bg p-4 shadow-soft md:inset-x-6"
            role="region"
            aria-label={`Up next in ${chat.name}`}
          >
            <div className="grid gap-3">
              {sheet.plans.length ? <Heading>Plans</Heading> : null}
              {sheet.plans.map((d) => (
                <PlanCard
                  key={d.id}
                  chat={chat}
                  plan={d}
                  onRsvp={(a) => onRsvp(d.id, a)}
                  onEdit={() => {
                    setShown(null);
                    onEditPlan(d);
                  }}
                  onJump={jump}
                />
              ))}
              {sheet.todos.length ? <Heading>To-dos</Heading> : null}
              {sheet.todos.length ? (
                <ul className="grid gap-2">
                  {sheet.todos.map((t) => {
                    const done = t.status === "done";
                    const mine = t.assignee === "me";
                    return (
                      <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3">
                        <button
                          type="button"
                          disabled={!mine || done}
                          onClick={() => onDone(t.id)}
                          aria-label={done ? `${t.title}, done` : mine ? `Mark ${t.title} done` : `${t.title}, for ${firstName(t.assignee)}`}
                          className={`inline-flex size-6 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] ${done ? "border-accent bg-accent text-on-accent" : "border-muted"} disabled:cursor-default`}
                        >
                          {done ? <Check size={14} weight="bold" aria-hidden /> : null}
                        </button>
                        <span className="min-w-0 flex-1">
                          <span className={`block font-semibold ${done ? "text-muted line-through" : ""}`}>{t.title}</span>
                          <span className="block text-[13px] text-muted">
                            {mine ? "You" : firstName(t.assignee)}, {t.due}
                          </span>
                        </span>
                        {t.sources[0] ? (
                          <button type="button" onClick={() => jump(t.sources[0])} className="text-[13px] font-medium text-accent-ink hover:underline">
                            Source
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <Heading>Lists</Heading>
              <Lists lists={sheet.lists} onChange={onList} />
              <button type="button" onClick={() => (setShown(null), onMore())} className="justify-self-center py-2 text-[14px] font-medium text-accent-ink hover:underline">
                Past plans, done to-dos and memories
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Heading({ children }: { children: string }) {
  return <p className="mt-1 px-1 text-[12px] font-semibold tracking-wide text-muted uppercase">{children}</p>;
}

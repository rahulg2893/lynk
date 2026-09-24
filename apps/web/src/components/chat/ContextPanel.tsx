"use client";

import { useState } from "react";
import Link from "next/link";
import { BellSlash, Check, CheckCircle, Lightbulb, ListChecks, Sparkle, UsersThree, X } from "@phosphor-icons/react";
import { Avatar } from "./primitives";
import { useAccount } from "@/lib/account";
import {
  displayName,
  firstName,
  personName,
  type Chat,
  type KnowledgeStatus,
  type Task,
} from "@/lib/chat";

export type PanelTab = "decisions" | "tasks" | "memory" | "about";

const TABS: { value: PanelTab; label: string }[] = [
  { value: "decisions", label: "Plans" },
  { value: "tasks", label: "To-dos" },
  { value: "memory", label: "Memories" },
  { value: "about", label: "Info" },
];

/**
 * What a chat remembers: plans, to-dos and little facts. Anything Lynk
 * suggested stays "suggested" until someone confirms it, and every item links
 * back to the messages it came from.
 */
export function ContextPanel({
  chat,
  tab,
  onTab,
  onClose,
  onJump,
  onDecision,
  onTask,
  onMute,
}: {
  chat: Chat;
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  onClose: () => void;
  onJump: (messageId: string) => void;
  onDecision: (id: string, status: KnowledgeStatus) => void;
  onTask: (id: string, status: Task["status"]) => void;
  onMute: () => void;
}) {
  return (
    <aside
      aria-label="What this chat remembers"
      className="fixed inset-0 z-40 flex flex-col bg-surface lg:static lg:z-auto lg:w-96 lg:shrink-0 lg:border-l lg:border-line"
    >
      <div className="flex items-center justify-between gap-3 py-3 pr-2 pl-5">
        <h2 className="truncate font-semibold">{displayName(chat)}</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Close"
        >
          <X size={18} weight="bold" />
        </button>
      </div>

      <div role="tablist" aria-label="Remembered in this chat" className="mx-4 flex gap-1 rounded-full bg-surface-2 p-1">
        {TABS.map((t) => {
          const count =
            t.value === "decisions" ? chat.decisions.length : t.value === "tasks" ? chat.tasks.length : t.value === "memory" ? chat.memory.length : 0;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => onTab(t.value)}
              className={[
                "flex h-9 flex-auto items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
                tab === t.value ? "bg-surface text-ink shadow-soft" : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {t.label}
              {count ? (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-bg px-1 text-[11px] leading-none text-muted tabular-nums">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {tab === "decisions" ? (
          <List empty="No plans yet. When everyone agrees on a time or place, Lynk suggests it here.">
            {chat.decisions.map((d) => (
              <Item
                key={d.id}
                status={d.status}
                icon={<Lightbulb size={16} weight="fill" />}
                title={d.title}
                detail={d.detail + (d.supersedes ? ` Instead of ${d.supersedes}.` : "")}
                sources={d.sources}
                onJump={onJump}
                onConfirm={() => onDecision(d.id, "confirmed")}
                onReject={() => onDecision(d.id, "rejected")}
              />
            ))}
          </List>
        ) : null}

        {tab === "tasks" ? (
          <List empty="Nothing to do. Asks like “can you bring the snacks?” show up here to confirm.">
            {chat.tasks.map((t) => (
              <Item
                key={t.id}
                status={t.status === "done" ? "confirmed" : t.status}
                icon={<ListChecks size={16} weight="bold" />}
                title={t.title}
                detail={`${t.assignee === "me" ? "You" : firstName(t.assignee)}, ${t.due}${t.status === "done" ? ", done" : ""}`}
                sources={t.sources}
                onJump={onJump}
                onConfirm={() => onTask(t.id, "confirmed")}
                onReject={() => onTask(t.id, "rejected")}
                extra={
                  t.status === "confirmed" && t.assignee === "me" ? (
                    <button
                      type="button"
                      onClick={() => onTask(t.id, "done")}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-2.5 text-[13px] font-medium hover:bg-surface-2"
                    >
                      <CheckCircle size={15} /> Mark done
                    </button>
                  ) : null
                }
              />
            ))}
          </List>
        ) : null}

        {tab === "memory" ? (
          <List empty="Nothing remembered yet. Birthdays, favourite places and other little things collect here.">
            {chat.memory.map((m) => (
              <li key={m.id} className="rounded-2xl border border-line p-3.5">
                <p className="text-[12px] font-semibold text-muted">{m.kind}</p>
                <p className="mt-1 font-medium">{m.value}</p>
                <Sources ids={m.sources} onJump={onJump} />
              </li>
            ))}
          </List>
        ) : null}

        {tab === "about" ? <About chat={chat} onMute={onMute} /> : null}
      </div>
    </aside>
  );
}

function List({ empty, children }: { empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  if (!items.length) return <p className="px-2 py-10 text-center text-sm text-muted">{empty}</p>;
  return <ul className="grid gap-2.5">{children}</ul>;
}

function Item({
  status,
  icon,
  title,
  detail,
  sources,
  onJump,
  onConfirm,
  onReject,
  extra,
}: {
  status: KnowledgeStatus;
  icon: React.ReactNode;
  title: string;
  detail: string;
  sources: string[];
  onJump: (id: string) => void;
  onConfirm: () => void;
  onReject: () => void;
  extra?: React.ReactNode;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (status === "rejected" && dismissed) return null;
  const proposed = status === "proposed";

  return (
    <li
      className={[
        "rounded-2xl border p-3.5",
        proposed ? "border-line bg-bg" : status === "rejected" ? "border-line opacity-60" : "border-line",
      ].join(" ")}
    >
      <p className="flex items-center gap-1.5 text-[12px] font-semibold">
        {proposed ? (
          <>
            <Sparkle size={13} weight="fill" className="text-accent-ink" /> Suggested
          </>
        ) : status === "rejected" ? (
          <>Rejected</>
        ) : (
          <>
            <span className="text-positive">{icon}</span> Confirmed
          </>
        )}
      </p>
      <p className="mt-1.5 leading-snug font-semibold">{title}</p>
      <p className="mt-1 text-[13px] text-muted">{detail}</p>
      <Sources ids={sources} onJump={onJump} />
      {proposed ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-[13px] font-medium text-bg active:scale-[0.98]"
          >
            <Check size={14} weight="bold" /> Confirm
          </button>
          <button
            type="button"
            onClick={onReject}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium"
          >
            <X size={14} /> Reject
          </button>
        </div>
      ) : status === "rejected" ? (
        <button type="button" onClick={() => setDismissed(true)} className="mt-2 text-[13px] text-muted hover:text-ink">
          Hide
        </button>
      ) : extra ? (
        <div className="mt-3">{extra}</div>
      ) : null}
    </li>
  );
}

function Sources({ ids, onJump }: { ids: string[]; onJump: (id: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      <span className="text-[12px] text-muted">Sources</span>
      {ids.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onJump(id)}
          className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-line bg-surface px-1.5 text-[12px] hover:border-accent hover:text-accent-ink"
          aria-label={`Jump to source message ${i + 1}`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

function About({ chat, onMute }: { chat: Chat; onMute: () => void }) {
  const account = useAccount();
  return (
    <div className="grid gap-5">
      {chat.topic ? <p className="text-sm text-muted">{chat.topic}</p> : null}
      <label htmlFor="mute-toggle" className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line px-3.5 py-3">
        <span className="flex items-center gap-2.5 text-sm">
          <BellSlash size={18} className="text-muted" aria-hidden />
          Mute notifications
        </span>
        <input id="mute-toggle" type="checkbox" checked={chat.muted} onChange={onMute} className="peer sr-only" />
        <span
          aria-hidden
          className="relative h-6 w-10 rounded-full bg-surface-2 transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:after:translate-x-4"
        />
      </label>
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <UsersThree size={16} aria-hidden /> Members
        </h3>
        <ul className="mt-3 grid gap-2.5">
          {["me", ...chat.members].map((id) => (
            <li key={id}>
              <Link
                href={id === "me" ? "/app/profile" : `/app/people/${id}`}
                className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-surface-2"
              >
                {id === "me" ? (
                  <Avatar id="me" name={account?.profile.name ?? "You"} photo={account?.profile.photo} size={30} />
                ) : (
                  <Avatar id={id} name={personName(id)} size={30} />
                )}
                <span className="text-sm">{personName(id)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

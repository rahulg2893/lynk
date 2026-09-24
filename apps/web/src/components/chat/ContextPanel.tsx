"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  BellSlash,
  CalendarPlus,
  CaretRight,
  Check,
  CheckCircle,
  ListChecks,
  PencilSimple,
  PushPin,
  SignOut,
  Sparkle,
  UserMinus,
  UserPlus,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { Button, Switch } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { PeoplePicker } from "./PeoplePicker";
import { PlanCard } from "./PlanCard";
import { Lists } from "./Lists";
import type { ListOp } from "@/lib/chat-ops";
import { Avatar } from "./primitives";
import { useAccount } from "@/lib/account";
import {
  displayName,
  firstName,
  personName,
  type Chat,
  type Decision,
  type KnowledgeStatus,
  type Rsvp,
  type Task,
} from "@/lib/chat";

export type PanelTab = "decisions" | "tasks" | "lists" | "memory" | "about";

const TABS: { value: PanelTab; label: string }[] = [
  { value: "decisions", label: "Plans" },
  { value: "tasks", label: "To-dos" },
  { value: "lists", label: "Lists" },
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
  onRsvp,
  onNewPlan,
  onEditPlan,
  onList,
  onMute,
  onPin,
  onRename,
  onMembers,
  onLeave,
}: {
  chat: Chat;
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  onClose: () => void;
  onJump: (messageId: string) => void;
  onDecision: (id: string, status: KnowledgeStatus) => void;
  onTask: (id: string, status: Task["status"]) => void;
  onRsvp: (planId: string, answer: Rsvp | null) => void;
  onNewPlan: () => void;
  onEditPlan: (plan: Decision) => void;
  onList: (op: ListOp) => void;
  onMute: () => void;
  onPin: () => void;
  onRename: (name: string) => void;
  onMembers: (change: { add?: string[]; remove?: string[] }) => void;
  onLeave: () => void;
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

      <div role="tablist" aria-label="Remembered in this chat" className="mx-4 flex gap-0.5 overflow-x-auto rounded-full bg-surface-2 p-1 [scrollbar-width:none]">
        {TABS.map((t) => {
          const count =
            t.value === "decisions"
              ? chat.decisions.length
              : t.value === "tasks"
                ? chat.tasks.length
                : t.value === "lists"
                  ? (chat.lists?.length ?? 0)
                  : t.value === "memory"
                    ? chat.memory.length
                    : 0;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => onTab(t.value)}
              className={[
                "flex h-9 flex-auto shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
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
          <div className="grid gap-2.5">
            <button
              type="button"
              onClick={onNewPlan}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent text-[14px] font-medium text-on-accent active:scale-[0.98]"
            >
              <CalendarPlus size={17} weight="bold" /> New plan
            </button>
            {chat.decisions.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted">No plans yet. Make one, or Lynk suggests one when everyone agrees on a time or place.</p>
            ) : (
              <ul className="grid gap-2.5">
                {chat.decisions.map((d) => (
                  <li key={d.id}>
                  <PlanCard
                    chat={chat}
                    plan={d}
                    onRsvp={(answer) => onRsvp(d.id, answer)}
                    onEdit={() => onEditPlan(d)}
                    onConfirm={() => onDecision(d.id, "confirmed")}
                    onReject={() => onDecision(d.id, "rejected")}
                    onJump={onJump}
                  />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "lists" ? <Lists lists={chat.lists ?? []} onChange={onList} /> : null}

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

        {tab === "about" ? (
          <About chat={chat} onMute={onMute} onPin={onPin} onRename={onRename} onMembers={onMembers} onLeave={onLeave} />
        ) : null}
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

function About({
  chat,
  onMute,
  onPin,
  onRename,
  onMembers,
  onLeave,
}: {
  chat: Chat;
  onMute: () => void;
  onPin: () => void;
  onRename: (name: string) => void;
  onMembers: (change: { add?: string[]; remove?: string[] }) => void;
  onLeave: () => void;
}) {
  const account = useAccount();
  const group = chat.kind === "group";
  const admin = group && (chat.admins ?? []).includes("me");
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(chat.name);
  const [adding, setAdding] = useState(false);
  const [toAdd, setToAdd] = useState<string[]>([]);
  const [toRemove, setToRemove] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  return (
    <div className="grid gap-5">
      {chat.topic ? <p className="text-sm text-muted">{chat.topic}</p> : null}

      {group ? (
        renaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) onRename(name.trim());
              setRenaming(false);
            }}
            className="grid gap-3"
          >
            <TextField id="group-rename" label="Group name" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} autoFocus />
            <div className="flex gap-2">
              <Button type="submit" size="sm" variant="primary" disabled={!name.trim()}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : admin ? (
          <button
            type="button"
            onClick={() => {
              setName(chat.name);
              setRenaming(true);
            }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-line px-3.5 py-3 text-left hover:bg-surface-2/60"
          >
            <span>
              <span className="block text-[12px] font-semibold text-muted">Group name</span>
              <span className="block font-medium">{chat.name}</span>
            </span>
            <PencilSimple size={16} className="text-muted" aria-hidden />
            <span className="sr-only">Rename group</span>
          </button>
        ) : null
      ) : (
        <Link href={`/app/people/${chat.members[0]}`} className="flex items-center justify-between rounded-2xl border border-line px-3.5 py-3 hover:bg-surface-2/60">
          <span className="text-sm font-medium">View profile</span>
          <CaretRight size={16} className="text-muted" aria-hidden />
        </Link>
      )}

      <div className="divide-y divide-line rounded-2xl border border-line">
        <SwitchLine icon={<PushPin size={18} />} label="Pin chat" checked={Boolean(chat.pinned)} onChange={onPin} />
        <SwitchLine icon={<BellSlash size={18} />} label="Mute notifications" checked={chat.muted} onChange={onMute} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <UsersThree size={16} aria-hidden /> {group ? `${chat.members.length + 1} members` : "In this chat"}
          </h3>
          {admin ? (
            <Button size="sm" onClick={() => setAdding(true)}>
              <UserPlus size={15} aria-hidden /> Add people
            </Button>
          ) : null}
        </div>
        <ul className="mt-3 grid gap-1">
          {["me", ...chat.members].map((id) => (
            <li key={id} className="flex items-center gap-1">
              <Link
                href={id === "me" ? "/app/profile" : `/app/people/${id}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-surface-2"
              >
                {id === "me" ? (
                  <Avatar id="me" name={account?.profile.name ?? "You"} photo={account?.profile.photo} size={30} />
                ) : (
                  <Avatar id={id} name={personName(id)} size={30} />
                )}
                <span className="min-w-0 flex-1 truncate text-sm">{personName(id)}</span>
                {group && (chat.admins ?? []).includes(id) ? (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">Admin</span>
                ) : null}
              </Link>
              {admin && id !== "me" ? (
                <button
                  type="button"
                  onClick={() => setToRemove(id)}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-danger-ink"
                  aria-label={`Remove ${personName(id)} from the group`}
                >
                  <UserMinus size={16} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {group ? (
        <Button variant="danger-quiet" onClick={() => setLeaving(true)}>
          <SignOut size={16} aria-hidden /> Leave group
        </Button>
      ) : null}

      <Dialog open={adding} onClose={() => setAdding(false)} title={`Add people to ${chat.name}`}>
        {adding ? (
          <>
            <PeoplePicker
              mode="multi"
              exclude={[...chat.members, ...(account?.blocked ?? [])]}
              selected={toAdd}
              onPick={(id) => setToAdd((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))}
            />
            <p className="mt-3 text-[13px] text-muted">New members see messages from when they join.</p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setAdding(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!toAdd.length}
                onClick={() => {
                  onMembers({ add: toAdd });
                  setToAdd([]);
                  setAdding(false);
                }}
              >
                Add {toAdd.length || ""}
              </Button>
            </div>
          </>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(toRemove)}
        onClose={() => setToRemove(null)}
        title={`Remove ${toRemove ? firstName(toRemove) : ""}?`}
        description="They'll stop getting new messages from this group. The group is told they were removed."
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => setToRemove(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (toRemove) onMembers({ remove: [toRemove] });
              setToRemove(null);
            }}
          >
            Remove
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={leaving}
        onClose={() => setLeaving(false)}
        title={`Leave ${chat.name}?`}
        description="You'll stop getting messages, and plans and lists from this group disappear from your Lynk. Someone can add you back later."
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => setLeaving(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              setLeaving(false);
              onLeave();
            }}
          >
            Leave group
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function SwitchLine({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: () => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-3">
      <span id={id} className="flex items-center gap-2.5 text-sm">
        <span className="text-muted" aria-hidden>
          {icon}
        </span>
        {label}
      </span>
      <Switch checked={checked} onChange={onChange} labelledBy={id} />
    </div>
  );
}

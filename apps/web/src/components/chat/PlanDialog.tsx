"use client";

import { useState } from "react";
import { Button, Switch } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import type { Chat } from "@/lib/chat";
import type { PlanInput } from "@/lib/chat-ops";

export type PlanDraft = PlanInput & {
  /** The chat it belongs to; left empty when made from the calendar, which asks. */
  chatId?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const dateValue = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const timeValue = (at: number) => {
  const d = new Date(at);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Make or edit a plan by hand: what, when and where. The time is optional;
 * without one the plan is an all-day event in calendars.
 */
export function PlanDialog({
  draft,
  chats,
  onSave,
  onDelete,
  onClose,
}: {
  draft: PlanDraft | null;
  /** Chats to choose from when the draft has no chat yet. */
  chats: Chat[];
  onSave: (chatId: string, input: PlanInput) => void;
  onDelete?: (chatId: string, planId: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={draft !== null}
      onClose={onClose}
      title={draft?.id ? "Edit plan" : "New plan"}
      description={draft?.id ? undefined : "Everyone in the chat sees it and can say if they're coming."}
    >
      {draft ? <PlanForm key={draft.id ?? `${draft.chatId}-${draft.when}`} draft={draft} chats={chats} onSave={onSave} onDelete={onDelete} onClose={onClose} /> : null}
    </Dialog>
  );
}

function PlanForm({
  draft,
  chats,
  onSave,
  onDelete,
  onClose,
}: {
  draft: PlanDraft;
  chats: Chat[];
  onSave: (chatId: string, input: PlanInput) => void;
  onDelete?: (chatId: string, planId: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(draft.title);
  const [date, setDate] = useState(draft.when ? dateValue(draft.when) : "");
  const [time, setTime] = useState(draft.when && !draft.allDay ? timeValue(draft.when) : "");
  const [where, setWhere] = useState(draft.where ?? "");
  const [weekly, setWeekly] = useState(draft.repeat === "weekly");
  const [chatId, setChatId] = useState(draft.chatId ?? chats[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const what = title.trim();
    if (!what) return setError("Say what the plan is.");
    if (!chatId) return setError("Pick a chat for this plan.");
    let when: number | undefined;
    if (date) {
      const [y, m, d] = date.split("-").map(Number);
      const [h, min] = time ? time.split(":").map(Number) : [9, 0];
      when = new Date(y, m - 1, d, h, min).getTime();
    }
    if (weekly && !when) return setError("Pick a date for the first week.");
    onSave(chatId, { id: draft.id, title: what, when, allDay: Boolean(date && !time), where: where.trim() || undefined, repeat: weekly ? "weekly" : undefined, sources: draft.sources });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-4"
    >
      <TextField
        id="plan-title"
        label="What"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError(null);
        }}
        placeholder="Climbing at Boulder Barn"
        maxLength={80}
        autoFocus
        error={error}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField id="plan-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField id="plan-time" label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} optional />
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
        <span className="min-w-0 flex-1">
          <span id="plan-weekly" className="block text-[14px] font-medium">
            Every week
          </span>
          <span className="block text-[12px] text-muted">Same day and time; people answer for each week</span>
        </span>
        <Switch checked={weekly} onChange={setWeekly} labelledBy="plan-weekly" />
      </div>
      <TextField id="plan-where" label="Where" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Add a place" optional maxLength={80} />
      {!draft.chatId ? (
        <div>
          <label htmlFor="plan-chat" className="mb-1.5 block px-4 text-[13px] font-medium">
            Chat
          </label>
          <select
            id="plan-chat"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            className="h-12 w-full rounded-full border border-line bg-surface px-4 text-[15px] outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
          >
            {chats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        {draft.id && draft.chatId && onDelete ? (
          <Button variant="danger-quiet" size="md" onClick={() => onDelete(draft.chatId!, draft.id!)}>
            Remove
          </Button>
        ) : null}
        <span className="flex-1" />
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {draft.id ? "Save" : "Make plan"}
        </Button>
      </div>
    </form>
  );
}

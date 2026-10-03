"use client";

import { useState } from "react";
import { Button } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { DUE_CHOICES, firstName, type Chat } from "@/lib/chat";
import type { TaskInput } from "@/lib/chat-ops";

export type TaskDraft = { chatId: string; title: string; sources?: string[] };

/** Make a to-do by hand: what, who it's for and roughly when. */
export function TaskDialog({ draft, chats, onSave, onClose }: { draft: TaskDraft | null; chats: Chat[]; onSave: (chatId: string, input: TaskInput) => void; onClose: () => void }) {
  const chat = draft ? chats.find((c) => c.id === draft.chatId) : undefined;
  return (
    <Dialog open={Boolean(draft && chat)} onClose={onClose} title="New to-do" description="It shows in Up next until it's done.">
      {draft && chat ? <TaskForm key={`${draft.chatId}-${draft.title}`} draft={draft} chat={chat} onSave={onSave} onClose={onClose} /> : null}
    </Dialog>
  );
}

function TaskForm({ draft, chat, onSave, onClose }: { draft: TaskDraft; chat: Chat; onSave: (chatId: string, input: TaskInput) => void; onClose: () => void }) {
  const [title, setTitle] = useState(draft.title);
  const [assignee, setAssignee] = useState("me");
  const [due, setDue] = useState("Today");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return setError("Say what needs doing.");
        onSave(chat.id, { title: title.trim(), assignee, due, sources: draft.sources });
      }}
      className="grid gap-4"
    >
      <TextField
        id="task-title"
        label="What"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError(null);
        }}
        placeholder="Book the table"
        maxLength={80}
        autoFocus
        error={error}
      />
      <Choices label="For" value={assignee} onChange={setAssignee} options={["me", ...chat.members].map((id) => ({ value: id, label: firstName(id) }))} />
      <Choices label="When" value={due} onChange={setDue} options={DUE_CHOICES.map((d) => ({ value: d, label: d }))} />
      <div className="mt-2 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Add to-do
        </Button>
      </div>
    </form>
  );
}

function Choices({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 px-4 text-[13px] font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`h-9 rounded-full border px-3.5 text-[14px] font-medium ${value === o.value ? "border-accent bg-accent text-on-accent" : "border-line bg-surface hover:bg-surface-2"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

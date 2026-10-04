"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CalendarPlus, ChartBar, Check, Plus, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { firstName, type Poll } from "@/lib/chat";

/**
 * A poll inside a message: one vote each, live counts, and for whoever asked,
 * "Make it the plan" on the leading option once someone has voted.
 */
export function PollCard({ poll, mine, onVote, onDecide }: { poll: Poll; mine: boolean; onVote: (optionId: string) => void; onDecide: (optionId: string) => void }) {
  const total = poll.options.reduce((n, o) => n + o.votes.length, 0);
  const lead = [...poll.options].sort((a, b) => b.votes.length - a.votes.length)[0];
  const decided = poll.options.find((o) => o.id === poll.decided);

  return (
    <div className="mt-1 max-w-md rounded-2xl border border-line bg-surface p-3.5">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
        <ChartBar size={13} weight="bold" aria-hidden /> Poll · {total} {total === 1 ? "vote" : "votes"}
      </p>
      <p className="mt-1 leading-snug font-semibold">{poll.question}</p>
      <ul className="mt-2.5 grid gap-1.5">
        {poll.options.map((o) => {
          const share = total ? o.votes.length / total : 0;
          const chosen = o.votes.includes("me");
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={Boolean(poll.decided)}
                onClick={() => onVote(o.id)}
                aria-pressed={chosen}
                aria-label={`${o.text}, ${o.votes.length} ${o.votes.length === 1 ? "vote" : "votes"}${chosen ? ", your vote" : ""}`}
                className={`relative flex w-full items-center gap-2 overflow-hidden rounded-xl border px-3 py-2 text-left text-[14px] ${chosen ? "border-accent" : "border-line"} disabled:cursor-default`}
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-accent-soft"
                  initial={false}
                  animate={{ width: `${share * 100}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                />
                <span className="relative flex min-w-0 flex-1 items-center gap-2">
                  {chosen ? <Check size={14} weight="bold" className="shrink-0 text-accent-ink" aria-hidden /> : null}
                  <span className="truncate font-medium">{o.text}</span>
                </span>
                <span className="relative shrink-0 text-[12px] text-muted tabular-nums">
                  {o.votes.length ? o.votes.map((v) => firstName(v)).join(", ") : "0"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {decided ? (
        <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-muted">
          <CalendarPlus size={14} aria-hidden /> Made into a plan: {decided.text}
        </p>
      ) : mine && lead && lead.votes.length ? (
        <button type="button" onClick={() => onDecide(lead.id)} className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-[13px] font-medium text-bg active:scale-[0.98]">
          <CalendarPlus size={15} /> Make &ldquo;{lead.text}&rdquo; the plan
        </button>
      ) : null}
    </div>
  );
}

/** Ask the chat something: a question and two to four options. */
export function PollDialog({ open, onSend, onClose }: { open: boolean; onSend: (question: string, options: string[]) => void; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="New poll" description="Everyone in the chat gets one vote. Turn the winner into a plan.">
      {open ? <PollForm onSend={onSend} onClose={onClose} /> : null}
    </Dialog>
  );
}

function PollForm({ onSend, onClose }: { onSend: (question: string, options: string[]) => void; onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const filled = options.map((o) => o.trim()).filter(Boolean);
        if (!question.trim()) return setError("Ask a question.");
        if (filled.length < 2) return setError("Add at least two options.");
        onSend(question.trim(), filled);
      }}
    >
      <TextField
        id="poll-question"
        label="Question"
        value={question}
        onChange={(e) => {
          setQuestion(e.target.value);
          setError(null);
        }}
        placeholder="Dinner this week?"
        maxLength={80}
        autoFocus
        error={error}
      />
      <div className="grid gap-2">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <TextField
                id={`poll-option-${i}`}
                label={`Option ${i + 1}`}
                value={o}
                onChange={(e) => setOptions((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={i === 0 ? "Friday 8pm" : i === 1 ? "Saturday 7pm" : "Another option"}
                maxLength={40}
              />
            </div>
            {options.length > 2 ? (
              <button
                type="button"
                onClick={() => setOptions((all) => all.filter((_, j) => j !== i))}
                className="mt-6 inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                aria-label={`Remove option ${i + 1}`}
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        ))}
        {options.length < 4 ? (
          <button type="button" onClick={() => setOptions((all) => [...all, ""])} className="inline-flex items-center gap-1 justify-self-start px-4 text-[14px] font-medium text-accent-ink hover:underline">
            <Plus size={14} weight="bold" aria-hidden /> Add an option
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Send poll
        </Button>
      </div>
    </form>
  );
}

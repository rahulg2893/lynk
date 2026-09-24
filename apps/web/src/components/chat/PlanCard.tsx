"use client";

import { motion } from "motion/react";
import { CalendarPlus, Check, Clock, MapPin, PencilSimple, Sparkle, X } from "@phosphor-icons/react";
import { Avatar } from "./primitives";
import { formatWhen, personName, rsvpSummary, RSVP_LABEL, type Chat, type Decision, type Rsvp } from "@/lib/chat";
import { downloadIcs } from "@/lib/ics";

const ANSWERS: Rsvp[] = ["going", "maybe", "no"];

/**
 * One plan: what, when, where and who's coming. Suggested plans ask to be
 * confirmed first; confirmed ones take RSVPs and go into your calendar.
 */
export function PlanCard({
  chat,
  plan,
  showChat = false,
  onRsvp,
  onEdit,
  onConfirm,
  onReject,
  onJump,
}: {
  chat: Chat;
  plan: Decision;
  /** Name the chat (the calendar lists plans from every chat). */
  showChat?: boolean;
  onRsvp: (answer: Rsvp | null) => void;
  onEdit?: () => void;
  onConfirm?: () => void;
  onReject?: () => void;
  onJump?: (messageId: string) => void;
}) {
  const proposed = plan.status === "proposed";
  const mine = plan.rsvp?.me;
  const people = Object.entries(plan.rsvp ?? {}).filter(([, a]) => a !== "no");

  return (
    <div
      className={[
        "rounded-2xl border p-3.5",
        proposed ? "border-dashed border-line bg-bg" : plan.status === "rejected" ? "border-line opacity-60" : "border-line bg-surface",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-1.5 text-[12px] font-semibold text-muted">
          {proposed ? (
            <>
              <Sparkle size={13} weight="fill" className="text-accent-ink" /> Suggested by Lynk
            </>
          ) : plan.status === "rejected" ? (
            "Rejected"
          ) : plan.by ? (
            `Made by ${plan.by === "me" ? "you" : personName(plan.by).split(" ")[0]}`
          ) : (
            "Confirmed"
          )}
          {showChat ? <span className="truncate font-medium">· {chat.name}</span> : null}
        </p>
        {onEdit && !proposed ? (
          <button
            type="button"
            onClick={onEdit}
            className="-mt-1 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            aria-label={`Edit ${plan.title}`}
          >
            <PencilSimple size={15} />
          </button>
        ) : null}
      </div>

      <p className="mt-1 leading-snug font-semibold">{plan.title}</p>
      <div className="mt-1.5 grid gap-1 text-[13px] text-muted">
        <span className="flex items-center gap-1.5">
          <Clock size={14} aria-hidden /> {formatWhen(plan)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin size={14} aria-hidden /> {plan.where ?? "Place still open"}
        </span>
      </div>

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
            <X size={14} /> Not this
          </button>
        </div>
      ) : plan.status === "confirmed" ? (
        <>
          <div role="group" aria-label="Are you going?" className="mt-3 flex gap-1 rounded-full bg-surface-2 p-1">
            {ANSWERS.map((answer) => (
              <button
                key={answer}
                type="button"
                aria-pressed={mine === answer}
                onClick={() => onRsvp(mine === answer ? null : answer)}
                className="relative h-8 flex-1 rounded-full text-[13px] font-medium"
              >
                {mine === answer ? (
                  <motion.span
                    layoutId={`rsvp-${chat.id}-${plan.id}`}
                    className={`absolute inset-0 rounded-full shadow-soft ${answer === "going" ? "bg-accent" : "bg-surface"}`}
                    transition={{ type: "spring", stiffness: 500, damping: 34 }}
                  />
                ) : null}
                <span className={`relative ${mine === answer ? (answer === "going" ? "text-on-accent" : "text-ink") : "text-muted"}`}>
                  {RSVP_LABEL[answer]}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            {people.length ? (
              <span className="flex -space-x-1.5" aria-hidden>
                {people.slice(0, 4).map(([id]) => (
                  <span key={id} className="inline-flex rounded-[7px] ring-2 ring-surface">
                    <Avatar id={id} name={personName(id)} size={18} />
                  </span>
                ))}
              </span>
            ) : null}
            <p className="min-w-0 text-[12px] text-muted">{rsvpSummary(plan)}</p>
          </div>
          <button
            type="button"
            disabled={!plan.when}
            onClick={() => downloadIcs([{ chat, plan }])}
            title={plan.when ? "Download an .ics file for Apple, Google or Outlook Calendar" : "Add a date first"}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarPlus size={15} /> Add to calendar
          </button>
        </>
      ) : null}

      {plan.sources.length && onJump ? (
        <div className="mt-3 flex flex-wrap items-center gap-1">
          <span className="text-[12px] text-muted">From</span>
          {plan.sources.map((id, i) => (
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
      ) : null}
    </div>
  );
}

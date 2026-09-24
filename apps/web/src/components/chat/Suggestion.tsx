"use client";

import { motion } from "motion/react";
import { Check, Clock, ListChecks, MapPin, PencilSimple, Sparkle, X } from "@phosphor-icons/react";
import { firstName, formatWhen, type Decision, type Task } from "@/lib/chat";

/**
 * What Lynk spotted, shown right under the message it came from: a plan to
 * save or a to-do to accept. Nothing is kept until someone taps Save, and
 * Dismiss is one tap too (roadmap: suggestions, never automatic actions).
 */
export function SuggestionCard({
  plan,
  task,
  onSave,
  onDismiss,
  onEdit,
}: {
  plan?: Decision;
  task?: Task;
  onSave: () => void;
  onDismiss: () => void;
  onEdit?: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="relative my-2 ml-[52px] max-w-md overflow-hidden rounded-2xl border border-accent/40 bg-surface p-3.5 shadow-soft"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,color-mix(in_oklab,var(--accent)_14%,transparent)_50%,transparent_70%)]"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 1.4, ease: "easeInOut", delay: 0.2 }}
      />
      <p className="relative flex items-center gap-1.5 text-[12px] font-semibold text-accent-ink">
        <Sparkle size={13} weight="fill" aria-hidden />
        {plan ? "Save this plan?" : "Add to your to-dos?"}
      </p>
      {plan ? (
        <>
          <p className="relative mt-1 font-semibold">{plan.title}</p>
          <p className="relative mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock size={13} aria-hidden /> {formatWhen(plan)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} aria-hidden /> {plan.where ?? "Place still open"}
            </span>
          </p>
        </>
      ) : task ? (
        <>
          <p className="relative mt-1 flex items-center gap-1.5 font-semibold">
            <ListChecks size={16} className="shrink-0 text-accent-ink" aria-hidden /> {task.title}
          </p>
          <p className="relative mt-1 text-[13px] text-muted">
            {task.assignee === "me" ? "For you" : `For ${firstName(task.assignee)}`}, {task.due}
          </p>
        </>
      ) : null}
      <div className="relative mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent px-3 text-[13px] font-medium text-on-accent active:scale-[0.97]"
        >
          <Check size={14} weight="bold" /> Save
        </button>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] font-medium hover:bg-surface-2">
            <PencilSimple size={14} /> Edit
          </button>
        ) : null}
        <button type="button" onClick={onDismiss} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted hover:bg-surface-2 hover:text-ink">
          <X size={14} /> Dismiss
        </button>
      </div>
    </motion.div>
  );
}

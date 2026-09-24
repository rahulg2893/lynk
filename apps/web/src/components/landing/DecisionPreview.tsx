"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Check, Sparkle, X } from "@phosphor-icons/react";
import { Avatar } from "@/components/chat/primitives";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { MOTION } from "@/lib/motion";

const LINES = [
  { id: "amara", name: "Amara", text: "Saturday morning works for me" },
  { id: "tomas", name: "Tomás", text: "Sunday's better, but I can do Saturday" },
  { id: "jonas", name: "Jonas", text: "Saturday 10am at Boulder Barn then?" },
  { id: "amara", name: "Amara", text: "Perfect, see you all there 🧗" },
];

type State = "proposed" | "confirmed" | "dismissed";

/**
 * The hero's product preview: a real, working plan card. Lynk spots the plan
 * in the chat, and it is only saved when someone confirms it.
 */
export function DecisionPreview() {
  const [state, setState] = useState<State>("proposed");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // Plays once: the conversation arrives, then the plan is spotted.
  const play = useInView(ref, { once: true, margin: "0px 0px -10% 0px" }) || reduce;

  return (
    <div ref={ref} className="w-full overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-sm font-semibold">
          Weekend climbers
        </p>
        <p className="text-[12px] text-muted">4 people</p>
      </div>

      <div className="relative px-5 pt-4 pb-2">
        <div aria-hidden className="absolute inset-y-0 left-[35px] border-l border-line" />
        <ul className="grid gap-3">
          {LINES.map((line, i) => (
            <motion.li
              key={i}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={play ? { opacity: 1, y: 0 } : undefined}
              transition={{ ...MOTION.item, delay: 0.3 + i * 0.45 }}
              className="relative grid grid-cols-[32px_1fr] gap-3"
            >
              <span className="rounded-[11px] bg-surface p-0.5">
                <Avatar id={line.id} name={line.name} size={28} />
              </span>
              <p className="text-[14px] leading-snug">
                <span className="block text-[12px] font-semibold">{line.name}</span>
                {line.text}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>

      <motion.div
        className="p-3"
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={play ? { opacity: 1, y: 0 } : undefined}
        transition={{ ...MOTION.item, delay: 0.3 + LINES.length * 0.45 + 0.2 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {state === "dismissed" ? (
            <motion.div
              key="dismissed"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted"
            >
              Dismissed. Nothing was saved.
              <button type="button" onClick={() => setState("proposed")} className="font-medium text-ink underline-offset-2 hover:underline">
                Undo
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="card"
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={MOTION.item}
              className={[
                "rounded-2xl border p-4",
                state === "confirmed" ? "border-line bg-surface-2" : "border-line bg-bg",
              ].join(" ")}
            >
              <p className="flex items-center gap-1.5 text-[12px] font-semibold">
                {state === "confirmed" ? (
                  <>
                    <Check size={13} weight="bold" className="text-positive" /> Plan saved
                  </>
                ) : (
                  <>
                    <Sparkle size={13} weight="fill" className="text-accent-ink" /> Plan spotted
                  </>
                )}
              </p>
              <p className="mt-2 text-lg leading-tight font-semibold tracking-tight">Climbing, Saturday 10am</p>
              <p className="mt-1 text-[13px] text-muted">
                Boulder Barn with Amara, Tomás and Jonas. Everyone in the chat sees it once you save it.
              </p>
              {state === "proposed" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setState("confirmed")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-sm font-medium text-bg transition-transform active:scale-[0.98]"
                  >
                    <Check size={15} weight="bold" /> Save plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setState("dismissed")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted hover:text-ink"
                  >
                    <X size={15} /> Dismiss
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setState("proposed")}
                  className="mt-3 text-sm font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  Reset demo
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

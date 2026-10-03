"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { BellRinging, CalendarBlank, CheckSquare, PushPin } from "@phosphor-icons/react";
import { Avatar } from "@/components/chat/primitives";
import { MOTION } from "@/lib/motion";

const GOING = [
  { id: "amara", name: "Amara" },
  { id: "jonas", name: "Jonas" },
  { id: "me", name: "You" },
];

/**
 * The "Getting there" chapter: a working Up next card. The plan, who's going,
 * a pinned address and a to-do; "Ask Tomás" posts the nudge, and the
 * reminder slides in once the card is in view.
 */
export function UpNextPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const [asked, setAsked] = useState(false);

  return (
    <div ref={ref} className="relative w-full">
      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.96 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 1.1 }}
        className="relative z-10 mb-3 ml-auto flex w-[92%] items-center gap-3 rounded-2xl border border-line bg-surface/90 px-4 py-3 shadow-soft backdrop-blur md:absolute md:-top-7 md:-right-6 md:mb-0 md:w-80"
        role="img"
        aria-label="Reminder: Climbing at Boulder Barn in 1 hour"
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-accent text-on-accent">
          <BellRinging size={16} weight="fill" aria-hidden />
        </span>
        <span className="min-w-0 text-[13px]">
          <span className="block truncate font-semibold">Climbing at Boulder Barn in 1 hour</span>
          <span className="block truncate text-muted">Boulder Barn · 3 going · Weekend climbers</span>
        </span>
      </motion.div>
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
        <div className="flex items-center gap-3 border-b border-line bg-surface-2/60 px-5 py-3">
          <span className="inline-flex size-8 items-center justify-center rounded-[10px] bg-accent-soft text-accent-ink">
            <CalendarBlank size={18} weight="bold" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">Climbing at Boulder Barn</span>
            <span className="block truncate text-[12px] text-muted">Sat 10:00 · 3 going · 1 to-do · 1 pinned</span>
          </span>
        </div>

        <div className="grid gap-3 p-4">
          <div className="rounded-2xl border border-line bg-bg p-4">
            <p className="text-[12px] font-semibold text-muted">Up next</p>
            <p className="mt-1 text-lg leading-tight font-semibold tracking-tight">Climbing, Saturday 10am</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex -space-x-1.5" aria-hidden>
                {GOING.map((p) => (
                  <span key={p.id} className="inline-flex rounded-[8px] ring-2 ring-bg">
                    <Avatar id={p.id} name={p.name} size={22} />
                  </span>
                ))}
              </span>
              <p className="text-[13px] text-muted">Amara, Jonas and you are going · Tomás hasn&apos;t answered</p>
            </div>
            <button
              type="button"
              disabled={asked}
              onClick={() => setAsked(true)}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              <BellRinging size={15} aria-hidden /> {asked ? "Asked" : "Ask Tomás"}
            </button>
          </div>

          <AnimatePresence>
            {asked ? (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={MOTION.item}
                className="w-fit max-w-[90%] justify-self-end rounded-2xl rounded-br-md bg-accent-soft px-3.5 py-2.5 text-[14px]"
              >
                Still need to hear from Tomás: are you in for Climbing, Sat 10:00?
              </motion.p>
            ) : null}
          </AnimatePresence>

          <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-3">
            <PushPin size={16} weight="fill" className="shrink-0 text-accent-ink" aria-hidden />
            <p className="min-w-0 text-[14px]">
              <span className="block text-[12px] text-muted">Pinned by Jonas</span>
              Boulder Barn, 12 Mill Lane. Gate code 4471
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-3">
            <CheckSquare size={16} weight="bold" className="shrink-0 text-accent-ink" aria-hidden />
            <p className="min-w-0 text-[14px]">
              Bring the spare chalk bag
              <span className="block text-[12px] text-muted">You, this weekend</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

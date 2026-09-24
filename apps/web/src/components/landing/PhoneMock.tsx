"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { CaretLeft, Check, Sparkle } from "@phosphor-icons/react";
import { Avatar, TypingDots } from "@/components/chat/primitives";

const SCRIPT = [
  { id: "amara", name: "Amara", text: "Saturday morning works for me" },
  { id: "tomas", name: "Tomás", text: "Sunday's better, but I can do Saturday" },
  { id: "jonas", name: "Jonas", text: "Saturday 10am at Boulder Barn?" },
  { id: "amara", name: "Amara", text: "Perfect. See you all there" },
];

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

/**
 * An iPhone-shaped frame playing the product's story once: the group talks,
 * someone types, and Lynk spots the plan. The Save button really works.
 */
export function PhoneMock({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const [shown, setShown] = useState(0);
  const [saved, setSaved] = useState(false);
  const count = shown;
  const typing = inView && shown < SCRIPT.length;
  const spotted = count >= SCRIPT.length;

  useEffect(() => {
    if (!inView || shown >= SCRIPT.length) return;
    const t = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 700 : 1150);
    return () => window.clearTimeout(t);
  }, [inView, shown]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Frame */}
      <div className="relative aspect-[9/19.5] w-full rounded-[3rem] bg-[#0b0c10] p-[10px] shadow-[0_40px_120px_-20px_rgb(0_40_120/0.55),inset_0_0_0_1.5px_rgb(255_255_255/0.12)]">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2.4rem] bg-[#f5f5f7] text-[#1d1d1f]">
          {/* Dynamic island */}
          <div className="absolute top-2.5 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold tabular-nums">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3.5 rounded-[3px] border border-current" />
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 border-b border-black/5 px-3 pb-2.5">
            <CaretLeft size={16} className="text-[#0066cc]" aria-hidden />
            <span className="inline-flex size-8 items-center justify-center rounded-[10px] bg-linear-to-b from-[#707075] to-[#4d4d52] text-[11px] font-semibold text-white">
              WC
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold">Weekend climbers</span>
              <span className="block text-[10px] text-[#6e6e73]">{typing ? `${SCRIPT[Math.min(count, SCRIPT.length - 1)].name} is typing` : "4 members"}</span>
            </span>
          </div>

          <ul className="flex flex-1 flex-col justify-end gap-2 px-3 pb-3">
            <AnimatePresence initial={false}>
              {SCRIPT.slice(0, count).map((m, i) => (
                <motion.li
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={SPRING}
                  className="flex items-end gap-1.5"
                >
                  <Avatar id={m.id} name={m.name} size={22} />
                  <p className="max-w-[80%] rounded-2xl rounded-bl-md bg-white px-2.5 py-1.5 text-[12px] leading-snug shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
                    <span className="block text-[10px] font-semibold text-[#6e6e73]">{m.name}</span>
                    {m.text}
                  </p>
                </motion.li>
              ))}
              {typing ? (
                <motion.li
                  key="typing"
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={SPRING}
                  className="ml-7 inline-flex w-fit rounded-2xl bg-white px-3 py-2 text-[#6e6e73] shadow-[0_1px_2px_rgb(0_0_0/0.06)]"
                >
                  <TypingDots />
                </motion.li>
              ) : null}
              {spotted ? (
                <motion.li
                  key="plan"
                  layout
                  initial={{ opacity: 0, y: 40, scale: 0.9, rotateX: 25 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.45 }}
                  className="mt-1 rounded-2xl border border-black/5 bg-white p-3 shadow-[0_10px_30px_-10px_rgb(0_60_160/0.35)]"
                >
                  <p className="flex items-center gap-1 text-[10px] font-semibold text-[#6e6e73]">
                    {saved ? (
                      <>
                        <Check size={11} weight="bold" className="text-[#248a3d]" /> Plan saved
                      </>
                    ) : (
                      <>
                        <Sparkle size={11} weight="fill" className="text-[#0066cc]" /> Plan spotted
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-[14px] font-semibold tracking-tight">Climbing, Saturday 10am</p>
                  <p className="text-[11px] text-[#6e6e73]">Boulder Barn · 4 going</p>
                  <motion.button
                    type="button"
                    layout
                    onClick={() => setSaved((s) => !s)}
                    whileTap={{ scale: 0.94 }}
                    className={`mt-2 inline-flex h-7 items-center gap-1 rounded-full px-3 text-[11px] font-semibold ${saved ? "bg-[#e8f1fc] text-[#0066cc]" : "bg-[#0071e3] text-white"}`}
                  >
                    {saved ? <Check size={11} weight="bold" aria-hidden /> : null}
                    {saved ? "Saved for everyone" : "Save plan"}
                  </motion.button>
                </motion.li>
              ) : null}
            </AnimatePresence>
          </ul>

          <div className="mx-3 mb-4 flex h-9 items-center rounded-full bg-white px-3 text-[11px] text-[#8e8e93] shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
            Message Weekend climbers
          </div>
        </div>
      </div>
    </div>
  );
}

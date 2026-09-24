"use client";

import { motion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";

const ROW_A = ["Plans", "Shared lists", "Birthdays", "Side chats", "Voice notes", "Find it again", "Catch-up", "End-to-end encrypted"];
const ROW_B = ["Families", "Flatmates", "Climbing clubs", "Book clubs", "Road trips", "Group gifts", "Wedding party", "Five-a-side"];

/**
 * Two lines of words that move only when you scroll, in opposite directions,
 * and lean into the scroll's speed on a spring. Nothing moves on its own.
 */
export function VelocityMarquee() {
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const skew = useTransform(velocity, [-2500, 2500], [10, -10]);
  const xa = useTransform(scrollY, (v) => `${-((v * 0.06) % 50)}%`);
  const xb = useTransform(scrollY, (v) => `${-50 + ((v * 0.06) % 50)}%`);

  const row = (words: string[], x: typeof xa, muted: boolean) => (
    <motion.div className="flex w-max gap-10 whitespace-nowrap will-change-transform" style={{ x, skewX: skew }}>
      {[0, 1].map((copy) => (
        <span key={copy} className="flex gap-10" aria-hidden={copy === 1}>
          {words.map((w) => (
            <span key={w} className={`flex items-center gap-10 text-[clamp(2.4rem,6vw,5rem)] leading-none font-semibold tracking-tight ${muted ? "text-transparent [-webkit-text-stroke:1.5px_var(--line)]" : ""}`}>
              {w}
              <span className="inline-block size-3 rounded-full bg-accent" aria-hidden />
            </span>
          ))}
        </span>
      ))}
    </motion.div>
  );

  return (
    <section aria-label="What Lynk is for" className="overflow-hidden border-y border-line bg-bg py-14 md:py-20">
      <div className="grid gap-6">
        {row(ROW_A, xa, false)}
        {row(ROW_B, xb, true)}
      </div>
    </section>
  );
}

"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { Magnetic } from "@/components/motion/physics";

/**
 * The closing moment: the two rings from the logo drift in from either side
 * as you scroll and link together, the brand's meaning in one gesture.
 * They're drawn in the same coordinates as the logo, so the finished state
 * is exactly the mark, blue over silver at the top crossing.
 */
export function LinkUp() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center 55%"] });
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 16, mass: 1.2 });
  const ax = useTransform(p, [0, 1], [-26, 0]);
  const bx = useTransform(p, [0, 1], [26, 0]);
  const spin = useTransform(p, [0, 1], [-40, 0]);
  const spinB = useTransform(p, [0, 1], [40, 0]);
  const linked = useTransform(p, [0.9, 1], [0, 1]);
  const glow = useTransform(p, [0.6, 1], [0, 1]);

  return (
    <section ref={ref} className="stage-dark relative isolate overflow-hidden px-5 py-28 md:px-8 md:py-40">
      <motion.div
        aria-hidden
        style={{ opacity: glow }}
        className="absolute inset-0 -z-10 bg-[radial-gradient(45%_50%_at_50%_42%,rgb(47_123_255/0.35),transparent_70%)]"
      />
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <svg viewBox="0 0 46 34" className="h-auto w-[min(62vw,22rem)] overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="lu-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6aa8ff" />
              <stop offset="1" stopColor="#1f5fe0" />
            </linearGradient>
            <linearGradient id="lu-b" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#aebcd6" />
            </linearGradient>
            <clipPath id="lu-over">
              <rect x="19" y="0" width="15" height="16" />
            </clipPath>
          </defs>
          <motion.g style={{ x: ax, rotate: spin, originX: "16px", originY: "15px" }}>
            <circle cx="16" cy="15" r="10" fill="none" stroke="url(#lu-a)" strokeWidth="5" />
          </motion.g>
          <motion.g style={{ x: bx, rotate: spinB, originX: "29px", originY: "19px" }}>
            <circle cx="29" cy="19" r="10" fill="none" stroke="url(#lu-b)" strokeWidth="5" />
          </motion.g>
          {/* Once they meet, the blue ring passes over the silver one at the top. */}
          <motion.circle
            cx="16"
            cy="15"
            r="10"
            fill="none"
            stroke="url(#lu-a)"
            strokeWidth="5"
            clipPath="url(#lu-over)"
            style={{ opacity: linked }}
          />
        </svg>

        <h2 className="mt-14 max-w-[16ch] text-[clamp(2.6rem,6vw,5rem)] leading-[1.02] text-balance">Bring your people over.</h2>
        <p className="mt-5 max-w-[42ch] text-lg text-white/70">
          Start a chat, make a group, share your link. Plans take care of themselves from there.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Magnetic>
            <Link
              href="/sign-up"
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-white px-8 text-[16px] font-medium text-[#0b0c10] shadow-[0_10px_40px_-10px_rgb(90_160_255/0.6)] active:scale-[0.97]"
            >
              Create your account
              <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Magnetic>
          <Link href="/sign-in" className="inline-flex h-14 items-center rounded-full px-6 text-[16px] font-medium text-white/85 hover:bg-white/10">
            I already have one
          </Link>
        </div>
      </div>
    </section>
  );
}

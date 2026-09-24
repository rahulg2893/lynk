"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, type SpringOptions } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Soft, weighty springs for pointer-driven motion. */
export const SPRING_SOFT: SpringOptions = { stiffness: 150, damping: 15, mass: 0.6 };
export const SPRING_LAZY: SpringOptions = { stiffness: 60, damping: 20, mass: 1 };

/**
 * Pulls its child toward the pointer while hovered, then springs back.
 * Used on primary buttons so they feel physical, not flat.
 */
export function Magnetic({ children, strength = 0.35, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), SPRING_SOFT);
  const y = useSpring(useMotionValue(0), SPRING_SOFT);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * A headline that rises in word by word on a spring, each word sharpening
 * out of a slight blur. Screen readers get the whole sentence at once.
 */
export function SplitWords({
  text,
  className = "",
  delay = 0,
  stagger = 0.06,
  wordClassName = "",
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Per-word classes, e.g. gradient text (background-clip can't span transformed words). */
  wordClassName?: string;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  if (reduce) return <span className={`${className} ${wordClassName}`}>{text}</span>;
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className={`inline-block ${wordClassName}`}
              initial={{ y: "105%", opacity: 0, filter: "blur(10px)" }}
              animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.9, delay: delay + i * stagger }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </span>
  );
}

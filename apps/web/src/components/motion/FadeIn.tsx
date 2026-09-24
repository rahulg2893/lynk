"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { MOTION } from "@/lib/motion";

/** A short fade and rise. Plays on mount by default, or once in view. */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 12,
  inView = false,
}: {
  children: ReactNode;
  className?: string;
  /** Seconds. */
  delay?: number;
  y?: number;
  inView?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const shown = { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      {...(inView
        ? { whileInView: shown, viewport: { once: true, margin: "0px 0px -15% 0px" } }
        : { animate: shown })}
      transition={{ ...MOTION.fade, delay }}
    >
      {children}
    </motion.div>
  );
}

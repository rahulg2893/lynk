import type { Transition } from "motion/react";

/** Two transitions for the whole product: UI items and content fades. */
export const MOTION = {
  /** Messages, list rows, pills: quick and settled. */
  item: { type: "spring", stiffness: 420, damping: 36, mass: 1 } as Transition,
  /** Landing content entering on load or in view. */
  fade: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } as Transition,
};

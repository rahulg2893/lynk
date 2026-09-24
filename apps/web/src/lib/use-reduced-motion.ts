"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/**
 * Hydration-safe reduced-motion flag. The server cannot know the viewer's
 * setting, so the server render and the first client render both report
 * `false` and the markup matches; React then switches to the real value.
 * Motion's own useReducedMotion reads it during the first render, which makes
 * the markup differ for anyone with Reduce motion turned on.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

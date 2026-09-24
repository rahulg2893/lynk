"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY as KEY } from "./theme-script";

export type ThemeChoice = "system" | "light" | "dark";


const listeners = new Set<() => void>();

function read(): ThemeChoice {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
}

export function setTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    // Storage can be blocked; the choice still applies for this visit.
  }
  listeners.forEach((fn) => fn());
}

/** The current choice; "system" during server rendering. */
export function useTheme(): ThemeChoice {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    read,
    () => "system",
  );
}

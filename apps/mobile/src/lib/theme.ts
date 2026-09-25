import { useColorScheme } from "react-native";
import { useAccount } from "./account";

/**
 * The web design system (design-system/lynk/MASTER.md) as native tokens:
 * Apple system greys, one blue accent with a fill and a text tone, and a red
 * kept for destructive actions only.
 */
export const palette = {
  light: {
    bg: "#f5f5f7",
    surface: "#ffffff",
    surface2: "#e8e8ed",
    ink: "#1d1d1f",
    muted: "#6e6e73",
    line: "#d2d2d7",
    accent: "#0071e3",
    accentInk: "#0066cc",
    accentSoft: "#e8f1fc",
    onAccent: "#ffffff",
    positive: "#34c759",
    danger: "#d70015",
    dangerInk: "#d70015",
    stage: "#1d1d1f",
    onStage: "#f5f5f7",
    onStageMuted: "#a1a1a6",
    scrim: "rgba(0,0,0,0.35)",
  },
  dark: {
    bg: "#0b0b0d",
    surface: "#1c1c1e",
    surface2: "#2c2c2e",
    ink: "#f5f5f7",
    muted: "#98989d",
    line: "#38383a",
    accent: "#0071e3",
    accentInk: "#2997ff",
    accentSoft: "#0f2a47",
    onAccent: "#ffffff",
    positive: "#30d158",
    danger: "#d70015",
    dangerInk: "#ff6961",
    stage: "#1c1c1e",
    onStage: "#f5f5f7",
    onStageMuted: "#a1a1a6",
    scrim: "rgba(0,0,0,0.55)",
  },
} as const;

export type Colors = { [K in keyof typeof palette.light]: string };

/** Light or dark, following Settings › Appearance ("Match system" by default). */
export function useScheme(): "light" | "dark" {
  const system = useColorScheme();
  const choice = useAccount()?.appearance ?? "system";
  if (choice === "light" || choice === "dark") return choice;
  return system === "dark" ? "dark" : "light";
}

export function useColors(): Colors {
  return palette[useScheme()];
}

/** Stable per-person avatar tones, matching the web's six tones. */
export const TONES = ["#5e8bff", "#34c3a0", "#f0a24b", "#e56b9f", "#8f7bff", "#4fb6e8"];

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

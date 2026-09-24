"use client";

import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { setTheme, useTheme, type ThemeChoice } from "@/lib/theme";
import { MOTION } from "@/lib/motion";

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Match system", icon: Desktop },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/**
 * Three-way appearance control. System is the default, so the site follows
 * the OS setting unless someone picks Light or Dark here (Apple advises
 * against app-only appearance switches; keeping System first honours that).
 */
export function ThemeToggle({
  id = "theme",
  vertical = false,
  className = "",
}: {
  id?: string;
  vertical?: boolean;
  className?: string;
}) {
  const theme = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={`relative inline-flex items-center rounded-full border border-line bg-surface-2/70 p-0.5 ${vertical ? "flex-col" : ""} ${className}`}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={[
              "relative inline-flex size-8 items-center justify-center rounded-full transition-colors",
              active ? "text-ink" : "text-muted hover:text-ink",
            ].join(" ")}
          >
            {active ? (
              <motion.span
                layoutId={`${id}-pill`}
                transition={MOTION.item}
                className="absolute inset-0 rounded-full bg-surface shadow-soft"
              />
            ) : null}
            <Icon size={16} weight={active ? "fill" : "regular"} className="relative" />
          </button>
        );
      })}
    </div>
  );
}

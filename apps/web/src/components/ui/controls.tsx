"use client";

import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "motion/react";
import { Check } from "@phosphor-icons/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { MOTION } from "@/lib/motion";

type Variant = "primary" | "ink" | "secondary" | "ghost" | "danger" | "danger-quiet";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // One accent-filled action per screen (MASTER.md: accent is for actions).
  primary: "bg-accent text-on-accent hover:brightness-110",
  ink: "bg-ink text-bg hover:opacity-90",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-110",
  "danger-quiet": "border border-line bg-surface text-danger-ink hover:bg-surface-2",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 gap-1.5 px-3.5 text-[13px]",
  md: "h-11 gap-2 px-5 text-[15px]",
  lg: "h-12 gap-2 px-6 text-[15px]",
};

/** Pill button classes, for links that look like buttons. */
export function buttonClass(variant: Variant = "secondary", size: Size = "md", className = "") {
  return [
    "inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap transition-[background-color,opacity,filter,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(" ");
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      aria-busy={loading || undefined}
      disabled={props.disabled || loading}
      className={buttonClass(variant, size, className)}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`animate-spin ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * An on/off switch. State shows in three ways, not colour alone: the knob's
 * position, the fill, and a check mark inside the knob when on.
 */
export function Switch({
  checked,
  onChange,
  disabled,
  label,
  labelledBy,
  describedBy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Use when there is no visible label to point at. */
  label?: string;
  labelledBy?: string;
  describedBy?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-45",
        checked ? "bg-accent" : "bg-ink/20",
      ].join(" ")}
    >
      <motion.span
        aria-hidden
        animate={{ x: checked ? 20 : 0 }}
        transition={reduce ? { duration: 0 } : MOTION.item}
        className="inline-flex size-[27px] items-center justify-center rounded-full bg-white text-accent shadow-[0_2px_6px_rgb(0_0_0/0.18)]"
      >
        {checked ? <Check size={13} weight="bold" /> : null}
      </motion.span>
    </button>
  );
}

/**
 * A labelled segmented control built on native radio inputs, so arrow keys,
 * form semantics and screen readers work without extra code.
 */
export function Segmented<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  name: string;
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const id = useId();
  return (
    <fieldset className={className}>
      <legend className="sr-only">{label}</legend>
      <div className="inline-flex w-full rounded-full bg-surface-2 p-1 sm:w-auto">
        {options.map((o) => {
          const active = o.value === value;
          const inputId = `${id}-${o.value}`;
          return (
            <div key={o.value} className="relative flex-1 sm:flex-none">
              <input
                id={inputId}
                type="radio"
                name={name}
                value={o.value}
                checked={active}
                onChange={() => onChange(o.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className={[
                  "relative flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                  active ? "text-ink" : "text-muted hover:text-ink",
                ].join(" ")}
              >
                {active ? (
                  <motion.span
                    layoutId={`${id}-pill`}
                    transition={reduce ? { duration: 0 } : MOTION.item}
                    className="absolute inset-0 rounded-full bg-surface shadow-soft"
                  />
                ) : null}
                {o.icon ? <span className="relative">{o.icon}</span> : null}
                <span className="relative">{o.label}</span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

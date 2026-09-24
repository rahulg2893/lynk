"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { WarningCircle } from "@phosphor-icons/react";

type Common = {
  id: string;
  label: string;
  /** Always-visible help under the field. */
  hint?: ReactNode;
  /** Replaces nothing: shown under the hint and linked with aria-describedby. */
  error?: string | null;
  /** Live status line, e.g. a username availability check. */
  status?: ReactNode;
  optional?: boolean;
};

function describedBy({ id, hint, error, status }: Common) {
  return [hint ? `${id}-hint` : null, status ? `${id}-status` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

function Messages({ id, hint, error, status }: Common) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 px-4 text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
      {status ? (
        <p id={`${id}-status`} className="mt-1.5 px-4 text-[13px]" aria-live="polite">
          {status}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 px-4 text-[13px] text-danger-ink">
          <WarningCircle size={15} weight="fill" aria-hidden className="shrink-0" />
          {error}
        </p>
      ) : null}
    </>
  );
}

function Label({ id, label, optional }: Pick<Common, "id" | "label" | "optional">) {
  return (
    <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between px-4 text-[13px] font-medium">
      {label}
      {optional ? <span className="font-normal text-muted">Optional</span> : null}
    </label>
  );
}

/** A labelled pill text field. Labels stay visible; placeholders are only hints. */
export const TextField = forwardRef<
  HTMLInputElement,
  Common & InputHTMLAttributes<HTMLInputElement> & { prefix?: string; trailing?: ReactNode }
>(function TextField({ id, label, hint, error, status, optional, prefix, trailing, className = "", ...props }, ref) {
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <div
        className={[
          "flex h-12 items-center rounded-full border bg-surface px-4 transition-[border-color,box-shadow] focus-within:ring-4",
          error ? "border-danger-ink focus-within:ring-danger/15" : "border-line focus-within:border-accent focus-within:ring-accent/15",
        ].join(" ")}
      >
        {prefix ? (
          <span className="pr-0.5 text-[15px] text-muted" aria-hidden>
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy({ id, label, hint, error, status })}
          className="h-full w-full min-w-0 bg-transparent text-[16px] outline-none placeholder:text-muted/80 focus-visible:outline-none"
          {...props}
        />
        {trailing}
      </div>
      <Messages id={id} label={label} hint={hint} error={error} status={status} />
    </div>
  );
});

export function TextArea({
  id,
  label,
  hint,
  error,
  status,
  optional,
  className = "",
  ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy({ id, label, hint, error, status })}
        className="block min-h-24 w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-[16px] leading-relaxed outline-none placeholder:text-muted/80 focus:border-accent focus:ring-4 focus:ring-accent/15 focus-visible:outline-none"
        {...props}
      />
      <Messages id={id} label={label} hint={hint} error={error} status={status} />
    </div>
  );
}

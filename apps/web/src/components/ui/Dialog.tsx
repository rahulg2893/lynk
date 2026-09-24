"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * A modal built on the native <dialog>: the browser traps focus, closes on
 * Escape and restores focus afterwards. One short task per dialog, always
 * with a way out (HIG `modality.md`).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the backdrop lands on the dialog element itself.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-line bg-surface p-0 text-ink shadow-soft backdrop:bg-black/35 backdrop:backdrop-blur-[2px] open:animate-[dialog-in_180ms_ease-out]"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <div id={descId} className="mt-2 text-[15px] leading-relaxed text-muted">
            {description}
          </div>
        ) : null}
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}

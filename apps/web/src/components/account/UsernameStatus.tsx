"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui/controls";
import type { UsernameState } from "@/lib/use-username";

/** The live line under a username field. Errors are rendered by the field itself. */
export function UsernameStatus({
  state,
  unchanged,
  onPick,
}: {
  state: UsernameState;
  unchanged?: boolean;
  onPick: (username: string) => void;
}) {
  if (unchanged || state.kind === "idle" || state.kind === "invalid") return null;
  if (state.kind === "checking") {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted">
        <Spinner size={13} /> Checking
      </span>
    );
  }
  if (state.kind === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 text-ink">
        <CheckCircle size={15} weight="fill" className="text-positive" aria-hidden /> Available
      </span>
    );
  }
  return (
    <span className="text-muted">
      Try{" "}
      {state.suggestions.map((s, i) => (
        <span key={s}>
          {i ? " or " : ""}
          <button type="button" onClick={() => onPick(s)} className="font-medium text-accent-ink hover:underline">
            @{s}
          </button>
        </span>
      ))}
    </span>
  );
}

/** Field-level error text for a username state. */
export function usernameError(state: UsernameState, unchanged?: boolean): string | null {
  if (unchanged) return null;
  if (state.kind === "invalid") return state.problem;
  if (state.kind === "taken") return "That username is taken.";
  return null;
}

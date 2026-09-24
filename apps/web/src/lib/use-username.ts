"use client";

import { useEffect, useState } from "react";
import { checkUsername, suggestUsernames, usernameProblem } from "./account";

export type UsernameState =
  | { kind: "idle" }
  | { kind: "invalid"; problem: string }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "taken"; suggestions: string[] };

/**
 * Live username validation while typing (HIG `text-fields.md`: validate a
 * user name before people move on). Format problems show at once; the
 * availability check waits for a short pause in typing.
 */
export function useUsername(value: string, current?: string): UsernameState {
  const username = value.trim();
  const problem = username ? usernameProblem(username) : null;
  const [result, setResult] = useState<{ for: string; free: boolean } | null>(null);

  useEffect(() => {
    if (!username || problem) return;
    let live = true;
    const t = window.setTimeout(() => {
      checkUsername(username, current).then((free) => {
        if (live) setResult({ for: username, free });
      });
    }, 300);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [username, problem, current]);

  if (!username) return { kind: "idle" };
  if (problem) return { kind: "invalid", problem };
  if (!result || result.for !== username) return { kind: "checking" };
  return result.free ? { kind: "available" } : { kind: "taken", suggestions: suggestUsernames(username) };
}

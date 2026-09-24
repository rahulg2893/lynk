"use client";

import { useMemo, useState } from "react";
import { Check, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Avatar } from "./primitives";
import { PEOPLE } from "@/lib/chat";

/**
 * Search people on Lynk by name or @username. Single mode picks one person;
 * multi mode toggles people and shows them as removable chips.
 */
export function PeoplePicker({
  mode,
  selected = [],
  exclude = [],
  onPick,
}: {
  mode: "single" | "multi";
  selected?: string[];
  exclude?: string[];
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const people = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    return Object.values(PEOPLE)
      .filter((p) => !exclude.includes(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, exclude]);

  return (
    <div>
      {mode === "multi" && selected.length ? (
        <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Selected">
          {selected.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onPick(id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-soft pr-2 pl-1 text-[13px] font-medium text-ink"
                aria-label={`Remove ${PEOPLE[id]?.name}`}
              >
                <Avatar id={id} name={PEOPLE[id]?.name ?? id} size={24} />
                {PEOPLE[id]?.name.split(" ")[0]}
                <X size={12} weight="bold" className="text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label htmlFor="people-search" className="sr-only">
        Search people by name or username
      </label>
      <div className="flex h-11 items-center gap-2 rounded-full border border-line bg-bg px-3.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
        <MagnifyingGlass size={17} className="shrink-0 text-muted" aria-hidden />
        <input
          id="people-search"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or @username"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      <ul className="mt-3 max-h-72 overflow-y-auto" aria-label="People on Lynk">
        {people.length === 0 ? (
          <li className="px-2 py-8 text-center text-[14px] text-muted">
            No one called “{query}” yet. Share your invite link instead.
          </li>
        ) : (
          people.map((p) => {
            const on = selected.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPick(p.id)}
                  aria-pressed={mode === "multi" ? on : undefined}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-surface-2"
                >
                  <Avatar id={p.id} name={p.name} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{p.name}</span>
                    <span className="block truncate text-[13px] text-muted">@{p.handle}</span>
                  </span>
                  {mode === "multi" ? (
                    <span
                      aria-hidden
                      className={`inline-flex size-6 items-center justify-center rounded-full border ${on ? "border-accent bg-accent text-on-accent" : "border-line text-transparent"}`}
                    >
                      <Check size={13} weight="bold" />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

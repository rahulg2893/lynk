"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, GitBranch, MagnifyingGlass, Sparkle, X } from "@phosphor-icons/react";
import { Avatar } from "./primitives";
import { formatListTime, messagePreview, personName, type Chat } from "@/lib/chat";
import { answer, search, SAMPLE_QUESTIONS, type Answer, type Hit } from "@/lib/find";

/**
 * "Find it again": ask in plain words, get an answer that cites the messages
 * it came from. With smart features off it falls back to plain matches.
 */
export function AskLynk({
  open,
  chats,
  now,
  smart,
  onClose,
  onOpen,
}: {
  open: boolean;
  chats: Chat[];
  now: number;
  /** Smart features switched on in Settings. */
  smart: boolean;
  onClose: () => void;
  onOpen: (threadId: string, messageId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState<{ q: string; result: Answer | null; hits: Hit[] } | null>(null);
  const [shown, setShown] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => input.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Reveal the answer a few characters at a time, like it's being written.
  const full = asked?.result?.parts.map((p) => p.text).join("") ?? "";
  useEffect(() => {
    if (!full || shown >= full.length) return;
    const t = window.setTimeout(() => setShown((n) => Math.min(full.length, n + 3)), 12);
    return () => window.clearTimeout(t);
  }, [full, shown]);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text) return;
    setQuery(text);
    setShown(0);
    setAsked({ q: text, result: smart ? answer(chats, text, now) : null, hits: search(chats, text, 6) });
  };

  const sources = asked?.result?.sources ?? asked?.hits ?? [];

  // Render the revealed text with citation buttons after each part.
  const parts = asked?.result?.parts ?? [];
  const pieces = parts.map((p, i) => {
    const start = parts.slice(0, i).reduce((n, q) => n + q.text.length, 0);
    const visible = p.text.slice(0, Math.max(0, shown - start));
    const done = shown >= start + p.text.length;
    return (
      <span key={i}>
        {visible}
        {done && p.source ? (
          <button
            type="button"
            onClick={() => {
              const h = sources[p.source! - 1];
              if (h) onOpen(h.threadId, h.message.id);
            }}
            className="mx-0.5 inline-flex h-5 min-w-5 -translate-y-0.5 items-center justify-center rounded-full bg-accent-soft px-1 align-middle text-[11px] font-semibold text-accent-ink hover:bg-accent hover:text-on-accent"
            aria-label={`Source ${p.source}`}
          >
            {p.source}
          </button>
        ) : null}
      </span>
    );
  });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-3 pt-[8vh] backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Ask Lynk"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-line/70 bg-surface shadow-soft"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(query);
              }}
              className="flex items-center gap-3 border-b border-line/70 px-4 py-3"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                {smart ? <Sparkle size={19} weight="fill" aria-hidden /> : <MagnifyingGlass size={19} aria-hidden />}
              </span>
              <label htmlFor="ask-lynk" className="sr-only">
                Ask about your chats
              </label>
              <input
                id="ask-lynk"
                ref={input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={smart ? "Ask about your chats, in plain words" : "Search your chats"}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={!query.trim()}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent disabled:bg-surface-2 disabled:text-muted"
                aria-label="Ask"
              >
                <ArrowUp size={17} weight="bold" />
              </button>
              <button type="button" onClick={onClose} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2" aria-label="Close">
                <X size={16} weight="bold" />
              </button>
            </form>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {!asked ? (
                <div>
                  <p className="text-[13px] font-semibold text-muted">Try asking</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SAMPLE_QUESTIONS.map((q, i) => (
                      <motion.button
                        key={q}
                        type="button"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        onClick={() => ask(q)}
                        className="rounded-full border border-line bg-bg px-3.5 py-2 text-left text-[14px] hover:border-accent hover:text-accent-ink"
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                  <p className="mt-5 text-[12px] leading-relaxed text-muted">
                    {smart
                      ? "Answers come from your chats on this device, since every chat is end-to-end encrypted, and each one links to the messages it came from."
                      : "Smart features are off in Settings, so this shows matching messages without an answer."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {smart ? (
                    <div className="rounded-2xl bg-bg p-4">
                      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                        <Sparkle size={13} weight="fill" className="text-accent-ink" aria-hidden /> Answer
                      </p>
                      {asked.result ? (
                        <p className="mt-2 text-[15px] leading-relaxed" aria-live="polite">
                          {pieces}
                          {shown < full.length ? <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent align-middle" /> : null}
                        </p>
                      ) : (
                        <p className="mt-2 text-[15px] text-muted">I couldn&apos;t find that in your chats. Try other words, or a name.</p>
                      )}
                    </div>
                  ) : null}

                  {sources.length ? (
                    <div>
                      <p className="text-[12px] font-semibold text-muted">{smart && asked.result ? "Sources" : "Matching messages"}</p>
                      <ol className="mt-2 grid gap-2">
                        {sources.map((h, i) => (
                          <motion.li key={`${h.threadId}-${h.message.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                            <button
                              type="button"
                              onClick={() => onOpen(h.threadId, h.message.id)}
                              className="flex w-full items-start gap-3 rounded-2xl border border-line p-3 text-left hover:border-accent"
                            >
                              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink">
                                {i + 1}
                              </span>
                              <Avatar id={h.message.from} name={personName(h.message.from)} size={28} />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-baseline gap-2 text-[12px] text-muted">
                                  <span className="truncate font-semibold text-ink">{h.message.from === "me" ? "You" : personName(h.message.from)}</span>
                                  <span className="flex min-w-0 items-center gap-1 truncate">
                                    {h.sideName ? <GitBranch size={11} aria-hidden /> : null}
                                    {h.sideName ?? h.chat.name}
                                  </span>
                                  <span className="ml-auto shrink-0 tabular-nums">{formatListTime(h.message.at, now)}</span>
                                </span>
                                <span className="mt-0.5 line-clamp-2 block text-[14px]">{messagePreview(h.message)}</span>
                              </span>
                            </button>
                          </motion.li>
                        ))}
                      </ol>
                    </div>
                  ) : !smart ? (
                    <p className="text-[15px] text-muted">No messages match &ldquo;{asked.q}&rdquo;.</p>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowUUpLeft,
  GitBranch,
  Info,
  PaperPlaneTilt,
  Paperclip,
  Phone,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Avatar, ChatAvatar, MessageBody, StatusNode, TypingDots } from "./primitives";
import {
  displayName,
  formatDayLabel,
  formatTime,
  personName,
  presence,
  type Chat,
  type Message,
} from "@/lib/chat";
import { MOTION } from "@/lib/motion";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🙌"];
const GROUP_GAP = 5 * 60_000;

/**
 * The conversation reads down one rail, like the timeline on the landing
 * page: avatars sit on the rail where someone starts talking, and my own
 * messages carry a delivery marker on it instead of ticks.
 */
export function Thread({
  chat,
  now,
  onSend,
  onDraft,
  onReact,
  onBack,
  onToggleInfo,
  highlightId,
}: {
  chat: Chat;
  now: number;
  onSend: (text: string, replyTo?: string) => void;
  onDraft: (text: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onBack: () => void;
  onToggleInfo: () => void;
  /** A message to scroll to and flash, e.g. from a decision's sources. */
  highlightId?: string | null;
}) {
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  // Touch screens have no hover, so tapping a message reveals its actions.
  const [activeId, setActiveId] = useState<string | null>(null);

  // Stay pinned to the newest message.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, chat.typing]);

  // Focus the composer for mouse and trackpad users only; on phones it would
  // pop the keyboard open the moment a chat is opened.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, []);

  // Grow the composer with its content. CSS field-sizing covers Chrome; this
  // covers Safari and Firefox, and shrinks it back after sending.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [chat.draft]);

  useEffect(() => {
    if (!highlightId) return;
    document.getElementById(`msg-${highlightId}`)?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [highlightId, reduce]);

  const send = () => {
    const text = chat.draft.trim();
    if (!text) return;
    onSend(text, replyTo?.id);
    setReplyTo(null);
    inputRef.current?.focus();
  };

  const byId = new Map(chat.messages.map((m) => [m.id, m]));

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-line px-3 py-3 md:px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink md:hidden"
          aria-label="Back to inbox"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          type="button"
          onClick={onToggleInfo}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ChatAvatar chat={chat} size={42} />
          <span className="min-w-0">
            <span className="block truncate text-lg leading-tight font-semibold tracking-tight">
              {displayName(chat)}
            </span>
            <span className={`block truncate text-[13px] ${chat.typing ? "text-accent-ink" : "text-muted"}`}>
              {presence(chat)}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-0.5 text-muted">
          {[
            { icon: Phone, label: "Voice call" },
            { icon: VideoCamera, label: "Video call" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-disabled
              title={`${label}s arrive in a later release`}
              className="hidden size-10 cursor-not-allowed items-center justify-center rounded-full opacity-50 sm:inline-flex"
            >
              <Icon size={20} />
              <span className="sr-only">{label} (coming soon)</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onToggleInfo}
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-2 hover:text-ink"
            aria-label="What this chat remembers"
          >
            <Info size={20} />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 pt-6 pb-40 md:px-6"
        aria-live="polite"
      >
        <div className="relative mx-auto max-w-3xl">
          {/* The rail */}
          <div aria-hidden className="absolute inset-y-0 left-[19px] border-l border-line" />

          {chat.messages.map((message, i) => {
            const prev = chat.messages[i - 1];
            const next = chat.messages[i + 1];
            const newDay =
              !prev || new Date(prev.at).toDateString() !== new Date(message.at).toDateString();
            const startsRun =
              newDay || !prev || prev.from !== message.from || message.at - prev.at > GROUP_GAP;
            const endsRun = !next || next.from !== message.from || next.at - message.at > GROUP_GAP;
            const mine = message.from === "me";
            const quoted = message.replyTo ? byId.get(message.replyTo) : undefined;

            return (
              <Fragment key={message.id}>
                {newDay ? (
                  <div className="relative grid grid-cols-[40px_1fr] items-center gap-3 py-4">
                    <span className="flex justify-center">
                      <span className="size-1.5 rounded-xs bg-muted" aria-hidden />
                    </span>
                    <p className="text-[12px] font-semibold text-muted">
                      {formatDayLabel(message.at, now)}
                    </p>
                  </div>
                ) : null}

                <motion.div
                  id={`msg-${message.id}`}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={MOTION.item}
                  onClick={(e) => {
                    if (!window.matchMedia("(hover: none)").matches) return;
                    if ((e.target as HTMLElement).closest("button")) return;
                    setActiveId((id) => (id === message.id ? null : message.id));
                  }}
                  className={`group relative grid scroll-mt-24 grid-cols-[40px_1fr] gap-3 rounded-2xl transition-colors duration-700 ${startsRun ? "pt-3" : "pt-1"} ${endsRun ? "pb-1" : ""} ${highlightId === message.id ? "bg-accent-soft/60" : ""}`}
                >
                  <div className="flex justify-center">
                    {mine ? (
                      <StatusNode
                        status={message.status ?? "read"}
                        className={startsRun ? "mt-8" : "mt-3"}
                      />
                    ) : startsRun ? (
                      <span className="rounded-[11px] bg-bg p-0.5">
                        <Avatar id={message.from} name={personName(message.from)} size={32} />
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 pr-2 md:pr-24">
                    {startsRun ? (
                      <p className="mb-1 flex items-baseline gap-2 text-[13px]">
                        <span className="font-semibold">{mine ? "You" : personName(message.from)}</span>
                        <span className="text-[12px] text-muted tabular-nums">
                          {formatTime(message.at)}
                        </span>
                      </p>
                    ) : null}
                    <MessageBody
                      mine={mine}
                      text={message.text}
                      quote={quoted ? { author: personName(quoted.from), text: quoted.text } : null}
                    />
                    {message.branch ? (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-xs text-muted">
                        <GitBranch size={13} className="text-accent-ink" aria-hidden />
                        <span className="font-medium text-ink">{message.branch.name}</span>
                        <span className="tabular-nums">side chat · {message.branch.count}</span>
                      </p>
                    ) : null}
                    {message.reactions?.length ? (
                      <div className="mt-1.5 flex gap-1">
                        {message.reactions.map((r) => (
                          <button
                            key={r.emoji}
                            type="button"
                            onClick={() => onReact(message.id, r.emoji)}
                            className={[
                              "inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs tabular-nums",
                              r.mine ? "border-accent/60 bg-accent-soft" : "border-line bg-surface",
                            ].join(" ")}
                            aria-label={`${r.emoji} ${r.count}${r.mine ? ", including you" : ""}`}
                          >
                            <span>{r.emoji}</span>
                            {r.count > 1 ? <span>{r.count}</span> : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Hover and keyboard actions */}
                  <div className={`absolute top-1 right-0 flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 shadow-soft transition-opacity group-hover:opacity-100 focus-within:opacity-100 ${activeId === message.id ? "opacity-100" : "pointer-events-none opacity-0 [@media(hover:hover)]:pointer-events-auto"}`}>
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          onReact(message.id, emoji);
                          setActiveId(null);
                        }}
                        className="inline-flex size-8 items-center justify-center rounded-full text-sm hover:bg-surface-2"
                        aria-label={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(message);
                        setActiveId(null);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                      aria-label="Reply"
                    >
                      <ArrowUUpLeft size={16} />
                    </button>
                  </div>
                </motion.div>
              </Fragment>
            );
          })}

          <AnimatePresence>
            {chat.typing ? (
              <motion.div
                key="typing"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={MOTION.item}
                className="relative grid grid-cols-[40px_1fr] items-center gap-3 pt-3"
              >
                <span className="flex justify-center">
                  <span className="rounded-[11px] bg-bg p-0.5">
                    <Avatar id={chat.typing} name={personName(chat.typing)} size={32} />
                  </span>
                </span>
                <span className="flex items-center gap-2 text-[13px] text-muted">
                  <TypingDots className="text-accent-ink" />
                  {personName(chat.typing).split(" ")[0]} is typing
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-bg via-bg/90 to-transparent px-3 pt-10 pb-4 md:px-6"
      >
        <div className="pointer-events-auto mx-auto max-w-3xl">
          <div className="rounded-3xl border border-line bg-surface p-1.5 shadow-soft transition-[border-color,box-shadow] duration-200 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
            {replyTo ? (
              <div className="mx-1.5 mt-1 mb-1.5 flex items-start gap-3 rounded-2xl bg-surface-2 px-3 py-2 text-sm">
                <ArrowUUpLeft size={16} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Replying to {personName(replyTo.from)}</p>
                  <p className="truncate text-muted">{replyTo.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-muted hover:text-ink"
                  aria-label="Cancel reply"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            ) : null}
            <div className="flex items-end gap-1.5">
              <button
                type="button"
                aria-disabled
                title="Attachments arrive with the backend"
                className="inline-flex size-10 shrink-0 cursor-not-allowed items-center justify-center rounded-2xl text-muted opacity-50"
              >
                <Paperclip size={20} />
                <span className="sr-only">Attach a file (coming soon)</span>
              </button>
              <label htmlFor="composer" className="sr-only">
                Message {chat.name}
              </label>
              <textarea
                id="composer"
                ref={inputRef}
                rows={1}
                value={chat.draft}
                onChange={(e) => onDraft(e.target.value)}
                onKeyDown={(e) => {
                  // On phones Enter adds a new line and the send button sends, as in
                  // other mobile chat apps. With a keyboard, Enter sends.
                  const touch = window.matchMedia("(pointer: coarse)").matches;
                  if (e.key === "Enter" && !e.shiftKey && !touch && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Message ${chat.kind === "dm" ? chat.name.split(" ")[0] : chat.name}`}
                className="field-sizing-content max-h-40 min-h-10 w-full resize-none bg-transparent px-1 py-2 text-[15px] leading-6 outline-none placeholder:text-muted focus-visible:outline-none"
              />
              <button
                type="submit"
                disabled={!chat.draft.trim()}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent transition-[transform,background-color] active:scale-95 disabled:bg-surface-2 disabled:text-muted"
                aria-label="Send message"
              >
                <PaperPlaneTilt size={18} weight="fill" />
              </button>
            </div>
          </div>
          <p className="mt-2 hidden text-center text-xs text-muted md:block">
            Enter to send, Shift + Enter for a new line
          </p>
        </div>
      </form>
    </div>
  );
}

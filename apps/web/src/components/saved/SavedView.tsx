"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookmarkSimple, GitBranch, MagnifyingGlass, Paperclip } from "@phosphor-icons/react";
import { PageShell } from "@/components/app/PageShell";
import { Avatar } from "@/components/chat/primitives";
import { formatListTime, messagePreview, personName, sideChatId, type Chat, type Message } from "@/lib/chat";
import { updateThread, toggleSaved } from "@/lib/chat-ops";
import { useStoredChats } from "@/lib/chat-store";
import { MOTION } from "@/lib/motion";

type Entry = { chat: Chat; threadId: string; sideName?: string; message: Message };

/** Everything you bookmarked, newest first, each one a tap away from where it was said. */
export function SavedView() {
  const { chats, loaded, now, change } = useStoredChats();
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const all: Entry[] = chats.flatMap((chat) => [
      ...chat.messages.filter((m) => m.saved && !m.deleted).map((message) => ({ chat, threadId: chat.id, message })),
      ...(chat.sideChats ?? []).flatMap((side) =>
        side.messages
          .filter((m) => m.saved && !m.deleted)
          .map((message) => ({ chat, threadId: sideChatId(chat.id, side.id), sideName: side.name, message })),
      ),
    ]);
    const q = query.trim().toLowerCase();
    return all
      .filter((e) => !q || e.message.text.toLowerCase().includes(q) || e.chat.name.toLowerCase().includes(q))
      .sort((a, b) => b.message.at - a.message.at);
  }, [chats, query]);

  const total = useMemo(() => chats.reduce((n, c) => n + c.messages.filter((m) => m.saved).length + (c.sideChats ?? []).reduce((k, s) => k + s.messages.filter((m) => m.saved).length, 0), 0), [chats]);

  return (
    <PageShell title="Saved" back={{ href: "/app", label: "Chats" }}>
      <p className="mt-2 text-[15px] text-muted">Messages you bookmarked, from every chat. Only you can see what you save.</p>

      {total > 3 ? (
        <div className="mt-6 flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          <MagnifyingGlass size={17} className="shrink-0 text-muted" aria-hidden />
          <label htmlFor="saved-search" className="sr-only">
            Search saved messages
          </label>
          <input
            id="saved-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
        </div>
      ) : null}

      {!loaded ? (
        <div className="mt-8 grid gap-3" aria-label="Loading saved messages">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-surface-2" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <motion.span
            initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 16 }}
            className="inline-flex size-16 items-center justify-center rounded-3xl bg-accent-soft text-accent-ink"
          >
            <BookmarkSimple size={30} weight="fill" aria-hidden />
          </motion.span>
          <h2 className="mt-5 text-xl font-semibold">Nothing saved yet</h2>
          <p className="mt-1.5 max-w-[36ch] text-[15px] text-muted">
            Hover a message (or tap it on a phone) and choose the bookmark to keep it here: addresses, recipes, that link you&apos;ll need later.
          </p>
          <Link href="/app" className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-5 text-[15px] font-medium text-on-accent">
            Go to chats
          </Link>
        </div>
      ) : entries.length === 0 ? (
        <p className="mt-10 text-center text-muted">Nothing saved matches &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          <AnimatePresence initial={false}>
            {entries.map((e, i) => (
              <motion.li
                key={`${e.threadId}-${e.message.id}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                transition={{ ...MOTION.item, delay: Math.min(i, 8) * 0.03 }}
                className="group rounded-3xl border border-line bg-surface p-4 shadow-soft"
              >
                <div className="flex items-center gap-2 text-[12px] text-muted">
                  <span className="truncate font-semibold text-ink">{e.chat.name}</span>
                  {e.sideName ? (
                    <span className="flex min-w-0 items-center gap-1 truncate">
                      <GitBranch size={12} className="shrink-0 text-accent-ink" aria-hidden /> {e.sideName}
                    </span>
                  ) : null}
                  <span className="ml-auto shrink-0 tabular-nums">{formatListTime(e.message.at, now)}</span>
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <Avatar id={e.message.from} name={personName(e.message.from)} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{e.message.from === "me" ? "You" : personName(e.message.from)}</p>
                    <p className="mt-0.5 text-[15px] leading-relaxed break-words">{messagePreview(e.message)}</p>
                    {e.message.attachments?.length ? (
                      <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
                        <Paperclip size={13} aria-hidden /> {e.message.attachments.length} attachment{e.message.attachments.length > 1 ? "s" : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/app?chat=${encodeURIComponent(e.threadId)}&m=${encodeURIComponent(e.message.id)}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-[13px] font-medium hover:bg-line"
                  >
                    Show in chat <ArrowRight size={14} weight="bold" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={() => change((all) => updateThread(all, e.threadId, (c) => toggleSaved(c, e.message.id)))}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    <BookmarkSimple size={15} weight="fill" className="text-accent-ink" aria-hidden /> Unsave
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </PageShell>
  );
}

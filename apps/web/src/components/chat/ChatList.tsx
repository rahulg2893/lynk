"use client";

import { useMemo, useState } from "react";
import { BellSlash, Command, MagnifyingGlass, NotePencil, PushPin, X } from "@phosphor-icons/react";
import { ChatAvatar, StatusNode } from "./primitives";
import { firstName, formatListTime, type Chat } from "@/lib/chat";

type Filter = "all" | "unread" | "groups";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "groups", label: "Groups" },
];

export function ChatList({
  chats,
  activeId,
  loaded,
  now,
  onSelect,
  onOpenPalette,
  onNewChat,
}: {
  chats: Chat[];
  activeId: string | null;
  loaded: boolean;
  now: number;
  onSelect: (id: string) => void;
  onOpenPalette: () => void;
  onNewChat: (tab: "chat" | "group" | "invite") => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { pinned, recent, total } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = [...chats]
      .sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0))
      .filter((c) => (filter === "unread" ? c.unread > 0 : filter === "groups" ? c.kind === "group" : true))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.messages.some((m) => m.text.toLowerCase().includes(q)),
      );
    return {
      pinned: matches.filter((c) => c.pinned),
      recent: matches.filter((c) => !c.pinned),
      total: matches.length,
    };
  }, [chats, query, filter]);

  const unreadTotal = chats.reduce((n, c) => n + (c.muted ? 0 : c.unread), 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-end justify-between gap-3 px-5 pt-6 pb-4">
        <div className="min-w-0">
          <h1 className="truncate text-3xl leading-none font-semibold tracking-tight">Chats</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {!loaded ? "Syncing" : unreadTotal ? `${unreadTotal} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenPalette}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 text-[13px] text-muted hover:text-ink"
            aria-label="Open command palette"
            aria-keyshortcuts="Meta+K Control+K"
          >
            <Command size={14} weight="bold" /> K
          </button>
          <button
            type="button"
            onClick={() => onNewChat("chat")}
            className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-on-accent active:scale-95"
            aria-label="New chat"
            title="New chat"
          >
            <NotePencil size={17} weight="bold" />
          </button>
        </div>
      </div>

      <div className="px-4">
        <label htmlFor="chat-search" className="sr-only">
          Search chats
        </label>
        <div className="flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-2 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          <MagnifyingGlass size={17} className="shrink-0 text-muted" aria-hidden />
          <input
            id="chat-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} className="text-muted hover:text-ink" aria-label="Clear filter">
              <X size={15} weight="bold" />
            </button>
          ) : null}
        </div>

        <div role="tablist" aria-label="Filter chats" className="mt-3 flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={[
                "h-8 rounded-full px-3 text-[13px] font-medium transition-colors",
                filter === f.value ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {!loaded ? (
          <ListSkeleton />
        ) : chats.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium">No chats yet</p>
            <p className="mt-1 text-sm text-muted">Start one, or share your invite link.</p>
            <button
              type="button"
              onClick={() => onNewChat("chat")}
              className="mt-4 inline-flex h-10 items-center rounded-full bg-accent px-4 text-[14px] font-medium text-on-accent"
            >
              Start a chat
            </button>
          </div>
        ) : total === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium">{query ? `Nothing matches "${query}"` : "Nothing here right now"}</p>
            <p className="mt-1 text-sm text-muted">
              {query ? "Press ⌘K to search inside messages." : "Switch the filter back to All."}
            </p>
          </div>
        ) : (
          <>
            <Section title="Pinned" chats={pinned} activeId={activeId} now={now} onSelect={onSelect} />
            <Section title="Recent" chats={recent} activeId={activeId} now={now} onSelect={onSelect} />
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  chats,
  activeId,
  now,
  onSelect,
}: {
  title: string;
  chats: Chat[];
  activeId: string | null;
  now: number;
  onSelect: (id: string) => void;
}) {
  if (!chats.length) return null;
  return (
    <section aria-label={title} className="mb-3">
      <h2 className="px-3 pt-2 pb-1.5 text-[12px] font-semibold text-muted">
        {title}
      </h2>
      <ul className="flex flex-col gap-0.5">
        {chats.map((chat) => (
          <li key={chat.id}>
            <Row chat={chat} active={chat.id === activeId} now={now} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Row({
  chat,
  active,
  now,
  onSelect,
}: {
  chat: Chat;
  active: boolean;
  now: number;
  onSelect: (id: string) => void;
}) {
  const last = chat.messages.at(-1);
  const mine = last?.from === "me";
  const who = !last ? "" : mine ? "You: " : chat.kind === "dm" ? "" : `${firstName(last.from)}: `;
  const hot = chat.unread > 0 && !chat.muted;

  return (
    <button
      type="button"
      onClick={() => onSelect(chat.id)}
      aria-current={active ? "true" : undefined}
      className={[
        "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
        active ? "border-line bg-surface shadow-soft" : "border-transparent hover:bg-surface-2/60",
      ].join(" ")}
    >
      <ChatAvatar chat={chat} size={40} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={`truncate ${hot ? "font-semibold" : "font-medium"}`}>{chat.name}</span>
          <span className="shrink-0 text-[12px] text-muted tabular-nums">
            {last ? formatListTime(last.at, now) : ""}
          </span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className={`flex min-w-0 items-center gap-1.5 text-sm ${hot ? "text-ink" : "text-muted"}`}>
            {chat.typing ? (
              <span className="text-accent-ink">{firstName(chat.typing)} is typing</span>
            ) : (
              <>
                {mine && last?.status ? <StatusNode status={last.status} className="shrink-0" /> : null}
                <span className="truncate">
                  {who}
                  {!last
                    ? "No messages yet"
                    : last.deleted
                      ? "Message deleted"
                      : last.text || attachmentSummary(last.attachments ?? [])}
                </span>
              </>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-muted">
            {chat.pinned ? <PushPin size={13} weight="fill" aria-label="Pinned" /> : null}
            {chat.muted ? <BellSlash size={14} aria-label="Muted" /> : null}
            {chat.mentions ? (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[12px] font-semibold text-bg"
                aria-label={`${chat.mentions} mention${chat.mentions > 1 ? "s" : ""}`}
              >
                @
              </span>
            ) : null}
            {chat.unread ? (
              <span
                className={[
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[12px] font-semibold tabular-nums",
                  chat.muted ? "bg-surface-2 text-muted" : "bg-accent text-on-accent",
                ].join(" ")}
                aria-label={`${chat.unread} unread`}
              >
                {chat.unread}
              </span>
            ) : null}
          </span>
        </span>
      </span>
    </button>
  );
}

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-0.5 pt-6" aria-label="Loading conversations">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
          <span className="size-10 shrink-0 animate-pulse rounded-[13px] bg-surface-2" />
          <span className="grid flex-1 gap-2">
            <span className="h-3.5 animate-pulse rounded-md bg-surface-2" style={{ width: `${55 + ((i * 17) % 30)}%` }} />
            <span className="h-3 animate-pulse rounded-md bg-surface-2" style={{ width: `${70 + ((i * 11) % 25)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** "Photo", "3 photos" or a file's name, for a message with no text. */
function attachmentSummary(items: { kind: string; name: string }[]) {
  const photos = items.filter((a) => a.kind === "image").length;
  if (photos) return photos === 1 ? "Photo" : `${photos} photos`;
  return items[0]?.name ?? "File";
}

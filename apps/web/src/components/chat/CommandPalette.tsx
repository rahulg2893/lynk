"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowBendDownLeft,
  ChatCircleDots,
  GearSix,
  GitBranch,
  Lightbulb,
  ListChecks,
  MagnifyingGlass,
  NotePencil,
  QrCode as QrIcon,
  UsersThree,
  Sparkle,
  CloudCheck,
  CloudSlash,
  SunHorizon,
  UserCircle,
} from "@phosphor-icons/react";
import { displayName, personName, type Chat } from "@/lib/chat";

export type PaletteAction =
  | { type: "open"; chatId: string }
  | { type: "message"; chatId: string; messageId: string }
  | { type: "catchup" }
  | { type: "panel"; tab: "decisions" | "tasks" }
  | { type: "go"; href: string }
  | { type: "new"; tab: "chat" | "group" | "invite" }
| { type: "offline" };

type Item = {
  id: string;
  group: "Actions" | "Chats" | "Messages";
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action?: PaletteAction;
  disabledReason?: string;
};

/**
 * ⌘K / Ctrl+K. Keyboard-first: type to filter, arrows to move, Enter to run,
 * Escape to close. Actions that need the backend are listed but disabled, with
 * the reason shown, so the palette never pretends.
 */
export function CommandPalette({
  open,
  chats,
  hasActive,
  online,
  onClose,
  onRun,
}: {
  open: boolean;
  chats: Chat[];
  hasActive: boolean;
  online: boolean;
  onClose: () => void;
  onRun: (action: PaletteAction) => void;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    // Remember where focus was, and hand it back when the palette closes.
    const previous = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const actions: Item[] = [
      { id: "new-chat", group: "Actions", label: "New chat", icon: <NotePencil size={18} />, action: { type: "new", tab: "chat" } },
      { id: "new-group", group: "Actions", label: "New group", icon: <UsersThree size={18} />, action: { type: "new", tab: "group" } },
      { id: "qr", group: "Actions", label: "Show my QR code", icon: <QrIcon size={18} />, action: { type: "new", tab: "invite" } },
      { id: "catchup", group: "Actions", label: "Catch me up", icon: <SunHorizon size={18} />, action: { type: "catchup" } },
      {
        id: "decisions",
        group: "Actions",
        label: "View plans",
        icon: <Lightbulb size={18} />,
        action: { type: "panel", tab: "decisions" },
        disabledReason: hasActive ? undefined : "Open a conversation first",
      },
      {
        id: "tasks",
        group: "Actions",
        label: "View to-dos",
        icon: <ListChecks size={18} />,
        action: { type: "panel", tab: "tasks" },
        disabledReason: hasActive ? undefined : "Open a conversation first",
      },
      { id: "settings", group: "Actions", label: "Settings", hint: "⌘,", icon: <GearSix size={18} />, action: { type: "go", href: "/app/settings" } },
      { id: "profile", group: "Actions", label: "Your profile", icon: <UserCircle size={18} />, action: { type: "go", href: "/app/profile" } },
      { id: "branch", group: "Actions", label: "Start a side chat", icon: <GitBranch size={18} />, disabledReason: "Arrives with the backend" },
      { id: "ask", group: "Actions", label: "Ask Lynk", icon: <Sparkle size={18} />, disabledReason: "Arrives with the AI phase" },
      {
        id: "offline",
        group: "Actions",
        label: online ? "Test offline mode" : "Reconnect",
        icon: online ? <CloudSlash size={18} /> : <CloudCheck size={18} />,
        action: { type: "offline" },
      },
    ];
    const convos: Item[] = chats.map((c) => ({
      id: `c-${c.id}`,
      group: "Chats",
      label: displayName(c),
      hint: c.kind === "dm" ? "Chat" : "Group",
      icon: <ChatCircleDots size={18} />,
      action: { type: "open", chatId: c.id },
    }));
    const messages: Item[] =
      q.length >= 2
        ? chats.flatMap((c) =>
            c.messages
              .filter((m) => m.text.toLowerCase().includes(q))
              .slice(0, 3)
              .map((m) => ({
                id: `m-${m.id}`,
                group: "Messages" as const,
                label: m.text,
                hint: `${personName(m.from)} in ${displayName(c)}`,
                icon: <MagnifyingGlass size={18} />,
                action: { type: "message" as const, chatId: c.id, messageId: m.id },
              })),
          )
        : [];
    const match = (i: Item) => !q || i.label.toLowerCase().includes(q) || i.hint?.toLowerCase().includes(q);
    return [...actions.filter(match), ...convos.filter(match), ...messages.slice(0, 8)];
  }, [chats, query, hasActive, online]);

  const safeIndex = Math.min(index, Math.max(0, items.length - 1));

  const run = (item: Item | undefined) => {
    if (!item || item.disabledReason || !item.action) return;
    onRun(item.action);
    setQuery("");
    setIndex(0);
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open ? (
    <motion.div
      key="palette"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-md"
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: -24, scale: 0.94, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.12 } }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <MagnifyingGlass size={18} className="text-muted" aria-hidden />
          <label htmlFor="palette-input" className="sr-only">
            Search chats, messages and actions
          </label>
          <input
            id="palette-input"
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(items[safeIndex]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[safeIndex] ? `pi-${items[safeIndex].id}` : undefined}
            placeholder="Search chats, messages and actions"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted focus-visible:outline-none"
          />
          <kbd className="rounded-md border border-line px-1.5 text-[12px] text-muted">Esc</kbd>
        </div>
        <ul id="palette-list" ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">No matches. Semantic search arrives with the AI phase.</li>
          ) : (
            items.map((item, i) => {
              const header = item.group !== lastGroup ? item.group : null;
              lastGroup = item.group;
              return (
                <li key={item.id} role="presentation">
                  {header ? (
                    <p className="px-3 pt-2 pb-1 text-[12px] font-semibold text-muted">{header}</p>
                  ) : null}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 32, delay: Math.min(i, 10) * 0.018 }}
                    id={`pi-${item.id}`}
                    role="option"
                    aria-selected={i === safeIndex}
                    aria-disabled={Boolean(item.disabledReason)}
                    onMouseMove={() => setIndex(i)}
                    onClick={() => run(item)}
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                      i === safeIndex ? "bg-surface-2" : "",
                      item.disabledReason ? "cursor-not-allowed opacity-55" : "",
                    ].join(" ")}
                  >
                    <span className="text-muted">{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px]">{item.label}</span>
                      {item.hint || item.disabledReason ? (
                        <span className="block truncate text-[12px] text-muted">{item.disabledReason ?? item.hint}</span>
                      ) : null}
                    </span>
                    {i === safeIndex && !item.disabledReason ? (
                      <ArrowBendDownLeft size={15} className="text-muted" aria-hidden />
                    ) : null}
                  </motion.div>
                </li>
              );
            })
          )}
        </ul>
      </motion.div>
    </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

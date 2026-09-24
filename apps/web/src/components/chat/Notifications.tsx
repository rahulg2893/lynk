"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bell, BellRinging, GearSix, X } from "@phosphor-icons/react";
import { ChatAvatar } from "./primitives";
import { Button } from "@/components/ui/controls";
import { firstName, formatListTime } from "@/lib/chat";
import { notificationText, type NotificationGroup } from "@/lib/notify";
import type { Account } from "@/lib/account";
import { MOTION } from "@/lib/motion";

/**
 * The bell in the chat list: a badge for chats with something new, and a
 * list with one row per chat so a busy group reads "and 6 more" instead of
 * filling the screen. Opening it marks everything as seen.
 */
export function NotificationsButton({
  groups,
  settings,
  now,
  permission,
  onOpenChat,
  onSeen,
  onEnable,
}: {
  groups: NotificationGroup[];
  settings: Account["notifications"];
  now: number;
  permission: NotificationPermission | "unsupported";
  onOpenChat: (chatId: string, messageId: string) => void;
  onSeen: () => void;
  onEnable: () => void;
}) {
  const [open, setOpen] = useState(false);
  // The chat list clips its overflow, so the list renders in a portal pinned under the bell.
  const [at, setAt] = useState({ top: 0, left: 0 });
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const unread = groups.filter((g) => g.unread).length;

  const close = () => {
    setOpen(false);
    onSeen();
  };

  // Outside click and Escape close the list.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!root.current?.contains(t) && !panel.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // close only reads stable setters and onSeen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={(e) => {
          if (open) return close();
          const r = e.currentTarget.getBoundingClientRect();
          const width = Math.min(352, window.innerWidth - 32);
          setAt({
            top: r.bottom + 8,
            left: Math.max(16, Math.min(r.left - 12, window.innerWidth - width - 16)),
          });
          setOpen(true);
        }}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        className={[
          "relative inline-flex size-9 items-center justify-center rounded-full border border-line transition-colors",
          open ? "bg-ink text-bg" : "bg-surface text-muted hover:text-ink",
        ].join(" ")}
      >
        <motion.span
          key={unread}
          animate={unread ? { rotate: [0, -16, 13, -8, 4, 0] } : undefined}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="inline-flex"
        >
          {unread ? <BellRinging size={17} weight="bold" /> : <Bell size={17} weight="bold" />}
        </motion.span>
        <AnimatePresence>
          {unread ? (
            <motion.span
              key={unread}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 16 }}
              className="absolute -top-1 -right-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-on-accent tabular-nums ring-2 ring-surface"
              aria-hidden
            >
              {unread}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </button>

      {typeof document === "undefined"
        ? null
        : createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  ref={panel}
                  id={panelId}
                  role="dialog"
                  aria-label="Notifications"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 480, damping: 34 }}
                  style={{
                    transformOrigin: "top right",
                    top: at.top,
                    left: at.left,
                  }}
                  className="glass fixed z-50 flex max-h-[min(34rem,calc(100dvh-8rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-line/70 shadow-soft"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
                    <h2 className="text-[15px] font-semibold">Notifications</h2>
                    <div className="flex items-center gap-0.5">
                      <Link
                        href="/app/settings/notifications"
                        className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                        aria-label="Notification settings"
                      >
                        <GearSix size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={close}
                        className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                        aria-label="Close notifications"
                      >
                        <X size={15} weight="bold" />
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                    {groups.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <p className="font-medium">Nothing new</p>
                        <p className="mt-1 text-[13px] text-muted">
                          Messages from your chats land here
                          {settings.groups === "mentions" ? ", and from groups when someone mentions you" : ""}.
                        </p>
                      </div>
                    ) : (
                      <ul className="flex flex-col gap-0.5">
                        {groups.map((g, i) => (
                          <motion.li
                            key={g.chat.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...MOTION.item, delay: i * 0.03 }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                close();
                                onOpenChat(g.chat.id, g.latest.id);
                              }}
                              className="flex w-full items-start gap-3 rounded-2xl px-2.5 py-2.5 text-left hover:bg-surface-2/70"
                            >
                              <ChatAvatar chat={g.chat} size={36} />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-baseline justify-between gap-2">
                                  <span className={`truncate text-[14px] ${g.unread ? "font-semibold" : "font-medium"}`}>
                                    {g.chat.name}
                                  </span>
                                  <span className="shrink-0 text-[12px] text-muted tabular-nums">{formatListTime(g.latest.at, now)}</span>
                                </span>
                                <span className={`mt-0.5 line-clamp-2 text-[13px] ${g.unread ? "text-ink" : "text-muted"}`}>
                                  {g.chat.kind === "group" ? `${firstName(g.latest.from)}: ` : ""}
                                  {notificationText(g.latest, settings)}
                                </span>
                                {g.count > 1 || g.mention ? (
                                  <span className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                                    {g.mention ? (
                                      <span className="inline-flex h-[18px] items-center rounded-full bg-ink px-1.5 text-[11px] font-semibold text-bg">
                                        @ you
                                      </span>
                                    ) : null}
                                    {g.count > 1 ? <span>and {g.count - 1} more</span> : null}
                                  </span>
                                ) : null}
                              </span>
                              {g.unread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="New" /> : null}
                            </button>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {permission === "default" ? (
                    <div className="flex items-center gap-3 border-t border-line/70 px-4 py-3">
                      <p className="min-w-0 flex-1 text-[13px] text-muted">Get alerts while Lynk is in the background.</p>
                      <Button variant="primary" size="sm" onClick={onEnable}>
                        Turn on
                      </Button>
                    </div>
                  ) : permission === "denied" ? (
                    <p className="border-t border-line/70 px-4 py-3 text-[13px] text-muted">
                      Your browser blocks alerts for Lynk. Allow them in the site settings to get them in the background.
                    </p>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )}
    </div>
  );
}

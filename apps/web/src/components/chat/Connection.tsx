"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BellRinging, CloudCheck, CloudSlash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/controls";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * A pill that drops in when the connection goes, says what happens to your
 * messages, and swaps to "Back online" (with what it's sending) when it
 * returns, then gets out of the way.
 */
export function ConnectionBanner({
  online,
  waiting,
  simulated,
  onReconnect,
}: {
  online: boolean;
  /** Messages sitting in the outbox. */
  waiting: number;
  /** Offline because of the ⌘K test switch, so offer the way back. */
  simulated: boolean;
  onReconnect: () => void;
}) {
  const [back, setBack] = useState<number | null>(null);
  const [wasOnline, setWasOnline] = useState(online);

  // On the change itself, remember how many messages were waiting to go.
  if (online !== wasOnline) {
    setWasOnline(online);
    setBack(online ? waiting : null);
  }

  useEffect(() => {
    if (back === null) return;
    const t = window.setTimeout(() => setBack(null), 2600);
    return () => window.clearTimeout(t);
  }, [back]);

  const show = !online || back !== null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        {show ? (
          <motion.div
            key={online ? "online" : "offline"}
            initial={{ opacity: 0, y: -28, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className={[
              "pointer-events-auto flex max-w-full items-center gap-3 rounded-full py-2 pr-2 pl-4 shadow-soft",
              online ? "bg-surface text-ink ring-1 ring-line" : "bg-ink text-bg",
            ].join(" ")}
          >
            {online ? (
              <CloudCheck size={20} weight="fill" className="shrink-0 text-accent-ink" aria-hidden />
            ) : (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex shrink-0"
              >
                <CloudSlash size={20} weight="fill" aria-hidden />
              </motion.span>
            )}
            <p className="min-w-0 text-[14px] leading-tight">
              <span className="font-semibold">{online ? "Back online" : "You're offline"}</span>
              <span className={online ? "text-muted" : "opacity-70"}>
                {online
                  ? back
                    ? ` · sending ${plural(back, "message")}`
                    : ""
                  : waiting
                    ? ` · ${plural(waiting, "message")} will send when you reconnect`
                    : " · messages will wait and send when you reconnect"}
              </span>
            </p>
            {!online && simulated ? (
              <button
                type="button"
                onClick={onReconnect}
                className="h-8 shrink-0 rounded-full bg-bg/15 px-3 text-[13px] font-medium hover:bg-bg/25"
              >
                Reconnect
              </button>
            ) : (
              <span className="w-2" aria-hidden />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Asked once, at the moment it makes sense (you've just opened a chat and
 * someone might reply), never on page load. "Not now" is respected.
 */
export function NotificationPrompt({ open, onEnable, onDismiss }: { open: boolean; onEnable: () => void; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-labelledby="notify-title"
          aria-describedby="notify-body"
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="glass fixed inset-x-4 bottom-32 z-40 mx-auto max-w-sm rounded-3xl border border-line/70 p-4 shadow-soft md:inset-x-auto md:top-20 md:right-8 md:bottom-auto"
        >
          <div className="flex gap-3">
            <motion.span
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -18, 14, -9, 5, 0] }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"
            >
              <BellRinging size={22} weight="fill" aria-hidden />
            </motion.span>
            <div className="min-w-0">
              <h2 id="notify-title" className="font-semibold">
                Know when friends reply?
              </h2>
              <p id="notify-body" className="mt-1 text-[13px] leading-relaxed text-muted">
                Lynk can alert you to new messages while this tab is in the background. You choose which chats in Settings.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Not now
            </Button>
            <Button variant="primary" size="sm" onClick={onEnable}>
              Turn on alerts
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

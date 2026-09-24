"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CalendarBlank, CaretLeft, CaretRight, DownloadSimple, Plus } from "@phosphor-icons/react";
import { PlanCard } from "@/components/chat/PlanCard";
import { PlanDialog, type PlanDraft } from "@/components/chat/PlanDialog";
import { Button } from "@/components/ui/controls";
import { allPlans, formatTime, type Chat, type Decision } from "@/lib/chat";
import { removePlan, setRsvp, updateThread, upsertPlan } from "@/lib/chat-ops";
import { useStoredChats } from "@/lib/chat-store";
import { downloadIcs } from "@/lib/ics";
import { MOTION } from "@/lib/motion";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const startOfDay = (at: number) => new Date(at).setHours(0, 0, 0, 0);
const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);

/** The 6 × 7 grid of days for a month, starting on Monday. */
function monthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - offset + i).getTime());
}

type Entry = { chat: Chat; plan: Decision };

/**
 * Every plan from every chat in one place. Pick a day to see what's on,
 * answer RSVPs, make a plan for that day, or send it all to your own calendar.
 */
export function CalendarView() {
  const router = useRouter();
  const { chats, loaded, now, change } = useStoredChats();
  const [cursor, setCursor] = useState<{ year: number; month: number } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const [draft, setDraft] = useState<PlanDraft | null>(null);

  // `now` is fixed when the chats load, so every date on the page agrees.
  const today = now;
  const view = cursor ?? { year: new Date(today).getFullYear(), month: new Date(today).getMonth() };
  const day = selected ?? startOfDay(today);

  const plans = useMemo(() => allPlans(chats), [chats]);
  const byDay = useMemo(() => {
    const map = new Map<number, Entry[]>();
    for (const e of plans) {
      const key = startOfDay(e.plan.when!);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return map;
  }, [plans]);

  const days = monthDays(view.year, view.month);
  const onDay = byDay.get(day) ?? [];
  const upcoming = plans.filter((e) => e.plan.when! >= startOfDay(today) && !sameDay(e.plan.when!, day)).slice(0, 5);
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(view.year, view.month, 1));

  const shift = (delta: number) => {
    setDirection(delta);
    const d = new Date(view.year, view.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const goTo = (at: number) => {
    const d = new Date(at);
    const target = d.getFullYear() * 12 + d.getMonth();
    const current = view.year * 12 + view.month;
    if (target !== current) {
      setDirection(Math.sign(target - current));
      setCursor({ year: d.getFullYear(), month: d.getMonth() });
    }
    setSelected(startOfDay(at));
  };

  const edit = (chatId: string, fn: (c: Chat) => Chat) => change((all) => updateThread(all, chatId, fn));
  const exportable = plans.filter((e) => e.plan.status === "confirmed" && e.plan.when! >= startOfDay(today));

  if (!loaded) {
    return (
      <div className="h-dvh min-w-0 flex-1 px-4 pt-10 md:px-8" aria-label="Loading calendar">
        <div className="mx-auto max-w-6xl">
          <div className="h-10 w-56 animate-pulse rounded-xl bg-surface-2" />
          <div className="mt-8 h-[28rem] animate-pulse rounded-[1.75rem] bg-surface-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 pt-4 pb-24 md:px-8 md:pt-8">
        <Link
          href="/app"
          className="-ml-1 inline-flex h-10 items-center gap-0.5 rounded-full pr-3 pl-1.5 text-[15px] text-accent-ink hover:bg-accent-soft md:hidden"
        >
          <CaretLeft size={20} weight="bold" aria-hidden /> Chats
        </Link>

        <header className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-muted">Calendar</p>
            <div className="relative h-11 overflow-hidden md:h-12">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.h1
                  key={monthLabel}
                  custom={direction}
                  initial={{ y: direction >= 0 ? 36 : -36, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: direction >= 0 ? -36 : 36, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="text-3xl font-semibold tracking-tight whitespace-nowrap md:text-4xl"
                >
                  {monthLabel}
                </motion.h1>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full border border-line bg-surface p-0.5">
              <button type="button" onClick={() => shift(-1)} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-surface-2" aria-label="Previous month">
                <CaretLeft size={16} weight="bold" />
              </button>
              <button type="button" onClick={() => goTo(today)} className="h-9 rounded-full px-3 text-[13px] font-medium hover:bg-surface-2">
                Today
              </button>
              <button type="button" onClick={() => shift(1)} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-surface-2" aria-label="Next month">
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
            <Button
              size="sm"
              disabled={!exportable.length}
              onClick={() => downloadIcs(exportable)}
              title="Download every upcoming confirmed plan as one .ics file"
            >
              <DownloadSimple size={15} weight="bold" /> Export all
            </Button>
            <Button variant="primary" size="sm" onClick={() => setDraft({ title: "", when: day + 19 * 3_600_000 })}>
              <Plus size={15} weight="bold" /> New plan
            </Button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Month */}
          <section aria-label={monthLabel} className="overflow-hidden rounded-[1.75rem] border border-line/70 bg-surface/70 p-2 shadow-soft md:p-3">
            <div className="grid grid-cols-7 pb-1.5" aria-hidden>
              {WEEKDAYS.map((w) => (
                <span key={w} className="text-center text-[12px] font-semibold text-muted">
                  {w}
                </span>
              ))}
            </div>
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.div
                key={`${view.year}-${view.month}`}
                initial={{ x: direction >= 0 ? 60 : -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction >= 0 ? -60 : 60, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="grid grid-cols-7 gap-1"
              >
                {days.map((d) => {
                  const inMonth = new Date(d).getMonth() === view.month;
                  const isToday = sameDay(d, today);
                  const isSelected = d === day;
                  const items = byDay.get(d) ?? [];
                  const label = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelected(d)}
                      aria-pressed={isSelected}
                      aria-label={`${label}${items.length ? `, ${items.length} plan${items.length > 1 ? "s" : ""}` : ""}`}
                      className={[
                        "relative flex min-h-16 flex-col items-stretch gap-1 rounded-2xl p-1.5 text-left transition-colors md:min-h-24 md:p-2",
                        isSelected ? "bg-accent-soft ring-2 ring-accent" : "hover:bg-surface-2/70",
                        inMonth ? "" : "opacity-40",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-flex size-7 items-center justify-center self-center rounded-full text-[13px] font-semibold tabular-nums md:self-start",
                          isToday ? "bg-accent text-on-accent" : "",
                        ].join(" ")}
                      >
                        {new Date(d).getDate()}
                      </span>
                      {/* Chips on wide screens, dots on phones. */}
                      <span className="hidden flex-col gap-1 md:flex">
                        {items.slice(0, 2).map(({ chat, plan }) => (
                          <span
                            key={`${chat.id}-${plan.id}`}
                            className={[
                              "grid rounded-lg px-1.5 py-1 text-[11px] leading-tight",
                              plan.status === "proposed" ? "border border-dashed border-accent/50 text-accent-ink" : "bg-accent text-on-accent",
                            ].join(" ")}
                          >
                            <span className="truncate font-semibold">{plan.title}</span>
                            <span className="truncate opacity-80">{plan.allDay ? "All day" : formatTime(plan.when!)}</span>
                          </span>
                        ))}
                        {items.length > 2 ? <span className="px-1 text-[11px] text-muted">+{items.length - 2} more</span> : null}
                      </span>
                      {items.length ? (
                        <span className="flex justify-center gap-0.5 md:hidden" aria-hidden>
                          {items.slice(0, 3).map(({ plan }, i) => (
                            <span key={i} className={`size-1.5 rounded-full ${plan.status === "proposed" ? "border border-accent" : "bg-accent"}`} />
                          ))}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </section>

          {/* Agenda */}
          <aside aria-label="Agenda" className="grid content-start gap-5">
            <div>
              <h2 className="text-lg font-semibold">
                {sameDay(day, today)
                  ? "Today"
                  : new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(day)}
              </h2>
              {onDay.length ? (
                <ul className="mt-3 grid gap-2.5">
                  <AnimatePresence initial={false}>
                    {onDay.map(({ chat, plan }) => (
                      <motion.li key={`${chat.id}-${plan.id}`} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={MOTION.item}>
                        <PlanCard
                          chat={chat}
                          plan={plan}
                          showChat
                          onRsvp={(answer) => edit(chat.id, (c) => setRsvp(c, plan.id, "me", answer))}
                          onEdit={() => setDraft({ ...plan, chatId: chat.id })}
                          onConfirm={() => edit(chat.id, (c) => ({ ...c, decisions: c.decisions.map((d) => (d.id === plan.id ? { ...d, status: "confirmed" } : d)) }))}
                          onReject={() => edit(chat.id, (c) => ({ ...c, decisions: c.decisions.map((d) => (d.id === plan.id ? { ...d, status: "rejected" } : d)) }))}
                          onJump={(messageId) => router.push(`/app?chat=${encodeURIComponent(chat.id)}&m=${encodeURIComponent(messageId)}`)}
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-line p-5 text-center">
                  <CalendarBlank size={26} className="mx-auto text-muted" aria-hidden />
                  <p className="mt-2 text-[14px] text-muted">Nothing planned.</p>
                  <button
                    type="button"
                    onClick={() => setDraft({ title: "", when: day + 19 * 3_600_000 })}
                    className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-[13px] font-medium hover:bg-line"
                  >
                    <Plus size={14} weight="bold" /> Plan something
                  </button>
                </div>
              )}
            </div>

            {upcoming.length ? (
              <div>
                <h2 className="text-[13px] font-semibold text-muted">Coming up</h2>
                <ul className="mt-2 grid gap-1">
                  {upcoming.map(({ chat, plan }) => (
                    <li key={`${chat.id}-${plan.id}`}>
                      <button type="button" onClick={() => goTo(plan.when!)} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-surface-2/70">
                        <span className="flex w-11 shrink-0 flex-col items-center rounded-xl bg-surface py-1 shadow-soft">
                          <span className="text-[10px] font-semibold text-accent-ink uppercase">
                            {new Intl.DateTimeFormat(undefined, { month: "short" }).format(plan.when)}
                          </span>
                          <span className="text-lg leading-none font-semibold tabular-nums">{new Date(plan.when!).getDate()}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-medium">{plan.title}</span>
                          <span className="block truncate text-[12px] text-muted">
                            {plan.allDay ? "All day" : formatTime(plan.when!)} · {chat.name}
                            {plan.status === "proposed" ? " · suggested" : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <PlanDialog
        draft={draft}
        chats={chats}
        onSave={(chatId, input) => {
          setDraft(null);
          edit(chatId, (c) => upsertPlan(c, input));
          if (input.when) goTo(input.when);
        }}
        onDelete={(chatId, planId) => {
          setDraft(null);
          edit(chatId, (c) => removePlan(c, planId));
        }}
        onClose={() => setDraft(null)}
      />
    </div>
  );
}


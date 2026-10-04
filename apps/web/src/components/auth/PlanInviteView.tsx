"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CalendarBlank, Check, LinkBreak, MapPin } from "@phosphor-icons/react";
import { Logo } from "@/components/landing/Logo";
import { buttonClass } from "@/components/ui/controls";
import { TextField } from "@/components/ui/Field";
import { formatWhen, RSVP_LABEL, type Rsvp } from "@/lib/chat";
import { readPlanLink, type PlanCard } from "@/lib/plan-link";

const ANSWERS: Rsvp[] = ["going", "maybe", "no"];

const subscribeHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

/**
 * Where a plan invite lands, for people who aren't on Lynk. The plan is read
 * from the link on this device. Answering needs only a name; until the server
 * exists the answer isn't sent anywhere, and the page says so.
 */
export function PlanInviteView() {
  // The fragment only exists in the browser: null on the server, then the hash.
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => null);
  // undefined until the browser has the link, null when it can't be read.
  const card: PlanCard | null | undefined = hash === null ? undefined : readPlanLink(hash);
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState<Rsvp | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="landing flex min-h-dvh flex-col px-5 py-5 sm:px-8">
      <header>
        <Link href="/" aria-label="Lynk home" className="inline-flex rounded-full">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md">
          {card === undefined ? null : card === null ? (
            <div className="text-center">
              <LinkBreak size={40} className="mx-auto text-muted" aria-hidden />
              <h1 className="mt-4 text-2xl font-semibold">This invite link doesn&apos;t work</h1>
              <p className="mt-2 text-muted">It may have been cut off when it was copied. Ask whoever sent it for the link again.</p>
            </div>
          ) : (
            <>
              <p className="text-center text-[14px] font-semibold text-accent-ink">
                {card.f} invited you · {card.g}
              </p>
              <div className="mt-4 rounded-3xl border border-line bg-surface p-6 shadow-soft">
                <h1 className="text-2xl leading-tight font-semibold tracking-tight">{card.t}</h1>
                <div className="mt-3 grid gap-1.5 text-[15px] text-muted">
                  <span className="flex items-center gap-2">
                    <CalendarBlank size={17} aria-hidden /> {formatWhen({ when: card.w, allDay: card.d, repeat: card.r ? "weekly" : undefined })}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin size={17} aria-hidden /> {card.p ?? "Place still open"}
                  </span>
                </div>
                <p className="mt-3 text-[14px] text-muted">{card.n ? `${card.n} going so far` : "Nobody has answered yet"}</p>

                {sent ? (
                  <p role="status" className="mt-6 flex items-start gap-2 rounded-2xl bg-surface-2 p-4 text-[14px]">
                    <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-positive" aria-hidden />
                    <span>
                      Thanks, {name.trim()}. You said <b>{RSVP_LABEL[answer!].toLowerCase()}</b>. This is a preview, so your answer isn&apos;t sent anywhere yet.
                      Once Lynk&apos;s server is live, {card.f} and the group will see it.
                    </span>
                  </p>
                ) : (
                  <form
                    className="mt-6 grid gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!name.trim()) return setError("Add your name so they know who's answering.");
                      if (!answer) return setError("Choose Going, Maybe or Can't go.");
                      setSent(true);
                    }}
                  >
                    <TextField
                      id="invite-name"
                      label="Your name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError(null);
                      }}
                      placeholder="Riya"
                      maxLength={40}
                      autoComplete="given-name"
                      error={error}
                    />
                    <div role="group" aria-label="Are you going?" className="flex gap-1 rounded-full bg-surface-2 p-1">
                      {ANSWERS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          aria-pressed={answer === a}
                          onClick={() => {
                            setAnswer(a);
                            setError(null);
                          }}
                          className={`h-10 flex-1 rounded-full text-[14px] font-medium ${answer === a ? (a === "going" ? "bg-accent text-on-accent" : "bg-surface shadow-soft") : "text-muted"}`}
                        >
                          {RSVP_LABEL[a]}
                        </button>
                      ))}
                    </div>
                    <button type="submit" className={buttonClass("primary", "lg", "w-full")}>
                      Send my answer
                    </button>
                  </form>
                )}
              </div>
              <p className="mt-6 text-center text-[14px] text-muted">
                Lynk is a group chat that remembers the plan.{" "}
                <Link href="/sign-up" className="font-medium text-accent-ink hover:underline">
                  Get Lynk
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

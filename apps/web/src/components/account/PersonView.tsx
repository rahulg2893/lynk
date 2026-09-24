"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChatCircleDots, Flag, Prohibit, Sparkle } from "@phosphor-icons/react";
import { PageShell } from "@/components/app/PageShell";
import { Section } from "@/components/app/Section";
import { Avatar, ChatAvatar } from "@/components/chat/primitives";
import { Button, buttonClass } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/Dialog";
import { updateAccount, useAccount } from "@/lib/account";
import { PEOPLE, createMockChats, firstName, presence } from "@/lib/chat";

const REPORT_REASONS = ["Spam or scams", "Harassment or bullying", "Pretending to be someone else", "Something else"];

/**
 * Someone you chat with: the chats you share, what your chats remember about
 * them, and block or report. Memories only come from chats you're both in,
 * the same rule the server will enforce.
 */
export function PersonView({ id }: { id: string }) {
  const person = PEOPLE[id];
  const account = useAccount();
  const [dialog, setDialog] = useState<"block" | "report" | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  const { dm, shared, memories } = useMemo(() => {
    // Only membership and memories matter here, so message times are irrelevant.
    const chats = createMockChats(0).filter((c) => c.members.includes(id));
    const first = person.name.split(" ")[0].toLowerCase();
    return {
      dm: chats.find((c) => c.kind === "dm") ?? null,
      shared: chats.filter((c) => c.kind === "group"),
      memories: chats.flatMap((c) =>
        c.memory
          .filter((m) => m.kind.toLowerCase() === first || m.value.toLowerCase().includes(first))
          .map((m) => ({ ...m, chat: c })),
      ),
    };
  }, [id, person.name]);

  if (!account) return null;
  const blocked = account.blocked.includes(id);
  const first = firstName(id);

  const setBlocked = (on: boolean) => {
    updateAccount((a) => ({ ...a, blocked: on ? [...a.blocked, id] : a.blocked.filter((b) => b !== id) }));
    setDialog(null);
  };

  return (
    <PageShell title={person.name} back={{ href: dm ? `/app?chat=${dm.id}` : "/app", label: dm ? "Chat" : "Chats" }} backAlways>
      <div className="-mt-1 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="order-first sm:order-none">
          <Avatar id={id} name={person.name} size={96} online={dm?.online && !blocked} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] text-muted">@{person.handle}</p>
          <p className="mt-1 text-[15px]">{blocked ? "Blocked" : dm ? presence(dm) : "No one-to-one chat yet"}</p>
        </div>
      </div>

      {blocked ? (
        <div role="status" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <p className="text-[15px]">
            You blocked {first}. You won&apos;t see each other&apos;s messages or online status.
          </p>
          <Button size="sm" onClick={() => setBlocked(false)}>
            Unblock
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          {dm ? (
            <Link href={`/app?chat=${dm.id}`} className={buttonClass("primary")}>
              <ChatCircleDots size={18} weight="fill" aria-hidden /> Message
            </Link>
          ) : (
            <span className={buttonClass("secondary")} aria-disabled title="New chats arrive with the backend">
              <ChatCircleDots size={18} aria-hidden /> Message (coming soon)
            </span>
          )}
        </div>
      )}

      <Section title={`Groups with ${first}`}>
        {shared.length ? (
          <ul className="divide-y divide-line">
            {shared.map((c) => (
              <li key={c.id}>
                <Link href={`/app?chat=${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/60">
                  <ChatAvatar chat={c} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{c.name}</span>
                    <span className="block text-[13px] text-muted">{c.members.length + 1} members</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-5 text-[15px] text-muted">No groups in common.</p>
        )}
      </Section>

      <Section
        title="Remembered in your chats"
        footnote={`Only from chats you and ${first} are both in. ${first} can see and remove anything remembered about them.`}
      >
        {memories.length ? (
          <ul className="divide-y divide-line">
            {memories.map((m) => (
              <li key={m.id} className="px-5 py-4">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                  <Sparkle size={12} weight="fill" className="text-accent-ink" aria-hidden /> {m.kind}
                </p>
                <p className="mt-0.5 text-[15px] font-medium">{m.value}</p>
                <Link href={`/app?chat=${m.chat.id}`} className="text-[13px] text-accent-ink hover:underline">
                  From {m.chat.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-5 text-[15px] text-muted">Nothing remembered about {first} yet.</p>
        )}
      </Section>

      <Section title="Safety">
        <div className="flex flex-wrap gap-3 px-5 py-4">
          {blocked ? null : (
            <Button variant="danger-quiet" onClick={() => setDialog("block")}>
              <Prohibit size={18} aria-hidden /> Block {first}
            </Button>
          )}
          <Button variant="danger-quiet" onClick={() => setDialog("report")} disabled={reported}>
            <Flag size={18} aria-hidden /> {reported ? "Reported" : `Report ${first}`}
          </Button>
        </div>
      </Section>

      <Dialog
        open={dialog === "block"}
        onClose={() => setDialog(null)}
        title={`Block ${first}?`}
        description={`You won't see each other's messages, online status or invites, including in groups you share. ${first} isn't told.`}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => setBlocked(true)}>
            Block
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={dialog === "report"}
        onClose={() => {
          setDialog(null);
          setReason(null);
        }}
        title={`Report ${first}`}
        description="Reports are private. We look at the reported messages only, never the rest of your chats."
      >
        <fieldset>
          <legend className="text-[13px] font-semibold text-muted">What&apos;s happening?</legend>
          <div className="mt-2 grid gap-1">
            {REPORT_REASONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-2">
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="size-4 accent-[var(--accent)]"
                />
                <span className="text-[15px]">{r}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={!reason}
            onClick={() => {
              setReported(true);
              setDialog(null);
            }}
          >
            Send report
          </Button>
        </div>
      </Dialog>
    </PageShell>
  );
}

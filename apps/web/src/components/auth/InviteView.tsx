"use client";

import Link from "next/link";
import { LinkBreak } from "@phosphor-icons/react";
import { Logo } from "@/components/landing/Logo";
import { Avatar } from "@/components/chat/primitives";
import { buttonClass } from "@/components/ui/controls";
import { useAccount } from "@/lib/account";
import { PEOPLE, firstName } from "@/lib/chat";
import type { Invite } from "@/lib/invites";

/**
 * Where an invite link lands. Say who invited you and to what before asking
 * for anything; signed-in people go straight in, everyone else creates an
 * account first and comes back here (HIG `onboarding.md`: value before sign-up).
 */
export function InviteView({ code, invite }: { code: string; invite: Invite | null }) {
  const account = useAccount();
  const signedIn = Boolean(account?.session);
  const own = account?.profile.username === code;

  return (
    <div className="landing flex min-h-dvh flex-col px-5 py-5 sm:px-8">
      <header>
        <Link href="/" aria-label="Lynk home" className="inline-flex rounded-full">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md text-center">
          {own ? (
            <OwnLink />
          ) : invite?.kind === "group" ? (
            <Card
              people={invite.members}
              title={`Join ${invite.name}`}
              body={`${firstName(invite.from)} invited you. ${invite.members.length + 1} people are in this chat.`}
              destination={`/app?chat=${invite.chatId}`}
              signedIn={signedIn}
              cta="Join the chat"
            />
          ) : invite?.kind === "person" ? (
            <Card
              people={[invite.personId]}
              title={`Chat with ${firstName(invite.personId)}`}
              body={`${PEOPLE[invite.personId].name} (@${PEOPLE[invite.personId].handle}) wants to chat with you on Lynk.`}
              destination={invite.chatId ? `/app?chat=${invite.chatId}` : `/app/people/${invite.personId}`}
              signedIn={signedIn}
              cta={`Message ${firstName(invite.personId)}`}
            />
          ) : (
            <Broken />
          )}
        </div>
      </main>
    </div>
  );
}

function Card({
  people,
  title,
  body,
  destination,
  signedIn,
  cta,
}: {
  people: string[];
  title: string;
  body: string;
  destination: string;
  signedIn: boolean;
  cta: string;
}) {
  const next = encodeURIComponent(destination);
  return (
    <>
      <div className="flex justify-center -space-x-3" aria-hidden>
        {people.map((id, i) => (
          <span key={id} className="rounded-[26px] border-4 border-bg" style={{ transform: `rotate(${(i - (people.length - 1) / 2) * 6}deg)` }}>
            <Avatar id={id} name={PEOPLE[id]?.name ?? id} size={72} />
          </span>
        ))}
      </div>
      <h1 className="mt-8 text-4xl leading-tight tracking-tight text-balance">{title}</h1>
      <p className="mx-auto mt-3 max-w-[36ch] text-[15px] leading-relaxed text-muted">{body}</p>
      <div className="mt-8 grid gap-3">
        {signedIn ? (
          <Link href={destination} className={buttonClass("primary", "lg", "w-full")}>
            {cta}
          </Link>
        ) : (
          <>
            <Link href={`/sign-up?next=${next}`} className={buttonClass("primary", "lg", "w-full")}>
              Create an account to join
            </Link>
            <Link href={`/sign-in?next=${next}`} className={buttonClass("secondary", "lg", "w-full")}>
              I already have an account
            </Link>
          </>
        )}
      </div>
      <p className="mt-6 text-[13px] text-muted">Lynk is a chat app for friends and family that remembers the plan.</p>
    </>
  );
}

function OwnLink() {
  return (
    <>
      <h1 className="text-4xl leading-tight tracking-tight">This is your invite link.</h1>
      <p className="mx-auto mt-3 max-w-[36ch] text-[15px] leading-relaxed text-muted">
        Send it to friends. When they open it, they can start a chat with you.
      </p>
      <Link href="/app/profile" className={buttonClass("secondary", "lg", "mt-8 w-full")}>
        Back to your profile
      </Link>
    </>
  );
}

function Broken() {
  return (
    <>
      <span className="inline-flex size-16 items-center justify-center rounded-[20px] bg-surface-2 text-muted">
        <LinkBreak size={30} aria-hidden />
      </span>
      <h1 className="mt-6 text-4xl leading-tight tracking-tight">This invite link doesn&apos;t work.</h1>
      <p className="mx-auto mt-3 max-w-[36ch] text-[15px] leading-relaxed text-muted">
        It may have been mistyped or turned off. Ask the person who sent it for a new one.
      </p>
      <Link href="/" className={buttonClass("secondary", "lg", "mt-8 w-full")}>
        Go to the Lynk home page
      </Link>
    </>
  );
}

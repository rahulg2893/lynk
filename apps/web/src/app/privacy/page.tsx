import type { Metadata } from "next";
import Link from "next/link";
import { DeviceMobile, EyeSlash, LockKey, Sparkle, Trash, UsersThree } from "@phosphor-icons/react/ssr";
import { Logo } from "@/components/landing/Logo";

export const metadata: Metadata = {
  title: "How Lynk handles your chats",
  description: "A plain-language overview of Lynk's end-to-end encryption, who can see what, and how smart features work on your device.",
};

const POINTS = [
  {
    icon: UsersThree,
    title: "Being in the chat is what gives access",
    body: "You can read a chat's messages from when you joined, unless a group admin shares earlier history when adding you. Leave a group and you stop seeing it. There are no hidden roles or admin back doors.",
  },
  {
    icon: LockKey,
    title: "Every chat is end-to-end encrypted",
    body: "Messages, photos, voice notes, plans and lists are encrypted on your device, and only the people in the chat hold the keys. Lynk's servers pass them along but can't read them, and neither can anyone at Lynk. This is on for every chat, always; there's no setting to turn it off. What the servers do see is who is in which chat and when messages are sent, so they can be delivered."
  },
  {
    icon: Sparkle,
    title: "Smart features run on your device",
    body: "Search, answers, plan and to-do suggestions, memories, voice-note transcripts and translation all happen on your phone or computer, inside the encryption, so they never need Lynk to read your chats. They only suggest: nothing is saved until someone in the chat confirms it, and each suggestion links to the messages it came from. You can turn them off in Settings.",
  },
  {
    icon: EyeSlash,
    title: "What's said in a chat stays in that chat",
    body: "Plans, lists and memories belong to the chat they came from and never appear outside it. If a memory is about you, you can see it and remove it from your profile. Blocking someone hides messages, online status and invites in both directions.",
  },
  {
    icon: DeviceMobile,
    title: "No passwords",
    body: "You sign in with your phone number and a code we text you, so there's no Lynk password to reuse, phish or leak. Friends find you by username and never see your number. Settings shows every device you're signed in on, and you can sign any of them out.",
  },
  {
    icon: Trash,
    title: "Your data, your call",
    body: "Download everything Lynk holds about you at any time. Delete your account straight away, or schedule it for 30 days later and change your mind until then.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="landing min-h-dvh">
      <header className="px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" aria-label="Lynk home" className="inline-flex rounded-full">
            <Logo />
          </Link>
          <Link href="/app" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg">
            Open Lynk
          </Link>
        </div>
      </header>
      <main className="px-5 pt-12 pb-28 sm:px-8 md:pt-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-[13px] font-semibold text-muted">Privacy</p>
          <h1 className="mt-3 max-w-[18ch] text-5xl leading-[1.05] tracking-tight text-balance md:text-6xl">
            How Lynk handles your chats.
          </h1>
          <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-muted">
            Lynk remembers plans and little things so you don&apos;t have to. That only works if you can trust who sees what.
            Here is how it&apos;s designed, in plain words.
          </p>
          <p className="mt-6 rounded-2xl border border-line bg-surface px-4 py-3 text-[14px] text-muted">
            This is an overview of the product&apos;s design, not a legal privacy policy. The full policy will be published
            before Lynk launches.
          </p>

          <ul className="mt-14 grid gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-14">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <span className="inline-flex size-11 items-center justify-center rounded-[14px] bg-accent-soft text-accent-ink">
                  <Icon size={22} aria-hidden />
                </span>
                <h2 className="mt-4 text-2xl leading-snug">{title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-20 rounded-[2rem] bg-stage px-8 py-12 text-on-stage md:px-12">
            <h2 className="max-w-[20ch] text-3xl leading-tight md:text-4xl">Your settings, whenever you want them.</h2>
            <p className="mt-3 max-w-[48ch] text-on-stage-muted">
              Privacy, smart features, sign-in and your data all live in Settings.
            </p>
            <Link href="/app/settings/privacy" className="mt-7 inline-flex h-12 items-center rounded-full bg-accent px-6 font-medium text-on-accent">
              Open privacy settings
            </Link>
          </div>
        </div>
      </main>
      <footer className="border-t border-line px-5 py-8 text-sm text-muted sm:px-8">
        <div className="mx-auto max-w-5xl">© 2026 Lynk</div>
      </footer>
    </div>
  );
}

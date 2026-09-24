"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookmarkSimple, ChatsCircle, GearSix, SunHorizon, type Icon } from "@phosphor-icons/react";
import { Logo } from "@/components/landing/Logo";
import { Avatar } from "@/components/chat/primitives";
import { useAccount } from "@/lib/account";

/** Slim navigation dock on tablet and desktop. Phones navigate from each screen's header. */
export function AppDock() {
  const pathname = usePathname();
  const chatOpen = useSearchParams().has("chat");
  const account = useAccount();

  const onChats = pathname === "/app" || pathname.startsWith("/app/people");
  const items: { href: string; label: string; icon: Icon; active: boolean }[] = [
    { href: "/app", label: "Catch up", icon: SunHorizon, active: pathname === "/app" && !chatOpen },
    { href: "/app", label: "Chats", icon: ChatsCircle, active: onChats && (chatOpen || pathname !== "/app") },
  ];
  const settingsActive = pathname.startsWith("/app/settings");
  const profileActive = pathname === "/app/profile";

  return (
    <nav
      aria-label="App"
      className="hidden w-[4.5rem] shrink-0 flex-col items-center justify-between border-r border-line bg-bg py-4 md:flex"
    >
      <div className="flex flex-col items-center gap-5">
        <Link href="/" aria-label="Lynk home" className="rounded-xl p-1.5">
          <Logo withWord={false} />
        </Link>
        <ul className="flex flex-col gap-1.5">
          {items.map(({ href, label, icon: Icon, active }) => (
            <li key={label}>
              <DockLink href={href} label={label} active={active}>
                <Icon size={22} weight={active ? "fill" : "regular"} />
              </DockLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-disabled
              title="Saved messages arrive with the backend"
              className="inline-flex size-11 cursor-not-allowed items-center justify-center rounded-full text-muted opacity-50"
            >
              <BookmarkSimple size={22} />
              <span className="sr-only">Saved (coming soon)</span>
            </button>
          </li>
        </ul>
      </div>
      <ul className="flex flex-col items-center gap-3">
        <li>
          <DockLink href="/app/settings" label="Settings" active={settingsActive} shortcut="⌘,">
            <GearSix size={22} weight={settingsActive ? "fill" : "regular"} />
          </DockLink>
        </li>
        <li>
          <Link
            href="/app/profile"
            aria-current={profileActive ? "page" : undefined}
            title="Your profile"
            className={`inline-flex rounded-[13px] ring-offset-2 ring-offset-bg ${profileActive ? "ring-2 ring-accent" : ""}`}
          >
            <Avatar id="me" name={account?.profile.name ?? "You"} photo={account?.profile.photo} size={36} />
            <span className="sr-only">Your profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function DockLink({
  href,
  label,
  active,
  shortcut,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={[
        "inline-flex size-11 items-center justify-center rounded-full transition-colors",
        active ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
      ].join(" ")}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  );
}

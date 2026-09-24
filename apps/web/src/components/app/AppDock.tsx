"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useState } from "react";
import { BookmarkSimple, ChatsCircle, GearSix, SunHorizon, type Icon } from "@phosphor-icons/react";
import { LogoMark } from "@/components/landing/Logo";
import { Avatar } from "@/components/chat/primitives";
import { useAccount } from "@/lib/account";

/**
 * A floating glass dock, magnified like the one on a Mac: icons swell on a
 * spring as the pointer moves along it, and a label springs out beside the
 * one you're on. Phones navigate from each screen's header instead.
 */
export function AppDock() {
  const pathname = usePathname();
  const chatOpen = useSearchParams().has("chat");
  const account = useAccount();
  const mouseY = useMotionValue(Infinity);

  const onChats = pathname === "/app" || pathname.startsWith("/app/people");
  const items: { href: string; label: string; icon: Icon; active: boolean }[] = [
    { href: "/app", label: "Catch up", icon: SunHorizon, active: pathname === "/app" && !chatOpen },
    { href: "/app", label: "Chats", icon: ChatsCircle, active: onChats && (chatOpen || pathname !== "/app") },
  ];
  const settingsActive = pathname.startsWith("/app/settings");
  const profileActive = pathname === "/app/profile";

  return (
    <nav aria-label="App" className="relative z-30 hidden w-[5.25rem] shrink-0 items-center justify-center py-4 md:flex">
      <motion.div
        onPointerMove={(e) => e.pointerType === "mouse" && mouseY.set(e.clientY)}
        onPointerLeave={() => mouseY.set(Infinity)}
        className="glass flex h-full w-[3.75rem] flex-col items-center justify-between rounded-[1.75rem] border border-line/70 py-3 shadow-soft"
      >
        <div className="flex flex-col items-center gap-3">
          <Link href="/" aria-label="Lynk home" className="rounded-2xl p-1.5 transition-transform hover:rotate-[-8deg]">
            <LogoMark className="h-6 w-auto" />
          </Link>
          <span className="h-px w-6 bg-line" aria-hidden />
          <ul className="flex flex-col items-center gap-2">
            {items.map(({ href, label, icon: Icon, active }) => (
              <li key={label}>
                <DockItem href={href} label={label} active={active} mouseY={mouseY}>
                  <Icon size={22} weight={active ? "fill" : "regular"} />
                </DockItem>
              </li>
            ))}
            <li>
              <DockItem label="Saved (coming soon)" active={false} mouseY={mouseY} disabled>
                <BookmarkSimple size={22} />
              </DockItem>
            </li>
          </ul>
        </div>
        <ul className="flex flex-col items-center gap-2">
          <li>
            <DockItem href="/app/settings" label="Settings  ⌘," active={settingsActive} mouseY={mouseY}>
              <GearSix size={22} weight={settingsActive ? "fill" : "regular"} />
            </DockItem>
          </li>
          <li>
            <DockItem href="/app/profile" label="Your profile" active={profileActive} mouseY={mouseY} plain>
              <span className={`inline-flex rounded-[13px] ring-offset-2 ring-offset-surface ${profileActive ? "ring-2 ring-accent" : ""}`}>
                <Avatar id="me" name={account?.profile.name ?? "You"} photo={account?.profile.photo} size={36} />
              </span>
            </DockItem>
          </li>
        </ul>
      </motion.div>
    </nav>
  );
}

function DockItem({
  href,
  label,
  active,
  mouseY,
  disabled = false,
  plain = false,
  children,
}: {
  href?: string;
  label: string;
  active: boolean;
  mouseY: MotionValue<number>;
  disabled?: boolean;
  plain?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);
  const distance = useTransform(mouseY, (y) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? y - (r.top + r.height / 2) : Infinity;
  });
  const scale = useSpring(useTransform(distance, [-110, 0, 110], [1, 1.42, 1]), { stiffness: 320, damping: 22, mass: 0.4 });

  const face = (
    <motion.span
      ref={ref}
      style={{ scale }}
      className={[
        "relative inline-flex size-11 items-center justify-center rounded-2xl transition-colors",
        plain ? "" : active ? "bg-accent text-on-accent shadow-[0_8px_20px_-6px_color-mix(in_oklab,var(--accent)_70%,transparent)]" : "text-muted hover:bg-surface-2 hover:text-ink",
        disabled ? "opacity-45" : "",
      ].join(" ")}
    >
      {children}
      {active && !plain ? <span className="absolute -left-2.5 h-5 w-1 rounded-full bg-accent" aria-hidden /> : null}
    </motion.span>
  );

  const tip = (
    <AnimatePresence>
      {hover ? (
        <motion.span
          role="tooltip"
          initial={{ opacity: 0, x: -6, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -4, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="pointer-events-none absolute top-1/2 left-full ml-5 -translate-y-1/2 rounded-full bg-ink px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-bg shadow-soft"
        >
          {label}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );

  const events = {
    onPointerEnter: () => setHover(true),
    onPointerLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
  };

  if (disabled || !href) {
    return (
      <span className="relative inline-flex" {...events}>
        <button type="button" aria-disabled className="cursor-not-allowed rounded-2xl" aria-label={label}>
          {face}
        </button>
        {tip}
      </span>
    );
  }
  return (
    <span className="relative inline-flex" {...events}>
      <Link href={href} aria-current={active ? "page" : undefined} aria-label={label.replace(/\s+⌘,$/, "")} className="rounded-2xl">
        {face}
      </Link>
      {tip}
    </span>
  );
}

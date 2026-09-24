"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "./Logo";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "/privacy", label: "Privacy" },
];

/**
 * Floating glass nav. It tucks away while you read down the page and springs
 * back the moment you scroll up, and tightens once you leave the hero.
 * z-50 is the page's top layer.
 */
export function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > 240 && y > prev + 4);
    if (y < prev - 4 || y < 240) setHidden(false);
    setCompact(y > 40);
  });

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 px-4 pt-3 md:px-6"
      animate={{ y: hidden ? "-120%" : "0%" }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
    >
      <motion.nav
        aria-label="Main"
        animate={{ maxWidth: compact ? 980 : 1280 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="glass mx-auto flex h-14 items-center justify-between rounded-full border border-line/70 pr-2 pl-4 shadow-soft"
      >
        <Link href="/" aria-label="Lynk home" className="rounded-full">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <ThemeToggle id="theme-nav" className="hidden lg:inline-flex" />
          <Link href="/sign-in" className="hidden rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap text-ink hover:bg-surface-2 sm:inline-flex">
            Sign in
          </Link>
          <Link href="/sign-up" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium whitespace-nowrap text-bg active:scale-[0.98]">
            Get started
          </Link>
        </div>
      </motion.nav>
    </motion.header>
  );
}

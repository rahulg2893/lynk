import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "./Logo";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#privacy", label: "Privacy" },
];

/** Fixed, one line, 64px. z-50 is the page's top layer (see z-index notes in page.tsx). */
export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 md:px-6">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full glass border border-line/70 pr-2 pl-4 shadow-soft"
      >
        <Link href="/" aria-label="Lynk home" className="rounded-full">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <ThemeToggle id="theme-nav" className="hidden sm:inline-flex" />
          <Link
            href="/sign-in"
            className="hidden rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap text-ink hover:bg-surface-2 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/app"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium whitespace-nowrap text-bg active:scale-[0.98]"
          >
            Open Lynk
          </Link>
        </div>
      </nav>
    </header>
  );
}

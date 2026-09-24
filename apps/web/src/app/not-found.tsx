import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

export default function NotFound() {
  return (
    <div className="landing flex min-h-dvh flex-col px-5 py-5 sm:px-8">
      <header>
        <Link href="/" aria-label="Lynk home" className="inline-flex rounded-full">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center py-12 text-center">
        <p className="text-[13px] font-semibold text-muted">Page not found</p>
        <h1 className="mt-3 max-w-[16ch] text-5xl leading-tight tracking-tight text-balance">This link goes nowhere.</h1>
        <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-muted">
          The page may have moved, or the address has a typo. Your chats are right where you left them.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/app" className="inline-flex h-12 items-center rounded-full bg-accent px-6 font-medium text-on-accent">
            Open your chats
          </Link>
          <Link href="/" className="inline-flex h-12 items-center rounded-full border border-line bg-surface px-6 font-medium">
            Home page
          </Link>
        </div>
      </main>
    </div>
  );
}

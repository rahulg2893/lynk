"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/lib/account";
import { Logo } from "@/components/landing/Logo";
import { AppDock } from "./AppDock";

/**
 * Everything under /app: the sign-in gate, the dock on tablet and desktop,
 * and app-wide shortcuts. The account lives in the browser for now, so the
 * gate runs on the client and shows a quiet splash until it knows.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const account = useAccount();
  const signedIn = Boolean(account?.session);

  useEffect(() => {
    if (account && !account.session) {
      const here = window.location.pathname + window.location.search;
      router.replace(`/sign-in?next=${encodeURIComponent(here)}`);
    }
  }, [account, router]);

  // ⌘, (Ctrl+, elsewhere) opens Settings, as on every Mac app (HIG `settings.md`).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        router.push("/app/settings");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!signedIn) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg" role="status" aria-label="Opening Lynk">
        <span className="animate-pulse text-muted">
          <Logo withWord={false} />
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-dvh bg-bg text-ink">
      <Suspense fallback={<div className="hidden w-[4.5rem] shrink-0 border-r border-line md:block" />}>
        <AppDock />
      </Suspense>
      <div className="flex min-w-0 flex-1">{children}</div>
    </div>
  );
}

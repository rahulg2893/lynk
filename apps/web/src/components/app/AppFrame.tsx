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
    <div className="relative isolate flex h-dvh overflow-hidden bg-bg text-ink">
      {/* Atmosphere: two soft accent glows behind everything (decorative, ≤10% strength). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 size-[36rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_10%,transparent),transparent_65%)]" />
        <div className="absolute -right-40 -bottom-48 size-[40rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_7%,transparent),transparent_65%)]" />
      </div>
      <Suspense fallback={<div className="hidden w-[5.25rem] shrink-0 md:block" />}>
        <AppDock />
      </Suspense>
      <div className="flex min-w-0 flex-1">{children}</div>
    </div>
  );
}

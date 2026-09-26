"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info } from "@phosphor-icons/react";
import { PhoneVerify } from "./PhoneVerify";
import { signIn, useAccount } from "@/lib/account";

/**
 * Your phone number, then the code we text to it. No passwords, and no
 * Apple or Google. Everything here is simulated until the Go server exists.
 */
export function SignInForm({ next, notice }: { next: string; notice?: string }) {
  const router = useRouter();
  const account = useAccount();

  // Signed in (already, or just now): go on to the app.
  useEffect(() => {
    if (account?.session) router.replace(next);
  }, [account?.session, next, router]);

  return (
    <div>
      {notice ? (
        <p role="status" className="mb-8 flex items-start gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-[14px]">
          <Info size={18} className="mt-px shrink-0 text-accent-ink" aria-hidden />
          {notice}
        </p>
      ) : null}

      <h1 className="text-4xl leading-tight tracking-tight">Welcome back.</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Sign in with your phone number to see your chats, plans and lists. Lynk never asks for a password.
      </p>

      <div className="mt-8">
        <PhoneVerify
          submitLabel="Send code"
          check={(phone) =>
            account && phone !== account.profile.phone ? "There's no Lynk account for this number. Check it, or create an account." : null
          }
          onVerified={() => signIn()}
        />
      </div>

      {account?.seeded ? (
        <p className="mt-6 text-center text-[13px] text-muted">
          Trying the preview? Use <span className="font-medium text-ink tabular-nums">{account.profile.phone}</span>.
        </p>
      ) : null}

      <p className="mt-10 text-center text-[15px] text-muted">
        New to Lynk?{" "}
        <Link href={`/sign-up${next !== "/app" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent-ink hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

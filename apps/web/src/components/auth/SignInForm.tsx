"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fingerprint, Info } from "@phosphor-icons/react";
import { Button } from "@/components/ui/controls";
import { TextField } from "@/components/ui/Field";
import { OrDivider, ProviderButtons } from "./ProviderButtons";
import { signIn, updateAccount, useAccount, type SignInMethod } from "@/lib/account";

/**
 * Passkey first, then Apple and Google. No passwords anywhere (HIG
 * `managing-accounts.md`: prefer passkeys; name the method on the button).
 * Everything here is simulated until the Go server exists.
 */
export function SignInForm({ next, notice }: { next: string; notice?: string }) {
  const router = useRouter();
  const account = useAccount();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<SignInMethod | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  // Already signed in: skip the form.
  useEffect(() => {
    if (account?.session && !busy) router.replace(next);
  }, [account?.session, busy, next, router]);

  const finish = (method: SignInMethod) => {
    signIn(method);
    router.push(next);
  };

  const withPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().replace(/^@/, "").toLowerCase();
    if (u && account && u !== account.profile.username) {
      setError(`There's no Lynk account for @${u}. Check the spelling, or create an account.`);
      return;
    }
    setError(null);
    setBusy("passkey");
    // Stand-in for navigator.credentials.get(): the browser's passkey sheet.
    timer.current = window.setTimeout(() => finish("passkey"), 1300);
  };

  const withProvider = (provider: "apple" | "google") => {
    setError(null);
    setBusy(provider);
    timer.current = window.setTimeout(() => {
      // A provider that isn't linked yet signs in to the same demo account and links it.
      if (account && !account.linked[provider]) {
        updateAccount((a) => ({ ...a, linked: { ...a.linked, [provider]: true } }));
      }
      finish(provider);
    }, 1100);
  };

  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setBusy(null);
  };

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
        Sign in to see your chats, plans and lists. Lynk never asks for a password.
      </p>

      <form onSubmit={withPasskey} className="mt-8 grid gap-4" noValidate>
        <TextField
          id="username"
          label="Username"
          prefix="@"
          placeholder="yourname"
          autoComplete="username webauthn"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
          }}
          hint="Leave it empty to pick from the passkeys saved on this device."
          error={error}
          disabled={busy !== null}
        />
        <Button type="submit" variant="primary" size="lg" loading={busy === "passkey"} disabled={busy !== null && busy !== "passkey"}>
          {busy === "passkey" ? (
            "Waiting for your passkey"
          ) : (
            <>
              <Fingerprint size={20} aria-hidden /> Sign in with a passkey
            </>
          )}
        </Button>
        {busy ? (
          <button type="button" onClick={cancel} className="justify-self-center text-[14px] text-accent-ink hover:underline">
            Cancel
          </button>
        ) : null}
      </form>

      <OrDivider />
      <ProviderButtons busy={busy === "apple" || busy === "google" ? busy : null} disabled={busy === "passkey"} onChoose={withProvider} />

      <p className="mt-10 text-center text-[15px] text-muted">
        New to Lynk?{" "}
        <Link href={`/sign-up${next !== "/app" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent-ink hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

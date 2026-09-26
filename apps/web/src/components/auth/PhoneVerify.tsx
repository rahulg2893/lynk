"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/controls";
import { TextField } from "@/components/ui/Field";
import { CODE_LENGTH, DEFAULT_DIAL, RESEND_SECONDS, checkCode, normalizePhone, phoneProblem, sendCode } from "@/lib/phone";

/**
 * Phone number, then the code we text to it. Used by sign-in, sign-up and
 * changing your number. `check` can reject a valid-looking number (say, one
 * with no account) before a code is sent.
 */
export function PhoneVerify({
  onVerified,
  check,
  submitLabel = "Continue",
}: {
  onVerified: (phone: string) => void;
  check?: (phone: string) => string | null;
  submitLabel?: string;
}) {
  const [stage, setStage] = useState<"number" | "code">("number");
  const [phone, setPhone] = useState(DEFAULT_DIAL);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!resendIn) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (stage === "code") codeInput.current?.focus();
  }, [stage]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = normalizePhone(phone);
    const problem = phoneProblem(p) ?? check?.(p) ?? null;
    if (problem) return setError(problem);
    setError(null);
    setBusy(true);
    await sendCode();
    setBusy(false);
    setCode("");
    setStage("code");
    setResendIn(RESEND_SECONDS);
  };

  const verify = async (value: string) => {
    setBusy(true);
    const ok = await checkCode(value);
    setBusy(false);
    if (ok) onVerified(normalizePhone(phone));
    else setError(`Enter the ${CODE_LENGTH}-digit code from the text.`);
  };

  if (stage === "number") {
    return (
      <form onSubmit={send} className="grid gap-4" noValidate>
        <TextField
          id="phone"
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setError(null);
          }}
          hint="We'll text you a code. Outside India? Start with your country code."
          error={error}
          disabled={busy}
        />
        <Button type="submit" variant="primary" size="lg" loading={busy}>
          {busy ? "Sending code" : submitLabel}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void verify(code);
      }}
      className="grid gap-4"
      noValidate
    >
      <p className="text-[15px] text-muted">
        We texted a code to <span className="font-medium text-ink">{normalizePhone(phone)}</span>.
      </p>
      <TextField
        ref={codeInput}
        id="code"
        label={`${CODE_LENGTH}-digit code`}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={CODE_LENGTH}
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
          setCode(v);
          setError(null);
          if (v.length === CODE_LENGTH) void verify(v);
        }}
        hint="In this preview no text is sent: any 6 digits work."
        error={error}
        disabled={busy}
      />
      <Button type="submit" variant="primary" size="lg" loading={busy} disabled={code.length !== CODE_LENGTH}>
        {busy ? "Checking" : "Verify"}
      </Button>
      <div className="flex items-center justify-between text-[14px]">
        <button type="button" onClick={() => setStage("number")} disabled={busy} className="inline-flex items-center gap-1.5 text-accent-ink hover:underline disabled:opacity-45">
          <ArrowLeft size={14} aria-hidden /> Change number
        </button>
        <button type="button" onClick={() => void send()} disabled={busy || resendIn > 0} className="text-accent-ink tabular-nums hover:underline disabled:text-muted disabled:no-underline">
          {resendIn ? `Resend in ${resendIn}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

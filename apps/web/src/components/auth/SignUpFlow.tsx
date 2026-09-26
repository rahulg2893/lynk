"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Copy, Info } from "@phosphor-icons/react";
import { Button, buttonClass } from "@/components/ui/controls";
import { TextField } from "@/components/ui/Field";
import { PhotoPicker } from "@/components/account/PhotoPicker";
import { UsernameStatus, usernameError } from "@/components/account/UsernameStatus";
import { PhoneVerify } from "./PhoneVerify";
import { createAccount, updateAccount, useAccount } from "@/lib/account";
import { useUsername } from "@/lib/use-username";
import { MOTION } from "@/lib/motion";

type Step = 1 | 2 | 3;

/**
 * Name and username, then your phone number confirmed with a texted code,
 * then a welcome that gets people into their chats straight away.
 */
export function SignUpFlow({ next }: { next: string }) {
  const router = useRouter();
  const account = useAccount();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [username, setUsername] = useState("");
  const [copied, setCopied] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const check = useUsername(username);

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    if (step > 1) heading.current?.focus();
  }, [step]);

  const nameError = nameTouched && !name.trim() ? "Enter the name friends know you by." : null;
  const canContinue = name.trim().length > 0 && check.kind === "available";

  const create = (phone: string) => {
    createAccount({ name: name.trim(), username: username.trim(), phone });
    setStep(3);
  };

  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/invite/${username.trim()}` : "";

  const variants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-3" aria-hidden={step === 3}>
        <div className="flex flex-1 gap-1.5">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-accent" : "bg-surface-2"}`} />
          ))}
        </div>
        <p className="text-[13px] text-muted tabular-nums">Step {step} of 3</p>
      </div>

      {account?.session && step === 1 ? (
        <p role="status" className="mb-6 flex items-start gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-[14px]">
          <Info size={18} className="mt-px shrink-0 text-accent-ink" aria-hidden />
          <span>
            You&apos;re signed in as @{account.profile.username}. A new account replaces it on this browser.{" "}
            <Link href="/app" className="font-medium text-accent-ink hover:underline">
              Go to your chats
            </Link>
          </span>
        </p>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ ...MOTION.item, opacity: { duration: 0.15 } }}
        >
          {step === 1 ? (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setNameTouched(true);
                if (canContinue) setStep(2);
              }}
            >
              <h1 className="text-4xl leading-tight tracking-tight">Make your account.</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Your name is what friends see in chats. Your username is how they find you.
              </p>
              <div className="mt-8 grid gap-5">
                <TextField
                  id="name"
                  label="Name"
                  placeholder="Rahul Gandhi"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  error={nameError}
                  maxLength={40}
                  required
                />
                <TextField
                  id="new-username"
                  label="Username"
                  prefix="@"
                  placeholder="yourname"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  hint={check.kind === "idle" ? "3 to 20 characters: lowercase letters, numbers, dots and underscores." : undefined}
                  status={<UsernameStatus state={check} onPick={setUsername} />}
                  error={usernameError(check)}
                  maxLength={20}
                  required
                />
                <Button type="submit" variant="primary" size="lg" disabled={!canContinue} className="mt-1">
                  Continue <ArrowRight size={18} weight="bold" aria-hidden />
                </Button>
              </div>
              <p className="mt-10 text-center text-[15px] text-muted">
                Already on Lynk?{" "}
                <Link href={`/sign-in${next !== "/app" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent-ink hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          ) : null}

          {step === 2 ? (
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="-ml-2 mb-4 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-[15px] text-accent-ink hover:bg-accent-soft"
              >
                <ArrowLeft size={18} aria-hidden /> Back
              </button>
              <h1 ref={heading} tabIndex={-1} className="text-4xl leading-tight tracking-tight outline-none">
                What&apos;s your number?
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                @{username.trim()} is yours. You&apos;ll sign in with your phone number and a code we text you. Friends find you by
                username and never see your number.
              </p>
              <div className="mt-8">
                <PhoneVerify submitLabel="Send code" onVerified={create} />
              </div>
            </div>
          ) : null}

          {step === 3 && account ? (
            <div>
              <h1 ref={heading} tabIndex={-1} className="text-4xl leading-tight tracking-tight outline-none">
                Welcome to Lynk, {account.profile.name.split(" ")[0]}.
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                You&apos;re all set. Add a photo if you like, then bring your people over.
              </p>

              <div className="mt-8 grid gap-6">
                <PhotoPicker
                  name={account.profile.name}
                  photo={account.profile.photo}
                  onChange={(photo) => updateAccount((a) => ({ ...a, profile: { ...a.profile, photo } }))}
                />

                <div className="rounded-3xl border border-line bg-surface p-5">
                  <p className="font-semibold">Your invite link</p>
                  <p className="mt-1 text-[14px] text-muted">Send it to anyone. It opens a chat with you.</p>
                  <div className="mt-3 flex items-center gap-2 rounded-full bg-bg py-1 pr-1 pl-4">
                    <span className="min-w-0 flex-1 truncate text-[14px]">{inviteLink.replace(/^https?:\/\//, "")}</span>
                    <Button
                      size="sm"
                      variant={copied ? "secondary" : "ink"}
                      onClick={() => {
                        navigator.clipboard?.writeText(inviteLink).then(
                          () => setCopied(true),
                          () => setCopied(false),
                        );
                      }}
                    >
                      {copied ? <Check size={14} weight="bold" aria-hidden /> : <Copy size={14} aria-hidden />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <button type="button" onClick={() => router.push(next)} className={buttonClass("primary", "lg", "w-full")}>
                  Open Lynk <ArrowRight size={18} weight="bold" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

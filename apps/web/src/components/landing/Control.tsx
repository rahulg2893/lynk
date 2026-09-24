"use client";

import { useState } from "react";
import { ShieldCheck } from "@phosphor-icons/react";
import { FadeIn } from "@/components/motion/FadeIn";

const SETTINGS = [
  { id: "ai-search", label: "Smart search", hint: "Search your chats by meaning", on: true },
  { id: "ai-memory", label: "Plans and reminders", hint: "Spot plans, to-dos and little facts", on: true },
  { id: "ai-voice", label: "Voice transcription", hint: "Transcribe voice messages", on: true },
  { id: "ai-translate", label: "Translation", hint: "Show messages in each member's language", on: false },
];

/** Privacy section with a working example of the smart-feature settings. */
export function Control() {
  const [values, setValues] = useState(() => Object.fromEntries(SETTINGS.map((s) => [s.id, s.on])));

  return (
    <section id="privacy" className="px-4 py-24 md:px-6 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <FadeIn inView>
          <ShieldCheck size={30} className="text-accent-ink" aria-hidden />
          <h2 className="mt-4 max-w-[16ch] text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl">
            Every chat is end-to-end encrypted.
          </h2>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-muted">
            Only the people in a chat can read it. Not Lynk, not anyone else. The smart features run on your own
            device, Lynk never shows ads or sells your data, and every smart feature can be switched off.
          </p>
        </FadeIn>

        <FadeIn inView delay={0.08}>
          <fieldset className="rounded-3xl border border-line bg-surface p-2 shadow-soft">
            <legend className="sr-only">Your smart features (example)</legend>
            <p className="px-4 pt-3 pb-2 text-[12px] font-semibold text-muted">
              Your smart features
            </p>
            {SETTINGS.map((s) => (
              <label
                key={s.id}
                htmlFor={s.id}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl px-4 py-3.5 hover:bg-bg"
              >
                <span>
                  <span className="block font-medium">{s.label}</span>
                  <span className="block text-sm text-muted">{s.hint}</span>
                </span>
                <input
                  id={s.id}
                  type="checkbox"
                  checked={values[s.id]}
                  onChange={(e) => setValues((v) => ({ ...v, [s.id]: e.target.checked }))}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-7 w-12 shrink-0 rounded-full bg-surface-2 transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:after:translate-x-5"
                />
              </label>
            ))}
          </fieldset>
        </FadeIn>
      </div>
    </section>
  );
}

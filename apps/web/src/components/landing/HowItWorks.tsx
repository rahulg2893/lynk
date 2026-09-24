"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { ChatsCircle, Check, CheckCircle, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { Avatar } from "@/components/chat/primitives";
import { FadeIn } from "@/components/motion/FadeIn";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { MOTION } from "@/lib/motion";

const STEPS = [
  {
    icon: ChatsCircle,
    title: "Talk as usual",
    body: "One-to-one and group chats, replies, reactions and voice notes. Messages arrive instantly.",
  },
  {
    icon: CheckCircle,
    title: "Save what matters",
    body: "Lynk spots plans and to-dos in the chat. Nothing is saved until someone taps save.",
  },
  {
    icon: MagnifyingGlass,
    title: "Find it again",
    body: "Ask in plain words and jump straight to the message, photo or voice-note moment.",
  },
];

/**
 * A pinned scroll story (taste skill, sticky pattern): the section holds while
 * you scroll through three steps, and the preview changes with each one. The
 * motion carries the explanation, so it earns its place. On small screens and
 * under reduced motion it becomes a plain list with a preview per step.
 */
export function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <section id="how" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 pt-24 md:px-6 md:pt-32">
        <FadeIn inView>
          <h2 className="max-w-[20ch] text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl">
            It still feels like just chatting.
          </h2>
        </FadeIn>
      </div>
      {reduce ? <StaticSteps /> : <PinnedSteps />}
    </section>
  );
}

function PinnedSteps() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Three discrete states, so React only re-renders twice across the scroll.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
    setStep((s) => (s === next ? s : next));
  });

  return (
    <>
      <div className="md:hidden">
        <StaticSteps />
      </div>
      <div ref={ref} className="relative hidden h-[240vh] md:block">
        <div className="sticky top-0 flex h-dvh items-center">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-12 items-center gap-10 px-6">
            <div className="relative col-span-5">
              <div aria-hidden className="absolute top-2 bottom-2 left-0 w-px bg-line">
                <motion.div className="h-full w-full origin-top bg-accent" style={{ scaleY: scrollYProgress }} />
              </div>
              <ol className="grid gap-10 pl-8">
                {STEPS.map(({ icon: Icon, title, body }, i) => (
                  <li
                    key={title}
                    aria-current={i === step ? "step" : undefined}
                    className="transition-colors duration-500"
                  >
                    <Icon
                      size={24}
                      className={`transition-opacity duration-500 ${i === step ? "text-accent-ink" : "text-muted opacity-50"}`}
                      aria-hidden
                    />
                    <h3
                      className={`mt-3 text-2xl font-semibold tracking-tight transition-colors duration-500 ${i === step ? "text-ink" : "text-muted"}`}
                    >
                      {title}
                    </h3>
                    <p className="mt-2 max-w-[38ch] leading-relaxed text-muted">{body}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="col-span-6 col-start-7">
              <div className="relative h-[26rem] overflow-hidden rounded-3xl border border-line bg-bg p-6 shadow-soft">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={MOTION.fade}
                    className="h-full"
                  >
                    <Preview step={step} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StaticSteps() {
  return (
    <ol className="mx-auto grid max-w-7xl gap-14 px-4 py-16 md:grid-cols-3 md:px-6 md:py-24">
      {STEPS.map(({ icon: Icon, title, body }, i) => (
        <li key={title}>
          <Icon size={24} className="text-accent-ink" aria-hidden />
          <h3 className="mt-3 text-xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 max-w-[38ch] leading-relaxed text-muted">{body}</p>
          <div className="mt-6 rounded-3xl border border-line bg-bg p-5">
            <Preview step={i} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Preview({ step }: { step: number }) {
  if (step === 0) {
    return (
      <ul className="grid gap-3" aria-label="Example group chat">
        {[
          { id: "amara", name: "Amara", text: "Saturday morning works for me" },
          { id: "tomas", name: "Tomás", text: "Sunday's better, but I can do Saturday" },
          { id: "jonas", name: "Jonas", text: "Saturday 10am at Boulder Barn then?" },
          { id: "amara", name: "Amara", text: "Perfect, see you all there" },
        ].map((m, i) => (
          <li key={i} className="flex items-start gap-3">
            <Avatar id={m.id} name={m.name} size={32} />
            <p className="rounded-2xl rounded-tl-md bg-surface px-3.5 py-2 text-[15px] shadow-soft">
              <span className="block text-[12px] font-semibold text-muted">{m.name}</span>
              {m.text}
            </p>
          </li>
        ))}
      </ul>
    );
  }
  if (step === 1) {
    return (
      <div className="flex h-full flex-col justify-center gap-3">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
            <Sparkle size={13} weight="fill" className="text-accent-ink" /> Plan spotted
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight">Climbing, Saturday 10am</p>
          <p className="mt-1 text-sm text-muted">Boulder Barn with Amara, Tomás and Jonas</p>
          <div className="mt-4 flex gap-2">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-on-accent">
              <Check size={15} weight="bold" /> Save plan
            </span>
            <span className="inline-flex h-9 items-center rounded-full border border-line px-4 text-sm font-medium">
              Dismiss
            </span>
          </div>
        </div>
        <p className="text-center text-[13px] text-muted">Everyone in the chat sees it once it&apos;s saved.</p>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-3 text-[15px] shadow-soft">
        <MagnifyingGlass size={17} className="text-muted" aria-hidden />
        Where did Mei say that ramen place was?
      </div>
      <p className="px-1 text-lg leading-relaxed">
        Ramen Ya on Mill Street. Mei said to get the spicy miso
        <sup className="ml-0.5 rounded-full bg-accent px-1.5 text-[10px] text-on-accent">1</sup>.
      </p>
      <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
        <p className="text-[12px] text-muted">Mei Lin, 3 days ago</p>
        <p className="mt-1">&ldquo;You have to try Ramen Ya on Mill Street, the spicy miso is unreal&rdquo;</p>
      </div>
    </div>
  );
}

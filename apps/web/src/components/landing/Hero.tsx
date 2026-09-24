import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react/ssr";
import { FadeIn } from "@/components/motion/FadeIn";
import { FriendFan } from "./FriendFan";

/**
 * Centred hero inspired by the Lumio reference: a display-serif headline on a
 * light haze, two floating chips, and a fan of friends underneath. The haze
 * stays cool and neutral so it sits inside the Apple-grey system.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-4 pt-28 pb-12 md:px-6 md:pt-36">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 10%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%), radial-gradient(50% 45% at 85% 20%, color-mix(in oklab, #f5a524 10%, transparent), transparent 70%), radial-gradient(70% 60% at 50% 100%, color-mix(in oklab, var(--accent) 8%, transparent), transparent 70%)",
        }}
      />

      {/* Floating chips beside the headline (wide screens only) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden h-full max-w-6xl xl:block">
        <FadeIn delay={0.5} y={8} className="absolute top-52 left-0 -rotate-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium shadow-soft">
            <CheckCircle size={18} weight="fill" className="text-positive" />
            Plan saved: Saturday 10am
          </span>
        </FadeIn>
        <FadeIn delay={0.6} y={8} className="absolute top-72 right-0 rotate-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-xl leading-none shadow-soft">
            {["👍", "❤️", "😂", "🥳", "😮"].map((e) => (
              <span key={e} className="inline-block w-6 text-center">
                {e}
              </span>
            ))}
          </span>
        </FadeIn>
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <FadeIn>
          <h1 className="mx-auto max-w-[16ch] text-5xl leading-[1.05] text-balance md:text-7xl">
            Talk to your people. Keep the plan.
          </h1>
        </FadeIn>
        <FadeIn delay={0.08}>
          <p className="mx-auto mt-6 max-w-[46ch] text-lg leading-relaxed text-muted">
            A chat app for friends and family that remembers plans, lists and the little things people tell you.
          </p>
        </FadeIn>
        <FadeIn delay={0.16} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-medium whitespace-nowrap text-bg shadow-soft transition-transform active:scale-[0.98]"
          >
            Open Lynk
            <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center rounded-full px-5 py-3.5 font-medium whitespace-nowrap text-accent-ink hover:underline"
          >
            See how it works
          </a>
        </FadeIn>
      </div>

      <FriendFan />
    </section>
  );
}

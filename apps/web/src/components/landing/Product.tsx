import { ArrowDown, GitBranch, MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { FadeIn } from "@/components/motion/FadeIn";

const SIDE_CHATS = [
  { name: "Weekend climbers", count: 312, depth: 0 },
  { name: "Best climbing shoes under $100", count: 9, depth: 1 },
  { name: "Carpool for Saturday", count: 14, depth: 1 },
  { name: "Birthday surprise for Amara", count: 23, depth: 1 },
];

const CATCH_UP = [
  { label: "Family", value: "Mum lands Friday 6:40pm. You're picking her up." },
  { label: "Flat 4B", value: "Landlord comes Tuesday about the boiler." },
  { label: "Climbers", value: "Amara asked you to bring the chalk bag." },
];

const REMEMBERED = [
  { who: "Amara", value: "Birthday on October 3" },
  { who: "Mei", value: "Vegetarian" },
  { who: "Mum", value: "Off sugar, loves cooking at home" },
];

/** Five things Lynk does, each shown as a small, honest piece of UI. */
export function Product() {
  return (
    <section id="features" className="px-4 py-24 md:px-6 md:py-32">
      <div className="mx-auto max-w-7xl">
        <FadeIn inView>
          <h2 className="max-w-[18ch] text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl">
            Stop scrolling up to find the address.
          </h2>
          <p className="mt-4 max-w-[52ch] text-lg text-muted">
            Plans, lists, places and birthdays get pulled out of the chat and kept where you can see them.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-4 md:grid-cols-12">
          {/* Search */}
          <FadeIn inView className="flex flex-col rounded-3xl bg-stage p-7 text-on-stage md:col-span-7 md:row-span-2 md:p-9">
            <div className="flex items-center gap-2 rounded-full border border-stage-line bg-stage-2 px-4 py-3 text-[15px]">
              <MagnifyingGlass size={17} className="text-on-stage-muted" aria-hidden />
              Where did Mei say that ramen place was?
            </div>
            <p className="mt-5 text-lg leading-relaxed">
              Ramen Ya on Mill Street. Mei said to get the spicy miso
              <sup className="ml-0.5 rounded bg-accent px-1 text-[11px] text-on-accent">1</sup>.
            </p>
            <div className="mt-4 rounded-2xl border border-stage-line bg-stage-2 p-4 text-sm">
              <p className="text-[12px] text-on-stage-muted">1 · Mei Lin, 3 days ago</p>
              <p className="mt-1">&ldquo;You have to try Ramen Ya on Mill Street, the spicy miso is unreal&rdquo;</p>
            </div>
            <h3 className="mt-8 text-2xl font-semibold tracking-tight md:mt-auto md:pt-10">Ask the way you&apos;d ask a friend</h3>
            <p className="mt-2 max-w-[44ch] text-on-stage-muted">
              Search by meaning, not exact words. Every answer points to the message it came from.
            </p>
          </FadeIn>

          {/* Catch-up */}
          <FadeIn inView delay={0.06} className="rounded-3xl bg-accent-soft p-7 md:col-span-5">
            <p className="text-[12px] font-semibold text-muted">
              While you were away · 126 messages
            </p>
            <dl className="mt-3 grid gap-2.5">
              {CATCH_UP.map((row) => (
                <div key={row.label} className="grid grid-cols-[5.5rem_1fr] gap-3 text-sm">
                  <dt className="font-semibold">{row.label}</dt>
                  <dd className="text-muted">{row.value}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-6 text-xl font-semibold tracking-tight">Catch up on busy group chats</h3>
            <p className="mt-1.5 text-muted">The parts that involve you, not a wall of summary.</p>
          </FadeIn>

          {/* Plans */}
          <FadeIn inView delay={0.12} className="rounded-3xl border border-line bg-surface p-7 md:col-span-5">
            <div className="grid justify-items-start gap-2">
              <span className="rounded-full border border-line px-4 py-2 text-sm text-muted line-through decoration-muted/60">
                Climbing, Sunday
              </span>
              <ArrowDown size={16} className="ml-4 text-muted" aria-label="changed to" />
              <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg">
                Climbing, Saturday 10am <span className="ml-1 text-[12px] opacity-70">saved</span>
              </span>
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-tight">Plans everyone can see</h3>
            <p className="mt-1.5 text-muted">Lynk spots the plan. Someone taps save. Changes keep their history.</p>
          </FadeIn>

          {/* Side chats */}
          <FadeIn inView className="rounded-3xl border border-line bg-surface p-7 md:col-span-6">
            <p className="flex items-center gap-2 text-sm font-medium text-muted">
              <GitBranch size={18} className="text-accent-ink" aria-hidden /> Side chats
            </p>
            <ul className="mt-4 grid gap-1.5" aria-label="Example side chats">
              {SIDE_CHATS.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 odd:bg-bg"
                  style={{ marginLeft: c.depth * 22 }}
                >
                  <span className={`truncate text-[15px] ${c.depth === 0 ? "font-semibold" : ""}`}>{c.name}</span>
                  <span className="shrink-0 text-[12px] text-muted tabular-nums">{c.count}</span>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-xl font-semibold tracking-tight">Tangents get their own space</h3>
            <p className="mt-1.5 text-muted">Plan the surprise party without flooding the main chat.</p>
          </FadeIn>

          {/* Remembered */}
          <FadeIn
            inView
            delay={0.06}
            className="relative overflow-hidden rounded-3xl border border-line bg-surface p-7 md:col-span-6"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-60"
              style={{ backgroundImage: "radial-gradient(var(--line) 1.2px, transparent 1.2px)", backgroundSize: "18px 18px" }}
            />
            <ul className="relative grid gap-2">
              {REMEMBERED.map((r) => (
                <li key={r.value} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
                  <span className="w-14 shrink-0 font-semibold">{r.who}</span>
                  <span className="text-muted">{r.value}</span>
                </li>
              ))}
            </ul>
            <h3 className="relative mt-6 text-xl font-semibold tracking-tight">The little things, remembered</h3>
            <p className="relative mt-1.5 text-muted">Birthdays, allergies and favourite places, linked to where they were said.</p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

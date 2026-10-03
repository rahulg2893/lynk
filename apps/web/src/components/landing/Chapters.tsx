"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, At, GitBranch, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { Avatar } from "@/components/chat/primitives";
import { FadeIn } from "@/components/motion/FadeIn";
import { DecisionPreview } from "./DecisionPreview";
import { UpNextPreview } from "./UpNextPreview";

/**
 * Feature chapters in alternating rows: words on one side, a working piece
 * of the product on the other. Each visual drifts against the scroll on a
 * spring and tilts toward the pointer, so the page feels layered.
 */
export function Chapters() {
  return (
    <section id="features" className="overflow-x-clip px-5 py-24 md:px-8 md:py-36">
      <div className="mx-auto max-w-7xl">
        <FadeIn inView>
          <p className="text-[14px] font-semibold text-accent-ink">What makes Lynk different</p>
          <h2 className="mt-4 max-w-[20ch] text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.02] text-balance">
            A group chat that pays attention for you.
          </h2>
        </FadeIn>

        <div className="mt-20 grid gap-28 md:mt-28 md:gap-40">
          <Chapter
            label="Plans"
            title="When everyone agrees, Lynk writes it down."
            body="It notices the moment a time and place land, and asks before saving anything. Tap once and the plan is there for everyone, with a calendar invite."
            visual={<DecisionPreview />}
          />
          <Chapter
            flip
            label="Getting there"
            title="Everyone knows. Everyone shows up."
            body="Every chat pins what's next: the plan, who's coming, the address and who's bringing what. One tap asks whoever hasn't answered, and you get a reminder an hour before."
            visual={<UpNextPreview />}
          />
          <Chapter
            label="Groups"
            title="Big groups, without the noise."
            body="Mention someone and they'll see it first. Split off a side chat for the surprise party, and the main chat stays calm."
            visual={<GroupsVisual />}
          />
          <Chapter
            flip
            label="Find it again"
            title="Ask it like you'd ask a friend."
            body="Where did Mei say that ramen place was? Ask in plain words and jump straight to the message it came from."
            visual={<SearchVisual />}
          />
          <Chapter
            label="Memories"
            title="The little things, remembered."
            body="Birthdays, allergies, favourite places. Kept inside the chat they came from, and the person they're about can always remove them."
            visual={<MemoriesVisual />}
          />
        </div>
      </div>
    </section>
  );
}

function Chapter({ label, title, body, visual, flip = false }: { label: string; title: string; body: string; visual: ReactNode; flip?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [70, -70]), { stiffness: 80, damping: 20 });
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [flip ? -2 : 2, 0, flip ? 2 : -2]);

  return (
    <div ref={ref} className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
      <FadeIn inView className={flip ? "md:order-2" : ""}>
        <p className="text-[14px] font-semibold text-accent-ink">{label}</p>
        <h3 className="mt-3 max-w-[18ch] text-[clamp(2rem,3.6vw,3.2rem)] leading-[1.05] text-balance">{title}</h3>
        <p className="mt-5 max-w-[44ch] text-lg leading-relaxed text-muted">{body}</p>
        <Link href="/sign-up" className="group mt-7 inline-flex items-center gap-1.5 font-medium text-accent-ink">
          Try it free
          <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </FadeIn>
      <motion.div style={{ y, rotate }} className={`relative ${flip ? "md:order-1" : ""}`}>
        <div aria-hidden className="absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(50%_50%_at_50%_50%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)]" />
        <Tilt>{visual}</Tilt>
      </motion.div>
    </div>
  );
}

/** Leans a card toward the pointer on a spring. */
function Tilt({ children }: { children: ReactNode }) {
  const rx = useSpring(0, { stiffness: 150, damping: 15 });
  const ry = useSpring(0, { stiffness: 150, damping: 15 });
  return (
    <div className="[perspective:1200px]">
      <motion.div
        style={{ rotateX: rx, rotateY: ry }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
          rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10);
        }}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** A mention that lights up, and side chats that branch off as you scroll. */
function GroupsVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 45%"] });
  const draw = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });
  const branches = [
    { name: "Surprise party for Amara", count: 23 },
    { name: "Carpool for Saturday", count: 14 },
    { name: "Shoes under $100", count: 9 },
  ];

  return (
    <div ref={ref} className="rounded-3xl border border-line bg-surface p-6 shadow-soft md:p-8">
      <div className="flex items-start gap-3">
        <Avatar id="tomas" name="Tomás Rivera" size={36} />
        <div>
          <p className="text-[13px] font-semibold">Tomás</p>
          <p className="text-[16px]">
            <span className="rounded-md bg-accent-soft px-1 font-semibold text-accent-ink">@You</span> can you drive on Saturday?
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-accent-ink">
            <At size={13} weight="bold" aria-hidden /> You were mentioned
          </p>
        </div>
      </div>
      <div className="relative mt-6 pl-5">
        <svg aria-hidden className="absolute top-0 left-0 h-full w-5 overflow-visible" viewBox="0 0 20 100" preserveAspectRatio="none">
          <motion.path d="M2 0 V100" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ pathLength: draw }} vectorEffect="non-scaling-stroke" />
        </svg>
        <ul className="grid gap-2.5">
          {branches.map((b, i) => (
            <motion.li
              key={b.name}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "0px 0px -20% 0px" }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.15 + i * 0.12 }}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-bg px-4 py-3"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <GitBranch size={16} className="shrink-0 text-accent-ink" aria-hidden />
                <span className="truncate text-[15px] font-medium">{b.name}</span>
              </span>
              <span className="shrink-0 text-[12px] text-muted tabular-nums">{b.count}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const QUESTION = "Where did Mei say that ramen place was?";

/** The question types itself when it scrolls into view, then the answer arrives with its source. */
function SearchVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -25% 0px" });
  const [typed, setTyped] = useState(0);
  const count = typed;
  const done = count >= QUESTION.length;

  useEffect(() => {
    if (!inView || typed >= QUESTION.length) return;
    const t = window.setTimeout(() => setTyped((n) => n + 1), 32);
    return () => window.clearTimeout(t);
  }, [inView, typed]);

  return (
    <div ref={ref} className="stage-dark rounded-3xl p-6 shadow-soft md:p-8">
      <div className="flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.06] px-4 py-3.5 text-[15px]">
        <MagnifyingGlass size={18} className="shrink-0 text-white/60" aria-hidden />
        <span>
          {QUESTION.slice(0, count)}
          {!done ? <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-white" aria-hidden /> : null}
        </span>
      </div>
      <motion.div initial={false} animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }} transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.25 }}>
        <p className="mt-6 flex items-center gap-1.5 text-[12px] font-semibold text-white/55">
          <Sparkle size={13} weight="fill" className="text-[#5aa0ff]" aria-hidden /> Answer, with its source
        </p>
        <p className="mt-2 text-xl leading-relaxed">
          Ramen Ya on Mill Street. Mei said to get the spicy miso
          <sup className="ml-0.5 rounded-full bg-[#0071e3] px-1.5 text-[11px]">1</sup>
        </p>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <Avatar id="mei" name="Mei Lin" size={28} />
          <p className="text-[14px] text-white/80">
            <span className="block text-[12px] text-white/50">Mei Lin · 3 days ago</span>
            &ldquo;You have to try Ramen Ya on Mill Street, the spicy miso is unreal&rdquo;
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/** Three memory cards that fan out as the section passes. */
function MemoriesVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 90%", "center 50%"] });
  const spread = useSpring(scrollYProgress, { stiffness: 70, damping: 18 });
  const cards = [
    { who: "amara", name: "Amara", kind: "Birthday", value: "October 3", from: "Amara Okafor" },
    { who: "mei", name: "Mei", kind: "Food", value: "Vegetarian", from: "Weekend climbers" },
    { who: "sofia", name: "Mum", kind: "Health", value: "Off sugar, loves cooking at home", from: "Family" },
  ];
  return (
    <div ref={ref} className="relative mx-auto h-[23rem] max-w-md">
      {cards.map((c, i) => (
        <MemoryCard key={c.value} card={c} i={i} spread={spread} />
      ))}
    </div>
  );
}

function MemoryCard({
  card,
  i,
  spread,
}: {
  card: { who: string; name: string; kind: string; value: string; from: string };
  i: number;
  spread: ReturnType<typeof useSpring>;
}) {
  const offset = i - 1;
  const rotate = useTransform(spread, [0, 1], [0, offset * 7]);
  const x = useTransform(spread, [0, 1], [0, offset * 44]);
  const y = useTransform(spread, [0, 1], [i * 10, i * 118]);
  return (
    <motion.div
      style={{ rotate, x, y }}
      drag
      dragSnapToOrigin
      dragElastic={0.5}
      whileDrag={{ scale: 1.05, zIndex: 20 }}
      className="absolute inset-x-0 top-0 cursor-grab rounded-3xl border border-line bg-surface p-5 shadow-soft active:cursor-grabbing"
    >
      <div className="flex items-center gap-3">
        <Avatar id={card.who} name={card.name} size={40} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
            <Sparkle size={12} weight="fill" className="text-accent-ink" aria-hidden /> {card.kind} · {card.name}
          </p>
          <p className="truncate text-[17px] font-semibold tracking-tight">{card.value}</p>
          <p className="text-[12px] text-muted">From {card.from}</p>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowRight, CalendarCheck, CheckCircle, Heart, ShieldCheck } from "@phosphor-icons/react";
import { PhoneMock } from "./PhoneMock";
import { Magnetic, SPRING_LAZY, SplitWords } from "@/components/motion/physics";

const FRIENDS = [
  { photo: "/people/amara.jpg", name: "Amara", x: "-8%", y: "14%", depth: 38, size: 64 },
  { photo: "/people/jonas.jpg", name: "Jonas", x: "88%", y: "6%", depth: 52, size: 56 },
  { photo: "/people/mei.jpg", name: "Mei", x: "94%", y: "58%", depth: 30, size: 60 },
  { photo: "/people/tomas.jpg", name: "Tomás", x: "-12%", y: "66%", depth: 46, size: 52 },
  { photo: "/people/sofia.jpg", name: "Sofia", x: "-24%", y: "88%", depth: 24, size: 44 },
];

const CHIPS = [
  { icon: CheckCircle, tint: "text-[#30d158]", text: "Plan saved · Sat 10am", x: "-52%", y: "36%", depth: 60 },
  { icon: Heart, tint: "text-[#ff6961]", text: "Amara's birthday · Oct 3", x: "76%", y: "82%", depth: 70 },
  { icon: CalendarCheck, tint: "text-[#5aa0ff]", text: "Added to 4 calendars", x: "78%", y: "22%", depth: 44 },
];

/**
 * The opening stage. Dark in both themes, like a product launch: the glow
 * follows the pointer on a lazy spring, the phone tilts in 3D toward it, and
 * friends and moments float at different depths. Grab one and throw it; it
 * springs home. Scrolling lifts the headline away and sinks the phone.
 */
export function HeroStage() {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.4);
  const sx = useSpring(px, SPRING_LAZY);
  const sy = useSpring(py, SPRING_LAZY);

  const gx = useTransform(sx, (v) => `${v * 100}%`);
  const gy = useTransform(sy, (v) => `${v * 100}%`);
  const glow = useMotionTemplate`radial-gradient(700px circle at ${gx} ${gy}, rgb(47 123 255 / 0.30), transparent 60%)`;
  const rotateY = useTransform(sx, [0, 1], [-14, 14]);
  const rotateX = useTransform(sy, [0, 1], [10, -10]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const phoneScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  return (
    <section
      ref={ref}
      className="stage-dark relative isolate overflow-hidden"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
    >
      {/* Light that follows you, a faint grid, and a horizon glow. */}
      <motion.div aria-hidden className="absolute inset-0 -z-10" style={{ background: glow }} />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "64px 64px" }}
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[radial-gradient(60%_60%_at_50%_100%,rgb(31_95_224/0.35),transparent_70%)]" />

      <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-16 px-5 pt-28 pb-16 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-24">
        <motion.div style={{ y: copyY, opacity: copyOpacity }}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-[13px] text-white/80 backdrop-blur"
          >
            <ShieldCheck size={15} weight="fill" className="text-[#5aa0ff]" aria-hidden />
            Private by design. No ads, ever.
          </motion.p>
          <h1 className="mt-7 text-[clamp(2.6rem,4.9vw,4.6rem)] leading-[1.02] tracking-[-0.02em] text-balance">
            <SplitWords text="Talk to your people." delay={0.15} />
            <br />
            <SplitWords text="Keep the plan." delay={0.45} wordClassName="bg-linear-to-br from-[#8ec0ff] to-[#dfe7f7] bg-clip-text text-transparent" />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-[46ch] text-lg leading-relaxed text-white/70 md:text-xl"
          >
            The chat app for friends and family that quietly remembers plans, lists and the little things people tell you.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <Link
                href="/sign-up"
                className="group inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 text-[16px] font-medium text-[#0b0c10] shadow-[0_10px_40px_-10px_rgb(90_160_255/0.6)] transition-transform active:scale-[0.97]"
              >
                Get started, it&apos;s free
                <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Link href="/app" className="inline-flex h-14 items-center rounded-full px-6 text-[16px] font-medium text-white/85 transition-colors hover:bg-white/10">
              Open on the web
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-12 flex items-center gap-4"
          >
            <div className="flex -space-x-2.5">
              {FRIENDS.slice(0, 4).map((f) => (
                <Image key={f.name} src={f.photo} alt="" width={72} height={72} className="size-9 rounded-[11px] object-cover ring-2 ring-[#07090f]" />
              ))}
            </div>
            <p className="text-[14px] leading-snug text-white/60">
              For families, flatmates, clubs
              <br />
              and every group that makes plans.
            </p>
          </motion.div>
        </motion.div>

        {/* The phone and everything floating around it */}
        <motion.div
          ref={stage}
          style={{ y: phoneY, scale: phoneScale }}
          className="relative mx-auto w-full max-w-[17.5rem] [perspective:1400px] lg:max-w-[18.5rem]"
        >
          <motion.div
            initial={{ opacity: 0, y: 80, rotateX: 30 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.3 }}
          >
            <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
              <PhoneMock />
            </motion.div>
          </motion.div>

          <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
            {FRIENDS.map((f, i) => (
              <Floater key={f.name} x={f.x} y={f.y} depth={f.depth} sx={sx} sy={sy} delay={0.9 + i * 0.12} constraints={stage}>
                <Image
                  src={f.photo}
                  alt=""
                  width={f.size * 2}
                  height={f.size * 2}
                  draggable={false}
                  className="rounded-[30%] object-cover shadow-[0_20px_40px_-12px_rgb(0_0_0/0.6)] ring-2 ring-white/20"
                  style={{ width: f.size, height: f.size }}
                />
              </Floater>
            ))}
            {CHIPS.map((c, i) => (
              <Floater key={c.text} x={c.x} y={c.y} depth={c.depth} sx={sx} sy={sy} delay={1.6 + i * 0.18} constraints={stage}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#11151f]/80 px-3.5 py-2 text-[13px] font-medium whitespace-nowrap text-white shadow-[0_20px_40px_-12px_rgb(0_0_0/0.6)] backdrop-blur-md">
                  <c.icon size={16} weight="fill" className={c.tint} />
                  {c.text}
                </span>
              </Floater>
            ))}
          </div>
        </motion.div>
      </div>

      <p className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-[12px] text-white/40 lg:block">
        Psst, the floating bits are throwable.
      </p>
    </section>
  );
}

/**
 * One floating element: drifts with the pointer at its own depth (closer
 * things move more), can be dragged and thrown, and springs back home.
 */
function Floater({
  children,
  x,
  y,
  depth,
  sx,
  sy,
  delay,
  constraints,
}: {
  children: React.ReactNode;
  x: string;
  y: string;
  depth: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  delay: number;
  constraints: React.RefObject<HTMLDivElement | null>;
}) {
  const dx = useTransform(sx, [0, 1], [depth, -depth]);
  const dy = useTransform(sy, [0, 1], [depth * 0.6, -depth * 0.6]);

  return (
    <motion.div className="absolute" style={{ left: x, top: y, x: dx, y: dy }}>
      <motion.div
        className="pointer-events-auto cursor-grab active:cursor-grabbing"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay }}
        drag
        dragConstraints={constraints}
        dragElastic={0.7}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 260, bounceDamping: 12 }}
        whileDrag={{ scale: 1.12, rotate: -4 }}
        whileHover={{ scale: 1.06 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

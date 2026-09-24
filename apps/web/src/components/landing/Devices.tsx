"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { AndroidLogo, AppleLogo, Globe } from "@phosphor-icons/react";
import { Avatar } from "@/components/chat/primitives";
import { FadeIn } from "@/components/motion/FadeIn";

const ROWS = [
  { id: "amara", name: "Amara Okafor", text: "That ramen place Mei mentioned?", badge: 1 },
  { id: "mei", name: "Mei Lin", text: "I'm fully vegetarian now btw", badge: 0 },
  { id: "tomas", name: "Tomás Rivera", text: "Wait until the last 20 minutes", badge: 0 },
  { id: "jonas", name: "Jonas Weber", text: "I'll leave them at the front desk", badge: 0 },
];

/**
 * Where Lynk runs: a laptop that settles into place as you scroll and a phone
 * that slides in beside it. Honest about what exists today.
 */
export function Devices() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const laptopScale = useTransform(p, [0, 1], [0.86, 1]);
  const laptopRotate = useTransform(p, [0, 1], [18, 0]);
  const phoneX = useTransform(p, [0, 1], [160, 0]);
  const phoneOpacity = useTransform(p, [0.3, 0.9], [0, 1]);

  return (
    <section ref={ref} className="overflow-hidden px-5 py-24 md:px-8 md:py-36">
      <div className="mx-auto max-w-7xl">
        <FadeIn inView className="text-center">
          <p className="text-[14px] font-semibold text-accent-ink">Everywhere your people are</p>
          <h2 className="mx-auto mt-4 max-w-[18ch] text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.02] text-balance">
            Start on the web today. Your phone is next.
          </h2>
        </FadeIn>

        <div className="relative mx-auto mt-16 max-w-5xl [perspective:1600px] md:mt-24">
          <motion.div style={{ scale: laptopScale, rotateX: laptopRotate }} className="origin-bottom">
            {/* Laptop */}
            <div className="rounded-t-[1.4rem] border-[10px] border-b-0 border-[#1d1d1f] bg-[#1d1d1f] shadow-[0_50px_120px_-40px_rgb(0_40_120/0.5)]">
              <div className="flex aspect-[16/10] overflow-hidden rounded-t-md bg-bg">
                <div className="hidden w-14 flex-col items-center gap-3 border-r border-line py-4 sm:flex">
                  <span className="size-6 rounded-lg bg-accent-soft" />
                  <span className="size-6 rounded-lg bg-surface-2" />
                  <span className="size-6 rounded-lg bg-surface-2" />
                </div>
                <div className="w-full border-r border-line p-4 sm:w-2/5">
                  <p className="text-lg font-semibold tracking-tight">Chats</p>
                  <ul className="mt-3 grid gap-1.5">
                    {ROWS.map((r, i) => (
                      <li key={r.id} className={`flex items-center gap-2.5 rounded-xl px-2 py-2 ${i === 0 ? "bg-surface shadow-soft" : ""}`}>
                        <Avatar id={r.id} name={r.name} size={30} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-semibold">{r.name}</span>
                          <span className="block truncate text-[11px] text-muted">{r.text}</span>
                        </span>
                        {r.badge ? <span className="inline-flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-on-accent">1</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hidden flex-1 flex-col justify-end gap-2 p-5 sm:flex">
                  <p className="w-fit rounded-2xl rounded-bl-md bg-surface px-3 py-2 text-[12px] shadow-soft">That ramen place Mei mentioned, want to try it?</p>
                  <p className="w-fit self-end rounded-2xl rounded-br-md bg-accent-soft px-3 py-2 text-[12px]">Yes! Thursday?</p>
                  <div className="mt-2 h-8 rounded-full border border-line bg-surface" />
                </div>
              </div>
            </div>
            <div className="mx-[-4%] h-4 rounded-b-2xl bg-linear-to-b from-[#c7c7cc] to-[#8e8e93] dark:from-[#3a3a3c] dark:to-[#1c1c1e]" />
          </motion.div>

          {/* Phone */}
          <motion.div
            style={{ x: phoneX, opacity: phoneOpacity }}
            className="absolute -right-2 -bottom-8 w-[26%] min-w-[7.5rem] md:-right-10"
          >
            <div className="aspect-[9/19.5] rounded-[2rem] bg-[#0b0c10] p-[6px] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.5)]">
              <div className="flex h-full flex-col gap-1.5 overflow-hidden rounded-[1.6rem] bg-bg p-2.5 pt-6">
                {ROWS.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5 rounded-lg bg-surface p-1.5">
                    <Avatar id={r.id} name={r.name} size={18} />
                    <span className="h-1.5 flex-1 rounded-full bg-surface-2" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <ul className="mx-auto mt-20 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            { icon: Globe, name: "Web", status: "Available now", live: true },
            { icon: AppleLogo, name: "iPhone", status: "Coming next", live: false },
            { icon: AndroidLogo, name: "Android", status: "Coming next", live: false },
          ].map(({ icon: Icon, name, status, live }) => (
            <li key={name} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5">
              <Icon size={24} weight="fill" className={live ? "text-accent-ink" : "text-muted"} aria-hidden />
              <span>
                <span className="block font-semibold">{name}</span>
                <span className="block text-[13px] text-muted">{status}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

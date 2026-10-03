"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { AndroidLogo, AppleLogo, Globe } from "@phosphor-icons/react";
import { FadeIn } from "@/components/motion/FadeIn";

/**
 * Where Lynk runs: a MacBook that settles into place as you scroll and an
 * iPhone that slides in beside it, each showing a real screenshot of the app.
 * Honest about what exists today.
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
            {/* MacBook: black bezel with the camera notch, then the aluminium base with its opening notch. */}
            <div className="relative rounded-t-[1.6rem] bg-[#0b0b0d] p-[1.1%] pb-[1.4%] shadow-[0_50px_120px_-40px_rgb(0_40_120/0.5)] ring-1 ring-[#3a3a3e]">
              <div className="relative overflow-hidden rounded-t-[0.9rem] rounded-b-[0.2rem]">
                <Image
                  src="/devices/web-chat.webp"
                  alt="Lynk on the web: the chat list, and a group chat with its Up next bar and a to-do suggestion"
                  width={2000}
                  height={1250}
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  className="block h-auto w-full"
                />
              </div>
              <span aria-hidden className="absolute top-[1.1%] left-1/2 h-[3%] w-[10%] -translate-x-1/2 rounded-b-[0.6rem] bg-[#0b0b0d]" />
            </div>
            <div aria-hidden className="relative mx-[-6%] h-[clamp(0.6rem,1.6vw,1.1rem)] rounded-t-[0.15rem] rounded-b-[45%_100%] bg-linear-to-b from-[#e2e3e6] via-[#c4c6ca] to-[#8e9095] dark:from-[#4a4b4f] dark:via-[#2c2d30] dark:to-[#141416]">
              <span className="absolute top-0 left-1/2 h-1/2 w-[14%] -translate-x-1/2 rounded-b-lg bg-black/15 dark:bg-black/40" />
            </div>
          </motion.div>

          {/* iPhone 17 Pro: titanium edge, black bezel, Dynamic Island. */}
          <motion.div
            style={{ x: phoneX, opacity: phoneOpacity }}
            className="absolute -right-2 -bottom-10 w-[24%] min-w-[8.5rem] md:-right-10"
          >
            <div className="relative rounded-[18%/8.3%] bg-linear-to-br from-[#9a9ca1] via-[#45464a] to-[#8b8d92] p-[1.6%] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.55)]">
              <span aria-hidden className="absolute top-[20%] -left-[1.2%] h-[6%] w-[1.4%] rounded-l-sm bg-[#6b6d71]" />
              <span aria-hidden className="absolute top-[29%] -left-[1.2%] h-[9%] w-[1.4%] rounded-l-sm bg-[#6b6d71]" />
              <span aria-hidden className="absolute top-[26%] -right-[1.2%] h-[13%] w-[1.4%] rounded-r-sm bg-[#6b6d71]" />
              <div className="rounded-[17%/7.8%] bg-black p-[3.2%]">
                <div className="relative overflow-hidden rounded-[14%/6.5%]">
                  <Image
                    src="/devices/iphone-up-next.webp"
                    alt="Lynk on iPhone: the Up next sheet with a plan, who is going, a to-do and a packing list"
                    width={600}
                    height={1304}
                    sizes="(min-width: 768px) 260px, 34vw"
                    className="block h-auto w-full"
                  />
                  <span aria-hidden className="absolute top-[1.4%] left-1/2 h-[2.9%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <ul className="mx-auto mt-20 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            { icon: Globe, name: "Web", status: "Available now", live: true },
            { icon: AppleLogo, name: "iPhone", status: "In testing, iPhone Duo too", live: false },
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

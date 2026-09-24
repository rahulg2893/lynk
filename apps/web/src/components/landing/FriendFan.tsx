"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { MOTION } from "@/lib/motion";

/** Profile photos for the demo friends (public/people). */
const FRIENDS = [
  { name: "Amara", status: "Planning Saturday", photo: "/people/amara.jpg" },
  { name: "Tomás", status: "Online", photo: "/people/tomas.jpg" },
  { name: "Mei", status: "Online", photo: "/people/mei.jpg" },
  { name: "Jonas", status: "Typing…", photo: "/people/jonas.jpg" },
  { name: "Sofia", status: "Online", photo: "/people/sofia.jpg" },
];

const ROTATE = [-12, -6, 0, 6, 12];
const SHIFT = [-2, -1, 0, 1, 2];
const LIFT = [36, 10, 0, 10, 36];

/**
 * The group, fanned out like a hand of cards. They start stacked and spread on
 * load (it introduces the people the product is about), then lift and
 * straighten on hover. Reduced motion shows the final fan without movement.
 */
export function FriendFan() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto mt-14 max-w-5xl md:mt-16">

      <ul className="relative flex h-[19rem] items-start justify-center md:h-[24rem]" aria-label="Friends on Lynk">
        {FRIENDS.map((f, i) => (
          <motion.li
            key={f.name}
            initial={reduce ? false : { x: 0, y: 40, rotate: 0, opacity: 0 }}
            animate={{ x: `${SHIFT[i] * 84}%`, y: LIFT[i], rotate: ROTATE[i], opacity: 1 }}
            whileHover={reduce ? undefined : { y: LIFT[i] - 18, rotate: 0, scale: 1.04, zIndex: 20 }}
            transition={{ ...MOTION.item, delay: reduce ? 0 : 0.35 + Math.abs(SHIFT[i]) * 0.08 }}
            style={{ zIndex: 10 - Math.abs(SHIFT[i]) }}
            className={[
              "absolute w-36 overflow-hidden rounded-3xl border-4 border-surface bg-surface shadow-[0_18px_40px_rgb(0_0_0/0.14)] md:w-48",
              Math.abs(SHIFT[i]) === 2 ? "hidden sm:block" : "",
            ].join(" ")}
          >
            <div className="relative aspect-[3/4]">
              <Image
                src={f.photo}
                alt={`${f.name}, a friend on Lynk`}
                fill
                sizes="(min-width: 768px) 12rem, 9rem"
                className="object-cover"
                priority={i === 2}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
              {/* Cards right of centre are overlapped on their left, so their labels sit on the right. */}
              <span
                className={`absolute top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-[#1d1d1f] backdrop-blur ${SHIFT[i] > 0 ? "right-2.5" : "left-2.5"}`}
              >
                <span className="size-1.5 rounded-full bg-positive" aria-hidden />
                {f.status}
              </span>
              <p
                className={`absolute right-3 bottom-2.5 left-3 text-base font-semibold text-white ${SHIFT[i] > 0 ? "text-right" : "text-left"}`}
              >
                {f.name}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

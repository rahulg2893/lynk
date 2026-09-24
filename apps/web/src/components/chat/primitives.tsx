"use client";

import { Prohibit, UsersThree } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Image from "next/image";
import { initials, PEOPLE, toneFor, type Chat, type Status } from "@/lib/chat";

/**
 * Graphite monograms with a soft top-to-bottom gradient, in the spirit of
 * Apple Contacts. Six near-identical neutral greys keep people apart without
 * adding colours that compete with the accent. White initials stay at
 * 4.5:1 or better across the whole gradient.
 */
const TONES: [string, string][] = [
  ["#707075", "#4d4d52"],
  ["#6d7077", "#4b4e55"],
  ["#727074", "#504e52"],
  ["#747479", "#525257"],
  ["#6e7174", "#4c4f52"],
  ["#717076", "#4f4e54"],
];

/** Lynk avatars are rounded squares, not circles. */
export function Avatar({
  id,
  name,
  size = 40,
  online,
  group,
  photo: photoOverride,
}: {
  id: string;
  name: string;
  size?: number;
  online?: boolean;
  group?: boolean;
  /** Your own uploaded photo; other people's come from PEOPLE. */
  photo?: string | null;
}) {
  const [from, to] = TONES[toneFor(id)];
  // People with a profile photo show it; everyone else gets a monogram.
  const photo = photoOverride ?? PEOPLE[id]?.photo;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {photo && !group ? (
        <Image
          src={photo}
          alt=""
          width={size * 2}
          height={size * 2}
          // Uploaded photos are data URLs, which the optimiser can't fetch.
          unoptimized={photo.startsWith("data:")}
          className="block size-full object-cover"
          style={{ borderRadius: size * 0.32 }}
        />
      ) : (
      <span
        aria-hidden
        className="inline-flex size-full items-center justify-center font-semibold tracking-tight text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]"
        style={{
          borderRadius: size * 0.32,
          background: `linear-gradient(180deg, ${from}, ${to})`,
          fontSize: size * 0.36,
        }}
      >
        {group ? <UsersThree size={size * 0.46} weight="bold" /> : initials(name)}
      </span>
      )}
      {online ? (
        <span
          className="absolute -right-0.5 -bottom-0.5 size-3 rounded-sm border-2 border-surface bg-positive"
          role="img"
          aria-label="Online"
        />
      ) : null}
    </span>
  );
}

/** The right avatar for any conversation: a person or a group. */
export function ChatAvatar({ chat, size = 40 }: { chat: Chat; size?: number }) {
  return (
    <Avatar
      id={chat.members[0] ?? chat.id}
      name={chat.name}
      size={size}
      online={chat.kind === "dm" && chat.online}
      group={chat.kind === "group"}
    />
  );
}

const STATUS_LABEL: Record<Status, string> = {
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
};

/**
 * Delivery state as a marker on the rail, borrowed from the landing page's
 * timeline square: dashed while sending, outlined once sent, filled when
 * delivered, and an accent diamond once read.
 */
export function StatusNode({ status, className = "" }: { status: Status; className?: string }) {
  const look = {
    sending: "border border-dashed border-muted bg-bg",
    sent: "border border-ink/60 bg-bg",
    delivered: "border border-ink bg-ink",
    read: "border border-accent bg-accent",
  }[status];
  return (
    <motion.span
      role="img"
      aria-label={STATUS_LABEL[status]}
      title={STATUS_LABEL[status]}
      animate={{ rotate: status === "read" ? 45 : 0 }}
      transition={{ type: "spring", stiffness: 190, damping: 18 }}
      className={`inline-block size-2.5 rounded-xs ${look} ${className}`}
    />
  );
}

export function TypingDots({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} role="status" aria-label="Typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-xs bg-current"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/**
 * Message text with @mentions picked out. A mention of you gets a soft
 * accent block so it stands out when you skim a busy group.
 */
function RichText({ text, names, me }: { text: string; names: string[]; me?: string }) {
  if (!names.length) return <>{text}</>;
  const lower = names.map((n) => n.toLowerCase());
  const parts = text.split(/(@[\p{L}]+)/u);
  return (
    <>
      {parts.map((part, i) => {
        const name = part.startsWith("@") ? part.slice(1).toLowerCase() : null;
        if (!name || !lower.includes(name)) return <span key={i}>{part}</span>;
        const isMe = me && name === me.toLowerCase();
        return (
          <span
            key={i}
            className={isMe ? "rounded-md bg-accent-soft px-1 font-semibold text-accent-ink" : "font-medium text-accent-ink"}
          >
            {part}
          </span>
        );
      })}
    </>
  );
}

/**
 * One message on the rail. Everyone reads down a single column; my own
 * messages sit on a soft accent block, everyone else's is plain text.
 */
export function MessageBody({
  mine,
  text,
  quote,
  names = [],
  me,
  edited = false,
  deleted = false,
}: {
  mine: boolean;
  text: string;
  quote?: { author: string; text: string } | null;
  /** First names in this chat that count as @mentions. */
  names?: string[];
  /** Your first name, for highlighting mentions of you. */
  me?: string;
  edited?: boolean;
  deleted?: boolean;
}) {
  if (deleted) {
    return (
      <p className="inline-flex items-center gap-1.5 py-0.5 text-[14px] text-muted italic">
        <Prohibit size={14} aria-hidden />
        {mine ? "You deleted this message" : "This message was deleted"}
      </p>
    );
  }
  if (!text && !quote) return null;
  return (
    <div
      className={[
        "w-fit max-w-160 text-[15px] leading-relaxed",
        mine ? "rounded-2xl rounded-tl-md bg-accent-soft px-3.5 py-2 text-ink" : "py-0.5 text-ink",
      ].join(" ")}
    >
      {quote ? (
        <div className="mb-1.5 border-l-2 border-accent pl-2.5 text-[13px] leading-snug">
          <p className="font-semibold">{quote.author}</p>
          <p className="line-clamp-2 text-muted">{quote.text}</p>
        </div>
      ) : null}
      {text ? (
        <p className="wrap-break-word whitespace-pre-wrap">
          <RichText text={text} names={names} me={me} />
          {edited ? <span className="ml-1.5 text-[12px] text-muted">(edited)</span> : null}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimate, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import {
  ArrowLeft,
  ArrowClockwise,
  ArrowUUpLeft,
  BookmarkSimple,
  LockSimple,
  Microphone,
  Translate,
  CalendarPlus,
  CheckSquareOffset,
  FileText,
  GitBranch,
  Info,
  PaperPlaneTilt,
  Paperclip,
  PencilSimple,
  Phone,
  PushPin,
  Trash,
  UploadSimple,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import { Avatar, ChatAvatar, MessageBody, StatusNode, TypingDots } from "./primitives";
import { AttachmentList, Lightbox } from "./Attachments";
import { SuggestionCard } from "./Suggestion";
import { VoiceNote, VoiceRecorder } from "./VoiceNote";
import type { Account } from "@/lib/account";
import { languageName, translateMessage, type Translation } from "@/lib/translate";
import { canRecord } from "@/lib/voice";
import { Button } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/Dialog";
import {
  displayName,
  firstName,
  formatBytes,
  formatDayLabel,
  formatTime,
  mentionables,
  messagePreview,
  personName,
  presence,
  type Attachment,
  type Chat,
  type Decision,
  type KnowledgeStatus,
  type Message,
  type SideChat,
  type Task,
} from "@/lib/chat";
import { toAttachments } from "@/lib/attachments";
import { MOTION } from "@/lib/motion";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🙌"];
const GROUP_GAP = 5 * 60_000;

/**
 * The conversation reads down one rail, like the timeline on the landing
 * page: avatars sit on the rail where someone starts talking, and my own
 * messages carry a delivery marker on it instead of ticks.
 */
export function Thread({
  chat,
  now,
  me,
  onSend,
  onRetry,
  online,
  onEdit,
  onDelete,
  onDraft,
  onReact,
  onBack,
  onToggleInfo,
  highlightId,
  root,
  sideChats,
  onSideChat,
  onSave,
  onMakePlan,
  onMakeTask,
  onPin,
  smart,
  onDecision,
  onTask,
  onEditPlan,
  banner,
}: {
  chat: Chat;
  now: number;
  /** Your first name, for @mentions of you. */
  me: string;
  onSend: (text: string, replyTo?: string, attachments?: Attachment[]) => void;
  /** Try a waiting message again now. */
  onRetry: (messageId: string) => void;
  online: boolean;
  onEdit: (messageId: string, text: string) => void;
  onDelete: (messageId: string) => void;
  onDraft: (text: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onBack: () => void;
  onToggleInfo: () => void;
  /** A message to scroll to and flash, e.g. from a decision's sources. */
  highlightId?: string | null;
  /** In a side chat: the message it branched from. */
  root?: Message;
  /** Side chats that branch off this chat's messages. */
  sideChats: SideChat[];
  onSideChat: (messageId: string) => void;
  onSave: (messageId: string) => void;
  onMakePlan: (message: Message) => void;
  onMakeTask: (message: Message) => void;
  /** Pin or unpin a message in Up next. */
  onPin: (messageId: string) => void;
  /** Pinned under the header, e.g. the chat's Up next bar. */
  banner?: React.ReactNode;
  /** Smart-feature settings; null before the account loads. */
  smart: Account["smart"] | null;
  onDecision: (id: string, status: KnowledgeStatus) => void;
  onTask: (id: string, status: Task["status"]) => void;
  onEditPlan: (plan: Decision) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  // Touch screens have no hover, so tapping a message reveals its actions.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState<{ photos: Attachment[]; index: number } | null>(null);
  const [toDelete, setToDelete] = useState<Message | null>(null);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [bursts, setBursts] = useState<{ key: number; messageId: string; emoji: string }[]>([]);
  const [recording, setRecording] = useState(false);
  // Translations shown in place, per message; "original" flips back without translating again.
  const [translated, setTranslated] = useState<Record<string, (Translation & { original: boolean }) | "loading" | "none">>({});
  const target = smart?.translateTo ?? "en";

  const translate = async (message: Message) => {
    const current = translated[message.id];
    if (current && typeof current === "object") {
      setTranslated((t) => ({ ...t, [message.id]: { ...current, original: !current.original } }));
      return;
    }
    setTranslated((t) => ({ ...t, [message.id]: "loading" }));
    const result = await translateMessage(message.id, message.text, target);
    setTranslated((t) => ({ ...t, [message.id]: result ? { ...result, original: false } : "none" }));
  };

  const shownTranslation = (id: string) => {
    const t = translated[id];
    return t && typeof t === "object" && !t.original ? t.text : null;
  };

  // Suggestions sit under the last message they came from.
  const smartOn = Boolean(smart?.enabled);
  const suggestions = new Map<string, { plan?: Decision; task?: Task }[]>();
  if (smartOn) {
    for (const d of chat.decisions) if (d.status === "proposed" && d.sources.length && smart?.plans) suggestions.set(d.sources.at(-1)!, [...(suggestions.get(d.sources.at(-1)!) ?? []), { plan: d }]);
    for (const t of chat.tasks) if (t.status === "proposed" && t.sources.length && smart?.todos) suggestions.set(t.sources.at(-1)!, [...(suggestions.get(t.sources.at(-1)!) ?? []), { task: t }]);
  }
  // Messages present when the chat opened settle in quietly; new ones get their own entrance.
  const [initialIds] = useState(() => new Set(chat.messages.map((m) => m.id)));
  const [plane, animatePlane] = useAnimate();
  // A glow that follows the pointer behind the conversation.
  const gx = useSpring(useMotionValue(50), { stiffness: 50, damping: 20 });
  const gy = useSpring(useMotionValue(40), { stiffness: 50, damping: 20 });
  const glow = useMotionTemplate`radial-gradient(520px circle at ${gx}% ${gy}%, color-mix(in oklab, var(--accent) 9%, transparent), transparent 70%)`;

  const react = (messageId: string, emoji: string, burst: boolean) => {
    onReact(messageId, emoji);
    if (burst) setBursts((b) => [...b, { key: Date.now() + Math.random(), messageId, emoji }]);
  };

  const launchPlane = () => {
    if (!plane.current) return;
    void animatePlane(plane.current, { x: [0, 26, 0], y: [0, -22, 0], rotate: [0, -18, 0], scale: [1, 0.6, 1], opacity: [1, 0, 1] }, { duration: 0.55, times: [0, 0.5, 1], ease: "easeOut" });
  };

  const names = useMemo(() => [...mentionables(chat).map((m) => m.name), me], [chat, me]);
  const mentionOptions = useMemo(() => {
    if (!mention || chat.kind !== "group") return [];
    const q = mention.query.toLowerCase();
    return mentionables(chat).filter((m) => m.name.toLowerCase().startsWith(q) || m.handle.startsWith(q));
  }, [mention, chat]);

  const value = editing ? editText : chat.draft;
  const setValue = (text: string) => (editing ? setEditText(text) : onDraft(text));

  // Stay pinned to the newest message.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, chat.typing]);

  // Focus the composer for mouse and trackpad users only; on phones it would
  // pop the keyboard open the moment a chat is opened.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, []);

  // Grow the composer with its content. CSS field-sizing covers Chrome; this
  // covers Safari and Firefox, and shrinks it back after sending.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  useEffect(() => {
    const el = document.getElementById(`msg-${highlightId}`);
    const box = scrollRef.current;
    if (!highlightId || !el || !box) return;
    // Scroll only the conversation: scrollIntoView would also shift the app frame, which clips its overflow.
    const offset = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
    box.scrollTo({ top: box.scrollTop + offset - box.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" });
  }, [highlightId]);

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    const { items, problems: found } = await toAttachments(files);
    setPending((p) => [...p, ...items].slice(0, 10));
    setProblems(found);
    inputRef.current?.focus();
  };

  const startEdit = (m: Message) => {
    setEditing(m);
    setEditText(m.text);
    setReplyTo(null);
    setActiveId(null);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditText("");
  };

  const send = () => {
    if (editing) {
      const text = editText.trim();
      if (!text && !editing.attachments?.length) return;
      if (text !== editing.text) onEdit(editing.id, text);
      cancelEdit();
      return;
    }
    const text = chat.draft.trim();
    if (!text && !pending.length) return;
    onSend(text, replyTo?.id, pending.length ? pending : undefined);
    launchPlane();
    setReplyTo(null);
    setPending([]);
    setProblems([]);
    inputRef.current?.focus();
  };

  // Watch the text before the caret for "@name" in group chats.
  const trackMention = (text: string, caret: number) => {
    if (chat.kind !== "group") return;
    const match = /(^|\s)@([\p{L}.]*)$/u.exec(text.slice(0, caret));
    if (match) {
      setMention({ query: match[2], start: caret - match[2].length - 1 });
      setMentionIndex(0);
    } else setMention(null);
  };

  const pickMention = (name: string) => {
    if (!mention) return;
    const el = inputRef.current;
    const caret = el?.selectionStart ?? value.length;
    const next = `${value.slice(0, mention.start)}@${name} ${value.slice(caret)}`;
    setValue(next);
    setMention(null);
    const pos = mention.start + name.length + 2;
    window.requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  };

  const byId = new Map(chat.messages.map((m) => [m.id, m]));
  const lastMine = [...chat.messages].reverse().find((m) => m.from === "me" && !m.deleted);
  const canSend = editing ? Boolean(editText.trim() || editing.attachments?.length) : Boolean(chat.draft.trim() || pending.length);

  return (
    <div
      className="relative isolate flex h-full min-h-0 flex-col"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        gx.set(((e.clientX - r.left) / r.width) * 100);
        gy.set(((e.clientY - r.top) / r.height) * 100);
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files") || editing) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length || editing) return;
        e.preventDefault();
        setDragging(false);
        void addFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: glow }} />
      <header className="relative z-10 flex items-center gap-3 border-b border-line/70 px-3 py-3 md:px-6">
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink ${chat.side ? "" : "md:hidden"}`}
          aria-label={chat.side ? `Back to ${chat.side.parentName}` : "Back to inbox"}
        >
          <ArrowLeft size={20} />
        </button>
        <button type="button" onClick={onToggleInfo} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          {chat.side ? (
            <span className="inline-flex size-[42px] shrink-0 items-center justify-center rounded-[14px] bg-accent-soft text-accent-ink">
              <GitBranch size={22} weight="bold" aria-hidden />
            </span>
          ) : (
            <ChatAvatar chat={chat} size={42} />
          )}
          <span className="min-w-0">
            <span className="block truncate text-lg leading-tight font-semibold tracking-tight">{displayName(chat)}</span>
            <span className={`block truncate text-[13px] ${chat.typing ? "text-accent-ink" : "text-muted"}`}>
              {chat.side && !chat.typing ? `Side chat in ${chat.side.parentName}` : presence(chat)}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-0.5 text-muted">
          {[
            { icon: Phone, label: "Voice call" },
            { icon: VideoCamera, label: "Video call" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-disabled
              title={`${label}s arrive in a later release`}
              className="hidden size-10 cursor-not-allowed items-center justify-center rounded-full opacity-50 sm:inline-flex"
            >
              <Icon size={20} />
              <span className="sr-only">{label} (coming soon)</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onToggleInfo}
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-2 hover:text-ink"
            aria-label="Chat info"
          >
            <Info size={20} />
          </button>
        </div>
      </header>
      {banner}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 pt-6 pb-48 md:px-6" aria-live="polite">
        <div className="relative mx-auto max-w-3xl">
          <p className="mx-auto mb-5 flex w-fit max-w-full items-center gap-1.5 rounded-full bg-surface-2/70 px-3 py-1.5 text-center text-[12px] text-muted">
            <LockSimple size={13} weight="fill" className="shrink-0" aria-hidden />
            End-to-end encrypted. Only people in this chat can read it, not even Lynk.
          </p>

          {chat.side ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={MOTION.item}
              className="relative mb-4 ml-[52px] rounded-2xl border border-line bg-surface p-3.5"
            >
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                <GitBranch size={13} weight="bold" className="text-accent-ink" aria-hidden /> Started from
              </p>
              {root ? (
                <div className="mt-2 flex items-start gap-2.5">
                  <Avatar id={root.from} name={personName(root.from)} size={24} />
                  <p className="min-w-0 text-[14px]">
                    <span className="font-semibold">{root.from === "me" ? "You" : personName(root.from)}</span>{" "}
                    <span className="text-muted">{root.deleted ? "Deleted message" : messagePreview(root)}</span>
                  </p>
                </div>
              ) : null}
              <button type="button" onClick={onBack} className="mt-2.5 text-[13px] font-medium text-accent-ink hover:underline">
                See it in {chat.side.parentName}
              </button>
            </motion.div>
          ) : null}

          {chat.messages.length === 0 && chat.side ? (
            <p className="px-6 pt-6 text-center text-[15px] text-muted">Talk it through here so {chat.side.parentName} stays on topic.</p>
          ) : chat.messages.length === 0 ? (
            <div className="flex flex-col items-center px-6 pt-16 text-center">
              <ChatAvatar chat={chat} size={72} />
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                {chat.kind === "group" ? `You created ${chat.name}` : `This is the start of your chat with ${firstName(chat.members[0])}`}
              </h2>
              <p className="mt-2 max-w-[40ch] text-[15px] text-muted">
                {chat.kind === "group"
                  ? `${chat.members.length + 1} people are here. Say hi, or share a photo to get things going.`
                  : "Say hi. Plans and lists you make here stay in this chat."}
              </p>
            </div>
          ) : (
            <div aria-hidden className="absolute inset-y-0 left-[19px] border-l border-line" />
          )}

          {chat.messages.map((message, i) => {
            const prev = chat.messages[i - 1];
            const next = chat.messages[i + 1];
            const newDay = !prev || new Date(prev.at).toDateString() !== new Date(message.at).toDateString();
            const startsRun = newDay || !prev || prev.from !== message.from || message.at - prev.at > GROUP_GAP;
            const endsRun = !next || next.from !== message.from || next.at - message.at > GROUP_GAP;
            const mine = message.from === "me";
            const quoted = message.replyTo ? byId.get(message.replyTo) : undefined;
            const seenBy = chat.kind === "group" && message.id === lastMine?.id ? message.readBy ?? [] : [];
            const side = sideChats.find((sc) => sc.rootId === message.id);

            return (
              <Fragment key={message.id}>
                {newDay ? (
                  <div className="relative grid grid-cols-[40px_1fr] items-center gap-3 py-4">
                    <span className="flex items-start justify-center">
                      <span className="size-1.5 rounded-xs bg-muted" aria-hidden />
                    </span>
                    <p className="text-[12px] font-semibold text-muted">{formatDayLabel(message.at, now)}</p>
                  </div>
                ) : null}

                <motion.div
                  id={`msg-${message.id}`}
                  layout={"position"}
                  initial={
                    initialIds.has(message.id)
                        ? { opacity: 0, y: 10 }
                        : mine
                          ? { opacity: 0, y: 90, x: 60, scale: 0.7, rotate: -3 }
                          : { opacity: 0, x: -24, scale: 0.92 }
                  }
                  animate={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
                  transition={initialIds.has(message.id) ? MOTION.item : { type: "spring", stiffness: 260, damping: 20, mass: 0.8 }}
                  style={{ transformOrigin: mine ? "left bottom" : "left center" }}
                  onClick={(e) => {
                    if (!window.matchMedia("(hover: none)").matches) return;
                    if ((e.target as HTMLElement).closest("button,a")) return;
                    setActiveId((id) => (id === message.id ? null : message.id));
                  }}
                  className={`group relative grid scroll-mt-24 grid-cols-[40px_1fr] gap-3 rounded-2xl transition-colors duration-700 ${startsRun ? "pt-3" : "pt-1"} ${endsRun ? "pb-1" : ""} ${highlightId === message.id || editing?.id === message.id ? "bg-accent-soft/60" : ""}`}
                >
                  <div className="flex items-start justify-center">
                    {mine ? (
                      <StatusNode status={message.status ?? "read"} className={startsRun ? "mt-8" : "mt-3"} />
                    ) : startsRun ? (
                      <span className="inline-flex rounded-[11px] bg-bg p-0.5">
                        <Avatar id={message.from} name={personName(message.from)} size={32} />
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 pr-2 md:pr-44">
                    {startsRun ? (
                      <p className="mb-1 flex items-baseline gap-2 text-[13px]">
                        <span className="font-semibold">{mine ? "You" : personName(message.from)}</span>
                        <span className="text-[12px] text-muted tabular-nums">{formatTime(message.at)}</span>
                        {message.saved ? <BookmarkSimple size={12} weight="fill" className="self-center text-accent-ink" aria-label="Saved" /> : null}
                        {message.pinned ? <PushPin size={12} weight="fill" className="self-center text-accent-ink" aria-label="Pinned" /> : null}
                      </p>
                    ) : null}
                    <MessageBody
                      mine={mine}
                      text={shownTranslation(message.id) ?? message.text}
                      names={names}
                      me={me}
                      edited={Boolean(message.editedAt)}
                      deleted={message.deleted}
                      quote={
                        quoted
                          ? { author: personName(quoted.from), text: quoted.deleted ? "Deleted message" : messagePreview(quoted) }
                          : null
                      }
                    />
                    {translated[message.id] === "loading" ? (
                      <p className="mt-1 text-[12px] text-muted">Translating…</p>
                    ) : translated[message.id] === "none" ? (
                      <p className="mt-1 text-[12px] text-muted">This browser can&apos;t translate that yet. Translation for every message arrives with the server.</p>
                    ) : typeof translated[message.id] === "object" ? (
                      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted">
                        <Translate size={12} aria-hidden />
                        {(translated[message.id] as Translation & { original: boolean }).original
                          ? `Original, in ${languageName((translated[message.id] as Translation).from)}`
                          : `Translated from ${languageName((translated[message.id] as Translation).from)}${(translated[message.id] as Translation).source === "sample" ? " (sample)" : ""}`}
                        <span aria-hidden>·</span>
                        <button type="button" onClick={() => void translate(message)} className="font-medium text-accent-ink hover:underline">
                          {(translated[message.id] as Translation & { original: boolean }).original ? "Show translation" : "View original"}
                        </button>
                      </p>
                    ) : null}
                    {message.attachments?.length && !message.deleted ? (
                      <>
                        {message.attachments
                          .filter((a) => a.kind === "voice")
                          .map((a) => (
                            <VoiceNote key={a.id} note={a} mine={mine} showTranscript={smartOn ? Boolean(smart?.transcripts) : false} />
                          ))}
                        {message.attachments.some((a) => a.kind !== "voice") ? (
                          <AttachmentList items={message.attachments} onOpenPhoto={(photos, index) => setLightbox({ photos, index })} />
                        ) : null}
                      </>
                    ) : null}
                    {side || message.branch ? (
                      <button
                        type="button"
                        onClick={() => onSideChat(message.id)}
                        className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-ink"
                      >
                        <GitBranch size={13} className="shrink-0 text-accent-ink" aria-hidden />
                        <span className="truncate font-medium text-ink">{side?.name ?? message.branch?.name}</span>
                        <span className="shrink-0 tabular-nums">
                          side chat · {side ? side.messages.length : (message.branch?.count ?? 0)}
                        </span>
                      </button>
                    ) : null}
                    {message.reactions?.length && !message.deleted ? (
                      <div className="mt-1.5 flex gap-1">
                        {message.reactions.map((r) => (
                          <button
                            key={r.emoji}
                            type="button"
                            onClick={() => react(message.id, r.emoji, !r.mine)}
                            className={[
                              "inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs tabular-nums",
                              r.mine ? "border-accent/60 bg-accent-soft" : "border-line bg-surface",
                            ].join(" ")}
                            aria-label={`${r.emoji} ${r.count}${r.mine ? ", including you" : ""}`}
                          >
                            <span>{r.emoji}</span>
                            {r.count > 1 ? <span>{r.count}</span> : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {mine && message.status === "waiting" ? (
                      <p className="mt-1.5 flex items-center gap-2 text-[12px] text-muted">
                        <span>{online ? "Couldn't send yet" : "Waiting to send"}</span>
                        <button
                          type="button"
                          onClick={() => onRetry(message.id)}
                          disabled={!online}
                          className="inline-flex h-6 items-center gap-1 rounded-full border border-line bg-surface px-2 font-medium text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                          title={online ? "Send it now" : "Sends by itself when you're back online"}
                        >
                          <ArrowClockwise size={12} weight="bold" aria-hidden /> Retry
                        </button>
                      </p>
                    ) : null}
                    {seenBy.length ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
                        <span className="flex -space-x-1.5" aria-hidden>
                          {seenBy.slice(0, 3).map((id) => (
                            <span key={id} className="inline-flex rounded-[7px] ring-2 ring-bg">
                              <Avatar id={id} name={personName(id)} size={16} />
                            </span>
                          ))}
                        </span>
                        {seenBy.length === chat.members.length
                          ? "Seen by everyone"
                          : `Seen by ${seenBy.map((id) => firstName(id)).join(", ")}`}
                      </p>
                    ) : null}
                  </div>

                  {bursts
                    .filter((b) => b.messageId === message.id)
                    .map((b) => (
                      <Burst key={b.key} emoji={b.emoji} onDone={() => setBursts((all) => all.filter((x) => x.key !== b.key))} />
                    ))}

                  {/* Hover and keyboard actions */}
                  {message.deleted ? null : (
                    <div
                      className={`absolute top-1 right-0 z-10 flex origin-right items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 shadow-soft transition-[opacity,transform] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:scale-100 group-hover:opacity-100 focus-within:scale-100 focus-within:opacity-100 ${activeId === message.id ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0 [@media(hover:hover)]:pointer-events-auto"}`}
                    >
                      {QUICK_REACTIONS.map((emoji) => (
                        <motion.button
                          key={emoji}
                          type="button"
                          whileHover={{ scale: 1.35, y: -3 }}
                          whileTap={{ scale: 0.85 }}
                          transition={{ type: "spring", stiffness: 600, damping: 15 }}
                          onClick={() => {
                            const adding = !message.reactions?.some((r) => r.emoji === emoji && r.mine);
                            react(message.id, emoji, adding);
                            setActiveId(null);
                          }}
                          className="inline-flex size-8 items-center justify-center rounded-full text-sm hover:bg-surface-2"
                          aria-label={`React with ${emoji}`}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(message);
                          cancelEdit();
                          setActiveId(null);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                        aria-label="Reply"
                      >
                        <ArrowUUpLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSave(message.id);
                          setActiveId(null);
                        }}
                        className={`inline-flex size-8 items-center justify-center rounded-full hover:bg-surface-2 ${message.saved ? "text-accent-ink" : "text-muted hover:text-ink"}`}
                        aria-label={message.saved ? "Remove from Saved" : "Save message"}
                        aria-pressed={Boolean(message.saved)}
                      >
                        <BookmarkSimple size={16} weight={message.saved ? "fill" : "regular"} />
                      </button>
                      {chat.side ? null : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveId(null);
                            onSideChat(message.id);
                          }}
                          className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                          aria-label={side ? "Open side chat" : "Start a side chat"}
                        >
                          <GitBranch size={16} />
                        </button>
                      )}
                      {!mine && message.text ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveId(null);
                            void translate(message);
                          }}
                          className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                          aria-label={typeof translated[message.id] === "object" ? "View original" : "Translate"}
                        >
                          <Translate size={16} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveId(null);
                          onMakePlan(message);
                        }}
                        className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                        aria-label="Make a plan from this"
                      >
                        <CalendarPlus size={16} />
                      </button>
                      {chat.side ? null : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveId(null);
                              onMakeTask(message);
                            }}
                            className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                            aria-label="Make a to-do from this"
                          >
                            <CheckSquareOffset size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveId(null);
                              onPin(message.id);
                            }}
                            className={`inline-flex size-8 items-center justify-center rounded-full hover:bg-surface-2 ${message.pinned ? "text-accent-ink" : "text-muted hover:text-ink"}`}
                            aria-label={message.pinned ? "Unpin" : "Pin to Up next"}
                            aria-pressed={Boolean(message.pinned)}
                          >
                            <PushPin size={16} weight={message.pinned ? "fill" : "regular"} />
                          </button>
                        </>
                      )}
                      {mine ? (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(message)}
                            className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                            aria-label="Edit message"
                          >
                            <PencilSimple size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setToDelete(message);
                              setActiveId(null);
                            }}
                            className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-danger-ink"
                            aria-label="Delete message"
                          >
                            <Trash size={16} />
                          </button>
                        </>
                      ) : null}
                    </div>
                  )}
                </motion.div>
                <AnimatePresence>
                  {(suggestions.get(message.id) ?? []).map(({ plan, task }) =>
                    plan ? (
                      <SuggestionCard
                        key={plan.id}
                        plan={plan}
                        onSave={() => onDecision(plan.id, "confirmed")}
                        onDismiss={() => onDecision(plan.id, "rejected")}
                        onEdit={() => onEditPlan(plan)}
                      />
                    ) : task ? (
                      <SuggestionCard key={task.id} task={task} onSave={() => onTask(task.id, "confirmed")} onDismiss={() => onTask(task.id, "rejected")} />
                    ) : null,
                  )}
                </AnimatePresence>
              </Fragment>
            );
          })}

          <AnimatePresence>
            {chat.typing ? (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={MOTION.item}
                className="relative grid grid-cols-[40px_1fr] items-center gap-3 pt-3"
              >
                <span className="flex items-start justify-center">
                  <span className="inline-flex rounded-[11px] bg-bg p-0.5">
                    <Avatar id={chat.typing} name={personName(chat.typing)} size={32} />
                  </span>
                </span>
                <span className="flex items-center gap-2 text-[13px] text-muted">
                  <TypingDots className="text-accent-ink" />
                  {firstName(chat.typing)} is typing
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {dragging ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-3 z-20 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-accent bg-accent-soft/80 text-accent-ink"
          >
            <UploadSimple size={32} aria-hidden />
            <p className="mt-2 font-semibold">Drop to add to your message</p>
            <p className="text-[13px]">Photos and files up to 10 MB</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Floating composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-bg via-bg/90 to-transparent px-3 pt-10 pb-4 md:px-6"
      >
        <div className="pointer-events-auto relative mx-auto max-w-3xl">
          {/* @mention suggestions */}
          <AnimatePresence>
            {mention && mentionOptions.length ? (
              <motion.ul
                id="mention-list"
                role="listbox"
                aria-label="Mention someone"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={MOTION.item}
                className="absolute bottom-full left-2 mb-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-soft"
              >
                {mentionOptions.map((m, i) => (
                  <li
                    key={m.id}
                    id={`mention-${m.id}`}
                    role="option"
                    aria-selected={i === mentionIndex}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickMention(m.name);
                    }}
                    onMouseMove={() => setMentionIndex(i)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 ${i === mentionIndex ? "bg-surface-2" : ""}`}
                  >
                    <Avatar id={m.id} name={personName(m.id)} size={28} />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">{personName(m.id)}</span>
                      <span className="block truncate text-[12px] text-muted">@{m.handle}</span>
                    </span>
                  </li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>

          <div className="rounded-3xl border border-line bg-surface p-1.5 shadow-soft transition-[border-color,box-shadow] duration-200 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
            {editing ? (
              <div className="mx-1.5 mt-1 mb-1.5 flex items-start gap-3 rounded-2xl bg-surface-2 px-3 py-2 text-sm">
                <PencilSimple size={16} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Editing message</p>
                  <p className="truncate text-muted">{messagePreview(editing)}</p>
                </div>
                <button type="button" onClick={cancelEdit} className="text-muted hover:text-ink" aria-label="Cancel editing">
                  <X size={16} weight="bold" />
                </button>
              </div>
            ) : replyTo ? (
              <div className="mx-1.5 mt-1 mb-1.5 flex items-start gap-3 rounded-2xl bg-surface-2 px-3 py-2 text-sm">
                <ArrowUUpLeft size={16} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Replying to {personName(replyTo.from)}</p>
                  <p className="truncate text-muted">{messagePreview(replyTo)}</p>
                </div>
                <button type="button" onClick={() => setReplyTo(null)} className="text-muted hover:text-ink" aria-label="Cancel reply">
                  <X size={16} weight="bold" />
                </button>
              </div>
            ) : null}

            {pending.length ? (
              <ul className="mx-1.5 mt-1 mb-1.5 flex gap-2 overflow-x-auto pb-1" aria-label="Attachments to send">
                {pending.map((a) => (
                  <li key={a.id} className="relative shrink-0">
                    {a.kind === "image" && a.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.url} alt={a.name} className="block size-16 rounded-xl object-cover" />
                    ) : (
                      <span className="flex h-16 w-40 items-center gap-2 rounded-xl bg-surface-2 px-2.5">
                        <FileText size={20} className="shrink-0 text-accent-ink" aria-hidden />
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-medium">{a.name}</span>
                          <span className="block text-[11px] text-muted">{formatBytes(a.size)}</span>
                        </span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPending((p) => p.filter((x) => x.id !== a.id))}
                      className="absolute -top-1.5 -right-1.5 inline-flex size-6 items-center justify-center rounded-full bg-ink text-bg"
                      aria-label={`Remove ${a.name}`}
                    >
                      <X size={11} weight="bold" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {problems.length ? (
              <p role="alert" className="mx-3 mb-1.5 text-[13px] text-danger-ink">
                {problems.join(" ")}
              </p>
            ) : null}

            {recording ? (
              <VoiceRecorder
                onClose={() => setRecording(false)}
                onSend={(note) => {
                  onSend("", replyTo?.id, [note]);
                  setReplyTo(null);
                }}
              />
            ) : (
            <div className="flex items-end gap-1.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={Boolean(editing)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40"
                aria-label="Add photos or files"
              >
                <Paperclip size={20} />
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  void addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <label htmlFor="composer" className="sr-only">
                {editing ? "Edit message" : `Message ${chat.name}`}
              </label>
              <textarea
                id="composer"
                ref={inputRef}
                rows={1}
                value={value}
                role={chat.kind === "group" ? "combobox" : undefined}
                aria-expanded={chat.kind === "group" ? Boolean(mention && mentionOptions.length) : undefined}
                aria-controls={mention && mentionOptions.length ? "mention-list" : undefined}
                aria-activedescendant={mention && mentionOptions[mentionIndex] ? `mention-${mentionOptions[mentionIndex].id}` : undefined}
                aria-autocomplete={chat.kind === "group" ? "list" : undefined}
                onChange={(e) => {
                  setValue(e.target.value);
                  trackMention(e.target.value, e.target.selectionStart ?? e.target.value.length);
                }}
                onPaste={(e) => {
                  const files = Array.from(e.clipboardData.files);
                  if (files.length && !editing) {
                    e.preventDefault();
                    void addFiles(files);
                  }
                }}
                onBlur={() => window.setTimeout(() => setMention(null), 100)}
                onKeyDown={(e) => {
                  if (mention && mentionOptions.length) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setMentionIndex((i) => (i + 1) % mentionOptions.length);
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setMentionIndex((i) => (i - 1 + mentionOptions.length) % mentionOptions.length);
                      return;
                    }
                    if (e.key === "Enter" || e.key === "Tab") {
                      e.preventDefault();
                      pickMention(mentionOptions[mentionIndex].name);
                      return;
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setMention(null);
                      return;
                    }
                  }
                  if (e.key === "Escape" && editing) {
                    e.preventDefault();
                    cancelEdit();
                    return;
                  }
                  // On phones Enter adds a new line and the send button sends, as in
                  // other mobile chat apps. With a keyboard, Enter sends.
                  const touch = window.matchMedia("(pointer: coarse)").matches;
                  if (e.key === "Enter" && !e.shiftKey && !touch && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={editing ? "Edit your message" : `Message ${chat.kind === "dm" ? chat.name.split(" ")[0] : chat.name}`}
                className="field-sizing-content max-h-40 min-h-10 w-full resize-none bg-transparent px-1 py-2 text-[15px] leading-6 outline-none placeholder:text-muted focus-visible:outline-none"
              />
              {!canSend && !editing && canRecord() ? (
                <motion.button
                  type="button"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => setRecording(true)}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-ink hover:bg-accent hover:text-on-accent active:scale-90"
                  aria-label="Record a voice note"
                >
                  <Microphone size={19} weight="fill" />
                </motion.button>
              ) : (
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex size-10 shrink-0 items-center justify-center overflow-visible rounded-2xl bg-accent text-on-accent shadow-[0_6px_18px_-6px_color-mix(in_oklab,var(--accent)_80%,transparent)] transition-[transform,background-color,box-shadow] active:scale-90 disabled:bg-surface-2 disabled:text-muted disabled:shadow-none"
                aria-label={editing ? "Save edit" : "Send message"}
              >
                <span ref={plane} className="inline-flex">
                  <PaperPlaneTilt size={18} weight="fill" />
                </span>
              </button>
              )}
            </div>
            )}
          </div>
          <p className="mt-2 hidden text-center text-xs text-muted md:block">
            {editing
              ? "Enter to save, Escape to cancel"
              : chat.kind === "group"
                ? "Enter to send · Shift + Enter for a new line · @ to mention · drop files to attach"
                : "Enter to send · Shift + Enter for a new line · drop files to attach"}
          </p>
        </div>
      </form>

      <Lightbox
        photos={lightbox?.photos ?? []}
        index={lightbox?.index ?? null}
        onIndex={(index) => setLightbox((l) => (l ? { ...l, index } : l))}
        onClose={() => setLightbox(null)}
      />

      <Dialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete this message?"
        description="It's removed for everyone in the chat. A note shows where it was."
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (toDelete) onDelete(toDelete.id);
              if (editing?.id === toDelete?.id) cancelEdit();
              setToDelete(null);
            }}
          >
            Delete for everyone
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

/**
 * A little burst of the chosen emoji: a dozen copies fly out on random
 * arcs, spin, shrink and fade. Purely decorative.
 */
function Burst({ emoji, onDone }: { emoji: string; onDone: () => void }) {
  const [parts] = useState(() =>
    Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 40 + Math.random() * 50;
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 30, r: (Math.random() - 0.5) * 120, s: 0.6 + Math.random() * 0.7 };
    }),
  );
  useEffect(() => {
    const t = window.setTimeout(onDone, 900);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <span aria-hidden className="pointer-events-none absolute top-4 right-24 z-20">
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className="absolute text-lg"
          initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 40], scale: p.s, opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: 0.85, ease: [0.2, 0.8, 0.3, 1], times: [0, 0.6, 1] }}
        >
          {emoji}
        </motion.span>
      ))}
    </span>
  );
}

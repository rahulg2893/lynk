"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretDown, Microphone, Pause, PaperPlaneTilt, Play, Trash } from "@phosphor-icons/react";
import { formatDuration, newId, type Attachment } from "@/lib/chat";
import { useRecorder, type Recording } from "@/lib/voice";

const RATES = [1, 1.5, 2];

/**
 * A voice note: waveform that fills as it plays, speed, and a transcript
 * where tapping a line jumps the audio there. Sample notes (no audio file)
 * play silently so the transcript can still be tried.
 */
export function VoiceNote({ note, mine, showTranscript }: { note: Attachment; mine: boolean; showTranscript: boolean }) {
  const duration = note.duration ?? 0;
  const peaks = note.peaks ?? Array.from({ length: 40 }, () => 0.3);
  const segments = note.transcript ?? [];
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [rate, setRate] = useState(1);
  const [open, setOpen] = useState(false);
  const clock = useRef<{ from: number; at: number } | null>(null);

  // Advance the playhead each frame: from the audio element, or a clock for samples.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const a = audio.current;
      let next: number;
      if (a) next = a.currentTime * 1000;
      else {
        const c = clock.current!;
        next = c.at + (performance.now() - c.from) * rate;
      }
      if (next >= duration || (a && a.ended)) {
        setPlaying(false);
        setPosition(0);
        if (a) a.currentTime = 0;
        return;
      }
      setPosition(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, rate, duration]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate;
  }, [rate]);

  const play = (from = position) => {
    const a = audio.current;
    if (a) {
      a.currentTime = from / 1000;
      void a.play();
    } else clock.current = { from: performance.now(), at: from };
    setPosition(from);
    setPlaying(true);
  };
  const pause = () => {
    audio.current?.pause();
    setPlaying(false);
  };
  const seek = (ms: number) => (playing ? play(ms) : setPosition(ms));

  const progress = duration ? position / duration : 0;
  const active = segments.reduce((idx, s, i) => (s.at <= position ? i : idx), -1);

  return (
    <div className={`mt-1 w-full max-w-sm rounded-2xl p-2.5 ${mine ? "bg-accent-soft" : "border border-line bg-surface"}`}>
      {note.url ? <audio ref={audio} src={note.url} preload="metadata" onEnded={() => setPlaying(false)} /> : null}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => (playing ? pause() : play())}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent shadow-soft active:scale-95"
          aria-label={playing ? "Pause voice note" : "Play voice note"}
        >
          {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
        </button>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Voice note position"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration / 1000)}
          aria-valuenow={Math.round(position / 1000)}
          aria-valuetext={`${formatDuration(position)} of ${formatDuration(duration)}`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * duration);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") seek(Math.min(duration, position + 3000));
            if (e.key === "ArrowLeft") seek(Math.max(0, position - 3000));
          }}
          className="flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-[2px]"
        >
          {peaks.map((p, i) => (
            <motion.span
              key={i}
              animate={{ scaleY: playing && Math.abs(i / peaks.length - progress) < 0.03 ? 1.25 : 1 }}
              className={`w-full flex-1 rounded-full transition-colors duration-150 ${i / peaks.length < progress ? "bg-accent" : "bg-muted/35"}`}
              style={{ height: `${Math.round(p * 100)}%` }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRate((r) => RATES[(RATES.indexOf(r) + 1) % RATES.length])}
          className="h-7 shrink-0 rounded-full bg-surface-2 px-2 text-[12px] font-semibold tabular-nums"
          aria-label={`Playback speed ${rate}×`}
        >
          {rate}×
        </button>
      </div>
      <div className="mt-1 flex items-center justify-between pl-12 text-[12px] text-muted tabular-nums">
        <span>{playing || position ? formatDuration(position) : formatDuration(duration)}</span>
        {showTranscript && segments.length ? (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1 font-medium text-accent-ink">
            Transcript <CaretDown size={12} weight="bold" className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {open && showTranscript ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="overflow-hidden"
          >
            <ol className="mt-2 grid gap-0.5 border-t border-line/70 pt-2">
              {segments.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => play(s.at)}
                    className={`flex w-full gap-2 rounded-lg px-1.5 py-1 text-left text-[13px] leading-snug transition-colors ${i === active ? "bg-surface text-ink shadow-soft" : "text-muted hover:text-ink"}`}
                  >
                    <span className="shrink-0 text-[11px] text-accent-ink tabular-nums">{formatDuration(s.at)}</span>
                    <span>{s.text}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="mt-1.5 px-1.5 text-[11px] text-muted">
              {note.transcriptKind === "live" ? "Transcribed on this device while recording." : "Sample transcript."}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Turn a finished recording into a voice-note attachment. */
export function voiceAttachment(r: Recording): Attachment {
  return {
    id: newId("vn"),
    kind: "voice",
    name: "Voice note",
    size: r.size,
    mime: r.mime,
    url: r.url,
    duration: r.duration,
    peaks: r.peaks,
    transcript: r.transcript,
    transcriptKind: r.transcript.length ? "live" : undefined,
  };
}

/**
 * The composer while recording: a pulsing dot and timer, the live waveform,
 * the words as they're recognised, and cancel or send.
 */
export function VoiceRecorder({ onSend, onClose }: { onSend: (note: Attachment) => void; onClose: () => void }) {
  const rec = useRecorder(typeof navigator !== "undefined" ? navigator.language : "en-GB");
  const startedOnce = useRef(false);

  useEffect(() => {
    if (startedOnce.current) return;
    startedOnce.current = true;
    void rec.start();
  }, [rec]);

  if (rec.state === "denied" || rec.state === "unsupported") {
    return (
      <div className="flex items-center gap-3 px-2 py-1.5">
        <Microphone size={20} className="shrink-0 text-danger-ink" aria-hidden />
        <p className="min-w-0 flex-1 text-[13px] text-muted">
          {rec.state === "denied" ? "Lynk can't use your microphone. Allow it in your browser's site settings to record." : "This browser can't record audio."}
        </p>
        <button type="button" onClick={onClose} className="h-9 rounded-full px-3 text-[13px] font-medium hover:bg-surface-2">
          OK
        </button>
      </div>
    );
  }

  const words = [...rec.transcript.final.map((s) => s.text), rec.transcript.interim].join(" ").trim();

  return (
    <div className="px-1 py-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            rec.cancel();
            onClose();
          }}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl text-muted hover:bg-surface-2 hover:text-danger-ink"
          aria-label="Discard recording"
        >
          <Trash size={19} />
        </button>
        <span className="flex shrink-0 items-center gap-1.5 text-[14px] font-medium tabular-nums" role="timer" aria-live="off">
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
            className="size-2.5 rounded-full bg-danger"
            aria-hidden
          />
          {formatDuration(rec.elapsed)}
        </span>
        <div className="flex h-9 min-w-0 flex-1 items-center justify-end gap-[2px] overflow-hidden" aria-hidden>
          {rec.levels.map((l, i) => (
            <span key={i} className="w-[3px] shrink-0 rounded-full bg-accent" style={{ height: `${Math.max(10, l * 100)}%` }} />
          ))}
        </div>
        <button
          type="button"
          disabled={rec.state !== "recording"}
          onClick={async () => {
            const r = await rec.stop();
            if (r && r.duration > 400) onSend(voiceAttachment(r));
            onClose();
          }}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-soft active:scale-90 disabled:opacity-50"
          aria-label="Send voice note"
        >
          <PaperPlaneTilt size={18} weight="fill" />
        </button>
      </div>
      <p className="mt-1 truncate px-2 text-[12px] text-muted" aria-live="polite">
        {rec.state === "starting" ? "Starting the microphone…" : words ? `“${words}”` : "Recording. Transcripts appear when this device can transcribe on its own."}
      </p>
    </div>
  );
}

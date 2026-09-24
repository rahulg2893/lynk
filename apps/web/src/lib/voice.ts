"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TranscriptSegment } from "./chat";

/**
 * Voice notes recorded in the browser: MediaRecorder for the audio, an
 * AnalyserNode for the live waveform, and the Web Speech API for a live
 * transcript, but only when the browser can recognise speech on the device.
 * Every chat is end-to-end encrypted, so audio must never be sent to a
 * speech service; without on-device recognition the note simply has no
 * transcript.
 */

export type Recording = {
  url: string;
  mime: string;
  size: number;
  duration: number;
  peaks: number[];
  transcript: TranscriptSegment[];
};

type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  /** Chrome: recognise on the device instead of sending audio to a server. */
  processLocally?: boolean;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionCtor = {
  new (): Recognition;
  available?: (o: { langs: string[]; processLocally: boolean }) => Promise<string>;
};

/** A recognizer that runs on the device, or null. Never one that uploads audio. */
async function onDeviceRecognition(lang: string): Promise<Recognition | null> {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor?.available) return null;
  try {
    if ((await Ctor.available({ langs: [lang], processLocally: true })) !== "available") return null;
    const rec = new Ctor();
    if (!("processLocally" in rec)) return null;
    rec.processLocally = true;
    return rec;
  } catch {
    return null;
  }
}

export const canRecord = () => typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined";

/** Squeeze level samples into `bars` bars of 0–1, scaled so the loudest bar is full height. */
function toPeaks(levels: number[], bars = 40) {
  if (!levels.length) return Array.from({ length: bars }, () => 0.15);
  const out = Array.from({ length: bars }, (_, i) => {
    const from = Math.floor((i / bars) * levels.length);
    const to = Math.max(from + 1, Math.floor(((i + 1) / bars) * levels.length));
    return Math.max(...levels.slice(from, to));
  });
  const max = Math.max(...out, 0.01);
  return out.map((v) => Math.max(0.12, v / max));
}

/** Small notes are kept as data URLs so they survive a reload; long ones last for this visit. */
const KEEP_BYTES = 700_000;

function toUrl(blob: Blob): Promise<string> {
  if (blob.size > KEEP_BYTES) return Promise.resolve(URL.createObjectURL(blob));
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => resolve(URL.createObjectURL(blob));
    reader.readAsDataURL(blob);
  });
}

export type RecorderState = "idle" | "starting" | "recording" | "denied" | "unsupported";

export function useRecorder(lang = "en-GB") {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [transcript, setTranscript] = useState<{ final: TranscriptSegment[]; interim: string }>({ final: [], interim: "" });

  const media = useRef<{ stream: MediaStream; recorder: MediaRecorder; ctx: AudioContext; chunks: Blob[] } | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const started = useRef(0);
  const samples = useRef<number[]>([]);
  const segments = useRef<TranscriptSegment[]>([]);
  const frame = useRef(0);

  const teardown = useCallback(() => {
    cancelAnimationFrame(frame.current);
    recognition.current?.abort();
    recognition.current = null;
    const m = media.current;
    if (m) {
      m.stream.getTracks().forEach((t) => t.stop());
      void m.ctx.close();
    }
    media.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  const start = useCallback(async () => {
    if (!canRecord()) return setState("unsupported");
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buffer = new Uint8Array(analyser.fftSize);

      media.current = { stream, recorder, ctx, chunks };
      samples.current = [];
      segments.current = [];
      setTranscript({ final: [], interim: "" });
      started.current = performance.now();
      recorder.start(250);
      setState("recording");

      // Loudness (RMS) every frame: drives the live waveform and the saved peaks.
      let last = 0;
      const tick = (t: number) => {
        analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (const v of buffer) sum += ((v - 128) / 128) ** 2;
        const level = Math.min(1, Math.sqrt(sum / buffer.length) * 4);
        if (t - last > 80) {
          last = t;
          samples.current.push(level);
          setLevels((l) => [...l.slice(-47), level]);
          setElapsed(performance.now() - started.current);
        }
        frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);

      const rec = await onDeviceRecognition(lang);
      if (rec) {
        rec.lang = lang;
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) {
              const text = r[0].transcript.trim();
              if (text) {
                // Timestamped when it lands, a little before now, which is close enough to jump to.
                const at = Math.max(0, performance.now() - started.current - 1500);
                segments.current = [...segments.current, { at, text: text[0].toUpperCase() + text.slice(1) }];
              }
            } else interim += r[0].transcript;
          }
          setTranscript({ final: segments.current, interim });
        };
        rec.onerror = () => undefined;
        try {
          rec.start();
          recognition.current = rec;
        } catch {
          // Recognition already running elsewhere: record without a transcript.
        }
      }
    } catch {
      teardown();
      setState("denied");
    }
  }, [lang, teardown]);

  const cancel = useCallback(() => {
    media.current?.recorder.stop();
    teardown();
    setLevels([]);
    setElapsed(0);
    setState("idle");
  }, [teardown]);

  const stop = useCallback(async (): Promise<Recording | null> => {
    const m = media.current;
    if (!m) return null;
    const duration = performance.now() - started.current;
    recognition.current?.stop();
    const blob = await new Promise<Blob>((resolve) => {
      m.recorder.onstop = () => resolve(new Blob(m.chunks, { type: m.recorder.mimeType || "audio/webm" }));
      m.recorder.stop();
    });
    // Give recognition a moment to deliver its last words.
    await new Promise((r) => setTimeout(r, 400));
    const result: Recording = {
      url: await toUrl(blob),
      mime: blob.type,
      size: blob.size,
      duration,
      peaks: toPeaks(samples.current),
      transcript: segments.current,
    };
    teardown();
    setLevels([]);
    setElapsed(0);
    setState("idle");
    return result;
  }, [teardown]);

  return { state, elapsed, levels, transcript, start, stop, cancel, reset: () => setState("idle") };
}

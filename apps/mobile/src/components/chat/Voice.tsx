import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import { CaretDown, Microphone, PaperPlaneTilt, Pause, Play, Trash } from "phosphor-react-native";
import { formatDuration, newId, type Attachment } from "@shared/chat";
import { keepRecording } from "@/lib/media";
import { radius, useColors } from "@/lib/theme";
import { Text, tap } from "../ui";

const RATES = [1, 1.5, 2];

/**
 * A voice note: a waveform that fills as it plays, speed, and a transcript
 * where tapping a line jumps there. Sample notes (no audio file) play
 * silently on a clock so the transcript can still be tried.
 */
export function VoiceNote({ note, mine, showTranscript }: { note: Attachment; mine: boolean; showTranscript: boolean }) {
  const c = useColors();
  const duration = note.duration ?? 0;
  const peaks = note.peaks ?? Array.from({ length: 40 }, () => 0.3);
  const segments = note.transcript ?? [];
  const player = useAudioPlayer(note.url ? { uri: note.url } : null);
  const status = useAudioPlayerStatus(player);
  const [rate, setRate] = useState(1);
  const [open, setOpen] = useState(false);
  // Clock for sample notes without audio.
  const [clock, setClock] = useState<{ playing: boolean; at: number; from: number }>({ playing: false, at: 0, from: 0 });
  const [tick, setTick] = useState(0);

  const real = Boolean(note.url);
  const playing = real ? status.playing : clock.playing;
  const position = real ? status.currentTime * 1000 : clock.playing ? Math.min(duration, clock.at + (tick - clock.from) * rate) : clock.at;

  useEffect(() => {
    if (real || !clock.playing) return;
    let raf = 0;
    const loop = () => {
      const now = Date.now();
      setTick(now);
      if (clock.at + (now - clock.from) * rate >= duration) {
        setClock({ playing: false, at: 0, from: 0 });
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [real, clock, rate, duration]);

  useEffect(() => {
    if (real && status.didJustFinish) void player.seekTo(0);
  }, [real, status.didJustFinish, player]);

  const play = (fromMs = position >= duration ? 0 : position) => {
    tap();
    if (real) {
      void setAudioModeAsync({ playsInSilentMode: true });
      void player.seekTo(fromMs / 1000).then(() => player.play());
    } else {
      const now = Date.now();
      setTick(now);
      setClock({ playing: true, at: fromMs, from: now });
    }
  };
  const pause = () => {
    tap();
    if (real) player.pause();
    else setClock({ playing: false, at: position, from: 0 });
  };
  const changeRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    if (real) player.setPlaybackRate(next);
    else if (clock.playing) setClock({ playing: true, at: position, from: Date.now() });
  };

  const progress = duration ? position / duration : 0;
  const active = segments.reduce((idx, s, i) => (s.at <= position ? i : idx), -1);
  const [width, setWidth] = useState(1);

  return (
    <View style={{ marginTop: 4, width: "100%", maxWidth: 320, borderRadius: radius.md, padding: 10, backgroundColor: mine ? c.accentSoft : c.surface, borderWidth: mine ? 0 : 0.5, borderColor: c.line }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? "Pause voice note" : "Play voice note"}
          onPress={() => (playing ? pause() : play())}
          style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", transform: [{ scale: pressed ? 0.92 : 1 }] })}
        >
          {playing ? <Pause size={18} color={c.onAccent} weight="fill" /> : <Play size={18} color={c.onAccent} weight="fill" />}
        </Pressable>
        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel="Voice note position"
          accessibilityValue={{ text: `${formatDuration(position)} of ${formatDuration(duration)}` }}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          onPress={(e) => play((e.nativeEvent.locationX / width) * duration)}
          style={{ flex: 1, height: 34, flexDirection: "row", alignItems: "center", gap: 2 }}
        >
          {peaks.map((p, i) => (
            <View key={i} style={{ flex: 1, height: `${Math.round(p * 100)}%`, borderRadius: 2, backgroundColor: i / peaks.length < progress ? c.accent : c.muted, opacity: i / peaks.length < progress ? 1 : 0.4 }} />
          ))}
        </Pressable>
        <Pressable onPress={changeRate} accessibilityLabel={`Playback speed ${rate} times`} style={{ height: 26, paddingHorizontal: 8, borderRadius: 13, backgroundColor: c.surface2, justifyContent: "center" }}>
          <Text variant="caption" weight="700">
            {rate}×
          </Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingLeft: 50, marginTop: 4 }}>
        <Text variant="caption" tone="muted" style={{ fontVariant: ["tabular-nums"] }}>
          {formatDuration(playing || position ? position : duration)}
        </Text>
        {showTranscript && segments.length ? (
          <Pressable onPress={() => setOpen((o) => !o)} accessibilityState={{ expanded: open }} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text variant="caption" tone="accent" weight="600">
              Transcript
            </Text>
            <CaretDown size={12} color={c.accentInk} weight="bold" style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
          </Pressable>
        ) : null}
      </View>
      {open && showTranscript ? (
        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: c.line, gap: 2 }}>
          {segments.map((s, i) => (
            <Pressable key={i} onPress={() => play(s.at)} style={{ flexDirection: "row", gap: 8, padding: 6, borderRadius: 10, backgroundColor: i === active ? c.surface : "transparent" }}>
              <Text variant="caption" tone="accent" style={{ fontVariant: ["tabular-nums"], marginTop: 1 }}>
                {formatDuration(s.at)}
              </Text>
              <Text variant="footnote" tone={i === active ? "ink" : "muted"} style={{ flex: 1 }}>
                {s.text}
              </Text>
            </Pressable>
          ))}
          <Text variant="caption" tone="muted" style={{ paddingHorizontal: 6, marginTop: 4 }}>
            {note.transcriptKind === "live" ? "Transcribed on this device." : "Sample transcript."}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** 40 bars of 0–1 from metering samples (dBFS, -160…0). */
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

const level = (db?: number) => (db === undefined ? 0 : Math.max(0, Math.min(1, (db + 55) / 55)));

/** The composer while recording: a pulsing dot and timer, a live level meter, discard or send. */
export function VoiceRecorder({ onSend, onClose }: { onSend: (note: Attachment) => void; onClose: () => void }) {
  const c = useColors();
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const [state, setState] = useState<"starting" | "recording" | "denied">("starting");
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const samples = useRef<number[]>([]);
  const dot = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    let live = true;
    void (async () => {
      const perm = await requestRecordingPermissionsAsync();
      if (!live) return;
      if (!perm.granted) return setState("denied");
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      setState("recording");
    })();
    return () => {
      live = false;
    };
  }, [recorder]);

  useEffect(() => {
    if (state !== "recording") return;
    const loop = Animated.loop(Animated.sequence([Animated.timing(dot, { toValue: 0.2, duration: 550, useNativeDriver: true }), Animated.timing(dot, { toValue: 1, duration: 550, useNativeDriver: true })]));
    loop.start();
    const t = setInterval(() => {
      const s = recorder.getStatus();
      const l = level(s.metering);
      samples.current.push(l);
      setElapsed(s.durationMillis);
      setLevels((prev) => [...prev.slice(-44), l]);
    }, 80);
    return () => {
      clearInterval(t);
      loop.stop();
    };
  }, [state, recorder, dot]);

  const stop = async (send: boolean) => {
    const duration = recorder.getStatus().durationMillis;
    await recorder.stop().catch(() => undefined);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    const uri = recorder.uri;
    if (send && uri && duration > 400) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      onSend({
        id: newId("vn"),
        kind: "voice",
        name: "Voice note",
        size: 0,
        mime: "audio/m4a",
        url: keepRecording(uri),
        duration,
        peaks: toPeaks(samples.current),
      });
    }
    onClose();
  };

  if (state === "denied") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 8 }}>
        <Microphone size={20} color={c.dangerInk} />
        <Text variant="footnote" tone="muted" style={{ flex: 1 }}>
          Lynk can&apos;t use the microphone. Allow it in Settings › Lynk to record voice notes.
        </Text>
        <Pressable onPress={onClose} style={{ paddingHorizontal: 12, height: 32, justifyContent: "center" }}>
          <Text weight="600">OK</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 4 }}>
      <Pressable accessibilityLabel="Discard recording" onPress={() => void stop(false)} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
        <Trash size={22} color={c.muted} />
      </Pressable>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.danger, opacity: dot }} />
        <Text variant="subhead" weight="600" style={{ fontVariant: ["tabular-nums"] }}>
          {formatDuration(elapsed)}
        </Text>
      </View>
      <View style={{ flex: 1, height: 36, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 2, overflow: "hidden" }} accessibilityElementsHidden>
        {state === "starting" ? (
          <Text variant="footnote" tone="muted">
            Starting…
          </Text>
        ) : (
          levels.map((l, i) => <View key={i} style={{ width: 3, height: `${Math.max(10, l * 100)}%`, borderRadius: 2, backgroundColor: c.accent }} />)
        )}
      </View>
      <Pressable
        accessibilityLabel="Send voice note"
        disabled={state !== "recording"}
        onPress={() => void stop(true)}
        style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 14, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", opacity: state === "recording" ? 1 : 0.5, transform: [{ scale: pressed ? 0.9 : 1 }] })}
      >
        <PaperPlaneTilt size={18} color={c.onAccent} weight="fill" />
      </Pressable>
    </View>
  );
}

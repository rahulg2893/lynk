import { useEffect, type ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Switch as RNSwitch,
  Text as RNText,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Svg, { Circle, ClipPath, Defs, LinearGradient as SvgGradient, Rect, Stop } from "react-native-svg";
import { UsersThree } from "phosphor-react-native";
import { initials, PEOPLE, toneFor, type Chat, type Status } from "@shared/chat";
import { radius, useColors, useScheme } from "@/lib/theme";
import { getLang, t } from "@shared/i18n";

/* ---------- Text ---------- */

type Variant = "largeTitle" | "title" | "title2" | "headline" | "body" | "callout" | "subhead" | "footnote" | "caption";
const TYPE: Record<Variant, TextStyle> = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "700", letterSpacing: 0.37 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: 0.36 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: "700", letterSpacing: 0.35 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600", letterSpacing: -0.41 },
  body: { fontSize: 17, lineHeight: 22, letterSpacing: -0.41 },
  callout: { fontSize: 16, lineHeight: 21, letterSpacing: -0.32 },
  subhead: { fontSize: 15, lineHeight: 20, letterSpacing: -0.24 },
  footnote: { fontSize: 13, lineHeight: 18, letterSpacing: -0.08 },
  caption: { fontSize: 12, lineHeight: 16 },
};

export function Text({
  variant = "body",
  tone = "ink",
  weight,
  style,
  ...props
}: TextProps & { variant?: Variant; tone?: "ink" | "muted" | "accent" | "danger" | "onAccent"; weight?: TextStyle["fontWeight"] }) {
  const c = useColors();
  const color = { ink: c.ink, muted: c.muted, accent: c.accentInk, danger: c.dangerInk, onAccent: c.onAccent }[tone];
  // Devanagari needs room above and below the line for its vowel signs, and no added letter spacing.
  const script = getLang() === "hi" ? { lineHeight: Math.round(TYPE[variant].fontSize! * 1.45), letterSpacing: 0 } : null;
  return <RNText {...props} style={[TYPE[variant], script, { color }, weight ? { fontWeight: weight } : null, style]} />;
}

/* ---------- Buttons ---------- */

export const tap = () => void Haptics.selectionAsync().catch(() => undefined);

export function Button({
  title,
  onPress,
  variant = "secondary",
  size = "md",
  icon,
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dangerQuiet";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const look = {
    primary: { bg: c.accent, fg: c.onAccent, border: "transparent" },
    secondary: { bg: c.surface, fg: c.ink, border: c.line },
    ghost: { bg: "transparent", fg: c.ink, border: "transparent" },
    danger: { bg: c.danger, fg: "#ffffff", border: "transparent" },
    dangerQuiet: { bg: c.surface, fg: c.dangerInk, border: c.line },
  }[variant];
  const h = { sm: 36, md: 44, lg: 50 }[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          height: h,
          paddingHorizontal: size === "sm" ? 14 : 20,
          borderRadius: radius.pill,
          backgroundColor: look.bg,
          borderWidth: look.border === "transparent" ? 0 : 1,
          borderColor: look.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={look.fg} size="small" /> : icon}
      <Text variant={size === "sm" ? "footnote" : "callout"} weight="600" style={{ color: look.fg }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  children,
  label,
  onPress,
  size = 40,
  filled,
  style,
  ...rest
}: { children: ReactNode; label: string; size?: number; filled?: boolean; style?: StyleProp<ViewStyle> } & Omit<PressableProps, "style" | "children">) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={(e) => {
        tap();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: filled ? c.accent : pressed ? c.surface2 : "transparent",
          opacity: pressed && filled ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

/* ---------- Forms ---------- */

export function Field({ label, hint, error, optional, style, ...props }: TextInputProps & { label: string; hint?: string; error?: string | null; optional?: boolean }) {
  const c = useColors();
  return (
    <View style={style as StyleProp<ViewStyle>}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 6 }}>
        <Text variant="footnote" weight="600">
          {label}
        </Text>
        {optional ? (
          <Text variant="footnote" tone="muted">
            {t("Optional")}
          </Text>
        ) : null}
      </View>
      <TextInput
        placeholderTextColor={c.muted}
        {...props}
        style={{
          height: 50,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: error ? c.dangerInk : c.line,
          backgroundColor: c.surface,
          paddingHorizontal: 18,
          fontSize: 17,
          color: c.ink,
        }}
      />
      {hint ? (
        <Text variant="footnote" tone="muted" style={{ paddingHorizontal: 16, marginTop: 6 }}>
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text variant="footnote" tone="danger" style={{ paddingHorizontal: 16, marginTop: 6 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/* ---------- Grouped lists (Settings style) ---------- */

export function Section({ title, footnote, children }: { title?: string; footnote?: string; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ marginTop: 24 }}>
      {title ? (
        <Text variant="footnote" tone="muted" weight="600" style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          {title}
        </Text>
      ) : null}
      <View style={{ marginHorizontal: 16, borderRadius: radius.lg, backgroundColor: c.surface, overflow: "hidden" }}>{children}</View>
      {footnote ? (
        <Text variant="footnote" tone="muted" style={{ paddingHorizontal: 20, marginTop: 8 }}>
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

export function Row({
  label,
  detail,
  icon,
  right,
  onPress,
  destructive,
  last,
}: {
  label: string;
  detail?: string;
  icon?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const c = useColors();
  const body = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 16, minHeight: 50 }}>
      {icon}
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 12,
          paddingRight: 16,
          borderBottomWidth: last ? 0 : 0.5,
          borderBottomColor: c.line,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text tone={destructive ? "danger" : "ink"}>{label}</Text>
          {detail ? (
            <Text variant="footnote" tone="muted" style={{ marginTop: 2 }}>
              {detail}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({ backgroundColor: pressed ? c.surface2 : "transparent" })}
    >
      {body}
    </Pressable>
  );
}

export function SwitchRow({ label, detail, value, onChange, disabled, last }: { label: string; detail?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; last?: boolean }) {
  const c = useColors();
  // The whole row flips the switch, as in Settings; the switch stays the control VoiceOver reads.
  return (
    <Pressable
      accessible={false}
      disabled={disabled}
      onPress={() => {
        tap();
        onChange(!value);
      }}
    >
      <Row
        label={label}
        detail={detail}
        last={last}
        right={
          <RNSwitch
            value={value}
            disabled={disabled}
            onValueChange={(v) => {
              tap();
              onChange(v);
            }}
            trackColor={{ true: c.accent, false: c.surface2 }}
            accessibilityLabel={label}
          />
        }
      />
    </Pressable>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const c = useColors();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", backgroundColor: c.surface2, borderRadius: radius.pill, padding: 3 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={{
              flex: 1,
              height: 34,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on ? c.surface : "transparent",
              shadowColor: "#000",
              shadowOpacity: on ? 0.08 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
            }}
          >
            <Text variant="footnote" weight={on ? "600" : "500"} tone={on ? "ink" : "muted"} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- People ---------- */

const PHOTOS: Record<string, number> = {
  amara: require("@/assets/people/amara.jpg"),
  tomas: require("@/assets/people/tomas.jpg"),
  jonas: require("@/assets/people/jonas.jpg"),
  mei: require("@/assets/people/mei.jpg"),
  sofia: require("@/assets/people/sofia.jpg"),
};

/** Graphite monograms, like Apple Contacts; Lynk avatars are rounded squares. */
const GREYS: [string, string][] = [
  ["#707075", "#4d4d52"],
  ["#6d7077", "#4b4e55"],
  ["#727074", "#504e52"],
  ["#747479", "#525257"],
  ["#6e7174", "#4c4f52"],
  ["#717076", "#4f4e54"],
];

export function Avatar({ id, name, size = 40, online, group, photo }: { id: string; name: string; size?: number; online?: boolean; group?: boolean; photo?: string | null }) {
  const c = useColors();
  const r = size * 0.32;
  const source = !group ? (photo ? { uri: photo } : PHOTOS[id] && PEOPLE[id]?.photo ? PHOTOS[id] : null) : null;
  return (
    <View style={{ width: size, height: size }}>
      {source ? (
        <Image source={source} style={{ width: size, height: size, borderRadius: r }} contentFit="cover" transition={150} />
      ) : (
        <LinearGradient colors={GREYS[toneFor(id)]} style={{ width: size, height: size, borderRadius: r, alignItems: "center", justifyContent: "center" }}>
          {group ? (
            <UsersThree size={size * 0.46} color="#fff" weight="bold" />
          ) : (
            <RNText style={{ color: "#fff", fontWeight: "600", fontSize: size * 0.36 }}>{initials(name)}</RNText>
          )}
        </LinearGradient>
      )}
      {online ? (
        <View
          accessibilityLabel={t("Online")}
          style={{ position: "absolute", right: -2, bottom: -2, width: 13, height: 13, borderRadius: 4, borderWidth: 2, borderColor: c.surface, backgroundColor: c.positive }}
        />
      ) : null}
    </View>
  );
}

export function ChatAvatar({ chat, size = 40, photo }: { chat: Chat; size?: number; photo?: string | null }) {
  return <Avatar id={chat.members[0] ?? chat.id} name={chat.name} size={size} online={chat.kind === "dm" && chat.online} group={chat.kind === "group"} photo={photo} />;
}

/* ---------- Delivery marker ---------- */

const STATUS_LABEL: Record<Status, string> = { waiting: "Waiting to send", sending: "Sending", sent: "Sent", delivered: "Delivered", read: "Read" };

/** Dashed while sending (breathing while it waits), outlined once sent, filled when delivered, an accent diamond once read. */
export function StatusNode({ status, size = 10 }: { status: Status; size?: number }) {
  const c = useColors();
  const pulse = useState(() => new Animated.Value(1))[0];
  const turn = useState(() => new Animated.Value(status === "read" ? 1 : 0))[0];
  useEffect(() => {
    if (status !== "waiting") return;
    const loop = Animated.loop(
      Animated.sequence([Animated.timing(pulse, { toValue: 0.35, duration: 800, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true })]),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(1);
    };
  }, [status, pulse]);
  useEffect(() => {
    Animated.spring(turn, { toValue: status === "read" ? 1 : 0, useNativeDriver: true, stiffness: 190, damping: 18, mass: 1 }).start();
  }, [status, turn]);
  const look: ViewStyle = {
    waiting: { borderWidth: 1, borderStyle: "dashed", borderColor: c.muted, backgroundColor: c.bg },
    sending: { borderWidth: 1, borderStyle: "dashed", borderColor: c.muted, backgroundColor: c.bg },
    sent: { borderWidth: 1, borderColor: c.ink, backgroundColor: c.bg, opacity: 0.7 },
    delivered: { borderWidth: 1, borderColor: c.ink, backgroundColor: c.ink },
    read: { borderWidth: 1, borderColor: c.accent, backgroundColor: c.accent },
  }[status] as ViewStyle;
  return (
    <Animated.View
      accessibilityLabel={t(STATUS_LABEL[status])}
      style={[
        { width: size, height: size, borderRadius: 2.5 },
        look,
        { opacity: pulse, transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) }] },
      ]}
    />
  );
}

/* ---------- Rich text ---------- */

/** @mentions of people in the chat in accent; mentions of you on a soft accent block. */
export function RichText({ text, names, me, style }: { text: string; names: string[]; me?: string; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  const lower = names.map((n) => n.toLowerCase());
  const parts = text.split(/(@[\p{L}]+)/u);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        const name = part.startsWith("@") ? part.slice(1).toLowerCase() : null;
        if (!name || !lower.includes(name)) return part;
        const isMe = me && name === me.toLowerCase();
        return (
          <RNText key={i} style={{ color: c.accentInk, fontWeight: isMe ? "700" : "500", backgroundColor: isMe ? c.accentSoft : undefined }}>
            {part}
          </RNText>
        );
      })}
    </Text>
  );
}

/* ---------- Brand ---------- */

/** The two interlocking rings; the silver ring turns graphite on light backgrounds. */
export function LogoMark({ height = 28 }: { height?: number }) {
  const dark = useScheme() === "dark";
  const b1 = dark ? "#ffffff" : "#8e8e93";
  const b2 = dark ? "#aebcd6" : "#3a3a3c";
  return (
    <Svg width={(height * 46) / 34} height={height} viewBox="0 0 46 34">
      <Defs>
        <SvgGradient id="a" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#5aa0ff" />
          <Stop offset="1" stopColor="#1f5fe0" />
        </SvgGradient>
        <SvgGradient id="b" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={b1} />
          <Stop offset="1" stopColor={b2} />
        </SvgGradient>
        <ClipPath id="over">
          <Rect x="19" y="0" width="15" height="16" />
        </ClipPath>
      </Defs>
      <Circle cx="16" cy="15" r="10" fill="none" stroke="url(#a)" strokeWidth={5} />
      <Circle cx="29" cy="19" r="10" fill="none" stroke="url(#b)" strokeWidth={5} />
      <Circle cx="16" cy="15" r="10" fill="none" stroke="url(#a)" strokeWidth={5} clipPath="url(#over)" />
    </Svg>
  );
}

/* ---------- Misc ---------- */

export function Pill({ children, active, onPress, style }: { children: ReactNode; active?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[{ height: 34, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: "center", backgroundColor: active ? c.ink : "transparent" }, style]}
    >
      <Text variant="footnote" weight="600" style={{ color: active ? c.bg : c.muted }}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Badge({ count, muted }: { count: number | string; muted?: boolean }) {
  const c = useColors();
  return (
    <View style={{ minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: muted ? c.surface2 : c.accent }}>
      <Text variant="caption" weight="700" style={{ color: muted ? c.muted : c.onAccent, fontVariant: ["tabular-nums"] }}>
        {count}
      </Text>
    </View>
  );
}

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: "center", paddingHorizontal: 32, paddingVertical: 48, gap: 8 }}>
      {icon}
      <Text variant="headline" style={{ textAlign: "center", marginTop: icon ? 8 : 0 }}>
        {title}
      </Text>
      {body ? (
        <Text variant="subhead" tone="muted" style={{ textAlign: "center" }}>
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}
    </View>
  );
}

import { memo, useEffect, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { ArrowClockwise, BookmarkSimple, FileText, GitBranch, Prohibit, PushPin, Translate } from "phosphor-react-native";
import { firstName, formatBytes, formatDayLabel, formatTime, messagePreview, personName, type Attachment, type Chat, type Message, type SideChat } from "@shared/chat";
import { radius, useColors } from "@/lib/theme";
import { Avatar, RichText, StatusNode, Text, tap } from "../ui";
import { PollCard } from "./Cards";
import { VoiceNote } from "./Voice";
import { t } from "@shared/i18n";

const GAP = 5 * 60_000;

export type Translation = { text: string; from: string; sample: boolean; original: boolean } | "none";

type Props = {
  message: Message;
  prev?: Message;
  next?: Message;
  chat: Chat;
  now: number;
  names: string[];
  me: string;
  quoted?: Message;
  side?: SideChat;
  seenBy: string[];
  highlighted: boolean;
  isNew: boolean;
  online: boolean;
  showTranscript: boolean;
  translation?: Translation;
  languageName: (code: string) => string;
  onLongPress: (m: Message) => void;
  onReact: (m: Message, emoji: string) => void;
  onOpenPhotos: (photos: Attachment[], index: number) => void;
  onSideChat: (m: Message) => void;
  onRetry: (m: Message) => void;
  onToggleTranslation: (m: Message) => void;
  onVote: (m: Message, optionId: string) => void;
  onDecidePoll: (m: Message, optionId: string) => void;
};

function MessageItemBase(p: Props) {
  const c = useColors();
  const { message, prev, next } = p;
  const mine = message.from === "me";
  const newDay = !prev || new Date(prev.at).toDateString() !== new Date(message.at).toDateString();
  const startsRun = newDay || !prev || prev.from !== message.from || message.at - prev.at > GAP;
  const endsRun = !next || next.from !== message.from || next.at - message.at > GAP;
  const enter = useState(() => new Animated.Value(p.isNew ? 0 : 1))[0];
  const glow = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (p.isNew) Animated.spring(enter, { toValue: 1, useNativeDriver: true, stiffness: 260, damping: 20, mass: 0.8 }).start();
  }, [p.isNew, enter]);
  useEffect(() => {
    if (!p.highlighted) return;
    Animated.sequence([Animated.timing(glow, { toValue: 1, duration: 200, useNativeDriver: true }), Animated.timing(glow, { toValue: 0, duration: 1800, delay: 600, useNativeDriver: true })]).start();
  }, [p.highlighted, glow]);

  const shown = p.translation && p.translation !== "none" && !p.translation.original ? p.translation.text : null;
  const photos = message.attachments?.filter((a) => a.kind === "image") ?? [];
  const files = message.attachments?.filter((a) => a.kind === "file") ?? [];
  const voices = message.attachments?.filter((a) => a.kind === "voice") ?? [];

  return (
    <View>
      {newDay ? (
        <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
          <View style={{ width: 40, alignItems: "center" }}>
            <View style={{ width: 6, height: 6, borderRadius: 1.5, backgroundColor: c.muted }} />
          </View>
          <Text variant="caption" tone="muted" weight="700" style={{ marginLeft: 12 }}>
            {formatDayLabel(message.at, p.now)}
          </Text>
        </View>
      ) : null}
      <Animated.View
        style={{
          flexDirection: "row",
          gap: 12,
          paddingTop: startsRun ? 12 : 3,
          paddingBottom: endsRun ? 3 : 0,
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [mine ? 60 : 0, 0] }) },
            { translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [mine ? 30 : -20, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [mine ? 0.8 : 0.94, 1] }) },
          ],
        }}
      >
        <Animated.View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: -6, right: 0, borderRadius: radius.md, backgroundColor: c.accentSoft, opacity: glow }} />
        <View style={{ width: 40, alignItems: "center" }}>
          {mine ? (
            <View style={{ marginTop: startsRun ? 30 : 12 }}>
              <StatusNode status={message.status ?? "read"} />
            </View>
          ) : startsRun ? (
            <View style={{ padding: 2, borderRadius: 12, backgroundColor: c.bg }}>
              <Avatar id={message.from} name={personName(message.from)} size={32} />
            </View>
          ) : null}
        </View>

        <Pressable
          style={{ flex: 1, paddingRight: 12 }}
          onLongPress={() => p.onLongPress(message)}
          delayLongPress={280}
          disabled={message.deleted}
          // A poll's options are buttons of their own, so its message isn't read as one element.
          accessible={!message.poll}
          accessibilityHint={t("Double tap and hold for actions")}
        >
          {startsRun ? (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
              <Text variant="footnote" weight="700">
                {mine ? t("You") : personName(message.from)}
              </Text>
              <Text variant="caption" tone="muted" style={{ fontVariant: ["tabular-nums"] }}>
                {formatTime(message.at)}
              </Text>
              {message.saved ? <BookmarkSimple size={12} color={c.accentInk} weight="fill" /> : null}
              {message.pinned ? <PushPin size={12} color={c.accentInk} weight="fill" /> : null}
            </View>
          ) : null}

          {message.deleted ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 2 }}>
              <Prohibit size={14} color={c.muted} />
              <Text variant="subhead" tone="muted" style={{ fontStyle: "italic" }}>
                {mine ? t("You deleted this message") : t("This message was deleted")}
              </Text>
            </View>
          ) : message.text || p.quoted ? (
            <View style={mine ? { alignSelf: "flex-start", maxWidth: "100%", borderRadius: 18, borderTopLeftRadius: 6, backgroundColor: c.accentSoft, paddingHorizontal: 14, paddingVertical: 8 } : { paddingVertical: 1 }}>
              {p.quoted ? (
                <View style={{ borderLeftWidth: 2, borderLeftColor: c.accent, paddingLeft: 10, marginBottom: 6 }}>
                  <Text variant="footnote" weight="700">
                    {personName(p.quoted.from)}
                  </Text>
                  <Text variant="footnote" tone="muted" numberOfLines={2}>
                    {p.quoted.deleted ? t("Deleted message") : messagePreview(p.quoted)}
                  </Text>
                </View>
              ) : null}
              {message.text ? (
                <RichText text={shown ?? message.text} names={p.names} me={p.me} style={{ fontSize: 17, lineHeight: 23 }} />
              ) : null}
              {message.editedAt ? (
                <Text variant="caption" tone="muted">
                  (edited)
                </Text>
              ) : null}
            </View>
          ) : null}

          {p.translation === "none" ? (
            <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>
              {t("Translation for this message arrives with on-device translation in a later build.")}
            </Text>
          ) : p.translation ? (
            <Pressable onPress={() => p.onToggleTranslation(message)} style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
              <Translate size={12} color={c.muted} />
              <Text variant="caption" tone="muted">
                {p.translation.original ? `${t("Original, in {language}", { language: p.languageName(p.translation.from) })} · ` : `${t("Translated from {language}", { language: p.languageName(p.translation.from) })}${p.translation.sample ? ` ${t("(sample)")}` : ""} · `}
                <Text variant="caption" tone="accent" weight="600">
                  {p.translation.original ? t("Show translation") : t("View original")}
                </Text>
              </Text>
            </Pressable>
          ) : null}

          {!message.deleted && message.poll ? (
            <PollCard poll={message.poll} mine={mine} onVote={(o) => p.onVote(message, o)} onDecide={(o) => p.onDecidePoll(message, o)} />
          ) : null}

          {!message.deleted
            ? voices.map((v) => <VoiceNote key={v.id} note={v} mine={mine} showTranscript={p.showTranscript} />)
            : null}

          {!message.deleted && photos.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6, maxWidth: 300, borderRadius: radius.md, overflow: "hidden" }}>
              {photos.slice(0, 4).map((ph, i) => (
                <Pressable key={ph.id} onPress={() => p.onOpenPhotos(photos, i)} accessibilityLabel={t("Open photo {n}", { n: i + 1 })} style={{ width: photos.length === 1 ? 300 : 148, height: photos.length === 1 ? 220 : 148 }}>
                  {ph.url ? (
                    <Image source={{ uri: ph.url }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={120} />
                  ) : (
                    <View style={{ flex: 1, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
                      <Text variant="caption" tone="muted">
                        {t("Photo not kept")}
                      </Text>
                    </View>
                  )}
                  {i === 3 && photos.length > 4 ? (
                    <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
                      <Text variant="title2" style={{ color: "#fff" }}>
                        +{photos.length - 4}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          {!message.deleted
            ? files.map((f) => (
                <View key={f.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6, padding: 10, borderRadius: radius.md, backgroundColor: c.surface, maxWidth: 300 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
                    <FileText size={20} color={c.accentInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="subhead" weight="600" numberOfLines={1}>
                      {f.name}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {formatBytes(f.size)}
                    </Text>
                  </View>
                </View>
              ))
            : null}

          {p.side || message.branch ? (
            <Pressable
              onPress={() => {
                tap();
                p.onSideChat(message);
              }}
              style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingHorizontal: 10, height: 28, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}
            >
              <GitBranch size={13} color={c.accentInk} weight="bold" />
              <Text variant="caption" weight="600" numberOfLines={1} style={{ maxWidth: 190 }}>
                {p.side?.name ?? message.branch?.name}
              </Text>
              <Text variant="caption" tone="muted">
                {t("side chat")} · {p.side ? p.side.messages.length : (message.branch?.count ?? 0)}
              </Text>
            </Pressable>
          ) : null}

          {message.reactions?.length && !message.deleted ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {message.reactions.map((r) => (
                <Pressable
                  key={r.emoji}
                  onPress={() => p.onReact(message, r.emoji)}
                  accessibilityLabel={`${r.emoji} ${r.count}${r.mine ? ", including you" : ""}`}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, height: 28, paddingHorizontal: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: r.mine ? c.accent : c.line, backgroundColor: r.mine ? c.accentSoft : c.surface }}
                >
                  <Text variant="footnote">{r.emoji}</Text>
                  {r.count > 1 ? (
                    <Text variant="caption" weight="600">
                      {r.count}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          {mine && message.status === "waiting" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <Text variant="caption" tone="muted">
                {p.online ? t("Couldn't send yet") : t("Waiting to send")}
              </Text>
              <Pressable
                disabled={!p.online}
                onPress={() => p.onRetry(message)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, height: 26, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, opacity: p.online ? 1 : 0.5 }}
              >
                <ArrowClockwise size={12} color={c.ink} weight="bold" />
                <Text variant="caption" weight="600">
                  {t("Retry")}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {p.seenBy.length ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              <View style={{ flexDirection: "row" }}>
                {p.seenBy.slice(0, 3).map((id, i) => (
                  <View key={id} style={{ marginLeft: i ? -5 : 0, borderRadius: 6, borderWidth: 1.5, borderColor: c.bg }}>
                    <Avatar id={id} name={personName(id)} size={16} />
                  </View>
                ))}
              </View>
              <Text variant="caption" tone="muted">
                {p.seenBy.length === p.chat.members.length ? t("Seen by everyone") : t("Seen by {names}", { names: p.seenBy.map(firstName).join(", ") })}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export const MessageItem = memo(MessageItemBase);

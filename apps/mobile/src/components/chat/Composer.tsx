import { useMemo, useState } from "react";
import { Animated, Pressable, ScrollView, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { ArrowUUpLeft, Camera, Images, Microphone, PaperPlaneTilt, PencilSimple, Plus, X } from "phosphor-react-native";
import { mentionables, messagePreview, personName, type Attachment, type Chat, type Message } from "@shared/chat";
import { pickPhotos, takePhoto } from "@/lib/media";
import { router } from "expo-router";
import { actionSheet } from "@/lib/sheet";
import { radius, useColors } from "@/lib/theme";
import { Avatar, Text } from "../ui";
import { VoiceRecorder } from "./Voice";
import { t } from "@shared/i18n";

/**
 * The floating composer: attach, write (with @mention suggestions in groups),
 * and send, or hold a conversation with voice notes when there's nothing to
 * send. Reply and edit show above the field.
 */
export function Composer({
  chat,
  value,
  onChange,
  replyTo,
  editing,
  onCancelReply,
  onCancelEdit,
  onSend,
}: {
  chat: Chat;
  value: string;
  onChange: (t: string) => void;
  replyTo: Message | null;
  editing: Message | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSend: (text: string, attachments?: Attachment[]) => void;
}) {
  const c = useColors();
  const [pending, setPending] = useState<Attachment[]>([]);
  const [recording, setRecording] = useState(false);
  const [caret, setCaret] = useState(0);
  const plane = useState(() => new Animated.Value(0))[0];

  const mention = useMemo(() => {
    if (chat.kind !== "group") return null;
    const m = /(^|\s)@([\p{L}.]*)$/u.exec(value.slice(0, caret));
    return m ? { query: m[2], start: caret - m[2].length - 1 } : null;
  }, [chat.kind, value, caret]);
  const options = mention ? mentionables(chat).filter((m) => m.name.toLowerCase().startsWith(mention.query.toLowerCase()) || m.handle.startsWith(mention.query)) : [];

  const canSend = editing ? Boolean(value.trim() || editing.attachments?.length) : Boolean(value.trim() || pending.length);

  const send = () => {
    if (!canSend) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    plane.setValue(0);
    Animated.timing(plane, { toValue: 1, duration: 520, useNativeDriver: true }).start();
    onSend(value.trim(), pending.length ? pending : undefined);
    setPending([]);
  };

  const attach = () =>
    actionSheet(undefined, [
      { label: t("Photo library"), onPress: () => void pickPhotos().then((a) => setPending((p) => [...p, ...a].slice(0, 10))) },
      { label: t("Take a photo"), onPress: () => void takePhoto().then((a) => setPending((p) => [...p, ...a].slice(0, 10))) },
      ...(chat.side ? [] : [{ label: t("Poll"), onPress: () => router.push({ pathname: "/poll", params: { chatId: chat.id } }) }]),
    ]);

  const pick = (name: string) => {
    if (!mention) return;
    onChange(`${value.slice(0, mention.start)}@${name} ${value.slice(caret)}`);
  };

  return (
    <View style={{ paddingHorizontal: 10, paddingTop: 6 }}>
      {options.length ? (
        <View style={{ marginBottom: 6, marginHorizontal: 4, borderRadius: radius.lg, backgroundColor: c.surface, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12 }}>
          {options.map((m) => (
            <Pressable key={m.id} onPress={() => pick(m.name)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, padding: 10, backgroundColor: pressed ? c.surface2 : "transparent" })}>
              <Avatar id={m.id} name={personName(m.id)} size={30} />
              <View>
                <Text variant="subhead" weight="600">
                  {personName(m.id)}
                </Text>
                <Text variant="caption" tone="muted">
                  @{m.handle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={{ borderRadius: 26, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, padding: 5, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }}>
        {editing || replyTo ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, margin: 4, marginBottom: 6, padding: 10, borderRadius: 16, backgroundColor: c.surface2 }}>
            {editing ? <PencilSimple size={16} color={c.accentInk} /> : <ArrowUUpLeft size={16} color={c.accentInk} />}
            <View style={{ flex: 1 }}>
              <Text variant="footnote" weight="700">
                {editing ? t("Editing message") : t("Replying to {name}", { name: personName(replyTo!.from) })}
              </Text>
              <Text variant="footnote" tone="muted" numberOfLines={1}>
                {messagePreview((editing ?? replyTo)!)}
              </Text>
            </View>
            <Pressable onPress={editing ? onCancelEdit : onCancelReply} accessibilityLabel={editing ? t("Cancel editing") : t("Cancel reply")} hitSlop={8}>
              <X size={16} color={c.muted} weight="bold" />
            </Pressable>
          </View>
        ) : null}

        {pending.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, padding: 6 }}>
            {pending.map((a) => (
              <View key={a.id}>
                {a.url ? <Image source={{ uri: a.url }} style={{ width: 64, height: 64, borderRadius: 12 }} /> : null}
                <Pressable onPress={() => setPending((p) => p.filter((x) => x.id !== a.id))} accessibilityLabel={t("Remove attachment")} style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: c.ink, alignItems: "center", justifyContent: "center" }}>
                  <X size={11} color={c.bg} weight="bold" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        {recording ? (
          <VoiceRecorder onClose={() => setRecording(false)} onSend={(note) => onSend("", [note])} />
        ) : (
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
            <Pressable onPress={attach} disabled={Boolean(editing)} accessibilityLabel={chat.side ? t("Add photos") : t("Add photos or a poll")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", opacity: editing ? 0.4 : 1 }}>
              {pending.length ? <Images size={23} color={c.accentInk} /> : <Plus size={23} color={c.muted} weight="bold" />}
            </Pressable>
            <TextInput
              value={value}
              onChangeText={onChange}
              onSelectionChange={(e) => setCaret(e.nativeEvent.selection.end)}
              placeholder={editing ? t("Edit your message") : t("Message {name}", { name: chat.kind === "dm" ? chat.name.split(" ")[0] : chat.name })}
              placeholderTextColor={c.muted}
              multiline
              testID="composer"
              accessibilityLabel={editing ? t("Edit message") : t("Message {name}", { name: chat.name })}
              style={{ flex: 1, maxHeight: 140, minHeight: 40, paddingTop: 10, paddingBottom: 10, paddingHorizontal: 4, fontSize: 17, lineHeight: 22, color: c.ink }}
            />
            {!canSend && !editing ? (
              <View style={{ flexDirection: "row" }}>
                <Pressable onPress={() => void takePhoto().then((a) => a.length && setPending(a))} accessibilityLabel={t("Take a photo")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
                  <Camera size={22} color={c.muted} />
                </Pressable>
                <Pressable
                  onPress={() => setRecording(true)}
                  accessibilityLabel={t("Record a voice note")}
                  style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? c.accent : c.surface2 })}
                >
                  <Microphone size={20} color={c.ink} weight="fill" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={send}
                testID="send-button"
                accessibilityLabel={editing ? t("Save edit") : t("Send message")}
                style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 14, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", transform: [{ scale: pressed ? 0.9 : 1 }] })}
              >
                <Animated.View
                  style={{
                    transform: [
                      { translateX: plane.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [0, 24, -10, 0] }) },
                      { translateY: plane.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [0, -22, 8, 0] }) },
                      { rotate: plane.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["0deg", "-18deg", "0deg"] }) },
                    ],
                    opacity: plane.interpolate({ inputRange: [0, 0.45, 0.55, 1], outputRange: [1, 0, 0, 1] }),
                  }}
                >
                  <PaperPlaneTilt size={18} color={c.onAccent} weight="fill" />
                </Animated.View>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

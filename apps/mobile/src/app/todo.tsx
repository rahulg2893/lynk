import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DUE_CHOICES, firstName } from "@shared/chat";
import { addTask } from "@shared/chat-ops";
import { change, useChatStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { Field, Pill, Text } from "@/components/ui";
import { t } from "@shared/i18n";

/** Make a to-do by hand: what, who it's for and roughly when. Opened from Up next, chat info or a message. */
export default function TodoScreen() {
  const params = useLocalSearchParams<{ chatId: string; title?: string; sources?: string }>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const chat = useChatStore().chats.find((x) => x.id === params.chatId);
  const [title, setTitle] = useState(params.title ?? "");
  const [assignee, setAssignee] = useState("me");
  const [due, setDue] = useState(DUE_CHOICES[0]);
  const [error, setError] = useState<string | null>(null);
  if (!chat) return null;

  const save = () => {
    if (!title.trim()) return setError(t("Say what needs doing."));
    change(chat.id, (ch) => addTask(ch, { title: title.trim(), assignee, due, sources: params.sources ? [params.sources] : [] }));
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 18 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text tone="accent">{t("Cancel")}</Text>
        </Pressable>
        <Text variant="headline">{t("New to-do")}</Text>
        <Pressable onPress={save} hitSlop={8}>
          <Text tone="accent" weight="700">
            {t("Add")}
          </Text>
        </Pressable>
      </View>
      <Text variant="subhead" tone="muted">
        {t("It shows in Up next in {name} until it's done.", { name: chat.name })}
      </Text>
      <Field
        label={t("What")}
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          setError(null);
        }}
        placeholder={t("Book the table")}
        maxLength={80}
        autoFocus
        error={error}
      />
      <Choices label={t("For")} value={assignee} onChange={setAssignee} options={["me", ...chat.members].map((id) => ({ value: id, label: firstName(id) }))} />
      <Choices label={t("When")} value={due} onChange={setDue} options={DUE_CHOICES.map((d) => ({ value: d, label: d }))} />
    </ScrollView>
  );
}

function Choices({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const c = useColors();
  return (
    <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text weight="600">{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <Pill key={o.value} active={value === o.value} onPress={() => onChange(o.value)} style={value === o.value ? undefined : { backgroundColor: c.surface }}>
            {o.label}
          </Pill>
        ))}
      </View>
    </View>
  );
}

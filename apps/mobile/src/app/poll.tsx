import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, X } from "phosphor-react-native";
import { sendPoll } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { Field, Text } from "@/components/ui";
import { t } from "@shared/i18n";

/** Ask the chat something: a question and two to four options, one vote each. */
export default function PollScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);

  const send = () => {
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) return setError(t("Ask a question."));
    if (filled.length < 2) return setError(t("Add at least two options."));
    sendPoll(chatId, question.trim(), filled);
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 16 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text tone="accent">{t("Cancel")}</Text>
        </Pressable>
        <Text variant="headline">{t("New poll")}</Text>
        <Pressable onPress={send} hitSlop={8}>
          <Text tone="accent" weight="700">
            {t("Send")}
          </Text>
        </Pressable>
      </View>
      <Text variant="subhead" tone="muted">
        {t("Everyone in the chat gets one vote. Turn the winner into a plan.")}
      </Text>
      <Field
        label={t("Question")}
        value={question}
        onChangeText={(t) => {
          setQuestion(t);
          setError(null);
        }}
        placeholder={t("Dinner this week?")}
        maxLength={80}
        autoFocus
        error={error}
      />
      {options.map((o, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field
              label={t("Option {n}", { n: i + 1 })}
              value={o}
              onChangeText={(t) => setOptions((all) => all.map((x, j) => (j === i ? t : x)))}
              placeholder={i === 0 ? t("Friday 8pm") : i === 1 ? t("Saturday 7pm") : t("Another option")}
              maxLength={40}
            />
          </View>
          {options.length > 2 ? (
            <Pressable onPress={() => setOptions((all) => all.filter((_, j) => j !== i))} accessibilityLabel={t("Remove option {n}", { n: i + 1 })} hitSlop={8} style={{ width: 44, height: 50, alignItems: "center", justifyContent: "center" }}>
              <X size={18} color={c.muted} />
            </Pressable>
          ) : null}
        </View>
      ))}
      {options.length < 4 ? (
        <Pressable onPress={() => setOptions((all) => [...all, ""])} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 }}>
          <Plus size={16} color={c.accentInk} weight="bold" />
          <Text tone="accent" weight="600">
            {t("Add an option")}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

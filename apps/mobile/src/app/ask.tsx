import { useEffect, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUp, GitBranch, MagnifyingGlass, Sparkle, X } from "phosphor-react-native";
import { formatListTime, messagePreview, personName } from "@shared/chat";
import { answer, search, SAMPLE_QUESTIONS, type Answer, type Hit } from "@shared/find";
import { useAccount } from "@/lib/account";
import { useChatStore } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { Avatar, Text } from "@/components/ui";
import { t } from "@shared/i18n";

/** "Find it again": the web's search and cited answers, over the chats on this phone. */
export default function Ask() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const account = useAccount();
  const { chats, now } = useChatStore();
  const smart = Boolean(account?.smart.enabled);
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState<{ q: string; result: Answer | null; hits: Hit[] } | null>(null);
  const [shown, setShown] = useState(0);
  const cursor = useState(() => new Animated.Value(1))[0];

  const full = asked?.result?.parts.map((p) => p.text).join("") ?? "";
  useEffect(() => {
    if (!full || shown >= full.length) return;
    const t = setTimeout(() => setShown((n) => Math.min(full.length, n + 3)), 12);
    return () => clearTimeout(t);
  }, [full, shown]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(cursor, { toValue: 0, duration: 400, useNativeDriver: true }), Animated.timing(cursor, { toValue: 1, duration: 400, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [cursor]);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text) return;
    setQuery(text);
    setShown(0);
    setAsked({ q: text, result: smart ? answer(chats, text, now) : null, hits: search(chats, text, 6) });
  };

  const open = (h: Hit) => {
    router.back();
    setTimeout(() => router.push({ pathname: "/chat/[id]", params: { id: h.threadId, m: h.message.id } }), 250);
  };

  const sources = asked?.result?.sources ?? asked?.hits ?? [];
  const parts = asked?.result?.parts ?? [];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderBottomWidth: 0.5, borderBottomColor: c.line }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
          {smart ? <Sparkle size={19} color={c.accentInk} weight="fill" /> : <MagnifyingGlass size={19} color={c.accentInk} />}
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => ask(query)}
          placeholder={smart ? t("Ask about your chats") : t("Search your chats")}
          placeholderTextColor={c.muted}
          autoFocus
          returnKeyType="search"
          style={{ flex: 1, fontSize: 17, color: c.ink }}
        />
        <Pressable onPress={() => ask(query)} disabled={!query.trim()} accessibilityLabel={t("Ask")} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: query.trim() ? c.accent : c.surface2, alignItems: "center", justifyContent: "center" }}>
          <ArrowUp size={17} color={query.trim() ? c.onAccent : c.muted} weight="bold" />
        </Pressable>
        <Pressable onPress={() => router.back()} accessibilityLabel={t("Close")} hitSlop={8}>
          <X size={20} color={c.muted} weight="bold" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        {!asked ? (
          <>
            <Text variant="footnote" tone="muted" weight="700">
              {t("Try asking")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SAMPLE_QUESTIONS.map((q) => (
                <Pressable key={q} onPress={() => ask(q)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
                  <Text variant="subhead">{q}</Text>
                </Pressable>
              ))}
            </View>
            <Text variant="footnote" tone="muted">
              {smart
                ? t("Answers come from your chats on this phone, since every chat is end-to-end encrypted, and each one links to the messages it came from.")
                : t("Smart features are off in Settings, so this shows matching messages without an answer.")}
            </Text>
          </>
        ) : (
          <>
            {smart ? (
              <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: c.surface }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Sparkle size={13} color={c.accentInk} weight="fill" />
                  <Text variant="caption" tone="muted" weight="700">
                    {t("Answer")}
                  </Text>
                </View>
                {asked.result ? (
                  <Text variant="callout" style={{ lineHeight: 24 }}>
                    {parts.map((p, i) => {
                      const start = parts.slice(0, i).reduce((n, q) => n + q.text.length, 0);
                      const visible = p.text.slice(0, Math.max(0, shown - start));
                      const done = shown >= start + p.text.length;
                      return (
                        <Text key={i} variant="callout">
                          {visible}
                          {done && p.source ? (
                            <Text variant="caption" tone="accent" weight="700" onPress={() => sources[p.source! - 1] && open(sources[p.source! - 1])}>
                              {` [${p.source}] `}
                            </Text>
                          ) : null}
                        </Text>
                      );
                    })}
                    {shown < full.length ? <Animated.Text style={{ opacity: cursor, color: c.accent }}>▍</Animated.Text> : null}
                  </Text>
                ) : (
                  <Text tone="muted">{t("I couldn't find that in your chats. Try other words, or a name.")}</Text>
                )}
              </View>
            ) : null}
            {sources.length ? (
              <View style={{ gap: 8 }}>
                <Text variant="footnote" tone="muted" weight="700">
                  {smart && asked.result ? t("Sources") : t("Matching messages")}
                </Text>
                {sources.map((h, i) => (
                  <Pressable key={`${h.threadId}-${h.message.id}`} onPress={() => open(h)} style={({ pressed }) => ({ flexDirection: "row", gap: 10, padding: 12, borderRadius: radius.lg, backgroundColor: pressed ? c.surface2 : c.surface })}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
                      <Text variant="caption" tone="accent" weight="700">
                        {i + 1}
                      </Text>
                    </View>
                    <Avatar id={h.message.from} name={personName(h.message.from)} size={28} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text variant="caption" weight="700">
                          {h.message.from === "me" ? t("You") : personName(h.message.from)}
                        </Text>
                        {h.sideName ? <GitBranch size={11} color={c.muted} /> : null}
                        <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
                          {h.sideName ?? (h.chat.kind === "group" ? h.chat.name : "")}
                        </Text>
                        <Text variant="caption" tone="muted">
                          {formatListTime(h.message.at, now)}
                        </Text>
                      </View>
                      <Text variant="subhead" numberOfLines={2} style={{ marginTop: 2 }}>
                        {h.snippet ?? messagePreview(h.message)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : !smart ? (
              <Text tone="muted">No messages match “{asked.q}”.</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

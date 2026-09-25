import { useState } from "react";
import { Pressable, ScrollView, Share, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, CheckCircle, CircleIcon as Circle, Copy, MagnifyingGlass, ShareNetwork, X } from "phosphor-react-native";
import { PEOPLE } from "@shared/chat";
import { useAccount } from "@/lib/account";
import { createGroup, startChat } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { Avatar, Button, Field, Segmented, Text, tap } from "@/components/ui";

type Tab = "chat" | "group" | "invite";

/** Start a chat with someone, make a group, or share your invite link. */
export default function NewChat() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const account = useAccount();
  const [tab, setTab] = useState<Tab>("chat");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const blocked = account?.blocked ?? [];
  const link = `https://lynk.app/invite/${account?.profile.username ?? "you"}`;
  const q = query.trim().toLowerCase();
  const people = Object.values(PEOPLE).filter((p) => !blocked.includes(p.id) && (!q || p.name.toLowerCase().includes(q) || p.handle.includes(q)));

  const open = (id: string) => {
    router.back();
    setTimeout(() => router.push({ pathname: "/chat/[id]", params: { id } }), 200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="title2">New</Text>
          <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
            <X size={15} color={c.muted} weight="bold" />
          </Pressable>
        </View>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "chat", label: "Chat" },
            { value: "group", label: "Group" },
            { value: "invite", label: "Invite" },
          ]}
        />
        {tab !== "invite" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 40, borderRadius: radius.pill, backgroundColor: c.surface2, paddingHorizontal: 12 }}>
            <MagnifyingGlass size={18} color={c.muted} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search people" placeholderTextColor={c.muted} style={{ flex: 1, fontSize: 17, color: c.ink }} autoCapitalize="none" />
          </View>
        ) : null}
        {tab === "group" ? <Field label="Group name" value={name} onChangeText={setName} placeholder="Weekend plans" maxLength={40} /> : null}
      </View>

      {tab === "invite" ? (
        <View style={{ padding: 20, gap: 16 }}>
          <Text variant="callout" tone="muted">
            Anyone with your link can start a chat with you. It opens straight into Lynk.
          </Text>
          <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: c.surface }}>
            <Text variant="subhead" selectable>
              {link}
            </Text>
          </View>
          <Button
            title={copied ? "Copied" : "Copy link"}
            icon={copied ? <Check size={18} color={c.ink} weight="bold" /> : <Copy size={18} color={c.ink} />}
            onPress={() => {
              void Clipboard.setStringAsync(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
          />
          <Button title="Share" variant="primary" icon={<ShareNetwork size={18} color={c.onAccent} weight="bold" />} onPress={() => void Share.share({ message: `Chat with me on Lynk: ${link}` })} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} keyboardShouldPersistTaps="handled">
          {people.map((p) => {
            const on = picked.includes(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  tap();
                  if (tab === "chat") open(startChat(p.id));
                  else setPicked((x) => (on ? x.filter((i) => i !== p.id) : [...x, p.id]));
                }}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: pressed ? c.surface2 : "transparent" })}
              >
                <Avatar id={p.id} name={p.name} size={44} />
                <View style={{ flex: 1 }}>
                  <Text weight="600">{p.name}</Text>
                  <Text variant="footnote" tone="muted">
                    @{p.handle}
                  </Text>
                </View>
                {tab === "group" ? on ? <CheckCircle size={24} color={c.accent} weight="fill" /> : <Circle size={24} color={c.line} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {tab === "group" ? (
        <View style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 12 }}>
          <Button
            title={picked.length ? `Create group with ${picked.length}` : "Pick people"}
            variant="primary"
            size="lg"
            disabled={!picked.length || !name.trim()}
            onPress={() => open(createGroup(name.trim(), picked))}
          />
        </View>
      ) : null}
    </View>
  );
}

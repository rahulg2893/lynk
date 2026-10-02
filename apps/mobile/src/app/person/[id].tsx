import { Pressable, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft, ChatCircle, Prohibit, Warning } from "phosphor-react-native";
import { PEOPLE } from "@shared/chat";
import { updateAccount, useAccount } from "@/lib/account";
import { confirm } from "@/lib/sheet";
import { startChat, useChatStore } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { Avatar, Button, ChatAvatar, Row, Section, Text } from "@/components/ui";
import { useTopMargin } from "@/lib/layout";

/** Someone's profile: shared groups, memories from chats you're both in, block and report. */
export default function Person() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topMargin = useTopMargin();
  const c = useColors();
  const account = useAccount();
  const { chats } = useChatStore();
  const person = PEOPLE[id];
  if (!person) return null;
  const blocked = account?.blocked.includes(id) ?? false;
  const shared = chats.filter((ch) => ch.kind === "group" && ch.members.includes(id));
  const memories = chats.filter((ch) => ch.members.includes(id)).flatMap((ch) => ch.memory.map((m) => ({ ...m, chat: ch })));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + topMargin + 4, paddingBottom: insets.bottom + 40 }}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: 6 }}>
        <CaretLeft size={26} color={c.accentInk} weight="bold" />
      </Pressable>
      <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 24 }}>
        <Avatar id={id} name={person.name} size={104} />
        <Text variant="title">{person.name}</Text>
        <Text tone="muted">@{person.handle}</Text>
        {!blocked ? (
          <Button
            title="Message"
            variant="primary"
            icon={<ChatCircle size={18} color={c.onAccent} weight="fill" />}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: startChat(id) } })}
            style={{ marginTop: 8, alignSelf: "stretch" }}
          />
        ) : (
          <Text variant="footnote" tone="danger">
            Blocked. They can&apos;t message you or see when you&apos;re online.
          </Text>
        )}
      </View>

      <Section title={`Groups you share (${shared.length})`}>
        {shared.length ? (
          shared.map((ch, i) => <Row key={ch.id} label={ch.name} detail={`${ch.members.length + 1} members`} icon={<ChatAvatar chat={ch} size={32} />} last={i === shared.length - 1} onPress={() => router.push({ pathname: "/chat/[id]", params: { id: ch.id } })} />)
        ) : (
          <Row label="No shared groups yet" last />
        )}
      </Section>

      {memories.length ? (
        <Section title="Remembered in your chats" footnote="Each memory stays in the chat it came from.">
          {memories.map((m, i) => (
            <Row key={m.id} label={m.value} detail={`${m.kind} · ${m.chat.name}`} last={i === memories.length - 1} />
          ))}
        </Section>
      ) : null}

      <Section>
        <Row
          label={blocked ? `Unblock ${person.name.split(" ")[0]}` : `Block ${person.name.split(" ")[0]}`}
          destructive={!blocked}
          icon={<Prohibit size={22} color={blocked ? c.accentInk : c.dangerInk} />}
          onPress={() =>
            blocked
              ? updateAccount((a) => ({ ...a, blocked: a.blocked.filter((b) => b !== id) }))
              : confirm(`Block ${person.name}?`, "They won't be able to message you, add you to groups or see when you're online. They aren't told.", "Block", () =>
                  updateAccount((a) => ({ ...a, blocked: [...a.blocked, id] })),
                )
          }
        />
        <Row
          label="Report"
          destructive
          icon={<Warning size={22} color={c.dangerInk} />}
          last
          onPress={() =>
            confirm(
              `Report ${person.name}?`,
              "Your phone sends the last few messages from them to Lynk's safety team, with proof they're genuine. Nothing else in your chats is shared.",
              "Report",
              () => undefined,
            )
          }
        />
      </Section>
    </ScrollView>
  );
}

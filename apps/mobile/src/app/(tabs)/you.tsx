import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Share, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Bell, Camera, Database, Eye, Fingerprint, PaintBrush, ShareNetwork, Sparkle, UserCircle } from "phosphor-react-native";
import { MEMORIES_ABOUT_ME, updateAccount, useAccount } from "@/lib/account";
import { pickProfilePhoto } from "@/lib/media";
import { useColors } from "@/lib/theme";
import { Avatar, Button, LogoMark, Row, Section, Text } from "@/components/ui";
import { FoldSplit } from "@/components/FoldSplit";
import { SideSafe } from "@/components/SideSafe";
import { useTopMargin } from "@/lib/layout";

const PANES = [
  { id: "account", label: "Account", detail: "Profile, email, sign out", icon: UserCircle },
  { id: "security", label: "Sign-in & security", detail: "Phone number, sessions", icon: Fingerprint },
  { id: "privacy", label: "Privacy", detail: "Who can reach you, last seen, blocked", icon: Eye },
  { id: "notifications", label: "Notifications", detail: "Chats, groups, previews", icon: Bell },
  { id: "smart-features", label: "Smart features", detail: "Plans, to-dos, memories, catch-up", icon: Sparkle },
  { id: "appearance", label: "Appearance", detail: "Light, dark or match system", icon: PaintBrush },
  { id: "data", label: "Your data", detail: "Export or delete your account", icon: Database },
] as const;

/** Your profile, invite link, what Lynk remembers about you, and Settings. */
function YouContent() {
  const topMargin = useTopMargin();
  const c = useColors();
  const account = useAccount();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(account?.profile.bio ?? "");
  if (!account) return null;
  const p = account.profile;
  const link = `https://lynk.app/invite/${p.username}`;
  const memories = MEMORIES_ABOUT_ME.filter((m) => !account.removedMemories.includes(m.id));

  const head = (
    <>
        <View style={{ alignItems: "center", paddingHorizontal: 24, gap: 8 }}>
          <Pressable
            accessibilityLabel="Change profile photo"
            onPress={async () => {
              const photo = await pickProfilePhoto();
              if (photo) updateAccount((a) => ({ ...a, profile: { ...a.profile, photo } }));
            }}
          >
            <Avatar id="me" name={p.name} photo={p.photo} size={104} />
            <View style={{ position: "absolute", right: -4, bottom: -4, width: 34, height: 34, borderRadius: 17, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: c.bg }}>
              <Camera size={16} color={c.onAccent} weight="fill" />
            </View>
          </Pressable>
          <Text variant="title">{p.name}</Text>
          <Text tone="muted">@{p.username}</Text>
          {editing ? (
            <View style={{ alignSelf: "stretch", gap: 8 }}>
              <TextInput value={bio} onChangeText={setBio} maxLength={140} multiline autoFocus style={{ borderWidth: 1, borderColor: c.accent, borderRadius: 14, padding: 12, fontSize: 17, color: c.ink, minHeight: 70 }} />
              <Button
                title="Save"
                variant="primary"
                size="sm"
                onPress={() => {
                  updateAccount((a) => ({ ...a, profile: { ...a.profile, bio: bio.trim() } }));
                  setEditing(false);
                }}
              />
            </View>
          ) : (
            <Pressable onPress={() => setEditing(true)}>
              <Text variant="subhead" tone={p.bio ? "ink" : "accent"} style={{ textAlign: "center" }}>
                {p.bio || "Add an about line"}
              </Text>
            </Pressable>
          )}
          <Button title="Share invite link" size="sm" icon={<ShareNetwork size={16} color={c.ink} weight="bold" />} onPress={() => void Share.share({ message: `Chat with me on Lynk: ${link}` })} style={{ marginTop: 8 }} />
        </View>

        <Section title="What Lynk remembers about you" footnote="Things people said in chats you're in. Remove anything you'd rather Lynk didn't keep.">
          {memories.length ? (
            memories.map((m, i) => (
              <Row
                key={m.id}
                label={m.value}
                detail={`${m.kind} · from ${m.chatName}`}
                last={i === memories.length - 1}
                right={
                  <Pressable onPress={() => updateAccount((a) => ({ ...a, removedMemories: [...a.removedMemories, m.id] }))} hitSlop={8}>
                    <Text variant="footnote" tone="accent" weight="600">
                      Remove
                    </Text>
                  </Pressable>
                }
              />
            ))
          ) : (
            <Row label="Nothing yet" last />
          )}
        </Section>
        {account.removedMemories.some((id) => MEMORIES_ABOUT_ME.some((m) => m.id === id)) && account.seeded ? (
          <Pressable onPress={() => updateAccount((a) => ({ ...a, removedMemories: [] }))} style={{ alignSelf: "center", marginTop: 10 }}>
            <Text variant="footnote" tone="accent">
              Undo removals
            </Text>
          </Pressable>
        ) : null}
    </>
  );
  const rest = (
    <>
        <Section title="Settings">
          {PANES.map((pane, i) => (
            <Row
              key={pane.id}
              label={pane.label}
              detail={pane.detail}
              icon={
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
                  <pane.icon size={18} color={c.accentInk} />
                </View>
              }
              last={i === PANES.length - 1}
              onPress={() => router.push({ pathname: "/settings/[pane]", params: { pane: pane.id } })}
            />
          ))}
        </Section>

        <View style={{ alignItems: "center", marginTop: 28, gap: 6 }}>
          <LogoMark height={22} />
          <Text variant="caption" tone="muted">
            Lynk 1.0 · every chat end-to-end encrypted
          </Text>
        </View>
    </>
  );
  // Partly folded Duo: your profile and memories on the left, Settings on the right.
  const pane = (children: ReactNode) => (
  <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: 16 + topMargin, paddingBottom: 32 }}>
      {children}
    </ScrollView>
  );
  return <FoldSplit single={pane(<>{head}{rest}</>)} left={pane(head)} right={pane(rest)} />;
}

export default function You() {
  return (
    <SideSafe>
      <YouContent />
    </SideSafe>
  );
}

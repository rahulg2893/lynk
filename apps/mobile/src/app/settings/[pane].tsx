import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Share, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft, DeviceMobile } from "phosphor-react-native";
import { LANGUAGE_NAMES, PEOPLE, personName } from "@shared/chat";
import {
  accountExport,
  changePhone,
  cancelDeletion,
  deleteAccountNow,
  DELETION_GRACE_DAYS,
  endSession,
  scheduleDeletion,
  signOut,
  timeAgo,
  updateAccount,
  useAccount,
  type Account,
} from "@/lib/account";
import { setSimulatedOffline, useSimulatedOffline } from "@/lib/connection";
import { actionSheet, confirm } from "@/lib/sheet";
import { radius, useColors } from "@/lib/theme";
import { PhoneVerify } from "@/components/PhoneVerify";
import { Avatar, Button, Row, Section, Segmented, SwitchRow, Text } from "@/components/ui";
import { SideSafe } from "@/components/SideSafe";
import { useTopMargin } from "@/lib/layout";

const TITLES: Record<string, string> = {
  account: "Account",
  security: "Sign-in & security",
  privacy: "Privacy",
  notifications: "Notifications",
  "smart-features": "Smart features",
  appearance: "Appearance",
  data: "Your data",
};

export default function SettingsPane() {
  const { pane } = useLocalSearchParams<{ pane: string }>();
  const insets = useSafeAreaInsets();
  const topMargin = useTopMargin();
  const c = useColors();
  const account = useAccount();
  if (!account) return null;
  const set = (fn: (a: Account) => Account) => updateAccount(fn);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + topMargin + 4, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ flexDirection: "row", alignItems: "center", height: 44, paddingHorizontal: 8 }}>
        <CaretLeft size={24} color={c.accentInk} weight="bold" />
        <Text tone="accent">You</Text>
      </Pressable>
      <Text variant="largeTitle" style={{ paddingHorizontal: 20 }}>
        {TITLES[pane] ?? "Settings"}
      </Text>
      {pane === "account" ? <AccountPane account={account} /> : null}
      {pane === "security" ? <SecurityPane account={account} /> : null}
      {pane === "privacy" ? <PrivacyPane account={account} set={set} /> : null}
      {pane === "notifications" ? <NotificationsPane account={account} set={set} /> : null}
      {pane === "smart-features" ? <SmartPane account={account} set={set} /> : null}
      {pane === "appearance" ? <AppearancePane account={account} set={set} /> : null}
      {pane === "data" ? <DataPane account={account} /> : null}
    </ScrollView>
  );
}

function Note({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: radius.lg, backgroundColor: c.surface }}>
      <Text variant="footnote" tone="muted">
        {children}
      </Text>
    </View>
  );
}

function AccountPane({ account }: { account: Account }) {
  const c = useColors();
  const [name, setName] = useState(account.profile.name);
  const [email, setEmail] = useState(account.profile.email);
  const dirty = name.trim() !== account.profile.name || email.trim() !== account.profile.email;
  return (
    <>
      <Section title="Profile">
        <View style={{ padding: 14, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar id="me" name={account.profile.name} photo={account.profile.photo} size={48} />
            <View>
              <Text weight="600">@{account.profile.username}</Text>
              <Text variant="footnote" tone="muted">
                Your username is how people find you.
              </Text>
            </View>
          </View>
          <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={c.muted} style={{ height: 44, borderRadius: 12, borderWidth: 1, borderColor: c.line, paddingHorizontal: 12, fontSize: 17, color: c.ink }} />
          <TextInput value={email} onChangeText={setEmail} placeholder="Email for account recovery (optional)" placeholderTextColor={c.muted} keyboardType="email-address" autoCapitalize="none" style={{ height: 44, borderRadius: 12, borderWidth: 1, borderColor: c.line, paddingHorizontal: 12, fontSize: 17, color: c.ink }} />
          <Button title="Save" variant="primary" size="sm" disabled={!dirty || !name.trim()} onPress={() => updateAccount((a) => ({ ...a, profile: { ...a.profile, name: name.trim(), email: email.trim() } }))} />
        </View>
      </Section>
      <Section>
        <Row label="Sign out" destructive last onPress={() => confirm("Sign out?", "Your chats stay encrypted on this phone for when you sign back in.", "Sign out", signOut)} />
      </Section>
    </>
  );
}

function SecurityPane({ account }: { account: Account }) {
  const c = useColors();
  const [changing, setChanging] = useState(false);
  return (
    <>
      <Section title="Phone number" footnote="You sign in with your number and a code we text you. Friends find you by username and never see it.">
        <Row label={account.profile.phone} detail="Used to sign in" icon={<DeviceMobile size={22} color={c.accentInk} />} right={<Text tone="accent">Change</Text>} onPress={() => setChanging(true)} last />
      </Section>
      <Modal visible={changing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setChanging(false)}>
        <SideSafe>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: c.bg, padding: 24, gap: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text variant="title">Change your number</Text>
            <Text tone="accent" onPress={() => setChanging(false)}>
              Cancel
            </Text>
          </View>
          <Text variant="callout" tone="muted">
            We&apos;ll text a code to the new number. Your chats, groups and settings stay with you.
          </Text>
          <PhoneVerify
            check={(phone) => (phone === account.profile.phone ? "That's already your number." : null)}
            onVerified={(phone) => {
              changePhone(phone);
              setChanging(false);
            }}
          />
        </KeyboardAvoidingView>
        </SideSafe>
      </Modal>
      <Section title="Where you're signed in">
        {account.sessions.map((s, i) => (
          <Row
            key={s.id}
            label={s.device}
            detail={s.current ? "This device" : `${s.browser} · ${s.place} · ${timeAgo(s.lastActiveAt)}`}
            last={i === account.sessions.length - 1 && account.sessions.length < 2}
            right={s.current ? undefined : <Text tone="danger">Sign out</Text>}
            onPress={s.current ? undefined : () => endSession(s.id)}
          />
        ))}
        {account.sessions.length > 1 ? <Row label="Sign out everywhere else" destructive last onPress={() => endSession("others")} /> : null}
      </Section>
      <Section title="Recent activity">
        {account.log.slice(0, 8).map((e, i, arr) => (
          <Row key={e.id} label={e.text} detail={timeAgo(e.at)} last={i === arr.length - 1} />
        ))}
      </Section>
    </>
  );
}

function PrivacyPane({ account, set }: { account: Account; set: (fn: (a: Account) => Account) => void }) {
  const pv = account.privacy;
  return (
    <>
      <Section title="Who can start a chat with you">
        <View style={{ padding: 12 }}>
          <Segmented value={pv.newChats} onChange={(v) => set((a) => ({ ...a, privacy: { ...a.privacy, newChats: v } }))} options={[{ value: "everyone", label: "Everyone" }, { value: "chats", label: "People I chat with" }]} />
        </View>
      </Section>
      <Section title="Who sees online and last seen">
        <View style={{ padding: 12 }}>
          <Segmented value={pv.presence} onChange={(v) => set((a) => ({ ...a, privacy: { ...a.privacy, presence: v } }))} options={[{ value: "everyone", label: "Everyone" }, { value: "chats", label: "My chats" }, { value: "nobody", label: "Nobody" }]} />
        </View>
      </Section>
      <Section footnote="If you turn these off, you won't see other people's either.">
        <SwitchRow label="Read receipts" value={pv.readReceipts} onChange={(v) => set((a) => ({ ...a, privacy: { ...a.privacy, readReceipts: v } }))} last />
      </Section>
      <Section title="Blocked">
        {account.blocked.length ? (
          account.blocked.map((id, i) => (
            <Row key={id} label={personName(id)} detail={`@${PEOPLE[id]?.handle ?? id}`} icon={<Avatar id={id} name={personName(id)} size={30} />} last={i === account.blocked.length - 1} right={<Text tone="accent">Unblock</Text>} onPress={() => set((a) => ({ ...a, blocked: a.blocked.filter((b) => b !== id) }))} />
          ))
        ) : (
          <Row label="Nobody" last />
        )}
      </Section>
      <Note>Every chat is end-to-end encrypted. Only the people in a chat can read it, not even Lynk.</Note>
    </>
  );
}

function NotificationsPane({ account, set }: { account: Account; set: (fn: (a: Account) => Account) => void }) {
  const n = account.notifications;
  const offline = useSimulatedOffline();
  const put = <K extends keyof Account["notifications"]>(k: K, v: Account["notifications"][K]) => set((a) => ({ ...a, notifications: { ...a.notifications, [k]: v } }));
  return (
    <>
      <Note>While Lynk is open, new messages in other chats slide in at the top of the screen. Alerts with Lynk closed arrive with push notifications.</Note>
      <Section title="Chats">
        <SwitchRow label="One-to-one chats" detail="New messages from one person." value={n.direct} onChange={(v) => put("direct", v)} last />
      </Section>
      <Section title="Group chats" footnote="Mentions only keeps busy groups quiet until someone needs you.">
        <View style={{ padding: 12 }}>
          <Segmented value={n.groups} onChange={(v) => put("groups", v)} options={[{ value: "all", label: "All" }, { value: "mentions", label: "Mentions" }, { value: "off", label: "Off" }]} />
        </View>
      </Section>
      <Section title="Alerts" footnote="To mute one chat, open it and tap its name.">
        <SwitchRow label="Show message previews" detail="Off shows only who wrote, not what they said." value={n.previews} onChange={(v) => put("previews", v)} />
        <SwitchRow label="Sounds" value={n.sounds} onChange={(v) => put("sounds", v)} last />
      </Section>
      <Section title="Try it" footnote="Simulates losing the connection, so you can see messages wait and send themselves when you reconnect.">
        <SwitchRow label="Test offline mode" value={offline} onChange={setSimulatedOffline} last />
      </Section>
    </>
  );
}

function SmartPane({ account, set }: { account: Account; set: (fn: (a: Account) => Account) => void }) {
  const s = account.smart;
  const off = !s.enabled;
  const put = <K extends keyof Account["smart"]>(k: K, v: Account["smart"][K]) => set((a) => ({ ...a, smart: { ...a.smart, [k]: v } }));
  return (
    <>
      <Note>Every chat is end-to-end encrypted, so smart features run on this phone, not on Lynk&apos;s servers. They only ever suggest: nothing is saved until someone in the chat confirms it.</Note>
      <Section>
        <SwitchRow label="Smart features" detail={off ? "Off. Lynk is a plain chat app." : "On, running on this phone."} value={s.enabled} onChange={(v) => put("enabled", v)} last />
      </Section>
      <Section title="Suggestions" footnote={off ? "Turn on smart features to choose these." : undefined}>
        <SwitchRow label="Plans" detail="When a chat agrees on a time or place." value={s.plans} onChange={(v) => put("plans", v)} disabled={off} />
        <SwitchRow label="To-dos" detail="Asks like “can you bring the snacks?”" value={s.todos} onChange={(v) => put("todos", v)} disabled={off} />
        <SwitchRow label="Memories" detail="Birthdays, favourite places and other little things." value={s.memories} onChange={(v) => put("memories", v)} disabled={off} />
        <SwitchRow label="Catch-up" detail="A summary when a busy group gets ahead of you." value={s.catchUp} onChange={(v) => put("catchUp", v)} disabled={off} />
        <SwitchRow label="Voice-note transcripts" detail="Read or search voice notes." value={s.transcripts} onChange={(v) => put("transcripts", v)} disabled={off} last />
      </Section>
      <Section title="Translation" footnote="Translated messages always keep a View original button.">
        <SwitchRow label="Offer translations" value={s.translation} onChange={(v) => put("translation", v)} disabled={off} />
        <Row
          label="Translate into"
          detail={LANGUAGE_NAMES[s.translateTo] ?? s.translateTo}
          last
          onPress={off ? undefined : () => actionSheet("Translate into", Object.entries(LANGUAGE_NAMES).map(([code, label]) => ({ label, onPress: () => put("translateTo", code) })))}
        />
      </Section>
    </>
  );
}

function AppearancePane({ account, set }: { account: Account; set: (fn: (a: Account) => Account) => void }) {
  return (
    <Section footnote="Match system follows your phone's light and dark setting.">
      <View style={{ padding: 12 }}>
        <Segmented value={account.appearance} onChange={(v) => set((a) => ({ ...a, appearance: v }))} options={[{ value: "system", label: "Match system" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
      </View>
    </Section>
  );
}

function DataPane({ account }: { account: Account }) {
  const scheduled = account.deletionAt;
  return (
    <>
      <Section title="Export" footnote="Everything Lynk holds about you, as JSON. Your chats stay on your devices.">
        <Row label="Share my data" last onPress={() => void Share.share({ message: JSON.stringify(accountExport(account), null, 2) })} />
      </Section>
      <Section title="Delete your account">
        {scheduled ? (
          <>
            <Row label={`Deleting on ${new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long" }).format(scheduled)}`} detail="You can change your mind until then." />
            <Row label="Keep my account" last onPress={cancelDeletion} />
          </>
        ) : (
          <Row label={`Delete in ${DELETION_GRACE_DAYS} days`} detail="Change your mind any time before then." last onPress={() => confirm("Schedule deletion?", `Your account and chats are deleted in ${DELETION_GRACE_DAYS} days unless you cancel.`, "Schedule", scheduleDeletion)} />
        )}
      </Section>
      <Section>
        <Row label="Delete now" destructive last onPress={() => confirm("Delete your account now?", "This phone forgets your account and every chat. This can't be undone.", "Delete", () => void deleteAccountNow())} />
      </Section>
    </>
  );
}

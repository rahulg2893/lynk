import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import type { Account as WebAccount } from "@shared/account";
import { PEOPLE } from "@shared/chat";
import { DEMO_PHONE } from "@shared/phone";
import { locale, t, type Lang } from "@shared/i18n";
import { getJSON, removeKey, setJSON } from "./storage";

/**
 * The account, shaped exactly like the web app's (so shared code such as
 * notification grouping works unchanged), plus the theme and the app language,
 * which the web keeps separately (the web is English only for now). Stored in the encrypted database; nothing leaves the phone.
 */
export type Account = WebAccount & { appearance: "system" | "light" | "dark"; language: Lang };

const KEY = "account";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const DEVICE = Platform.OS === "ios" ? "iPhone" : "Android phone";

export const MEMORIES_ABOUT_ME = [
  { id: "me-1", kind: "Food", value: "Doesn't eat mushrooms", chatId: "c-climbers", chatName: "Weekend climbers", from: "tomas" },
  { id: "me-2", kind: "Birthday", value: "Birthday is 14 March", chatId: "c-family", chatName: "Family", from: "priya" },
  { id: "me-3", kind: "Place", value: "Lives closest to the airport", chatId: "c-family", chatName: "Family", from: "sofia" },
];

export const USERNAME_RULES = "3 to 20 characters: lowercase letters, numbers, dots and underscores.";

function defaults(now = Date.now()): Account {
  return {
    version: 1,
    session: null,
    profile: { name: "Rahul", username: "rahul", bio: "Climbing on weekends, cooking on weeknights.", photo: null, phone: DEMO_PHONE, email: "", emailVerified: false },
    sessions: [
      { id: "s-this", device: `This ${DEVICE}`, browser: "Lynk app", place: "Your current session", lastActiveAt: now, current: true },
      { id: "s-web", device: "Mac", browser: "Safari", place: "Bengaluru, India", lastActiveAt: now - 3 * HOUR, current: false },
    ],
    log: [
      { id: "l-1", at: now - 2 * HOUR, text: `Signed in with your phone number on this ${DEVICE}` },
      { id: "l-2", at: now - 3 * HOUR, text: "Signed in with your phone number on Mac" },
    ],
    privacy: { newChats: "everyone", presence: "chats", readReceipts: true },
    notifications: { direct: true, groups: "mentions", previews: true, sounds: true, asked: false, seenAt: 0 },
    smart: { enabled: true, plans: true, todos: true, memories: true, catchUp: true, transcripts: true, translation: false, translateTo: "en" },
    blocked: [],
    removedMemories: [],
    deletionAt: null,
    seeded: true,
    appearance: "system",
    language: "en",
  };
}

let cache: Account | null = null;
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

/** Load the account from the encrypted store; call once before showing the app. */
export async function hydrateAccount() {
  if (hydrated) return;
  const base = defaults();
  const saved = await getJSON<Partial<Account>>(KEY).catch(() => null);
  cache = saved
    ? {
        ...base,
        ...saved,
        // The preview number moved from a UK one to +91 when Lynk started in India.
        profile: { ...base.profile, ...saved.profile, ...(saved.profile?.phone === "+447700900123" ? { phone: base.profile.phone } : {}) },
        privacy: { ...base.privacy, ...saved.privacy },
        notifications: { ...base.notifications, ...saved.notifications },
        smart: { ...base.smart, ...saved.smart },
        version: 1,
      }
    : base;
  hydrated = true;
  emit();
}

const read = () => cache;

export function useAccount(): Account | null {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    read,
    read,
  );
}

export const getAccount = () => cache ?? defaults();

export function updateAccount(fn: (a: Account) => Account) {
  cache = fn(getAccount());
  void setJSON(KEY, cache);
  emit();
}

const eventId = () => `l-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function logged(a: Account, text: string): Account {
  return { ...a, log: [{ id: eventId(), at: Date.now(), text }, ...a.log].slice(0, 20) };
}

/** Call once the texted code checks out. */
export const signIn = () => updateAccount((a) => logged({ ...a, session: { since: Date.now() } }, `Signed in with your phone number on this ${DEVICE}`));

/** Finish sign-up: open the session held back during the welcome step. */
export const startSession = () => updateAccount((a) => ({ ...a, session: { since: Date.now() } }));

export const signOut = () => updateAccount((a) => ({ ...a, session: null }));

/** A new account replaces the demo one and starts with an empty inbox. */
export function createAccount(input: { name: string; username: string; phone: string }, { startSession = true } = {}) {
  const now = Date.now();
  void removeKey(`chats:${input.username}`);
  const base = defaults(now);
  updateAccount(() => ({
    ...base,
    // Sign-up holds the session back until its welcome step is done.
    session: startSession ? { since: now } : null,
    profile: { ...base.profile, name: input.name, username: input.username, phone: input.phone, bio: "" },
    sessions: base.sessions.filter((s) => s.current),
    log: [{ id: eventId(), at: now, text: "Account created with your phone number" }],
    removedMemories: MEMORIES_ABOUT_ME.map((m) => m.id),
    seeded: false,
  }));
}

/** Call once a code texted to the new number checks out. */
export const changePhone = (phone: string) => updateAccount((a) => logged({ ...a, profile: { ...a.profile, phone } }, "Phone number changed"));

export function endSession(id: string | "others") {
  updateAccount((a) =>
    logged({ ...a, sessions: a.sessions.filter((s) => s.current || (id !== "others" && s.id !== id)) }, id === "others" ? "Signed out of all other sessions" : "Signed out of a session"),
  );
}

const RESERVED = new Set(["lynk", "admin", "support", "help", "settings", "app", "me", "you"]);

export function usernameProblem(raw: string): string | null {
  const u = raw.trim();
  if (!u) return "Choose a username.";
  if (u.length < 3) return "Use at least 3 characters.";
  if (u.length > 20) return "Use 20 characters or fewer.";
  if (/[A-Z]/.test(u)) return "Use lowercase letters only.";
  if (!/^[a-z0-9._]+$/.test(u)) return "Use only letters, numbers, dots and underscores.";
  if (/^\.|\.$/.test(u) || u.includes("..")) return "Dots can't start, end or repeat.";
  return null;
}

/** Mock availability check with network-like latency. */
export function checkUsername(username: string, current?: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (username === current) return resolve(true);
      resolve(!(RESERVED.has(username) || Object.values(PEOPLE).some((p) => p.handle === username)));
    }, 450);
  });
}

export function suggestUsernames(username: string): string[] {
  const base = username.replace(/[._]+$/, "") || "friend";
  return [`${base}_${new Date().getFullYear() % 100}`, `${base}.lynk`].filter((s) => !usernameProblem(s));
}

export function timeAgo(at: number, now = Date.now()) {
  const mins = Math.round((now - at) / 60_000);
  if (mins < 1) return t("Just now");
  if (mins < 60) return t("{n} min ago", { n: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t("{n} h ago", { n: hours });
  const days = Math.round(hours / 24);
  if (days === 1) return t("Yesterday");
  if (days < 30) return t("{n} days ago", { n: days });
  return new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short", year: "numeric" }).format(at);
}

export const DELETION_GRACE_DAYS = 30;
export const scheduleDeletion = () => updateAccount((a) => logged({ ...a, deletionAt: Date.now() + DELETION_GRACE_DAYS * DAY }, "Account deletion scheduled"));
export const cancelDeletion = () => updateAccount((a) => logged({ ...a, deletionAt: null }, "Account deletion cancelled"));

/** Delete now: the phone forgets the account and its chats entirely. */
export async function deleteAccountNow() {
  const username = getAccount().profile.username;
  await removeKey(`chats:${username}`);
  await removeKey(KEY);
  cache = { ...defaults(), session: null };
  emit();
}

export function accountExport(a: Account) {
  return {
    exportedAt: new Date().toISOString(),
    profile: a.profile,
    sessions: a.sessions,
    securityLog: a.log,
    settings: { privacy: a.privacy, notifications: a.notifications, smartFeatures: a.smart, appearance: a.appearance },
    blocked: a.blocked,
    memoriesAboutYou: MEMORIES_ABOUT_ME.filter((m) => !a.removedMemories.includes(m.id)),
  };
}

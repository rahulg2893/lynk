import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import type { Account as WebAccount, SignInMethod } from "@shared/account";
import { PEOPLE } from "@shared/chat";
import { getJSON, removeKey, setJSON } from "./storage";

/**
 * The account, shaped exactly like the web app's (so shared code such as
 * notification grouping works unchanged), plus the theme choice, which the web
 * keeps separately. Stored in the encrypted database; nothing leaves the phone.
 */
export type Account = WebAccount & { appearance: "system" | "light" | "dark" };
export type { SignInMethod };

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
    profile: { name: "Rahul", username: "rahul", bio: "Climbing on weekends, cooking on weeknights.", photo: null, email: "", emailVerified: false },
    passkeys: [{ id: "pk-1", name: "iCloud Keychain", createdAt: now - 40 * DAY, lastUsedAt: now - 2 * HOUR }],
    linked: { apple: true, google: false },
    sessions: [
      { id: "s-this", device: `This ${DEVICE}`, browser: "Lynk app", place: "Your current session", lastActiveAt: now, current: true },
      { id: "s-web", device: "Mac", browser: "Safari", place: "London, UK", lastActiveAt: now - 3 * HOUR, current: false },
    ],
    log: [
      { id: "l-1", at: now - 2 * HOUR, text: `Signed in with a passkey on this ${DEVICE}` },
      { id: "l-2", at: now - 40 * DAY, text: "Passkey added: iCloud Keychain" },
    ],
    privacy: { newChats: "everyone", presence: "chats", readReceipts: true },
    notifications: { direct: true, groups: "mentions", previews: true, sounds: true, asked: false, seenAt: 0 },
    smart: { enabled: true, plans: true, todos: true, memories: true, catchUp: true, transcripts: true, translation: false, translateTo: "en" },
    blocked: [],
    removedMemories: [],
    deletionAt: null,
    seeded: true,
    appearance: "system",
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
        profile: { ...base.profile, ...saved.profile },
        linked: { ...base.linked, ...saved.linked },
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
const METHOD_LABEL: Record<SignInMethod, string> = { passkey: "a passkey", apple: "Apple", google: "Google" };
export const methodLabel = (m: SignInMethod) => METHOD_LABEL[m];

function logged(a: Account, text: string): Account {
  return { ...a, log: [{ id: eventId(), at: Date.now(), text }, ...a.log].slice(0, 20) };
}

export function signIn(method: SignInMethod) {
  updateAccount((a) =>
    logged(
      {
        ...a,
        session: { method, since: Date.now() },
        linked: method === "passkey" ? a.linked : { ...a.linked, [method]: true },
        passkeys: method === "passkey" ? a.passkeys.map((p, i) => (i === 0 ? { ...p, lastUsedAt: Date.now() } : p)) : a.passkeys,
      },
      `Signed in with ${METHOD_LABEL[method]} on this ${DEVICE}`,
    ),
  );
}

/** Finish sign-up: open the session the new account was created with. */
export const startSession = (method: SignInMethod) => updateAccount((a) => ({ ...a, session: { method, since: Date.now() } }));

export const signOut = () => updateAccount((a) => ({ ...a, session: null }));

/** A new account replaces the demo one and starts with an empty inbox. */
export function createAccount(input: { name: string; username: string; method: SignInMethod }, { startSession = true } = {}) {
  const now = Date.now();
  void removeKey(`chats:${input.username}`);
  const base = defaults(now);
  updateAccount(() => ({
    ...base,
    // Sign-up holds the session back until its welcome step is done.
    session: startSession ? { method: input.method, since: now } : null,
    profile: { ...base.profile, name: input.name, username: input.username, bio: "" },
    passkeys: input.method === "passkey" ? [{ id: `pk-${now}`, name: `Passkey on this ${DEVICE}`, createdAt: now, lastUsedAt: now }] : [],
    linked: { apple: input.method === "apple", google: input.method === "google" },
    sessions: base.sessions.filter((s) => s.current),
    log: [{ id: eventId(), at: now, text: `Account created with ${METHOD_LABEL[input.method]}` }],
    removedMemories: MEMORIES_ABOUT_ME.map((m) => m.id),
    seeded: false,
  }));
}

export function addPasskey() {
  const now = Date.now();
  updateAccount((a) =>
    logged({ ...a, passkeys: [...a.passkeys, { id: `pk-${now}`, name: `Passkey on this ${DEVICE}`, createdAt: now, lastUsedAt: null }] }, `Passkey added on this ${DEVICE}`),
  );
}

export function removePasskey(id: string) {
  updateAccount((a) => {
    const key = a.passkeys.find((p) => p.id === id);
    return logged({ ...a, passkeys: a.passkeys.filter((p) => p.id !== id) }, `Passkey removed: ${key?.name ?? "unknown"}`);
  });
}

export function setLinked(provider: "apple" | "google", on: boolean) {
  const label = provider === "apple" ? "Apple" : "Google";
  updateAccount((a) => logged({ ...a, linked: { ...a.linked, [provider]: on } }, `${on ? "Connected" : "Disconnected"} ${label}`));
}

export const signInMethodCount = (a: Account) => a.passkeys.length + Number(a.linked.apple) + Number(a.linked.google);

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
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(at);
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
    signInMethods: { passkeys: a.passkeys, apple: a.linked.apple, google: a.linked.google },
    sessions: a.sessions,
    securityLog: a.log,
    settings: { privacy: a.privacy, notifications: a.notifications, smartFeatures: a.smart, appearance: a.appearance },
    blocked: a.blocked,
    memoriesAboutYou: MEMORIES_ABOUT_ME.filter((m) => !a.removedMemories.includes(m.id)),
  };
}

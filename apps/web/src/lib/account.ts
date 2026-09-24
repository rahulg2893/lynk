"use client";

import { useSyncExternalStore } from "react";
import { PEOPLE } from "./chat";

/**
 * The signed-in person, their sign-in methods and their settings. Frontend
 * only: everything lives in localStorage until the Go server exists, and the
 * shape mirrors what the API will return so the pages can be rewired later.
 */

export type SignInMethod = "passkey" | "apple" | "google";

export type Passkey = { id: string; name: string; createdAt: number; lastUsedAt: number | null };

export type DeviceSession = {
  id: string;
  device: string;
  browser: string;
  place: string;
  lastActiveAt: number;
  current: boolean;
};

export type SecurityEvent = { id: string; at: number; text: string };

export type Audience = "everyone" | "chats" | "nobody";

export type Account = {
  version: 1;
  session: { method: SignInMethod; since: number } | null;
  profile: {
    name: string;
    username: string;
    bio: string;
    /** A small data URL; real uploads go to signed storage later. */
    photo: string | null;
    email: string;
    emailVerified: boolean;
  };
  passkeys: Passkey[];
  linked: { apple: boolean; google: boolean };
  sessions: DeviceSession[];
  log: SecurityEvent[];
  privacy: {
    /** Who can start a new one-to-one chat with you. */
    newChats: Exclude<Audience, "nobody">;
    /** Who sees "online" and "last seen". */
    presence: Audience;
    readReceipts: boolean;
  };
  notifications: {
    direct: boolean;
    groups: "all" | "mentions" | "off";
    previews: boolean;
    sounds: boolean;
  };
  smart: {
    enabled: boolean;
    plans: boolean;
    todos: boolean;
    memories: boolean;
    catchUp: boolean;
    transcripts: boolean;
    translation: boolean;
    translateTo: string;
  };
  blocked: string[];
  /** Memories about you that you removed. */
  removedMemories: string[];
  /** Scheduled deletion (epoch ms), or null. */
  deletionAt: number | null;
};

/** Things people said about you, kept inside the chat they came from. */
export const MEMORIES_ABOUT_ME = [
  { id: "me-1", kind: "Food", value: "Doesn't eat mushrooms", chatId: "c-climbers", chatName: "Weekend climbers", from: "tomas" },
  { id: "me-2", kind: "Birthday", value: "Birthday is 14 March", chatId: "c-family", chatName: "Family", from: "priya" },
  { id: "me-3", kind: "Place", value: "Lives closest to the airport", chatId: "c-family", chatName: "Family", from: "sofia" },
];

const KEY = "lynk-account";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const USERNAME_RULES = "3 to 20 characters: lowercase letters, numbers, dots and underscores.";

function defaults(now = Date.now()): Account {
  return {
    version: 1,
    session: null,
    profile: { name: "Rahul", username: "rahul", bio: "Climbing on weekends, cooking on weeknights.", photo: null, email: "", emailVerified: false },
    passkeys: [{ id: "pk-1", name: "iCloud Keychain", createdAt: now - 40 * DAY, lastUsedAt: now - 2 * HOUR }],
    linked: { apple: true, google: false },
    sessions: [
      { id: "s-this", device: "This browser", browser: browserName(), place: "Your current session", lastActiveAt: now, current: true },
      { id: "s-phone", device: "iPhone", browser: "Safari", place: "London, UK", lastActiveAt: now - 3 * HOUR, current: false },
      { id: "s-laptop", device: "Mac", browser: "Chrome", place: "London, UK", lastActiveAt: now - 6 * DAY, current: false },
    ],
    log: [
      { id: "l-1", at: now - 2 * HOUR, text: "Signed in with a passkey on this browser" },
      { id: "l-2", at: now - 3 * HOUR, text: "Signed in with Apple on iPhone" },
      { id: "l-3", at: now - 40 * DAY, text: "Passkey added: iCloud Keychain" },
    ],
    privacy: { newChats: "everyone", presence: "chats", readReceipts: true },
    notifications: { direct: true, groups: "mentions", previews: true, sounds: true },
    smart: {
      enabled: true,
      plans: true,
      todos: true,
      memories: true,
      catchUp: true,
      transcripts: true,
      translation: false,
      translateTo: "en",
    },
    blocked: [],
    removedMemories: [],
    deletionAt: null,
  };
}

function browserName() {
  if (typeof navigator === "undefined") return "Browser";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Browser";
}

let cache: Account | null = null;
const listeners = new Set<() => void>();

function read(): Account {
  if (cache) return cache;
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Account>;
      // Shallow-merge each section so new fields get their defaults.
      cache = {
        ...base,
        ...saved,
        profile: { ...base.profile, ...saved.profile },
        linked: { ...base.linked, ...saved.linked },
        privacy: { ...base.privacy, ...saved.privacy },
        notifications: { ...base.notifications, ...saved.notifications },
        smart: { ...base.smart, ...saved.smart },
        version: 1,
      };
      return cache;
    }
  } catch {
    // Unreadable storage falls back to defaults.
  }
  cache = base;
  return cache;
}

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/** Apply a change and persist it. */
export function updateAccount(fn: (a: Account) => Account) {
  cache = fn(read());
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage can be full or blocked; the change still applies for this visit.
  }
  emit();
}

/** The account, or null during server rendering and hydration. */
export function useAccount(): Account | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/* ---------- Actions ---------- */

const eventId = () => `l-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const METHOD_LABEL: Record<SignInMethod, string> = {
  passkey: "a passkey",
  apple: "Apple",
  google: "Google",
};

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
        passkeys:
          method === "passkey" ? a.passkeys.map((p, i) => (i === 0 ? { ...p, lastUsedAt: Date.now() } : p)) : a.passkeys,
      },
      `Signed in with ${METHOD_LABEL[method]} on this browser`,
    ),
  );
}

export function signOut() {
  updateAccount((a) => ({ ...a, session: null }));
}

/** A new account replaces the demo one. */
export function createAccount(input: { name: string; username: string; method: SignInMethod }) {
  const now = Date.now();
  const base = defaults(now);
  const next: Account = {
    ...base,
    session: { method: input.method, since: now },
    profile: { ...base.profile, name: input.name, username: input.username, bio: "" },
    passkeys: input.method === "passkey" ? [{ id: `pk-${now}`, name: `Passkey on ${browserName()}`, createdAt: now, lastUsedAt: now }] : [],
    linked: { apple: input.method === "apple", google: input.method === "google" },
    sessions: base.sessions.filter((s) => s.current),
    log: [{ id: eventId(), at: now, text: `Account created with ${METHOD_LABEL[input.method]}` }],
  };
  updateAccount(() => next);
}

export function addPasskey() {
  const now = Date.now();
  updateAccount((a) =>
    logged(
      { ...a, passkeys: [...a.passkeys, { id: `pk-${now}`, name: `Passkey on ${browserName()}`, createdAt: now, lastUsedAt: null }] },
      `Passkey added: ${browserName()}`,
    ),
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

/** How many ways this person can still sign in. */
export const signInMethodCount = (a: Account) => a.passkeys.length + Number(a.linked.apple) + Number(a.linked.google);

export function endSession(id: string | "others") {
  updateAccount((a) =>
    logged(
      { ...a, sessions: a.sessions.filter((s) => s.current || (id !== "others" && s.id !== id)) },
      id === "others" ? "Signed out of all other sessions" : "Signed out of a session",
    ),
  );
}

/* ---------- Usernames ---------- */

const RESERVED = new Set(["lynk", "admin", "support", "help", "settings", "app", "me", "you"]);

/** A human-readable problem with the username, or null when it is valid. */
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
    window.setTimeout(() => {
      if (username === current) return resolve(true);
      const taken = RESERVED.has(username) || Object.values(PEOPLE).some((p) => p.handle === username);
      resolve(!taken);
    }, 450);
  });
}

/** Two nearby names that are free, for a taken username. */
export function suggestUsernames(username: string): string[] {
  const base = username.replace(/[._]+$/, "") || "friend";
  return [`${base}_${new Date().getFullYear() % 100}`, `${base}.lynk`].filter((s) => !usernameProblem(s));
}

/* ---------- Photos ---------- */

/** Crop to a centred square and shrink to 256px so it fits in storage. */
export function resizePhoto(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file isn't an image we can read."));
    };
    img.src = url;
  });
}

/* ---------- Formatting ---------- */

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

export const formatDate = (at: number) =>
  new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" }).format(at);

/* ---------- Your data ---------- */

export const DELETION_GRACE_DAYS = 30;

export function scheduleDeletion() {
  updateAccount((a) => logged({ ...a, deletionAt: Date.now() + DELETION_GRACE_DAYS * DAY }, "Account deletion scheduled"));
}

export function cancelDeletion() {
  updateAccount((a) => logged({ ...a, deletionAt: null }, "Account deletion cancelled"));
}

/** Delete now: in this preview, the browser forgets the account entirely. */
export function deleteAccountNow() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing stored is fine.
  }
  cache = { ...defaults(), session: null };
  emit();
}

/** Everything Lynk holds about you, as a downloadable JSON file. */
export function exportAccount(a: Account) {
  const data = {
    exportedAt: new Date().toISOString(),
    profile: a.profile,
    signInMethods: { passkeys: a.passkeys, apple: a.linked.apple, google: a.linked.google },
    sessions: a.sessions,
    securityLog: a.log,
    settings: { privacy: a.privacy, notifications: a.notifications, smartFeatures: a.smart },
    blocked: a.blocked,
    memoriesAboutYou: MEMORIES_ABOUT_ME.filter((m) => !a.removedMemories.includes(m.id)),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `lynk-${a.profile.username}-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

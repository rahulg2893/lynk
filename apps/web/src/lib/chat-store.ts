"use client";

import { createMockChats, type Chat } from "./chat";

/**
 * Chats kept in this browser until the server exists, one list per username.
 * The demo account starts with sample chats; new accounts start empty.
 */
const key = (username: string) => `lynk-chats-${username}`;

export function loadChats(username: string, seeded: boolean, now: number): Chat[] {
  try {
    const raw = localStorage.getItem(key(username));
    if (raw) {
      const chats = JSON.parse(raw) as Chat[];
      return chats.map((c) => ({ ...c, typing: null }));
    }
  } catch {
    // Unreadable storage: fall through to a fresh start.
  }
  return seeded ? createMockChats(now) : [];
}

/** Session-only file links (blob: URLs) can't survive a reload, so they're dropped. */
function portable(chats: Chat[]): Chat[] {
  return chats.map((c) => ({
    ...c,
    typing: null,
    messages: c.messages.map((m) =>
      m.attachments
        ? { ...m, attachments: m.attachments.map((a) => (a.url?.startsWith("blob:") ? { ...a, url: null } : a)) }
        : m,
    ),
  }));
}

export function saveChats(username: string, chats: Chat[]) {
  const data = portable(chats);
  try {
    localStorage.setItem(key(username), JSON.stringify(data));
  } catch {
    // Storage full (large photos): keep the text, drop the photos from storage.
    try {
      const light = data.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.attachments ? { ...m, attachments: m.attachments.map((a) => ({ ...a, url: null })) } : m,
        ),
      }));
      localStorage.setItem(key(username), JSON.stringify(light));
    } catch {
      // Still no room; changes last for this visit only.
    }
  }
}

export function clearChats(username: string) {
  try {
    localStorage.removeItem(key(username));
  } catch {
    // Nothing stored is fine.
  }
}

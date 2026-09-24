"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "./account";
import { createMockChats, type Chat } from "./chat";
import { deleteSecure, readSecure, secureStorageAvailable, writeSecure } from "./secure-store";

/**
 * Chats kept in this browser until the server exists, one list per username,
 * encrypted at rest (see secure-store). The demo account starts with sample
 * chats; new accounts start empty.
 */
const legacyKey = (username: string) => `lynk-chats-${username}`;
const record = (username: string) => `chats:${username}`;

const settle = (chats: Chat[]) => chats.map((c) => ({ ...c, typing: null }));

export async function loadChats(username: string, seeded: boolean, now: number): Promise<Chat[]> {
  try {
    const stored = await readSecure<Chat[]>(record(username));
    if (stored) return settle(stored);
  } catch {
    // Unreadable (key lost with cleared site data): fall through.
  }
  // Chats saved before storage was encrypted: move them in, then delete the readable copy.
  try {
    const raw = localStorage.getItem(legacyKey(username));
    if (raw) {
      const chats = settle(JSON.parse(raw) as Chat[]);
      await saveChats(username, chats);
      localStorage.removeItem(legacyKey(username));
      return chats;
    }
  } catch {
    // Unreadable storage: a fresh start.
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

export async function saveChats(username: string, chats: Chat[]) {
  if (!secureStorageAvailable()) return; // Nowhere safe to keep them: changes last for this visit only.
  try {
    await writeSecure(record(username), portable(chats));
  } catch {
    // Out of space (large photos): keep the text, drop the photos from storage.
    try {
      const light = portable(chats).map((c) => ({
        ...c,
        messages: c.messages.map((m) => (m.attachments ? { ...m, attachments: m.attachments.map((a) => ({ ...a, url: null })) } : m)),
      }));
      await writeSecure(record(username), light);
    } catch {
      // Still no room; changes last for this visit only.
    }
  }
}

export function clearChats(username: string) {
  void deleteSecure(record(username)).catch(() => undefined);
  try {
    localStorage.removeItem(legacyKey(username));
  } catch {
    // Nothing stored is fine.
  }
}

/**
 * The saved chats for pages outside the chat screen (Calendar, Saved).
 * `change` applies an update and writes it straight back to this browser.
 */
export function useStoredChats() {
  const account = useAccount();
  const username = account?.profile.username;
  const seeded = account?.seeded ?? true;
  const [state, setState] = useState<{ chats: Chat[]; loaded: boolean; now: number }>({ chats: [], loaded: false, now: 0 });

  useEffect(() => {
    if (!username) return;
    let live = true;
    const now = Date.now();
    void loadChats(username, seeded, now).then((chats) => live && setState({ chats, loaded: true, now }));
    return () => {
      live = false;
    };
  }, [username, seeded]);

  const change = useCallback(
    (fn: (chats: Chat[]) => Chat[]) =>
      setState((s) => {
        const chats = fn(s.chats);
        if (username) void saveChats(username, chats);
        return { ...s, chats };
      }),
    [username],
  );

  return { ...state, change };
}

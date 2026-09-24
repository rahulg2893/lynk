"use client";

import { messagePreview, personName, type Chat, type Message } from "./chat";
import type { Account } from "./account";

type Settings = Account["notifications"];

const DAY = 24 * 3_600_000;

/** Whether a message names you with an @mention. */
export const mentionsMe = (text: string, me: string) => new RegExp(`(^|\\s)@${me}\\b`, "i").test(text);

/**
 * The one rule for what deserves a notification, shared by browser alerts and
 * the notifications list: never your own messages or muted chats; one-to-one
 * chats follow "One-to-one chats"; groups follow "All", "Mentions only" or "Off".
 */
export function notifies(chat: Chat, message: Message, settings: Settings, me: string) {
  if (message.from === "me" || message.deleted || chat.muted) return false;
  if (chat.kind === "dm") return settings.direct;
  if (settings.groups === "all") return true;
  if (settings.groups === "mentions") return mentionsMe(message.text, me);
  return false;
}

const summary = (m: Message) => messagePreview(m);

export type NotificationGroup = {
  chat: Chat;
  latest: Message;
  count: number;
  mention: boolean;
  unread: boolean;
};

/** Recent notifying messages, one entry per chat (newest first) so busy groups don't flood the list. */
export function notificationGroups(chats: Chat[], settings: Settings, me: string, now: number): NotificationGroup[] {
  const groups: NotificationGroup[] = [];
  for (const chat of chats) {
    const items = chat.messages.filter((m) => now - m.at < 2 * DAY && notifies(chat, m, settings, me));
    const latest = items.at(-1);
    if (!latest) continue;
    groups.push({
      chat,
      latest,
      count: items.length,
      mention: items.some((m) => mentionsMe(m.text, me)),
      unread: latest.at > settings.seenAt,
    });
  }
  return groups.sort((a, b) => b.latest.at - a.latest.at);
}

export const notificationText = (m: Message, settings: Settings) => (settings.previews ? summary(m) : "New message");

export const permission = (): NotificationPermission | "unsupported" =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;

/**
 * A browser notification for a message that arrived while you weren't
 * looking. Clicking it brings the tab forward on that chat.
 */
export function showBrowserNotification(chat: Chat, message: Message, settings: Settings, onOpen: () => void) {
  if (permission() !== "granted") return;
  const title = chat.kind === "group" ? `${personName(message.from)} in ${chat.name}` : personName(message.from);
  try {
    const n = new Notification(title, {
      body: notificationText(message, settings),
      tag: chat.id,
      icon: "/apple-icon.png",
      silent: !settings.sounds,
    });
    n.onclick = () => {
      window.focus();
      onOpen();
      n.close();
    };
  } catch {
    // Some browsers only allow notifications from a service worker; skip quietly.
  }
}

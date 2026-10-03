import * as Notifications from "expo-notifications";
import { REMINDER_LEAD_MS, remindable, reminderText, type Chat } from "@shared/chat";
import { getState } from "./store";

/**
 * Local reminders an hour before plans you said Going or Maybe to. They're
 * scheduled on the phone itself, so they need no server: every change to the
 * chats reschedules the lot.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

/** Ask for permission in context: when you say you're going, never on launch. */
export async function askForReminders() {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status !== "undetermined" || !canAskAgain) return;
  const { granted } = await Notifications.requestPermissionsAsync().catch(() => ({ granted: false }));
  // The chats changed (and were synced) while the prompt was up, before permission existed.
  if (granted) await syncReminders(getState().chats);
}

// One reschedule at a time, so two overlapping runs can't both add the same reminders.
let queue = Promise.resolve();
export const syncReminders = (chats: Chat[]) => (queue = queue.then(() => reschedule(chats)).catch(() => undefined));

async function reschedule(chats: Chat[]) {
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  for (const { chat, plan } of remindable(chats, now)) {
    const at = plan.when! - REMINDER_LEAD_MS;
    if (at <= now) continue;
    const { title, body } = reminderText(chat, plan, at);
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { chatId: chat.id } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
  }
}

import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { Chat, Decision } from "@shared/chat";
import { buildIcs } from "@shared/ics";

const slug = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "plan";

/**
 * "Add to calendar": the same RFC 5545 file the web downloads, handed to the
 * share sheet so Calendar (or any calendar app) can import it. It leaves
 * Lynk's encryption at that point, by your choice.
 */
export async function shareIcs(items: { chat: Chat; plan: Decision }[]) {
  const name = items.length === 1 ? slug(items[0].plan.title) : "lynk-plans";
  const file = new File(Paths.cache, `${name}.ics`);
  if (file.exists) file.delete();
  file.create();
  file.write(buildIcs(items));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: "text/calendar", UTI: "com.apple.ical.ics", dialogTitle: "Add to calendar" });
  }
}

import { Platform } from "react-native";
import { allPlans, formatWhen, type Chat } from "@shared/chat";
import type { NextPlanProps } from "@/widgets/NextPlan";

/** A plan stays "next" until three hours after it starts. */
const UNDERWAY_MS = 3 * 3_600_000;

/**
 * Hand the home-screen widget a timeline of your next few plans (ones you
 * said Going or Maybe to, or made), each shown until the one before it is
 * over, so it moves on by itself while Lynk is closed. iPhone only.
 */
export async function syncWidget(chats: Chat[]) {
  if (Platform.OS !== "ios") return;
  const { default: NextPlan } = await import("@/widgets/NextPlan");
  const now = Date.now();
  const next = allPlans(chats)
    .filter(({ plan, later }) => !later && plan.status === "confirmed" && plan.when! > now - UNDERWAY_MS && plan.rsvp?.me !== "no")
    .slice(0, 5);
  const props = (i: number): NextPlanProps => {
    const e = next[i];
    if (!e) return {};
    return {
      title: e.plan.title,
      when: formatWhen(e.plan),
      where: e.plan.where,
      going: Object.values(e.plan.rsvp ?? {}).filter((a) => a === "going").length,
      chat: e.chat.name,
      chatId: e.chat.id,
    };
  };
  const entries = [{ date: new Date(now), props: props(0) }];
  next.forEach((e, i) => entries.push({ date: new Date(Math.max(now, e.plan.when! + UNDERWAY_MS)), props: props(i + 1) }));
  NextPlan.updateTimeline(entries);
}

import type { Chat, Decision } from "./chat";
import { firstName, formatWhen } from "./chat";

/**
 * Links that invite people who aren't on Lynk to a plan. The plan travels in
 * the link's fragment (after #), which browsers never send to a server, the
 * same way group invite keys will (roadmap: Encryption). The page reads it on
 * the device and shows the plan with RSVP buttons.
 */

export const SITE = "https://lynk.app";

export type PlanCard = {
  /** Title, start (epoch ms), all day, every week, where, group name, who invited you, how many are going. */
  t: string;
  w?: number;
  d?: boolean;
  r?: boolean;
  p?: string;
  g: string;
  f: string;
  n: number;
};

const toBase64Url = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (code: string) => {
  const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function planLink(chat: Chat, plan: Decision, me: string, origin = SITE) {
  const card: PlanCard = {
    t: plan.title,
    w: plan.when,
    d: plan.allDay || undefined,
    r: plan.repeat === "weekly" || undefined,
    p: plan.where,
    g: chat.name,
    f: me,
    n: Object.values(plan.rsvp ?? {}).filter((a) => a === "going").length,
  };
  return `${origin}/p#${toBase64Url(JSON.stringify(card))}`;
}

/** The message that goes with the link, so the card reads well even where links don't preview. */
export function planInviteText(chat: Chat, plan: Decision, me: string, origin = SITE) {
  const going = Object.entries(plan.rsvp ?? {}).filter(([, a]) => a === "going").map(([id]) => (id === "me" ? me : firstName(id)));
  return [
    `📅 ${plan.title}`,
    plan.when ? formatWhen(plan) : "",
    plan.where ? `📍 ${plan.where}` : "",
    going.length ? `Going: ${going.join(", ")}` : "",
    `Are you in? ${planLink(chat, plan, me, origin)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Read a plan back from a link fragment; null when it's missing or garbled. */
export function readPlanLink(hash: string): PlanCard | null {
  try {
    const card = JSON.parse(fromBase64Url(hash.replace(/^#/, ""))) as PlanCard;
    return typeof card.t === "string" && typeof card.g === "string" ? card : null;
  } catch {
    return null;
  }
}

import { messagePreview, personName, sideChatId, type Chat, type Message } from "./chat";

/**
 * "Find it again", as a sample that runs in the browser. The real one is
 * hybrid vector and full-text search inside `visible_messages`, answered by a
 * model with sources (roadmap, phase 5). This version scores your own chats
 * with keywords and a few synonyms, then writes the answer from the best
 * matches, so every sentence still points at the message it came from.
 */

const STOP = new Set(
  "a an the and or but is are was were be been to of in on at for with by from about did does do what when where who whom which how why that this these those it its i me my we our you your he she they them his her their say said tell told mention mentioned again was there any can could would should".split(
    " ",
  ),
);

/** A few everyday synonyms, so "restaurant" finds "ramen place" and "flight" finds "lands". */
const RELATED: Record<string, string[]> = {
  restaurant: ["ramen", "place", "dinner", "food", "eat"],
  food: ["ramen", "dinner", "vegetarian", "sugar", "cook", "snacks"],
  eat: ["ramen", "dinner", "vegetarian", "cook"],
  flight: ["lands", "airport", "terminal", "arrivals"],
  airport: ["flight", "lands", "terminal", "arrivals"],
  arrive: ["lands", "flight", "arrivals"],
  shoes: ["origin", "tarantulace", "size"],
  recommend: ["try", "recommendations", "second", "comfy"],
  climbing: ["boulder", "route", "wall", "chalk"],
  bring: ["bring", "chalk", "snacks"],
  birthday: ["birthday", "born"],
  diet: ["vegetarian", "sugar"],
  vegetarian: ["vegetarian", "meat"],
  shopping: ["shopping", "list", "milk", "eggs"],
  boiler: ["landlord", "boiler", "fix"],
};

const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");

export function tokens(text: string) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => w.length > 1 && !STOP.has(w));
}

export type Hit = {
  chat: Chat;
  threadId: string;
  sideName?: string;
  message: Message;
  score: number;
  /** The line of a voice note's transcript that matched, when it did. */
  snippet?: string;
};

const PLACE_HINT = /\b(street|st|road|rd|avenue|lane|terminal|station|airport|cafe|café|bar|park)\b|\b(?:at|on|in)\s+[A-Z]/;
const TIME_HINT = /\b\d{1,2}([:.]\d{2})?\s*(am|pm)\b|\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight)\b|\b(twenty|half|quarter) (to|past)\b/i;

export function search(chats: Chat[], query: string, limit = 6): Hit[] {
  const firstNames = new Set(chats.flatMap((c) => c.members).map((m) => personName(m).split(" ")[0].toLowerCase()));
  const all = tokens(query);
  // Names in the question ask who said it, so they boost that person's messages instead of counting as keywords.
  const people = all.filter((w) => firstNames.has(w));
  const words = all.filter((w) => !firstNames.has(w));
  const asksWhere = /\bwhere\b/i.test(query);
  const asksWhen = /\b(when|what time|what day)\b/i.test(query);
  if (!words.length && !people.length) return [];
  const wanted = new Map<string, number>();
  for (const w of words) {
    wanted.set(stem(w), 1);
    for (const r of RELATED[w] ?? RELATED[stem(w)] ?? []) if (!wanted.has(stem(r))) wanted.set(stem(r), 0.5);
  }

  const hits: Hit[] = [];
  const consider = (chat: Chat, threadId: string, message: Message, sideName?: string) => {
    if (message.deleted) return;
    const lines = (message.attachments ?? []).flatMap((a) => a.transcript?.map((s) => s.text) ?? []);
    // A side chat's name is context for everything said in it.
    const body = [message.text, ...lines, sideName ?? ""].join(" ");
    const have = new Set(tokens(body).map(stem));
    let score = 0;
    for (const [w, weight] of wanted) if (have.has(w)) score += weight;
    const matchCount = (t: string) => tokens(t).filter((w) => wanted.has(stem(w))).length;
    const snippet = lines.length ? lines.reduce((best, l) => (matchCount(l) > matchCount(best) ? l : best), lines[0]) : undefined;
    // Asking about someone ("what did Mei say…") favours their messages.
    if (score === 0 && words.length) return;
    if (people.includes(personName(message.from).split(" ")[0].toLowerCase())) score += 1.5;
    // Prefer messages that answer the question over ones that ask it.
    if (asksWhere && PLACE_HINT.test(body)) score += 0.75;
    if (asksWhen && TIME_HINT.test(body)) score += 0.75;
    if (/\?\s*$/.test(message.text)) score -= 0.5;
    if (score > 0.5) hits.push({ chat, threadId, sideName, message, score, snippet });
  };
  for (const chat of chats) {
    chat.messages.forEach((m) => consider(chat, chat.id, m));
    for (const side of chat.sideChats ?? []) side.messages.forEach((m) => consider(chat, sideChatId(chat.id, side.id), m, side.name));
  }
  return hits.sort((a, b) => b.score - a.score || b.message.at - a.message.at).slice(0, limit);
}

export type Answer = { parts: { text: string; source?: number }[]; sources: Hit[] };

/** "today", "yesterday", "on Monday" (this week) or "on 3 September". */
function when(at: number, now: number) {
  const day = 86_400_000;
  const start = new Date(now).setHours(0, 0, 0, 0);
  if (at >= start) return "today";
  if (at >= start - day) return "yesterday";
  const fmt = at >= start - 6 * day ? { weekday: "long" as const } : { day: "numeric" as const, month: "long" as const };
  return `on ${new Intl.DateTimeFormat(undefined, fmt).format(at)}`;
}

const where = (h: Hit) =>
  h.sideName ? `the side chat “${h.sideName}”` : h.chat.kind === "dm" ? `your chat with ${personName(h.chat.members[0]).split(" ")[0]}` : h.chat.name;

const who = (h: Hit) => (h.message.from === "me" ? "You" : personName(h.message.from).split(" ")[0]);
const quote = (h: Hit) => {
  const t = (h.snippet ?? messagePreview(h.message)).replace(/\s+/g, " ").trim();
  return t.length > 140 ? `${t.slice(0, 137)}…` : t;
};

/** A short answer built only from what the matches say, each sentence citing its message. */
export function answer(chats: Chat[], question: string, now: number): Answer | null {
  const hits = search(chats, question, 4);
  if (!hits.length) return null;
  const [best, ...rest] = hits;
  const parts: Answer["parts"] = [
    {
      text: `${who(best)} said “${quote(best)}”${best.snippet ? " in a voice note" : ""} in ${where(best)}, ${when(best.message.at, now)}.`,
      source: 1,
    },
  ];
  const related = rest.filter((h) => h.score >= best.score * 0.6).slice(0, 2);
  related.forEach((h, i) => parts.push({ text: ` ${i === 0 ? "Related:" : "Also,"} ${who(h).toLowerCase() === "you" ? "you" : who(h)} said “${quote(h)}”.`, source: i + 2 }));
  return { parts, sources: [best, ...related] };
}

export const SAMPLE_QUESTIONS = [
  "Where did Mei say that ramen place was?",
  "When does Mum's flight land?",
  "Which climbing shoes did people recommend?",
  "What's on the shopping list?",
];

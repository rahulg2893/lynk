import { newId, type Decision } from "./chat";

/**
 * Plan spotting, rules only. The roadmap runs cheap rules first and sends
 * only likely candidates to a model; in this preview the rules are the whole
 * thing. A message needs a day and a time ("Friday 8pm", "tomorrow at 7:30")
 * to count, and the result is always a suggestion someone has to save.
 */

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_RE = new RegExp(`\\b(today|tonight|tomorrow|${DAYS.join("|")})\\b`, "i");
const TIME_RE = /\b(?:at\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b|\b(\d{1,2})[:.](\d{2})\b|\b(noon|midday)\b/i;
const PLACE_RE = /\b(?:at|in)\s+((?:the\s+)?[A-Z][\w'’&-]*(?:\s+[A-Z][\w'’&-]*){0,3})/;

function resolveDay(word: string, now: number) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const w = word.toLowerCase();
  if (w === "tomorrow") return d.getTime() + 86_400_000;
  if (w === "today" || w === "tonight") return d.getTime();
  const target = DAYS.indexOf(w);
  const ahead = (target - d.getDay() + 7) % 7 || 7;
  return d.getTime() + ahead * 86_400_000;
}

function resolveTime(m: RegExpMatchArray, dayWord: string) {
  if (m[6]) return [12, 0];
  if (m[1]) {
    let h = Number(m[1]) % 12;
    if (m[3].toLowerCase() === "pm") h += 12;
    return [h, Number(m[2] ?? 0)];
  }
  let h = Number(m[4]);
  // "Tonight 7:30" means the evening.
  if (dayWord.toLowerCase() === "tonight" && h < 12) h += 12;
  return [h, Number(m[5])];
}

/** A clean title: the message with the time and trailing punctuation trimmed. */
function titleFrom(text: string) {
  const t = text
    .replace(TIME_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[?!.,\s]+$/, "")
    .trim();
  const short = t.length > 60 ? `${t.slice(0, 57).trimEnd()}…` : t;
  return short ? short[0].toUpperCase() + short.slice(1) : "Plan";
}

export function spotPlan(text: string, messageId: string, now: number): Decision | null {
  const day = text.match(DAY_RE);
  const time = text.match(TIME_RE);
  if (!day || !time) return null;
  const [h, min] = resolveTime(time, day[1]);
  if (h > 23 || min > 59) return null;
  const when = resolveDay(day[1], now) + (h * 60 + min) * 60_000;
  if (when < now) return null;
  const where = text.match(PLACE_RE)?.[1];
  return {
    id: newId("p"),
    title: titleFrom(text),
    detail: where ? `At ${where}.` : "Place still open.",
    status: "proposed",
    sources: [messageId],
    when,
    where,
  };
}

/**
 * A plan from a poll's winning option. The option usually holds the day and
 * time ("Friday 8pm") and the question the what and where ("Dinner at Toit?"),
 * so each is read from its own part. Without a date in the option, the title
 * keeps the option ("Where for dinner: Nando's").
 */
export function planFromPoll(question: string, option: string, now: number) {
  const q = question.replace(/[?!.\s]+$/, "");
  const when = spotPlan(option, "", now)?.when ?? spotPlan(`${q} ${option}`, "", now)?.when;
  const where = option.match(PLACE_RE)?.[1] ?? q.match(PLACE_RE)?.[1];
  return { title: when ? q : `${q}: ${option}`, when, where };
}

import type { Chat, Decision } from "./chat";

/**
 * iCalendar (RFC 5545) files for plans, so "Add to calendar" works with
 * Apple Calendar, Google Calendar and Outlook without any account linking.
 */

const pad = (n: number) => String(n).padStart(2, "0");

const utc = (at: number) => {
  const d = new Date(at);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
};

const localDate = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
};

const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines longer than 75 octets are folded onto continuation lines that start with a space. */
function fold(line: string) {
  const bytes = new TextEncoder();
  if (bytes.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    if (bytes.encode(current + ch).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else current += ch;
  }
  out.push(current);
  return out.join("\r\n ");
}

const HOUR = 3_600_000;

function event(plan: Decision, chat: Chat, now: number) {
  if (!plan.when) return [];
  const lines = ["BEGIN:VEVENT", `UID:${plan.id}.${chat.id}@lynk.app`, `DTSTAMP:${utc(now)}`];
  if (plan.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${localDate(plan.when)}`, `DTEND;VALUE=DATE:${localDate(plan.when + 24 * HOUR)}`);
  } else {
    lines.push(`DTSTART:${utc(plan.when)}`, `DTEND:${utc(plan.when + 2 * HOUR)}`);
  }
  lines.push(`SUMMARY:${escape(plan.title)}`);
  if (plan.where) lines.push(`LOCATION:${escape(plan.where)}`);
  lines.push(`DESCRIPTION:${escape(`Planned in ${chat.name} on Lynk.`)}`, "END:VEVENT");
  return lines;
}

export function buildIcs(items: { chat: Chat; plan: Decision }[], now = Date.now()) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lynk//Plans//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const { chat, plan } of items) lines.push(...event(plan, chat, now));
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "plan";

/** Download one plan, or several, as an .ics file. */
export function downloadIcs(items: { chat: Chat; plan: Decision }[], name = items.length === 1 ? slug(items[0].plan.title) : "lynk-plans") {
  const blob = new Blob([buildIcs(items)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

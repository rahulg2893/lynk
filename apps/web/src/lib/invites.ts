/** Mock invite links until the server issues real ones. Shared by server and client. */
import { PEOPLE } from "./chat";

export type Invite =
  | { kind: "group"; chatId: string; name: string; from: string; members: string[] }
  | { kind: "person"; personId: string; chatId: string | null };

const GROUPS: Record<string, Extract<Invite, { kind: "group" }>> = {
  climbers: { kind: "group", chatId: "c-climbers", name: "Weekend climbers", from: "amara", members: ["amara", "tomas", "jonas"] },
  family: { kind: "group", chatId: "c-family", name: "Family", from: "priya", members: ["priya", "sofia"] },
  "flat-4b": { kind: "group", chatId: "c-flat", name: "Flat 4B", from: "kwame", members: ["mei", "kwame"] },
};

/** One-to-one chats that already exist in the mock inbox. */
const DMS: Record<string, string> = { amara: "c-amara", mei: "c-mei", tomas: "c-tomas", jonas: "c-jonas" };

/** A group code or someone's username. Your own username is handled on the client. */
export function resolveInvite(code: string): Invite | null {
  if (GROUPS[code]) return GROUPS[code];
  const person = Object.values(PEOPLE).find((p) => p.handle === code);
  return person ? { kind: "person", personId: person.id, chatId: DMS[person.id] ?? null } : null;
}

/**
 * Chat types and mock data for the frontend-only build. Nothing here talks to
 * a server. Lynk is a personal chat app: DMs and group chats with friends and
 * family. What it remembers (plans, to-dos, little facts) always points back
 * to the messages it came from, so the UI can be wired to the API later.
 */

export type Status = "sending" | "sent" | "delivered" | "read";

export type Person = { id: string; name: string; handle: string; photo?: string };

export type Reaction = { emoji: string; count: number; mine: boolean };

/** A photo or file sent in a chat. Photos are small data URLs until uploads exist. */
export type Attachment = {
  id: string;
  kind: "image" | "file";
  name: string;
  /** Bytes. */
  size: number;
  mime: string;
  /** A data URL for photos; files keep only their details in this preview. */
  url: string | null;
  width?: number;
  height?: number;
};

export type Message = {
  id: string;
  /** "me" or a person id. */
  from: string;
  text: string;
  /** Epoch milliseconds. */
  at: number;
  status?: Status;
  replyTo?: string;
  reactions?: Reaction[];
  /** A branch that starts at this message. */
  branch?: { name: string; count: number };
  attachments?: Attachment[];
  editedAt?: number;
  /** Deleted for everyone: the text is gone, a placeholder stays. */
  deleted?: boolean;
  /** Group members who have read this message. */
  readBy?: string[];
};

export type KnowledgeStatus = "proposed" | "confirmed" | "rejected";

export type Decision = {
  id: string;
  title: string;
  detail: string;
  status: KnowledgeStatus;
  sources: string[];
  supersedes?: string;
};

export type Task = {
  id: string;
  title: string;
  assignee: string;
  due: string;
  status: KnowledgeStatus | "done";
  sources: string[];
};

export type Memory = { id: string; kind: string; value: string; sources: string[] };

export type Kind = "dm" | "group";

export type Chat = {
  id: string;
  kind: Kind;
  name: string;
  topic?: string;
  pinned?: boolean;
  members: string[];
  /** Group admins ("me" or person ids). */
  admins?: string[];
  online?: boolean;
  lastSeenMin?: number;
  unread: number;
  mentions: number;
  muted: boolean;
  typing: string | null;
  draft: string;
  messages: Message[];
  decisions: Decision[];
  tasks: Task[];
  memory: Memory[];
};

export const ME: Person = { id: "me", name: "Rahul", handle: "rahul" };

export const PEOPLE: Record<string, Person> = {
  amara: { id: "amara", name: "Amara Okafor", handle: "amara.ok", photo: "/people/amara.jpg" },
  tomas: { id: "tomas", name: "Tomás Rivera", handle: "tomasr", photo: "/people/tomas.jpg" },
  priya: { id: "priya", name: "Priya Natarajan", handle: "priyan" },
  jonas: { id: "jonas", name: "Jonas Weber", handle: "jweber", photo: "/people/jonas.jpg" },
  mei: { id: "mei", name: "Mei Lin", handle: "meilin", photo: "/people/mei.jpg" },
  kwame: { id: "kwame", name: "Kwame Mensah", handle: "kwame.m" },
  sofia: { id: "sofia", name: "Sofia Lindqvist", handle: "sofial", photo: "/people/sofia.jpg" },
};

export const personName = (id: string) => (id === "me" ? "You" : PEOPLE[id]?.name ?? "Unknown");
export const firstName = (id: string) => (id === "me" ? "You" : personName(id).split(" ")[0]);

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** First names that an @mention can match, keyed by person id. */
export function mentionables(chat: Chat) {
  return chat.members.map((id) => ({ id, name: firstName(id), handle: PEOPLE[id]?.handle ?? id }));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Stable 0-5 tone per id so avatars differ without extra accent colours. */
export const toneFor = (id: string) =>
  Array.from(id).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 6;

export const displayName = (chat: Chat) => chat.name;

let counter = 0;
export const newId = (prefix = "m") =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const base = (c: Partial<Chat> & Pick<Chat, "id" | "kind" | "name" | "members" | "messages">): Chat => ({
  unread: 0,
  mentions: 0,
  muted: false,
  typing: null,
  draft: "",
  decisions: [],
  tasks: [],
  memory: [],
  ...c,
});

/** Build the mock inbox relative to `now`, so timestamps always look recent. */
export function createMockChats(now: number): Chat[] {
  const t = (minutesAgo: number) => now - minutesAgo * 60_000;
  const m = (id: string, from: string, text: string, minutesAgo: number, extra: Partial<Message> = {}): Message => ({
    id,
    from,
    text,
    at: t(minutesAgo),
    ...extra,
  });

  return [
    base({
      id: "c-climbers",
      kind: "group",
      name: "Weekend climbers",
      members: ["amara", "tomas", "jonas"],
      admins: ["amara", "me"],
      pinned: true,
      unread: 4,
      mentions: 1,
      messages: [
        m("w1", "tomas", "New bouldering route went up on the north wall", 1500),
        m("w2", "jonas", "The purple one? I fell off it four times yesterday", 1490, {
          branch: { name: "Best climbing shoes under $100", count: 9 },
        }),
        m("w3", "me", "We send it this weekend. All of us.", 1480, {
          status: "read",
          readBy: ["amara", "tomas", "jonas"],
          reactions: [{ emoji: "🔥", count: 3, mine: false }],
        }),
        m("w4", "amara", "Saturday morning works for me", 95),
        m("w5", "tomas", "Sunday is better for me, but I can do Saturday", 90),
        m("w6", "jonas", "Saturday 10am at Boulder Barn then?", 84),
        m("w7", "amara", "Perfect. Saturday 10am it is", 80),
        m("w8", "amara", "@Rahul can you bring the spare chalk bag?", 12),
      ],
      decisions: [
        {
          id: "p1",
          title: "Climbing at Boulder Barn, Saturday 10am",
          detail: "Amara, Tomás, Jonas and you.",
          status: "proposed",
          sources: ["w4", "w5", "w6", "w7"],
          supersedes: "Sunday",
        },
      ],
      tasks: [
        { id: "td1", title: "Bring the spare chalk bag", assignee: "me", due: "Saturday", status: "proposed", sources: ["w8"] },
        { id: "td2", title: "Book the auto-belay wall", assignee: "jonas", due: "Friday", status: "confirmed", sources: ["w6"] },
      ],
      memory: [{ id: "r1", kind: "Place", value: "Boulder Barn, north wall is the new route", sources: ["w1", "w6"] }],
    }),
    base({
      id: "c-family",
      kind: "group",
      name: "Family",
      members: ["priya", "sofia"],
      admins: ["priya"],
      pinned: true,
      unread: 9,
      muted: false,
      messages: [
        m("f1", "priya", "Mum's flight lands Friday at 6:40pm, terminal 2", 400),
        m("f2", "sofia", "I'm at work until 7, can someone else pick her up?", 390),
        m("f3", "me", "I'll get her", 385, { status: "read", readBy: ["priya", "sofia"] }),
        m("f4", "priya", "Thank you! She said no restaurants, she wants to cook", 380),
        m("f5", "sofia", "Remember she's off sugar now", 60),
      ],
      decisions: [
        { id: "p2", title: "You're picking Mum up on Friday", detail: "Terminal 2, flight lands 6:40pm.", status: "confirmed", sources: ["f1", "f3"] },
      ],
      tasks: [{ id: "td3", title: "Pick up Mum from the airport", assignee: "me", due: "Friday 6:40pm", status: "confirmed", sources: ["f1", "f3"] }],
      memory: [{ id: "r2", kind: "Mum", value: "Off sugar, prefers cooking at home", sources: ["f4", "f5"] }],
    }),
    base({
      id: "c-amara",
      kind: "dm",
      name: PEOPLE.amara.name,
      members: ["amara"],
      online: true,
      unread: 1,
      messages: [
        m("a1", "amara", "Are you free for dinner next week?", 300),
        m("a2", "me", "Yes! Thursday?", 296, { status: "read" }),
        m("a3", "amara", "Thursday works. Also my birthday is October 3, no pressure 😄", 290),
        m("a4", "amara", "That ramen place Mei mentioned, want to try it?", 5),
      ],
      memory: [{ id: "r3", kind: "Birthday", value: "Amara's birthday is October 3", sources: ["a3"] }],
      decisions: [{ id: "p3", title: "Dinner with Amara on Thursday", detail: "Place still open.", status: "proposed", sources: ["a1", "a2", "a3"] }],
    }),
    base({
      id: "c-flat",
      kind: "group",
      name: "Flat 4B",
      members: ["mei", "kwame"],
      admins: ["kwame"],
      unread: 2,
      messages: [
        m("h1", "kwame", "Landlord is coming Tuesday to fix the boiler", 700),
        m("h2", "mei", "I'll be home, I can let him in", 690),
        m("h3", "kwame", "Shopping list for the week: oat milk, eggs, rice, dish soap", 50),
      ],
      tasks: [{ id: "td4", title: "Buy oat milk, eggs, rice, dish soap", assignee: "me", due: "This week", status: "proposed", sources: ["h3"] }],
    }),
    base({
      id: "c-mei",
      kind: "dm",
      name: PEOPLE.mei.name,
      members: ["mei"],
      online: true,
      messages: [
        m("mm1", "mei", "You have to try Ramen Ya on Mill Street, the spicy miso is unreal", 4300),
        m("mm2", "me", "Adding it to my list", 4290, { status: "read" }),
        m("mm3", "mei", "Also I'm fully vegetarian now, just so you know for the party", 4200),
      ],
      memory: [
        { id: "r4", kind: "Place", value: "Ramen Ya on Mill Street, get the spicy miso", sources: ["mm1"] },
        { id: "r5", kind: "Mei", value: "Vegetarian", sources: ["mm3"] },
      ],
    }),
    base({
      id: "c-tomas",
      kind: "dm",
      name: PEOPLE.tomas.name,
      members: ["tomas"],
      lastSeenMin: 45,
      messages: [
        m("t1", "tomas", "Did you finish the documentary?", 2900),
        m("t2", "me", "Halfway. The Yosemite part is unreal", 2880, { status: "read" }),
        m("t3", "tomas", "Wait until the last 20 minutes", 2875),
      ],
    }),
    base({
      id: "c-jonas",
      kind: "dm",
      name: PEOPLE.jonas.name,
      members: ["jonas"],
      lastSeenMin: 190,
      messages: [
        m("j1", "me", "Can I borrow your size 42 shoes on Saturday?", 5800, { status: "read" }),
        m("j2", "jonas", "Sure, I'll leave them at the front desk", 5790),
      ],
    }),
  ];
}

/** Canned replies so the mock inbox talks back. */
export const REPLIES: Record<string, string[]> = {
  "c-climbers": ["Sounds good", "I'll bring snacks", "See you there"],
  "c-family": ["Thank you!", "Mum says hi", "Love you"],
  "c-amara": ["Yay!", "I'll book a table", "Can't wait"],
  "c-flat": ["Thanks!", "Legend"],
  "c-mei": ["Told you", "Let me know how it is"],
  "c-tomas": ["Told you", "Pick the next one"],
  "c-jonas": ["No problem", "Blue bag"],
};

export const formatTime = (at: number) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(at);

export function formatListTime(at: number, now: number) {
  const day = 86_400_000;
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  if (at >= startOfToday) return formatTime(at);
  if (at >= startOfToday - day) return "Yesterday";
  if (at >= startOfToday - 6 * day) {
    return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(at);
  }
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(at);
}

export function formatDayLabel(at: number, now: number) {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  if (at >= startOfToday) return "Today";
  if (at >= startOfToday - 86_400_000) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(at);
}

export function presence(chat: Chat) {
  if (chat.typing) return `${firstName(chat.typing)} is typing`;
  if (chat.kind === "group") return `${chat.members.length + 1} members`;
  if (chat.online) return "online";
  const mins = chat.lastSeenMin ?? 0;
  if (mins < 60) return `last seen ${mins} min ago`;
  if (mins < 1440) return `last seen ${Math.round(mins / 60)} h ago`;
  return "last seen yesterday";
}

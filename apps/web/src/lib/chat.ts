/**
 * Chat types and mock data for the frontend-only build. Nothing here talks to
 * a server. Lynk is a personal chat app: DMs and group chats with friends and
 * family. What it remembers (plans, to-dos, little facts) always points back
 * to the messages it came from, so the UI can be wired to the API later.
 */

/** "waiting" means sent while offline: it sits in the outbox until the connection is back. */
export type Status = "waiting" | "sending" | "sent" | "delivered" | "read";

export type Person = { id: string; name: string; handle: string; photo?: string };

export type Reaction = { emoji: string; count: number; mine: boolean };

/** A photo or file sent in a chat. Photos are small data URLs until uploads exist. */
/** A stretch of a voice note's transcript, starting `at` ms into the recording. */
export type TranscriptSegment = { at: number; text: string };

export type Attachment = {
  id: string;
  kind: "image" | "file" | "voice";
  name: string;
  /** Bytes. */
  size: number;
  mime: string;
  /** A data URL for photos; files keep only their details in this preview. */
  url: string | null;
  width?: number;
  height?: number;
  /** Voice notes: length in ms, 0–1 bar heights for the waveform, and the transcript. */
  duration?: number;
  peaks?: number[];
  transcript?: TranscriptSegment[];
  /** "live" came from this browser's speech recognition; "sample" is demo text. */
  transcriptKind?: "live" | "sample";
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
  /** Legacy label for a side chat; real side chats live in `Chat.sideChats`. */
  branch?: { name: string; count: number };
  /** Bookmarked by you, listed in Saved. */
  saved?: boolean;
  attachments?: Attachment[];
  editedAt?: number;
  /** Deleted for everyone: the text is gone, a placeholder stays. */
  deleted?: boolean;
  /** Group members who have read this message. */
  readBy?: string[];
};

export type KnowledgeStatus = "proposed" | "confirmed" | "rejected";

export type Rsvp = "going" | "maybe" | "no";

/** A plan: what, when, where and who's coming. Suggested ones come from Lynk; made-by-hand ones start confirmed. */
export type Decision = {
  id: string;
  title: string;
  detail: string;
  status: KnowledgeStatus;
  sources: string[];
  supersedes?: string;
  /** Start time (epoch ms). */
  when?: number;
  /** No time of day, just the date. */
  allDay?: boolean;
  where?: string;
  /** Answers keyed by "me" or a person id. */
  rsvp?: Record<string, Rsvp>;
  /** Who made it by hand; absent when Lynk suggested it. */
  by?: string;
};

export type ListItem = { id: string; text: string; done: boolean; by: string };

/** A checklist anyone in the chat can add to and tick off. */
export type SharedList = { id: string; title: string; items: ListItem[] };

/** A thread that branches off one message, so a tangent doesn't take over the chat. */
export type SideChat = {
  id: string;
  /** The message it started from, in the parent chat. */
  rootId: string;
  name: string;
  messages: Message[];
  draft: string;
  typing: string | null;
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
  lists?: SharedList[];
  sideChats?: SideChat[];
  /** Set only on the stand-in chat a side chat is shown as (see `resolveChat`). */
  side?: { parentId: string; parentName: string; rootId: string };
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
        m("w2", "jonas", "The purple one? I fell off it four times yesterday", 1490),
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
          when: nextWeekday(now, 6, 10),
          where: "Boulder Barn",
          rsvp: { amara: "going", jonas: "going", tomas: "maybe" },
        },
      ],
      sideChats: [
        {
          id: "s-shoes",
          rootId: "w2",
          name: "Best climbing shoes under $100",
          draft: "",
          typing: null,
          messages: [
            m("ws1", "jonas", "My toes are done with these. Recommendations under $100?", 1488),
            m("ws2", "amara", "Scarpa Origin. Comfy from day one", 1486),
            m("ws3", "tomas", "La Sportiva Tarantulace if you want them to last", 1484),
            m("ws4", "me", "Second the Origins, I've had mine two years", 1482, { status: "read" }),
          ],
        },
      ],
      lists: [
        {
          id: "l-pack",
          title: "Packing for Saturday",
          items: [
            { id: "li1", text: "Spare chalk bag", done: false, by: "amara" },
            { id: "li2", text: "Finger tape", done: true, by: "jonas" },
            { id: "li3", text: "Snacks", done: false, by: "tomas" },
          ],
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
        m("f6", "priya", "", 45, {
          attachments: [
            {
              id: "vn-f6",
              kind: "voice",
              name: "Voice note",
              size: 0,
              mime: "audio/webm",
              url: null,
              duration: 17_000,
              peaks: [0.2, 0.35, 0.6, 0.8, 0.5, 0.3, 0.55, 0.9, 0.7, 0.4, 0.25, 0.5, 0.75, 0.6, 0.35, 0.2, 0.45, 0.8, 0.95, 0.6, 0.4, 0.3, 0.5, 0.7, 0.85, 0.55, 0.3, 0.2, 0.4, 0.65, 0.5, 0.35, 0.6, 0.75, 0.45, 0.3, 0.2, 0.35, 0.25, 0.15],
              transcriptKind: "sample",
              transcript: [
                { at: 0, text: "Hi everyone, quick update on Mum." },
                { at: 3_500, text: "Her flight is still landing at twenty to seven on Friday," },
                { at: 7_800, text: "terminal two, and she's bringing the big green suitcase." },
                { at: 12_000, text: "Rahul, text me when you're at arrivals so I can tell her where to go." },
              ],
            },
          ],
        }),
        m("f7", "sofia", "Glöm inte att köpa blommor till mamma på fredag 🌷", 30),
      ],
      decisions: [
        {
          id: "p2",
          title: "You're picking Mum up on Friday",
          detail: "Terminal 2, flight lands 6:40pm.",
          status: "confirmed",
          sources: ["f1", "f3"],
          when: nextWeekday(now, 5, 18, 40),
          where: "Airport, terminal 2",
          rsvp: { me: "going", priya: "maybe" },
        },
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
      decisions: [
        {
          id: "p3",
          title: "Dinner with Amara on Thursday",
          detail: "Place still open.",
          status: "proposed",
          sources: ["a1", "a2", "a3"],
          when: nextWeekday(now, 4, 19, 30),
          rsvp: { amara: "going" },
        },
      ],
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
      lists: [
        {
          id: "l-shop",
          title: "Shopping this week",
          items: [
            { id: "ls1", text: "Oat milk", done: false, by: "kwame" },
            { id: "ls2", text: "Eggs", done: true, by: "kwame" },
            { id: "ls3", text: "Rice", done: false, by: "kwame" },
            { id: "ls4", text: "Dish soap", done: false, by: "mei" },
          ],
        },
      ],
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

/* ---------- Side chats ---------- */

/** A side chat is addressed as "<chat id>~<side chat id>", so URLs and actions stay one string. */
export const sideChatId = (chatId: string, sideId: string) => `${chatId}~${sideId}`;

export function splitChatId(id: string) {
  const [chatId, sideId] = id.split("~");
  return { chatId, sideId: sideId as string | undefined };
}

/** A side chat dressed as a chat, so the thread, sending and the outbox work on it unchanged. */
export function sideAsChat(parent: Chat, side: SideChat): Chat {
  return {
    ...parent,
    id: sideChatId(parent.id, side.id),
    name: side.name,
    pinned: false,
    unread: 0,
    mentions: 0,
    typing: side.typing,
    draft: side.draft,
    messages: side.messages,
    decisions: [],
    tasks: [],
    memory: [],
    lists: [],
    sideChats: [],
    side: { parentId: parent.id, parentName: parent.name, rootId: side.rootId },
  };
}

export function resolveChat(chats: Chat[], id: string | null): Chat | null {
  if (!id) return null;
  const { chatId, sideId } = splitChatId(id);
  const parent = chats.find((c) => c.id === chatId);
  if (!parent || !sideId) return parent ?? null;
  const side = parent.sideChats?.find((s) => s.id === sideId);
  return side ? sideAsChat(parent, side) : null;
}

/** Every message thread in a chat: the chat itself, then its side chats. */
export function threadsOf(chat: Chat): { id: string; messages: Message[] }[] {
  return [{ id: chat.id, messages: chat.messages }, ...(chat.sideChats ?? []).map((s) => ({ id: sideChatId(chat.id, s.id), messages: s.messages }))];
}

export const SIDE_REPLIES = ["Good call", "Agreed", "👍", "Let's keep it here then"];

/* ---------- Plans ---------- */

const DAY_MS = 86_400_000;

/** The next given weekday (0 = Sunday) at a time, from `now`. */
export function nextWeekday(now: number, weekday: number, hours: number, minutes = 0) {
  const d = new Date(now);
  d.setHours(hours, minutes, 0, 0);
  const ahead = (weekday - d.getDay() + 7) % 7 || (d.getTime() <= now ? 7 : 0);
  return d.getTime() + ahead * DAY_MS;
}

export function formatWhen(plan: Pick<Decision, "when" | "allDay">) {
  if (!plan.when) return "No date yet";
  const day = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(plan.when);
  return plan.allDay ? day : `${day} · ${formatTime(plan.when)}`;
}

export const RSVP_LABEL: Record<Rsvp, string> = { going: "Going", maybe: "Maybe", no: "Can't go" };

/** "Amara, Jonas and you are going · Tomás maybe" */
export function rsvpSummary(plan: Decision) {
  const by = (answer: Rsvp) =>
    Object.entries(plan.rsvp ?? {})
      .filter(([, a]) => a === answer)
      .map(([id]) => (id === "me" ? "you" : firstName(id)));
  const join = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0]);
  const going = by("going");
  const maybe = by("maybe");
  const parts = [];
  if (going.length) parts.push(`${join(going)} ${going.length === 1 && going[0] !== "you" ? "is" : "are"} going`);
  if (maybe.length) parts.push(`${join(maybe)} maybe`);
  const text = parts.join(" · ");
  return text ? text[0].toUpperCase() + text.slice(1) : "No answers yet";
}

/** Every dated plan across chats, soonest first, with the chat it belongs to. */
export function allPlans(chats: Chat[]) {
  return chats
    .flatMap((chat) => chat.decisions.filter((d) => d.when && d.status !== "rejected").map((plan) => ({ chat, plan })))
    .sort((a, b) => (a.plan.when ?? 0) - (b.plan.when ?? 0));
}

/**
 * What a chat has saved that still matters, for the pinned "Up next" bar:
 * plans that haven't happened yet (soonest first, undated last), open to-dos,
 * and lists with something left to tick. Null when there's nothing.
 */
export function upNext(chat: Chat, now: number) {
  const plans = chat.decisions
    .filter((d) => d.status === "confirmed" && (!d.when || d.when > now - 3 * 3_600_000))
    .sort((a, b) => (a.when ?? Infinity) - (b.when ?? Infinity));
  const todos = chat.tasks.filter((t) => t.status === "confirmed");
  const lists = (chat.lists ?? []).filter((l) => l.items.some((i) => !i.done));
  return plans.length || todos.length || lists.length ? { plans, todos, lists } : null;
}

/** "3 going · 2 to-dos · Shopping, 4 left": the bar's second line. */
export function upNextSummary(u: NonNullable<ReturnType<typeof upNext>>) {
  const going = u.plans[0] ? Object.values(u.plans[0].rsvp ?? {}).filter((a) => a === "going").length : 0;
  const left = (l: SharedList) => l.items.filter((i) => !i.done).length;
  return [
    going ? `${going} going` : "",
    u.plans.length > 1 ? `${u.plans.length - 1} more ${u.plans.length === 2 ? "plan" : "plans"}` : "",
    u.todos.length ? `${u.todos.length} ${u.todos.length === 1 ? "to-do" : "to-dos"}` : "",
    u.lists.length === 1 ? `${u.lists[0].title}, ${left(u.lists[0])} left` : u.lists.length ? `${u.lists.length} lists` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/* ---------- Translation samples ---------- */

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  hi: "Hindi",
  ta: "Tamil",
  zh: "Chinese",
  sv: "Swedish",
};

/** Built-in translations for the demo messages, used when the browser has no translator of its own. */
export const SAMPLE_TRANSLATIONS: Record<string, { from: string; text: Record<string, string> }> = {
  f7: {
    from: "sv",
    text: {
      en: "Don't forget to buy flowers for Mum on Friday 🌷",
      es: "No olvides comprar flores para mamá el viernes 🌷",
      fr: "N'oublie pas d'acheter des fleurs pour maman vendredi 🌷",
      de: "Vergiss nicht, am Freitag Blumen für Mama zu kaufen 🌷",
    },
  },
};

export const formatDuration = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** A one-line stand-in for a message: its text, or what it carries. */
export function messagePreview(m: Pick<Message, "text" | "attachments">) {
  if (m.text) return m.text;
  const items = m.attachments ?? [];
  const voice = items.find((a) => a.kind === "voice");
  if (voice) return `Voice note ${formatDuration(voice.duration ?? 0)}`;
  const photos = items.filter((a) => a.kind === "image").length;
  if (photos) return photos === 1 ? "Photo" : `${photos} photos`;
  return items[0]?.name ?? "Message";
}

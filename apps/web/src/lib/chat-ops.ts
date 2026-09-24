import { newId, sideAsChat, splitChatId, type Chat, type Decision, type ListItem, type Rsvp, type SideChat } from "./chat";

/**
 * Pure changes to a chat's plans, lists, side chats and saved messages,
 * shared by the chat screen, the calendar and Saved. When the server exists
 * these become API calls with the same shapes.
 */

/** Apply `fn` to the chat or side chat `id` addresses ("<chat>" or "<chat>~<side>"). */
export function updateThread(chats: Chat[], id: string, fn: (chat: Chat) => Chat): Chat[] {
  const { chatId, sideId } = splitChatId(id);
  return chats.map((c) => {
    if (c.id !== chatId) return c;
    if (!sideId) return fn(c);
    return {
      ...c,
      sideChats: c.sideChats?.map((s) => {
        if (s.id !== sideId) return s;
        const next = fn(sideAsChat(c, s));
        return { ...s, messages: next.messages, draft: next.draft, typing: next.typing };
      }),
    };
  });
}

export type PlanInput = Pick<Decision, "title" | "when" | "allDay" | "where"> & { id?: string; sources?: string[] };

/** Create a plan by hand (confirmed, you're going) or save edits to an existing one. */
export function upsertPlan(chat: Chat, input: PlanInput): Chat {
  const detail = input.where ? `At ${input.where}.` : "Place still open.";
  if (input.id) {
    return {
      ...chat,
      decisions: chat.decisions.map((d) =>
        d.id === input.id ? { ...d, title: input.title, when: input.when, allDay: input.allDay, where: input.where, detail } : d,
      ),
    };
  }
  const plan: Decision = {
    id: newId("p"),
    title: input.title,
    detail,
    status: "confirmed",
    sources: input.sources ?? [],
    when: input.when,
    allDay: input.allDay,
    where: input.where,
    rsvp: { me: "going" },
    by: "me",
  };
  return { ...chat, decisions: [...chat.decisions, plan] };
}

export const removePlan = (chat: Chat, planId: string): Chat => ({ ...chat, decisions: chat.decisions.filter((d) => d.id !== planId) });

export function setRsvp(chat: Chat, planId: string, who: string, answer: Rsvp | null): Chat {
  return {
    ...chat,
    decisions: chat.decisions.map((d) => {
      if (d.id !== planId) return d;
      const rsvp = { ...d.rsvp };
      if (answer) rsvp[who] = answer;
      else delete rsvp[who];
      return { ...d, rsvp };
    }),
  };
}

export type ListOp =
  | { op: "create"; title: string; listId: string }
  | { op: "delete"; listId: string }
  | { op: "add"; listId: string; text: string; by: string }
  | { op: "toggle"; listId: string; itemId: string }
  | { op: "remove"; listId: string; itemId: string }
  | { op: "clear"; listId: string };

export function applyListOp(chat: Chat, action: ListOp): Chat {
  const lists = chat.lists ?? [];
  if (action.op === "create") return { ...chat, lists: [...lists, { id: action.listId, title: action.title, items: [] }] };
  if (action.op === "delete") return { ...chat, lists: lists.filter((l) => l.id !== action.listId) };
  return {
    ...chat,
    lists: lists.map((l) => {
      if (l.id !== action.listId) return l;
      let items: ListItem[] = l.items;
      if (action.op === "add") items = [...items, { id: newId("li"), text: action.text, done: false, by: action.by }];
      if (action.op === "toggle") items = items.map((i) => (i.id === action.itemId ? { ...i, done: !i.done } : i));
      if (action.op === "remove") items = items.filter((i) => i.id !== action.itemId);
      if (action.op === "clear") items = items.filter((i) => !i.done);
      return { ...l, items };
    }),
  };
}

export function addSideChat(chat: Chat, side: SideChat): Chat {
  return { ...chat, sideChats: [...(chat.sideChats ?? []), side] };
}

export function toggleSaved(chat: Chat, messageId: string): Chat {
  return { ...chat, messages: chat.messages.map((m) => (m.id === messageId ? { ...m, saved: !m.saved } : m)) };
}

export const editMemory = (chat: Chat, memoryId: string, value: string): Chat => ({
  ...chat,
  memory: chat.memory.map((m) => (m.id === memoryId ? { ...m, value } : m)),
});

export const removeMemory = (chat: Chat, memoryId: string): Chat => ({ ...chat, memory: chat.memory.filter((m) => m.id !== memoryId) });

/** Add a suggestion Lynk spotted, unless one already comes from the same message. */
export function suggestPlan(chat: Chat, plan: Decision): Chat {
  if (chat.decisions.some((d) => d.sources.some((s) => plan.sources.includes(s)))) return chat;
  return { ...chat, decisions: [...chat.decisions, plan] };
}

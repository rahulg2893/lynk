"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, DotsThree, Plus, X } from "@phosphor-icons/react";
import { firstName, newId, type SharedList } from "@/lib/chat";
import type { ListOp } from "@/lib/chat-ops";
import { MOTION } from "@/lib/motion";

const STARTERS = ["Shopping", "Packing", "Ideas"];

/** Shared checklists for a chat: anyone can add, tick off and clear. */
export function Lists({ lists, onChange }: { lists: SharedList[]; onChange: (op: ListOp) => void }) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  const create = (name: string) => {
    const t = name.trim();
    if (!t) return;
    onChange({ op: "create", title: t, listId: newId("l") });
    setTitle("");
    setCreating(false);
  };

  return (
    <div className="grid gap-3">
      {lists.length === 0 && !creating ? (
        <p className="px-2 pt-8 pb-2 text-center text-sm text-muted">Shopping, packing, ideas for the party: lists everyone here can tick off.</p>
      ) : null}

      <AnimatePresence initial={false}>
        {lists.map((list) => (
          <motion.div key={list.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={MOTION.item}>
            <ListCard list={list} onChange={onChange} />
          </motion.div>
        ))}
      </AnimatePresence>

      {creating ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create(title);
          }}
          className="rounded-2xl border border-accent/60 bg-surface p-3"
        >
          <label htmlFor="new-list" className="text-[12px] font-semibold text-muted">
            New list
          </label>
          <input
            id="new-list"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setCreating(false)}
            placeholder="What's it for?"
            maxLength={40}
            className="mt-1 w-full bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-muted"
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {STARTERS.map((s) => (
              <button key={s} type="button" onClick={() => create(s)} className="h-7 rounded-full bg-surface-2 px-2.5 text-[12px] font-medium hover:bg-line">
                {s}
              </button>
            ))}
            <span className="flex-1" />
            <button type="button" onClick={() => setCreating(false)} className="h-8 rounded-full px-3 text-[13px] text-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim()} className="h-8 rounded-full bg-accent px-3 text-[13px] font-medium text-on-accent disabled:opacity-45">
              Create
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-dashed border-line text-[14px] font-medium text-muted hover:border-accent hover:text-accent-ink"
        >
          <Plus size={16} weight="bold" /> New list
        </button>
      )}
    </div>
  );
}

function ListCard({ list, onChange }: { list: SharedList; onChange: (op: ListOp) => void }) {
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const done = list.items.filter((i) => i.done).length;
  const total = list.items.length;

  const add = () => {
    const t = text.trim();
    if (!t) return;
    onChange({ op: "add", listId: list.id, text: t, by: "me" });
    setText("");
  };

  return (
    <section aria-label={list.title} className="rounded-2xl border border-line bg-surface p-3.5">
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate font-semibold">{list.title}</h3>
        <span className="text-[12px] text-muted tabular-nums">{total ? `${done} of ${total}` : "Empty"}</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            aria-label={`More for ${list.title}`}
          >
            <DotsThree size={18} weight="bold" />
          </button>
          {menu ? (
            <div className="absolute top-9 right-0 z-10 grid w-44 gap-0.5 rounded-2xl border border-line bg-surface p-1 shadow-soft">
              <button
                type="button"
                disabled={!done}
                onClick={() => {
                  onChange({ op: "clear", listId: list.id });
                  setMenu(false);
                }}
                className="h-9 rounded-xl px-3 text-left text-[13px] hover:bg-surface-2 disabled:opacity-45"
              >
                Clear ticked items
              </button>
              <button
                type="button"
                onClick={() => onChange({ op: "delete", listId: list.id })}
                className="h-9 rounded-xl px-3 text-left text-[13px] text-danger-ink hover:bg-surface-2"
              >
                Delete list
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {total ? (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${(done / total) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 26 }} />
        </div>
      ) : null}

      <ul className="mt-2 grid">
        <AnimatePresence initial={false}>
          {list.items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={MOTION.item}
              className="group flex items-center gap-2.5 overflow-hidden"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={item.done}
                onClick={() => onChange({ op: "toggle", listId: list.id, itemId: item.id })}
                className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 text-left"
              >
                <motion.span
                  animate={item.done ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={[
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    item.done ? "border-accent bg-accent text-on-accent" : "border-muted/60",
                  ].join(" ")}
                >
                  {item.done ? <Check size={12} weight="bold" /> : null}
                </motion.span>
                <span className={`min-w-0 flex-1 truncate text-[14px] transition-colors ${item.done ? "text-muted line-through" : ""}`}>{item.text}</span>
                <span className="shrink-0 text-[11px] text-muted">{item.by === "me" ? "" : firstName(item.by)}</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ op: "remove", listId: list.id, itemId: item.id })}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted opacity-0 group-hover:opacity-100 hover:bg-surface-2 hover:text-ink focus:opacity-100 [@media(hover:none)]:opacity-100"
                aria-label={`Remove ${item.text}`}
              >
                <X size={13} weight="bold" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="mt-1 flex items-center gap-2.5"
      >
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-muted" aria-hidden>
          <Plus size={14} weight="bold" />
        </span>
        <label htmlFor={`add-${list.id}`} className="sr-only">
          Add to {list.title}
        </label>
        <input
          id={`add-${list.id}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an item"
          maxLength={60}
          className="h-9 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
        />
        {text.trim() ? (
          <button type="submit" className="h-7 rounded-full bg-accent px-2.5 text-[12px] font-medium text-on-accent">
            Add
          </button>
        ) : null}
      </form>
    </section>
  );
}


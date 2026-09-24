"use client";

import { useState } from "react";
import { ArrowLeft, Check, Copy } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/Dialog";
import { Button, Segmented } from "@/components/ui/controls";
import { TextField } from "@/components/ui/Field";
import { QrCode } from "@/components/ui/QrCode";
import { PeoplePicker } from "./PeoplePicker";
import { PEOPLE } from "@/lib/chat";

export type NewChatTab = "chat" | "group" | "invite";

/**
 * Start a one-to-one chat, make a group, or share your invite link and QR
 * code. One short task at a time, always with Cancel (HIG `modality.md`).
 */
export function NewChatDialog({
  open,
  initialTab = "chat",
  username,
  blocked,
  onClose,
  onStart,
  onCreateGroup,
}: {
  open: boolean;
  initialTab?: NewChatTab;
  username: string;
  blocked: string[];
  onClose: () => void;
  onStart: (personId: string) => void;
  onCreateGroup: (name: string, members: string[]) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="New chat">
      {/* Remount on open so every visit starts clean. */}
      {open ? (
        <Body
          initialTab={initialTab}
          username={username}
          blocked={blocked}
          onClose={onClose}
          onStart={onStart}
          onCreateGroup={onCreateGroup}
        />
      ) : null}
    </Dialog>
  );
}

function Body({
  initialTab,
  username,
  blocked,
  onClose,
  onStart,
  onCreateGroup,
}: {
  initialTab: NewChatTab;
  username: string;
  blocked: string[];
  onClose: () => void;
  onStart: (personId: string) => void;
  onCreateGroup: (name: string, members: string[]) => void;
}) {
  const [tab, setTab] = useState<NewChatTab>(initialTab);
  const [members, setMembers] = useState<string[]>([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/invite/${username}`;

  const suggestedName = members
    .slice(0, 3)
    .map((id) => PEOPLE[id]?.name.split(" ")[0])
    .join(", ");

  return (
    <div>
      <Segmented
        name="new-chat-tab"
        label="What to start"
        value={tab}
        onChange={(v) => {
          setTab(v);
          setNaming(false);
        }}
        options={[
          { value: "chat", label: "Chat" },
          { value: "group", label: "Group" },
          { value: "invite", label: "Invite" },
        ]}
      />

      <div className="mt-5">
        {tab === "chat" ? (
          <PeoplePicker mode="single" exclude={blocked} onPick={onStart} />
        ) : null}

        {tab === "group" && !naming ? (
          <>
            <PeoplePicker
              mode="multi"
              exclude={blocked}
              selected={members}
              onPick={(id) => setMembers((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))}
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[13px] text-muted">
                {members.length ? `${members.length} selected` : "Pick at least one person"}
              </p>
              <Button variant="primary" disabled={!members.length} onClick={() => setNaming(true)}>
                Next
              </Button>
            </div>
          </>
        ) : null}

        {tab === "group" && naming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCreateGroup(name.trim() || suggestedName, members);
            }}
          >
            <button
              type="button"
              onClick={() => setNaming(false)}
              className="-ml-2 mb-3 inline-flex h-9 items-center gap-1 rounded-full px-2 text-[14px] text-accent-ink hover:bg-accent-soft"
            >
              <ArrowLeft size={16} aria-hidden /> People
            </button>
            <TextField
              id="group-name"
              label="Group name"
              placeholder={suggestedName}
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              hint={`You and ${members.length} ${members.length === 1 ? "other" : "others"}. You'll be the group admin.`}
              autoFocus
            />
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary">
                Create group
              </Button>
            </div>
          </form>
        ) : null}

        {tab === "invite" ? (
          <div className="flex flex-col items-center text-center">
            <QrCode value={link} label={`QR code for ${link}`} />
            <p className="mt-4 text-[14px] text-muted">
              Friends scan this with their phone camera to start a chat with you.
            </p>
            <div className="mt-4 flex w-full items-center gap-2 rounded-full bg-bg py-1 pr-1 pl-4">
              <span className="min-w-0 flex-1 truncate text-left text-[14px]">{link.replace(/^https?:\/\//, "")}</span>
              <Button
                size="sm"
                variant={copied ? "secondary" : "ink"}
                onClick={() =>
                  navigator.clipboard?.writeText(link).then(
                    () => setCopied(true),
                    () => setCopied(false),
                  )
                }
              >
                {copied ? <Check size={14} weight="bold" aria-hidden /> : <Copy size={14} aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {tab !== "group" || !naming ? (
        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : null}
    </div>
  );
}

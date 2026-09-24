"use client";

import { useState } from "react";
import Link from "next/link";
import { CaretRight, Check, Copy, QrCode as QrIcon, ShareNetwork, Sparkle } from "@phosphor-icons/react";
import { QrCode } from "@/components/ui/QrCode";
import { PageShell } from "@/components/app/PageShell";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/ui/controls";
import { TextArea, TextField } from "@/components/ui/Field";
import { PhotoPicker } from "./PhotoPicker";
import { UsernameStatus, usernameError } from "./UsernameStatus";
import { MEMORIES_ABOUT_ME, updateAccount, useAccount, type Account } from "@/lib/account";
import { firstName } from "@/lib/chat";
import { useUsername } from "@/lib/use-username";

const BIO_MAX = 140;

export function ProfileView() {
  const account = useAccount();
  if (!account) return null;
  return <Profile account={account} />;
}

function Profile({ account }: { account: Account }) {
  const saved = account.profile;
  const [name, setName] = useState(saved.name);
  const [username, setUsername] = useState(saved.username);
  const [bio, setBio] = useState(saved.bio);
  const [justSaved, setJustSaved] = useState(false);
  const check = useUsername(username, saved.username);
  const unchangedUsername = username.trim() === saved.username;

  const dirty = name.trim() !== saved.name || !unchangedUsername || bio.trim() !== saved.bio;
  const nameError = !name.trim() ? "Enter the name friends know you by." : null;
  const valid = !nameError && (unchangedUsername || check.kind === "available") && bio.length <= BIO_MAX;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || !valid) return;
    updateAccount((a) => ({
      ...a,
      profile: { ...a.profile, name: name.trim(), username: username.trim(), bio: bio.trim() },
    }));
    setJustSaved(true);
  };

  const reset = () => {
    setName(saved.name);
    setUsername(saved.username);
    setBio(saved.bio);
  };

  return (
    <PageShell title="Profile" back={{ href: "/app", label: "Chats" }}>
      <p className="mt-2 text-[15px] text-muted">How friends see you on Lynk.</p>

      <div className="mt-8">
        <PhotoPicker
          name={saved.name}
          photo={saved.photo}
          onChange={(photo) => updateAccount((a) => ({ ...a, profile: { ...a.profile, photo } }))}
        />
      </div>

      <form onSubmit={save} className="mt-8 grid gap-5" noValidate>
        <TextField
          id="profile-name"
          label="Name"
          autoComplete="name"
          value={name}
          maxLength={40}
          onChange={(e) => {
            setName(e.target.value);
            setJustSaved(false);
          }}
          error={nameError}
        />
        <TextField
          id="profile-username"
          label="Username"
          prefix="@"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={username}
          maxLength={20}
          onChange={(e) => {
            setUsername(e.target.value);
            setJustSaved(false);
          }}
          hint={unchangedUsername ? "Changing it breaks links you've already shared." : undefined}
          status={<UsernameStatus state={check} unchanged={unchangedUsername} onPick={setUsername} />}
          error={usernameError(check, unchangedUsername)}
        />
        <TextArea
          id="profile-bio"
          label="About"
          optional
          rows={3}
          value={bio}
          placeholder="A line about you"
          onChange={(e) => {
            setBio(e.target.value);
            setJustSaved(false);
          }}
          hint={
            <span className={`tabular-nums ${bio.length > BIO_MAX ? "text-danger-ink" : ""}`}>
              {BIO_MAX - bio.length} characters left
            </span>
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={!dirty || !valid}>
            Save changes
          </Button>
          {dirty ? (
            <Button variant="ghost" onClick={reset}>
              Discard
            </Button>
          ) : justSaved ? (
            <span role="status" className="inline-flex items-center gap-1.5 text-[14px] text-muted">
              <Check size={16} weight="bold" className="text-positive" aria-hidden /> Saved
            </span>
          ) : null}
        </div>
      </form>

      <InviteLink username={saved.username} />
      <AboutYou account={account} />

      <Section title="More">
        <MoreLink href="/app/settings/privacy" label="Privacy" detail="Who can message you, last seen, read receipts" />
        <MoreLink href="/app/settings/security" label="Sign-in & security" detail="Passkeys, Apple and Google, sessions" />
      </Section>
    </PageShell>
  );
}

function InviteLink({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState(false);
  const url = `${window.location.origin}/invite/${username}`;
  const canShare = typeof navigator.share === "function";

  return (
    <Section title="Your invite link" footnote="Anyone with the link can start a chat with you. Change your username to retire it.">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <p className="min-w-0 flex-1 truncate text-[15px]">{url.replace(/^https?:\/\//, "")}</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() =>
              navigator.clipboard?.writeText(url).then(
                () => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                },
                () => setCopied(false),
              )
            }
          >
            {copied ? <Check size={14} weight="bold" aria-hidden /> : <Copy size={14} aria-hidden />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button size="sm" onClick={() => setQr((v) => !v)} aria-expanded={qr}>
            <QrIcon size={14} aria-hidden /> {qr ? "Hide QR code" : "QR code"}
          </Button>
          {canShare ? (
            <Button size="sm" onClick={() => navigator.share({ title: "Chat with me on Lynk", url }).catch(() => {})}>
              <ShareNetwork size={14} aria-hidden /> Share
            </Button>
          ) : null}
        </div>
      </div>
      {qr ? (
        <div className="flex flex-col items-center gap-3 px-5 py-6">
          <QrCode value={url} label={`QR code for your invite link, ${url}`} />
          <p className="text-[13px] text-muted">Friends scan it with their phone camera to start a chat with you.</p>
        </div>
      ) : null}
    </Section>
  );
}

/**
 * Memories about you (roadmap conflict 2): each stays inside the chat it came
 * from, only that chat's members see it, and you can remove any of them.
 */
function AboutYou({ account }: { account: Account }) {
  // Removed this visit, so they can be undone in place.
  const [undoable, setUndoable] = useState<string[]>([]);
  const items = MEMORIES_ABOUT_ME.filter((m) => !account.removedMemories.includes(m.id) || undoable.includes(m.id));

  const remove = (id: string) => {
    updateAccount((a) => ({ ...a, removedMemories: [...a.removedMemories, id] }));
    setUndoable((u) => [...u, id]);
  };
  const undo = (id: string) => {
    updateAccount((a) => ({ ...a, removedMemories: a.removedMemories.filter((m) => m !== id) }));
    setUndoable((u) => u.filter((m) => m !== id));
  };

  return (
    <Section
      title="What Lynk remembers about you"
      footnote="Each memory stays in the chat it came from. Only that chat's members can see it, and removing it here removes it for everyone."
    >
      {items.length === 0 ? (
        <p className="px-5 py-6 text-[15px] text-muted">Nothing is remembered about you right now.</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((m) => {
            const removed = account.removedMemories.includes(m.id);
            return (
              <li key={m.id} className="flex items-center gap-4 px-5 py-4">
                <div className={`min-w-0 flex-1 ${removed ? "opacity-50" : ""}`}>
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                    <Sparkle size={12} weight="fill" className="text-accent-ink" aria-hidden />
                    {m.kind}
                  </p>
                  <p className={`mt-0.5 text-[15px] font-medium ${removed ? "line-through" : ""}`}>{m.value}</p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {firstName(m.from)} in{" "}
                    <Link href={`/app?chat=${m.chatId}`} className="text-accent-ink hover:underline">
                      {m.chatName}
                    </Link>
                  </p>
                </div>
                {removed ? (
                  <Button size="sm" variant="ghost" onClick={() => undo(m.id)}>
                    Undo
                  </Button>
                ) : (
                  <Button size="sm" variant="danger-quiet" onClick={() => remove(m.id)} aria-label={`Remove “${m.value}”`}>
                    Remove
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function MoreLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2/60">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className="block truncate text-[13px] text-muted">{detail}</span>
      </span>
      <CaretRight size={16} className="shrink-0 text-muted" aria-hidden />
    </Link>
  );
}


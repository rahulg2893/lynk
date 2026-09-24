"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AppleLogo,
  CaretRight,
  Check,
  Desktop,
  DeviceMobile,
  DownloadSimple,
  Fingerprint,
  GoogleLogo,
  Laptop,
  Moon,
  Sun,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { PageShell } from "@/components/app/PageShell";
import { Row, Section } from "@/components/app/Section";
import { Avatar } from "@/components/chat/primitives";
import { Button, Segmented, Switch } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { SettingsNav } from "./SettingsNav";
import { PANES, type PaneId } from "./panes";
import {
  DELETION_GRACE_DAYS,
  addPasskey,
  cancelDeletion,
  deleteAccountNow,
  endSession,
  exportAccount,
  formatDate,
  methodLabel,
  removePasskey,
  scheduleDeletion,
  setLinked,
  signInMethodCount,
  signOut,
  timeAgo,
  updateAccount,
  useAccount,
  type Account,
  type Audience,
} from "@/lib/account";
import { PEOPLE } from "@/lib/chat";
import { setTheme, useTheme, type ThemeChoice } from "@/lib/theme";

const title = (id: PaneId) => PANES.find((p) => p.id === id)!.label;

/** /app/settings: the pane list on phones, the Account pane beside the sidebar on wider screens. */
export function SettingsHome() {
  return (
    <>
      <div className="contents md:hidden">
        <PageShell title="Settings" back={{ href: "/app", label: "Chats" }}>
          <SettingsNav variant="list" />
        </PageShell>
      </div>
      <div className="hidden md:contents">
        <SettingsPane id="account" />
      </div>
    </>
  );
}

export function SettingsPane({ id }: { id: PaneId }) {
  const account = useAccount();
  if (!account) return null;
  const Body = BODIES[id];
  return (
    <PageShell title={title(id)} back={{ href: "/app/settings", label: "Settings" }}>
      <Body account={account} />
    </PageShell>
  );
}

/* ---------- Small shared pieces ---------- */

// Filled in below; hoisted function declarations make this safe.
const BODIES: Record<PaneId, (props: { account: Account }) => ReactNode> = {
  account: AccountPane,
  security: SecurityPane,
  privacy: PrivacyPane,
  notifications: NotificationsPane,
  "smart-features": SmartPane,
  appearance: AppearancePane,
  data: DataPane,
};

/** A switch row whose accessible name and description come from the visible text. */
function SwitchRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <Row
      label={label}
      description={description}
      labelId={`${id}-l`}
      descriptionId={description ? `${id}-d` : undefined}
      control={
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          labelledBy={`${id}-l`}
          describedBy={description ? `${id}-d` : undefined}
        />
      }
    />
  );
}

/** A vertical list of radio choices inside a section card. */
function RadioRows<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
}: {
  name: string;
  legend: string;
  value: T;
  options: { value: T; label: string; description?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="divide-y divide-line">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-4 px-5 py-4 hover:bg-surface-2/40">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">{o.label}</span>
              {o.description ? <span className="mt-0.5 block text-[13px] text-muted">{o.description}</span> : null}
            </span>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="peer sr-only" />
            {/* A check mark, not just a colour change, marks the choice. */}
            <span
              aria-hidden
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-transparent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
            >
              <Check size={13} weight="bold" />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  return (
    <p
      role={tone === "warning" ? "status" : undefined}
      className={`mt-6 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[14px] leading-relaxed ${tone === "warning" ? "border-danger-ink/40 bg-surface" : "border-line bg-surface text-muted"}`}
    >
      {tone === "warning" ? <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-danger-ink" aria-hidden /> : null}
      <span>{children}</span>
    </p>
  );
}

/* ---------- Account ---------- */

function AccountPane({ account }: { account: Account }) {
  const router = useRouter();
  const [email, setEmail] = useState(account.profile.email);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const method = account.session?.method;

  const saveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Enter an email address like name@example.com.");
      return;
    }
    setEmailError(null);
    updateAccount((a) => ({ ...a, profile: { ...a.profile, email: value, emailVerified: false } }));
    setSentTo(value || null);
  };

  return (
    <>
      <Section title="Profile">
        <Link href="/app/profile" className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2/60">
          <Avatar id="me" name={account.profile.name} photo={account.profile.photo} size={52} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-semibold">{account.profile.name}</span>
            <span className="block truncate text-[14px] text-muted">@{account.profile.username}</span>
          </span>
          <span className="flex items-center gap-1 text-[14px] text-accent-ink">
            Edit profile <CaretRight size={14} aria-hidden />
          </span>
        </Link>
      </Section>

      <Section title="Email" footnote="Used to recover your account and for important notices. Friends never see it.">
        <form onSubmit={saveEmail} className="grid gap-3 px-5 py-5" noValidate>
          <TextField
            id="email"
            label="Email address"
            optional
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
              setSentTo(null);
            }}
            onBlur={() => {
              const v = email.trim();
              if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) setEmailError("Enter an email address like name@example.com.");
            }}
            error={emailError}
            status={
              sentTo ? (
                <span className="text-muted">We sent a link to {sentTo}. Open it to confirm this address.</span>
              ) : account.profile.email && !account.profile.emailVerified ? (
                <span className="text-muted">Not confirmed yet.</span>
              ) : null
            }
          />
          <div>
            <Button type="submit" size="sm" disabled={email.trim() === account.profile.email}>
              {!email.trim() && account.profile.email ? "Remove email" : "Save email"}
            </Button>
          </div>
        </form>
      </Section>

      <Section title="Session">
        <Row
          label={method ? `Using ${method === "passkey" ? "a passkey" : `Sign in with ${methodLabel(method)}`}` : "Signed in"}
          description={account.session ? `Signed in on this browser ${timeAgo(account.session.since).toLowerCase()}.` : undefined}
          control={
            <Button
              variant="danger-quiet"
              size="sm"
              onClick={() => {
                signOut();
                router.replace("/sign-in?notice=signed-out");
              }}
            >
              Sign out
            </Button>
          }
        />
      </Section>
    </>
  );
}

/* ---------- Sign-in & security ---------- */

function SecurityPane({ account }: { account: Account }) {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const lastMethod = signInMethodCount(account) <= 1;
  const others = account.sessions.filter((s) => !s.current);

  useEffect(() => {
    if (!adding) return;
    // Stand-in for navigator.credentials.create().
    const t = window.setTimeout(() => {
      addPasskey();
      setAdding(false);
    }, 1300);
    return () => window.clearTimeout(t);
  }, [adding]);

  const key = account.passkeys.find((p) => p.id === removing);

  return (
    <>
      <p className="mt-2 text-[15px] text-muted">Lynk has no passwords. You sign in with a passkey, Apple or Google.</p>

      <Section
        title="Passkeys"
        footnote="A passkey lives on your device and is unlocked with Face ID, Touch ID or your screen lock. It can't be phished or leaked."
      >
        {account.passkeys.map((p) => (
          <Row
            key={p.id}
            icon={<Fingerprint size={22} />}
            label={p.name}
            description={`Added ${formatDate(p.createdAt)} · ${p.lastUsedAt ? `Last used ${timeAgo(p.lastUsedAt).toLowerCase()}` : "Not used yet"}`}
            control={
              <Button
                size="sm"
                variant="danger-quiet"
                onClick={() => setRemoving(p.id)}
                disabled={lastMethod}
                title={lastMethod ? "Add another way to sign in first" : undefined}
              >
                Remove
              </Button>
            }
          />
        ))}
        <div className="px-5 py-4">
          <Button size="sm" variant="primary" loading={adding} onClick={() => setAdding(true)}>
            {adding ? "Waiting for your device" : "Add a passkey"}
          </Button>
        </div>
      </Section>

      <Section
        title="Apple and Google"
        footnote={lastMethod ? "This is your only way to sign in, so it can't be disconnected until you add another." : undefined}
      >
        {(["apple", "google"] as const).map((provider) => {
          const on = account.linked[provider];
          const Icon = provider === "apple" ? AppleLogo : GoogleLogo;
          return (
            <Row
              key={provider}
              icon={<Icon size={22} weight="fill" />}
              label={provider === "apple" ? "Sign in with Apple" : "Sign in with Google"}
              description={on ? "Connected" : "Not connected"}
              control={
                on ? (
                  <Button size="sm" onClick={() => setLinked(provider, false)} disabled={lastMethod}>
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setLinked(provider, true)}>
                    Connect
                  </Button>
                )
              }
            />
          );
        })}
      </Section>

      <Section title="Where you're signed in">
        {account.sessions.map((s) => {
          const Icon = s.device === "iPhone" ? DeviceMobile : s.current ? Desktop : Laptop;
          return (
            <Row
              key={s.id}
              icon={<Icon size={22} />}
              label={
                <>
                  {s.device} · {s.browser}
                  {s.current ? (
                    <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent-ink">This device</span>
                  ) : null}
                </>
              }
              description={s.current ? "Active now" : `${s.place} · ${timeAgo(s.lastActiveAt)}`}
              control={
                s.current ? null : (
                  <Button size="sm" onClick={() => endSession(s.id)}>
                    Sign out
                  </Button>
                )
              }
            />
          );
        })}
        {others.length ? (
          <div className="px-5 py-4">
            <Button size="sm" variant="danger-quiet" onClick={() => setConfirmOthers(true)}>
              Sign out of all other sessions
            </Button>
          </div>
        ) : null}
      </Section>

      <Section title="Recent activity" footnote="If something here wasn't you, sign out of that session and remove any passkey you don't recognise.">
        <ul className="divide-y divide-line">
          {account.log.slice(0, 8).map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-4 px-5 py-3">
              <span className="text-[15px]">{e.text}</span>
              <span className="shrink-0 text-[13px] text-muted tabular-nums">{timeAgo(e.at)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Dialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Remove this passkey?"
        description={`You won't be able to sign in with “${key?.name ?? "this passkey"}” any more. Also delete it from your device's password manager.`}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => setRemoving(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (removing) removePasskey(removing);
              setRemoving(null);
            }}
          >
            Remove passkey
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmOthers}
        onClose={() => setConfirmOthers(false)}
        title="Sign out everywhere else?"
        description={`${others.length} other ${others.length === 1 ? "session" : "sessions"} will be signed out. You'll stay signed in here.`}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => setConfirmOthers(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              endSession("others");
              setConfirmOthers(false);
            }}
          >
            Sign out others
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/* ---------- Privacy ---------- */

function PrivacyPane({ account }: { account: Account }) {
  const set = <K extends keyof Account["privacy"]>(key: K, value: Account["privacy"][K]) =>
    updateAccount((a) => ({ ...a, privacy: { ...a.privacy, [key]: value } }));

  return (
    <>
      <Section title="Who can start a chat with you">
        <RadioRows
          name="new-chats"
          legend="Who can start a chat with you"
          value={account.privacy.newChats}
          onChange={(v) => set("newChats", v)}
          options={[
            { value: "everyone", label: "Anyone with your username or link" },
            { value: "chats", label: "Only people in your groups", description: "Others can still message you once you add them." },
          ]}
        />
      </Section>

      <Section
        title="Online and last seen"
        footnote="It's mutual: if you hide yours from someone, you won't see theirs either."
      >
        <RadioRows<Audience>
          name="presence"
          legend="Who can see when you're online and last seen"
          value={account.privacy.presence}
          onChange={(v) => set("presence", v)}
          options={[
            { value: "everyone", label: "Everyone you chat with" },
            { value: "chats", label: "Only people in your groups and chats" },
            { value: "nobody", label: "Nobody" },
          ]}
        />
      </Section>

      <Section title="Messages" footnote="Turning read receipts off also hides other people's from you.">
        <SwitchRow
          label="Read receipts"
          description="Let people know when you've read their one-to-one messages."
          checked={account.privacy.readReceipts}
          onChange={(v) => set("readReceipts", v)}
        />
      </Section>

      <Section title="Blocked" footnote="Blocking hides messages, online status and invites in both directions, including in groups you share. People aren't told.">
        {account.blocked.length ? (
          account.blocked.map((id) => (
            <Row
              key={id}
              icon={<Avatar id={id} name={PEOPLE[id]?.name ?? id} size={32} />}
              label={PEOPLE[id]?.name ?? id}
              description={PEOPLE[id] ? `@${PEOPLE[id].handle}` : undefined}
              control={
                <Button size="sm" onClick={() => updateAccount((a) => ({ ...a, blocked: a.blocked.filter((b) => b !== id) }))}>
                  Unblock
                </Button>
              }
            />
          ))
        ) : (
          <p className="px-5 py-4 text-[15px] text-muted">You haven&apos;t blocked anyone. You can block someone from their profile.</p>
        )}
      </Section>

      <Section title="Memories about you">
        <Link href="/app/profile" className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2/60">
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium">See what Lynk remembers about you</span>
            <span className="block text-[13px] text-muted">Review and remove anything people said about you.</span>
          </span>
          <CaretRight size={16} className="shrink-0 text-muted" aria-hidden />
        </Link>
      </Section>
    </>
  );
}

/* ---------- Notifications ---------- */

function NotificationsPane({ account }: { account: Account }) {
  const n = account.notifications;
  const set = <K extends keyof Account["notifications"]>(key: K, value: Account["notifications"][K]) =>
    updateAccount((a) => ({ ...a, notifications: { ...a.notifications, [key]: value } }));
  // Panes render on the client only (behind the sign-in gate), so this is safe to read here.
  const [permission, setPermission] = useState(() => (typeof Notification === "undefined" ? "unsupported" : Notification.permission));
  const allow = async () => {
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      // Older Safari only takes a callback; the state stays as it was.
    }
    set("asked", true);
  };

  return (
    <>
      <Note>
        While Lynk is open in this browser, new messages alert you even when the tab is in the background. Alerts with Lynk
        closed arrive with the server.
      </Note>

      <Section title="This browser">
        <Row
          label="Alerts"
          description={
            permission === "granted"
              ? "On. Lynk follows the choices below."
              : permission === "denied"
                ? "Blocked by your browser. Allow notifications for this site in its site settings."
                : permission === "unsupported"
                  ? "This browser doesn't support notifications."
                  : "Off. Turn them on to hear about new messages in other tabs."
          }
          control={
            permission === "default" ? (
              <Button variant="primary" size="sm" onClick={() => void allow()}>
                Turn on
              </Button>
            ) : permission === "granted" ? (
              <span className="text-[13px] font-medium text-accent-ink">On</span>
            ) : null
          }
        />
      </Section>

      <Section title="Chats">
        <SwitchRow label="One-to-one chats" description="New messages from one person." checked={n.direct} onChange={(v) => set("direct", v)} />
        <Row
          label="Group chats"
          description="Mentions only keeps busy groups quiet until someone needs you."
          stack
          control={
            <Segmented
              name="groups"
              label="Group chat notifications"
              value={n.groups}
              onChange={(v) => set("groups", v)}
              options={[
                { value: "all", label: "All messages" },
                { value: "mentions", label: "Mentions only" },
                { value: "off", label: "Off" },
              ]}
            />
          }
        />
      </Section>

      <Section title="Alerts" footnote="To mute one chat, open it and choose Info.">
        <SwitchRow label="Show message previews" description="Off shows only who wrote, not what they said." checked={n.previews} onChange={(v) => set("previews", v)} />
        <SwitchRow label="Sounds" checked={n.sounds} onChange={(v) => set("sounds", v)} />
      </Section>
    </>
  );
}

/* ---------- Smart features ---------- */

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "zh", label: "Chinese" },
  { value: "sv", label: "Swedish" },
];

/**
 * Suggest, never decide (roadmap). Everything Lynk spots stays a suggestion
 * until someone confirms it, and private chats never use any of it
 * (HIG `generative-ai.md`: disclose, give control, work well when off).
 */
function SmartPane({ account }: { account: Account }) {
  const s = account.smart;
  const set = <K extends keyof Account["smart"]>(key: K, value: Account["smart"][K]) =>
    updateAccount((a) => ({ ...a, smart: { ...a.smart, [key]: value } }));
  const off = !s.enabled;

  return (
    <>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Lynk reads your normal chats to suggest plans, to-dos and things worth remembering. It only ever suggests: nothing is
        saved until someone in the chat confirms it, and every suggestion links to the messages it came from.
      </p>

      <Section title="All smart features" footnote="Private chats are end-to-end encrypted, so smart features are always off there.">
        <SwitchRow
          label="Smart features"
          description={off ? "Off. Lynk is a plain chat app, and nothing is read for suggestions." : "On for your normal chats."}
          checked={s.enabled}
          onChange={(v) => set("enabled", v)}
        />
      </Section>

      <Section title="Suggestions" footnote={off ? "Turn on smart features to choose these." : undefined}>
        <SwitchRow label="Plans" description="When a chat agrees on a time or place." checked={s.plans} onChange={(v) => set("plans", v)} disabled={off} />
        <SwitchRow label="To-dos" description="Asks like “can you bring the snacks?”" checked={s.todos} onChange={(v) => set("todos", v)} disabled={off} />
        <SwitchRow label="Memories" description="Birthdays, favourite places and other little things." checked={s.memories} onChange={(v) => set("memories", v)} disabled={off} />
        <SwitchRow label="Catch-up" description="A short summary when a busy group gets ahead of you." checked={s.catchUp} onChange={(v) => set("catchUp", v)} disabled={off} />
        <SwitchRow label="Voice-note transcripts" description="Read or search voice notes." checked={s.transcripts} onChange={(v) => set("transcripts", v)} disabled={off} />
      </Section>

      <Section title="Translation" footnote="Translated messages always keep a View original button.">
        <SwitchRow
          label="Offer translations"
          description="For messages in a language other than yours."
          checked={s.translation}
          onChange={(v) => set("translation", v)}
          disabled={off}
        />
        <Row
          label={<label htmlFor="translate-to">Translate into</label>}
          control={
            <select
              id="translate-to"
              value={s.translateTo}
              onChange={(e) => set("translateTo", e.target.value)}
              disabled={off || !s.translation}
              className="h-10 rounded-full border border-line bg-surface pr-8 pl-4 text-[15px] disabled:opacity-45"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          }
        />
      </Section>

      <Note>In this preview, the suggestions you see are sample data. Your choices are saved and will apply once smart features launch.</Note>
    </>
  );
}

/* ---------- Appearance ---------- */

function AppearancePane() {
  const theme = useTheme();
  return (
    <>
      <Section
        title="Theme"
        footnote="Match system follows your device's light and dark setting, which is what most people want. Reduced transparency and text size always follow your device."
      >
        <div className="px-5 py-5">
          <Segmented<ThemeChoice>
            name="theme"
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: "system", label: "Match system", icon: <Desktop size={16} aria-hidden /> },
              { value: "light", label: "Light", icon: <Sun size={16} aria-hidden /> },
              { value: "dark", label: "Dark", icon: <Moon size={16} aria-hidden /> },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

/* ---------- Your data ---------- */

function DataPane({ account }: { account: Account }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState<"later" | "now">("later");
  const [typed, setTyped] = useState("");
  const [exporting, setExporting] = useState(false);
  const matches = typed.trim().replace(/^@/, "") === account.profile.username;

  const close = () => {
    setOpen(false);
    setTyped("");
    setWhen("later");
  };

  const confirm = () => {
    if (!matches) return;
    if (when === "later") {
      scheduleDeletion();
      close();
    } else {
      deleteAccountNow();
      router.replace("/sign-in?notice=deleted");
    }
  };

  return (
    <>
      {account.deletionAt ? (
        <Note tone="warning">
          Your account will be deleted on <strong className="font-semibold">{formatDate(account.deletionAt)}</strong>. Until then
          everything works as normal.{" "}
          <button type="button" onClick={cancelDeletion} className="font-medium text-accent-ink hover:underline">
            Keep my account
          </button>
        </Note>
      ) : null}

      <Section title="Download your data" footnote="A JSON file with your profile, settings, sign-in methods and what Lynk remembers about you.">
        <Row
          label="Your Lynk data"
          description="Ready right away."
          control={
            <Button
              size="sm"
              loading={exporting}
              onClick={() => {
                setExporting(true);
                window.setTimeout(() => {
                  exportAccount(account);
                  setExporting(false);
                }, 500);
              }}
            >
              {exporting ? null : <DownloadSimple size={15} aria-hidden />} Download
            </Button>
          }
        />
      </Section>

      <Section
        title="Delete account"
        footnote="Deleting removes your profile, your sign-in methods, your settings and everything remembered about you."
      >
        <Row
          label="Delete your account"
          description={`You can delete right away or in ${DELETION_GRACE_DAYS} days, which gives you time to change your mind.`}
          control={
            <Button size="sm" variant="danger-quiet" onClick={() => setOpen(true)} disabled={Boolean(account.deletionAt)}>
              <Trash size={15} aria-hidden /> Delete
            </Button>
          }
        />
      </Section>

      <Dialog
        open={open}
        onClose={close}
        title="Delete your Lynk account?"
        description="Your profile, settings and everything remembered about you go with it. Once it happens, it can't be undone."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
          noValidate
        >
          <fieldset>
            <legend className="text-[13px] font-semibold text-muted">When</legend>
            <div className="mt-2 grid gap-2">
              {[
                { value: "later" as const, label: `In ${DELETION_GRACE_DAYS} days`, description: "Keep using Lynk until then, and cancel any time." },
                { value: "now" as const, label: "Right now", description: "You'll be signed out immediately." },
              ].map((o) => (
                <label
                  key={o.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 ${when === o.value ? "border-accent bg-accent-soft/50" : "border-line"}`}
                >
                  <input
                    type="radio"
                    name="when"
                    value={o.value}
                    checked={when === o.value}
                    onChange={() => setWhen(o.value)}
                    className="mt-1 size-4 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="block text-[15px] font-medium">{o.label}</span>
                    <span className="block text-[13px] text-muted">{o.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <TextField
            id="confirm-username"
            label={`Type ${account.profile.username} to confirm`}
            className="mt-5"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={!matches}>
              {when === "later" ? `Delete in ${DELETION_GRACE_DAYS} days` : "Delete now"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}


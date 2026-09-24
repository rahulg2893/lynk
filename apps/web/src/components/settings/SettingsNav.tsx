"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CaretRight,
  Database,
  Eye,
  PaintBrush,
  ShieldCheck,
  Sparkle,
  UserCircle,
  type Icon,
} from "@phosphor-icons/react";
import { PANES, type PaneId } from "./panes";

const ICONS: Record<PaneId, Icon> = {
  account: UserCircle,
  security: ShieldCheck,
  privacy: Eye,
  notifications: Bell,
  "smart-features": Sparkle,
  appearance: PaintBrush,
  data: Database,
};

/**
 * The list of panes. On tablet and desktop it's a sidebar that always shows
 * the active pane (HIG `settings.md` › Desktop); on phones it's the first
 * screen of Settings, iOS-style, with a chevron on every row.
 */
export function SettingsNav({ variant }: { variant: "sidebar" | "list" }) {
  const pathname = usePathname();
  const activeId = pathname === "/app/settings" ? "account" : pathname.split("/")[3];

  if (variant === "list") {
    return (
      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
        {PANES.map((p) => {
          const Icon = ICONS[p.id];
          return (
            <li key={p.id}>
              <Link href={`/app/settings/${p.id}`} className="flex items-center gap-3.5 px-4 py-3.5 active:bg-surface-2">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-surface-2 text-ink">
                  <Icon size={19} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{p.label}</span>
                  <span className="block truncate text-[13px] text-muted">{p.summary}</span>
                </span>
                <CaretRight size={16} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <nav aria-label="Settings" className="hidden h-dvh w-72 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface/60 px-3 py-6 md:flex">
      <h2 className="px-3 text-2xl font-semibold tracking-tight">Settings</h2>
      <ul className="mt-5 grid gap-0.5">
        {PANES.map((p) => {
          const Icon = ICONS[p.id];
          const active = p.id === activeId;
          return (
            <li key={p.id}>
              <Link
                href={`/app/settings/${p.id}`}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
                  active ? "bg-surface font-medium shadow-soft" : "text-muted hover:bg-surface-2/70 hover:text-ink",
                ].join(" ")}
              >
                <Icon size={19} weight={active ? "fill" : "regular"} className={active ? "text-accent-ink" : ""} aria-hidden />
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-auto px-3 pt-6 text-[12px] text-muted">
        Open Settings from anywhere with <kbd className="rounded-md border border-line px-1">⌘,</kbd>
      </p>
    </nav>
  );
}

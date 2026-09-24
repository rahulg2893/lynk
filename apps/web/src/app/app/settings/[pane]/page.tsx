import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SettingsPane } from "@/components/settings/SettingsPanes";
import { PANES, isPane } from "@/components/settings/panes";

export function generateStaticParams() {
  return PANES.map((p) => ({ pane: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/app/settings/[pane]">): Promise<Metadata> {
  const { pane } = await params;
  return { title: PANES.find((p) => p.id === pane)?.label ?? "Settings" };
}

export default async function SettingsPanePage({ params }: PageProps<"/app/settings/[pane]">) {
  const { pane } = await params;
  if (!isPane(pane)) notFound();
  return <SettingsPane id={pane} />;
}

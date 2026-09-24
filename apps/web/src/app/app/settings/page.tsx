import type { Metadata } from "next";
import { SettingsHome } from "@/components/settings/SettingsPanes";

export const metadata: Metadata = {
  title: "Settings",
};

/** Phones see the list of panes; wider screens open on Account beside the sidebar. */
export default function SettingsPage() {
  return <SettingsHome />;
}

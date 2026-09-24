import { SettingsNav } from "@/components/settings/SettingsNav";

export default function SettingsLayout({ children }: LayoutProps<"/app/settings">) {
  return (
    <div className="flex min-w-0 flex-1">
      <SettingsNav variant="sidebar" />
      {children}
    </div>
  );
}

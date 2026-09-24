import { AppFrame } from "@/components/app/AppFrame";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return <AppFrame>{children}</AppFrame>;
}

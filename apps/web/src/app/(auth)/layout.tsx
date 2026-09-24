import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { AuthAside } from "@/components/auth/AuthAside";

/** Sign in and sign up: the form on the left, the product's story on the right. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="landing grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-h-dvh flex-col px-5 py-5 sm:px-8">
        <header>
          <Link href="/" aria-label="Lynk home" className="inline-flex rounded-full">
            <Logo />
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
        <footer className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
          <Link href="/privacy" className="hover:text-ink">
            How Lynk handles your chats
          </Link>
          <span>© 2026 Lynk</span>
        </footer>
      </div>
      <AuthAside />
    </div>
  );
}

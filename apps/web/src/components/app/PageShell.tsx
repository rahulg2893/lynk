import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";

/**
 * A scrolling page inside the app frame: a header with an optional back link
 * and a title, then a centred column. Back links show on phones, where the
 * dock is hidden; `backAlways` keeps them on every size.
 */
export function PageShell({
  title,
  back,
  backAlways = false,
  actions,
  children,
}: {
  title: string;
  back?: { href: string; label: string };
  backAlways?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="h-dvh min-w-0 flex-1 overflow-y-auto">
      {/* On wider screens the dock handles navigation, so an empty bar is hidden. */}
      <header className={`sticky top-0 z-10 border-b border-line bg-bg/95 ${backAlways || actions ? "" : "md:hidden"}`}>
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-3 md:px-8">
          {back ? (
            <Link
              href={back.href}
              className={`-ml-1 inline-flex h-10 items-center gap-0.5 rounded-full pr-3 pl-1.5 text-[15px] text-accent-ink hover:bg-accent-soft ${backAlways ? "" : "md:hidden"}`}
            >
              <CaretLeft size={20} weight="bold" aria-hidden />
              {back.label}
            </Link>
          ) : null}
          <div className="flex-1" />
          {actions}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 pt-6 pb-24 md:px-8 md:pt-10">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}

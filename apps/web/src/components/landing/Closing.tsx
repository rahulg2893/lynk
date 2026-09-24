import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import { FadeIn } from "@/components/motion/FadeIn";
import { Logo } from "./Logo";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "Web app", href: "/app" },
      { label: "Create an account", href: "/sign-up" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "How Lynk handles your chats", href: "/privacy" },
    ],
  },
];

export function Closing() {
  return (
    <>
      <section className="bg-bg px-4 pb-28 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center rounded-[2rem] bg-stage px-6 py-20 text-center text-on-stage md:py-28">
          <FadeIn inView>
            <h2 className="max-w-[18ch] text-4xl leading-[1.02] font-semibold tracking-tight text-balance md:text-6xl">
              Bring your people over.
            </h2>
          </FadeIn>
          <FadeIn inView delay={0.3}>
            <p className="mx-auto mt-5 max-w-[40ch] text-lg text-on-stage-muted">
              Start a chat, invite your friends, and never lose the plan again.
            </p>
          </FadeIn>
          <FadeIn inView delay={0.45} className="mt-9">
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 font-medium whitespace-nowrap text-on-accent transition-transform active:scale-[0.98]"
            >
              Open Lynk
              <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </FadeIn>
        </div>
      </section>

      <footer className="border-t border-line bg-bg px-4 py-14 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-[30ch] text-sm text-muted">The group chat that remembers the plan.</p>
          </div>
          {FOOTER_LINKS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h3 className="text-sm font-semibold">{group.heading}</h3>
              <ul className="mt-3 grid gap-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-muted transition-colors hover:text-ink">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mx-auto mt-12 max-w-7xl text-sm text-muted">© 2026 Lynk</p>
      </footer>
    </>
  );
}

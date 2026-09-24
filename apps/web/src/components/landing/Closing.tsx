import { Logo } from "./Logo";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Privacy", href: "#privacy" },
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

/** The site footer. */
export function Closing() {
  return (
    <>
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

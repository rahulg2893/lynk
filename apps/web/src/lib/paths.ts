/** Shared by server pages and client components; keep it free of React. */

/** Only same-site paths are allowed as a post-sign-in destination. */
export function safeNext(next: string | string[] | undefined, fallback = "/app") {
  const n = Array.isArray(next) ? next[0] : next;
  return n && n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

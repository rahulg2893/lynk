/**
 * Sign-in by phone number and a texted code. Shared by the web and phone
 * apps. Lynk starts in India, so +91 is the default country code. Numbers are
 * kept in E.164 (+919876543210). Until the server exists
 * no text is sent: any 6-digit code is accepted after a short pause.
 * ponytail: the format check is length-only; the server validates with libphonenumber.
 */

/** The preview account's number, the usual Indian placeholder. No text is ever sent to it. */
export const DEMO_PHONE = "+919876543210";
/** What the number field starts with. */
export const DEFAULT_DIAL = "+91 ";
export const CODE_LENGTH = 6;
export const RESEND_SECONDS = 30;

/** Digits with a leading +. A 00 prefix counts as +, and an Indian mobile typed without +91 (98765 43210, 098765 43210) gets it. */
export function normalizePhone(raw: string) {
  const p = raw.replace(/[^\d+]/g, "");
  if (p.startsWith("00")) return `+${p.slice(2)}`;
  const local = p.replace(/^0/, "");
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : p;
}

/** A human-readable problem with the number, or null when it looks complete. */
export function phoneProblem(raw: string): string | null {
  const p = normalizePhone(raw);
  if (!p.replace("+", "")) return "Enter your phone number.";
  if (!p.startsWith("+")) return "Start with your country code, like +44 or +91.";
  if (!/^\+[1-9]\d{7,14}$/.test(p)) return "That doesn't look like a full phone number.";
  return null;
}

/** Stand-in for the server texting a code to the number. */
export const sendCode = () => new Promise<void>((resolve) => setTimeout(resolve, 800));

/** Stand-in for the server checking the code: any 6 digits pass. */
export const checkCode = (code: string) =>
  new Promise<boolean>((resolve) => setTimeout(() => resolve(new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)), 600));

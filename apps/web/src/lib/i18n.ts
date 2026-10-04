import { HI } from "./i18n-hi";

/**
 * The app's own text in English or Hindi. Strings are keyed by their English
 * wording, so anything not translated yet simply shows in English. `{name}`
 * placeholders are filled from `vars`. The phone app sets the language from
 * its settings; the web stays in English for now.
 */

export type Lang = "en" | "hi";
export const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
];

let current: Lang = "en";
export const setLang = (lang: Lang) => {
  current = lang;
};
export const getLang = () => current;

/** Locale for dates and times: Hindi formatting in Hindi, the device's own otherwise. */
export const locale = () => (current === "hi" ? "hi-IN" : undefined);

export function t(text: string, vars?: Record<string, string | number>) {
  const out = current === "hi" ? (HI[text] ?? text) : text;
  return vars ? out.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : out;
}

/** "Amara, Jonas and you": a list joined the way the language does it. */
export const joinNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} ${t("and")} ${names.at(-1)}` : (names[0] ?? ""));

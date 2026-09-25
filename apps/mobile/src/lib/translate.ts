import { LANGUAGE_NAMES, SAMPLE_TRANSLATIONS } from "@shared/chat";

/**
 * Translate a message in place. Phones translate on the device (Apple
 * Translation, ML Kit), which needs a native module that isn't in this build
 * yet, so for now only the demo messages have (labelled) sample translations.
 */
export function translateSample(messageId: string, target: string) {
  const s = SAMPLE_TRANSLATIONS[messageId];
  if (!s || s.from === target) return null;
  const text = s.text[target] ?? s.text.en;
  return text ? { text, from: s.from } : null;
}

export const languageName = (code: string) => LANGUAGE_NAMES[code] ?? code;

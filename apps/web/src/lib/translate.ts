"use client";

import { LANGUAGE_NAMES, SAMPLE_TRANSLATIONS } from "./chat";

/**
 * Translate a message in place. In order: the built-in translator in recent
 * Chrome (on-device, nothing leaves the browser), then the demo translations
 * that ship with the sample chats. The server-side version (cached per
 * message and language) arrives with smart features.
 */

export type Translation = { text: string; from: string; source: "browser" | "sample" };

type Detector = { detect: (text: string) => Promise<{ detectedLanguage: string; confidence: number }[]> };
type Translator = { translate: (text: string) => Promise<string> };
type Api = {
  LanguageDetector?: { create: () => Promise<Detector> };
  Translator?: {
    availability?: (o: { sourceLanguage: string; targetLanguage: string }) => Promise<string>;
    create: (o: { sourceLanguage: string; targetLanguage: string }) => Promise<Translator>;
  };
};

export const languageName = (code: string) => LANGUAGE_NAMES[code] ?? new Intl.DisplayNames(undefined, { type: "language" }).of(code) ?? code;

async function browserTranslate(text: string, target: string): Promise<Translation | null> {
  const api = globalThis as unknown as Api;
  if (!api.Translator || !api.LanguageDetector) return null;
  try {
    const detector = await api.LanguageDetector.create();
    const [best] = await detector.detect(text);
    const from = best?.detectedLanguage;
    if (!from || from === "und" || from === target) return null;
    const pair = { sourceLanguage: from, targetLanguage: target };
    if (api.Translator.availability && (await api.Translator.availability(pair)) === "unavailable") return null;
    const translator = await api.Translator.create(pair);
    return { text: await translator.translate(text), from, source: "browser" };
  } catch {
    return null;
  }
}

export async function translateMessage(messageId: string, text: string, target: string): Promise<Translation | null> {
  const sample = SAMPLE_TRANSLATIONS[messageId];
  if (sample && sample.from !== target) {
    const fromBrowser = await browserTranslate(text, target);
    if (fromBrowser) return fromBrowser;
    const t = sample.text[target] ?? sample.text.en;
    return t ? { text: t, from: sample.from, source: "sample" } : null;
  }
  return browserTranslate(text, target);
}

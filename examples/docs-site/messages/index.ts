import en from "./en";
import zh from "./zh";
import type { Locale } from "@/lib/i18n";

const messages = { en, zh } as const;

export function getMessages(locale: Locale) {
  return messages[locale];
}

export type Messages = typeof en;

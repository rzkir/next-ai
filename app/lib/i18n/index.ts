import agentMessages from "~/data/i18n/agent-messages.json";

export type Locale = "id" | "en" | "ja";

export const LOCALES: Locale[] = ["id", "en", "ja"];
export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "lang";

export type AgentMessages = (typeof agentMessages)[Locale];

const LOCALE_ALIASES: Record<string, Locale> = {
  id: "id",
  en: "en",
  ja: "ja",
  jpn: "ja",
  jp: "ja",
};

export function normalizeLocale(value: string | undefined | null): Locale | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return LOCALE_ALIASES[normalized] ?? null;
}

export function resolveLocale(value: string | undefined | null): Locale {
  return normalizeLocale(value) ?? DEFAULT_LOCALE;
}

export function localeToBcp47(locale: Locale): string {
  const map: Record<Locale, string> = {
    id: "id-ID",
    en: "en-US",
    ja: "ja-JP",
  };
  return map[locale];
}

export function getAgentMessages(locale: Locale = DEFAULT_LOCALE): AgentMessages {
  return agentMessages[locale] as AgentMessages;
}

export function getAgentStudio(locale: Locale = DEFAULT_LOCALE) {
  return getAgentMessages(locale).agentStudio;
}

export function getAgentBuild(locale: Locale = DEFAULT_LOCALE) {
  return getAgentMessages(locale).agentBuild;
}

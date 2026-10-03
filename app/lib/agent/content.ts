import type { AgentPromptCategory } from "~/types/agent";
import { getAgentStudio, type Locale } from "~/lib/i18n";

export type AgentStudioCategoryKey =
  | "studio"
  | "programming"
  | "seo"
  | "marketing"
  | "finance"
  | "health"
  | "trivia"
  | "academia"
  | "technology"
  | "science"
  | "translation"
  | "legal";

export const AGENT_CATEGORY_KEYS = [
  "programming",
  "seo",
  "marketing",
  "finance",
  "health",
  "trivia",
  "academia",
  "technology",
  "science",
  "translation",
  "legal",
] as const satisfies ReadonlyArray<Exclude<AgentStudioCategoryKey, "studio">>;

export type AgentCategoryRouteKey = (typeof AGENT_CATEGORY_KEYS)[number];

export function isAgentCategoryRouteKey(
  value: string,
): value is AgentCategoryRouteKey {
  return (AGENT_CATEGORY_KEYS as readonly string[]).includes(value);
}

export type AgentCategoryCard = {
  title: string;
  categoryLabel: string;
  description: string;
  category: AgentPromptCategory;
  prompt: string;
};

export function getAgentCategoryCards(
  locale: Locale,
  key: AgentStudioCategoryKey,
): AgentCategoryCard[] {
  const category = getAgentStudio(locale).categories[key];
  return category.cards.map((card) => ({
    title: card.title,
    categoryLabel: card.categoryLabel,
    description: card.description,
    category: card.category as AgentPromptCategory,
    prompt: card.prompt,
  }));
}

export function getAgentSidebarItems(locale: Locale) {
  const { sidebar } = getAgentStudio(locale);
  return [
    { id: "chat", href: "/agent", label: sidebar.items.chat, icon: "agent" as const },
    {
      id: "programming",
      href: "/agent/programming",
      label: sidebar.items.programming,
      icon: "programming" as const,
    },
    { id: "seo", href: "/agent/seo", label: sidebar.items.seo, icon: "seo" as const },
    {
      id: "marketing",
      href: "/agent/marketing",
      label: sidebar.items.marketing,
      icon: "marketing" as const,
    },
    {
      id: "finance",
      href: "/agent/finance",
      label: sidebar.items.finance,
      icon: "finance" as const,
    },
    {
      id: "health",
      href: "/agent/health",
      label: sidebar.items.health,
      icon: "health" as const,
    },
    {
      id: "trivia",
      href: "/agent/trivia",
      label: sidebar.items.trivia,
      icon: "trivia" as const,
    },
    {
      id: "academia",
      href: "/agent/academia",
      label: sidebar.items.academia,
      icon: "academia" as const,
    },
    {
      id: "technology",
      href: "/agent/technology",
      label: sidebar.items.technology,
      icon: "technology" as const,
    },
    {
      id: "science",
      href: "/agent/science",
      label: sidebar.items.science,
      icon: "science" as const,
    },
    {
      id: "translation",
      href: "/agent/translation",
      label: sidebar.items.translation,
      icon: "translation" as const,
    },
    { id: "legal", href: "/agent/legal", label: sidebar.items.legal, icon: "legal" as const },
  ];
}

export function getCategoryPromptCategory(
  key: AgentStudioCategoryKey,
  locale: Locale,
): AgentPromptCategory {
  if (key === "studio") return "roleplay";
  return getAgentStudio(locale).categories[key].category as AgentPromptCategory;
}

export function getCategoryStorageKey(
  key: AgentStudioCategoryKey,
  locale: Locale,
): string {
  return getAgentStudio(locale).categories[key].storageKey;
}

export function categorySupportsCanvas(key: AgentStudioCategoryKey): boolean {
  return key === "studio" || key === "programming";
}

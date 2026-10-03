import type { Route } from "./+types/agent._index";
import { AgentShell } from "~/components/agent/AgentShell";
import {
  getAgentCategoryCards,
  getCategoryPromptCategory,
  getCategoryStorageKey,
} from "~/lib/agent/content";
import { getAgentStudio, DEFAULT_LOCALE } from "~/lib/i18n";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData?.title ?? "AI Studio" },
    { name: "description", content: loaderData?.description ?? "" },
    { name: "robots", content: "noindex" },
  ];
}

export function loader() {
  const locale = DEFAULT_LOCALE;
  const categoryKey = "studio" as const;
  const studio = getAgentStudio(locale);
  const page = studio.categories[categoryKey];

  return {
    locale,
    categoryKey,
    promptCategory: getCategoryPromptCategory(categoryKey, locale),
    storageKey: getCategoryStorageKey(categoryKey, locale),
    cards: getAgentCategoryCards(locale, categoryKey),
    title: page.meta.title,
    description: page.meta.description,
  };
}

export default function AgentStudioPage({ loaderData }: Route.ComponentProps) {
  return (
    <AgentShell
      categoryKey={loaderData.categoryKey}
      promptCategory={loaderData.promptCategory}
      storageKey={loaderData.storageKey}
      enableCanvas
      cards={loaderData.cards}
      locale={loaderData.locale}
      draftPath="/agent"
    />
  );
}

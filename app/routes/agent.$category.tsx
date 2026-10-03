import { data } from "react-router";
import type { Route } from "./+types/agent.$category";
import { AgentShell } from "~/components/agent/AgentShell";
import {
  categorySupportsCanvas,
  getAgentCategoryCards,
  getCategoryPromptCategory,
  getCategoryStorageKey,
  isAgentCategoryRouteKey,
} from "~/lib/agent/content";
import { getAgentStudio, DEFAULT_LOCALE } from "~/lib/i18n";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData?.title ?? "AI Agent" },
    { name: "description", content: loaderData?.description ?? "" },
    { name: "robots", content: "noindex" },
  ];
}

export function loader({ params }: Route.LoaderArgs) {
  const category = params.category;
  if (!category || !isAgentCategoryRouteKey(category)) {
    throw data("Not Found", { status: 404 });
  }

  const locale = DEFAULT_LOCALE;
  const studio = getAgentStudio(locale);
  const page = studio.categories[category];

  return {
    locale,
    categoryKey: category,
    promptCategory: getCategoryPromptCategory(category, locale),
    storageKey: getCategoryStorageKey(category, locale),
    cards: getAgentCategoryCards(locale, category),
    enableCanvas: categorySupportsCanvas(category),
    title: page.meta.title,
    description: page.meta.description,
    draftPath: `/agent/${category}`,
  };
}

export default function AgentCategoryPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <AgentShell
      categoryKey={loaderData.categoryKey}
      promptCategory={loaderData.promptCategory}
      storageKey={loaderData.storageKey}
      enableCanvas={loaderData.enableCanvas}
      cards={loaderData.cards}
      locale={loaderData.locale}
      draftPath={loaderData.draftPath}
    />
  );
}

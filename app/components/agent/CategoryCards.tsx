import type { AgentCategoryCard } from "~/lib/agent/content";
import { cn } from "~/lib/utils";

type Props = {
  cards: AgentCategoryCard[];
  onSelect: (prompt: string, category?: string) => void;
};

export function CategoryCards({ cards, onSelect }: Props) {
  return (
    <div
      id="agent-category-cards"
      className="agent-category-cards mx-auto mt-6 w-full max-w-[760px] text-left"
    >
      <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2">
        {cards.map((item) => (
          <li key={`${item.title}-${item.prompt.slice(0, 24)}`}>
            <button
              type="button"
              className={cn(
                "group flex h-full w-full items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm",
              )}
              data-agent-prompt={item.prompt}
              data-agent-category={item.category}
              onClick={() => onSelect(item.prompt, item.category)}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {item.title}
                </div>
                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {item.description || item.prompt}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

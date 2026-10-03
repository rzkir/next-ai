import type { AgentCategoryCard } from "~/lib/agent/content";
import { cn } from "~/lib/utils";
import {
  Code2,
  GraduationCap,
  Megaphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AgentPromptCategory } from "~/types/agent";

type Props = {
  cards: AgentCategoryCard[];
  onSelect: (prompt: string, category?: string) => void;
};

const ROLE_ICONS: Partial<Record<AgentPromptCategory, LucideIcon>> = {
  academia: GraduationCap,
  finance: Wallet,
  marketing: Megaphone,
  programming: Code2,
};

export function CategoryCards({ cards, onSelect }: Props) {
  return (
    <div
      id="agent-category-cards"
      className="agent-category-cards mx-auto mt-8 w-full max-w-[760px] text-left"
    >
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {cards.map((item) => {
          const Icon = ROLE_ICONS[item.category];
          return (
            <li key={`${item.title}-${item.category}`}>
              <button
                type="button"
                className={cn(
                  "group flex h-full w-full items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm",
                )}
                data-agent-prompt={item.prompt}
                data-agent-category={item.category}
                onClick={() => onSelect(item.prompt, item.category)}
              >
                {Icon ? (
                  <Icon className="mt-0.5 size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
                ) : null}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {item.title}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {item.description || item.prompt}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { Pin, Plus, Search, Trash2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  deriveThreadPreview,
  formatHistoryTime,
  getAgentHistoryPeriodLabels,
  type AgentHistoryPeriod,
} from "~/lib/agent/history";
import type { AgentChatThread } from "~/types/storage";

type Labels = {
  title: string;
  newChat: string;
  searchPlaceholder: string;
  openLabel: string;
  collapseLabel: string;
  closeLabel: string;
  panelLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  emptySearchTitle: string;
  emptySearchDescription: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: Labels;
  grouped: Array<{ period: AgentHistoryPeriod; threads: AgentChatThread[] }>;
  activeId: string | null;
  pinnedIds: string[];
  search: string;
  onSearch: (value: string) => void;
  onNewChat: () => void;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => void;
  onTogglePin: (threadId: string) => void;
  hasThreads: boolean;
};

export function HistoryPanel({
  open,
  onOpenChange,
  labels,
  grouped,
  activeId,
  pinnedIds,
  search,
  onSearch,
  onNewChat,
  onSelect,
  onDelete,
  onTogglePin,
  hasThreads,
}: Props) {
  const periodLabels = getAgentHistoryPeriodLabels();

  return (
    <div
      className={cn(
        "agent-history-root z-30 md:relative md:z-auto md:flex md:h-full md:shrink-0 md:flex-col md:overflow-hidden",
        open
          ? "pointer-events-auto fixed inset-0 md:static"
          : "pointer-events-none fixed inset-0 md:pointer-events-auto md:static",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-background/50 transition-opacity md:hidden",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={() => onOpenChange(false)}
      />

      <aside
        className={cn(
          "agent-history-panel absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col border-r border-border bg-background transition-transform duration-200 md:static md:w-72",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          !open && "md:w-12",
        )}
        aria-label={labels.panelLabel}
      >
        {open || true ? (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
              {open ? (
                <>
                  <h2 className="text-sm font-medium">{labels.title}</h2>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                      aria-label={labels.newChat}
                      onClick={onNewChat}
                    >
                      <Plus className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                      aria-label={labels.collapseLabel}
                      onClick={() => onOpenChange(false)}
                    >
                      <PanelLeftClose className="size-4" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="mx-auto inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                  aria-label={labels.openLabel}
                  onClick={() => onOpenChange(true)}
                >
                  <PanelLeftOpen className="size-4" />
                </button>
              )}
            </div>

            {open ? (
              <>
                <div className="border-b border-border px-3 py-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => onSearch(event.target.value)}
                      placeholder={labels.searchPlaceholder}
                      className="w-full rounded-lg border border-border bg-muted/40 py-2 pr-3 pl-8 text-sm outline-none focus:ring-1 focus:ring-foreground"
                    />
                  </div>
                </div>

                <div className="agent-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-3">
                  {!hasThreads ? (
                    <div className="agent-empty px-3 py-8 text-center">
                      <p className="text-sm font-medium">{labels.emptyTitle}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {labels.emptyDescription}
                      </p>
                    </div>
                  ) : grouped.length === 0 ? (
                    <div className="agent-empty px-3 py-8 text-center">
                      <p className="text-sm font-medium">
                        {labels.emptySearchTitle}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {labels.emptySearchDescription}
                      </p>
                    </div>
                  ) : (
                    grouped.map(({ period, threads }) => (
                      <div key={period} className="mb-4">
                        <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          {periodLabels[period]}
                        </p>
                        <ul className="space-y-1">
                          {threads.map((thread) => {
                            const active = thread.id === activeId;
                            const pinned = pinnedIds.includes(thread.id);
                            return (
                              <li key={thread.id}>
                                <div
                                  className={cn(
                                    "group flex items-start gap-1 rounded-xl px-2 py-2 transition-colors",
                                    active
                                      ? "bg-muted"
                                      : "hover:bg-muted/60",
                                  )}
                                >
                                  <button
                                    type="button"
                                    className="min-w-0 flex-1 text-left"
                                    onClick={() => {
                                      onSelect(thread.id);
                                      onOpenChange(false);
                                    }}
                                  >
                                    <div className="truncate text-sm font-medium">
                                      {thread.title}
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground">
                                      {deriveThreadPreview(thread.messages)}
                                    </div>
                                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                                      {formatHistoryTime(
                                        thread.updatedAt,
                                        period,
                                        active,
                                      )}
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    className={cn(
                                      "mt-0.5 inline-flex size-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100",
                                      pinned && "opacity-100 text-foreground",
                                    )}
                                    aria-label="Pin"
                                    onClick={() => onTogglePin(thread.id)}
                                  >
                                    <Pin className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="mt-0.5 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                                    aria-label="Delete"
                                    onClick={() => onDelete(thread.id)}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </aside>
    </div>
  );
}

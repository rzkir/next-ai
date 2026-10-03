import { useEffect, useRef } from "react";
import type { AgentChatMessage } from "~/types/agent";
import type { AgentCategoryCard } from "~/lib/agent/content";
import {
  formatAgentMessageHtml,
  formatAgentUserMessageHtml,
} from "~/lib/agent/message";
import { CategoryCards } from "~/components/agent/CategoryCards";
import { cn } from "~/lib/utils";

type Hero = {
  line1: string;
  line2: string;
  subtitle: string;
};

type Props = {
  messages: AgentChatMessage[];
  loading: boolean;
  isEmpty: boolean;
  hero: Hero;
  cards: AgentCategoryCard[];
  onSelectCard: (prompt: string, category?: string) => void;
  formatTime: (iso: string) => string;
};

export function ChatMessages({
  messages,
  loading,
  isEmpty,
  hero,
  cards,
  onSelectCard,
  formatTime,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  return (
    <div
      id="agent-messages"
      ref={viewportRef}
      className={cn(
        "agent-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain",
        isEmpty ? "flex flex-col" : "px-3 py-6 sm:px-6",
      )}
    >
      {isEmpty ? (
        <div
          id="agent-empty-state"
          className="msg-in flex flex-1 flex-col items-center justify-center px-4 pb-8"
        >
          <div className="w-full max-w-[760px]">
            <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
              {hero.line1} {hero.line2}
            </h2>
            <p className="mt-3 text-center text-muted-foreground">
              {hero.subtitle}
            </p>
            <CategoryCards cards={cards} onSelect={onSelectCard} />
          </div>
        </div>
      ) : (
        <div id="agent-thread" className="mx-auto max-w-[820px] space-y-8">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "agent-message agent-message-reveal",
                message.role === "user"
                  ? "agent-message--user flex justify-end"
                  : "agent-message--assistant",
              )}
            >
              <div
                className={cn(
                  message.role === "user"
                    ? "agent-user-bubble max-w-[85%] rounded-3xl bg-secondary px-5 py-3 text-[15px] leading-relaxed"
                    : "agent-ai-bubble w-full text-[15px] leading-relaxed",
                )}
              >
                <div
                  className="agent-message-content"
                  dangerouslySetInnerHTML={{
                    __html:
                      message.role === "user"
                        ? formatAgentUserMessageHtml(message.content)
                        : formatAgentMessageHtml(message.content),
                  }}
                />
                <div
                  className={cn(
                    "mt-2 text-xs text-muted-foreground",
                    message.role === "user" && "text-right",
                  )}
                >
                  {formatTime(message.sentAt)}
                  {message.model ? ` · ${message.model}` : ""}
                </div>
              </div>
            </div>
          ))}

          {loading ? (
            <div className="agent-message agent-message--assistant">
              <div className="agent-ai-bubble agent-loading-bubble flex items-center gap-1.5 py-2">
                <span className="agent-loading-dot" />
                <span className="agent-loading-dot" />
                <span className="agent-loading-dot" />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

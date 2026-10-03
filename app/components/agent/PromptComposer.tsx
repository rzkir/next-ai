import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "~/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  label: string;
  disabled?: boolean;
  error?: string | null;
  category: string;
};

const ROLE_LABELS: Record<string, string> = {
  programming: "Programming",
  technology: "Technology",
  seo: "SEO",
  marketing: "Marketing",
  customers_services: "Customer Service",
  science: "Science",
  translation: "Translation",
  legal: "Legal",
  finance: "Finance",
  health: "Health",
  trivia: "Trivia",
  academia: "Academia",
  roleplay: "General",
};

export function PromptComposer({
  value,
  onChange,
  onSubmit,
  label,
  disabled,
  error,
  category,
}: Props) {
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  useEffect(() => {
    if (!disabled) ta.current?.focus();
  }, [disabled]);

  const canSend = value.trim().length > 0 && !disabled;
  const roleLabel = ROLE_LABELS[category] ?? category;

  return (
    <div className="agent-prompt-dock sticky bottom-0 shrink-0 bg-gradient-to-t from-background via-background to-transparent px-3 pt-2 pb-3 sm:px-6">
      <div className="mx-auto max-w-[820px]">
        {error ? (
          <p
            id="agent-error"
            className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        ) : null}

        <form
          id="agent-prompt-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSend) onSubmit();
          }}
        >
          <input type="hidden" name="category" value={category} />
          <div
            className={cn(
              "relative rounded-3xl border bg-card shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--foreground)_18%,transparent)] transition-colors focus-within:border-foreground/25",
            )}
          >
            <label className="sr-only" htmlFor="main-prompt-input">
              {label}
            </label>
            <textarea
              ref={ta}
              id="main-prompt-input"
              name="message"
              rows={1}
              required
              disabled={disabled}
              placeholder={label}
              aria-label={label}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  if (canSend) onSubmit();
                }
              }}
              className="block w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-2 px-3 pb-3">
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {roleLabel}
              </span>
              {disabled ? (
                <button
                  type="button"
                  aria-label="Generating"
                  disabled
                  className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-80"
                >
                  <Square className="size-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  id="main-prompt-input-send"
                  disabled={!canSend}
                  aria-label="Send prompt"
                  className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 disabled:scale-100 disabled:opacity-25"
                >
                  <ArrowUp className="size-[18px]" />
                </button>
              )}
            </div>
          </div>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          AI can make mistakes. Check important information.
        </p>
      </div>
    </div>
  );
}

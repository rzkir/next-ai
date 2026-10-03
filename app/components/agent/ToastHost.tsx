import { useEffect, useState } from "react";
import {
  dismissNotification,
  subscribeNotifications,
  type NotificationPayload,
} from "~/lib/notifications";
import { cn } from "~/lib/utils";

export function ToastHost() {
  const [items, setItems] = useState<NotificationPayload[]>([]);

  useEffect(() => subscribeNotifications(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto rounded-xl border border-border bg-card px-4 py-3 shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--foreground)_18%,transparent)]",
            item.variant === "error" && "border-destructive/40",
            item.variant === "success" && "border-brand/30",
          )}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => dismissNotification(item.id)}
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

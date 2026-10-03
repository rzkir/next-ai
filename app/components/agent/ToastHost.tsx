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
            "pointer-events-auto rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur",
            item.variant === "error" && "border-destructive/40",
            item.variant === "success" && "border-foreground/20",
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

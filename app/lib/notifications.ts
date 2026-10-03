export type NotificationVariant = "default" | "success" | "error" | "info";

export type NotificationPayload = {
  id: string;
  title: string;
  description?: string;
  variant: NotificationVariant;
  duration: number;
};

type Listener = (notifications: NotificationPayload[]) => void;

const DEFAULT_DURATION = 4500;
const MAX_VISIBLE = 4;

let items: NotificationPayload[] = [];
const listeners = new Set<Listener>();
const timers = new Map<string, number>();

function emit() {
  const snapshot = [...items];
  listeners.forEach((listener) => listener(snapshot));
}

function generateId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener);
  listener([...items]);
  return () => listeners.delete(listener);
}

export function dismissNotification(id: string): void {
  const timer = timers.get(id);
  if (timer && typeof window !== "undefined") {
    window.clearTimeout(timer);
  }
  timers.delete(id);
  items = items.filter((item) => item.id !== id);
  emit();
}

function pushNotification(
  title: string,
  description: string | undefined,
  variant: NotificationVariant,
  duration = DEFAULT_DURATION,
): string {
  const id = generateId();
  items = [{ id, title, description, variant, duration }, ...items].slice(
    0,
    MAX_VISIBLE,
  );
  emit();

  if (typeof window !== "undefined" && duration > 0) {
    const timer = window.setTimeout(() => dismissNotification(id), duration);
    timers.set(id, timer);
  }

  return id;
}

export const toast = {
  success(title: string, description?: string) {
    return pushNotification(title, description, "success");
  },
  error(title: string, description?: string) {
    return pushNotification(title, description, "error");
  },
  info(title: string, description?: string) {
    return pushNotification(title, description, "info");
  },
  default(title: string, description?: string) {
    return pushNotification(title, description, "default");
  },
};

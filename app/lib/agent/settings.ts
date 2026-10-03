import type {
  AgentSettings,
  AgentSettingsKey,
  NotificationSoundId,
  NotificationSoundOption,
} from "~/types/settings";
import type { AgentHistoryItem } from "~/types/agent";
import { toast } from "~/lib/notifications";

export const SETTINGS_STORAGE_KEY = "agent-settings";
export const SETTINGS_CHANGE_EVENT = "agent-settings:change";
export const DRAFT_STORAGE_PREFIX = "agent-draft:";

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  desktopNotifications: true,
  autoSaveDrafts: true,
  betaFeatures: false,
  agentResponses: true,
  weeklyDigest: false,
  conciseResponses: false,
  rememberContext: true,
  notificationSound: "iphone",
};

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  {
    id: "iphone",
    label: "iPhone",
    src: "/notifications/IPHONE_NOTIFICATION.mp3",
  },
  {
    id: "computer",
    label: "Computer",
    src: "/notifications/Computer_Notification.mp3",
  },
  {
    id: "off",
    label: "Off",
    src: "",
  },
];

let cachedSettings: AgentSettings | null = null;
let audioContext: HTMLAudioElement | null = null;
let audioUnlocked = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isNotificationSoundId(value: unknown): value is NotificationSoundId {
  return value === "computer" || value === "iphone" || value === "off";
}

function normalizeSettings(value: unknown): AgentSettings {
  const source =
    value && typeof value === "object" ? (value as Partial<AgentSettings>) : {};

  return {
    desktopNotifications: isBoolean(source.desktopNotifications)
      ? source.desktopNotifications
      : DEFAULT_AGENT_SETTINGS.desktopNotifications,
    autoSaveDrafts: isBoolean(source.autoSaveDrafts)
      ? source.autoSaveDrafts
      : DEFAULT_AGENT_SETTINGS.autoSaveDrafts,
    betaFeatures: isBoolean(source.betaFeatures)
      ? source.betaFeatures
      : DEFAULT_AGENT_SETTINGS.betaFeatures,
    agentResponses: isBoolean(source.agentResponses)
      ? source.agentResponses
      : DEFAULT_AGENT_SETTINGS.agentResponses,
    weeklyDigest: isBoolean(source.weeklyDigest)
      ? source.weeklyDigest
      : DEFAULT_AGENT_SETTINGS.weeklyDigest,
    conciseResponses: isBoolean(source.conciseResponses)
      ? source.conciseResponses
      : DEFAULT_AGENT_SETTINGS.conciseResponses,
    rememberContext: isBoolean(source.rememberContext)
      ? source.rememberContext
      : DEFAULT_AGENT_SETTINGS.rememberContext,
    notificationSound: isNotificationSoundId(source.notificationSound)
      ? source.notificationSound
      : DEFAULT_AGENT_SETTINGS.notificationSound,
  };
}

export function getAgentSettings(): AgentSettings {
  if (cachedSettings) return { ...cachedSettings };

  if (!isBrowser()) {
    return { ...DEFAULT_AGENT_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    cachedSettings = raw
      ? normalizeSettings(JSON.parse(raw))
      : { ...DEFAULT_AGENT_SETTINGS };
  } catch {
    cachedSettings = { ...DEFAULT_AGENT_SETTINGS };
  }

  return { ...cachedSettings };
}

export function applyAgentSettings(
  settings: AgentSettings = getAgentSettings(),
): void {
  if (!isBrowser()) return;
  document.documentElement.dataset.betaFeatures = settings.betaFeatures
    ? "true"
    : "false";
}

export function saveAgentSettings(settings: AgentSettings): void {
  const normalized = normalizeSettings(settings);
  cachedSettings = normalized;

  if (!isBrowser()) return;

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  applyAgentSettings(normalized);
  window.dispatchEvent(
    new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: { settings: normalized } }),
  );
}

export function updateAgentSetting<K extends AgentSettingsKey>(
  key: K,
  value: AgentSettings[K],
): AgentSettings {
  const next = { ...getAgentSettings(), [key]: value };
  saveAgentSettings(next);
  return next;
}

function ensureNotificationAudio(): HTMLAudioElement {
  if (!audioContext) {
    audioContext = new Audio();
    audioContext.preload = "auto";
  }
  return audioContext;
}

export function unlockNotificationAudio(): void {
  if (!isBrowser() || audioUnlocked) return;

  const sound = NOTIFICATION_SOUNDS.find((item) => item.src);
  if (!sound?.src) return;

  try {
    const audio = ensureNotificationAudio();
    audio.src = sound.src;
    audio.volume = 0;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        audioUnlocked = true;
      })
      .catch(() => {});
  } catch {
    // ignore
  }
}

export function playNotificationSound(
  soundId: NotificationSoundId = getAgentSettings().notificationSound,
): void {
  if (!isBrowser() || soundId === "off") return;

  const sound = NOTIFICATION_SOUNDS.find((item) => item.id === soundId);
  if (!sound?.src) return;

  try {
    const audio = ensureNotificationAudio();
    audio.volume = 1;
    audio.src = sound.src;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      audioUnlocked = false;
    });
  } catch {
    // ignore
  }
}

export async function requestDesktopNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowser() || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showDesktopNotification(
  title: string,
  options?: NotificationOptions,
): void {
  if (!isBrowser() || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      icon: "/favicon.ico",
      ...options,
    });
  } catch {
    // ignore
  }
}

function truncateNotifyText(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function notifyAgentResponseComplete(options: {
  category: string;
  model?: string;
  message?: string;
  reply?: string;
}): void {
  const settings = getAgentSettings();
  if (!settings.agentResponses) return;

  const title = options.message?.trim()
    ? truncateNotifyText(options.message, 72)
    : truncateNotifyText(options.reply ?? "Balasan siap", 72);

  const description = options.reply?.trim()
    ? truncateNotifyText(options.reply, 120)
    : options.model
      ? `${options.category} · ${options.model}`
      : options.category;

  toast.success(title, description);

  if (settings.notificationSound !== "off") {
    playNotificationSound(settings.notificationSound);
  }

  if (settings.desktopNotifications) {
    showDesktopNotification(title, {
      body: description,
      tag: "agent-response",
    });
  }
}

export function prepareAgentMessage(message: string): string {
  if (!getAgentSettings().conciseResponses) return message;
  return `[Prefer concise, direct answers.]\n\n${message}`;
}

export function resolveAgentHistory(
  history?: AgentHistoryItem[],
): AgentHistoryItem[] | undefined {
  if (!getAgentSettings().rememberContext) return undefined;
  return history;
}

export function saveAgentDraft(path: string, value: string): void {
  if (!isBrowser()) return;
  const trimmed = value.trim();
  const key = `${DRAFT_STORAGE_PREFIX}${path}`;
  if (!trimmed) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, trimmed);
}

export function loadAgentDraft(path: string): string {
  if (!isBrowser()) return "";
  try {
    return window.localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${path}`) ?? "";
  } catch {
    return "";
  }
}

export function clearAgentDraft(path: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${path}`);
}

export { isNotificationSoundId };

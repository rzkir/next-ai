import type {
  AgentChatMessage,
  AgentPromptCategory,
} from "~/types/agent";
import type { AgentChatSession, AgentChatThread } from "~/types/storage";
import { deriveThreadTitle } from "~/lib/agent/history";

const STORAGE_PREFIX = "agent-chat:";
const THREADS_PREFIX = "agent-chat-threads:";
const ACTIVE_PREFIX = "agent-chat-active:";
const PINNED_PREFIX = "agent-chat-pinned:";
const MAX_MESSAGES = 100;
const MAX_THREADS = 50;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isValidMessage(value: unknown): value is AgentChatMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as AgentChatMessage;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    typeof message.sentAt === "string"
  );
}

function normalizeSession(value: unknown): AgentChatSession | null {
  if (!value || typeof value !== "object") return null;

  const session = value as AgentChatSession;
  if (!Array.isArray(session.messages)) return null;

  const messages = session.messages.filter(isValidMessage);
  if (messages.length === 0) return null;

  return {
    messages,
    sessionCategory: session.sessionCategory ?? null,
    updatedAt:
      typeof session.updatedAt === "string"
        ? session.updatedAt
        : new Date().toISOString(),
  };
}

function normalizeThread(value: unknown): AgentChatThread | null {
  if (!value || typeof value !== "object") return null;

  const thread = value as AgentChatThread;
  if (typeof thread.id !== "string" || !Array.isArray(thread.messages)) {
    return null;
  }

  const messages = thread.messages.filter(isValidMessage);
  const updatedAt =
    typeof thread.updatedAt === "string"
      ? thread.updatedAt
      : new Date().toISOString();
  const createdAt =
    typeof thread.createdAt === "string" ? thread.createdAt : updatedAt;

  return {
    id: thread.id,
    title:
      typeof thread.title === "string" && thread.title.trim()
        ? thread.title
        : deriveThreadTitle(messages),
    messages,
    sessionCategory: thread.sessionCategory ?? null,
    createdAt,
    updatedAt,
  };
}

function readLegacySession(storageKey: string): AgentChatSession | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
    if (!raw) return null;
    return normalizeSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

function migrateLegacySession(storageKey: string): AgentChatThread[] {
  const legacy = readLegacySession(storageKey);
  if (!legacy) return [];

  const updatedAt = legacy.updatedAt;
  const thread: AgentChatThread = {
    id: crypto.randomUUID(),
    title: deriveThreadTitle(legacy.messages),
    messages: legacy.messages,
    sessionCategory: legacy.sessionCategory ?? null,
    createdAt: updatedAt,
    updatedAt,
  };

  saveAgentChatThreads(storageKey, [thread]);
  setActiveAgentChatThreadId(storageKey, thread.id);

  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`);
  } catch {
    // ignore storage errors
  }

  return [thread];
}

export function loadAgentChatSession(
  storageKey: string,
): AgentChatSession | null {
  const activeId = getActiveAgentChatThreadId(storageKey);
  const thread = activeId
    ? getAgentChatThread(storageKey, activeId)
    : loadAgentChatThreads(storageKey)[0];

  if (!thread || thread.messages.length === 0) return null;

  return {
    messages: thread.messages,
    sessionCategory: thread.sessionCategory ?? null,
    updatedAt: thread.updatedAt,
  };
}

export function saveAgentChatSession(
  storageKey: string,
  messages: AgentChatMessage[],
  sessionCategory?: AgentPromptCategory | null,
): void {
  if (!isBrowser()) return;

  const activeId = getActiveAgentChatThreadId(storageKey);
  const now = new Date().toISOString();
  const trimmedMessages = messages.slice(-MAX_MESSAGES);

  if (activeId) {
    const existing = getAgentChatThread(storageKey, activeId);
    if (existing) {
      upsertAgentChatThread(storageKey, {
        ...existing,
        title: deriveThreadTitle(trimmedMessages),
        messages: trimmedMessages,
        sessionCategory: sessionCategory ?? existing.sessionCategory ?? null,
        updatedAt: now,
      });
      return;
    }
  }

  const thread: AgentChatThread = {
    id: crypto.randomUUID(),
    title: deriveThreadTitle(trimmedMessages),
    messages: trimmedMessages,
    sessionCategory: sessionCategory ?? null,
    createdAt: now,
    updatedAt: now,
  };

  upsertAgentChatThread(storageKey, thread);
  setActiveAgentChatThreadId(storageKey, thread.id);
}

export function clearAgentChatSession(storageKey: string): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`);
    window.localStorage.removeItem(`${THREADS_PREFIX}${storageKey}`);
    window.localStorage.removeItem(`${ACTIVE_PREFIX}${storageKey}`);
    window.localStorage.removeItem(`${PINNED_PREFIX}${storageKey}`);
  } catch {
    // ignore storage errors
  }
}

export function loadAgentChatThreads(storageKey: string): AgentChatThread[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(`${THREADS_PREFIX}${storageKey}`);
    if (!raw) return migrateLegacySession(storageKey);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return migrateLegacySession(storageKey);
    if (parsed.length === 0) return [];

    const threads = parsed
      .map(normalizeThread)
      .filter((thread): thread is AgentChatThread => thread !== null)
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      );

    return threads.length > 0 ? threads : migrateLegacySession(storageKey);
  } catch {
    return migrateLegacySession(storageKey);
  }
}

function saveAgentChatThreads(
  storageKey: string,
  threads: AgentChatThread[],
): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(
      `${THREADS_PREFIX}${storageKey}`,
      JSON.stringify(threads.slice(0, MAX_THREADS)),
    );
  } catch {
    // ignore quota errors
  }
}

export function getActiveAgentChatThreadId(
  storageKey: string,
): string | null {
  if (!isBrowser()) return null;

  try {
    return window.localStorage.getItem(`${ACTIVE_PREFIX}${storageKey}`);
  } catch {
    return null;
  }
}

export function setActiveAgentChatThreadId(
  storageKey: string,
  threadId: string,
): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(`${ACTIVE_PREFIX}${storageKey}`, threadId);
  } catch {
    // ignore storage errors
  }
}

export function getAgentChatThread(
  storageKey: string,
  threadId: string,
): AgentChatThread | null {
  return (
    loadAgentChatThreads(storageKey).find((thread) => thread.id === threadId) ??
    null
  );
}

export function upsertAgentChatThread(
  storageKey: string,
  thread: AgentChatThread,
): void {
  const threads = loadAgentChatThreads(storageKey);
  const index = threads.findIndex((entry) => entry.id === thread.id);

  if (index >= 0) {
    threads[index] = thread;
  } else {
    threads.unshift(thread);
  }

  threads.sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );

  saveAgentChatThreads(storageKey, threads);
}

export function createAgentChatThread(
  storageKey: string,
  sessionCategory?: AgentPromptCategory | null,
): AgentChatThread {
  const now = new Date().toISOString();
  const thread: AgentChatThread = {
    id: crypto.randomUUID(),
    title: "Percakapan baru",
    messages: [],
    sessionCategory: sessionCategory ?? null,
    createdAt: now,
    updatedAt: now,
  };

  upsertAgentChatThread(storageKey, thread);
  setActiveAgentChatThreadId(storageKey, thread.id);
  return thread;
}

export function getPinnedAgentChatThreadIds(storageKey: string): string[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(`${PINNED_PREFIX}${storageKey}`);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function togglePinnedAgentChatThread(
  storageKey: string,
  threadId: string,
): boolean {
  if (!isBrowser()) return false;

  const pinned = new Set(getPinnedAgentChatThreadIds(storageKey));
  const isPinned = pinned.has(threadId);

  if (isPinned) pinned.delete(threadId);
  else pinned.add(threadId);

  try {
    window.localStorage.setItem(
      `${PINNED_PREFIX}${storageKey}`,
      JSON.stringify([...pinned]),
    );
  } catch {
    // ignore storage errors
  }

  return !isPinned;
}

function removePinnedAgentChatThread(
  storageKey: string,
  threadId: string,
): void {
  if (!isBrowser()) return;

  const pinned = getPinnedAgentChatThreadIds(storageKey).filter(
    (id) => id !== threadId,
  );

  try {
    if (pinned.length === 0) {
      window.localStorage.removeItem(`${PINNED_PREFIX}${storageKey}`);
      return;
    }

    window.localStorage.setItem(
      `${PINNED_PREFIX}${storageKey}`,
      JSON.stringify(pinned),
    );
  } catch {
    // ignore storage errors
  }
}

function clearActiveAgentChatThreadId(storageKey: string): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(`${ACTIVE_PREFIX}${storageKey}`);
  } catch {
    // ignore storage errors
  }
}

export function deleteAgentChatThread(
  storageKey: string,
  threadId: string,
): string | null {
  if (!isBrowser()) return null;

  const threads = loadAgentChatThreads(storageKey).filter(
    (thread) => thread.id !== threadId,
  );
  saveAgentChatThreads(storageKey, threads);
  removePinnedAgentChatThread(storageKey, threadId);

  const activeId = getActiveAgentChatThreadId(storageKey);
  if (activeId !== threadId) return activeId;

  if (threads.length === 0) {
    clearActiveAgentChatThreadId(storageKey);
    return null;
  }

  const nextActiveId = threads[0]?.id ?? null;
  if (!nextActiveId) {
    clearActiveAgentChatThreadId(storageKey);
    return null;
  }

  setActiveAgentChatThreadId(storageKey, nextActiveId);
  return nextActiveId;
}

export function initializeAgentChatState(
  storageKey: string,
  defaultCategory?: AgentPromptCategory | null,
): {
  threadId: string;
  messages: AgentChatMessage[];
  sessionCategory: AgentPromptCategory | null;
} {
  const threads = loadAgentChatThreads(storageKey);
  const activeId = getActiveAgentChatThreadId(storageKey);
  let active = activeId
    ? threads.find((thread) => thread.id === activeId) ?? null
    : null;

  if (!active) {
    active =
      threads[0] ??
      createAgentChatThread(storageKey, defaultCategory ?? null);
    setActiveAgentChatThreadId(storageKey, active.id);
  }

  return {
    threadId: active.id,
    messages: [...active.messages],
    sessionCategory: active.sessionCategory ?? defaultCategory ?? null,
  };
}

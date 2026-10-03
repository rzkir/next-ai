import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgentPromptCategory } from "~/types/agent";
import type { AgentChatThread } from "~/types/storage";
import {
  createAgentChatThread,
  deleteAgentChatThread,
  getActiveAgentChatThreadId,
  getPinnedAgentChatThreadIds,
  initializeAgentChatState,
  loadAgentChatThreads,
  setActiveAgentChatThreadId,
  togglePinnedAgentChatThread,
} from "~/lib/agent/storage";
import {
  deriveThreadPreview,
  groupThreadsByPeriod,
} from "~/lib/agent/history";

export function useAgentHistory(
  storageKey: string,
  defaultCategory?: AgentPromptCategory | null,
) {
  const [threads, setThreads] = useState<AgentChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const list = loadAgentChatThreads(storageKey);
    setThreads(list);
    setActiveId(getActiveAgentChatThreadId(storageKey));
    setPinnedIds(getPinnedAgentChatThreadIds(storageKey));
  }, [storageKey]);

  useEffect(() => {
    initializeAgentChatState(storageKey, defaultCategory ?? null);
    refresh();
    setReady(true);
  }, [storageKey, defaultCategory, refresh]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((thread) => {
      const haystack = `${thread.title} ${deriveThreadPreview(thread.messages)}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [threads, search]);

  const grouped = useMemo(() => groupThreadsByPeriod(filtered), [filtered]);

  const selectThread = useCallback(
    (threadId: string) => {
      setActiveAgentChatThreadId(storageKey, threadId);
      setActiveId(threadId);
      refresh();
    },
    [storageKey, refresh],
  );

  const newThread = useCallback(() => {
    const thread = createAgentChatThread(storageKey, defaultCategory ?? null);
    setActiveId(thread.id);
    refresh();
    return thread;
  }, [storageKey, defaultCategory, refresh]);

  const removeThread = useCallback(
    (threadId: string) => {
      const next = deleteAgentChatThread(storageKey, threadId);
      setActiveId(next);
      refresh();
      return next;
    },
    [storageKey, refresh],
  );

  const togglePin = useCallback(
    (threadId: string) => {
      togglePinnedAgentChatThread(storageKey, threadId);
      refresh();
    },
    [storageKey, refresh],
  );

  return {
    ready,
    threads,
    filtered,
    grouped,
    activeId,
    pinnedIds,
    search,
    setSearch,
    refresh,
    selectThread,
    newThread,
    removeThread,
    togglePin,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AgentChatMessage,
  AgentPromptCategory,
  AgentWebPreview,
} from "~/types/agent";
import {
  buildPromptHistory,
  buildWebPreview,
  formatAgentTime,
  resolveCanvasPreviewFromMessages,
  sendAgentPrompt,
  shouldShowCanvas,
} from "~/lib/agent/prompt";
import {
  getAgentChatThread,
  getActiveAgentChatThreadId,
  initializeAgentChatState,
  saveAgentChatSession,
} from "~/lib/agent/storage";
import {
  clearAgentDraft,
  loadAgentDraft,
  saveAgentDraft,
  unlockNotificationAudio,
} from "~/lib/agent/settings";

export type UseAgentChatOptions = {
  category: AgentPromptCategory;
  storageKey: string;
  enableCanvas?: boolean;
  draftPath?: string;
};

export function useAgentChat({
  category,
  storageKey,
  enableCanvas = false,
  draftPath,
}: UseAgentChatOptions) {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [sessionCategory, setSessionCategory] =
    useState<AgentPromptCategory | null>(category);
  const [threadId, setThreadId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [canvasPreview, setCanvasPreview] = useState<AgentWebPreview | null>(
    null,
  );
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const syncCanvas = useCallback(
    (list: AgentChatMessage[], cat: AgentPromptCategory | null) => {
      if (!enableCanvas) {
        setCanvasPreview(null);
        return;
      }
      setCanvasPreview(resolveCanvasPreviewFromMessages(list, cat));
    },
    [enableCanvas],
  );

  const loadThread = useCallback(
    (id?: string | null) => {
      const state = initializeAgentChatState(storageKey, category);
      const activeId = id ?? state.threadId;
      const thread = getAgentChatThread(storageKey, activeId);
      const nextMessages = thread?.messages ?? state.messages;
      const nextCategory =
        thread?.sessionCategory ?? state.sessionCategory ?? category;
      setThreadId(activeId);
      setMessages(nextMessages);
      setSessionCategory(nextCategory);
      syncCanvas(nextMessages, nextCategory);
      return { threadId: activeId, messages: nextMessages };
    },
    [storageKey, category, syncCanvas],
  );

  useEffect(() => {
    loadThread(getActiveAgentChatThreadId(storageKey));
    if (draftPath) {
      const draft = loadAgentDraft(draftPath);
      if (draft) setPrompt(draft);
    }
    setReady(true);
  }, [storageKey, category, draftPath, loadThread]);

  useEffect(() => {
    if (!draftPath) return;
    if (!prompt.trim()) {
      clearAgentDraft(draftPath);
      return;
    }
    const timer = window.setTimeout(() => saveAgentDraft(draftPath, prompt), 600);
    return () => window.clearTimeout(timer);
  }, [prompt, draftPath]);

  const persist = useCallback(
    (list: AgentChatMessage[], cat: AgentPromptCategory | null) => {
      saveAgentChatSession(storageKey, list, cat);
    },
    [storageKey],
  );

  const applyPromptPreset = useCallback((value: string) => {
    setPrompt(value);
    setError(null);
    setSessionCategory(category);
  }, [category]);

  const submit = useCallback(
    async (overrideMessage?: string) => {
      const message = (overrideMessage ?? prompt).trim();
      if (!message || loading) return;

      unlockNotificationAudio();
      setError(null);
      setLoading(true);

      const userMessage: AgentChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        sentAt: new Date().toISOString(),
        category,
      };

      const nextMessages = [...messagesRef.current, userMessage];
      setMessages(nextMessages);
      setPrompt("");
      if (draftPath) clearAgentDraft(draftPath);
      persist(nextMessages, category);
      setSessionCategory(category);

      try {
        const response = await sendAgentPrompt({
          message,
          category,
          history: buildPromptHistory(messagesRef.current),
        });

        const assistantMessage: AgentChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.reply,
          sentAt: new Date().toISOString(),
          model: response.model,
          category: response.category,
        };

        const withReply = [...nextMessages, assistantMessage];
        setMessages(withReply);
        persist(withReply, category);

        if (
          enableCanvas &&
          shouldShowCanvas(message, category, response.reply)
        ) {
          setCanvasPreview(buildWebPreview(response.reply));
        } else {
          syncCanvas(withReply, category);
        }
      } catch (err) {
        const messageText =
          err instanceof Error ? err.message : "Gagal memproses prompt.";
        setError(messageText);
      } finally {
        setLoading(false);
      }
    },
    [prompt, loading, category, draftPath, persist, enableCanvas, syncCanvas],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCanvasPreview(null);
    persist([], category);
  }, [persist, category]);

  return {
    ready,
    messages,
    threadId,
    sessionCategory,
    prompt,
    setPrompt,
    loading,
    error,
    setError,
    canvasPreview,
    setCanvasPreview,
    applyPromptPreset,
    submit,
    loadThread,
    clearMessages,
    formatTime: formatAgentTime,
    isEmpty: messages.length === 0 && !loading,
  };
}

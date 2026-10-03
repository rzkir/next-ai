import { useEffect, useState } from "react";
import type { AgentPromptCategory } from "~/types/agent";
import type { AgentCategoryCard, AgentStudioCategoryKey } from "~/lib/agent/content";
import { getAgentStudio, type Locale } from "~/lib/i18n";
import { useAgentChat } from "~/hooks/useAgentChat";
import { useAgentHistory } from "~/hooks/useAgentHistory";
import { useAgentCanvas } from "~/hooks/useAgentCanvas";
import { AgentHeader } from "~/components/agent/AgentHeader";
import { HistoryPanel } from "~/components/agent/HistoryPanel";
import { ChatMessages } from "~/components/agent/ChatMessages";
import { PromptComposer } from "~/components/agent/PromptComposer";
import { CanvasPanel } from "~/components/agent/CanvasPanel";
import { resolveCanvasMetaFromMessages } from "~/lib/agent/prompt";

type Props = {
  categoryKey: AgentStudioCategoryKey;
  promptCategory: AgentPromptCategory;
  storageKey: string;
  enableCanvas: boolean;
  cards: AgentCategoryCard[];
  locale?: Locale;
  draftPath: string;
};

export function AgentShell({
  categoryKey,
  promptCategory,
  storageKey,
  enableCanvas,
  cards,
  locale = "id",
  draftPath,
}: Props) {
  const studio = getAgentStudio(locale);
  const page = studio.categories[categoryKey];
  const { common } = studio;

  const [historyOpen, setHistoryOpen] = useState(true);

  const history = useAgentHistory(storageKey, promptCategory);
  const chat = useAgentChat({
    category: promptCategory,
    storageKey,
    enableCanvas,
    draftPath,
  });
  const canvas = useAgentCanvas();

  useEffect(() => {
    canvas.showPreview(chat.canvasPreview);
    // only react to preview payload changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.canvasPreview]);

  useEffect(() => {
    if (!history.ready) return;
    chat.loadThread(history.activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.activeId, history.ready]);

  function handleNewChat() {
    const thread = history.newThread();
    chat.loadThread(thread.id);
  }

  function handleSelectThread(threadId: string) {
    history.selectThread(threadId);
    chat.loadThread(threadId);
  }

  function handleSaveDetails() {
    const meta = resolveCanvasMetaFromMessages(
      chat.messages,
      chat.sessionCategory ?? promptCategory,
    );
    if (!meta || !chat.canvasPreview) return null;
    const build = canvas.saveBuild({
      title: chat.canvasPreview.title,
      prompt: meta.prompt,
      category: meta.category,
      model: meta.model,
      threadId: chat.threadId,
    });
    return build?.id ?? null;
  }

  return (
    <main
      id="agent-main"
      className="relative flex min-w-0 flex-1 overflow-hidden md:flex-row"
    >
      <HistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        labels={{
          title: common.historyTitle,
          newChat: common.newChat,
          searchPlaceholder: common.searchPlaceholder,
          openLabel: common.openHistory,
          collapseLabel: common.collapseHistory,
          closeLabel: common.closeHistory,
          panelLabel: common.historyPanelLabel,
          emptyTitle: common.noHistory,
          emptyDescription: common.noHistoryDescription,
          emptySearchTitle: common.noSearchResults,
          emptySearchDescription: common.noSearchResultsDescription,
        }}
        grouped={history.grouped}
        activeId={history.activeId}
        pinnedIds={history.pinnedIds}
        search={history.search}
        onSearch={history.setSearch}
        onNewChat={handleNewChat}
        onSelect={handleSelectThread}
        onDelete={(id) => {
          const next = history.removeThread(id);
          chat.loadThread(next);
        }}
        onTogglePin={history.togglePin}
        hasThreads={history.threads.length > 0}
      />

      <div className="agent-chat-pane relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <AgentHeader
          title={page.header}
          showHistory
          openHistoryLabel={common.openConversationHistory}
          settingsLabel={common.settings}
          backHomeLabel={common.backHome}
          onToggleHistory={() => setHistoryOpen((v) => !v)}
        />

        <div className="agent-chat-body flex min-h-0 flex-1 flex-col">
          <ChatMessages
            messages={chat.messages}
            loading={chat.loading}
            isEmpty={chat.isEmpty}
            hero={page.hero}
            cards={cards}
            onSelectCard={(prompt, nextCategory) =>
              chat.applyPromptPreset(
                prompt,
                nextCategory as AgentPromptCategory | undefined,
              )
            }
            formatTime={chat.formatTime}
          />
        </div>

        <PromptComposer
          value={chat.prompt}
          onChange={chat.setPrompt}
          onSubmit={() => void chat.submit()}
          label={page.promptPlaceholder}
          disabled={chat.loading}
          error={chat.error}
          category={chat.sessionCategory ?? promptCategory}
        />
      </div>

      {enableCanvas ? (
        <CanvasPanel
          preview={canvas.preview}
          open={canvas.open}
          activeTab={canvas.activeTab}
          activeCodeFile={canvas.activeCodeFile}
          buildId={canvas.buildId}
          labels={{
            label: studio.canvas.label,
            webPreview: studio.canvas.webPreview,
            fullPreview: studio.canvas.fullPreview,
            live: studio.canvas.live,
            expand: studio.canvas.expand,
            refresh: studio.canvas.refresh,
            details: studio.canvas.details,
            previewTab: studio.canvas.previewTab,
            codeTab: studio.canvas.codeTab,
            copy: common.copy,
          }}
          onClose={canvas.close}
          onTabChange={canvas.setActiveTab}
          onCodeFileChange={canvas.setActiveCodeFile}
          onRefresh={() => canvas.showPreview(chat.canvasPreview)}
          onSaveDetails={handleSaveDetails}
        />
      ) : null}
    </main>
  );
}

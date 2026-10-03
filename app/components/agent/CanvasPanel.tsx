import { useEffect } from "react";
import { Copy, ExternalLink, RefreshCw, X } from "lucide-react";
import { Link } from "react-router";
import type { AgentWebPreview } from "~/types/agent";
import type { CanvasTab, CodeFileTab } from "~/hooks/useAgentCanvas";
import { cn } from "~/lib/utils";

type Labels = {
  label: string;
  webPreview: string;
  fullPreview: string;
  live: string;
  expand: string;
  refresh: string;
  details: string;
  previewTab: string;
  codeTab: string;
  copy: string;
};

type Props = {
  preview: AgentWebPreview | null;
  open: boolean;
  activeTab: CanvasTab;
  activeCodeFile: CodeFileTab;
  buildId: string | null;
  labels: Labels;
  onClose: () => void;
  onTabChange: (tab: CanvasTab) => void;
  onCodeFileChange: (file: CodeFileTab) => void;
  onRefresh: () => void;
  onSaveDetails: () => string | null;
};

export function CanvasPanel({
  preview,
  open,
  activeTab,
  activeCodeFile,
  buildId,
  labels,
  onClose,
  onTabChange,
  onCodeFileChange,
  onRefresh,
  onSaveDetails,
}: Props) {
  useEffect(() => {
    if (!preview || !open) return;
    document.documentElement.classList.add("agent-canvas-open");
    return () => {
      document.documentElement.classList.remove("agent-canvas-open");
    };
  }, [preview, open]);

  if (!preview || !open) return null;

  const files = preview.files;
  const codeValue =
    activeCodeFile === "html"
      ? files.html
      : activeCodeFile === "css"
        ? files.css
        : files.js;

  function handleCopy() {
    if (!preview) return;
    const text = activeTab === "code" ? codeValue : preview.source;
    void navigator.clipboard.writeText(text);
  }

  function handleDetails() {
    return onSaveDetails();
  }

  const detailsId = buildId ?? handleDetails();

  return (
    <aside
      id="agent-canvas"
      className="agent-canvas relative z-20 flex h-full w-full max-w-xl shrink-0 flex-col border-l border-border bg-background md:max-w-md lg:max-w-xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{labels.label}</p>
          <p className="truncate text-xs text-muted-foreground">
            {preview.title} · {labels.live}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
            aria-label={labels.refresh}
            onClick={onRefresh}
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
            aria-label={labels.copy}
            onClick={handleCopy}
          >
            <Copy className="size-3.5" />
          </button>
          {detailsId ? (
            <Link
              to={`/agent/builds/${detailsId}`}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
              aria-label={labels.details}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="size-3.5" />
            </Link>
          ) : null}
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Close canvas"
            onClick={onClose}
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border px-3 py-2">
        <button
          type="button"
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium",
            activeTab === "preview"
              ? "bg-muted text-foreground"
              : "text-muted-foreground",
          )}
          onClick={() => onTabChange("preview")}
        >
          {labels.previewTab}
        </button>
        <button
          type="button"
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium",
            activeTab === "code"
              ? "bg-muted text-foreground"
              : "text-muted-foreground",
          )}
          onClick={() => onTabChange("code")}
        >
          {labels.codeTab}
        </button>
      </div>

      {activeTab === "preview" ? (
        <iframe
          id="agent-canvas-frame"
          title={labels.webPreview}
          className="min-h-0 flex-1 border-0 bg-white"
          sandbox="allow-scripts allow-modals allow-forms allow-popups"
          srcDoc={preview.document}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex gap-1 border-b border-border px-3 py-2">
            {(["html", "css", "js"] as CodeFileTab[]).map((file) => {
              const content = files[file];
              if (!content.trim()) return null;
              return (
                <button
                  key={file}
                  type="button"
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] uppercase",
                    activeCodeFile === file
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => onCodeFileChange(file)}
                >
                  {file}
                </button>
              );
            })}
          </div>
          <pre className="agent-scrollbar min-h-0 flex-1 overflow-auto p-3 text-xs leading-relaxed">
            <code>{codeValue}</code>
          </pre>
        </div>
      )}
    </aside>
  );
}

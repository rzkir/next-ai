import { useCallback, useState } from "react";
import type {
  AgentPromptCategory,
  AgentWebPreview,
  AgentWebPreviewFiles,
} from "~/types/agent";
import { findOrSaveAgentWebBuild, getAgentWebBuild } from "~/lib/agent/builds";

export type CanvasTab = "preview" | "code";
export type CodeFileTab = keyof AgentWebPreviewFiles;

export function useAgentCanvas(initial?: AgentWebPreview | null) {
  const [preview, setPreview] = useState<AgentWebPreview | null>(
    initial ?? null,
  );
  const [open, setOpen] = useState(Boolean(initial));
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<CanvasTab>("preview");
  const [activeCodeFile, setActiveCodeFile] = useState<CodeFileTab>("html");
  const [buildId, setBuildId] = useState<string | null>(null);

  const showPreview = useCallback((next: AgentWebPreview | null) => {
    setPreview(next);
    setOpen(Boolean(next));
    setCollapsed(false);
    if (next) {
      setActiveTab("preview");
      const files = next.files;
      const first: CodeFileTab =
        files.html.trim()
          ? "html"
          : files.css.trim()
            ? "css"
            : files.js.trim()
              ? "js"
              : "html";
      setActiveCodeFile(first);
    }
  }, []);

  const saveBuild = useCallback(
    (input: {
      title: string;
      prompt: string;
      category: AgentPromptCategory;
      model?: string;
      threadId?: string | null;
    }) => {
      if (!preview) return null;
      const build = findOrSaveAgentWebBuild({
        title: input.title,
        prompt: input.prompt,
        category: input.category,
        model: input.model,
        preview,
        buildId,
        threadId: input.threadId,
      });
      setBuildId(build.id);
      return build;
    },
    [preview, buildId],
  );

  const loadBuild = useCallback((id: string) => {
    const build = getAgentWebBuild(id);
    if (!build) return null;
    setBuildId(build.id);
    showPreview(build.preview);
    return build;
  }, [showPreview]);

  return {
    preview,
    open,
    setOpen,
    collapsed,
    setCollapsed,
    activeTab,
    setActiveTab,
    activeCodeFile,
    setActiveCodeFile,
    buildId,
    showPreview,
    saveBuild,
    loadBuild,
    close: () => {
      setOpen(false);
      setPreview(null);
    },
  };
}

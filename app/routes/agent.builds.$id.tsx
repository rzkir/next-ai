import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getAgentWebBuild } from "~/lib/agent/builds";
import { getAgentBuild, DEFAULT_LOCALE } from "~/lib/i18n";

export function meta() {
  const build = getAgentBuild(DEFAULT_LOCALE);
  return [
    { title: `${build.previewTitle} — AI Studio` },
    { name: "description", content: build.previewDescription },
    { name: "robots", content: "noindex" },
  ];
}

export default function AgentBuildDetailPage() {
  const { id } = useParams();
  const [documentHtml, setDocumentHtml] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const labels = getAgentBuild(DEFAULT_LOCALE);

  useEffect(() => {
    if (!id) {
      setMissing(true);
      return;
    }
    const build = getAgentWebBuild(id);
    if (!build) {
      setMissing(true);
      return;
    }
    setDocumentHtml(build.preview.document);
  }, [id]);

  if (missing) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">Build not found.</p>
        <Link to="/agent" className="underline">
          Back to AI Studio
        </Link>
      </main>
    );
  }

  return (
    <main
      id="agent-build-detail"
      className="agent-build-full fixed inset-0 z-50 bg-white"
      style={{ colorScheme: "light" }}
    >
      <iframe
        id="agent-build-frame"
        className="block size-full border-0"
        title={labels.previewTitle}
        sandbox="allow-scripts allow-modals allow-forms allow-popups"
        srcDoc={documentHtml ?? undefined}
      />
    </main>
  );
}

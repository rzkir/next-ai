import { Link } from "react-router";
import { AgentHeader } from "~/components/agent/AgentHeader";
import { AgentSettingsView } from "~/components/agent/AgentSettingsView";
import { getAgentStudio, DEFAULT_LOCALE } from "~/lib/i18n";

export function meta() {
  return [
    { title: "Agent Settings" },
    { name: "robots", content: "noindex" },
  ];
}

export default function AgentSettingPage() {
  const studio = getAgentStudio(DEFAULT_LOCALE);

  return (
    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <AgentHeader
        title="Settings"
        showHistory={false}
        settingsLabel={studio.common.settings}
        backHomeLabel={studio.common.backHome}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AgentSettingsView />
        <div className="px-6 pb-10 md:px-12">
          <Link
            to="/agent"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Back to AI Studio
          </Link>
        </div>
      </div>
    </main>
  );
}

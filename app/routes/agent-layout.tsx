import { Outlet, useLoaderData } from "react-router";
import { AgentSidebar } from "~/components/agent/AgentSidebar";
import { ToastHost } from "~/components/agent/ToastHost";
import { getAgentSidebarItems } from "~/lib/agent/content";
import { getAgentStudio, DEFAULT_LOCALE } from "~/lib/i18n";

export function loader() {
  const locale = DEFAULT_LOCALE;
  const studio = getAgentStudio(locale);
  return {
    locale,
    items: getAgentSidebarItems(locale),
    labels: {
      openNavigation: studio.common.openNavigation,
      closeNavigation: studio.common.closeNavigation,
      agentNavigation: studio.common.agentNavigation,
    },
  };
}

export default function AgentLayout() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="agent-shell flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <AgentSidebar
        items={data.items}
        openNavigationLabel={data.labels.openNavigation}
        closeNavigationLabel={data.labels.closeNavigation}
        agentNavigationLabel={data.labels.agentNavigation}
      />
      <Outlet />
      <ToastHost />
    </div>
  );
}

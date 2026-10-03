import { useAgentSettings } from "~/hooks/useAgentSettings";
import {
  NOTIFICATION_SOUNDS,
  playNotificationSound,
  requestDesktopNotificationPermission,
  unlockNotificationAudio,
} from "~/lib/agent/settings";
import type { AgentSettingsKey, NotificationSoundId } from "~/types/settings";
import { toast } from "~/lib/notifications";
import { cn } from "~/lib/utils";

const preferenceToggles: Array<{
  key: AgentSettingsKey;
  label: string;
  description: string;
}> = [
  {
    key: "desktopNotifications",
    label: "Desktop Notifications",
    description: "Receive real-time alerts when agent replies complete.",
  },
  {
    key: "autoSaveDrafts",
    label: "Auto-save Drafts",
    description: "Automatically save prompt drafts while you type.",
  },
  {
    key: "betaFeatures",
    label: "Beta Features",
    description: "Early access to experimental Agent intelligence tools.",
  },
  {
    key: "agentResponses",
    label: "Agent Response Alerts",
    description: "Show toast and sound when a reply is ready.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly Digest",
    description: "Receive a weekly summary of agent activity.",
  },
  {
    key: "conciseResponses",
    label: "Concise Responses",
    description: "Ask the agent to prefer shorter, direct answers.",
  },
  {
    key: "rememberContext",
    label: "Remember Context",
    description: "Include recent conversation history in follow-up prompts.",
  },
];

export function AgentSettingsView() {
  const { settings, update } = useAgentSettings();

  async function handleToggle(key: AgentSettingsKey, checked: boolean) {
    unlockNotificationAudio();

    if (key === "desktopNotifications" && checked) {
      const permission = await requestDesktopNotificationPermission();
      if (permission !== "granted") {
        update("desktopNotifications", false);
        toast.info(
          "Desktop notifications blocked",
          "Allow notifications in your browser to enable alerts.",
        );
        return;
      }
      toast.success("Desktop notifications enabled");
    }

    update(key, checked as never);

    if (key === "weeklyDigest" && checked) {
      toast.info(
        "Weekly digest enabled",
        "You will receive a summary of agent activity each week.",
      );
    }
  }

  function handleSound(soundId: NotificationSoundId) {
    unlockNotificationAudio();
    update("notificationSound", soundId);
    if (soundId !== "off") playNotificationSound(soundId);
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-6 py-10 md:px-12">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Agent Settings</h1>
      <p className="mb-10 text-muted-foreground">
        Manage preferences, notifications, and personalization for AI Studio.
      </p>

      <section className="mb-10 space-y-4">
        <h2 className="text-xl font-medium">Preferences</h2>
        {preferenceToggles.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border px-4 py-4"
          >
            <span>
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {item.description}
              </span>
            </span>
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={Boolean(settings[item.key])}
              onChange={(event) =>
                void handleToggle(item.key, event.target.checked)
              }
            />
          </label>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Notification Sound</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {NOTIFICATION_SOUNDS.map((sound) => (
            <button
              key={sound.id}
              type="button"
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition-colors",
                settings.notificationSound === sound.id
                  ? "border-foreground bg-muted"
                  : "border-border hover:bg-muted/50",
              )}
              onClick={() => handleSound(sound.id)}
            >
              <span className="block text-sm font-medium">{sound.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

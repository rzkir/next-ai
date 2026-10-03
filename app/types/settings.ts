export type NotificationSoundId = "computer" | "iphone" | "off";

export interface AgentSettings {
  desktopNotifications: boolean;
  autoSaveDrafts: boolean;
  betaFeatures: boolean;
  agentResponses: boolean;
  weeklyDigest: boolean;
  conciseResponses: boolean;
  rememberContext: boolean;
  notificationSound: NotificationSoundId;
}

export type AgentSettingsKey = keyof AgentSettings;

export interface NotificationSoundOption {
  id: NotificationSoundId;
  label: string;
  src: string;
}

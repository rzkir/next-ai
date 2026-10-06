export type NotificationSoundId = "computer" | "iphone" | "off";

export type AgentModelId = "fast" | "balanced" | "reasoning";

export interface AgentSettings {
  desktopNotifications: boolean;
  autoSaveDrafts: boolean;
  betaFeatures: boolean;
  agentResponses: boolean;
  weeklyDigest: boolean;
  conciseResponses: boolean;
  rememberContext: boolean;
  notificationSound: NotificationSoundId;
  selectedModel: AgentModelId;
}

export type AgentSettingsKey = keyof AgentSettings;

export interface NotificationSoundOption {
  id: NotificationSoundId;
  label: string;
  src: string;
}

export interface AgentModelOption {
  id: AgentModelId;
  label: string;
  description: string;
}

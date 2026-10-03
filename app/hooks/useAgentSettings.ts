import { useCallback, useEffect, useState } from "react";
import type { AgentSettings, AgentSettingsKey } from "~/types/settings";
import {
  getAgentSettings,
  saveAgentSettings,
  SETTINGS_CHANGE_EVENT,
  updateAgentSetting,
  applyAgentSettings,
} from "~/lib/agent/settings";

export function useAgentSettings() {
  const [settings, setSettings] = useState<AgentSettings>(() =>
    getAgentSettings(),
  );

  useEffect(() => {
    applyAgentSettings(settings);
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ settings?: AgentSettings }>).detail;
      setSettings(detail?.settings ?? getAgentSettings());
    };
    window.addEventListener(SETTINGS_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, onChange);
  }, [settings]);

  const update = useCallback(
    <K extends AgentSettingsKey>(key: K, value: AgentSettings[K]) => {
      setSettings(updateAgentSetting(key, value));
    },
    [],
  );

  const save = useCallback((next: AgentSettings) => {
    saveAgentSettings(next);
    setSettings(next);
  }, []);

  return { settings, update, save };
}

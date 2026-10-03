import type {
  AgentPromptCategory,
  AgentWebBuild,
  AgentWebPreview,
} from "~/types/agent";

const STORAGE_KEY = "agent-web-builds";
const MAX_BUILDS = 30;

function readBuilds(): AgentWebBuild[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AgentWebBuild[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBuilds(builds: AgentWebBuild[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

type AgentWebBuildInput = {
  title: string;
  prompt: string;
  category: AgentPromptCategory;
  model?: string;
  preview: AgentWebPreview;
  threadId?: string | null;
};

export function saveAgentWebBuild(input: AgentWebBuildInput): AgentWebBuild {
  const build: AgentWebBuild = {
    id: crypto.randomUUID(),
    threadId: input.threadId ?? undefined,
    title: input.title,
    prompt: input.prompt,
    category: input.category,
    model: input.model,
    createdAt: new Date().toISOString(),
    preview: input.preview,
  };

  const builds = readBuilds().filter((item) => item.id !== build.id);
  builds.unshift(build);
  writeBuilds(builds.slice(0, MAX_BUILDS));

  return build;
}

export function updateAgentWebBuild(
  id: string,
  input: AgentWebBuildInput,
): AgentWebBuild | null {
  const builds = readBuilds();
  const index = builds.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const updated: AgentWebBuild = {
    ...builds[index],
    threadId: input.threadId ?? builds[index].threadId,
    title: input.title,
    prompt: input.prompt,
    category: input.category,
    model: input.model,
    preview: input.preview,
  };

  builds.splice(index, 1);
  builds.unshift(updated);
  writeBuilds(builds.slice(0, MAX_BUILDS));

  return updated;
}

export function findOrSaveAgentWebBuild(input: {
  title: string;
  prompt: string;
  category: AgentPromptCategory;
  model?: string;
  preview: AgentWebPreview;
  buildId?: string | null;
  threadId?: string | null;
}): AgentWebBuild {
  const builds = readBuilds();

  if (input.buildId) {
    const updated = updateAgentWebBuild(input.buildId, input);
    if (updated) return updated;
  }

  if (input.threadId) {
    const byThread = builds.find((item) => item.threadId === input.threadId);
    if (byThread) {
      const updated = updateAgentWebBuild(byThread.id, input);
      if (updated) return updated;
    }
  }

  const existing = builds.find(
    (item) =>
      item.preview.document === input.preview.document &&
      item.prompt === input.prompt &&
      item.category === input.category,
  );

  if (existing) return existing;

  return saveAgentWebBuild(input);
}

export function getAgentWebBuild(id: string): AgentWebBuild | null {
  return readBuilds().find((build) => build.id === id) ?? null;
}

export function listAgentWebBuilds(): AgentWebBuild[] {
  return readBuilds();
}

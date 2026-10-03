import type {
  AgentApiError,
  AgentPromptRequest,
  AgentPromptResponse,
} from "~/types/agent";

export const AGENT_PROMPT_PROXY = "/api/agent/prompt";
export const PROMPT_PATH = "/api/v1/prompt";

async function parseAgentError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as AgentApiError;
    if (body.error) return body.error;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

export async function createAgentPromptClient(
  payload: AgentPromptRequest,
): Promise<AgentPromptResponse> {
  const response = await fetch(AGENT_PROMPT_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await parseAgentError(response, "Gagal memproses prompt. Coba lagi."),
    );
  }

  return (await response.json()) as AgentPromptResponse;
}

import type { AgentChatMessage, AgentPromptCategory } from "./agent";

export interface AgentChatSession {
  messages: AgentChatMessage[];
  sessionCategory?: AgentPromptCategory | null;
  updatedAt: string;
}

export interface AgentChatThread {
  id: string;
  title: string;
  messages: AgentChatMessage[];
  sessionCategory?: AgentPromptCategory | null;
  createdAt: string;
  updatedAt: string;
}

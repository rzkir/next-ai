export type AgentPromptCategory =
  | "programming"
  | "technology"
  | "seo"
  | "marketing"
  | "customers_services"
  | "science"
  | "translation"
  | "legal"
  | "finance"
  | "health"
  | "trivia"
  | "academia"
  | "roleplay";

export type AgentHistoryRole = "user" | "assistant";

export interface AgentHistoryItem {
  role: AgentHistoryRole;
  content: string;
}

export interface AgentPromptRequest {
  message: string;
  category: AgentPromptCategory;
  user_id?: string;
  history?: AgentHistoryItem[];
  model?: string;
}

export interface AgentPromptResponse {
  reply: string;
  model: string;
  category: AgentPromptCategory;
}

export interface AgentApiError {
  error: string;
}

export interface AgentChatMessage {
  id: string;
  role: AgentHistoryRole;
  content: string;
  sentAt: string;
  model?: string;
  category?: AgentPromptCategory;
}

export interface AgentCodeBlock {
  language: string;
  code: string;
}

export interface AgentWebPreviewFiles {
  html: string;
  css: string;
  js: string;
}

export interface AgentWebPreview {
  title: string;
  language: string;
  source: string;
  document: string;
  files: AgentWebPreviewFiles;
}

export interface AgentWebBuild {
  id: string;
  threadId?: string;
  title: string;
  prompt: string;
  category: AgentPromptCategory;
  model?: string;
  createdAt: string;
  preview: AgentWebPreview;
}

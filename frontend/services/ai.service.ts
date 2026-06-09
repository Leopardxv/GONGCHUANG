import { api } from "./api";
import type { CommandAnalysis } from "@/types/ai";

interface AnalyzeParams {
  command: string;
  stdout?: string;
  stderr?: string;
  exit_code?: number | null;
  cwd?: string;
  context?: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatParams {
  message: string;
  history?: ChatMessage[];
}

interface ChatResult {
  reply: string;
}

export const aiService = {
  analyzeCommand: (params: AnalyzeParams) =>
    api.post<CommandAnalysis>("/ai/analyze-command", params),

  chat: (params: ChatParams) =>
    api.post<ChatResult>("/ai/chat", params),
};

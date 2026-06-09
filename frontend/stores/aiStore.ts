import { create } from "zustand";
import type { CommandAnalysis } from "@/types/ai";

export interface HistoryItem {
  id: string;
  command: string;
  status: "normal" | "warning" | "error" | "loading";
  time: string;
  analysis: CommandAnalysis | null;
}

interface AIState {
  history: HistoryItem[];
  addLoading: (command: string) => string;
  setResult: (id: string, analysis: CommandAnalysis) => void;
  clearHistory: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  history: [],

  addLoading: (command: string) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    set((s) => ({
      history: [
        ...s.history,
        { id, command, status: "loading" as const, time, analysis: null },
      ],
    }));
    return id;
  },

  setResult: (id: string, analysis: CommandAnalysis) => {
    set((s) => ({
      history: s.history.map((item) =>
        item.id === id
          ? {
              ...item,
              status: analysis.error_reason ? "error" as const : "normal" as const,
              analysis,
            }
          : item
      ),
    }));
  },

  clearHistory: () => set({ history: [] }),
}));

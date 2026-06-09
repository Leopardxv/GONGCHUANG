import { create } from "zustand";
import type { ConnectionStatus } from "@/types/terminal";

interface TerminalState {
  status: ConnectionStatus;
  sessionId: string | null;
  containerId: string | null;
  setStatus: (status: ConnectionStatus) => void;
  setSession: (sessionId: string, containerId: string) => void;
  reset: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  status: "disconnected",
  sessionId: null,
  containerId: null,
  setStatus: (status) => set({ status }),
  setSession: (sessionId, containerId) =>
    set({ sessionId, containerId, status: "connected" }),
  reset: () =>
    set({ status: "disconnected", sessionId: null, containerId: null }),
}));

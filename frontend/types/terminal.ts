export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface TerminalSession {
  containerId: string;
  status: ConnectionStatus;
  sessionId: string | null;
}

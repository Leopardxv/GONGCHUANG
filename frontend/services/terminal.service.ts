import { apiURL } from "@/config/api.config";

export function createTerminalWS(): WebSocket {
  return new WebSocket(apiURL("/terminal/connect").replace("http", "ws"));
}

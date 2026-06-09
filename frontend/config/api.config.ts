export const apiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  wsBaseURL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000",
  prefix: "/api/v1",
} as const;

export function apiURL(path: string): string {
  return `${apiConfig.baseURL}${apiConfig.prefix}${path}`;
}

export function wsURL(path: string): string {
  return `${apiConfig.wsBaseURL}${apiConfig.prefix}${path}`;
}

import { api } from "./api";
import type { User, UserStats } from "@/types/user";

interface RegisterParams {
  username: string;
  password: string;
  role?: "student" | "teacher";
}

export const authService = {
  register: (params: RegisterParams) => api.post<User>("/auth/register", params),
  login: (params: { username: string; password: string }) =>
    api.post<User>("/auth/login", params),
  logout: () => api.post<void>("/auth/logout"),
  getMe: () => api.get<User>("/auth/me"),
  getStats: () => api.get<UserStats>("/auth/stats"),
  updateProgress: (page: number) => api.post<{ status: string }>("/auth/progress", { page }),
};

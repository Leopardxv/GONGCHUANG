"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";

let initialized = false;

export function useAuth() {
  const { isAuthenticated, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    if (initialized || isAuthenticated) return;
    initialized = true;

    (async () => {
      try {
        const user = await authService.getMe();
        setUser(user);
      } catch {
        setUser(null);
      }
    })();
  }, [isAuthenticated, setUser]);

  return { isLoading };
}

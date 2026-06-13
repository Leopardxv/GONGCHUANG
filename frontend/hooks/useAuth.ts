"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";

export function useAuth() {
  const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const user = await authService.getMe();
        if (!cancelled) setUser(user);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setLoading, setUser]);

  return { isLoading };
}

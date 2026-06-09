"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { authService } from "@/services/auth.service";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#30363d] border-t-[#58a6ff]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  async function handleLogout() {
    await authService.logout();
    setUser(null);
    router.push("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0d1117]">
      <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-[#21262d] bg-[#161b22] px-5">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="font-semibold text-[#c9d1d9] hover:text-[#58a6ff] transition-colors">LLS</Link>
          <span className="text-[#484f58]">/</span>
          <Link href="/playground" className="text-[#c9d1d9] hover:text-[#58a6ff] transition-colors">Playground</Link>
          <span className="text-[#484f58]">/</span>
          <span className="text-[#8b949e]">openEuler Lab</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[#30363d] bg-[#21262d] px-3 py-1 text-xs text-[#c9d1d9]">
            {user?.username} · {user?.role === "teacher" ? "Teacher" : "Student"}
          </span>
          <button onClick={handleLogout} className="text-xs text-[#8b949e] transition-colors hover:text-[#f85149]">
            Sign out
          </button>
        </div>
      </header>

      {children}
    </div>
  );
}

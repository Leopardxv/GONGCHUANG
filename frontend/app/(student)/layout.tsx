"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import ICTLogo from "@/components/ICTLogo";
import { useExerciseStore } from "@/stores/exerciseStore";
import { getSnippetById } from "@/data/textbook-snippets";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const activeExercise = useExerciseStore((state) => state.activeExercise);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1e1e1e]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#30363d] border-t-[#f0aaa4]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  async function handleLogout() {
    await authService.logout();
    setUser(null);
    router.push("/");
  }

  const handleNavigateToTextbook = () => {
    if (activeExercise) {
      router.push(`/textbook?page=${activeExercise.textbookPage}`);
      return;
    }
    
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const snippetId = params.get("snippet");
      if (snippetId) {
        const snip = getSnippetById(snippetId);
        if (snip) {
          router.push(`/textbook?page=${snip.page}`);
          return;
        }
      }
    }
    
    router.push("/textbook");
  };

  return (
      <div className="flex min-h-screen flex-col bg-[#1e1e1e]" style={{ colorScheme: "dark" }}>
      <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-[#2d2d2d] bg-[#181818] px-5">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-2 font-semibold text-[#c9d1d9] transition-colors hover:text-[#f0aaa4]">
            <ICTLogo size="sm" />
            <span>ICT数字化教学平台</span>
          </Link>
          <span className="text-[#5f5f5f]">/</span>
          <Link href="/playground" className="text-[#c9d1d9] transition-colors hover:text-[#f0aaa4]">Playground</Link>
          <span className="text-[#5f5f5f]">/</span>
          <span className="text-[#8b949e]">openEuler Lab</span>
        </div>

        <div className="flex items-center gap-3">
          {pathname?.startsWith("/playground") && (
            <button
              onClick={handleNavigateToTextbook}
              className="rounded-full border border-[#c7342f] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[#c7342f] transition-all hover:bg-[#c7342f] hover:text-white"
            >
              数字教材
            </button>
          )}
          <span className="rounded-full border border-[#3c3c3c] bg-[#252526] px-3 py-1 text-xs text-[#c9d1d9]">
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


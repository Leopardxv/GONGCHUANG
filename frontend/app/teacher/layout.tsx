"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import TeacherSidebar from "./_components/Sidebar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isLoading && user && user.role !== "teacher") {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2D2D2D] border-t-[#00FF66]" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "teacher") return null;

  async function handleLogout() {
    await authService.logout();
    setUser(null);
    router.push("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#121212]">
      <TeacherSidebar
        username={user.username}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

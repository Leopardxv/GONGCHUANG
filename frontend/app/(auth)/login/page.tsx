"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { useEffect, useRef, useState } from "react";

export default function LoginPage() {
  const { isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Already logged in → straight to home
  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await authService.login({ username, password });
      if (mounted.current) {
        setUser(user);
        router.replace("/");
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Login failed";
      if (mounted.current) setError(msg);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes uestc-breathe {
          0%, 100% { text-shadow: 0 0 0 transparent; }
          50% { text-shadow: 0 0 10px rgba(0, 255, 102, 0.25); }
        }
      `}</style>

      <div className="fixed inset-0 flex items-center justify-center bg-[#0B0B0B]">
        {/* ── Top-left: UESTC ── */}
        <div
          className="fixed top-8 left-8 select-none"
          style={{ animation: "uestc-breathe 3.5s ease-in-out infinite" }}
        >
          <span className="font-mono text-2xl font-bold tracking-[0.15em] text-[#E6E6E6]">
            UESTC
          </span>
        </div>

        {/* ── Bottom-left: platform name ── */}
        <span className="fixed bottom-6 left-8 text-sm text-[#757575] select-none">
          在线Linux学习平台
        </span>

        {/* ── Center ── */}
        <div className="flex flex-col items-center gap-8">
          {/* Badge + heading */}
          <div className="flex flex-col items-center gap-5">
            <img src="/badge.webp" alt="UESTC" className="h-24 w-24 rounded-full object-contain opacity-90" />
            <h1 className="text-2xl font-light tracking-[0.3em] text-[#E6E6E6]">
              Login
            </h1>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex w-[360px] flex-col gap-5 border border-white/[0.12] bg-[#0B0B0B] p-8"
          >
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <input
                className="w-full border-b border-white/[0.12] bg-transparent px-1 py-2 text-[#E6E6E6] outline-none placeholder:text-[#757575]"
                style={{ caretColor: "#00FF66" }}
                placeholder="请输入用户名/学号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="flex items-center border-b border-white/[0.12]">
              <input
                className="flex-1 bg-transparent px-1 py-2 text-[#E6E6E6] outline-none placeholder:text-[#757575]"
                style={{ caretColor: "#00FF66" }}
                type={showPassword ? "text" : "password"}
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="p-1 text-[#757575] transition-colors hover:text-[#E6E6E6]"
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="border border-white/[0.08] px-3 py-2 text-sm text-[#757575]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 border border-[#00FF66] py-2.5 font-mono text-sm tracking-[0.15em] text-[#00FF66] transition-colors hover:bg-[#00FF66] hover:text-[#0B0B0B] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#00FF66]"
            >
              {loading ? "Logging in..." : "登录"}
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-[#757575]">
              没有账号？{" "}
              <Link
                href="/register"
                className="text-[#E6E6E6] transition-colors hover:underline"
              >
                注册
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

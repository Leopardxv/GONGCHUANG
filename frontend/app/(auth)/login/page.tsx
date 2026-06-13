"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { useEffect, useRef, useState } from "react";
import AuthScene from "@/components/AuthScene";
import ICTLogo from "@/components/ICTLogo";

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
          50% { text-shadow: 0 0 10px color-mix(in srgb, var(--color-accent) 25%, transparent); }
        }
      `}</style>

      <AuthScene>
        {/* ── Top-left: ICT ── */}
        <div
          className="fixed left-8 top-8 z-20 select-none"
          style={{ animation: "uestc-breathe 3.5s ease-in-out infinite" }}
        >
          <span className="font-mono text-2xl font-bold tracking-[0.15em] text-[var(--color-text)]">
            ICT
          </span>
        </div>

        {/* ── Bottom-left: platform name ── */}
        <span className="fixed bottom-6 left-8 z-20 text-sm text-[var(--color-muted)] select-none">
          ICT数字化教学平台
        </span>

        {/* ── Center ── */}
        <div className="flex flex-col items-center gap-8">
          {/* Badge + heading */}
          <div className="flex flex-col items-center gap-5">
            <ICTLogo size="lg" />
            <h1 className="text-2xl font-light tracking-[0.3em] text-[var(--color-text)]">
              Login
            </h1>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex w-[380px] flex-col gap-5 rounded-[28px] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_78%,transparent)] p-8 shadow-[0_28px_90px_color-mix(in_srgb,var(--color-shadow)_32%,transparent)] backdrop-blur-2xl"
          >
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <input
                className="w-full border-b border-[var(--color-border)] bg-transparent px-1 py-2 text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                style={{ caretColor: "var(--color-tint)" }}
                placeholder="请输入用户名/学号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="flex items-center border-b border-[var(--color-border)]">
              <input
                className="flex-1 bg-transparent px-1 py-2 text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                style={{ caretColor: "var(--color-tint)" }}
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
                className="p-1 text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
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
              <div className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-full border border-[var(--color-tint-border)] bg-[var(--color-tint)] py-2.5 font-mono text-sm tracking-[0.15em] text-white shadow-[0_12px_36px_var(--color-tint-soft)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? "Logging in..." : "登录"}
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-[var(--color-muted)]">
              没有账号？{" "}
              <Link
                href="/register"
                className="text-[var(--color-tint-strong)] transition-colors hover:underline"
              >
                注册
              </Link>
            </p>
          </form>
        </div>
      </AuthScene>
    </>
  );
}

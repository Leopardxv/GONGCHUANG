"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "dark" | "light";

const STORAGE_KEY = "lls-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const pathname = usePathname();
  const hideToggle = pathname?.startsWith("/playground");

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  return (
    <>
      {children}
      {!hideToggle && (
        <button
          type="button"
          onClick={toggleTheme}
          className="fixed right-5 top-[76px] z-[100] rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] shadow-lg backdrop-blur transition-colors hover:bg-[var(--color-hover)]"
          aria-label="切换深浅色模式"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      )}
    </>
  );
}

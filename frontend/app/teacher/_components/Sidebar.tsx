"use client";

import { useState } from "react";
import Link from "next/link";
import ICTLogo from "@/components/ICTLogo";

function DashboardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="15" width="7" height="6" rx="1.5" />
    </svg>
  );
}

function StudentsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

const navItems = [
  { id: "dashboard", label: "班级学情总览", icon: <DashboardIcon /> },
  { id: "students", label: "学生进度监控", icon: <StudentsIcon /> },
  { id: "tasks", label: "任务与作业发布", icon: <TasksIcon /> },
];

interface Props {
  username: string;
  onLogout: () => void;
}

export default function TeacherSidebar({ username, onLogout }: Props) {
  const [active, setActive] = useState("dashboard");

  function handleNav(id: string) {
    setActive(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("teacher-nav", { detail: id }));
    }
  }

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)]">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4 transition-colors hover:bg-[var(--color-panel-strong)]"
      >
        <ICTLogo size="sm" />
        <span className="text-base font-bold text-[var(--color-text)]">教师控制台</span>
        <svg
          className="ml-auto shrink-0 text-[var(--color-muted)]"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`relative flex w-full items-center gap-3 px-5 py-3 text-sm transition-none ${
                isActive
                  ? "bg-[var(--color-panel-strong)] text-[var(--color-text)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-panel-strong)] hover:text-[var(--color-text)]"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-[var(--color-accent)]" />
              )}
              <span className="text-[var(--color-muted)]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Back to main */}
      <div className="border-t border-[var(--color-border)] px-5 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-xs">返回学习平台</span>
        </Link>
      </div>

      {/* Profile */}
      <div className="flex items-center justify-between border-t border-[var(--color-border)] px-5 py-3.5">
        <span className="text-sm text-[var(--color-text)]">{username}</span>
        <button
          onClick={onLogout}
          className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
          title="退出"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

export { navItems };

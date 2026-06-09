"use client";

import { useState } from "react";
import Link from "next/link";

const navItems = [
  { id: "dashboard", label: "班级学情总览", icon: "📊" },
  { id: "students", label: "学生进度监控", icon: "👥" },
  { id: "tasks", label: "任务与作业发布", icon: "🎯" },
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
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-[#2D2D2D] bg-[#121212]">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-3 border-b border-[#2D2D2D] px-5 py-4 transition-colors hover:bg-[#1A1A1A]"
      >
        <img
          src="/badge.webp"
          alt="UESTC"
          className="h-7 w-7 shrink-0 rounded-full object-contain opacity-90"
        />
        <span className="text-base font-bold text-[#FFFFFF]">教师控制台</span>
        <svg
          className="ml-auto shrink-0 text-[#8E918F]"
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
                  ? "bg-[#1A1A1A] text-[#FFFFFF]"
                  : "text-[#8E918F] hover:bg-[#1A1A1A] hover:text-[#FFFFFF]"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-[#00FF66]" />
              )}
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Back to main */}
      <div className="border-t border-[#2D2D2D] px-5 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#8E918F] transition-colors hover:text-[#00FF66]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-xs">返回学习平台</span>
        </Link>
      </div>

      {/* Profile */}
      <div className="flex items-center justify-between border-t border-[#2D2D2D] px-5 py-3.5">
        <span className="text-sm text-[#FFFFFF]">{username}</span>
        <button
          onClick={onLogout}
          className="text-[#8E918F] transition-colors hover:text-[#00FF66]"
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

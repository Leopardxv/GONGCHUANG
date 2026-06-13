"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { aiService, type ChatMessage } from "@/services/ai.service";
import { useChatStore } from "@/stores/chatStore";
import type { UserStats } from "@/types/user";
import { textbookExercises } from "@/data/exercises";
import AuthScene from "@/components/AuthScene";
import ICTLogo from "@/components/ICTLogo";
import { taskService, type Task } from "@/services/task.service";

/* ── Mini ICT badge for sidebar ── */
function MiniBadge() {
  return <ICTLogo size="sm" />;
}

/* ── Nav item icons ── */
const iconTextbook = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const iconPlayground = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const iconChat = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const iconPlus = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "00:00:00";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

/* ── Typewriter ── */
function useTypewriter(text: string, speed = 100, start = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const chars = [...text];
    const timer = setInterval(() => {
      setDisplayed(chars.slice(0, i + 1).join(""));
      i++;
      if (i >= chars.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, start]);

  return { displayed, done };
}

/* ── Send arrow icon ── */
function SendArrow({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-colors ${active ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"}`}
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

/* ── Sidebar ── */
function Sidebar({
  collapsed,
  onToggle,
  activeNav,
  onNavChange,
  username,
  role,
}: {
  collapsed: boolean;
  onToggle: () => void;
  activeNav: string;
  onNavChange: (nav: string) => void;
  username: string;
  role: string;
}) {
  const {
    conversations,
    activeConversationId,
    newConversation,
    setActiveConversation,
    deleteConversation,
  } = useChatStore();

  const [chatExpanded, setChatExpanded] = useState(true);
  const [showPopover, setShowPopover] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    authService.getStats().then(setStats).catch((err) => {
      console.error("[Stats] fetch failed:", err);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopover]);

  const handleNewConversation = useCallback(() => {
    newConversation();
    onNavChange("chat");
  }, [newConversation, onNavChange]);

  function formatTime(ts: number) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  return (
    <aside
      className={`relative flex flex-col border-r border-[var(--color-border)] bg-[var(--color-panel-soft)] shadow-[8px_0_30px_color-mix(in_srgb,var(--color-shadow)_16%,transparent)] transition-all duration-200 ${
        collapsed ? "w-14" : "w-[260px]"
      }`}
    >
      <div
        className={`flex items-center border-b border-[var(--color-border)] px-3 py-3.5 ${
          collapsed ? "justify-center" : "gap-2.5"
        }`}
      >
        <button
          onClick={onToggle}
          className="shrink-0 text-lg leading-none text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          ☰
        </button>
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2">
            <MiniBadge />
            <span className="truncate text-sm font-medium text-[var(--color-text)]">
              ICT数字化教学平台
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <Link
          href="/textbook"
          className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
            collapsed ? "justify-center px-0" : ""
          } text-[var(--color-muted)] hover:text-[var(--color-text)]`}
          title="数字教材"
        >
          <span className="shrink-0">{iconTextbook}</span>
          {!collapsed && <span>数字教材</span>}
        </Link>

        <Link
          href="/playground"
          onClick={() => onNavChange("playground")}
          className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
            collapsed ? "justify-center px-0" : ""
          } ${
            activeNav === "playground"
              ? "text-[var(--color-text)]"
              : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
          }`}
          title="Playground"
        >
          <span className="shrink-0">{iconPlayground}</span>
          {!collapsed && <span>Playground</span>}
        </Link>

        {/* Teacher console — only visible to teachers */}
        {role === "teacher" && (
          <Link
            href="/teacher"
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
              collapsed ? "justify-center px-0" : ""
            } text-[var(--color-muted)] hover:text-[var(--color-text)]`}
            title="教师控制台"
          >
            <span className="shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            {!collapsed && <span>教师控制台</span>}
          </Link>
        )}

        {/* 聊天历史 */}
        <div>
          <div
            onClick={() => {
              if (collapsed) {
                onNavChange("chat");
              } else {
                setChatExpanded((v) => !v);
              }
            }}
            className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
              collapsed ? "justify-center px-0" : ""
            } ${
              activeNav === "chat" && !chatExpanded
                ? "text-[var(--color-text)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <span className="shrink-0">{iconChat}</span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">聊天历史</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNewConversation();
                  }}
                  className="shrink-0 rounded p-0.5 text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
                  title="新对话"
                >
                  {iconPlus}
                </button>
              </>
            )}
          </div>

          {!collapsed && chatExpanded && (
            <div className="ml-9 border-l border-[var(--color-border)] py-1">
              {conversations.length === 0 ? (
                <p className="px-3 py-3 text-xs text-[var(--color-muted)]">
                  暂无对话，点击 + 开始
                </p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="relative"
                    onMouseEnter={() => setHoveredConv(conv.id)}
                    onMouseLeave={() => setHoveredConv(null)}
                  >
                    <button
                      onClick={() => {
                        setActiveConversation(conv.id);
                        onNavChange("chat");
                      }}
                      className="flex w-full items-center gap-2 py-1.5 pl-3 pr-6 text-left text-xs transition-colors"
                    >
                      <span
                        className={`block h-2 w-2 shrink-0 transition-colors ${
                          activeConversationId === conv.id
                            ? "bg-[var(--color-accent)]"
                            : "bg-transparent border border-[var(--color-border)]"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate ${
                            activeConversationId === conv.id
                              ? "text-[var(--color-text)]"
                              : "text-[var(--color-muted)]"
                          }`}
                        >
                          {conv.title}
                        </span>
                        <span className="text-[10px] text-[var(--color-subtle)]">
                          {formatTime(conv.createdAt)}
                        </span>
                      </span>
                    </button>

                    {hoveredConv === conv.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-subtle)] transition-colors hover:text-[var(--color-danger)]"
                        title="删除对话"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="relative border-t border-[var(--color-border)]">
        <button
          onClick={() => setShowPopover((v) => !v)}
          className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[var(--color-hover)] ${
            collapsed ? "justify-center" : ""
          }`}
          title={username}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-panel-strong)] text-xs font-medium text-[var(--color-text)]">
            {username.charAt(0).toUpperCase()}
          </span>
          {!collapsed && (
            <span className="truncate text-sm text-[var(--color-text)]">{username}</span>
          )}
        </button>

        {showPopover && (
          <div
            ref={popoverRef}
            className="absolute bottom-full left-3 mb-2 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[0_18px_50px_color-mix(in_srgb,var(--color-shadow)_32%,transparent)]"
            style={{ zIndex: 50 }}
          >
            <p className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-text)]">
              学习数据
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">今日学习时长</span>
                <span className="font-mono text-[var(--color-text)]">
                  {stats ? formatDuration(stats.today_duration_minutes) : "..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">今日执行命令</span>
                <span className="font-mono text-[var(--color-text)]">
                  {stats !== null ? stats.today_commands : "..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">AI 分析次数</span>
                <span className="font-mono text-[var(--color-text)]">
                  {stats !== null ? stats.total_analyses : "..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">教材阅读进度</span>
                <span className="font-mono text-[var(--color-text)]">
                  {stats !== null ? `${stats.textbook_progress}%` : "..."}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Lightweight Markdown renderer for assistant replies ── */
function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="rounded border border-[var(--color-border)] bg-[var(--color-code-bg)] px-1.5 py-0.5 font-mono text-[0.92em] text-[var(--color-text)]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-[var(--color-text)]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  const blocks = content.split(/(```[\s\S]*?```)/g).filter((block) => block.length > 0);

  return (
    <div className="space-y-3 text-sm leading-6">
      {blocks.map((block, blockIndex) => {
        if (block.startsWith("```")) {
          const code = block.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/```$/, "");
          return (
            <pre
              key={blockIndex}
              className="max-w-full overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-code-bg)] p-3"
            >
              <code className="font-mono text-xs leading-5 text-[var(--color-text)]">
                {code.trimEnd()}
              </code>
            </pre>
          );
        }

        const lines = block.split(/\n+/).filter((line) => line.trim().length > 0);
        const elements: ReactNode[] = [];
        let listItems: string[] = [];

        function flushList(key: string) {
          if (listItems.length === 0) return;
          elements.push(
            <ul key={key} className="space-y-1 pl-5 text-[var(--color-text)]">
              {listItems.map((item, index) => (
                <li key={index} className="list-disc marker:text-[var(--color-muted)]">
                  <InlineMarkdown text={item} />
                </li>
              ))}
            </ul>,
          );
          listItems = [];
        }

        lines.forEach((line, lineIndex) => {
          const trimmed = line.trim();
          const listMatch = trimmed.match(/^[-*]\s+(.+)$/);

          if (listMatch) {
            listItems.push(listMatch[1]);
            return;
          }

          flushList(`${blockIndex}-list-${lineIndex}`);

          if (trimmed.startsWith("### ")) {
            elements.push(
              <h3 key={`${blockIndex}-${lineIndex}`} className="pt-1 text-base font-semibold text-[var(--color-text)]">
                <InlineMarkdown text={trimmed.slice(4)} />
              </h3>,
            );
          } else if (trimmed.startsWith("## ")) {
            elements.push(
              <h2 key={`${blockIndex}-${lineIndex}`} className="pt-1 text-lg font-semibold text-[var(--color-text)]">
                <InlineMarkdown text={trimmed.slice(3)} />
              </h2>,
            );
          } else if (trimmed.startsWith("# ")) {
            elements.push(
              <h1 key={`${blockIndex}-${lineIndex}`} className="pt-1 text-xl font-semibold text-[var(--color-text)]">
                <InlineMarkdown text={trimmed.slice(2)} />
              </h1>,
            );
          } else {
            elements.push(
              <p key={`${blockIndex}-${lineIndex}`} className="text-[var(--color-text)]">
                <InlineMarkdown text={trimmed} />
              </p>,
            );
          }
        });

        flushList(`${blockIndex}-list-end`);

        return <div key={blockIndex} className="space-y-2">{elements}</div>;
      })}
    </div>
  );
}

function isCompleteRunnableCommand(cmd: string): boolean {
  const trimmed = cmd.trim();
  if (!trimmed) return false;

  // 1. Filter out command placeholders (e.g. <filename>, <service>, [options])
  if (/<[a-zA-Z_][a-zA-Z0-9_-]*>/.test(trimmed) || /\[[a-zA-Z_][a-zA-Z0-9_-]*\]/.test(trimmed)) {
    return false;
  }
  if (trimmed.includes("...") || trimmed.includes("…")) {
    return false;
  }

  const words = trimmed.split(/\s+/);
  const firstWord = words[0];

  // List of commands that are fully valid/executable and produce output with zero arguments
  const zeroArgAllowed = ["pwd", "who", "df", "free", "last", "env", "ls", "date", "uptime", "hexdump"];

  // List of commands that logically require arguments to make sense or be syntactically valid in a shell
  const needsArgs = [
    "cd", "mkdir", "rm", "cp", "mv", "cat", "tar", "grep", "find", 
    "systemctl", "docker", "timedatectl", "type", "echo", 
    "chmod", "chown", "passwd", "useradd", "dnf", "yum", "rpm", "ip", "ping", 
    "tail", "head", "less", "more", "wc", "du", "lsof", "xz", "tee", "xargs"
  ];

  if (words.length === 1) {
    return zeroArgAllowed.includes(firstWord);
  }

  // Check if the last word looks like an ellipsis or placeholder
  const lastWord = words[words.length - 1];
  if (
    lastWord === "..." || 
    lastWord === "etc" || 
    lastWord === "etc." || 
    lastWord.startsWith("<") || 
    lastWord.endsWith(">") ||
    lastWord.startsWith("[") ||
    lastWord.endsWith("]")
  ) {
    return false;
  }

  return true;
}

function parseAssistantMessageActions(content: string) {
  const pages: number[] = [];
  const commands: string[] = [];

  // 1. Extract pages
  const pageRegexes = [
    /第\s*(\d+)\s*页/g,
    /[Pp]age\s*(\d+)/g,
    /\b[Pp]\.?\s*(\d+)\b/g
  ];
  for (const regex of pageRegexes) {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      const p = parseInt(match[1], 10);
      if (p >= 1 && p <= 300 && !pages.includes(p)) {
        pages.push(p);
      }
    }
  }

  // 2. Extract code blocks (triple backticks)
  const tripleBacktickRegex = /```(?:bash|sh|shell|cmd|powershell)?\n([\s\S]*?)\n```/g;
  let match;
  tripleBacktickRegex.lastIndex = 0;
  while ((match = tripleBacktickRegex.exec(content)) !== null) {
    const code = match[1].trim();
    const lines = code.split("\n").map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      const cleanLine = line.replace(/^\$\s*/, "").replace(/^#\s*/, "").trim();
      if (
        cleanLine && 
        !cleanLine.startsWith("#") && 
        isCompleteRunnableCommand(cleanLine) && 
        !commands.includes(cleanLine) && 
        cleanLine.length < 120
      ) {
        commands.push(cleanLine);
      }
    });
  }

  // 3. Extract inline commands in single backticks
  const inlineRegex = /`([^`\n]+)`/g;
  inlineRegex.lastIndex = 0;
  while ((match = inlineRegex.exec(content)) !== null) {
    const code = match[1].trim();
    const commonCmds = [
      "ls", "cd", "pwd", "mkdir", "rm", "cp", "mv", "cat", "tar", "grep", "find", 
      "systemctl", "docker", "timedatectl", "who", "df", "free", "type", "echo", 
      "chmod", "chown", "passwd", "useradd", "dnf", "yum", "rpm", "ip", "ping", 
      "tail", "head", "less", "more", "wc", "du", "hexdump", "lsof", "xz", "tee", "xargs"
    ];
    const firstWord = code.split(/\s+/)[0];
    if (
      (commonCmds.includes(firstWord) || code.includes(" | ") || code.includes(" > ") || code.includes(" < ")) &&
      isCompleteRunnableCommand(code) &&
      code.length < 80 &&
      !commands.includes(code)
    ) {
      commands.push(code);
    }
  }

  return { pages, commands };
}

/* ── Chat message bubble ── */
function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const router = useRouter();

  const { pages, commands } = useMemo(() => {
    if (isUser) return { pages: [], commands: [] };
    return parseAssistantMessageActions(msg.content);
  }, [msg.content, isUser]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg border px-4 py-2.5 text-sm shadow-[0_10px_30px_color-mix(in_srgb,var(--color-shadow)_10%,transparent)] ${
          isUser
            ? "whitespace-pre-wrap border-[var(--color-border-strong)] bg-[var(--color-panel-strong)] text-[var(--color-text)]"
            : "border-transparent bg-[var(--color-panel-soft)] text-[var(--color-text)]"
        }`}
      >
        {isUser ? (
          msg.content
        ) : (
          <>
            <MarkdownMessage content={msg.content} />
            
            {(pages.length > 0 || commands.length > 0) && (
              <div className="mt-4 border-t border-[color-mix(in_srgb,var(--color-border)_42%,transparent)] pt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  ⚡ 一键直达
                </p>
                <div className="flex flex-wrap gap-2">
                  {pages.map((p) => (
                    <button
                      key={`page-${p}`}
                      onClick={() => router.push(`/textbook?page=${p}`)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-tint-border)] bg-[var(--color-tint-soft)] px-3 py-1 text-xs font-medium text-[var(--color-tint-strong)] transition-all hover:bg-[var(--color-tint)] hover:text-white cursor-pointer"
                    >
                      📖 学习教材第 {p} 页
                    </button>
                  ))}
                  
                  {commands.map((cmd) => (
                    <button
                      key={`cmd-${cmd}`}
                      onClick={() => router.push(`/playground?command=${encodeURIComponent(cmd)}`)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs font-mono text-[var(--color-muted)] transition-all hover:border-[var(--color-tint-border)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] cursor-pointer"
                    >
                      💻 终端运行: <code className="bg-transparent p-0 font-semibold text-[var(--color-text)]">{cmd}</code>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Chat input (pill-shaped, bottom) ── */
function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const hasText = value.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pb-6">
      <div className="flex items-end gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 shadow-[0_18px_55px_color-mix(in_srgb,var(--color-shadow)_22%,transparent)] transition-colors focus-within:border-[var(--color-border-strong)]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            const el = e.target;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="问点什么吧..."
          disabled={disabled}
          className="flex-1 resize-none bg-transparent py-0 text-sm leading-6 text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] disabled:opacity-40"
        />

        <button
          onClick={handleSend}
          disabled={!hasText || disabled}
          className={`shrink-0 rounded-full p-1.5 transition-colors ${
            hasText && !disabled
              ? "cursor-pointer hover:bg-[var(--color-hover)]"
              : "cursor-default"
          }`}
          aria-label="发送"
        >
          <SendArrow active={hasText && !disabled} />
        </button>
      </div>
    </div>
  );
}

function StudentWorkspace({
  username,
  stats,
  onPrompt,
  disabled,
}: {
  username: string;
  stats: UserStats | null;
  onPrompt: (text: string) => void;
  disabled: boolean;
}) {
  const featuredExercises = textbookExercises.slice(0, 3);
  const prompts = [
    "帮我规划今天的 Linux 学习任务",
    "总结一下管道和重定向的区别",
    "我应该先做哪个教材实验？",
  ];
  const capabilityTags = ["PDF 教材联动", "xterm 实验", "AI 命令辅导", "学习进度追踪"];
  const overview = [
    {
      label: "今日学习",
      value: stats ? formatDuration(stats.today_duration_minutes) : "--:--:--",
      tone: "tint-panel",
      dot: "var(--color-tint)",
    },
    {
      label: "执行命令",
      value: stats ? `${stats.today_commands}` : "--",
      tone: "sage-panel",
      dot: "var(--color-sage)",
    },
    {
      label: "教材进度",
      value: stats ? `${stats.textbook_progress}%` : "--",
      tone: "warm-panel",
      dot: "var(--color-warm)",
    },
  ];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitTask, setSubmitTask] = useState<Task | null>(null);
  const [submitContent, setSubmitContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchTasks() {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      console.error("[Student tasks] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  function handleOpenSubmitModal(task: Task) {
    setSubmitTask(task);
    setSubmitContent(task.submission?.content || "");
  }

  async function handleSubmitTask() {
    if (!submitTask) return;
    setSubmitting(true);
    try {
      await taskService.submitTask(submitTask.id, submitContent);
      await fetchTasks();
      setSubmitTask(null);
      setSubmitContent("");
    } catch (err) {
      console.error("[Student tasks] Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 overflow-y-auto px-8 py-10">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="hero-surface overflow-hidden rounded-[30px] px-8 py-10 lg:col-span-8">
          <div className="flex h-full flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-muted)]">欢迎回来，{username}</p>
              <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-[1.08] tracking-normal text-[var(--color-text)]">
                继续你的 openEuler 学习路径
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
                教材阅读、终端实验和 AI 辅导已经连接起来。你可以从教材页进入对应练习，也可以直接在 Playground 完成实验步骤。
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {capabilityTags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      index === 0
                        ? "border-[var(--color-tint-border)] bg-[var(--color-tint-soft)] text-[var(--color-tint-strong)]"
                        : index === 1
                          ? "border-[var(--color-sage-border)] bg-[var(--color-sage-soft)] text-[var(--color-sage-strong)]"
                          : index === 2
                            ? "border-[color-mix(in_srgb,var(--color-warm)_28%,var(--color-border))] bg-[var(--color-warm-soft)] text-[var(--color-warm)]"
                            : "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_42%,transparent)] text-[var(--color-muted)]"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/textbook"
                className="rounded-full bg-[var(--color-tint)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                打开数字教材
              </Link>
              <Link
                href={`/playground?exercise=${featuredExercises[0]?.id ?? ""}`}
                className="rounded-full border border-[var(--color-border-strong)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-hover)]"
              >
                开始教材实验
              </Link>
            </div>
          </div>
        </section>

        <aside className="surface rounded-[30px] p-6 lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Today</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">学习概览</h2>
          <div className="mt-5 space-y-3">
            {overview.map((item) => (
              <div key={item.label} className={`surface-soft rounded-[22px] p-5 ${item.tone}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[var(--color-muted)]">{item.label}</p>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.dot }} />
                </div>
                <p className="mt-3 font-mono text-3xl text-[var(--color-text)]">{item.value}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="surface rounded-[30px] p-6 lg:col-span-8">
          <div className="mb-5 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">教材练习</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">可直接进入 xterm 的章节任务</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
                从教材章节直接进入终端实验，完成命令后会自动记录进度。
              </p>
            </div>
            <Link href="/textbook" className="quiet-link text-sm">
              查看教材
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {featuredExercises.map((exercise) => (
              <Link
                key={exercise.id}
                href={`/playground?exercise=${exercise.id}`}
                className={`surface-soft rounded-[22px] p-5 transition-transform hover:-translate-y-0.5 ${
                  exercise.difficulty === "基础"
                    ? "tint-panel"
                    : exercise.difficulty === "进阶"
                      ? "sage-panel"
                      : "warm-panel"
                }`}
              >
                <p className="text-[11px] text-[var(--color-tint-strong)]">
                  Page {exercise.textbookPage} · {exercise.difficulty}
                </p>
                <h3 className="mt-3 text-base font-semibold leading-6 text-[var(--color-text)]">{exercise.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-muted)]">{exercise.objective}</p>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-6 lg:col-span-4">
          <div className="surface rounded-[30px] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">AI 学习助手</p>
            <h2 className="mt-2 text-2xl font-semibold leading-8 text-[var(--color-text)]">从一个问题开始</h2>
            <div className="mt-5 space-y-2.5">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onPrompt(prompt)}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel-soft)] px-4 py-3 text-left text-sm leading-5 text-[var(--color-text)] transition-colors hover:border-[var(--color-tint-border)] hover:bg-[var(--color-tint-soft)] disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="surface-soft warm-panel rounded-[30px] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">今日建议</p>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-[var(--color-text)]">
              <li>1. 阅读 Ch3 Shell 的重定向与管道。</li>
              <li>2. 在 xterm 中完成对应实验步骤。</li>
              <li>3. 用 AI 助手复盘命令组合思路。</li>
            </ol>
          </div>
        </aside>

        {/* ── Teacher tasks section ── */}
        <section className="surface rounded-[30px] p-6 lg:col-span-8">
          <div className="mb-5 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">教师任务</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">教师发布的学习与实训作业</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
                查看教师部署的任务要求，进入终端进行调试，并在右侧进行提交。
              </p>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-[var(--color-muted)]">加载任务列表中...</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">当前暂无教师部署的任务</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="surface-soft rounded-[22px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[var(--color-border)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-semibold text-[var(--color-text)] truncate">{task.title}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          task.submission?.score !== null
                            ? "bg-[color-mix(in_srgb,var(--color-tint)_15%,transparent)] text-[var(--color-tint)] border border-[var(--color-tint-border)]"
                            : task.submission
                              ? "bg-[var(--color-panel-strong)] text-[var(--color-muted)] border border-[var(--color-border)]"
                              : "bg-[color-mix(in_srgb,var(--color-warm)_15%,transparent)] text-[var(--color-warm)] border border-[color-mix(in_srgb,var(--color-warm)_30%,var(--color-border))]"
                        }`}
                      >
                        {task.submission?.score !== null
                          ? `已批改: ${task.submission?.score}分`
                          : task.submission
                            ? "待批改"
                            : "未提交"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-muted)] whitespace-pre-wrap leading-relaxed">{task.description}</p>
                    <p className="mt-3 text-[11px] text-[var(--color-muted)]">截止日期: {task.deadline}</p>
                    
                    {task.submission?.comment && (
                      <div className="mt-3 text-xs bg-[var(--color-panel-strong)] p-3 rounded-lg border border-[var(--color-border)]">
                        <span className="font-semibold text-[var(--color-tint)]">教师评语: </span>
                        <span className="text-[var(--color-text)] leading-relaxed">{task.submission?.comment}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex shrink-0 items-center gap-2.5">
                    <Link
                      href="/playground"
                      className="rounded-full border border-[var(--color-border-strong)] bg-transparent px-4 py-2 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-hover)]"
                    >
                      去 Playground 实验
                    </Link>
                    <button
                      onClick={() => handleOpenSubmitModal(task)}
                      className="rounded-full bg-[var(--color-tint)] px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                    >
                      {task.submission ? "修改提交" : "提交作业"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="lg:col-span-4" />
      </div>

      {/* Submission Modal */}
      {submitTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSubmitTask(null)}
        >
          <div
            className="w-[500px] border border-[var(--color-border)] bg-[var(--color-bg)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-sm font-bold text-[var(--color-text)]">提交作业: {submitTask.title}</h3>
            <p className="mb-4 text-xs text-[var(--color-muted)] whitespace-pre-wrap">{submitTask.description}</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">
                  作业内容 (可粘贴您的 Shell 脚本或实验报告)
                </label>
                <textarea
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] p-3 font-mono text-sm text-[var(--color-text)] outline-none resize-none"
                  style={{ caretColor: "var(--color-accent)" }}
                  rows={8}
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  placeholder="#!/bin/bash\n# 在这里键入您的脚本或报告内容..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSubmitTask(null)}
                  disabled={submitting}
                  className="border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)]"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitTask}
                  disabled={submitting}
                  className="bg-[var(--color-tint)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "提交中..." : "确认提交"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ── */
export default function Home() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    newConversation,
    addMessage,
    setUserId,
    clearUserId,
  } = useChatStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("chat");
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );
  const messages = activeConversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  const username = user?.username ?? "";
  const { displayed: typewriterText, done: typewriterDone } = useTypewriter(
    "我们从哪里开始？",
    80,
    isAuthenticated && !!user,
  );

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user?.id, setUserId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    authService.getStats().then(setStats).catch(() => setStats(null));
  }, [isAuthenticated]);

  async function handleSend(text: string) {
    let convId = activeConversationId;
    if (!convId) {
      convId = newConversation();
    }

    const userMsg: ChatMessage = { role: "user", content: text };
    addMessage(convId, userMsg);
    setSending(true);

    const conv = useChatStore.getState().conversations.find((c) => c.id === convId);
    const currentMessages = conv?.messages ?? [userMsg];

    try {
      const history: ChatMessage[] = currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await aiService.chat({
        message: text,
        history: history.slice(0, -1),
      });
      addMessage(convId, { role: "assistant", content: res.reply });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? `Error: ${(err as { message: string }).message}`
          : "AI 请求失败，请稍后重试";
      addMessage(convId, { role: "assistant", content: msg });
    } finally {
      setSending(false);
    }
  }

  async function handleLogout() {
    clearUserId();
    await authService.logout();
    setUser(null);
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthScene>
        <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
          <ICTLogo size="lg" />
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.22em] text-[var(--color-tint-strong)]">openEuler Lab</p>
            <h1 className="text-5xl font-semibold leading-tight tracking-normal text-[var(--color-text)]">
              ICT数字化教学平台
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--color-muted)]">
              在教材、xterm 终端实验和 AI 辅导之间建立一条连续的学习路径。
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="rounded-full bg-[var(--color-tint)] px-8 py-3 font-mono text-sm tracking-wider text-white shadow-[0_12px_36px_var(--color-tint-soft)] transition-opacity hover:opacity-90"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-[var(--color-border-strong)] bg-[color-mix(in_srgb,var(--color-panel)_60%,transparent)] px-8 py-3 font-mono text-sm tracking-wider text-[var(--color-text)] backdrop-blur-xl transition-colors hover:bg-[var(--color-hover)]"
            >
              注册
            </Link>
          </div>
        </div>
      </AuthScene>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        username={username}
        role={user.role}
      />

      <main className="flex flex-1 flex-col bg-[linear-gradient(180deg,var(--color-panel-soft)_0%,var(--color-bg)_38%)]">
        <header className="flex h-13 shrink-0 items-center justify-end border-b border-[var(--color-border)] bg-[var(--color-panel-soft)] px-5">
          <button
            onClick={handleLogout}
            className="text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            登出
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col min-h-0">
            {hasMessages ? (
              <>
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto px-4 py-6"
                >
                  <div className="mx-auto flex max-w-[680px] flex-col gap-4">
                    {messages.map((msg, i) => (
                      <ChatBubble key={i} msg={msg} />
                    ))}
                    {sending && (
                      <div className="flex justify-start">
                        <span className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)]">
                          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                          AI 思考中...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <ChatInput onSend={handleSend} disabled={sending} />
              </>
            ) : (
              <>
                <StudentWorkspace
                  username={username}
                  stats={stats}
                  onPrompt={handleSend}
                  disabled={sending}
                />
                <ChatInput onSend={handleSend} disabled={sending} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

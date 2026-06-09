"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { aiService, type ChatMessage } from "@/services/ai.service";
import { useChatStore } from "@/stores/chatStore";
import type { UserStats } from "@/types/user";

/* ── Mini UESTC badge for sidebar ── */
function MiniBadge() {
  return (
    <img src="/badge.webp" alt="UESTC" className="h-[22px] w-[22px] shrink-0 rounded-full object-contain opacity-90" />
  );
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
      className={`transition-colors ${active ? "text-[#00FF66]" : "text-[#757575]"}`}
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

  function formatDuration(minutes: number): string {
    if (minutes <= 0) return "00:00:00";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  }

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
      className={`relative flex flex-col border-r border-white/[0.06] bg-[#0B0B0B] transition-all duration-200 ${
        collapsed ? "w-14" : "w-[260px]"
      }`}
    >
      <div
        className={`flex items-center border-b border-white/[0.06] px-3 py-3.5 ${
          collapsed ? "justify-center" : "gap-2.5"
        }`}
      >
        <button
          onClick={onToggle}
          className="shrink-0 text-lg leading-none text-[#757575] transition-colors hover:text-[#E6E6E6]"
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          ☰
        </button>
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2">
            <MiniBadge />
            <span className="truncate text-sm font-medium text-[#E6E6E6]">
              在线Linux学习平台
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <Link
          href="/textbook"
          className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
            collapsed ? "justify-center px-0" : ""
          } text-[#757575] hover:text-[#E6E6E6]`}
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
              ? "text-[#E6E6E6]"
              : "text-[#757575] hover:text-[#E6E6E6]"
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
            } text-[#757575] hover:text-[#E6E6E6]`}
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
                ? "text-[#E6E6E6]"
                : "text-[#757575] hover:text-[#E6E6E6]"
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
                  className="shrink-0 rounded p-0.5 text-[#757575] transition-colors hover:text-[#00FF66]"
                  title="新对话"
                >
                  {iconPlus}
                </button>
              </>
            )}
          </div>

          {!collapsed && chatExpanded && (
            <div className="ml-9 border-l border-white/[0.06] py-1">
              {conversations.length === 0 ? (
                <p className="px-3 py-3 text-xs text-[#757575]">
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
                            ? "bg-[#00FF66]"
                            : "bg-transparent border border-white/[0.15]"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate ${
                            activeConversationId === conv.id
                              ? "text-[#E6E6E6]"
                              : "text-[#757575]"
                          }`}
                        >
                          {conv.title}
                        </span>
                        <span className="text-[10px] text-[#484f58]">
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#484f58] transition-colors hover:text-[#f85149]"
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

      <div className="relative border-t border-white/[0.06]">
        <button
          onClick={() => setShowPopover((v) => !v)}
          className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-white/[0.03] ${
            collapsed ? "justify-center" : ""
          }`}
          title={username}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-medium text-[#E6E6E6]">
            {username.charAt(0).toUpperCase()}
          </span>
          {!collapsed && (
            <span className="truncate text-sm text-[#E6E6E6]">{username}</span>
          )}
        </button>

        {showPopover && (
          <div
            ref={popoverRef}
            className="absolute bottom-full left-3 mb-2 w-56 border border-white/[0.08] bg-[#111] p-4"
            style={{ zIndex: 50 }}
          >
            <p className="mb-3 text-xs font-semibold tracking-wide text-[#E6E6E6]">
              学习数据
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#757575]">今日学习时长</span>
                <span className="font-mono text-[#E6E6E6]">
                  {stats ? formatDuration(stats.today_duration_minutes) : "..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757575]">今日执行命令</span>
                <span className="font-mono text-[#E6E6E6]">
                  {stats !== null ? stats.today_commands : "..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757575]">AI 分析次数</span>
                <span className="font-mono text-[#E6E6E6]">
                  {stats !== null ? stats.total_analyses : "..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757575]">教材阅读进度</span>
                <span className="font-mono text-[#E6E6E6]">
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

/* ── Chat message bubble ── */
function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm ${
          isUser
            ? "bg-white/[0.06] text-[#E6E6E6]"
            : "text-[#E6E6E6]"
        }`}
      >
        {msg.content}
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
      <div className="flex items-end gap-2 rounded-full border border-white/[0.08] bg-[#0B0B0B] px-4 py-3 transition-colors focus-within:border-white/[0.16]">
        <span className="mb-0.5 shrink-0 font-mono text-sm text-[#00FF66] select-none">
          $
        </span>

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
          className="flex-1 resize-none bg-transparent py-0 text-sm leading-6 text-[#E6E6E6] outline-none placeholder:text-[#757575] disabled:opacity-40"
        />

        <button
          onClick={handleSend}
          disabled={!hasText || disabled}
          className={`shrink-0 rounded-full p-1.5 transition-colors ${
            hasText && !disabled
              ? "cursor-pointer hover:bg-white/[0.08]"
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#0B0B0B]">
        <img src="/badge.webp" alt="UESTC" className="h-16 w-16 rounded-full object-contain opacity-90" />
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-light tracking-[0.05em] text-[#E6E6E6]">
            在线Linux学习平台
          </h1>
          <p className="text-sm text-[#757575]">登录以开始学习</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="border border-white/[0.15] px-8 py-2.5 font-mono text-sm tracking-wider text-[#E6E6E6] transition-colors hover:border-[#00FF66] hover:text-[#00FF66]"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="border border-white/[0.15] px-8 py-2.5 font-mono text-sm tracking-wider text-[#E6E6E6] transition-colors hover:border-[#00FF66] hover:text-[#00FF66]"
          >
            注册
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0B0B]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        username={username}
        role={user.role}
      />

      <main className="flex flex-1 flex-col">
        <header className="flex h-13 shrink-0 items-center justify-end border-b border-white/[0.06] px-5">
          <button
            onClick={handleLogout}
            className="text-xs text-[#757575] transition-colors hover:text-[#E6E6E6]"
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
                        <span className="inline-flex items-center gap-1 text-sm text-[#757575]">
                          <span className="inline-block h-2 w-2 rounded-full bg-[#00FF66] animate-pulse" />
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
                <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
                  <h2 className="mb-4 text-center text-4xl font-light tracking-wide text-[#E6E6E6]">
                    {username}
                  </h2>
                  <p className="font-mono text-lg text-[#E6E6E6]">
                    {typewriterText}
                    {!typewriterDone && (
                      <span className="ml-0.5 inline-block h-5 w-2 animate-pulse bg-[#00FF66] align-middle" />
                    )}
                  </p>
                </div>
                <ChatInput onSend={handleSend} disabled={sending} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

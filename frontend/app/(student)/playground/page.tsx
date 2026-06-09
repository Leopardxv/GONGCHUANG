"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import TerminalPanel from "@/components/TerminalPanel";
import { useAIStore, type HistoryItem } from "@/stores/aiStore";

/* ── helpers ── */

function commandTag(command: string): string {
  const c = command.trim().split(/\s+/)[0];
  const map: Record<string, string> = {
    ls: "路径操作", pwd: "路径操作", cd: "路径操作", mkdir: "文件管理",
    touch: "文件管理", rm: "文件管理", cp: "文件管理", mv: "文件管理",
    cat: "文件查看", less: "文件查看", head: "文件查看", tail: "文件查看",
    ps: "进程管理", top: "进程管理", kill: "进程管理", whoami: "用户管理",
    id: "用户管理", su: "用户管理", sudo: "用户管理", echo: "基础命令",
    clear: "基础命令", man: "帮助命令", help: "帮助命令",
  };
  return map[c] || "基础命令";
}

function tagColor(tag: string): string {
  const map: Record<string, string> = {
    "路径操作": "border-[#1f6feb]/40 text-[#58a6ff]",
    "文件管理": "border-[#238636]/40 text-[#3fb950]",
    "文件查看": "border-[#8957e5]/40 text-[#bc8cff]",
    "进程管理": "border-[#d2991d]/40 text-[#d2991d]",
    "用户管理": "border-[#db6d28]/40 text-[#f0883e]",
    "基础命令": "border-[#8b949e]/40 text-[#8b949e]",
    "帮助命令": "border-[#39d2c0]/40 text-[#39d2c0]",
  };
  return map[tag] || "border-[#8b949e]/40 text-[#8b949e]";
}

/* ── Left Sidebar ── */

const SIDEBAR_CATEGORIES = [
  { name: "路径操作", cmds: "ls, pwd, cd" },
  { name: "文件管理", cmds: "mkdir, touch, rm, cp, mv" },
  { name: "文件查看", cmds: "cat, less, head, tail" },
  { name: "进程管理", cmds: "ps, top, kill" },
  { name: "用户管理", cmds: "whoami, id, su" },
];

function LeftSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const history = useAIStore((s) => s.history);
  const recent = history.filter((h) => h.status !== "loading").slice(-6).reverse();

  if (collapsed) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-r border-[#21262d] bg-[#0d1117] pt-3">
        <button onClick={onToggle} title="展开侧栏" className="p-1 text-sm text-[#484f58] hover:text-[#c9d1d9]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3.5l4.5 4.5-4.5 4.5V3.5z"/></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-48 shrink-0 flex-col border-r border-[#21262d] bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-[#21262d] px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8b949e]">Command Guide</span>
        <button onClick={onToggle} title="收起侧栏" className="text-sm text-[#484f58] hover:text-[#c9d1d9]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10 3.5L5.5 8l4.5 4.5V3.5z"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 text-xs">
        <p className="mb-2 px-1 text-[11px] text-[#484f58]">命令分类</p>
        {SIDEBAR_CATEGORIES.map((cat) => (
          <div
            key={cat.name}
            className="mb-0.5 cursor-pointer rounded-md px-2 py-1.5 text-[#8b949e] transition-colors hover:bg-[#1c2128] hover:text-[#c9d1d9]"
          >
            <p className="font-medium">{cat.name}</p>
            <p className="text-[10px] text-[#484f58]">{cat.cmds}</p>
          </div>
        ))}

        {recent.length > 0 && (
          <>
            <p className="mb-2 mt-3 px-1 text-[11px] text-[#484f58]">最近命令</p>
            {recent.map((h) => (
              <div key={h.id} className="truncate rounded-md px-2 py-1 font-mono text-xs text-[#58a6ff]">
                $ {h.command}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Learning Panel (Right) ── */

function LearningPanel({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const history = useAIStore((s) => s.history);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* */ }
  }, []);

  if (collapsed) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center border-l border-[#21262d] bg-[#0d1117] pt-3">
        <button onClick={onToggle} title="展开辅导区" className="flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-[10px] text-[#8b949e] transition-colors hover:bg-[#1c2128] hover:text-[#58a6ff]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          <span>展开</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-[45%] min-w-[360px] shrink-0 flex-col border-l border-[#21262d] bg-[#0d1117]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#21262d] px-4 py-2.5">
        <div>
          <h2 className="text-sm font-semibold text-[#c9d1d9]">学习提示</h2>
          <p className="text-[11px] text-[#8b949e]">命令学习记录</p>
        </div>
        <button
          onClick={onToggle}
          className="rounded-md px-2.5 py-1.5 text-[11px] text-[#8b949e] transition-colors hover:bg-[#1c2128] hover:text-[#c9d1d9]"
        >
          收起辅导区
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {history.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-[#484f58]">在终端中输入命令，这里会显示 AI 学习提示。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <LearningCard key={item.id} item={item} copied={copied} onCopy={handleCopy} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Single Learning Card ── */

function LearningCard({ item, copied, onCopy }: { item: HistoryItem; copied: string | null; onCopy: (t: string) => void }) {
  const [expanded, setExpanded] = useState(item.status !== "loading");
  const { command, status, time, analysis } = item;
  const tag = commandTag(command);

  const statusText: Record<string, string> = {
    loading: "分析中", normal: "已掌握", warning: "建议复习", error: "需纠正",
  };
  const statusColors: Record<string, string> = {
    loading: "border-[#1f6feb]/30 text-[#58a6ff] bg-[#1f6feb]/8",
    normal: "border-[#238636]/30 text-[#3fb950] bg-[#238636]/8",
    warning: "border-[#d2991d]/30 text-[#d2991d] bg-[#d2991d]/8",
    error: "border-[#f85149]/30 text-[#f85149] bg-[#f85149]/8",
  };

  useEffect(() => {
    if (status !== "loading" && !expanded) setExpanded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className={`rounded-xl border border-[#21262d] bg-[#161b22] p-4 transition-all duration-200 hover:border-[#30363d] ${status === "loading" ? "animate-pulse" : ""}`}>
      <div
        className="flex cursor-pointer items-center justify-between gap-2"
        onClick={() => status !== "loading" && setExpanded(!expanded)}
      >
        <div className="flex min-w-0 items-center gap-2">
          <code className="truncate text-sm text-[#58a6ff]">$ {command}</code>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${tagColor(tag)}`}>
            {tag}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusColors[status]}`}>
            {statusText[status]}
          </span>
          <span className="text-[11px] text-[#484f58]">{time}</span>
          {status !== "loading" && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"
              className={`text-[#484f58] transition-transform ${expanded ? "rotate-180" : ""}`}>
              <path d="M4.427 5.927L8 9.5l3.573-3.573.854.854L8 11.146 3.573 6.78l.854-.854z"/>
            </svg>
          )}
        </div>
      </div>

      {status === "loading" && (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-[#8b949e]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#58a6ff] animate-pulse" />
          Analyzing command...
        </div>
      )}

      {expanded && analysis && (
        <div className="mt-3 space-y-2.5 border-t border-[#21262d] pt-3">
          <div className="mb-1 flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onCopy(command); }}
              className="rounded p-0.5 text-[#484f58] transition-colors hover:text-[#c9d1d9]"
            >
              {copied === command ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
            </button>
            <span className="text-[10px] text-[#484f58]">复制命令</span>
          </div>
          <CardSection title="命令作用">{analysis.command_explanation}</CardSection>
          {analysis.error_reason && <CardSection title="错误诊断" accent="text-[#f85149]">{analysis.error_reason}</CardSection>}
          {analysis.syntax_fix && <CardSection title="修正建议" accent="text-[#d2991d]">{analysis.syntax_fix}</CardSection>}
          <CardSection title="使用建议" accent="text-[#3fb950]">{analysis.best_practice}</CardSection>
          {analysis.learning_recommendation && <CardSection title="知识拓展" accent="text-[#58a6ff]">{analysis.learning_recommendation}</CardSection>}
        </div>
      )}
    </div>
  );
}

function CardSection({ title, accent, children }: { title: string; accent?: string; children: string }) {
  return (
    <div>
      <h4 className={`mb-0.5 text-[11px] font-semibold ${accent || "text-[#8b949e]"}`}>{title}</h4>
      <p className="text-[13px] leading-relaxed text-[#c9d1d9]">{children}</p>
    </div>
  );
}

/* ── Playground Page ── */

export default function PlaygroundPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [learningCollapsed, setLearningCollapsed] = useState(false);

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#0d1117]">
      <LeftSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />

      <div className={`flex flex-col gap-3 p-3 ${learningCollapsed ? "flex-1" : "w-[55%]"}`} style={{ transition: "width 250ms ease" }}>
        <TerminalPanel />
      </div>

      <LearningPanel collapsed={learningCollapsed} onToggle={() => setLearningCollapsed((v) => !v)} />
    </div>
  );
}

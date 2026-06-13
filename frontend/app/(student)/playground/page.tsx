"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TerminalPanel from "@/components/TerminalPanel";
import { textbookExercises, type TextbookExercise } from "@/data/exercises";
import { getSnippetById } from "@/data/textbook-snippets";
import { useAIStore, type HistoryItem } from "@/stores/aiStore";
import { useExerciseStore } from "@/stores/exerciseStore";
import { aiService, type ChatMessage } from "@/services/ai.service";

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="rounded border border-[#2d2d2d] bg-[#1a1a1a] px-1 py-0.5 font-mono text-[0.9em] text-[#cccccc]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-[#ffffff]">
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
    <div className="space-y-2 text-xs leading-5">
      {blocks.map((block, blockIndex) => {
        if (block.startsWith("```")) {
          const code = block.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/```$/, "");
          return (
            <pre
              key={blockIndex}
              className="max-w-full overflow-x-auto rounded border border-[#2d2d2d] bg-[#000000] p-2"
            >
              <code className="font-mono text-[10px] leading-4 text-[#d7d7d7]">
                {code.trimEnd()}
              </code>
            </pre>
          );
        }

        const lines = block.split(/\n+/).filter((line) => line.trim().length > 0);
        const elements: any[] = [];
        let listItems: string[] = [];

        function flushList(key: string) {
          if (listItems.length === 0) return;
          elements.push(
            <ul key={key} className="space-y-1 pl-4 text-[#cccccc]">
              {listItems.map((item, index) => (
                <li key={index} className="list-disc marker:text-[#8a8a8a]">
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
              <h4 key={`${blockIndex}-${lineIndex}`} className="pt-1 text-xs font-semibold text-[#ffffff]">
                <InlineMarkdown text={trimmed.slice(4)} />
              </h4>,
            );
          } else if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
            elements.push(
              <h3 key={`${blockIndex}-${lineIndex}`} className="pt-1 text-sm font-semibold text-[#ffffff]">
                <InlineMarkdown text={trimmed.replace(/^[#\s]+/, "")} />
              </h3>,
            );
          } else {
            elements.push(
              <p key={`${blockIndex}-${lineIndex}`} className="text-[#cccccc]">
                <InlineMarkdown text={trimmed} />
              </p>,
            );
          }
        });

        flushList(`${blockIndex}-list-end`);

        return <div key={blockIndex} className="space-y-1.5">{elements}</div>;
      })}
    </div>
  );
}

function isCompleteRunnableCommand(cmd: string): boolean {
  const trimmed = cmd.trim();
  if (!trimmed) return false;

  if (/<[a-zA-Z_][a-zA-Z0-9_-]*>/.test(trimmed) || /\[[a-zA-Z_][a-zA-Z0-9_-]*\]/.test(trimmed)) {
    return false;
  }
  if (trimmed.includes("...") || trimmed.includes("…")) {
    return false;
  }

  const words = trimmed.split(/\s+/);
  const firstWord = words[0];

  const zeroArgAllowed = ["pwd", "who", "df", "free", "last", "env", "ls", "date", "uptime", "hexdump"];
  const needsArgs = [
    "cd", "mkdir", "rm", "cp", "mv", "cat", "tar", "grep", "find", 
    "systemctl", "docker", "timedatectl", "type", "echo", 
    "chmod", "chown", "passwd", "useradd", "dnf", "yum", "rpm", "ip", "ping", 
    "tail", "head", "less", "more", "wc", "du", "lsof", "xz", "tee", "xargs"
  ];

  if (words.length === 1) {
    return zeroArgAllowed.includes(firstWord);
  }

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

function ActivityBar({
  showExplorer,
  setShowExplorer,
  showCoach,
  setShowCoach,
  backUrl,
}: {
  showExplorer: boolean;
  setShowExplorer: (v: boolean) => void;
  showCoach: boolean;
  setShowCoach: (v: boolean) => void;
  backUrl: string;
}) {
  const icons = [
    { label: "实验", path: "M3 4h18v4H3zM3 10h18v10H3z", active: showExplorer, toggle: () => setShowExplorer(!showExplorer) },
    { label: "终端", path: "M4 7l5 5-5 5M11 17h9", active: true, toggle: () => {} },
    { label: "辅导", path: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z", active: showCoach, toggle: () => setShowCoach(!showCoach) },
    {
      label: "教材",
      path: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      active: false,
      isLink: true,
      href: backUrl,
    },
  ];

  return (
    <aside className="flex w-12 shrink-0 flex-col items-center border-r border-[#2d2d2d] bg-[#181818] py-3">
      <Link href="/" className="mb-5 flex h-7 w-7 items-center justify-center rounded bg-[#c7342f] font-black tracking-[-0.12em] text-white transition-opacity hover:opacity-90 cursor-pointer">
        ICT
      </Link>
      <div className="flex flex-col gap-2">
        {icons.map((icon) => {
          const content = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon.path} />
            </svg>
          );
          if (icon.isLink) {
            return (
              <Link
                key={icon.label}
                href={icon.href || "/textbook"}
                title={icon.label}
                className="flex h-10 w-10 items-center justify-center border-l-2 border-transparent text-[#858585] hover:text-[#cccccc]"
              >
                {content}
              </Link>
            );
          }
          return (
            <button
              key={icon.label}
              title={icon.label}
              onClick={icon.toggle}
              className={`flex h-10 w-10 items-center justify-center border-l-2 ${
                icon.active ? "border-[#c7342f] text-[#cccccc]" : "border-transparent text-[#858585] hover:text-[#cccccc]"
              }`}
            >
              {content}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ExerciseExplorer({
  activeExercise,
  completedStepIds,
  snippetId,
  onSelect,
  onReset,
  onPasteSnippet,
}: {
  activeExercise: TextbookExercise | null;
  completedStepIds: string[];
  snippetId: string | null;
  onSelect: (exerciseId: string) => void;
  onReset: () => void;
  onPasteSnippet: (code: string) => void;
}) {
  const snippet = getSnippetById(snippetId);
  const progress = activeExercise
    ? Math.round((completedStepIds.length / activeExercise.steps.length) * 100)
    : 0;

  return (
    <aside className="flex w-[330px] shrink-0 flex-col border-r border-[#2d2d2d] bg-[#1f1f1f]">
      <div className="border-b border-[#2d2d2d] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Explorer</p>
        <h1 className="mt-2 text-sm font-semibold text-[#cccccc]">ICT Textbook Labs</h1>
      </div>

      <div className="border-b border-[#2d2d2d] px-3 py-3">
        <select
          value={activeExercise?.id ?? ""}
          onChange={(event) => onSelect(event.target.value)}
          className="w-full rounded border border-[#3c3c3c] bg-[#252526] px-3 py-2 text-xs text-[#cccccc] outline-none focus:border-[#c7342f]"
        >
          {textbookExercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              P{exercise.textbookPage} · {exercise.title}
            </option>
          ))}
        </select>
      </div>

      {/* ── Snippet Card (from textbook) ── */}
      {snippet && (
        <div className="border-b border-[#2d2d2d] bg-[#252526] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-[#3a1f1d] px-2 py-0.5 text-[10px] font-semibold text-[#f0aaa4]">
              来自教材
            </span>
            <span className="text-[10px] text-[#8a8a8a]">§{snippet.section} · P{snippet.page}</span>
          </div>
          <h3 className="text-sm font-semibold text-[#f0f0f0]">{snippet.title}</h3>
          <p className="mt-1 text-[11px] leading-5 text-[#9d9d9d]">{snippet.description}</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-[#000000] p-3 font-mono text-[10px] leading-5 text-[#d7d7d7]">
            {snippet.code}
          </pre>
          <button
            onClick={() => onPasteSnippet(snippet.code)}
            className="mt-3 w-full rounded-full border border-[#c7342f] bg-[#c7342f] px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            粘贴到终端
          </button>
        </div>
      )}

      {activeExercise && (
        <>
          <div className="border-b border-[#2d2d2d] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-[#8a8a8a]">CH {activeExercise.chapter}</p>
                <h2 className="mt-1 text-base font-semibold leading-6 text-[#f0f0f0]">{activeExercise.title}</h2>
              </div>
              <span className="rounded bg-[#2d2d2d] px-2 py-1 font-mono text-xs text-[#cccccc]">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded bg-[#333333]">
              <div className="h-full rounded bg-[#c7342f]" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-[#9d9d9d]">{activeExercise.objective}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Steps</p>
            <div className="space-y-2">
              {activeExercise.steps.map((step, index) => {
                const done = completedStepIds.includes(step.id);
                return (
                  <div
                    key={step.id}
                    className={`rounded border px-3 py-3 ${
                      done ? "border-[#c7342f]/70 bg-[#3a1f1d]" : "border-[#2d2d2d] bg-[#252526]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-[11px] ${
                          done ? "border-[#c7342f] bg-[#c7342f] text-white" : "border-[#555] text-[#8a8a8a]"
                        }`}
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-[#cccccc]">{step.title}</p>
                        <p className="mt-1 text-[11px] leading-5 text-[#8a8a8a]">{step.instruction}</p>
                      </div>
                    </div>
                    <p className="mt-2 rounded bg-[#1e1e1e] px-2 py-1.5 font-mono text-[10px] leading-4 text-[#d7d7d7]">
                      {step.hint}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="mb-2 mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Commands</p>
            <div className="flex flex-wrap gap-1.5 px-1">
              {activeExercise.commands.map((command) => (
                <span key={command} className="rounded bg-[#2d2d2d] px-2 py-1 font-mono text-[10px] text-[#cccccc]">
                  {command}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-[#2d2d2d] p-3">
            <button
              onClick={onReset}
              className="w-full rounded border border-[#3c3c3c] bg-[#252526] px-3 py-2 text-xs text-[#cccccc] hover:bg-[#2d2d2d]"
            >
              Reset Lab Progress
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

function AnalysisCard({ item }: { item: HistoryItem }) {
  const [expanded, setExpanded] = useState(item.status !== "loading");
  const { command, status, analysis } = item;

  useEffect(() => {
    if (status !== "loading" && !expanded) setExpanded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="rounded border border-[#2d2d2d] bg-[#252526] p-3">
      <button
        onClick={() => status !== "loading" && setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <code className="min-w-0 truncate font-mono text-xs text-[#d7d7d7]">$ {command}</code>
        <span className="shrink-0 rounded bg-[#1e1e1e] px-2 py-0.5 text-[10px] text-[#8a8a8a]">
          {status === "loading" ? "分析中" : status === "warning" ? "建议复习" : status === "error" ? "需纠正" : "已分析"}
        </span>
      </button>

      {status === "loading" && <p className="mt-3 text-xs text-[#8a8a8a]">AI 正在分析命令...</p>}

      {expanded && analysis && (
        <div className="mt-3 space-y-3 border-t border-[#2d2d2d] pt-3">
          <section>
            <p className="mb-1 text-[11px] font-semibold text-[#8a8a8a]">命令作用</p>
            <p className="text-xs leading-5 text-[#cccccc]">{analysis.command_explanation}</p>
          </section>
          {analysis.syntax_fix && (
            <section>
              <p className="mb-1 text-[11px] font-semibold text-[#f0aaa4]">修正建议</p>
              <p className="text-xs leading-5 text-[#cccccc]">{analysis.syntax_fix}</p>
            </section>
          )}
          {analysis.best_practice && (
            <section>
              <p className="mb-1 text-[11px] font-semibold text-[#8a8a8a]">实践建议</p>
              <p className="text-xs leading-5 text-[#cccccc]">{analysis.best_practice}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CoachPanel({
  commandHistory,
  onClose,
  onPasteSnippet,
}: {
  commandHistory: string[];
  onClose: () => void;
  onPasteSnippet: (code: string) => void;
}) {
  const history = useAIStore((state) => state.history);
  const [activeTab, setActiveTab] = useState<"coach" | "chat">("coach");
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "你好！我是你的 AI 实验助手。在实验过程中有任何问题，比如命令用法、执行报错或实验指导，都可以随时问我！" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (activeTab === "coach") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history.length, messages.length, activeTab]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue("");
    setSending(true);

    try {
      const historyPayload = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await aiService.chat({
        message: text,
        history: historyPayload.slice(0, -1),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err: any) {
      const errorMsg = err?.message || "AI 助手请求失败，请稍后重试";
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className="flex w-[350px] shrink-0 flex-col border-l border-[#2d2d2d] bg-[#252526]">
      {/* Header tab buttons & close panel */}
      <div className="flex items-center justify-between border-b border-[#2d2d2d] px-3 py-2 bg-[#1e1e1e]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("coach")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "coach"
                ? "bg-[#2d2d2d] text-white"
                : "text-[#8a8a8a] hover:text-[#cccccc]"
            }`}
          >
            诊断报告
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "chat"
                ? "bg-[#2d2d2d] text-white"
                : "text-[#8a8a8a] hover:text-[#cccccc]"
            }`}
          >
            AI 问答
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="rounded p-1 text-[#858585] hover:bg-[#2d2d2d] hover:text-[#cccccc] cursor-pointer"
          title="收起面板"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {activeTab === "coach" ? (
        <>
          <div className="border-b border-[#2d2d2d] p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Command History</p>
            {commandHistory.length === 0 ? (
              <p className="rounded border border-dashed border-[#3c3c3c] px-3 py-3 text-xs text-[#6a6a6a]">
                在终端输入命令后，这里会记录本次实验轨迹。
              </p>
            ) : (
              <div className="max-h-28 space-y-1 overflow-y-auto">
                {commandHistory.slice(-6).map((command, index) => (
                  <p key={`${command}-${index}`} className="truncate rounded bg-[#1e1e1e] px-2 py-1 font-mono text-xs text-[#cccccc]">
                    $ {command}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {history.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <p className="max-w-[240px] text-sm leading-6 text-[#6a6a6a]">
                  AI 分析会在你执行命令后出现。练习步骤会根据命令自动点亮。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(-8).map((item) => (
                  <AnalysisCard key={item.id} item={item} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const { pages, commands } = parseAssistantMessageActions(msg.content);
              
              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded border px-3 py-2 text-xs leading-5 shadow-sm ${
                      isUser
                        ? "border-[#4a4e57] bg-[#222429] text-[#f4f4f5] whitespace-pre-wrap"
                        : "border-transparent bg-[#1f1f1f] text-[#cccccc]"
                    }`}
                  >
                    {isUser ? (
                      msg.content
                    ) : (
                      <>
                        <MarkdownMessage content={msg.content} />
                        {(pages.length > 0 || commands.length > 0) && (
                          <div className="mt-3 border-t border-[#2d2d2d] pt-2">
                            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#8a8a8a]">
                              ⚡ 快捷操作
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {pages.map((p) => (
                                <button
                                  key={`page-${p}`}
                                  onClick={() => router.push(`/textbook?page=${p}`)}
                                  className="flex items-center gap-1 rounded border border-[var(--color-tint-border)] bg-[var(--color-tint-soft)] px-2 py-1 text-[10px] font-medium text-[var(--color-tint-strong)] transition-all hover:bg-[var(--color-tint)] hover:text-white cursor-pointer w-fit"
                                >
                                  📖 查看教材第 {p} 页
                                </button>
                              ))}
                              
                              {commands.map((cmd) => (
                                <button
                                  key={`cmd-${cmd}`}
                                  onClick={() => onPasteSnippet(cmd)}
                                  className="flex items-center gap-1 rounded border border-[#3c3c3c] bg-[rgba(255,255,255,0.03)] px-2 py-1 text-[10px] font-mono text-[#8a8a8a] transition-all hover:border-[#c7342f] hover:bg-[#2d2d2d] hover:text-white cursor-pointer text-left break-all w-full"
                                >
                                  💻 终端执行: {cmd}
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
            })}
            
            {sending && (
              <div className="flex justify-start">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#8a8a8a]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c7342f] animate-pulse" />
                  AI 思考中...
                </span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="border-t border-[#2d2d2d] p-2 bg-[#1e1e1e]">
            <div className="flex items-end gap-1.5 rounded border border-[#3c3c3c] bg-[#252526] px-2 py-1.5 focus-within:border-[#c7342f]">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="发送消息..."
                disabled={sending}
                className="flex-1 resize-none bg-transparent py-0 text-xs leading-5 text-white outline-none placeholder:text-[#6a6a6a] disabled:opacity-40 max-h-20"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || sending}
                className="rounded p-1 text-[#c7342f] hover:bg-[#2d2d2d] disabled:opacity-30 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

export default function PlaygroundPage() {
  const searchParams = useSearchParams();
  const exerciseId = searchParams.get("exercise");
  const snippetId = searchParams.get("snippet");
  const activeExercise = useExerciseStore((state) => state.activeExercise);
  const completedStepIds = useExerciseStore((state) => state.completedStepIds);
  const commandHistory = useExerciseStore((state) => state.commandHistory);
  const setExercise = useExerciseStore((state) => state.setExercise);
  const resetExercise = useExerciseStore((state) => state.resetExercise);
  const recordCommand = useExerciseStore((state) => state.recordCommand);

  const [showExplorer, setShowExplorer] = useState(true);
  const [showCoach, setShowCoach] = useState(true);
  useEffect(() => {
    setExercise(exerciseId ?? textbookExercises[0]?.id ?? null);
  }, [exerciseId, setExercise]);

  const handlePasteSnippet = useCallback((code: string) => {
    window.dispatchEvent(new CustomEvent("terminal-paste", { detail: code }));
  }, []);

  const progressLabel = useMemo(() => {
    if (!activeExercise) return "No lab selected";
    if (completedStepIds.length === activeExercise.steps.length) return "Completed";
    return `${completedStepIds.length}/${activeExercise.steps.length} steps`;
  }, [activeExercise, completedStepIds.length]);

  const backUrl = useMemo(() => {
    if (activeExercise) return `/textbook?page=${activeExercise.textbookPage}`;
    if (snippetId) {
      const snip = getSnippetById(snippetId);
      if (snip) return `/textbook?page=${snip.page}`;
    }
    return "/textbook";
  }, [activeExercise, snippetId]);

  return (
    <div className="relative flex h-[calc(100vh-56px)] bg-[#1e1e1e] text-[#cccccc]" style={{ colorScheme: "dark" }}>
      <ActivityBar
        showExplorer={showExplorer}
        setShowExplorer={setShowExplorer}
        showCoach={showCoach}
        setShowCoach={setShowCoach}
        backUrl={backUrl}
      />
      {showExplorer && (
        <ExerciseExplorer
          activeExercise={activeExercise}
          completedStepIds={completedStepIds}
          snippetId={snippetId}
          onSelect={(id) => {
            const snippetParam = snippetId ? `&snippet=${snippetId}` : "";
            window.history.replaceState(null, "", `/playground?exercise=${id}${snippetParam}`);
            setExercise(id);
          }}
          onReset={resetExercise}
          onPasteSnippet={handlePasteSnippet}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col bg-[#1e1e1e]">
        <header className="flex h-9 shrink-0 items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <span className="rounded bg-[#1e1e1e] px-2 py-1 text-[#cccccc]">terminal</span>
            <span className="truncate text-[#8a8a8a]">{activeExercise?.sourceTitle ?? "openEuler Terminal"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#3a1f1d] px-2 py-1 text-xs text-[#f0aaa4]">{progressLabel}</span>
            <Link href={backUrl} className="rounded-full border border-[#c7342f] bg-transparent px-3 py-1 text-xs font-semibold text-[#c7342f] transition-all hover:bg-[#c7342f] hover:text-white">
              返回教材
            </Link>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-[#1e1e1e] p-3">
          <TerminalPanel onCommand={recordCommand} variant="vscode" />
        </div>
      </main>

      {showCoach ? (
        <CoachPanel
          commandHistory={commandHistory}
          onClose={() => setShowCoach(false)}
          onPasteSnippet={handlePasteSnippet}
        />
      ) : (
        <button
          onClick={() => setShowCoach(true)}
          className="absolute right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-1 rounded-l bg-[#252526] border border-r-0 border-[#c7342f] px-1.5 py-4 text-[10px] font-semibold text-[#c7342f] shadow-lg transition-all hover:bg-[#c7342f] hover:text-white cursor-pointer select-none"
          style={{ writingMode: "vertical-rl" }}
        >
          💬 展开 AI 辅导
        </button>
      )}
    </div>
  );
}

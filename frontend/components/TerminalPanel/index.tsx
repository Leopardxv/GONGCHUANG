"use client";

import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { useTerminal } from "@/hooks/useTerminal";
import { useTerminalStore } from "@/stores/terminalStore";

interface TerminalPanelProps {
  onCommand?: (command: string) => void;
  variant?: "default" | "vscode";
}

export default function TerminalPanel({ onCommand, variant = "default" }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const readyRef = useRef(false);
  const status = useTerminalStore((s) => s.status);

  const onOutput = useCallback((data: string) => {
    termRef.current?.write(data);
  }, []);

  const onSessionReady = useCallback(() => {
    readyRef.current = true;
    fitRef.current?.fit();
  }, []);

  const onError = useCallback((msg: string) => {
    termRef.current?.writeln(`\r\n\x1b[31m[ERROR] ${msg}\x1b[0m\r\n`);
  }, []);

  const { sendInput, sendResize, sendCommand } = useTerminal({ onOutput, onSessionReady, onError });

  const hasInit = useRef(false);
  useEffect(() => {
    if (status === "connected" && !hasInit.current) {
      hasInit.current = true;
      setTimeout(() => {
        readyRef.current = true;
        sendInput("\x0c");

        // Check for auto-execute command from URL query parameter
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const cmdToRun = params.get("command");
          if (cmdToRun) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("terminal-paste", { detail: cmdToRun }));
              // Clean up the command parameter from the URL to prevent re-execution on refresh
              const search = window.location.search.replace(/[?&]command=[^&]+/, "").replace(/^&/, "?");
              const cleanUrl = window.location.pathname + search;
              window.history.replaceState(null, "", cleanUrl);
            }, 600);
          }
        }
      }, 400);
    }
  }, [status, sendInput]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || termRef.current) return;

    const term = new Terminal({
      theme: {
        background: "#1e1e1e",
        foreground: "#cccccc",
        cursor: "#f0aaa4",
        black: "#252526",
        red: "#f85149",
        green: "#8a8a8a",
        yellow: "#8a8a8a",
        blue: "#c7c7c7",
        magenta: "#c7342f",
        cyan: "#9da7ad",
        white: "#cccccc",
        brightBlack: "#3c3c3c",
        brightRed: "#ff7b72",
        brightGreen: "#b7b7b7",
        brightYellow: "#b7b7b7",
        brightBlue: "#eeeeee",
        brightMagenta: "#f0aaa4",
        brightCyan: "#c5cdd2",
        brightWhite: "#f5f5f5",
      },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Consolas', 'Menlo', monospace",
      cursorBlink: true,
      allowProposedApi: true,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(el);
    requestAnimationFrame(() => {
      try { fitAddon.fit(); } catch { /* */ }
    });

    termRef.current = term;
    fitRef.current = fitAddon;

    let line = "";
    term.onData((data) => {
      sendInput(data);
      if (data === "\r") {
        const cmd = line.trim();
        if (cmd) {
          onCommand?.(cmd);
          sendCommand(cmd);
        }
        line = "";
      } else if (data === "\x7f" || data === "\b") {
        line = line.slice(0, -1);
      } else if (data === "\x03" || data === "\x04" || data === "\x1a") {
        line = "";
      } else if (data.charCodeAt(0) >= 32 && data.length === 1) {
        line += data;
      }
    });

    term.onResize(() => {
      if (term.cols > 0 && term.rows > 0) sendResize(term.cols, term.rows);
    });

    const observer = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) {
        try {
          fitAddon.fit();
          if (term.cols > 0 && term.rows > 0) sendResize(term.cols, term.rows);
        } catch { /* */ }
      }
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Paste handler — listen for custom event from playground or textbook
  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      if (!readyRef.current || !termRef.current) return;
      const cmd = e.detail;

      // Send raw input to terminal process with carriage returns to execute it
      const formattedCmd = cmd.replace(/\r?\n/g, "\r") + "\r";
      sendInput(formattedCmd);

      // Also register the command with the AI assistant / database logger and progress tracker
      const lines = cmd.split(/\r?\n/);
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          onCommand?.(trimmed);
          sendCommand(trimmed);
        }
      });
    };
    window.addEventListener("terminal-paste", handler as EventListener);
    return () => window.removeEventListener("terminal-paste", handler as EventListener);
  }, [onCommand, sendCommand, sendInput]);

  const isVSCode = variant === "vscode";

  return (
    <div
      className={`flex h-full flex-col overflow-hidden ${
        isVSCode
          ? "border border-[#2d2d2d] bg-[#1e1e1e]"
          : "rounded-lg border border-[#2d2d2d] bg-[#1e1e1e]"
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-between border-b px-4 py-2 ${
          isVSCode ? "border-[#2d2d2d] bg-[#252526]" : "border-[#2d2d2d] bg-[#181818]"
        }`}
      >
        {isVSCode ? (
          <div className="flex min-w-0 items-center gap-3">
            <span className="border-b border-[#c7342f] pb-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-[#cccccc]">
              Terminal
            </span>
            <span className="truncate text-[11px] text-[#8a8a8a]">openEuler · bash</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f85149]" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#4a4a4a]" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#8b949e]" />
            <span className="ml-2 text-[11px] font-medium text-[#8b949e]">openEuler Terminal</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              status === "connected" ? "bg-[#c7c7c7]" : status === "connecting" ? "bg-[#8a8a8a]" : "bg-[#f85149]"
            }`}
          />
          <span className={isVSCode ? "text-[#8a8a8a]" : "text-[#8b949e]"}>{status}</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 bg-[#1e1e1e]" />
    </div>
  );
}

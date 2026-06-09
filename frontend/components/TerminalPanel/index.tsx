"use client";

import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { useTerminal } from "@/hooks/useTerminal";
import { useTerminalStore } from "@/stores/terminalStore";

export default function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const readyRef = useRef(false);
  const status = useTerminalStore((s) => s.status);

  const onOutput = useCallback((data: string) => {
    if (readyRef.current) termRef.current?.write(data);
  }, []);

  const onSessionReady = useCallback(() => {
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
      }, 400);
    }
  }, [status, sendInput]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || termRef.current) return;

    const term = new Terminal({
      theme: {
        background: "#161b22",
        foreground: "#c9d1d9",
        cursor: "#58a6ff",
        black: "#21262d",
        red: "#f85149",
        green: "#3fb950",
        yellow: "#d2991d",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39d2c0",
        white: "#c9d1d9",
        brightBlack: "#30363d",
        brightRed: "#ff7b72",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
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
        if (cmd) sendCommand(cmd);
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

  return (
    <div className="flex h-full flex-col rounded-lg border border-[#21262d] bg-[#161b22] overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-[#21262d] bg-[#0d1117] px-4 py-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f85149]" />
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#d2991d]" />
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#3fb950]" />
          <span className="ml-2 text-[11px] font-medium text-[#8b949e]">openEuler Terminal</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className={`inline-block h-2 w-2 rounded-full ${status === "connected" ? "bg-[#3fb950]" : status === "connecting" ? "bg-[#d2991d]" : "bg-[#f85149]"}`} />
          <span className="text-[#8b949e]">{status}</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 bg-[#161b22]" />
    </div>
  );
}

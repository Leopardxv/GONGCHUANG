"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTerminalStore } from "@/stores/terminalStore";
import { useAIStore } from "@/stores/aiStore";
import { wsURL } from "@/config/api.config";
import type { CommandAnalysis } from "@/types/ai";

interface TerminalCallbacks {
  onOutput: (data: string) => void;
  onSessionReady: (containerId: string) => void;
  onError: (message: string) => void;
}

export function useTerminal(callbacks: TerminalCallbacks) {
  const setStatus = useTerminalStore((s) => s.setStatus);
  const setSession = useTerminalStore((s) => s.setSession);
  const addLoading = useAIStore((s) => s.addLoading);
  const setResult = useAIStore((s) => s.setResult);

  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const pendingIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* */ }
      wsRef.current = null;
    }

    setStatus("connecting");
    const url = wsURL("/terminal/connect");
    const ws = new WebSocket(url);

    ws.onopen = () => {
      wsRef.current = ws;
      setStatus("connected");
      pingTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const cb = callbacksRef.current;
        switch (msg.type) {
          case "output":
            cb.onOutput(msg.data);
            break;
          case "session":
            setSession("", msg.container_id);
            cb.onSessionReady(msg.container_id);
            break;
          case "error":
            setStatus("error");
            cb.onError(msg.message);
            break;
          case "ai_analysis":
            if (pendingIdRef.current) {
              setResult(pendingIdRef.current, msg.analysis as CommandAnalysis);
              pendingIdRef.current = null;
            }
            break;
          case "pong":
            break;
        }
      } catch { /* */ }
    };

    ws.onclose = () => {
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      wsRef.current = null;
      setStatus("disconnected");
    };

    ws.onerror = () => {
      setStatus("error");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendInput = useCallback((data: string) => {
    wsRef.current?.send(JSON.stringify({ type: "input", data }));
  }, []);

  const sendResize = useCallback((cols: number, rows: number) => {
    wsRef.current?.send(JSON.stringify({ type: "resize", cols, rows }));
  }, []);

  const sendCommand = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      pendingIdRef.current = addLoading(text);
      wsRef.current.send(JSON.stringify({ type: "command", text }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    connect();
    return () => { cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connect, sendInput, sendResize, sendCommand, cleanup };
}

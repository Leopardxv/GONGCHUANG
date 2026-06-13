"use client";

import type { ReactNode } from "react";

const codeRows = [
  "$ systemctl status sshd",
  "$ grep -R \"openEuler\" /etc/os-release",
  "$ find ~/linux-lab -type f | sort",
  "$ ps aux | grep \"[s]leep\"",
  "$ cat access.log | cut -d ' ' -f1 | sort | uniq -c",
  "$ ip route && curl -I https://example.com",
  "$ chmod +x guess.sh && ./guess.sh",
  "$ journalctl -u sshd --since today",
];

function CodeStream({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className={`auth-code-stream ${reverse ? "auth-code-stream-reverse" : ""}`}>
      {[...codeRows, ...codeRows].map((row, index) => (
        <span key={`${row}-${index}`}>{row}</span>
      ))}
    </div>
  );
}

export default function AuthScene({ children }: { children: ReactNode }) {
  return (
    <div className="auth-scene fixed inset-0 overflow-hidden bg-[var(--color-bg)]">
      <div className="auth-orb auth-orb-blue" />
      <div className="auth-orb auth-orb-sage" />
      <div className="auth-orb auth-orb-warm" />

      <div className="auth-grid" />
      <div className="auth-scanline" />

      <div className="auth-code-plane auth-code-plane-a">
        <CodeStream />
        <CodeStream reverse />
        <CodeStream />
      </div>
      <div className="auth-code-plane auth-code-plane-b">
        <CodeStream reverse />
        <CodeStream />
      </div>

      <div className="auth-terminal-card auth-terminal-left">
        <p className="text-[var(--color-tint-strong)]">$ whoami</p>
        <p>student</p>
        <p className="mt-2 text-[var(--color-sage-strong)]">$ pwd</p>
        <p>/home/ict/linux-lab</p>
      </div>

      <div className="auth-terminal-card auth-terminal-right">
        <p className="text-[var(--color-warm)]">● lab online</p>
        <p className="mt-2">xterm session ready</p>
        <p className="text-[var(--color-muted)]">AI coach listening...</p>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        {children}
      </div>
    </div>
  );
}


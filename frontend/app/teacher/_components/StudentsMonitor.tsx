"use client";

import { useState, useMemo } from "react";

/* ── Mock data ── */
interface Student {
  id: string;
  name: string;
  hours: number;
  chapter: string;
  playgroundPassed: number;
  playgroundTotal: number;
  logs: string[];
}

const mockStudents: Student[] = [
  { id: "20260101", name: "张三", hours: 22.5, chapter: "第三章 3.2 权限", playgroundPassed: 5, playgroundTotal: 10, logs: ["[2026-05-30 14:22] 已读完 第一章 概述", "[2026-05-30 15:10] 已通过 Playground 实验 1 (Vim基本操作)", "[2026-05-31 09:30] 已读完 第二章 文件管理"] },
  { id: "20260102", name: "李四", hours: 18.0, chapter: "第二章 2.4 文本", playgroundPassed: 3, playgroundTotal: 10, logs: ["[2026-05-29 10:00] 已读完 第一章 概述", "[2026-05-30 11:30] 已通过 Playground 实验 1 (Vim基本操作)"] },
  { id: "20260103", name: "王五", hours: 25.0, chapter: "第四章 4.1 网络", playgroundPassed: 7, playgroundTotal: 10, logs: ["[2026-05-28 08:00] 已读完 第一章 概述", "[2026-05-29 14:00] 已读完 第二章 文件管理", "[2026-05-30 16:00] 已读完 第三章 权限", "[2026-05-31 10:00] 已通过 Playground 实验 2 (Shell脚本)"] },
  { id: "20260104", name: "赵六", hours: 15.5, chapter: "第二章 2.1 路径", playgroundPassed: 2, playgroundTotal: 10, logs: ["[2026-05-30 09:00] 已读完 第一章 概述"] },
  { id: "20260105", name: "孙七", hours: 20.0, chapter: "第三章 3.1 用户", playgroundPassed: 4, playgroundTotal: 10, logs: ["[2026-05-29 11:00] 已读完 第一章 概述", "[2026-05-30 13:00] 已读完 第二章 文件管理"] },
  { id: "20260106", name: "周八", hours: 12.0, chapter: "第一章 1.3 基础", playgroundPassed: 1, playgroundTotal: 10, logs: ["[2026-05-31 08:00] 已读完 第一章 概述"] },
  { id: "20260107", name: "吴九", hours: 28.0, chapter: "第五章 5.2 进程", playgroundPassed: 8, playgroundTotal: 10, logs: ["[2026-05-27 10:00] 已读完 第一章 概述", "[2026-05-28 12:00] 已读完 第二章 文件管理", "[2026-05-29 15:00] 已读完 第三章 权限", "[2026-05-30 18:00] 已读完 第四章 网络", "[2026-05-31 09:00] 已通过 Playground 实验 3 (进程管理)"] },
];

/* ── Icons ── */
const iconSearch = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/* ── Component ── */
export default function StudentsMonitor() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"hours" | "progress">("hours");
  const [selected, setSelected] = useState<Student | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    let list = mockStudents.filter(
      (s) =>
        s.name.includes(search) || s.id.includes(search),
    );
    list = [...list].sort((a, b) => {
      if (sort === "hours") return b.hours - a.hours;
      return b.playgroundPassed - a.playgroundPassed;
    });
    return list;
  }, [search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
          <span className="text-[var(--color-muted)]">{iconSearch}</span>
          <input
            className="w-56 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
            style={{ caretColor: "var(--color-accent)" }}
            placeholder="输入姓名或学号..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "hours" | "progress")}
          className="border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none"
        >
          <option value="hours">按学时从高到低</option>
          <option value="progress">按通关从高到低</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[4px] border border-[var(--color-border)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-panel-strong)]">
              <th className="px-5 py-3 text-left text-xs font-normal text-[var(--color-muted)]">学号</th>
              <th className="px-5 py-3 text-left text-xs font-normal text-[var(--color-muted)]">姓名</th>
              <th className="px-5 py-3 text-left text-xs font-normal text-[var(--color-muted)]">累计学时</th>
              <th className="px-5 py-3 text-left text-xs font-normal text-[var(--color-muted)]">当前教材进度</th>
              <th className="px-5 py-3 text-left text-xs font-normal text-[var(--color-muted)]">Playground 通关</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((s) => (
              <tr
                key={s.id}
                className="h-12 border-b border-[var(--color-border)] transition-none hover:bg-[var(--color-hover)]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <td className="px-5 text-sm text-[var(--color-text)]">{s.id}</td>
                <td className="px-5 text-sm">
                  <button
                    onClick={() => setSelected(s)}
                    className="text-[var(--color-text)] transition-none hover:text-[var(--color-accent)]"
                  >
                    {s.name}
                  </button>
                </td>
                <td className="px-5 text-sm text-[var(--color-text)]">{s.hours} 小时</td>
                <td className="px-5 text-sm text-[var(--color-text)]">{s.chapter}</td>
                <td className="px-5 text-sm text-[var(--color-text)]">
                  {s.playgroundPassed} / {s.playgroundTotal} 关
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-end gap-3 text-xs">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="text-[var(--color-muted)] disabled:opacity-30 hover:text-[var(--color-text)]"
        >
          {"< Prev"}
        </button>
        <span className="text-[var(--color-muted)]">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="text-[var(--color-muted)] disabled:opacity-30 hover:text-[var(--color-text)]"
        >
          {"Next >"}
        </button>
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-[500px] border border-[var(--color-border)] bg-[var(--color-bg)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--color-text)]">
                {selected.name} · {selected.id}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mb-4 flex gap-6 text-xs">
              <span className="text-[var(--color-muted)]">
                累计学时: <span className="text-[var(--color-text)]">{selected.hours}h</span>
              </span>
              <span className="text-[var(--color-muted)]">
                进度: <span className="text-[var(--color-text)]">{selected.chapter}</span>
              </span>
              <span className="text-[var(--color-muted)]">
                通关: <span className="text-[var(--color-accent)]">{selected.playgroundPassed}/{selected.playgroundTotal}</span>
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 border-t border-[var(--color-border)] pt-4">
              {selected.logs.map((log, i) => (
                <p key={i} className="text-xs text-[var(--color-muted)] font-mono">{log}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

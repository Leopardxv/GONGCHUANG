"use client";

import { useState, useRef } from "react";

/* ── Mock data ── */
interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  gradedCount: number;
  totalCount: number;
  submissions: Submission[];
}

interface Submission {
  studentId: string;
  studentName: string;
  content: string;
  score: number | null;
  comment: string;
}

const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Shell 脚本编写作业",
    description: "请编写一个 Shell 脚本，实现批量重命名文件的功能。\n要求：\n1. 支持递归遍历子目录\n2. 支持按扩展名过滤\n3. 添加日志输出",
    deadline: "2026-06-07",
    gradedCount: 12,
    totalCount: 42,
    submissions: [
      { studentId: "20260101", studentName: "张三", content: "#!/bin/bash\n# Batch rename script\nfor file in *.txt; do\n  mv \"$file\" \"${file%.txt}.md\"\ndone\necho \"Done\"", score: 92, comment: "基本功能实现，但缺少递归和日志。" },
      { studentId: "20260102", studentName: "李四", content: "#!/bin/bash\nfind . -name \"*.txt\" | while read f; do\n  mv \"$f\" \"${f%.txt}.md\"\ndone", score: null, comment: "" },
      { studentId: "20260103", studentName: "王五", content: "#!/bin/bash\n# Advanced renamer\nlog() { echo \"[$(date +%T)] $1\" >> rename.log; }\nrename_recursive() {\n  local dir=$1\n  log \"Scanning $dir\"\n  for file in \"$dir\"/*.txt; do\n    [ -f \"$file\" ] || continue\n    mv \"$file\" \"${file%.txt}.md\"\n    log \"Renamed: $file\"\n  done\n}\nrename_recursive .", score: null, comment: "" },
    ],
  },
  {
    id: "t2",
    title: "进程管理实验报告",
    description: "使用 ps、top、kill 等命令观察和管理系统进程，撰写实验报告。",
    deadline: "2026-06-10",
    gradedCount: 5,
    totalCount: 42,
    submissions: [
      { studentId: "20260101", studentName: "张三", content: "实验报告：进程管理\n\n1. 使用 ps aux 查看所有进程\n2. 使用 top 实时监控\n3. 使用 kill -9 强制终止进程\n\n结论：掌握了基本的进程查看和管理命令。", score: 85, comment: "内容完整，可以适当增加截图。" },
    ],
  },
];

/* ── Component ── */
export default function TasksGrading() {
  const [tasks] = useState<Task[]>(mockTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>("t1");
  const [activeSubmissionIdx, setActiveSubmissionIdx] = useState(0);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const scoreInputRef = useRef<HTMLInputElement>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const submission = selectedTask?.submissions[activeSubmissionIdx] ?? null;

  function handleSaveGrade() {
    if (!selectedTask || !submission) return;
    // In a real app, this would POST to the backend
    const nextIdx = activeSubmissionIdx + 1;
    if (nextIdx < selectedTask.submissions.length) {
      setActiveSubmissionIdx(nextIdx);
      setTimeout(() => scoreInputRef.current?.focus(), 0);
    }
  }

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* ── Left panel: task list (30%) ── */}
      <div className="w-[30%] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <button
          onClick={() => setShowNewTask(true)}
          className="mb-4 w-full border border-[var(--color-accent)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-accent)] transition-none hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-contrast)]"
        >
          + 新建任务
        </button>

        <div className="space-y-1">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTaskId(t.id);
                setActiveSubmissionIdx(0);
              }}
              className={`relative w-full px-4 py-3 text-left text-sm ${
                selectedTaskId === t.id
                  ? "border-l-[3px] border-l-[var(--color-accent)] bg-[var(--color-panel-strong)] text-[var(--color-text)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-panel-strong)] hover:text-[var(--color-text)]"
              }`}
            >
              <p className="truncate">{t.title}</p>
              <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                截止: {t.deadline}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right panel: grading workbench (70%) ── */}
      <div className="flex w-[70%] flex-col bg-[var(--color-bg)]">
        {selectedTask && submission ? (
          <>
            {/* Task meta */}
            <div className="shrink-0 border-b border-[var(--color-border)] px-5 py-3">
              <h2 className="text-sm font-bold text-[var(--color-text)]">
                {selectedTask.title}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                已批改: {selectedTask.gradedCount} / {selectedTask.totalCount}
              </p>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Student roster sidebar */}
              <div className="w-[140px] shrink-0 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-bg)]">
                {selectedTask.submissions.map((s, i) => (
                  <button
                    key={s.studentId}
                    onClick={() => setActiveSubmissionIdx(i)}
                    className={`w-full px-3 py-2 text-left text-xs ${
                      i === activeSubmissionIdx
                        ? "bg-[var(--color-panel-strong)] text-[var(--color-accent)]"
                        : "text-[var(--color-muted)] hover:bg-[var(--color-panel-strong)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <span className="block truncate">{s.studentId}</span>
                    <span className="block truncate">{s.studentName}</span>
                  </button>
                ))}
              </div>

              {/* Code viewer + grading */}
              <div className="flex flex-1 flex-col overflow-hidden p-5">
                {/* Code viewer */}
                <div className="mb-4 h-[400px] shrink-0 overflow-y-auto rounded-[4px] border border-[var(--color-border)] bg-[var(--color-code-bg)] p-4">
                  <pre className="font-mono text-sm text-[var(--color-accent)] whitespace-pre-wrap leading-relaxed">
                    {submission.content}
                  </pre>
                </div>

                {/* Grading bar */}
                <div className="flex items-end gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[var(--color-muted)]">得分</label>
                    <div className="flex items-center gap-1 border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5">
                      <input
                        ref={scoreInputRef}
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={submission.score ?? ""}
                        className="w-14 bg-transparent text-sm text-[var(--color-text)] outline-none"
                        style={{ caretColor: "var(--color-accent)" }}
                      />
                      <span className="text-xs text-[var(--color-muted)]">/ 100 分</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-[11px] text-[var(--color-muted)]">评语</label>
                    <input
                      defaultValue={submission.comment}
                      placeholder="键入教师评语..."
                      className="border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                      style={{ caretColor: "var(--color-accent)" }}
                    />
                  </div>

                  <button
                    onClick={handleSaveGrade}
                    className="shrink-0 bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-[var(--color-accent-contrast)] transition-none hover:opacity-90"
                  >
                    保存并批改下一位
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-[var(--color-muted)]">
              选择左侧任务开始批改
            </p>
          </div>
        )}
      </div>

      {/* New task modal */}
      {showNewTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowNewTask(false)}
        >
          <div
            className="w-[400px] border border-[var(--color-border)] bg-[var(--color-bg)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-sm font-bold text-[var(--color-text)]">新建任务</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">任务名称</label>
                <input
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none"
                  style={{ caretColor: "var(--color-accent)" }}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="输入任务名称"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">作业要求</label>
                <textarea
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none resize-none"
                  style={{ caretColor: "var(--color-accent)" }}
                  rows={4}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="输入作业文本要求"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">截止时间</label>
                <input
                  type="date"
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowNewTask(false)}
                  className="border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)]"
                >
                  取消
                </button>
                <button
                  onClick={() => setShowNewTask(false)}
                  className="border border-[var(--color-accent)] bg-[var(--color-bg)] px-4 py-2 text-sm text-[var(--color-accent)]"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

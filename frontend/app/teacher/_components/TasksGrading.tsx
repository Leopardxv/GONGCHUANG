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
      <div className="w-[30%] shrink-0 border-r border-[#2D2D2D] bg-[#121212] p-4">
        <button
          onClick={() => setShowNewTask(true)}
          className="mb-4 w-full border border-[#00FF66] bg-[#121212] px-4 py-2.5 text-sm text-[#00FF66] transition-none hover:bg-[#00FF66] hover:text-[#121212]"
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
                  ? "border-l-[3px] border-l-[#00FF66] bg-[#1A1A1A] text-[#FFFFFF]"
                  : "text-[#8E918F] hover:bg-[#1A1A1A] hover:text-[#FFFFFF]"
              }`}
            >
              <p className="truncate">{t.title}</p>
              <p className="mt-0.5 text-[11px] text-[#8E918F]">
                截止: {t.deadline}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right panel: grading workbench (70%) ── */}
      <div className="flex w-[70%] flex-col bg-[#121212]">
        {selectedTask && submission ? (
          <>
            {/* Task meta */}
            <div className="shrink-0 border-b border-[#2D2D2D] px-5 py-3">
              <h2 className="text-sm font-bold text-[#FFFFFF]">
                {selectedTask.title}
              </h2>
              <p className="mt-1 text-xs text-[#8E918F]">
                已批改: {selectedTask.gradedCount} / {selectedTask.totalCount}
              </p>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Student roster sidebar */}
              <div className="w-[140px] shrink-0 overflow-y-auto border-r border-[#2D2D2D] bg-[#121212]">
                {selectedTask.submissions.map((s, i) => (
                  <button
                    key={s.studentId}
                    onClick={() => setActiveSubmissionIdx(i)}
                    className={`w-full px-3 py-2 text-left text-xs ${
                      i === activeSubmissionIdx
                        ? "bg-[#1A1A1A] text-[#00FF66]"
                        : "text-[#8E918F] hover:bg-[#1A1A1A] hover:text-[#FFFFFF]"
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
                <div className="mb-4 h-[400px] shrink-0 overflow-y-auto rounded-[4px] border border-[#2D2D2D] bg-[#050505] p-4">
                  <pre className="font-mono text-sm text-[#00FF66] whitespace-pre-wrap leading-relaxed">
                    {submission.content}
                  </pre>
                </div>

                {/* Grading bar */}
                <div className="flex items-end gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#8E918F]">得分</label>
                    <div className="flex items-center gap-1 border border-[#2D2D2D] bg-[#121212] px-2 py-1.5">
                      <input
                        ref={scoreInputRef}
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={submission.score ?? ""}
                        className="w-14 bg-transparent text-sm text-[#FFFFFF] outline-none"
                        style={{ caretColor: "#00FF66" }}
                      />
                      <span className="text-xs text-[#8E918F]">/ 100 分</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-[11px] text-[#8E918F]">评语</label>
                    <input
                      defaultValue={submission.comment}
                      placeholder="键入教师评语..."
                      className="border border-[#2D2D2D] bg-[#121212] px-3 py-1.5 text-sm text-[#FFFFFF] outline-none placeholder:text-[#8E918F]"
                      style={{ caretColor: "#00FF66" }}
                    />
                  </div>

                  <button
                    onClick={handleSaveGrade}
                    className="shrink-0 bg-[#00FF66] px-5 py-2 text-sm font-medium text-[#121212] transition-none hover:opacity-90"
                  >
                    保存并批改下一位
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-[#8E918F]">
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
            className="w-[400px] border border-[#2D2D2D] bg-[#121212] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-sm font-bold text-[#FFFFFF]">新建任务</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-[#8E918F]">任务名称</label>
                <input
                  className="w-full border border-[#2D2D2D] bg-[#121212] px-3 py-2 text-sm text-[#FFFFFF] outline-none"
                  style={{ caretColor: "#00FF66" }}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="输入任务名称"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#8E918F]">作业要求</label>
                <textarea
                  className="w-full border border-[#2D2D2D] bg-[#121212] px-3 py-2 text-sm text-[#FFFFFF] outline-none resize-none"
                  style={{ caretColor: "#00FF66" }}
                  rows={4}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="输入作业文本要求"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#8E918F]">截止时间</label>
                <input
                  type="date"
                  className="w-full border border-[#2D2D2D] bg-[#121212] px-3 py-2 text-sm text-[#FFFFFF] outline-none"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowNewTask(false)}
                  className="border border-[#2D2D2D] px-4 py-2 text-sm text-[#8E918F]"
                >
                  取消
                </button>
                <button
                  onClick={() => setShowNewTask(false)}
                  className="border border-[#00FF66] bg-[#121212] px-4 py-2 text-sm text-[#00FF66]"
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

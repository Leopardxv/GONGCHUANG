"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";

/* ── Mock data ── */
const stats = {
  activeStudents: 32,
  totalStudents: 45,
  avgHours: 14.5,
  submissionRate: 88,
};

const weeklyHours = [
  { date: "05-24", hours: 42 },
  { date: "05-25", hours: 38 },
  { date: "05-26", hours: 45 },
  { date: "05-27", hours: 52 },
  { date: "05-28", hours: 48 },
  { date: "05-29", hours: 55 },
  { date: "05-30", hours: 60 },
];

const chapterReads = [
  { chapter: "Ch1", readers: 42 },
  { chapter: "Ch2", readers: 38 },
  { chapter: "Ch3", readers: 35 },
  { chapter: "Ch4", readers: 28 },
  { chapter: "Ch5", readers: 22 },
  { chapter: "Ch6", readers: 18 },
  { chapter: "Ch7", readers: 12 },
  { chapter: "Ch8", readers: 8 },
];

const riskStudents = [
  { name: "周八", reason: "连续 3 天未完成实验", progress: "1 / 10" },
  { name: "赵六", reason: "教材停留在第二章", progress: "2 / 10" },
  { name: "李四", reason: "作业待补交", progress: "3 / 10" },
];

const todoItems = [
  { title: "Shell 脚本编写作业", meta: "30 份待批改 · 截止 06-07" },
  { title: "进程管理实验报告", meta: "37 份待批改 · 截止 06-10" },
  { title: "Ch3 管道与重定向实验", meta: "12 名学生未完成" },
];

const activities = [
  "张三完成 Ch5 Shell 脚本实验",
  "王五提交进程管理实验报告",
  "李四在教材 Ch3 发起 AI 辅导",
  "赵六完成文件管理基础练习",
];

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function useThemeTick() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setTick((value) => value + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return tick;
}

/* ── ECharts wrapper ── */
function useECharts() {
  const ref = useRef<HTMLDivElement>(null);
  const instance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    instance.current = echarts.init(ref.current, undefined, { renderer: "canvas" });

    function onResize() {
      instance.current?.resize();
    }
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      instance.current?.dispose();
    };
  }, []);

  return { ref, instance };
}

/* ── Line chart: weekly hours ── */
function WeeklyHoursChart() {
  const { ref, instance } = useECharts();
  const themeTick = useThemeTick();

  useEffect(() => {
    if (!instance.current) return;
    const border = cssVar("--color-border");
    const muted = cssVar("--color-muted");
    const panelStrong = cssVar("--color-panel-strong");
    const accent = cssVar("--color-tint");

    instance.current.setOption({
      backgroundColor: "transparent",
      grid: { top: 20, right: 20, bottom: 30, left: 50 },
      xAxis: {
        type: "category",
        data: weeklyHours.map((d) => d.date),
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: { color: muted, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        name: "小时",
        nameTextStyle: { color: muted, fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: panelStrong } },
        axisLabel: { color: muted, fontSize: 11 },
      },
      series: [
        {
          type: "line",
          data: weeklyHours.map((d) => d.hours),
          lineStyle: { color: accent, width: 3 },
          symbol: "circle",
          symbolSize: 4,
          itemStyle: { color: accent },
          areaStyle: undefined,
        },
      ],
    }, true);
  }, [instance, themeTick]);

  return <div ref={ref} className="h-full w-full" />;
}

/* ── Bar chart: chapter reads ── */
function ChapterReadsChart() {
  const { ref, instance } = useECharts();
  const themeTick = useThemeTick();

  useEffect(() => {
    if (!instance.current) return;
    const avg = chapterReads.reduce((s, c) => s + c.readers, 0) / chapterReads.length;
    const border = cssVar("--color-border");
    const muted = cssVar("--color-muted");
    const panelStrong = cssVar("--color-panel-strong");
    const danger = cssVar("--color-warm");

    instance.current.setOption({
      backgroundColor: "transparent",
      grid: { top: 10, right: 10, bottom: 30, left: 40 },
      xAxis: {
        type: "category",
        data: chapterReads.map((d) => d.chapter),
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: { color: muted, fontSize: 10 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 50,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: panelStrong } },
        axisLabel: { color: muted, fontSize: 10 },
      },
      series: [
        {
          type: "bar",
          data: chapterReads.map((d) => ({
            value: d.readers,
            itemStyle: {
              color: d.readers < avg ? danger : cssVar("--color-tint"),
            },
          })),
          barWidth: 20,
        },
      ],
    }, true);
  }, [instance, themeTick]);

  return <div ref={ref} className="h-full w-full" />;
}

/* ── Dashboard ── */
export default function Dashboard() {
  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_50%_-10%,var(--color-panel-strong)_0%,var(--color-bg)_42%)] px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Teaching Overview</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-[var(--color-text)]">班级学情总览</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
            聚合教材阅读、xterm 实验、AI 辅导与作业批改状态，帮助教师快速定位需要跟进的学生。
          </p>
        </div>
        <div className="surface rounded-[22px] px-5 py-4 text-right">
          <p className="text-xs text-[var(--color-muted)]">当前课程</p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">Operating System Basics and Practice</p>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-4 gap-4">
        {[
          ["今日活跃", `${stats.activeStudents} / ${stats.totalStudents}`, "班级在线学习人数"],
          ["人均学时", `${stats.avgHours} hrs`, "近七天学习均值"],
          ["任务提交率", `${stats.submissionRate}%`, "全部开放任务"],
          ["待关注学生", `${riskStudents.length}`, "低进度或缺交"],
        ].map(([label, value, desc]) => (
          <div key={label} className="surface-soft rounded-[24px] p-5">
            <p className="text-sm text-[var(--color-muted)]">{label}</p>
            <p className="mt-3 font-mono text-3xl leading-none text-[var(--color-text)]">{value}</p>
            <p className="mt-4 text-xs text-[var(--color-subtle)]">{desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
        <section className="space-y-6">
          <div className="surface rounded-[28px] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">全班学时趋势</h2>
                <p className="mt-2 text-sm text-[var(--color-muted)]">近 7 天学生学习时长变化</p>
              </div>
              <span className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)]">
                自动汇总
              </span>
            </div>
            <div className="h-[260px]">
              <WeeklyHoursChart />
            </div>
          </div>

          <div className="surface rounded-[28px] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">教材章节覆盖</h2>
                <p className="mt-2 text-sm text-[var(--color-muted)]">显示各章节阅读人数，低于均值的章节会被标记为需跟进。</p>
              </div>
            </div>
            <div className="h-[230px]">
              <ChapterReadsChart />
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="surface rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">待处理事项</h2>
            <div className="mt-5 space-y-3">
              {todoItems.map((item) => (
                <div key={item.title} className="surface-soft tint-panel rounded-[18px] p-4">
                  <p className="text-sm font-medium text-[var(--color-text)]">{item.title}</p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">{item.meta}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">需关注学生</h2>
            <div className="mt-5 space-y-4">
              {riskStudents.map((student) => (
                <div key={student.name} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{student.name}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{student.reason}</p>
                  </div>
                  <span className="rounded-full border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-text)]">
                    {student.progress}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">最近学习动态</h2>
            <div className="mt-5 space-y-3">
              {activities.map((activity) => (
                <p key={activity} className="rounded-2xl bg-[var(--color-panel-soft)] px-4 py-3 text-sm text-[var(--color-muted)]">
                  {activity}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

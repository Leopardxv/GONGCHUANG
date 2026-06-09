"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!instance.current) return;
    instance.current.setOption({
      backgroundColor: "transparent",
      grid: { top: 20, right: 20, bottom: 30, left: 50 },
      xAxis: {
        type: "category",
        data: weeklyHours.map((d) => d.date),
        axisLine: { lineStyle: { color: "#2D2D2D" } },
        axisTick: { show: false },
        axisLabel: { color: "#8E918F", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        name: "小时",
        nameTextStyle: { color: "#8E918F", fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "#1A1A1A" } },
        axisLabel: { color: "#8E918F", fontSize: 11 },
      },
      series: [
        {
          type: "line",
          data: weeklyHours.map((d) => d.hours),
          lineStyle: { color: "#00FF66", width: 3 },
          symbol: "circle",
          symbolSize: 4,
          itemStyle: { color: "#00FF66" },
          areaStyle: undefined,
        },
      ],
    }, true);
  }, [instance]);

  return <div ref={ref} className="h-full w-full" />;
}

/* ── Bar chart: chapter reads ── */
function ChapterReadsChart() {
  const { ref, instance } = useECharts();

  useEffect(() => {
    if (!instance.current) return;
    const avg = chapterReads.reduce((s, c) => s + c.readers, 0) / chapterReads.length;
    instance.current.setOption({
      backgroundColor: "transparent",
      grid: { top: 10, right: 10, bottom: 30, left: 40 },
      xAxis: {
        type: "category",
        data: chapterReads.map((d) => d.chapter),
        axisLine: { lineStyle: { color: "#2D2D2D" } },
        axisTick: { show: false },
        axisLabel: { color: "#8E918F", fontSize: 10 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 50,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "#1A1A1A" } },
        axisLabel: { color: "#8E918F", fontSize: 10 },
      },
      series: [
        {
          type: "bar",
          data: chapterReads.map((d) => ({
            value: d.readers,
            itemStyle: {
              color: d.readers < avg ? "#8B0000" : "#757575",
            },
          })),
          barWidth: 20,
        },
      ],
    }, true);
  }, [instance]);

  return <div ref={ref} className="h-full w-full" />;
}

/* ── Dashboard ── */
export default function Dashboard() {
  return (
    <div className="p-6">
      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-5">
        <div className="rounded-[4px] border border-[#2D2D2D] bg-[#1A1A1A] p-5">
          <p className="mb-2 text-xs text-[#8E918F]">今日活跃 / 总人数</p>
          <p className="font-mono text-[32px] text-[#00FF66] leading-tight">
            {stats.activeStudents} / {stats.totalStudents}
          </p>
        </div>

        <div className="rounded-[4px] border border-[#2D2D2D] bg-[#1A1A1A] p-5">
          <p className="mb-2 text-xs text-[#8E918F]">班级人均学时</p>
          <p className="font-mono text-[32px] text-[#FFFFFF] leading-tight">
            {stats.avgHours} hrs
          </p>
        </div>

        <div className="rounded-[4px] border border-[#2D2D2D] bg-[#1A1A1A] p-5">
          <p className="mb-2 text-xs text-[#8E918F]">任务总体提交率</p>
          <p className="font-mono text-[32px] text-[#FFFFFF] leading-tight">
            {stats.submissionRate} %
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="flex gap-5" style={{ height: 380 }}>
        <div className="flex-[7] rounded-[4px] border border-[#2D2D2D] bg-[#1A1A1A] p-4">
          <p className="mb-3 text-xs text-[#8E918F]">全班学时趋势图 · 近 7 天</p>
          <div className="h-[calc(100%-24px)]">
            <WeeklyHoursChart />
          </div>
        </div>

        <div className="flex-[3] rounded-[4px] border border-[#2D2D2D] bg-[#1A1A1A] p-4">
          <p className="mb-3 text-xs text-[#8E918F]">教材章节阅读率</p>
          <div className="h-[calc(100%-24px)]">
            <ChapterReadsChart />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Dashboard from "./_components/Dashboard";
import StudentsMonitor from "./_components/StudentsMonitor";
import TasksGrading from "./_components/TasksGrading";

export default function TeacherPage() {
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    function handler(e: Event) {
      setView((e as CustomEvent).detail);
    }
    window.addEventListener("teacher-nav", handler);
    return () => window.removeEventListener("teacher-nav", handler);
  }, []);

  return (
    <>
      {view === "dashboard" && <Dashboard />}
      {view === "students" && <StudentsMonitor />}
      {view === "tasks" && <TasksGrading />}
    </>
  );
}

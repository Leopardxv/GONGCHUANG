export interface User {
  id: string;
  username: string;
  role: "student" | "teacher";
  status: "active" | "inactive";
  created_at: string;
}

export interface UserStats {
  today_duration_minutes: number;
  today_commands: number;
  total_analyses: number;
  textbook_progress: number;
}

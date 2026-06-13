import { api } from "./api";

export interface Submission {
  id: string;
  task_id: string;
  student_id: string;
  student_name: string;
  content: string;
  score: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  created_at: string;
  updated_at: string;
  submissions?: Submission[]; // Present for teachers
  submission?: Submission | null; // Present for students
}

export const taskService = {
  getTasks: () => api.get<Task[]>("/tasks"),
  createTask: (title: string, description: string, deadline: string) =>
    api.post<Task>("/tasks", { title, description, deadline }),
  submitTask: (taskId: string, content: string) =>
    api.post<Submission>(`/tasks/${taskId}/submit`, { content }),
  gradeSubmission: (taskId: string, studentId: string, score: number, comment: string) =>
    api.post<Submission>(`/tasks/${taskId}/grade`, { student_id: studentId, score, comment }),
};

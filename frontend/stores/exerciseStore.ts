import { create } from "zustand";
import { getExerciseById, type TextbookExercise } from "@/data/exercises";

interface ExerciseState {
  activeExercise: TextbookExercise | null;
  completedStepIds: string[];
  commandHistory: string[];
  setExercise: (exerciseId: string | null) => void;
  resetExercise: () => void;
  recordCommand: (command: string) => void;
}

function commandMatches(command: string, patterns: string[]) {
  const normalized = command.replace(/\s+/g, " ").trim().toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern.toLowerCase()));
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  activeExercise: null,
  completedStepIds: [],
  commandHistory: [],
  setExercise: (exerciseId) => {
    const exercise = getExerciseById(exerciseId);
    set({
      activeExercise: exercise,
      completedStepIds: [],
      commandHistory: [],
    });
  },
  resetExercise: () => set({ completedStepIds: [], commandHistory: [] }),
  recordCommand: (command) => {
    const { activeExercise, completedStepIds, commandHistory } = get();
    if (!activeExercise) return;

    const nextCompleted = [...completedStepIds];
    for (const step of activeExercise.steps) {
      if (nextCompleted.includes(step.id)) continue;
      if (commandMatches(command, step.match)) {
        nextCompleted.push(step.id);
        break;
      }
    }

    set({
      completedStepIds: nextCompleted,
      commandHistory: [...commandHistory.slice(-19), command],
    });
  },
}));


import { create } from "zustand";
import { playgroundLayout, type PageLayout } from "@/config/layout.config";

interface LayoutState {
  playgroundLayout: PageLayout;
}

export const useLayoutStore = create<LayoutState>(() => ({
  playgroundLayout,
}));

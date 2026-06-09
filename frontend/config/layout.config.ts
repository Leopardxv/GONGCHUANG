export interface PanelConfig {
  id: string;
  component: string;
  position: "left" | "right" | "top" | "bottom";
  ratio: number;
  visible: boolean;
}

export interface PageLayout {
  direction: "horizontal" | "vertical";
  panels: PanelConfig[];
}

export const playgroundLayout: PageLayout = {
  direction: "horizontal",
  panels: [
    { id: "terminal", component: "TerminalPanel", position: "left", ratio: 0.55, visible: true },
    { id: "aiAnalysis", component: "AIAnalysisPanel", position: "right", ratio: 0.45, visible: true },
  ],
};

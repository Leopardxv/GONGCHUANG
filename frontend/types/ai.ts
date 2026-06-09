export interface CommandAnalysis {
  id: string;
  command_explanation: string;
  syntax_fix: string | null;
  error_reason: string | null;
  best_practice: string;
  learning_recommendation: string;
  related_section_id: string | null;
}

export type EditorIssueCategory =
  | "plot_hole"
  | "character_consistency"
  | "pacing"
  | "dialogue"
  | "repetition"
  | "grammar"
  | "readability";

export type EditorIssueSeverity = "low" | "medium" | "high";

export interface EditorIssue {
  category: EditorIssueCategory;
  severity: EditorIssueSeverity;
  problem: string;
  explanation: string;
  suggestedFix: string;
}

export interface ChapterAnalysis {
  overallScore: number;
  plotScore: number;
  characterScore: number;
  pacingScore: number;
  grammarScore: number;
  readabilityScore: number;
  issues: EditorIssue[];
}

export type ImprovementFocus =
  | "more_dialogue"
  | "more_action"
  | "more_emotion"
  | "better_pacing"
  | "more_suspense"
  | "more_descriptive";

export const IMPROVEMENT_OPTIONS: {
  id: ImprovementFocus;
  label: string;
  description: string;
}[] = [
  {
    id: "more_dialogue",
    label: "More dialogue",
    description: "Increase character conversations and voice",
  },
  {
    id: "more_action",
    label: "More action",
    description: "Add movement, tension, and physical events",
  },
  {
    id: "more_emotion",
    label: "More emotion",
    description: "Deepen internal feelings and emotional beats",
  },
  {
    id: "better_pacing",
    label: "Better pacing",
    description: "Balance slow and fast sections for flow",
  },
  {
    id: "more_suspense",
    label: "More suspense",
    description: "Build mystery, stakes, and reader anticipation",
  },
  {
    id: "more_descriptive",
    label: "More descriptive writing",
    description: "Enrich setting, sensory detail, and atmosphere",
  },
];

export type EditorReportType = "analysis" | "improvement";

export interface EditorReport {
  id: string;
  book_id: string;
  user_id: string;
  chapter_number: number;
  report_type: EditorReportType;
  analysis: ChapterAnalysis | null;
  improvement_focus: ImprovementFocus[];
  improved_content: string | null;
  created_at: string;
}

export const ISSUE_CATEGORY_LABELS: Record<EditorIssueCategory, string> = {
  plot_hole: "Plot hole",
  character_consistency: "Character consistency",
  pacing: "Pacing",
  dialogue: "Dialogue quality",
  repetition: "Repetitive wording",
  grammar: "Grammar",
  readability: "Readability",
};

import { z } from "zod";
import type { EditorIssueCategory, EditorIssueSeverity } from "@/lib/editor/types";

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.min(100, Math.max(0, n)));
}

function normalizeCategory(value: unknown): EditorIssueCategory {
  const raw = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  const map: Record<string, EditorIssueCategory> = {
    plot_hole: "plot_hole",
    plot_holes: "plot_hole",
    plot: "plot_hole",
    character_consistency: "character_consistency",
    character: "character_consistency",
    characters: "character_consistency",
    pacing: "pacing",
    pace: "pacing",
    dialogue: "dialogue",
    dialogue_quality: "dialogue",
    repetition: "repetition",
    repetitive_wording: "repetition",
    repetitive: "repetition",
    grammar: "grammar",
    grammar_issues: "grammar",
    readability: "readability",
  };

  return map[raw] ?? "readability";
}

function normalizeSeverity(value: unknown): EditorIssueSeverity {
  const raw = String(value ?? "").toLowerCase().trim();
  if (raw === "high" || raw === "medium" || raw === "low") return raw;
  if (raw.includes("high") || raw.includes("critical")) return "high";
  if (raw.includes("low") || raw.includes("minor")) return "low";
  return "medium";
}

export const editorIssueSchema = z.object({
  category: z.preprocess(normalizeCategory, z.enum([
    "plot_hole",
    "character_consistency",
    "pacing",
    "dialogue",
    "repetition",
    "grammar",
    "readability",
  ])),
  severity: z.preprocess(normalizeSeverity, z.enum(["low", "medium", "high"])),
  problem: z.preprocess(
    (v) => String(v ?? "Issue detected"),
    z.string().min(1)
  ),
  explanation: z.preprocess(
    (v) => String(v ?? ""),
    z.string()
  ),
  suggestedFix: z.preprocess(
    (v) =>
      String(v ?? "Revise this section for clarity and consistency."),
    z.string()
  ),
});

export const chapterAnalysisSchema = z.object({
  overallScore: z.preprocess(clampScore, z.number().min(0).max(100)),
  plotScore: z.preprocess(clampScore, z.number().min(0).max(100)),
  characterScore: z.preprocess(clampScore, z.number().min(0).max(100)),
  pacingScore: z.preprocess(clampScore, z.number().min(0).max(100)),
  grammarScore: z.preprocess(clampScore, z.number().min(0).max(100)),
  readabilityScore: z.preprocess(clampScore, z.number().min(0).max(100)),
  issues: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(editorIssueSchema)
  ),
});

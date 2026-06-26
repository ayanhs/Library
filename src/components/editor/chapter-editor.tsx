"use client";

import {
  Check,
  FileSearch,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ErrorAlert, SuccessAlert } from "@/components/auth/auth-card";
import { ChapterReader } from "@/components/chapters/chapter-reader";
import { IssueList } from "@/components/editor/issue-list";
import { ScoreRing } from "@/components/editor/score-ring";
import type { BookChapter } from "@/lib/chapters/types";
import {
  analyzeChapter,
  applyImprovedChapter,
  improveChapter,
} from "@/lib/editor/actions";
import type {
  ChapterAnalysis,
  EditorReport,
  ImprovementFocus,
} from "@/lib/editor/types";
import { IMPROVEMENT_OPTIONS } from "@/lib/editor/types";
import { cn } from "@/lib/utils";

interface ChapterEditorProps {
  bookId: string;
  chapters: BookChapter[];
  initialReports: EditorReport[];
}

export function ChapterEditor({
  bookId,
  chapters,
  initialReports,
}: ChapterEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedChapter, setSelectedChapter] = useState<number | null>(
    chapters.find((c) => c.content.trim())?.chapter_number ?? null
  );
  const [analysis, setAnalysis] = useState<ChapterAnalysis | null>(null);
  const [improvedContent, setImprovedContent] = useState<string | null>(null);
  const [focusAreas, setFocusAreas] = useState<ImprovementFocus[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showImproved, setShowImproved] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "analyze" | "improve" | "apply" | null
  >(null);

  const writableChapters = useMemo(
    () => chapters.filter((c) => c.content.trim().length > 0),
    [chapters]
  );

  const activeChapter = selectedChapter
    ? chapters.find((c) => c.chapter_number === selectedChapter)
    : undefined;

  const loadLatestAnalysis = (chapterNum: number) => {
    const reports = initialReports.filter(
      (r) => r.chapter_number === chapterNum
    );
    const latest = reports.find((r) => r.report_type === "analysis");
    if (latest?.analysis) {
      setAnalysis(latest.analysis);
    } else {
      setAnalysis(null);
    }
    const latestImprove = reports.find(
      (r) => r.report_type === "improvement" && r.improved_content
    );
    setImprovedContent(latestImprove?.improved_content ?? null);
    setShowImproved(false);
  };

  useEffect(() => {
    if (!selectedChapter) return;
    const reports = initialReports.filter(
      (r) => r.chapter_number === selectedChapter
    );
    const latest = reports.find((r) => r.report_type === "analysis");
    setAnalysis(latest?.analysis ?? null);
    const latestImprove = reports.find(
      (r) => r.report_type === "improvement" && r.improved_content
    );
    setImprovedContent(latestImprove?.improved_content ?? null);
    setShowImproved(false);
  }, [selectedChapter, initialReports]);

  const handleChapterChange = (num: number) => {
    setSelectedChapter(num);
    setError("");
    setSuccess("");
    loadLatestAnalysis(num);
  };

  const handleAnalyze = () => {
    if (!selectedChapter) return;
    setError("");
    setSuccess("");
    setPendingAction("analyze");
    startTransition(async () => {
      const result = await analyzeChapter(bookId, selectedChapter);
      setPendingAction(null);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setAnalysis(result.data!.analysis);
      setSuccess("Analysis complete and saved.");
      router.refresh();
    });
  };

  const toggleFocus = (id: ImprovementFocus) => {
    setFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleImprove = () => {
    if (!selectedChapter) return;
    setError("");
    setSuccess("");
    setPendingAction("improve");
    startTransition(async () => {
      const result = await improveChapter(
        bookId,
        selectedChapter,
        focusAreas
      );
      setPendingAction(null);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setImprovedContent(result.data!.improvedContent);
      setShowImproved(true);
      setSuccess("Improved version generated and saved.");
      router.refresh();
    });
  };

  const handleApply = () => {
    if (!selectedChapter || !improvedContent) return;
    setError("");
    setPendingAction("apply");
    startTransition(async () => {
      const result = await applyImprovedChapter(
        bookId,
        selectedChapter,
        improvedContent
      );
      setPendingAction(null);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSuccess("Improved chapter applied to your book.");
      setShowImproved(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Editor</h1>
        <p className="mt-1 text-sm text-muted">
          Analyze chapters for issues and generate targeted improvements.
        </p>
      </div>

      {writableChapters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
          <FileSearch className="mx-auto mb-3 h-10 w-10 text-muted/40" />
          <p className="font-medium text-foreground/80">No chapters yet</p>
          <p className="mt-1 text-sm text-muted">
            Write at least one chapter on the Project tab to use the editor.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label
              htmlFor="chapter-select"
              className="block text-sm font-medium text-foreground/90"
            >
              Select chapter
            </label>
            <select
              id="chapter-select"
              value={selectedChapter ?? ""}
              onChange={(e) => handleChapterChange(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm focus:border-purple/50 focus:outline-none focus:ring-2 focus:ring-purple/20"
            >
              {writableChapters.map((c) => (
                <option key={c.id} value={c.chapter_number}>
                  Chapter {c.chapter_number}: {c.title}
                </option>
              ))}
            </select>
          </div>

          {activeChapter && (
            <ChapterReader
              title={`Chapter ${activeChapter.chapter_number}: ${activeChapter.title}`}
              content={activeChapter.content}
            />
          )}

          {error && <ErrorAlert message={error} />}
          {success && <SuccessAlert message={success} />}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isPending || !selectedChapter}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white",
                "bg-gradient-to-r from-purple to-blue hover:shadow-lg hover:shadow-purple/25",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {pendingAction === "analyze" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSearch className="h-4 w-4" />
              )}
              Analyze Chapter
            </button>
          </div>

          {pendingAction === "analyze" && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-purple-light" />
              Analyzing chapter with AI…
            </div>
          )}

          {analysis && pendingAction !== "analyze" && (
            <section className="space-y-6">
              <h2 className="text-lg font-semibold">Analysis Results</h2>

              <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-white/5 bg-white/[0.02] p-6 sm:gap-8">
                <ScoreRing
                  score={analysis.overallScore}
                  label="Overall"
                  size="lg"
                />
                <div className="hidden h-16 w-px bg-white/10 sm:block" />
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                  <ScoreRing score={analysis.plotScore} label="Plot" />
                  <ScoreRing score={analysis.characterScore} label="Character" />
                  <ScoreRing score={analysis.pacingScore} label="Pacing" />
                  <ScoreRing score={analysis.grammarScore} label="Grammar" />
                  <ScoreRing
                    score={analysis.readabilityScore}
                    label="Readability"
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-muted">
                  Detected issues ({analysis.issues.length})
                </h3>
                <IssueList issues={analysis.issues} />
              </div>
            </section>
          )}

          <section className="space-y-4 border-t border-white/5 pt-8">
            <div>
              <h2 className="text-lg font-semibold">Improve Chapter</h2>
              <p className="mt-1 text-sm text-muted">
                Select focus areas, then generate an improved version that
                preserves your story.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {IMPROVEMENT_OPTIONS.map((opt) => {
                const selected = focusAreas.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleFocus(opt.id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      selected
                        ? "border-purple/40 bg-purple/10"
                        : "border-white/5 bg-white/[0.02] hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{opt.label}</span>
                      {selected && (
                        <Check className="h-4 w-4 shrink-0 text-purple-light" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{opt.description}</p>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleImprove}
              disabled={isPending || !selectedChapter || focusAreas.length === 0}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold",
                "hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {pendingAction === "improve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Improve Chapter
            </button>

            {pendingAction === "improve" && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Sparkles className="h-4 w-4 animate-pulse text-purple-light" />
                Generating improved version…
              </div>
            )}

            {improvedContent && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Improved version</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImproved((v) => !v)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/5"
                    >
                      {showImproved ? "Hide" : "Show"} preview
                    </button>
                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Apply to chapter
                    </button>
                  </div>
                </div>
                {showImproved && (
                  <ChapterReader content={improvedContent} title="Improved version" />
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

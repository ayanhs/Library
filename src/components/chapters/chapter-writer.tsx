"use client";

import Link from "next/link";
import {
  Check,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ErrorAlert, SuccessAlert } from "@/components/auth/auth-card";
import { BookFormField, BookFormInput, BookFormTextarea } from "@/components/books/form-fields";
import { ChapterReader } from "@/components/chapters/chapter-reader";
import {
  approveChapter,
  generateChapter,
  updateChapterContent,
} from "@/lib/chapters/actions";
import {
  DEFAULT_CHAPTER_PAGES,
  formatPageEstimate,
  MAX_CHAPTER_PAGES,
  MIN_CHAPTER_PAGES,
} from "@/lib/chapters/length";
import {
  getActiveChapterNumber,
  getApprovedCount,
  getChapterForNumber,
} from "@/lib/chapters/utils";
import type { BookChapter } from "@/lib/chapters/types";
import type { StoryBlueprint } from "@/lib/blueprint/types";
import { cn } from "@/lib/utils";

interface ChapterWriterProps {
  bookId: string;
  blueprint: StoryBlueprint;
  chapters: BookChapter[];
  onChaptersChange: (chapters: BookChapter[]) => void;
}

export function ChapterWriter({
  bookId,
  blueprint,
  chapters,
  onChaptersChange,
}: ChapterWriterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [targetPages, setTargetPages] = useState(DEFAULT_CHAPTER_PAGES);

  const activeNumber = useMemo(
    () => getActiveChapterNumber(chapters, blueprint.chapterOutline),
    [chapters, blueprint.chapterOutline]
  );

  useEffect(() => {
    if (activeNumber === null) return;
    const existing = getChapterForNumber(chapters, activeNumber);
    setTargetPages(existing?.target_pages ?? DEFAULT_CHAPTER_PAGES);
    setIsEditing(false);
    setError("");
    setSuccess("");
  }, [activeNumber, chapters]);

  const activeChapter = activeNumber
    ? getChapterForNumber(chapters, activeNumber)
    : undefined;

  const activeOutline = activeNumber
    ? blueprint.chapterOutline.find((c) => c.chapterNumber === activeNumber)
    : undefined;

  const approvedCount = getApprovedCount(chapters);
  const totalChapters = blueprint.chapterOutline.length;

  const runAction = (action: () => Promise<void>) => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      try {
        await action();
      } finally {
        router.refresh();
      }
    });
  };

  const handleGenerate = () => {
    if (!activeNumber) return;
    runAction(async () => {
      const result = await generateChapter(bookId, activeNumber, targetPages);
      if (!result.success) {
        setError(result.message);
        return;
      }
      const updated = chapters.filter((c) => c.chapter_number !== activeNumber);
      onChaptersChange([...updated, result.data!.chapter]);
      setIsEditing(false);
    });
  };

  const pagePresets = [8, 10, 15, 20];
  const handleStartEdit = () => {
    if (!activeChapter) return;
    setEditContent(activeChapter.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!activeNumber) return;
    runAction(async () => {
      const result = await updateChapterContent(
        bookId,
        activeNumber,
        editContent
      );
      if (!result.success) {
        setError(result.message);
        return;
      }
      const updated = chapters.filter((c) => c.chapter_number !== activeNumber);
      onChaptersChange([...updated, result.data!.chapter]);
      setIsEditing(false);
      setSuccess("Chapter updated.");
    });
  };

  const handleApprove = () => {
    if (!activeNumber) return;
    runAction(async () => {
      const result = await approveChapter(bookId, activeNumber);
      if (!result.success) {
        setError(result.message);
        return;
      }
      const updated = chapters.map((c) =>
        c.chapter_number === activeNumber
          ? { ...c, status: "approved" as const, approved_at: new Date().toISOString() }
          : c
      );
      onChaptersChange(updated);
      setIsEditing(false);
      setSuccess(
        activeNumber < totalChapters
          ? `Chapter ${activeNumber} approved! Ready for Chapter ${activeNumber + 1}.`
          : `Chapter ${activeNumber} approved! Your book draft is complete.`
      );
    });
  };

  const allComplete = approvedCount >= totalChapters;

  return (
    <section className="space-y-6 border-t border-white/5 pt-8">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-light" />
          <h2 className="text-xl font-semibold">Chapter Writer</h2>
        </div>
        <p className="text-sm text-muted">
          Write and approve chapters one at a time.{" "}
          {approvedCount}/{totalChapters} approved.
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple to-blue transition-all"
            style={{ width: `${(approvedCount / totalChapters) * 100}%` }}
          />
        </div>
      </div>

      {error && <ErrorAlert message={error} />}
      {success && <SuccessAlert message={success} />}

      {/* Active chapter workspace */}
      {!allComplete && activeNumber && activeOutline && (
        <div className="glass-card rounded-2xl border border-white/5 p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-light">
                Chapter {activeNumber}
              </p>
              <h3 className="text-lg font-semibold">{activeOutline.title}</h3>
              <p className="mt-1 text-sm text-muted">{activeOutline.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!activeChapter && !isEditing && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isPending}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
                    "bg-gradient-to-r from-purple to-blue"
                  )}
                >
                  {isPending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate Chapter {activeNumber}
                </button>
              )}
              {activeChapter && !isEditing && (                <>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    <Check className="h-4 w-4" />
                    Approve Chapter
                  </button>
                </>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="mb-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <BookFormField
                label="Chapter length (pages)"
                htmlFor={`chapter-pages-${activeNumber}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="sm:w-32">
                    <BookFormInput
                      id={`chapter-pages-${activeNumber}`}
                      type="number"
                      min={MIN_CHAPTER_PAGES}
                      max={MAX_CHAPTER_PAGES}
                      value={targetPages}
                      onChange={(e) =>
                        setTargetPages(Number(e.target.value) || DEFAULT_CHAPTER_PAGES)
                      }
                      disabled={isPending}
                    />
                  </div>
                  <p className="text-sm text-muted">
                    {formatPageEstimate(targetPages)} · standard book pages (~275 words/page)
                  </p>
                </div>
              </BookFormField>
              <div className="mt-3 flex flex-wrap gap-2">
                {pagePresets.map((pages) => (
                  <button
                    key={pages}
                    type="button"
                    onClick={() => setTargetPages(pages)}
                    disabled={isPending}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      targetPages === pages
                        ? "border-purple/40 bg-purple/15 text-purple-light"
                        : "border-white/10 bg-white/5 text-muted hover:bg-white/10"
                    )}
                  >
                    {pages} pages
                  </button>
                ))}
              </div>
              {!activeChapter && (
                <p className="mt-3 text-xs text-muted">
                  Set the target length for this chapter before generating. Each chapter can be a different length.
                </p>
              )}
              {activeChapter && (
                <p className="mt-3 text-xs text-muted">
                  Change the page count before regenerating to adjust chapter length.
                </p>
              )}
            </div>
          )}

          {isPending && !activeChapter && (
            <div className="flex items-center justify-center py-16 text-sm text-muted">
              <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-purple/30 border-t-purple-light" />
              Writing {targetPages}-page chapter with AI…
            </div>
          )}

          {isPending && activeChapter && !isEditing && (
            <div className="flex items-center justify-center py-16 text-sm text-muted">
              <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-purple/30 border-t-purple-light" />
              Regenerating as a {targetPages}-page chapter…
            </div>
          )}

          {isEditing && (
            <div className="space-y-3">
              <BookFormTextarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={isPending}
                className="min-h-[400px] font-serif leading-relaxed"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isPending}
                  className="rounded-xl bg-gradient-to-r from-purple to-blue px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Save Edits
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!isEditing && activeChapter && !isPending && (
            <ChapterReader
              content={activeChapter.content}
              subtitle={
                activeChapter.target_pages
                  ? `${activeChapter.target_pages} pages target`
                  : undefined
              }
            />
          )}
        </div>
      )}

      {allComplete && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
          <Check className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
          <p className="font-semibold text-emerald-200">All chapters approved!</p>
          <p className="mt-1 text-sm text-emerald-100/80">
            Your {totalChapters}-chapter book draft is complete.
          </p>
          <Link
            href={`/dashboard/book/${bookId}/export`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-blue px-5 py-2.5 text-sm font-semibold text-white"
          >
            Export your book
          </Link>
        </div>
      )}

      {/* All written chapters — full text readable anytime */}
      {chapters.filter((c) => c.content.trim()).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted">
            {allComplete ? "Your chapters" : "Approved & previous chapters"}
          </h3>
          {chapters
            .filter((c) => c.content.trim())
            .filter(
              (c) =>
                c.status === "approved" ||
                (activeNumber !== null && c.chapter_number !== activeNumber)
            )
            .sort((a, b) => a.chapter_number - b.chapter_number)
            .map((chapter) => (
              <ChapterReader
                key={chapter.id}
                title={`Chapter ${chapter.chapter_number}: ${chapter.title}`}
                subtitle={
                  chapter.status === "approved"
                    ? "Approved"
                    : chapter.target_pages
                      ? `${chapter.target_pages} pages · draft`
                      : "Draft"
                }
                content={chapter.content}
                defaultExpanded={false}
              />
            ))}
        </div>
      )}
    </section>
  );
}

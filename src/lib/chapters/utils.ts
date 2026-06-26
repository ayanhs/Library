import type { BookChapter } from "@/lib/chapters/types";
import type { ChapterOutlineItem } from "@/lib/blueprint/types";

export function getActiveChapterNumber(
  chapters: BookChapter[],
  outline: ChapterOutlineItem[]
): number | null {
  if (outline.length === 0) return null;

  const draft = chapters.find((c) => c.status === "draft");
  if (draft) return draft.chapter_number;

  const approvedNumbers = chapters
    .filter((c) => c.status === "approved")
    .map((c) => c.chapter_number);

  const maxApproved =
    approvedNumbers.length > 0 ? Math.max(...approvedNumbers) : 0;
  const next = maxApproved + 1;

  if (next > outline.length) return null;
  return next;
}

export function getChapterForNumber(
  chapters: BookChapter[],
  chapterNumber: number
): BookChapter | undefined {
  return chapters.find((c) => c.chapter_number === chapterNumber);
}

export function getApprovedCount(chapters: BookChapter[]): number {
  return chapters.filter((c) => c.status === "approved").length;
}

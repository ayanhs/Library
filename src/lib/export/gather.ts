import type { Book } from "@/lib/books/types";
import type { BookChapter } from "@/lib/chapters/types";
import type { StoryBlueprintRecord } from "@/lib/blueprint/types";
import type { ExportBookData } from "@/lib/export/types";
import { getApprovedCount } from "@/lib/chapters/utils";

export interface ExportReadiness {
  ready: boolean;
  message: string;
  approvedCount: number;
  totalChapters: number;
}

export function getExportReadiness(
  blueprint: StoryBlueprintRecord | null,
  chapters: BookChapter[]
): ExportReadiness {
  if (!blueprint || blueprint.status !== "approved") {
    return {
      ready: false,
      message: "Approve your story blueprint before exporting.",
      approvedCount: 0,
      totalChapters: blueprint?.blueprint.chapterOutline.length ?? 0,
    };
  }

  const totalChapters = blueprint.blueprint.chapterOutline.length;
  if (totalChapters === 0) {
    return {
      ready: false,
      message: "Your blueprint has no chapters to export.",
      approvedCount: 0,
      totalChapters: 0,
    };
  }

  const approvedCount = getApprovedCount(chapters);
  const chaptersWithContent = chapters.filter((c) => c.content.trim().length > 0);

  if (approvedCount < totalChapters) {
    return {
      ready: false,
      message: `Complete all chapters first (${approvedCount}/${totalChapters} approved).`,
      approvedCount,
      totalChapters,
    };
  }

  const missingContent = chapters.filter(
    (c) =>
      c.chapter_number <= totalChapters &&
      c.status === "approved" &&
      !c.content.trim()
  );

  if (missingContent.length > 0) {
    return {
      ready: false,
      message: "Some approved chapters are empty. Regenerate or edit them first.",
      approvedCount,
      totalChapters,
    };
  }

  if (chaptersWithContent.length === 0) {
    return {
      ready: false,
      message: "No chapter content found to export.",
      approvedCount,
      totalChapters,
    };
  }

  return {
    ready: true,
    message: "Your book is ready to export.",
    approvedCount,
    totalChapters,
  };
}

export function buildExportBookData(
  book: Book,
  chapters: BookChapter[],
  blueprint: StoryBlueprintRecord
): ExportBookData {
  const outline = blueprint.blueprint.chapterOutline;

  const exportChapters = outline
    .map((item) => {
      const chapter = chapters.find(
        (c) => c.chapter_number === item.chapterNumber
      );
      return {
        number: item.chapterNumber,
        title: chapter?.title || item.title,
        content: chapter?.content.trim() || "",
      };
    })
    .filter((c) => c.content.length > 0)
    .sort((a, b) => a.number - b.number);

  const description =
    book.book_description?.trim() ||
    blueprint.blueprint.summary.trim() ||
    book.story_prompt?.trim() ||
    "";

  return {
    title: book.title,
    authorName: book.author_name?.trim() || "Author",
    description,
    genre: book.genre,
    chapters: exportChapters,
  };
}

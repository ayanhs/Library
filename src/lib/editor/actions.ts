"use server";

import { revalidatePath } from "next/cache";
import { getBookById } from "@/lib/books/queries";
import { getBlueprintByBookId } from "@/lib/blueprint/queries";
import { getChaptersByBookId } from "@/lib/chapters/queries";
import { withAiGuard } from "@/lib/ai-usage/with-guard";
import {
  analyzeChapterWithAI,
  improveChapterWithAI,
} from "@/lib/editor/openai";
import type {
  ChapterAnalysis,
  EditorReport,
  ImprovementFocus,
} from "@/lib/editor/types";
import { getStoryBibleByBookId } from "@/lib/story-bible/queries";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; message: string };

function formatDbError(message: string): string {
  if (
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("editor_reports")
  ) {
    return "Database setup required: run supabase/setup-editor.sql in Supabase SQL Editor, then refresh.";
  }
  return message;
}

function revalidateEditor(bookId: string) {
  revalidatePath(`/dashboard/book/${bookId}/editor`);
}

async function getEditorContext(bookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [book, blueprintRecord, chapters, storyBible] = await Promise.all([
    getBookById(bookId, user.id),
    getBlueprintByBookId(bookId, user.id),
    getChaptersByBookId(bookId, user.id),
    getStoryBibleByBookId(bookId, user.id),
  ]);

  if (!book || !blueprintRecord) return null;

  return { supabase, user, book, blueprintRecord, chapters, storyBible };
}

export async function analyzeChapter(
  bookId: string,
  chapterNumber: number
): Promise<ActionResult<{ analysis: ChapterAnalysis; report: EditorReport }>> {
  try {
    const ctx = await getEditorContext(bookId);
    if (!ctx) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: "You must be signed in." };
      }
      const book = await getBookById(bookId, user.id);
      if (!book) {
        return { success: false, message: "Book not found." };
      }
      const blueprint = await getBlueprintByBookId(bookId, user.id);
      if (!blueprint) {
        return {
          success: false,
          message:
            "Generate a story blueprint on the Project tab before using the editor.",
        };
      }
      return { success: false, message: "Unable to load editor context." };
    }

    const chapter = ctx.chapters.find(
      (c) => c.chapter_number === chapterNumber
    );
    if (!chapter?.content.trim()) {
      return {
        success: false,
        message: "This chapter has no content to analyze yet.",
      };
    }

    const previousChapters = ctx.chapters.filter(
      (c) =>
        c.chapter_number < chapterNumber && c.content.trim().length > 0
    );

    const aiResult = await withAiGuard(ctx.user.id, "editor", () =>
      analyzeChapterWithAI({
        book: ctx.book,
        chapter,
        blueprint: ctx.blueprintRecord.blueprint,
        storyBible: ctx.storyBible,
        previousChapters,
      })
    );

    if (!aiResult.success) {
      return { success: false, message: aiResult.message };
    }

    const analysis = aiResult.data;

    const { data: report, error } = await ctx.supabase
      .from("editor_reports")
      .insert({
        book_id: bookId,
        user_id: ctx.user.id,
        chapter_number: chapterNumber,
        report_type: "analysis",
        analysis,
        improvement_focus: [],
        improved_content: null,
      })
      .select("*")
      .single();

    if (error || !report) {
      return {
        success: false,
        message: formatDbError(error?.message || "Failed to save report."),
      };
    }

    revalidateEditor(bookId);
    return {
      success: true,
      data: { analysis, report: report as EditorReport },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Analysis failed. Please try again.";
    if (message.includes("413") || message.toLowerCase().includes("too large")) {
      return {
        success: false,
        message:
          "Chapter is too long to analyze in one request. Try editing it to a shorter section or retry.",
      };
    }
    if (message.includes("rate_limit") || message.includes("429")) {
      return {
        success: false,
        message: "Groq rate limit reached. Wait a moment and try again.",
      };
    }
    return { success: false, message };
  }
}
export async function improveChapter(
  bookId: string,
  chapterNumber: number,
  focusAreas: ImprovementFocus[]
): Promise<
  ActionResult<{ improvedContent: string; report: EditorReport }>
> {
  try {
    if (focusAreas.length === 0) {
      return {
        success: false,
        message: "Select at least one improvement focus.",
      };
    }

    const ctx = await getEditorContext(bookId);
    if (!ctx) {
      return { success: false, message: "Book not found or not signed in." };
    }

    const chapter = ctx.chapters.find(
      (c) => c.chapter_number === chapterNumber
    );
    if (!chapter?.content.trim()) {
      return {
        success: false,
        message: "This chapter has no content to improve yet.",
      };
    }

    const previousChapters = ctx.chapters.filter(
      (c) =>
        c.chapter_number < chapterNumber && c.content.trim().length > 0
    );

    const aiResult = await withAiGuard(ctx.user.id, "editor", () =>
      improveChapterWithAI({
        book: ctx.book,
        chapter,
        blueprint: ctx.blueprintRecord.blueprint,
        storyBible: ctx.storyBible,
        previousChapters,
        focusAreas,
      })
    );

    if (!aiResult.success) {
      return { success: false, message: aiResult.message };
    }

    const improvedContent = aiResult.data;

    const { data: report, error } = await ctx.supabase
      .from("editor_reports")
      .insert({
        book_id: bookId,
        user_id: ctx.user.id,
        chapter_number: chapterNumber,
        report_type: "improvement",
        analysis: null,
        improvement_focus: focusAreas,
        improved_content: improvedContent,
      })
      .select("*")
      .single();

    if (error || !report) {
      return {
        success: false,
        message: formatDbError(error?.message || "Failed to save improvement."),
      };
    }

    revalidateEditor(bookId);
    return {
      success: true,
      data: { improvedContent, report: report as EditorReport },
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Improvement failed. Please try again.";
    return { success: false, message };
  }
}

export async function applyImprovedChapter(
  bookId: string,
  chapterNumber: number,
  content: string
): Promise<ActionResult> {
  try {
    if (!content.trim()) {
      return { success: false, message: "Chapter content cannot be empty." };
    }

    const ctx = await getEditorContext(bookId);
    if (!ctx) {
      return { success: false, message: "Book not found or not signed in." };
    }

    const chapter = ctx.chapters.find(
      (c) => c.chapter_number === chapterNumber
    );
    if (!chapter) {
      return { success: false, message: "Chapter not found." };
    }

    const { error } = await ctx.supabase
      .from("book_chapters")
      .update({
        content: content.trim(),
        status: "draft",
        approved_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("book_id", bookId)
      .eq("user_id", ctx.user.id)
      .eq("chapter_number", chapterNumber);

    if (error) {
      return {
        success: false,
        message: formatDbError(error.message || "Failed to apply changes."),
      };
    }

    revalidateEditor(bookId);
    revalidatePath(`/dashboard/book/${bookId}`);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to apply changes.";
    return { success: false, message };
  }
}

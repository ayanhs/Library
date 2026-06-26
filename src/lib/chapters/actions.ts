"use server";

import { revalidatePath } from "next/cache";
import { getBookById } from "@/lib/books/queries";
import { getBlueprintByBookId } from "@/lib/blueprint/queries";
import { getChaptersByBookId } from "@/lib/chapters/queries";
import { withAiGuard } from "@/lib/ai-usage/with-guard";
import { generateChapterWithAI } from "@/lib/chapters/openai";
import { clampChapterPages, validateChapterPages } from "@/lib/chapters/length";
import type { BookChapter } from "@/lib/chapters/types";
import { getStoryBibleByBookId } from "@/lib/story-bible/queries";
import { createClient } from "@/lib/supabase/server";
type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; message: string };

function formatDbError(message: string): string {
  const needsMigration =
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("book_chapters") ||
    message.includes("target_pages") ||
    (message.includes("status") && message.includes("story_blueprints"));

  if (needsMigration) {
    return "Database setup required: open Supabase → SQL Editor, paste and run supabase/setup-publishing-workflow.sql, then refresh this page.";
  }
  return message;
}

function revalidateBook(bookId: string) {
  revalidatePath(`/dashboard/book/${bookId}`);
}

async function getAuthContext(bookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [book, blueprintRecord, chapters] = await Promise.all([
    getBookById(bookId, user.id),
    getBlueprintByBookId(bookId, user.id),
    getChaptersByBookId(bookId, user.id),
  ]);

  if (!book || !blueprintRecord || blueprintRecord.status !== "approved") {
    return null;
  }

  return { supabase, user, book, blueprintRecord, chapters };
}

export async function generateChapter(
  bookId: string,
  chapterNumber: number,
  targetPages: number
): Promise<ActionResult<{ chapter: BookChapter }>> {
  try {
    const pagesError = validateChapterPages(targetPages);
    if (pagesError) {
      return { success: false, message: pagesError };
    }

    const pages = clampChapterPages(targetPages);
    const ctx = await getAuthContext(bookId);
    if (!ctx) {
      return {
        success: false,
        message: "Approve your blueprint before writing chapters.",
      };
    }

    const { supabase, user, book, blueprintRecord, chapters } = ctx;
    const outlineItem = blueprintRecord.blueprint.chapterOutline.find(
      (c) => c.chapterNumber === chapterNumber
    );

    if (!outlineItem) {
      return { success: false, message: "Chapter not found in blueprint." };
    }

    const approvedBefore = chapters.filter(
      (c) => c.status === "approved" && c.chapter_number < chapterNumber
    );
    if (chapterNumber > 1) {
      const prevApproved = chapters.some(
        (c) => c.chapter_number === chapterNumber - 1 && c.status === "approved"
      );
      if (!prevApproved) {
        return {
          success: false,
          message: `Approve Chapter ${chapterNumber - 1} before generating this one.`,
        };
      }
    }

    const storyBible = await getStoryBibleByBookId(bookId, user.id);

    const aiResult = await withAiGuard(user.id, "chapter", () =>
      generateChapterWithAI({
        book,
        blueprint: blueprintRecord.blueprint,
        outlineItem,
        previousChapters: approvedBefore,
        targetPages: pages,
        storyBible,
      })
    );

    if (!aiResult.success) {
      return { success: false, message: aiResult.message };
    }

    const content = aiResult.data;
    const now = new Date().toISOString();
    const row = {
      book_id: bookId,
      user_id: user.id,
      chapter_number: chapterNumber,
      title: outlineItem.title,
      content,
      target_pages: pages,
      status: "draft" as const,
      approved_at: null,
      updated_at: now,
    };
    const { data: chapter, error } = await supabase
      .from("book_chapters")
      .upsert(row, { onConflict: "book_id,chapter_number" })
      .select("*")
      .single();

    if (error || !chapter) {
      return {
        success: false,
        message: formatDbError(error?.message || "Failed to save chapter."),
      };
    }

    revalidateBook(bookId);
    return { success: true, data: { chapter: chapter as BookChapter } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return { success: false, message };
  }
}

export async function updateChapterContent(
  bookId: string,
  chapterNumber: number,
  content: string
): Promise<ActionResult<{ chapter: BookChapter }>> {
  try {
    if (!content.trim()) {
      return { success: false, message: "Chapter content cannot be empty." };
    }

    const ctx = await getAuthContext(bookId);
    if (!ctx) {
      return { success: false, message: "Blueprint must be approved first." };
    }

    const { supabase, user } = ctx;

    const { data: chapter, error } = await supabase
      .from("book_chapters")
      .update({
        content: content.trim(),
        status: "draft",
        approved_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .eq("chapter_number", chapterNumber)
      .select("*")
      .single();

    if (error || !chapter) {
      return {
        success: false,
        message: formatDbError(error?.message || "Failed to update chapter."),
      };
    }

    revalidateBook(bookId);
    return { success: true, data: { chapter: chapter as BookChapter } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return { success: false, message };
  }
}

export async function approveChapter(
  bookId: string,
  chapterNumber: number
): Promise<ActionResult> {
  try {
    const ctx = await getAuthContext(bookId);
    if (!ctx) {
      return { success: false, message: "Blueprint must be approved first." };
    }

    const { supabase, user } = ctx;

    const { error } = await supabase
      .from("book_chapters")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .eq("chapter_number", chapterNumber);

    if (error) {
      return {
        success: false,
        message: formatDbError(error.message || "Failed to approve chapter."),
      };
    }

    revalidateBook(bookId);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return { success: false, message };
  }
}

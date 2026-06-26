"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getBookById } from "@/lib/books/queries";
import { getBlueprintByBookId } from "@/lib/blueprint/queries";
import { fetchCoverImages } from "@/lib/covers/image-gen";
import { generateCoverPromptsWithAI } from "@/lib/covers/openai";
import { toCoverPreviews } from "@/lib/covers/queries";
import type { BookCoverPreview } from "@/lib/covers/types";
import { createClient } from "@/lib/supabase/server";

type ActionResult =
  | { success: true }
  | { success: false; message: string };

type GenerateResult =
  | { success: true; covers: BookCoverPreview[]; warning?: string }
  | { success: false; message: string };

function formatDbError(message: string): string {
  if (
    message.includes("Could not find") ||
    message.includes("schema cache") ||
    message.includes("book_covers") ||
    message.includes("selected_cover_id")
  ) {
    return "Database setup required: run supabase/setup-export-covers.sql in Supabase SQL Editor, then refresh.";
  }
  return message;
}

export async function generateCoverOptions(bookId: string): Promise<GenerateResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "You must be signed in." };
    }

    const [book, blueprint] = await Promise.all([
      getBookById(bookId, user.id),
      getBlueprintByBookId(bookId, user.id),
    ]);

    if (!book) {
      return { success: false, message: "Book not found." };
    }

    if (!blueprint || blueprint.status !== "approved") {
      return {
        success: false,
        message: "Approve your story blueprint before generating cover art.",
      };
    }

    const authorName = book.author_name?.trim() || "Author";
    const description =
      book.book_description?.trim() ||
      blueprint.blueprint.summary.trim() ||
      book.story_prompt?.trim() ||
      "";

    const promptSpecs = await generateCoverPromptsWithAI({
      book,
      blueprint: blueprint.blueprint,
      authorName,
      description,
    });

    const fullPrompts = promptSpecs.map(
      (spec) =>
        `${spec.prompt} Style: ${spec.style}. Professional book cover illustration, portrait orientation, no text, no typography, no letters, no words.`
    );

    let imageBuffers: Buffer[];
    let fallbackCount = 0;
    try {
      const result = await fetchCoverImages(
        fullPrompts,
        promptSpecs.map((spec) => spec.style)
      );
      imageBuffers = result.buffers;
      fallbackCount = result.fallbackCount;
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error
            ? `Cover image generation failed: ${err.message}`
            : "Cover image generation failed. Please try again in a minute.",
      };
    }

    const batchId = randomUUID();

    await supabase
      .from("books")
      .update({
        selected_cover_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookId)
      .eq("user_id", user.id);

    const rows = promptSpecs.map((spec, index) => ({
      book_id: bookId,
      user_id: user.id,
      batch_id: batchId,
      prompt: `${spec.style}: ${spec.prompt}`,
      image_data: imageBuffers[index].toString("base64"),
      mime_type: imageBuffers[index][0] === 0x89 ? "image/png" : "image/jpeg",
    }));

    const { data: inserted, error } = await supabase
      .from("book_covers")
      .insert(rows)
      .select("*");

    if (error || !inserted?.length) {
      return {
        success: false,
        message: formatDbError(error?.message || "Failed to save cover options."),
      };
    }

    revalidatePath(`/dashboard/book/${bookId}/export`);

    if (fallbackCount === fullPrompts.length) {
      return {
        success: true,
        covers: toCoverPreviews(
          inserted.map((row) => ({
            id: row.id,
            prompt: row.prompt,
            mime_type: row.mime_type,
          })),
          bookId
        ),
        warning:
          "The image service was busy, so placeholder covers were used. Wait a minute and click Regenerate, or add a free POLLINATIONS_API_KEY to .env.local for faster, more reliable results.",
      };
    }

    if (fallbackCount > 0) {
      return {
        success: true,
        covers: toCoverPreviews(
          inserted.map((row) => ({
            id: row.id,
            prompt: row.prompt,
            mime_type: row.mime_type,
          })),
          bookId
        ),
        warning: `${fallbackCount} cover(s) used a placeholder because the image service was busy. Regenerate for AI art, or add POLLINATIONS_API_KEY to .env.local.`,
      };
    }

    return {
      success: true,
      covers: toCoverPreviews(
        inserted.map((row) => ({
          id: row.id,
          prompt: row.prompt,
          mime_type: row.mime_type,
        })),
        bookId
      ),
    };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Failed to generate cover art.",
    };
  }
}

export async function selectBookCover(
  bookId: string,
  coverId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "You must be signed in." };
    }

    const { data: cover } = await supabase
      .from("book_covers")
      .select("id")
      .eq("id", coverId)
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!cover) {
      return { success: false, message: "Cover not found." };
    }

    const { error } = await supabase
      .from("books")
      .update({
        selected_cover_id: coverId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookId)
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        message: formatDbError(error.message || "Failed to select cover."),
      };
    }

    revalidatePath(`/dashboard/book/${bookId}/export`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to select cover.",
    };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { getBookById } from "@/lib/books/queries";
import { withAiGuard } from "@/lib/ai-usage/with-guard";
import { generateBlueprintWithAI } from "@/lib/blueprint/openai";
import type { StoryBlueprint } from "@/lib/blueprint/types";
import { storyBlueprintSchema } from "@/lib/blueprint/validation";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; message: string };

function formatDbError(message: string): string {
  const needsMigration =
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("book_chapters") ||
    (message.includes("status") && message.includes("story_blueprints"));

  if (needsMigration) {
    return "Database setup required: open Supabase → SQL Editor, paste and run supabase/setup-publishing-workflow.sql, then refresh this page.";
  }
  return message;
}

function revalidateBook(bookId: string) {
  revalidatePath(`/dashboard/book/${bookId}`);
}

export async function generateStoryBlueprint(
  bookId: string
): Promise<ActionResult<{ blueprint: StoryBlueprint }>> {
  try {
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

    const aiResult = await withAiGuard(user.id, "blueprint", () =>
      generateBlueprintWithAI(book)
    );

    if (!aiResult.success) {
      return { success: false, message: aiResult.message };
    }

    const blueprint = aiResult.data;
    const now = new Date().toISOString();

    const { error } = await supabase.from("story_blueprints").upsert(
      {
        book_id: bookId,
        user_id: user.id,
        blueprint,
        status: "draft",
        approved_at: null,
        updated_at: now,
      },
      { onConflict: "book_id" }
    );

    if (error) {
      return {
        success: false,
        message: formatDbError(error.message || "Failed to save blueprint."),
      };
    }

    revalidateBook(bookId);
    return { success: true, data: { blueprint } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return { success: false, message };
  }
}

export async function updateStoryBlueprint(
  bookId: string,
  blueprint: StoryBlueprint
): Promise<ActionResult<{ blueprint: StoryBlueprint }>> {
  try {
    const parsed = storyBlueprintSchema.safeParse(blueprint);
    if (!parsed.success) {
      return { success: false, message: "Invalid blueprint data." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "You must be signed in." };
    }

    const { error } = await supabase
      .from("story_blueprints")
      .update({
        blueprint: parsed.data,
        status: "draft",
        approved_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("book_id", bookId)
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        message: formatDbError(error.message || "Failed to update blueprint."),
      };
    }

    revalidateBook(bookId);
    return { success: true, data: { blueprint: parsed.data } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return { success: false, message };
  }
}

export async function approveStoryBlueprint(
  bookId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "You must be signed in." };
    }

    const { data: record, error: fetchError } = await supabase
      .from("story_blueprints")
      .select("blueprint")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !record) {
      return { success: false, message: "Blueprint not found." };
    }

    const { error } = await supabase
      .from("story_blueprints")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("book_id", bookId)
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        message: formatDbError(error.message || "Failed to approve blueprint."),
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

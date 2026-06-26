"use server";

import { revalidatePath } from "next/cache";
import { getBookById } from "@/lib/books/queries";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; message: string };

function formatDbError(message: string): string {
  if (
    message.includes("Could not find") ||
    message.includes("schema cache") ||
    message.includes("author_name") ||
    message.includes("book_description")
  ) {
    return "Database setup required: run supabase/setup-export.sql in Supabase SQL Editor, then refresh.";
  }
  return message;
}

export async function updateExportMetadata(
  bookId: string,
  authorName: string,
  bookDescription: string
): Promise<ActionResult> {
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

    const { error } = await supabase
      .from("books")
      .update({
        author_name: authorName.trim(),
        book_description: bookDescription.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookId)
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        message: formatDbError(error.message || "Failed to save export details."),
      };
    }

    revalidatePath(`/dashboard/book/${bookId}/export`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to save.",
    };
  }
}

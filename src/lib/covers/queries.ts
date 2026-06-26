import type { BookCover, BookCoverPreview, CoverImagePayload } from "@/lib/covers/types";
import { createClient } from "@/lib/supabase/server";

export async function getLatestCoverBatch(
  bookId: string,
  userId: string
): Promise<Array<Pick<BookCover, "id" | "prompt" | "mime_type">>> {
  try {
    const supabase = await createClient();

    const { data: latest } = await supabase
      .from("book_covers")
      .select("batch_id")
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest?.batch_id) return [];

    const { data, error } = await supabase
      .from("book_covers")
      .select("id, book_id, user_id, batch_id, prompt, mime_type, created_at")
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .eq("batch_id", latest.batch_id)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as Array<Pick<BookCover, "id" | "prompt" | "mime_type">>;
  } catch {
    return [];
  }
}

export async function getSelectedCover(
  bookId: string,
  userId: string
): Promise<CoverImagePayload | null> {
  try {
    const supabase = await createClient();
    const { data: book } = await supabase
      .from("books")
      .select("selected_cover_id")
      .eq("id", bookId)
      .eq("user_id", userId)
      .single();

    if (!book?.selected_cover_id) return null;

    const { data: cover } = await supabase
      .from("book_covers")
      .select("image_data, mime_type")
      .eq("id", book.selected_cover_id)
      .eq("user_id", userId)
      .single();

    if (!cover?.image_data) return null;

    return {
      buffer: Buffer.from(cover.image_data, "base64"),
      mimeType: cover.mime_type || "image/jpeg",
    };
  } catch {
    return null;
  }
}

export function toCoverPreviews(
  covers: Array<Pick<BookCover, "id" | "prompt" | "mime_type">>,
  bookId: string
): BookCoverPreview[] {
  return covers.map((cover) => ({
    id: cover.id,
    prompt: cover.prompt,
    mimeType: cover.mime_type,
    imageUrl: `/api/book/${bookId}/covers/${cover.id}`,
  }));
}

import type { BookChapter } from "@/lib/chapters/types";
import { createClient } from "@/lib/supabase/server";

export {
  getActiveChapterNumber,
  getApprovedCount,
  getChapterForNumber,
} from "@/lib/chapters/utils";

export async function getChaptersByBookId(
  bookId: string,
  userId: string
): Promise<BookChapter[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("book_chapters")
      .select("*")
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .order("chapter_number", { ascending: true });

    if (error) return [];
    return (data as BookChapter[]) ?? [];
  } catch {
    return [];
  }
}

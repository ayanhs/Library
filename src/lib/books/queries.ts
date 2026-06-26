import type { Book, BookCardData } from "@/lib/books/types";
import { createClient } from "@/lib/supabase/server";

export async function getRecentBooks(
  userId: string,
  limit = 6
): Promise<BookCardData[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("books")
      .select("id, title, genre, status, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data as BookCardData[]) ?? [];
  } catch {
    return [];
  }
}

export async function getBooksCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getBookById(
  bookId: string,
  userId: string
): Promise<Book | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return data as Book;
  } catch {
    return null;
  }
}

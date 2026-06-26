import type { EditorReport } from "@/lib/editor/types";
import { createClient } from "@/lib/supabase/server";

export async function getEditorReportsByBookId(
  bookId: string,
  userId: string
): Promise<EditorReport[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("editor_reports")
      .select("*")
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as EditorReport[];
  } catch {
    return [];
  }
}

export async function getLatestAnalysisForChapter(
  bookId: string,
  userId: string,
  chapterNumber: number
): Promise<EditorReport | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("editor_reports")
      .select("*")
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .eq("chapter_number", chapterNumber)
      .eq("report_type", "analysis")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as EditorReport;
  } catch {
    return null;
  }
}

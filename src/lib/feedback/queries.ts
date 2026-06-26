import type { UserFeedback } from "@/lib/feedback/types";
import { createClient } from "@/lib/supabase/server";

export async function getFeedbackForAdmin(): Promise<{
  items: UserFeedback[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      if (
        error.message.includes("Could not find") ||
        error.message.includes("user_feedback")
      ) {
        return {
          items: [],
          error: "Run supabase/setup-feedback.sql in Supabase SQL Editor.",
        };
      }
      if (error.message.includes("not authorized") || error.code === "42501") {
        return { items: [], error: "Not authorized to view feedback." };
      }
      return { items: [], error: error.message };
    }

    return { items: (data as UserFeedback[]) ?? [], error: null };
  } catch {
    return { items: [], error: "Failed to load feedback." };
  }
}

export async function getFeedbackCountForAdmin(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("user_feedback")
      .select("id", { count: "exact", head: true });

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

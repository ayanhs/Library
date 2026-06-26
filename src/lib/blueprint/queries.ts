import type { StoryBlueprintRecord } from "@/lib/blueprint/types";
import { createClient } from "@/lib/supabase/server";

export async function getBlueprintByBookId(
  bookId: string,
  userId: string
): Promise<StoryBlueprintRecord | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("story_blueprints")
      .select("*")
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...(data as StoryBlueprintRecord),
      status: (data.status as StoryBlueprintRecord["status"]) ?? "draft",
      approved_at: data.approved_at ?? null,
    };
  } catch {
    return null;
  }
}

import { createClient } from "@/lib/supabase/server";
import type {
  StoryBibleCharacter,
  StoryBibleData,
  StoryBibleLocation,
  StoryBibleTimelineEvent,
  StoryBibleWorldRule,
} from "@/lib/story-bible/types";

export async function getStoryBibleByBookId(
  bookId: string,
  userId: string
): Promise<StoryBibleData> {
  const empty: StoryBibleData = {
    characters: [],
    locations: [],
    worldRules: [],
    timelineEvents: [],
  };

  try {
    const supabase = await createClient();

    const [charactersRes, locationsRes, rulesRes, timelineRes] =
      await Promise.all([
        supabase
          .from("characters")
          .select("*")
          .eq("book_id", bookId)
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("locations")
          .select("*")
          .eq("book_id", bookId)
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("world_rules")
          .select("*")
          .eq("book_id", bookId)
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("timeline_events")
          .select("*")
          .eq("book_id", bookId)
          .eq("user_id", userId)
          .order("event_order", { ascending: true }),
      ]);

    if (
      charactersRes.error ||
      locationsRes.error ||
      rulesRes.error ||
      timelineRes.error
    ) {
      return empty;
    }

    return {
      characters: (charactersRes.data as StoryBibleCharacter[]) ?? [],
      locations: (locationsRes.data as StoryBibleLocation[]) ?? [],
      worldRules: (rulesRes.data as StoryBibleWorldRule[]) ?? [],
      timelineEvents: (timelineRes.data as StoryBibleTimelineEvent[]) ?? [],
    };
  } catch {
    return empty;
  }
}

export function storyBibleHasContent(data: StoryBibleData): boolean {
  return (
    data.characters.length > 0 ||
    data.locations.length > 0 ||
    data.worldRules.length > 0 ||
    data.timelineEvents.length > 0
  );
}

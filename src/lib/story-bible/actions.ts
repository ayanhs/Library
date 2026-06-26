"use server";

import { revalidatePath } from "next/cache";
import { getBookById } from "@/lib/books/queries";
import { getBlueprintByBookId } from "@/lib/blueprint/queries";
import { withAiGuard } from "@/lib/ai-usage/with-guard";
import { generateStoryBibleWithAI } from "@/lib/story-bible/openai";
import { getStoryBibleByBookId } from "@/lib/story-bible/queries";
import type {
  StoryBibleCharacter,
  StoryBibleData,
  StoryBibleLocation,
  StoryBibleTimelineEvent,
  StoryBibleWorldRule,
} from "@/lib/story-bible/types";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; message: string };

function formatDbError(message: string): string {
  const needsMigration =
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("characters") ||
    message.includes("locations") ||
    message.includes("world_rules") ||
    message.includes("timeline_events");

  if (needsMigration) {
    return "Database setup required: run supabase/setup-story-bible.sql in Supabase SQL Editor, then refresh.";
  }
  return message;
}

function revalidateStoryBible(bookId: string) {
  revalidatePath(`/dashboard/book/${bookId}/story-bible`);
  revalidatePath(`/dashboard/book/${bookId}`);
}

async function getAuth(bookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const book = await getBookById(bookId, user.id);
  if (!book) return null;

  return { supabase, user, book };
}

export async function generateStoryBible(
  bookId: string
): Promise<ActionResult<{ storyBible: StoryBibleData }>> {
  try {
    const ctx = await getAuth(bookId);
    if (!ctx) {
      return { success: false, message: "Book not found or not signed in." };
    }

    const { supabase, user } = ctx;
    const blueprintRecord = await getBlueprintByBookId(bookId, user.id);
    if (!blueprintRecord) {
      return {
        success: false,
        message: "Generate a story blueprint first before creating the Story Bible.",
      };
    }

    const aiResult = await withAiGuard(user.id, "story_bible", () =>
      generateStoryBibleWithAI(ctx.book, blueprintRecord.blueprint)
    );

    if (!aiResult.success) {
      return { success: false, message: aiResult.message };
    }

    const generated = aiResult.data;

    await Promise.all([
      supabase.from("characters").delete().eq("book_id", bookId).eq("user_id", user.id),
      supabase.from("locations").delete().eq("book_id", bookId).eq("user_id", user.id),
      supabase.from("world_rules").delete().eq("book_id", bookId).eq("user_id", user.id),
      supabase.from("timeline_events").delete().eq("book_id", bookId).eq("user_id", user.id),
    ]);

    const now = new Date().toISOString();

    const [charRes, locRes, rulesRes, timelineRes] = await Promise.all([
      supabase.from("characters").insert(
        generated.characters.map((c) => ({
          book_id: bookId,
          user_id: user.id,
          name: c.name,
          age: c.age ?? "",
          personality: c.personality,
          appearance: c.appearance ?? "",
          goals: c.goals,
          fears: c.fears,
          relationships: c.relationships,
          updated_at: now,
        }))
      ),
      supabase.from("locations").insert(
        generated.locations.map((l) => ({
          book_id: bookId,
          user_id: user.id,
          name: l.name,
          description: l.description,
          importance: l.importance,
          updated_at: now,
        }))
      ),
      supabase.from("world_rules").insert(
        generated.worldRules.map((r) => ({
          book_id: bookId,
          user_id: user.id,
          category: r.category,
          rule: r.rule,
          updated_at: now,
        }))
      ),
      supabase.from("timeline_events").insert(
        generated.timelineEvents.map((e) => ({
          book_id: bookId,
          user_id: user.id,
          title: e.title,
          description: e.description,
          event_order: e.eventOrder,
          updated_at: now,
        }))
      ),
    ]);

    const insertError =
      charRes.error || locRes.error || rulesRes.error || timelineRes.error;
    if (insertError) {
      return {
        success: false,
        message: formatDbError(insertError.message || "Failed to save Story Bible."),
      };
    }

    revalidateStoryBible(bookId);
    const data = await getStoryBibleByBookId(bookId, user.id);
    return { success: true, data: { storyBible: data } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return { success: false, message };
  }
}

export async function saveCharacter(
  bookId: string,
  character: Partial<StoryBibleCharacter> & { id?: string }
): Promise<ActionResult<{ character: StoryBibleCharacter }>> {
  try {
    const ctx = await getAuth(bookId);
    if (!ctx) return { success: false, message: "Not authorized." };

    const { supabase, user } = ctx;
    const now = new Date().toISOString();
    const row = {
      book_id: bookId,
      user_id: user.id,
      name: character.name ?? "",
      age: character.age ?? "",
      personality: character.personality ?? "",
      appearance: character.appearance ?? "",
      goals: character.goals ?? "",
      fears: character.fears ?? "",
      relationships: character.relationships ?? "",
      updated_at: now,
    };

    if (character.id) {
      const { data, error } = await supabase
        .from("characters")
        .update(row)
        .eq("id", character.id)
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (error || !data) {
        return { success: false, message: formatDbError(error?.message || "Save failed.") };
      }
      revalidateStoryBible(bookId);
      return { success: true, data: { character: data as StoryBibleCharacter } };
    }

    const { data, error } = await supabase
      .from("characters")
      .insert(row)
      .select("*")
      .single();
    if (error || !data) {
      return { success: false, message: formatDbError(error?.message || "Save failed.") };
    }
    revalidateStoryBible(bookId);
    return { success: true, data: { character: data as StoryBibleCharacter } };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Save failed.",
    };
  }
}

export async function deleteCharacter(
  bookId: string,
  id: string
): Promise<ActionResult> {
  return deleteEntry(bookId, "characters", id);
}

export async function saveLocation(
  bookId: string,
  location: Partial<StoryBibleLocation> & { id?: string }
): Promise<ActionResult<{ location: StoryBibleLocation }>> {
  try {
    const ctx = await getAuth(bookId);
    if (!ctx) return { success: false, message: "Not authorized." };

    const { supabase, user } = ctx;
    const now = new Date().toISOString();
    const row = {
      book_id: bookId,
      user_id: user.id,
      name: location.name ?? "",
      description: location.description ?? "",
      importance: location.importance ?? "",
      updated_at: now,
    };

    if (location.id) {
      const { data, error } = await supabase
        .from("locations")
        .update(row)
        .eq("id", location.id)
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (error || !data) {
        return { success: false, message: formatDbError(error?.message || "Save failed.") };
      }
      revalidateStoryBible(bookId);
      return { success: true, data: { location: data as StoryBibleLocation } };
    }

    const { data, error } = await supabase
      .from("locations")
      .insert(row)
      .select("*")
      .single();
    if (error || !data) {
      return { success: false, message: formatDbError(error?.message || "Save failed.") };
    }
    revalidateStoryBible(bookId);
    return { success: true, data: { location: data as StoryBibleLocation } };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Save failed.",
    };
  }
}

export async function deleteLocation(
  bookId: string,
  id: string
): Promise<ActionResult> {
  return deleteEntry(bookId, "locations", id);
}

export async function saveWorldRule(
  bookId: string,
  worldRule: Partial<StoryBibleWorldRule> & { id?: string }
): Promise<ActionResult<{ worldRule: StoryBibleWorldRule }>> {
  try {
    const ctx = await getAuth(bookId);
    if (!ctx) return { success: false, message: "Not authorized." };

    const { supabase, user } = ctx;
    const now = new Date().toISOString();
    const row = {
      book_id: bookId,
      user_id: user.id,
      category: worldRule.category ?? "",
      rule: worldRule.rule ?? "",
      updated_at: now,
    };

    if (worldRule.id) {
      const { data, error } = await supabase
        .from("world_rules")
        .update(row)
        .eq("id", worldRule.id)
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (error || !data) {
        return { success: false, message: formatDbError(error?.message || "Save failed.") };
      }
      revalidateStoryBible(bookId);
      return { success: true, data: { worldRule: data as StoryBibleWorldRule } };
    }

    const { data, error } = await supabase
      .from("world_rules")
      .insert(row)
      .select("*")
      .single();
    if (error || !data) {
      return { success: false, message: formatDbError(error?.message || "Save failed.") };
    }
    revalidateStoryBible(bookId);
    return { success: true, data: { worldRule: data as StoryBibleWorldRule } };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Save failed.",
    };
  }
}

export async function deleteWorldRule(
  bookId: string,
  id: string
): Promise<ActionResult> {
  return deleteEntry(bookId, "world_rules", id);
}

export async function saveTimelineEvent(
  bookId: string,
  event: Partial<StoryBibleTimelineEvent> & { id?: string }
): Promise<ActionResult<{ timelineEvent: StoryBibleTimelineEvent }>> {
  try {
    const ctx = await getAuth(bookId);
    if (!ctx) return { success: false, message: "Not authorized." };

    const { supabase, user } = ctx;
    const now = new Date().toISOString();
    const row = {
      book_id: bookId,
      user_id: user.id,
      title: event.title ?? "",
      description: event.description ?? "",
      event_order: event.event_order ?? 1,
      updated_at: now,
    };

    if (event.id) {
      const { data, error } = await supabase
        .from("timeline_events")
        .update(row)
        .eq("id", event.id)
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (error || !data) {
        return { success: false, message: formatDbError(error?.message || "Save failed.") };
      }
      revalidateStoryBible(bookId);
      return {
        success: true,
        data: { timelineEvent: data as StoryBibleTimelineEvent },
      };
    }

    const { data, error } = await supabase
      .from("timeline_events")
      .insert(row)
      .select("*")
      .single();
    if (error || !data) {
      return { success: false, message: formatDbError(error?.message || "Save failed.") };
    }
    revalidateStoryBible(bookId);
    return {
      success: true,
      data: { timelineEvent: data as StoryBibleTimelineEvent },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Save failed.",
    };
  }
}

export async function deleteTimelineEvent(
  bookId: string,
  id: string
): Promise<ActionResult> {
  return deleteEntry(bookId, "timeline_events", id);
}

async function deleteEntry(
  bookId: string,
  table: "characters" | "locations" | "world_rules" | "timeline_events",
  id: string
): Promise<ActionResult> {
  try {
    const ctx = await getAuth(bookId);
    if (!ctx) return { success: false, message: "Not authorized." };

    const { error } = await ctx.supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("book_id", bookId)
      .eq("user_id", ctx.user.id);

    if (error) {
      return { success: false, message: formatDbError(error.message) };
    }

    revalidateStoryBible(bookId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Delete failed.",
    };
  }
}

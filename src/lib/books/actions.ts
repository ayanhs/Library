"use server";

import { revalidatePath } from "next/cache";
import type { BookFormData, BookStatus } from "@/lib/books/types";
import { createClient } from "@/lib/supabase/server";
import {
  bookCreateSchema,
  bookDraftSchema,
  UNTITLED_BOOK_TITLE,
} from "@/lib/validations/book";

type ActionResult =
  | { success: true; bookId: string; redirectTo?: string }
  | { success: false; errors: Record<string, string>; message?: string };

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveTitle(title: string | undefined, isDraft: boolean): string {
  const trimmed = title?.trim();
  if (trimmed) return trimmed;
  return isDraft ? UNTITLED_BOOK_TITLE : "";
}

function mapFormToRow(data: BookFormData, status: BookStatus) {
  const isDraft = status === "draft";

  return {
    title: resolveTitle(data.title, isDraft),
    genre: emptyToNull(data.genre),
    audience: emptyToNull(data.audience),
    main_character: emptyToNull(data.mainCharacter),
    character_age: emptyToNull(data.characterAge),
    character_description: emptyToNull(data.characterDescription),
    setting: emptyToNull(data.setting),
    story_prompt: emptyToNull(data.storyPrompt),
    status,
    updated_at: new Date().toISOString(),
  };
}

function zodErrorsToRecord(
  errors: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const record: Record<string, string> = {};
  for (const err of errors) {
    const key = String(err.path[0]);
    if (!record[key]) {
      record[key] = err.message;
    }
  }
  return record;
}

function formatDbError(message: string): string {
  if (
    message.includes("Could not find the table") &&
    message.includes("books")
  ) {
    return "Database setup required: open Supabase → SQL Editor, paste and run the contents of supabase/setup-books.sql, then try again.";
  }
  if (message.includes("schema cache")) {
    return "Database setup required: run supabase/setup-books.sql in your Supabase SQL Editor, wait a few seconds, then try again.";
  }
  if (message.includes("status") && message.includes("column")) {
    return "Database update required: run supabase/setup-books.sql in your Supabase SQL Editor to add missing columns.";
  }
  return message;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function saveBookDraft(
  data: BookFormData
): Promise<ActionResult> {
  bookDraftSchema.parse(data);

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { success: false, errors: {}, message: "You must be signed in." };
  }

  const { data: book, error } = await supabase
    .from("books")
    .insert({ ...mapFormToRow(data, "draft"), user_id: user.id })
    .select("id")
    .single();

  if (error || !book) {
    return {
      success: false,
      errors: {},
      message: formatDbError(error?.message || "Failed to save draft."),
    };
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    bookId: book.id,
    redirectTo: `/dashboard/book/${book.id}/edit`,
  };
}

export async function createBook(data: BookFormData): Promise<ActionResult> {
  const result = bookCreateSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: zodErrorsToRecord(result.error.errors),
    };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { success: false, errors: {}, message: "You must be signed in." };
  }

  const { data: book, error } = await supabase
    .from("books")
    .insert({ ...mapFormToRow(data, "active"), user_id: user.id })
    .select("id")
    .single();

  if (error || !book) {
    return {
      success: false,
      errors: {},
      message: formatDbError(error?.message || "Failed to create book."),
    };
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    bookId: book.id,
    redirectTo: `/dashboard/book/${book.id}`,
  };
}

export async function updateBookDraft(
  bookId: string,
  data: BookFormData
): Promise<ActionResult> {
  bookDraftSchema.parse(data);

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { success: false, errors: {}, message: "You must be signed in." };
  }

  const { data: book, error } = await supabase
    .from("books")
    .update(mapFormToRow(data, "draft"))
    .eq("id", bookId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !book) {
    return {
      success: false,
      errors: {},
      message: formatDbError(error?.message || "Failed to update draft."),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/book/${bookId}`);
  revalidatePath(`/dashboard/book/${bookId}/edit`);
  return { success: true, bookId: book.id };
}

export async function finalizeBook(
  bookId: string,
  data: BookFormData
): Promise<ActionResult> {
  const result = bookCreateSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: zodErrorsToRecord(result.error.errors),
    };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { success: false, errors: {}, message: "You must be signed in." };
  }

  const { data: book, error } = await supabase
    .from("books")
    .update(mapFormToRow(data, "active"))
    .eq("id", bookId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !book) {
    return {
      success: false,
      errors: {},
      message: formatDbError(error?.message || "Failed to create book."),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/book/${bookId}`);
  return {
    success: true,
    bookId: book.id,
    redirectTo: `/dashboard/book/${book.id}`,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SubmitResult =
  | { success: true }
  | { success: false; message: string };

function formatDbError(message: string): string {
  if (
    message.includes("Could not find") ||
    message.includes("schema cache") ||
    message.includes("user_feedback")
  ) {
    return "Database setup required: run supabase/setup-feedback.sql in Supabase SQL Editor.";
  }
  return message;
}

export async function submitFeedback(
  message: string,
  pagePath?: string
): Promise<SubmitResult> {
  try {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      return {
        success: false,
        message: "Please enter at least 3 characters of feedback.",
      };
    }
    if (trimmed.length > 5000) {
      return {
        success: false,
        message: "Feedback is too long (max 5000 characters).",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "You must be signed in to send feedback." };
    }

    const { error } = await supabase.from("user_feedback").insert({
      user_id: user.id,
      user_email: user.email ?? "",
      message: trimmed,
      page_path: pagePath?.trim() || null,
    });

    if (error) {
      return {
        success: false,
        message: formatDbError(error.message || "Failed to send feedback."),
      };
    }

    revalidatePath("/admin/feedback");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to send feedback.",
    };
  }
}

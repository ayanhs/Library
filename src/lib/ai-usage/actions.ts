"use server";

import { revalidatePath } from "next/cache";
import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; message: string };

function formatDbError(message: string): string {
  if (
    message.includes("Could not find") ||
    message.includes("ai_settings")
  ) {
    return "Run supabase/setup-ai-limits.sql in Supabase SQL Editor.";
  }
  return message;
}

export async function setAiGenerationEnabled(
  enabled: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminUser(user)) {
      return { success: false, message: "Not authorized." };
    }

    const { error } = await supabase
      .from("ai_settings")
      .update({
        ai_enabled: enabled,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", "global");

    if (error) {
      return {
        success: false,
        message: formatDbError(error.message || "Failed to update setting."),
      };
    }

    revalidatePath("/admin/usage");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update setting.",
    };
  }
}

export async function getAiGenerationEnabled(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_settings")
      .select("ai_enabled")
      .eq("id", "global")
      .maybeSingle();
    return data?.ai_enabled ?? true;
  } catch {
    return true;
  }
}

import { NextResponse } from "next/server";
import { getUserAiUsageSummary } from "@/lib/ai-usage/guard";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await getUserAiUsageSummary(user.id);
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(
      { error: "Failed to load usage summary." },
      { status: 500 }
    );
  }
}

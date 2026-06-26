import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId } = await params;
    const body = await request.json().catch(() => ({}));
    const coverId = body.coverId as string | undefined;

    if (!coverId) {
      return NextResponse.json({ error: "Cover id required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: cover } = await supabase
      .from("book_covers")
      .select("id")
      .eq("id", coverId)
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!cover) {
      return NextResponse.json({ error: "Cover not found." }, { status: 404 });
    }

    const { error } = await supabase
      .from("books")
      .update({
        selected_cover_id: coverId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to select cover." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, coverId });
  } catch {
    return NextResponse.json({ error: "Failed to select cover." }, { status: 500 });
  }
}

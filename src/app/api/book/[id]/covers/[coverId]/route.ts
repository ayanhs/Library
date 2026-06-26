import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string; coverId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId, coverId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: cover } = await supabase
      .from("book_covers")
      .select("image_data, mime_type")
      .eq("id", coverId)
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!cover?.image_data) {
      return NextResponse.json({ error: "Cover not found." }, { status: 404 });
    }

    const buffer = Buffer.from(cover.image_data, "base64");
    const mimeType = cover.mime_type || "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load cover." }, { status: 500 });
  }
}

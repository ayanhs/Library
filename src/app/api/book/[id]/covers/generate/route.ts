import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getBookById } from "@/lib/books/queries";
import { getBlueprintByBookId } from "@/lib/blueprint/queries";
import { withAiGuard } from "@/lib/ai-usage/with-guard";
import { fetchSingleCoverImage, getCoverGenerationConfig } from "@/lib/covers/image-gen";
import { generateCoverPromptsWithAI } from "@/lib/covers/openai";
import { toCoverPreviews } from "@/lib/covers/queries";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const maxDuration = 60;

function formatDbError(message: string): string {
  if (
    message.includes("Could not find") ||
    message.includes("schema cache") ||
    message.includes("book_covers")
  ) {
    return "Database setup required: run supabase/setup-export-covers.sql in Supabase SQL Editor.";
  }
  return message;
}

/** Step 1: generate Groq prompts and return a batch id. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId } = await params;
    const body = await request.json().catch(() => ({}));
    const phase = body.phase as string | undefined;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (phase === "prompts") {
      const [book, blueprint] = await Promise.all([
        getBookById(bookId, user.id),
        getBlueprintByBookId(bookId, user.id),
      ]);

      if (!book) {
        return NextResponse.json({ error: "Book not found." }, { status: 404 });
      }

      if (!blueprint || blueprint.status !== "approved") {
        return NextResponse.json(
          { error: "Approve your story blueprint before generating cover art." },
          { status: 400 }
        );
      }

      const authorName = book.author_name?.trim() || "Author";
      const description =
        book.book_description?.trim() ||
        blueprint.blueprint.summary.trim() ||
        book.story_prompt?.trim() ||
        "";

      const aiResult = await withAiGuard(user.id, "cover", () =>
        generateCoverPromptsWithAI({
          book,
          blueprint: blueprint.blueprint,
          authorName,
          description,
        })
      );

      if (!aiResult.success) {
        return NextResponse.json(
          {
            error: aiResult.message,
            code: aiResult.code,
            coverCooldownSeconds: aiResult.coverCooldownSeconds,
          },
          { status: 429 }
        );
      }

      const promptSpecs = aiResult.data;

      const batchId = randomUUID();

      await supabase
        .from("books")
        .update({
          selected_cover_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookId)
        .eq("user_id", user.id);

      const options = promptSpecs.map((spec) => ({
        style: spec.style,
        prompt: spec.prompt,
        fullPrompt: `${spec.prompt} Style: ${spec.style}. Professional book cover illustration, portrait orientation, no text, no typography, no letters, no words.`,
      }));

      return NextResponse.json({
        batchId,
        options,
        ...getCoverGenerationConfig(),
      });
    }

    if (phase === "image") {
      const batchId = body.batchId as string | undefined;
      const index = body.index as number | undefined;
      const style = body.style as string | undefined;
      const prompt = body.prompt as string | undefined;
      const fullPrompt = body.fullPrompt as string | undefined;

      if (
        !batchId ||
        typeof index !== "number" ||
        index < 0 ||
        index > 2 ||
        !style ||
        !prompt ||
        !fullPrompt
      ) {
        return NextResponse.json({ error: "Invalid image request." }, { status: 400 });
      }

      const book = await getBookById(bookId, user.id);
      if (!book) {
        return NextResponse.json({ error: "Book not found." }, { status: 404 });
      }

      const seed = Date.now() + index * 997;
      let buffer: Buffer;
      let usedFallback = false;
      let errorMessage: string | undefined;

      try {
        const result = await fetchSingleCoverImage(fullPrompt, seed, style);
        buffer = result.buffer;
        usedFallback = result.usedFallback;
        errorMessage = result.errorMessage;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Cover image generation failed.";
        return NextResponse.json({ error: message }, { status: 503 });
      }

      const { data: inserted, error } = await supabase
        .from("book_covers")
        .insert({
          book_id: bookId,
          user_id: user.id,
          batch_id: batchId,
          prompt: `${style}: ${prompt}`,
          image_data: buffer.toString("base64"),
          mime_type: buffer[0] === 0x89 ? "image/png" : "image/jpeg",
        })
        .select("*")
        .single();

      if (error || !inserted) {
        return NextResponse.json(
          { error: formatDbError(error?.message || "Failed to save cover.") },
          { status: 500 }
        );
      }

      const [preview] = toCoverPreviews(
        [
          {
            id: inserted.id,
            prompt: inserted.prompt,
            mime_type: inserted.mime_type,
          },
        ],
        bookId
      );
      return NextResponse.json({
        cover: preview,
        usedFallback,
        warning: usedFallback ? errorMessage : undefined,
      });
    }

    return NextResponse.json({ error: "Unknown phase." }, { status: 400 });
  } catch (err) {
    console.error("Cover generation failed:", err);
    const message =
      err instanceof Error ? err.message : "Cover generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

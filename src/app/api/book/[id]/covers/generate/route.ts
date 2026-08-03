import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getBookById } from "@/lib/books/queries";
import { getBlueprintByBookId } from "@/lib/blueprint/queries";
import { assertAiUsageAllowed } from "@/lib/ai-usage/with-guard";
import { recordAiRequest } from "@/lib/ai-usage/guard";
import {
  createCoverImageSeed,
  fetchSingleCoverImage,
  getCoverGenerationConfig,
} from "@/lib/covers/image-gen";
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

      const usageCheck = await assertAiUsageAllowed(user.id, "cover");
      if (!usageCheck.success) {
        return NextResponse.json(
          {
            error: usageCheck.message,
            code: usageCheck.code,
            coverCooldownSeconds: usageCheck.coverCooldownSeconds,
          },
          { status: 429 }
        );
      }

      let promptSpecs;
      try {
        promptSpecs = await generateCoverPromptsWithAI({
          book,
          blueprint: blueprint.blueprint,
          authorName,
          description,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create cover prompts.";
        await recordAiRequest(user.id, "cover", "failure", message);
        return NextResponse.json({ error: message }, { status: 500 });
      }

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

      const seed = createCoverImageSeed(index);
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
        warning: errorMessage,
      });
    }

    if (phase === "complete") {
      const batchId = body.batchId as string | undefined;
      const realImageCount = body.realImageCount as number | undefined;

      if (!batchId || typeof realImageCount !== "number" || realImageCount < 0) {
        return NextResponse.json({ error: "Invalid complete request." }, { status: 400 });
      }

      const { count, error: countError } = await supabase
        .from("book_covers")
        .select("id", { count: "exact", head: true })
        .eq("batch_id", batchId)
        .eq("book_id", bookId)
        .eq("user_id", user.id);

      if (countError || !count) {
        return NextResponse.json({ error: "Cover batch not found." }, { status: 404 });
      }

      const charged = realImageCount > 0;

      if (charged) {
        await recordAiRequest(user.id, "cover", "success");
      }

      return NextResponse.json({
        charged,
        message: charged
          ? undefined
          : "No daily cover credit used because no AI images were generated.",
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

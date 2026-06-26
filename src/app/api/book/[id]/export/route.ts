import { NextRequest, NextResponse } from "next/server";
import { getBookById } from "@/lib/books/queries";
import { getBlueprintByBookId } from "@/lib/blueprint/queries";
import { getChaptersByBookId } from "@/lib/chapters/queries";
import { getSelectedCover } from "@/lib/covers/queries";
import { updateExportMetadata } from "@/lib/export/actions";
import {
  buildExportBookData,
  getExportReadiness,
} from "@/lib/export/gather";
import { generateExportFile } from "@/lib/export/index";
import {
  EXPORT_FORMATS,
  sanitizeFilename,
  type ExportFormat,
} from "@/lib/export/types";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_FORMATS = new Set<ExportFormat>(["pdf", "docx", "epub"]);

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId } = await params;
    const format = request.nextUrl.searchParams.get("format") as ExportFormat | null;

    if (!format || !VALID_FORMATS.has(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use pdf, docx, or epub." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authorName = request.nextUrl.searchParams.get("author")?.trim();
    const description = request.nextUrl.searchParams.get("description")?.trim();

    if (request.nextUrl.searchParams.has("author")) {
      await updateExportMetadata(
        bookId,
        authorName ?? "",
        description ?? ""
      );
    }

    const [book, blueprint, chapters, coverImage] = await Promise.all([
      getBookById(bookId, user.id),
      getBlueprintByBookId(bookId, user.id),
      getChaptersByBookId(bookId, user.id),
      getSelectedCover(bookId, user.id),
    ]);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const readiness = getExportReadiness(blueprint, chapters);
    if (!readiness.ready || !blueprint) {
      return NextResponse.json({ error: readiness.message }, { status: 400 });
    }

    const exportData = buildExportBookData(book, chapters, blueprint);

    if (authorName) {
      exportData.authorName = authorName;
    }
    if (description) {
      exportData.description = description;
    }
    if (coverImage) {
      exportData.coverImage = coverImage;
    }

    if (exportData.chapters.length === 0) {
      return NextResponse.json(
        { error: "No chapter content to export." },
        { status: 400 }
      );
    }

    const buffer = await generateExportFile(format, exportData);
    const meta = EXPORT_FORMATS.find((f) => f.id === format)!;
    const filename = `${sanitizeFilename(exportData.title)}.${meta.extension}`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": meta.mime,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Export failed:", err);
    const message =
      err instanceof Error ? err.message : "Export failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { randomUUID } from "crypto";
import { unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import epub from "epub-gen-memory";
import type { ExportBookData } from "@/lib/export/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function proseToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

export async function generateEpubExport(data: ExportBookData): Promise<Buffer> {
  let coverPath: string | undefined;
  if (data.coverImage) {
    const ext = data.coverImage.mimeType.includes("png") ? "png" : "jpg";
    coverPath = join(tmpdir(), `cover-${randomUUID()}.${ext}`);
    writeFileSync(coverPath, data.coverImage.buffer);
  }

  const coverHtml = data.coverImage
    ? `<div style="text-align:center;min-height:90vh;display:flex;flex-direction:column;justify-content:space-between;">
        <img src="data:${data.coverImage.mimeType};base64,${data.coverImage.buffer.toString("base64")}" alt="Cover" style="width:100%;max-width:100%;height:auto;" />
        <p style="font-size:1.1em;margin:2em 0 1em;">${escapeHtml(data.authorName)}</p>
      </div>`
    : `<div style="text-align:center;min-height:90vh;display:flex;flex-direction:column;justify-content:space-between;padding-top:30%;">
      <h1>${escapeHtml(data.title)}</h1>
      <p style="font-size:1.2em;margin:2em 0 1em;">${escapeHtml(data.authorName)}</p>
    </div>`;

  const blankPageHtml = `<div style="min-height:90vh;"></div>`;

  const summaryHtml = `
    <h1>Summary</h1>
    ${data.description ? proseToHtml(data.description) : ""}`;

  const content = [
    {
      title: "Cover",
      content: coverHtml,
      beforeToc: true,
      excludeFromToc: true,
    },
    {
      title: "Blank",
      content: blankPageHtml,
      beforeToc: true,
      excludeFromToc: true,
    },
    {
      title: "Summary",
      content: summaryHtml,
      beforeToc: true,
      excludeFromToc: true,
    },
    ...data.chapters.map((chapter) => ({
      title: `Chapter ${chapter.number}: ${chapter.title}`,
      content: `
        <h1>Chapter ${chapter.number}</h1>
        <h2>${escapeHtml(chapter.title)}</h2>
        ${proseToHtml(chapter.content)}`,
    })),
  ];

  try {
    const buffer = await epub(
      {
        title: data.title,
        author: data.authorName,
        description: data.description || undefined,
        publisher: "AI Publishing Studio",
        lang: "en",
        tocTitle: "Table of Contents",
        prependChapterTitles: true,
        version: 3,
        cover: coverPath,
      },
      content
    );

    return Buffer.from(buffer);
  } finally {
    if (coverPath) {
      try {
        unlinkSync(coverPath);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

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

function buildTocHtml(data: ExportBookData): string {
  const items = data.chapters
    .map(
      (chapter) =>
        `<li>Chapter ${chapter.number}: ${escapeHtml(chapter.title)}</li>`
    )
    .join("\n");

  return `<h1>Table of Contents</h1><ul>${items}</ul>`;
}

export async function generateEpubExport(data: ExportBookData): Promise<Buffer> {
  let coverPath: string | undefined;
  if (data.coverImage) {
    const ext = data.coverImage.mimeType.includes("png") ? "png" : "jpg";
    coverPath = join(tmpdir(), `cover-${randomUUID()}.${ext}`);
    writeFileSync(coverPath, data.coverImage.buffer);
  }

  const authorBarStyle =
    "position:absolute;left:0;right:0;bottom:0;padding:2.5em 1em 1.25em;text-align:center;" +
    "background:linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 55%, transparent 100%);" +
    "color:#fff;font-size:1.15em;font-weight:600;" +
    "text-shadow:0 1px 3px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.75);";

  const coverHtml = data.coverImage
    ? `<div style="position:relative;min-height:90vh;text-align:center;">
        <img src="data:${data.coverImage.mimeType};base64,${data.coverImage.buffer.toString("base64")}" alt="Cover" style="width:100%;max-width:100%;height:auto;display:block;" />
        <p style="${authorBarStyle}">${escapeHtml(data.authorName)}</p>
      </div>`
    : `<div style="text-align:center;min-height:90vh;display:flex;flex-direction:column;justify-content:space-between;padding-top:30%;">
      <h1>${escapeHtml(data.title)}</h1>
      <p style="margin:2em 1em 1.5em;padding:0.75em 1em;background:#1a1a1a;color:#fff;font-size:1.15em;font-weight:600;">${escapeHtml(data.authorName)}</p>
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
    {
      title: "Table of Contents",
      content: buildTocHtml(data),
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
    {
      title: "End",
      content: blankPageHtml,
      excludeFromToc: true,
    },
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

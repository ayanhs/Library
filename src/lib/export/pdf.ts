import { createRequire } from "module";
import type { ExportBookData } from "@/lib/export/types";

const require = createRequire(import.meta.url);
const PDFDocument = require("pdfkit") as typeof import("pdfkit");

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 72;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - MARGIN;

type PdfDoc = InstanceType<typeof PDFDocument>;

function addParagraphs(
  doc: PdfDoc,
  text: string,
  options?: { fontSize?: number; lineGap?: number }
) {
  const fontSize = options?.fontSize ?? 11;
  const lineGap = options?.lineGap ?? 4;
  doc.fontSize(fontSize).font("Times-Roman");

  const paragraphs = text.split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    doc.text(trimmed, MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      align: "justify",
      lineGap,
    });
    doc.moveDown(0.5);
  }
}

/** Rough bottom-band luminance for PNG/JPEG buffers — defaults to dark if unknown. */
function estimateBottomBandIsLight(imageBuffer: Buffer): boolean {
  if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
    let sum = 0;
    let samples = 0;
    const start = Math.max(0, imageBuffer.length - 24_000);
    for (let i = start; i < imageBuffer.length - 3; i += 4) {
      sum += imageBuffer[i] + imageBuffer[i + 1] + imageBuffer[i + 2];
      samples += 1;
    }
    if (samples === 0) return false;
    return sum / samples / 3 > 150;
  }

  return false;
}

function drawAdaptiveAuthorOnCover(
  doc: PdfDoc,
  authorName: string,
  coverBuffer?: Buffer
) {
  const bandTop = PAGE_HEIGHT - 130;
  const isLight = coverBuffer ? estimateBottomBandIsLight(coverBuffer) : false;
  const scrimColor = isLight ? "#ffffff" : "#000000";
  const textColor = isLight ? "#111111" : "#ffffff";
  const shadowColor = isLight ? "#ffffff" : "#000000";

  doc.save();
  doc.opacity(isLight ? 0.82 : 0.72);
  doc.rect(0, bandTop, PAGE_WIDTH, PAGE_HEIGHT - bandTop).fill(scrimColor);
  doc.restore();

  const textY = PAGE_HEIGHT - 68;
  const textOptions = {
    width: CONTENT_WIDTH,
    align: "center" as const,
    lineBreak: false,
  };

  doc.font("Times-Bold").fontSize(18);
  doc.fillColor(shadowColor);
  doc.text(authorName, MARGIN + 1, textY + 1, textOptions);
  doc.fillColor(textColor);
  doc.text(authorName, MARGIN, textY, textOptions);
  doc.fillColor("#000000");
}

function addCoverPage(doc: PdfDoc, data: ExportBookData) {
  if (data.coverImage) {
    doc.image(data.coverImage.buffer, 0, 0, {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
    });
    drawAdaptiveAuthorOnCover(doc, data.authorName, data.coverImage.buffer);
    return;
  }

  doc.font("Times-Bold").fontSize(34);
  doc.text(data.title, MARGIN, PAGE_HEIGHT * 0.35, {
    width: CONTENT_WIDTH,
    align: "center",
  });
  drawAdaptiveAuthorOnCover(doc, data.authorName);
}

function addTableOfContents(doc: PdfDoc, data: ExportBookData) {
  doc.addPage();
  doc.font("Times-Bold").fontSize(22);
  doc.text("Table of Contents", MARGIN, MARGIN, { width: CONTENT_WIDTH });
  doc.moveDown(1.5);
  doc.font("Times-Roman").fontSize(12);
  for (const chapter of data.chapters) {
    doc.text(`Chapter ${chapter.number}: ${chapter.title}`, {
      width: CONTENT_WIDTH,
    });
    doc.moveDown(0.4);
  }
}

function addCenteredPageNumber(doc: PdfDoc, pageNum: number) {
  doc.font("Times-Roman").fontSize(10).fillColor("#666666");
  doc.text(String(pageNum), MARGIN, FOOTER_Y, {
    width: CONTENT_WIDTH,
    align: "center",
    lineBreak: false,
  });
  doc.fillColor("#000000");
}

function getNextPageIndex(doc: PdfDoc): number {
  const range = doc.bufferedPageRange();
  return range.start + range.count;
}

export async function generatePdfExport(data: ExportBookData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: MARGIN, bottom: MARGIN + 24, left: MARGIN, right: MARGIN },
      bufferPages: true,
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addCoverPage(doc, data);

    doc.addPage();

    doc.addPage();
    doc.font("Times-Bold").fontSize(20);
    doc.text("Summary", MARGIN, MARGIN, { width: CONTENT_WIDTH });
    doc.moveDown(1);
    if (data.description) {
      addParagraphs(doc, data.description, { fontSize: 11 });
    }

    addTableOfContents(doc, data);

    const bodyStartPage = getNextPageIndex(doc);

    for (const chapter of data.chapters) {
      doc.addPage();
      doc.font("Times-Bold").fontSize(20);
      doc.text(`Chapter ${chapter.number}`, { width: CONTENT_WIDTH });
      doc.moveDown(0.3);
      doc.fontSize(16);
      doc.text(chapter.title, { width: CONTENT_WIDTH });
      doc.moveDown(1);
      addParagraphs(doc, chapter.content);
    }

    const bodyEndPage = getNextPageIndex(doc) - 1;

    doc.addPage();

    for (let i = bodyStartPage; i <= bodyEndPage; i++) {
      doc.switchToPage(i);
      addCenteredPageNumber(doc, i - bodyStartPage + 1);
    }

    doc.end();
  });
}

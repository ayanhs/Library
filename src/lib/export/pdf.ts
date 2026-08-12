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

function addCoverPage(doc: PdfDoc, data: ExportBookData) {
  if (data.coverImage) {
    doc.image(data.coverImage.buffer, 0, 0, {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
    });
    doc.save();
    doc.opacity(0.45);
    doc.rect(0, PAGE_HEIGHT - 100, PAGE_WIDTH, 100).fill("#000000");
    doc.restore();
    doc.font("Times-Roman").fontSize(16).fillColor("#ffffff");
    doc.text(data.authorName, MARGIN, PAGE_HEIGHT - 72, {
      width: CONTENT_WIDTH,
      align: "center",
      lineBreak: false,
    });
    doc.fillColor("#000000");
    return;
  }

  doc.font("Times-Bold").fontSize(34);
  doc.text(data.title, MARGIN, PAGE_HEIGHT * 0.35, {
    width: CONTENT_WIDTH,
    align: "center",
  });
  doc.font("Times-Roman").fontSize(16);
  doc.text(data.authorName, MARGIN, PAGE_HEIGHT - 72, {
    width: CONTENT_WIDTH,
    align: "center",
    lineBreak: false,
  });
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

    // Page 1 — cover art (or title fallback) with author at the bottom
    addCoverPage(doc, data);

    // Page 2 — intentionally blank
    doc.addPage();

    // Page 3 — summary
    doc.addPage();
    doc.font("Times-Bold").fontSize(20);
    doc.text("Summary", MARGIN, MARGIN, { width: CONTENT_WIDTH });
    doc.moveDown(1);
    if (data.description) {
      addParagraphs(doc, data.description, { fontSize: 11 });
    }

    const chapterStartPage =
      doc.bufferedPageRange().start + doc.bufferedPageRange().count;

    // Chapters — page numbers on every page from here
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

    const range = doc.bufferedPageRange();
    for (let i = chapterStartPage; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      addCenteredPageNumber(doc, i - chapterStartPage + 1);
    }

    doc.end();
  });
}

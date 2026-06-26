import { createRequire } from "module";
import type { ExportBookData } from "@/lib/export/types";

const require = createRequire(import.meta.url);
const PDFDocument = require("pdfkit") as typeof import("pdfkit");

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 72;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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

    if (data.coverImage) {
      doc.image(data.coverImage.buffer, 0, 0, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });
      doc.save();
      doc.opacity(0.55);
      doc.rect(0, PAGE_HEIGHT - 170, PAGE_WIDTH, 170).fill("#000000");
      doc.restore();
      doc.font("Times-Bold").fontSize(26).fillColor("#ffffff");
      doc.text(data.title, MARGIN, PAGE_HEIGHT - 130, {
        width: CONTENT_WIDTH,
        align: "center",
      });
      doc.font("Times-Roman").fontSize(14);
      doc.text(data.authorName, MARGIN, doc.y + 8, {
        width: CONTENT_WIDTH,
        align: "center",
      });
      doc.fillColor("#000000");
    } else {
      doc.font("Times-Bold").fontSize(34);
      doc.text(data.title, MARGIN, PAGE_HEIGHT * 0.35, {
        width: CONTENT_WIDTH,
        align: "center",
      });
      doc.moveDown(2);
      doc.font("Times-Roman").fontSize(16);
      doc.text(data.authorName, { width: CONTENT_WIDTH, align: "center" });
      if (data.genre) {
        doc.moveDown(1);
        doc.fontSize(12).fillColor("#555555");
        doc.text(data.genre, { width: CONTENT_WIDTH, align: "center" });
        doc.fillColor("#000000");
      }
    }

    doc.addPage();
    doc.font("Times-Bold").fontSize(28);
    doc.text(data.title, { width: CONTENT_WIDTH, align: "center" });
    doc.moveDown(1.5);
    doc.font("Times-Roman").fontSize(14);
    doc.text(`by ${data.authorName}`, { width: CONTENT_WIDTH, align: "center" });
    if (data.description) {
      doc.moveDown(2);
      doc.fontSize(11);
      addParagraphs(doc, data.description, { fontSize: 11 });
    }

    doc.addPage();
    doc.font("Times-Bold").fontSize(22);
    doc.text("Table of Contents", MARGIN, MARGIN);
    doc.moveDown(1.5);
    doc.font("Times-Roman").fontSize(12);
    for (const chapter of data.chapters) {
      doc.text(`Chapter ${chapter.number}: ${chapter.title}`, {
        width: CONTENT_WIDTH,
      });
      doc.moveDown(0.4);
    }

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
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      if (i === range.start) continue;
      const pageNum = i - range.start;
      doc.font("Times-Roman").fontSize(10).fillColor("#666666");
      doc.text(String(pageNum), MARGIN, PAGE_HEIGHT - MARGIN, {
        width: CONTENT_WIDTH,
        align: "center",
        lineBreak: false,
      });
      doc.fillColor("#000000");
    }

    doc.end();
  });
}

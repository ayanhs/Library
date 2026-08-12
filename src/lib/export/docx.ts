import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  PageBreak,
  Packer,
  Paragraph,
  TextRun,
  PageNumber,
} from "docx";
import type { ExportBookData } from "@/lib/export/types";

const PAGE_MARGIN = { top: 1440, right: 1440, bottom: 1440, left: 1440 };

function bodyParagraphs(text: string): Paragraph[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        new Paragraph({
          spacing: { after: 200, line: 360 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: paragraph,
              font: "Times New Roman",
              size: 24,
            }),
          ],
        })
    );
}

function centered(text: string, size: number, bold = false): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [
      new TextRun({
        text,
        bold,
        font: "Times New Roman",
        size,
      }),
    ],
  });
}

function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

function buildFrontMatter(data: ExportBookData): Paragraph[] {
  const children: Paragraph[] = [];

  if (data.coverImage) {
    const coverType = data.coverImage.mimeType.includes("png") ? "png" : "jpg";
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new ImageRun({
            type: coverType,
            data: data.coverImage.buffer,
            transformation: { width: 360, height: 540 },
          }),
        ],
      })
    );
    children.push(new Paragraph({ spacing: { before: 2800 } }));
    children.push(centered(data.authorName, 24));
  } else {
    children.push(new Paragraph({ spacing: { before: 3000 } }));
    children.push(centered(data.title, 56, true));
    children.push(new Paragraph({ spacing: { before: 3200 } }));
    children.push(centered(data.authorName, 32));
  }

  // Page 2 — blank
  children.push(pageBreak());
  children.push(new Paragraph({ children: [new TextRun({ text: "" })] }));

  // Page 3 — summary
  children.push(pageBreak());
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: "Summary",
          bold: true,
          font: "Times New Roman",
          size: 32,
        }),
      ],
    })
  );
  if (data.description) {
    children.push(...bodyParagraphs(data.description));
  }

  return children;
}

function buildChapters(data: ExportBookData): Paragraph[] {
  const children: Paragraph[] = [];

  for (let index = 0; index < data.chapters.length; index++) {
    const chapter = data.chapters[index];

    if (index > 0) {
      children.push(pageBreak());
    }

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: `Chapter ${chapter.number}`,
            bold: true,
            font: "Times New Roman",
            size: 28,
          }),
        ],
      })
    );
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: chapter.title,
            font: "Times New Roman",
            size: 26,
          }),
        ],
      })
    );
    children.push(...bodyParagraphs(chapter.content));
  }

  return children;
}

export async function generateDocxExport(data: ExportBookData): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: PAGE_MARGIN },
        },
        children: buildFrontMatter(data),
      },
      {
        properties: {
          page: {
            margin: PAGE_MARGIN,
            pageNumbers: { start: 1 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Times New Roman",
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        },
        children: buildChapters(data),
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

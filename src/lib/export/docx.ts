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

export async function generateDocxExport(data: ExportBookData): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Cover
  if (data.coverImage) {
    const coverType = data.coverImage.mimeType.includes("png") ? "png" : "jpg";
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [
          new ImageRun({
            type: coverType,
            data: data.coverImage.buffer,
            transformation: { width: 360, height: 540 },
          }),
        ],
      })
    );
    children.push(centered(data.title, 40, true));
    children.push(centered(data.authorName, 24));
  } else {
    children.push(new Paragraph({ spacing: { before: 3000 } }));
    children.push(centered(data.title, 56, true));
    children.push(centered(data.authorName, 32));
    if (data.genre) {
      children.push(centered(data.genre, 22));
    }
  }
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Title page
  children.push(new Paragraph({ spacing: { before: 2000 } }));
  children.push(centered(data.title, 48, true));
  children.push(centered(`by ${data.authorName}`, 28));
  if (data.description) {
    children.push(new Paragraph({ spacing: { before: 400 } }));
    children.push(...bodyParagraphs(data.description));
  }
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Table of contents
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: "Table of Contents",
          bold: true,
          font: "Times New Roman",
          size: 32,
        }),
      ],
    })
  );
  for (const chapter of data.chapters) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `Chapter ${chapter.number}: ${chapter.title}`,
            font: "Times New Roman",
            size: 24,
          }),
        ],
      })
    );
  }
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Chapters
  for (const chapter of data.chapters) {
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
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ["Page ", PageNumber.CURRENT],
                    font: "Times New Roman",
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

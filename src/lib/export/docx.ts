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

function authorOnCoverParagraph(authorName: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 120 },
    shading: { fill: "1A1A1A", color: "auto" },
    children: [
      new TextRun({
        text: authorName,
        bold: true,
        font: "Times New Roman",
        size: 28,
        color: "FFFFFF",
      }),
    ],
  });
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
    children.push(authorOnCoverParagraph(data.authorName));
  } else {
    children.push(new Paragraph({ spacing: { before: 3000 } }));
    children.push(centered(data.title, 56, true));
    children.push(authorOnCoverParagraph(data.authorName));
  }

  children.push(pageBreak());
  children.push(new Paragraph({ children: [new TextRun({ text: "" })] }));

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

  children.push(pageBreak());
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
      {
        properties: {
          page: { margin: PAGE_MARGIN },
        },
        children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

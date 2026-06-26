export type ExportFormat = "pdf" | "docx" | "epub";

export interface ExportChapter {
  number: number;
  title: string;
  content: string;
}

export interface ExportCoverImage {
  buffer: Buffer;
  mimeType: string;
}

export interface ExportBookData {
  title: string;
  authorName: string;
  description: string;
  genre: string | null;
  chapters: ExportChapter[];
  coverImage?: ExportCoverImage;
}

export const EXPORT_FORMATS: {
  id: ExportFormat;
  label: string;
  description: string;
  mime: string;
  extension: string;
}[] = [
  {
    id: "pdf",
    label: "Export PDF",
    description: "Print-ready PDF with cover, TOC, and page numbers",
    mime: "application/pdf",
    extension: "pdf",
  },
  {
    id: "docx",
    label: "Export DOCX",
    description: "Microsoft Word document for editing and sharing",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
  },
  {
    id: "epub",
    label: "Export EPUB",
    description: "E-reader format for Kindle, Apple Books, and Kobo",
    mime: "application/epub+zip",
    extension: "epub",
  },
];

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "book";
}

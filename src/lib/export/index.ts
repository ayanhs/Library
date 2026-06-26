import type { ExportBookData, ExportFormat } from "@/lib/export/types";
import { generateDocxExport } from "@/lib/export/docx";
import { generateEpubExport } from "@/lib/export/epub";
import { generatePdfExport } from "@/lib/export/pdf";

export async function generateExportFile(
  format: ExportFormat,
  data: ExportBookData
): Promise<Buffer> {
  switch (format) {
    case "pdf":
      return generatePdfExport(data);
    case "docx":
      return generateDocxExport(data);
    case "epub":
      return generateEpubExport(data);
    default:
      throw new Error("Unsupported export format.");
  }
}

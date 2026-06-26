"use client";

import { Download, FileText, Loader2, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CoverArtPicker } from "@/components/export/cover-art-picker";
import { ErrorAlert, SuccessAlert } from "@/components/auth/auth-card";
import { BookFormField, BookFormInput, BookFormTextarea } from "@/components/books/form-fields";
import type { BookCoverPreview } from "@/lib/covers/types";
import { updateExportMetadata } from "@/lib/export/actions";
import type { ExportReadiness } from "@/lib/export/gather";
import { EXPORT_FORMATS, type ExportFormat } from "@/lib/export/types";
import { cn } from "@/lib/utils";

interface ExportPanelProps {
  bookId: string;
  title: string;
  initialAuthor: string;
  initialDescription: string;
  readiness: ExportReadiness;
  initialCovers: BookCoverPreview[];
  selectedCoverId: string | null;
  canGenerateCovers: boolean;
}

export function ExportPanel({
  bookId,
  title,
  initialAuthor,
  initialDescription,
  readiness,
  initialCovers,
  selectedCoverId,
  canGenerateCovers,
}: ExportPanelProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [authorName, setAuthorName] = useState(initialAuthor);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeCoverId, setActiveCoverId] = useState<string | null>(
    selectedCoverId
  );

  const handleSave = () => {
    setError("");
    setSuccess("");
    startSaveTransition(async () => {
      const result = await updateExportMetadata(bookId, authorName, description);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSuccess("Export details saved.");
      router.refresh();
    });
  };

  const handleExport = async (format: ExportFormat) => {
    if (!readiness.ready) return;
    setError("");
    setSuccess("");
    setDownloading(format);

    try {
      const params = new URLSearchParams({
        format,
        author: authorName.trim() || "Author",
        description: description.trim(),
      });

      const response = await fetch(
        `/api/book/${bookId}/export?${params.toString()}`
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Export failed.");
      }

      const blob = await response.blob();
      const meta = EXPORT_FORMATS.find((f) => f.id === format)!;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/[<>:"/\\|?*]/g, "").trim() || "book"}.${meta.extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccess(`${meta.label} downloaded successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setDownloading(null);
    }
  };

  const formatIcons = {
    pdf: FileText,
    docx: FileText,
    epub: Package,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export Book</h1>
        <p className="mt-1 text-sm text-muted">
          Download your finished manuscript as PDF, Word, or EPUB.
        </p>
      </div>

      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          readiness.ready
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
            : "border-amber-500/20 bg-amber-500/10 text-amber-200"
        )}
      >
        {readiness.message}
        {readiness.totalChapters > 0 && (
          <span className="ml-2 opacity-80">
            ({readiness.approvedCount}/{readiness.totalChapters} chapters)
          </span>
        )}
      </div>

      {error && <ErrorAlert message={error} />}
      {success && <SuccessAlert message={success} />}

      <section className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold">Book details for export</h2>

        <BookFormField label="Book title" htmlFor="export-title">
          <BookFormInput id="export-title" value={title} disabled />
        </BookFormField>

        <BookFormField label="Author name" htmlFor="export-author">
          <BookFormInput
            id="export-author"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your pen name or full name"
          />
        </BookFormField>

        <BookFormField label="Book description" htmlFor="export-description">
          <BookFormTextarea
            id="export-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Back-cover blurb or book summary"
            className="min-h-[120px]"
          />
        </BookFormField>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
        >
          {isSaving ? "Saving…" : "Save details"}
        </button>
      </section>

      <CoverArtPicker
        bookId={bookId}
        initialCovers={initialCovers}
        selectedCoverId={selectedCoverId}
        canGenerate={canGenerateCovers}
        onSelectionChange={setActiveCoverId}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">Download formats</h2>
        <p className="text-xs text-muted">
          Includes cover art (if selected), title page, table of contents,
          chapter headings, page breaks, and page numbers (PDF/DOCX).
        </p>
        {!activeCoverId && (
          <p className="text-xs text-amber-200/80">
            Check a cover and click &quot;Use this cover&quot; to include it in
            your export.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {EXPORT_FORMATS.map((format) => {
            const Icon = formatIcons[format.id];
            const isLoading = downloading === format.id;
            return (
              <button
                key={format.id}
                type="button"
                onClick={() => handleExport(format.id)}
                disabled={!readiness.ready || downloading !== null}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  readiness.ready
                    ? "border-white/10 bg-white/[0.03] hover:border-purple/30 hover:bg-purple/5"
                    : "cursor-not-allowed border-white/5 opacity-50",
                  isLoading && "border-purple/40 bg-purple/10"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <Icon className="h-5 w-5 text-purple-light" />
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-light" />
                  ) : (
                    <Download className="h-4 w-4 text-muted" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{format.label}</p>
                  <p className="mt-1 text-xs text-muted">{format.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookNav } from "@/components/books/book-nav";
import { ExportPanel } from "@/components/export/export-panel";
import { getBlueprintByBookId } from "@/lib/blueprint/queries";
import { getChaptersByBookId } from "@/lib/chapters/queries";
import {
  getLatestCoverBatch,
  toCoverPreviews,
} from "@/lib/covers/queries";
import { getExportReadiness } from "@/lib/export/gather";
import { getBookById } from "@/lib/books/queries";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";

interface ExportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExportPage({ params }: ExportPageProps) {
  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) redirect("/login");

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [book, blueprint, chapters, coverBatch] = await Promise.all([
    getBookById(id, user.id),
    getBlueprintByBookId(id, user.id),
    getChaptersByBookId(id, user.id),
    getLatestCoverBatch(id, user.id),
  ]);

  if (!book) notFound();

  const readiness = getExportReadiness(blueprint, chapters);
  const canGenerateCovers = blueprint?.status === "approved";
  const coverPreviews = toCoverPreviews(coverBatch, id);

  const authorName = book.author_name?.trim() || "";
  const description =
    book.book_description?.trim() ||
    blueprint?.blueprint.summary?.trim() ||
    book.story_prompt?.trim() ||
    "";

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-purple/10 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-blue/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl animate-fade-in">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="glass-card gradient-border rounded-2xl p-6 sm:p-8">
          <BookNav bookId={book.id} bookTitle={book.title} active="export" />
          <ExportPanel
            bookId={book.id}
            title={book.title}
            initialAuthor={authorName}
            initialDescription={description}
            readiness={readiness}
            initialCovers={coverPreviews}
            selectedCoverId={book.selected_cover_id ?? null}
            canGenerateCovers={canGenerateCovers}
          />
        </div>
      </div>
    </div>
  );
}

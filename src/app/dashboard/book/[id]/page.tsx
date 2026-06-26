import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Pencil,
  Sparkles,
  User,
} from "lucide-react";
import { PublishingWorkflow } from "@/components/publishing/publishing-workflow";
import { DraftSetupBanner } from "@/components/books/draft-setup-banner";
import { BookNav } from "@/components/books/book-nav";
import { getBlueprintByBookId } from "@/lib/blueprint/queries";
import { getChaptersByBookId } from "@/lib/chapters/queries";
import { getBookById } from "@/lib/books/queries";
import { isBookSetupComplete } from "@/lib/books/utils";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

interface BookPageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon: React.ElementType;
}) {
  if (!value) return null;

  return (
    <div className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-purple-light" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground/90">
          {value}
        </p>
      </div>
    </div>
  );
}

export default async function BookPage({ params }: BookPageProps) {
  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) redirect("/login");

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [book, blueprintRecord, chapters] = await Promise.all([
    getBookById(id, user.id),
    getBlueprintByBookId(id, user.id),
    getChaptersByBookId(id, user.id),
  ]);

  if (!book) notFound();

  const setupComplete = isBookSetupComplete(book);
  const isDraft = book.status === "draft";

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-purple/10 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-blue/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl animate-fade-in">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="glass-card gradient-border rounded-2xl p-6 sm:p-8">
          {isDraft && !setupComplete && <DraftSetupBanner book={book} />}

          <BookNav bookId={book.id} bookTitle={book.title} active="project" />

          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple/15 text-purple-light">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {book.title}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted">
                  {book.genre && <span>{book.genre}</span>}
                  {book.genre && book.audience && <span>·</span>}
                  {book.audience && <span>{book.audience}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/book/${book.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted transition-all hover:border-white/15 hover:bg-white/10 hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
                Edit Details
              </Link>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium capitalize",
                  book.status === "draft"
                    ? "border-slate-500/20 bg-slate-500/15 text-slate-300"
                    : "border-emerald-500/20 bg-emerald-500/15 text-emerald-300"
                )}
              >
                {book.status === "draft" ? "Draft" : "Active"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <DetailRow
              label="Main Character"
              value={
                book.main_character
                  ? book.character_age
                    ? `${book.main_character} (Age: ${book.character_age})`
                    : book.main_character
                  : null
              }
              icon={User}
            />
            <DetailRow
              label="Character Description"
              value={book.character_description}
              icon={User}
            />
            <DetailRow label="Setting" value={book.setting} icon={MapPin} />
            <DetailRow
              label="Story Prompt"
              value={book.story_prompt}
              icon={Sparkles}
            />
          </div>

          {setupComplete ? (
            <PublishingWorkflow
              bookId={book.id}
              blueprintRecord={blueprintRecord}
              chapters={chapters}
            />
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted/40" />
              <p className="text-sm font-medium text-foreground/80">
                Story blueprint locked
              </p>
              <p className="mt-1 text-sm text-muted">
                Complete your book setup to unlock AI Story Architect.
              </p>
              <Link
                href={`/dashboard/book/${book.id}/edit`}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-blue px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-purple/25"
              >
                <Pencil className="h-4 w-4" />
                Continue Setup
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

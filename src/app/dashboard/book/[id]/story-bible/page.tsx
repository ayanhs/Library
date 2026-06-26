import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookNav } from "@/components/books/book-nav";
import { StoryBibleView } from "@/components/story-bible/story-bible-view";
import { getBlueprintByBookId } from "@/lib/blueprint/queries";
import { getBookById } from "@/lib/books/queries";
import { getStoryBibleByBookId } from "@/lib/story-bible/queries";
import { createClient, getSupabaseEnv } from "@/lib/supabase/server";

interface StoryBiblePageProps {
  params: Promise<{ id: string }>;
}

export default async function StoryBiblePage({ params }: StoryBiblePageProps) {
  const { isConfigured } = getSupabaseEnv();
  if (!isConfigured) redirect("/login");

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [book, storyBible, blueprintRecord] = await Promise.all([
    getBookById(id, user.id),
    getStoryBibleByBookId(id, user.id),
    getBlueprintByBookId(id, user.id),
  ]);

  if (!book) notFound();

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
          <BookNav
            bookId={book.id}
            bookTitle={book.title}
            active="story-bible"
          />
          <StoryBibleView
            bookId={book.id}
            initialData={storyBible}
            hasBlueprint={blueprintRecord !== null}
          />
        </div>
      </div>
    </div>
  );
}

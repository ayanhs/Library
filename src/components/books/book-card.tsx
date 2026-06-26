import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { BookCardData } from "@/lib/books/types";
import { cn } from "@/lib/utils";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

const statusStyles: Record<BookCardData["status"], string> = {
  draft: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
};

export function BookCard({ book }: { book: BookCardData }) {
  return (
    <div
      className={cn(
        "glass-card group flex flex-col rounded-2xl p-5 transition-all duration-300",
        "hover:border-white/15 hover:shadow-lg hover:shadow-purple/5"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple/15 text-purple-light">
          <BookOpen className="h-5 w-5" />
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
            statusStyles[book.status]
          )}
        >
          {book.status === "draft" ? "Draft" : "Active"}
        </span>
      </div>

      <h3 className="mb-1 line-clamp-2 font-semibold leading-snug">
        {book.title}
      </h3>

      <p className="mb-1 text-sm text-muted">
        {book.genre || "No genre set"}
      </p>

      <p className="mb-5 text-xs text-muted/80">
        Updated {formatDate(book.updated_at)}
      </p>

      <Link
        href={
          book.status === "draft"
            ? `/dashboard/book/${book.id}/edit`
            : `/dashboard/book/${book.id}`
        }
        className={cn(
          "mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
          "bg-gradient-to-r from-purple/80 to-blue/80 text-white",
          "transition-all hover:from-purple hover:to-blue hover:shadow-md hover:shadow-purple/20"
        )}
      >
        {book.status === "draft" ? "Continue Setup" : "Open Project"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

export function RecentBooks({ books }: { books: BookCardData[] }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recent Books</h2>
          <p className="text-sm text-muted">Pick up where you left off</p>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-muted/50" />
          <p className="font-medium text-foreground/80">No books yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Create your first book to start building your story with AI.
          </p>
          <Link
            href="/dashboard/new-book"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-blue px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-purple/25"
          >
            Create New Book
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book, index) => (
            <div
              key={book.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <BookCard book={book} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { AlertCircle, Pencil } from "lucide-react";
import type { Book } from "@/lib/books/types";
import { getMissingSetupFields, getSetupProgress } from "@/lib/books/utils";

export function DraftSetupBanner({ book }: { book: Book }) {
  const missing = getMissingSetupFields(book);
  const { filled, total } = getSetupProgress(book);
  const progress = Math.round((filled / total) * 100);

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium text-amber-200">Book setup incomplete</p>
            <p className="mt-1 text-sm text-amber-100/90">
              Finish your book details before generating a story blueprint.
            </p>
            {missing.length > 0 && (
              <p className="mt-2 text-sm text-amber-100/80">
                Still needed: {missing.join(", ")}
              </p>
            )}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-amber-200/80">
                <span>Setup progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-amber-950/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <Link
          href={`/dashboard/book/${book.id}/edit`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple to-blue px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-purple-light hover:to-blue-light hover:shadow-lg hover:shadow-purple/25"
        >
          <Pencil className="h-4 w-4" />
          Continue Setup
        </Link>
      </div>
    </div>
  );
}

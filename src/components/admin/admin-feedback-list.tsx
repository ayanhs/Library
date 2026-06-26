import { MessageSquareText } from "lucide-react";
import type { UserFeedback } from "@/lib/feedback/types";

interface AdminFeedbackListProps {
  items: UserFeedback[];
  error: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminFeedbackList({ items, error }: AdminFeedbackListProps) {
  if (error) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-8 text-center text-sm text-amber-200/70">
        <MessageSquareText className="mx-auto mb-3 h-8 w-8 text-amber-400/50" />
        <p className="font-medium text-amber-100">Could not load feedback</p>
        <p className="mt-1 text-xs">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-500/20 px-6 py-12 text-center text-sm text-amber-200/50">
        <MessageSquareText className="mx-auto mb-3 h-8 w-8 opacity-40" />
        <p>No feedback yet. Users can send messages via the chat icon on any page.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-2xl border border-amber-500/15 bg-[#0f0c08]/80 p-5 backdrop-blur-sm"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200/50">
            <span className="font-medium text-amber-200/80">
              {item.user_email || "Unknown user"}
            </span>
            <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
          </div>
          {item.page_path && (
            <p className="mb-2 text-xs text-amber-200/40">
              Page: <span className="text-amber-200/60">{item.page_path}</span>
            </p>
          )}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-50/90">
            {item.message}
          </p>
        </li>
      ))}
    </ul>
  );
}

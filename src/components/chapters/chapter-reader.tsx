"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChapterReaderProps {
  content: string;
  title?: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  maxCollapsedHeight?: string;
  className?: string;
}

export function ChapterReader({
  content,
  title,
  subtitle,
  defaultExpanded = true,
  maxCollapsedHeight = "max-h-[70vh]",
  className,
}: ChapterReaderProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return (
    <div className={cn("rounded-xl border border-white/5 bg-white/[0.02]", className)}>
      {(title || subtitle) && (
        <div className="border-b border-white/5 px-4 py-3">
          {title && <p className="font-medium">{title}</p>}
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-2">
        <span className="text-xs text-muted">
          {wordCount.toLocaleString()} words
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-white/5 hover:text-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Expand full chapter
            </>
          )}
        </button>
      </div>

      <div
        className={cn(
          "overflow-y-auto p-4 sm:p-6",
          expanded ? maxCollapsedHeight : "max-h-48"
        )}
      >
        <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground/90">
          {content}
        </p>
      </div>
    </div>
  );
}

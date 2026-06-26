"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { EditorIssue } from "@/lib/editor/types";
import { ISSUE_CATEGORY_LABELS } from "@/lib/editor/types";
import { cn } from "@/lib/utils";

interface IssueListProps {
  issues: EditorIssue[];
}

const severityStyles = {
  high: "border-red-500/30 bg-red-500/10 text-red-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

export function IssueList({ issues }: IssueListProps) {
  const [expanded, setExpanded] = useState<number | null>(0);

  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-6 text-center text-sm text-emerald-200">
        No significant issues detected — great work!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="flex w-full items-start gap-3 p-4 text-left hover:bg-white/[0.02]"
          >
            {expanded === i ? (
              <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            ) : (
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                    severityStyles[issue.severity]
                  )}
                >
                  {issue.severity}
                </span>
                <span className="text-xs text-purple-light">
                  {ISSUE_CATEGORY_LABELS[issue.category]}
                </span>
              </div>
              <p className="font-medium">{issue.problem}</p>
            </div>
          </button>
          {expanded === i && (
            <div className="space-y-3 border-t border-white/5 px-4 pb-4 pt-3 pl-11">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Explanation
                </p>
                <p className="text-sm leading-relaxed text-foreground/85">
                  {issue.explanation}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Suggested fix
                </p>
                <p className="text-sm leading-relaxed text-emerald-200/90">
                  {issue.suggestedFix}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

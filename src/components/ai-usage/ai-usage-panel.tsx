"use client";

import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AiUsageSummary } from "@/lib/ai-usage/types";
import { cn } from "@/lib/utils";

export function AiUsagePanel() {
  const [summary, setSummary] = useState<AiUsageSummary | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/usage");
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading || !summary) return null;

  const totalRemaining = summary.remaining.reduce((a, r) => a + r.remaining, 0);
  const totalLimit = summary.remaining.reduce((a, r) => a + r.limit, 0);

  return (
    <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-purple-light" />
          <span className="font-medium">AI usage today</span>
          {!summary.aiEnabled && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
              AI paused
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>
            {totalRemaining}/{totalLimit} generations left
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          {!summary.aiEnabled && (
            <p className="mb-3 text-xs text-red-300">
              AI generation is temporarily unavailable.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.remaining.map((item) => (
              <div key={item.feature} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">{item.label}</span>
                  <span
                    className={cn(
                      item.remaining === 0 ? "text-red-400" : "text-foreground"
                    )}
                  >
                    {item.remaining}/{item.limit} left
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      item.remaining === 0 ? "bg-red-500" : "bg-purple"
                    )}
                    style={{
                      width: `${Math.min(100, (item.used / item.limit) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Rate limit: {summary.rateLimit.minuteUsed}/{summary.rateLimit.minuteLimit}{" "}
            per minute · {summary.rateLimit.hourUsed}/{summary.rateLimit.hourLimit} per
            hour. Resets daily at midnight UTC.
          </p>
        </div>
      )}
    </div>
  );
}

export function useAiUsageSummary() {
  const [summary, setSummary] = useState<AiUsageSummary | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/usage");
      if (res.ok) setSummary(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, refresh };
}

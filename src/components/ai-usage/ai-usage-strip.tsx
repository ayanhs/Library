"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AiUsageSummary } from "@/lib/ai-usage/types";
import { cn } from "@/lib/utils";

/** Compact usage strip shown on all dashboard pages. */
export function AiUsageStrip() {
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
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!summary) return null;

  const cover = summary.remaining.find((r) => r.feature === "cover");

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-purple-light" />
      {!summary.aiEnabled ? (
        <span className="text-red-300">AI temporarily unavailable</span>
      ) : (
        summary.remaining.map((item) => (
          <span
            key={item.feature}
            className={cn(
              "rounded-full px-2 py-0.5",
              item.remaining === 0
                ? "bg-red-500/15 text-red-300"
                : "bg-white/5 text-muted"
            )}
          >
            {item.label.split(" ")[0]}: {item.remaining}/{item.limit}
          </span>
        ))
      )}
      {cover && summary.coverCooldownSeconds > 0 && (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">
          Cover cooldown: {summary.coverCooldownSeconds}s
        </span>
      )}
    </div>
  );
}

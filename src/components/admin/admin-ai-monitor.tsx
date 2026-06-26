"use client";

import type { AdminAiMonitorStats } from "@/lib/ai-usage/types";
import { FEATURE_LABELS, type AiFeature } from "@/lib/ai-usage/types";
import { cn } from "@/lib/utils";

interface AdminAiMonitorProps {
  stats: AdminAiMonitorStats | null;
  error: string | null;
}

const FEATURE_ORDER: AiFeature[] = [
  "chapter",
  "story_bible",
  "editor",
  "cover",
  "blueprint",
];

function StatCard({
  label,
  value,
  accent = "amber",
}: {
  label: string;
  value: number;
  accent?: "amber" | "red" | "emerald";
}) {
  const colors = {
    amber: "border-amber-500/15 text-amber-50",
    red: "border-red-500/20 text-red-200",
    emerald: "border-emerald-500/20 text-emerald-200",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-[#0f0c08]/80 p-5 backdrop-blur-sm",
        colors[accent]
      )}
    >
      <p className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
      <p className="mt-1 text-sm text-amber-200/60">{label}</p>
    </div>
  );
}

export function AdminAiMonitor({ stats, error }: AdminAiMonitorProps) {
  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-8 text-center text-sm text-amber-200/70">
        <p className="font-medium text-amber-100">Could not load AI monitor</p>
        <p className="mt-1 text-xs">{error ?? "Unknown error"}</p>
      </div>
    );
  }

  const featureEntries = FEATURE_ORDER.map((feature) => ({
    feature,
    label: FEATURE_LABELS[feature],
    count: stats.usageByFeature[feature] ?? 0,
  }));

  const maxFeatureCount = Math.max(...featureEntries.map((f) => f.count), 1);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="AI requests today" value={stats.requestsToday} />
        <StatCard label="AI requests this week" value={stats.requestsWeek} />
        <StatCard label="Active users today" value={stats.activeUsersToday} accent="emerald" />
        <StatCard label="Failed requests today" value={stats.failedToday} accent="red" />
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">
          Usage by feature (today)
        </h3>
        <div className="space-y-3 rounded-2xl border border-amber-500/15 bg-[#0f0c08]/80 p-5">
          {featureEntries.map(({ feature, label, count }) => (
            <div key={feature}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-amber-200/70">{label}</span>
                <span className="font-medium text-amber-100">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
                  style={{ width: `${(count / maxFeatureCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">
          Most active users (7 days)
        </h3>
        {stats.mostActiveUsers.length === 0 ? (
          <p className="text-sm text-amber-200/40">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-amber-500/15 bg-[#0f0c08]/80">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-amber-500/10 text-xs text-amber-200/50">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium text-right">Requests</th>
                </tr>
              </thead>
              <tbody>
                {stats.mostActiveUsers.map((user) => (
                  <tr
                    key={user.user_id}
                    className="border-b border-amber-500/5 last:border-0"
                  >
                    <td className="px-4 py-3 text-amber-100">{user.email}</td>
                    <td className="px-4 py-3 text-right font-medium text-amber-50">
                      {user.request_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">
          Recent AI request log
        </h3>
        <div className="max-h-96 space-y-2 overflow-y-auto rounded-2xl border border-amber-500/15 bg-[#0f0c08]/80 p-3">
          {stats.recentLogs.length === 0 ? (
            <p className="p-4 text-center text-sm text-amber-200/40">No logs yet.</p>
          ) : (
            stats.recentLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-amber-500/10 px-3 py-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-amber-100">{log.user_email}</span>
                  <span className="text-amber-200/40">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-200/80">
                    {log.feature}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5",
                      log.status === "success"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-red-500/10 text-red-300"
                    )}
                  >
                    {log.status}
                  </span>
                </div>
                {log.error_message && (
                  <p className="mt-1 text-red-300/80">{log.error_message}</p>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

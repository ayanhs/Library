import { BookOpen, FileText, Layers, Users } from "lucide-react";
import type { AdminStats } from "@/lib/admin/queries";

interface AdminStatsPanelProps {
  stats: AdminStats | null;
  error?: string | null;
}

const statCards = [
  {
    key: "totalAccounts" as const,
    label: "Total accounts",
    sublabel: "Registered users",
    icon: Users,
  },
  {
    key: "newAccounts7d" as const,
    label: "New accounts",
    sublabel: "Last 7 days",
    icon: Users,
  },
  {
    key: "totalBooks" as const,
    label: "Books created",
    sublabel: "All users",
    icon: BookOpen,
  },
  {
    key: "totalChapters" as const,
    label: "Chapters created",
    sublabel: "All users",
    icon: Layers,
  },
];

export function AdminStatsPanel({ stats, error }: AdminStatsPanelProps) {
  if (!stats) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-8 text-center text-sm text-amber-200/70">
        <FileText className="mx-auto mb-3 h-8 w-8 text-amber-400/50" />
        <p className="font-medium text-amber-100">Stats unavailable</p>
        <p className="mt-1 text-xs">
          {error ||
            "Run supabase/setup-admin.sql in the Supabase SQL Editor, then refresh."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map(({ key, label, sublabel, icon: Icon }) => (
        <div
          key={key}
          className="rounded-2xl border border-amber-500/15 bg-[#0f0c08]/80 p-6 backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <Icon className="h-5 w-5 text-amber-400/80" />
            <span className="text-xs text-amber-200/40">{sublabel}</span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-amber-50">
            {stats[key].toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-amber-200/60">{label}</p>
        </div>
      ))}
    </div>
  );
}

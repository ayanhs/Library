import { BookOpen, FileText, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  gradient: "purple" | "blue";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "glass-card interactive group relative overflow-hidden rounded-2xl p-6",
        className
      )}
    >
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            gradient === "purple"
              ? "bg-primary/15 text-primary"
              : "bg-accent/15 text-accent-soft"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function StatCards({
  booksCount,
  chaptersCount,
}: {
  booksCount: number;
  chaptersCount: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard
        title="Books Created"
        value={booksCount}
        icon={BookOpen}
        gradient="purple"
      />
      <StatCard
        title="Chapters Generated"
        value={chaptersCount}
        icon={FileText}
        gradient="blue"
      />
    </div>
  );
}

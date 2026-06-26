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
        "glass-card group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-white/15",
        className
      )}
    >
      <div
        className={cn(
          "absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30",
          gradient === "purple" ? "bg-purple" : "bg-blue"
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            gradient === "purple"
              ? "bg-purple/15 text-purple-light"
              : "bg-blue/15 text-blue-light"
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

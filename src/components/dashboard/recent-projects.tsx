import { Clock, FolderOpen } from "lucide-react";
import type { Project } from "@/lib/dashboard/stats";
import { cn } from "@/lib/utils";

const statusStyles: Record<Project["status"], string> = {
  draft: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  in_progress: "bg-blue/15 text-blue-light border-blue/20",
  published: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
};

const statusLabels: Record<Project["status"], string> = {
  draft: "Draft",
  in_progress: "In Progress",
  published: "Published",
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

export function RecentProjects({ projects }: { projects: Project[] }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <p className="text-sm text-muted">Your latest publishing work</p>
        </div>
        <FolderOpen className="h-5 w-5 text-muted" />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 text-center">
          <FolderOpen className="mb-3 h-10 w-10 text-muted/50" />
          <p className="font-medium text-foreground/80">No projects yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Create your first book to see it appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className={cn(
                "group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-200",
                "hover:border-white/10 hover:bg-white/[0.04]",
                "animate-slide-up"
              )}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{project.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                  <span>{project.chapters_count} chapters</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(project.updated_at)}
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  "ml-4 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                  statusStyles[project.status]
                )}
              >
                {statusLabels[project.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

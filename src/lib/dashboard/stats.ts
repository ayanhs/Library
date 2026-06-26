export interface Project {
  id: string;
  title: string;
  status: "draft" | "in_progress" | "published";
  chapters_count: number;
  updated_at: string;
}

export interface DashboardStats {
  booksCount: number;
  chaptersCount: number;
  recentProjects: Project[];
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const defaultStats: DashboardStats = {
    booksCount: 0,
    chaptersCount: 0,
    recentProjects: [],
  };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const [booksResult, chaptersResult, projectsResult] = await Promise.all([
      supabase
        .from("books")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("chapters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("projects")
        .select("id, title, status, chapters_count, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    return {
      booksCount: booksResult.error ? 0 : (booksResult.count ?? 0),
      chaptersCount: chaptersResult.error ? 0 : (chaptersResult.count ?? 0),
      recentProjects: projectsResult.error
        ? []
        : ((projectsResult.data as Project[] | null) ?? []),
    };
  } catch {
    return defaultStats;
  }
}

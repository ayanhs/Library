export interface AdminStats {
  totalAccounts: number;
  newAccounts7d: number;
  totalBooks: number;
  totalChapters: number;
}

export interface AdminStatsResult {
  stats: AdminStats | null;
  error: string | null;
}

interface AdminStatsRow {
  total_accounts: number;
  new_accounts_7d: number;
  total_books: number;
  total_chapters: number;
}

function normalizeStatsRow(data: unknown): AdminStatsRow | null {
  if (!data) return null;

  if (typeof data === "string") {
    try {
      return normalizeStatsRow(JSON.parse(data));
    } catch {
      return null;
    }
  }

  if (Array.isArray(data)) {
    return normalizeStatsRow(data[0]);
  }

  if (typeof data === "object") {
    const row = data as Record<string, unknown>;
    if (
      "total_accounts" in row ||
      "totalAccounts" in row
    ) {
      return {
        total_accounts: Number(row.total_accounts ?? row.totalAccounts ?? 0),
        new_accounts_7d: Number(row.new_accounts_7d ?? row.newAccounts7d ?? 0),
        total_books: Number(row.total_books ?? row.totalBooks ?? 0),
        total_chapters: Number(row.total_chapters ?? row.totalChapters ?? 0),
      };
    }
  }

  return null;
}

export async function getAdminStats(): Promise<AdminStatsResult> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const { isAdminUser } = await import("@/lib/admin/auth");
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminUser(user)) {
      return { stats: null, error: "Not signed in as admin." };
    }

    const { data, error } = await supabase.rpc("get_admin_stats");

    if (error) {
      console.error("Admin stats RPC error:", error.message, error.code);
      return {
        stats: null,
        error: error.message.includes("not authorized")
          ? `Admin verification failed for ${user.email}. Re-run setup-admin.sql in Supabase.`
          : error.message.includes("Could not find")
            ? "Run supabase/setup-admin.sql in Supabase SQL Editor, then refresh."
            : error.message,
      };
    }

    const row = normalizeStatsRow(data);
    if (!row) {
      return {
        stats: null,
        error: "Unexpected stats response from database. Re-run setup-admin.sql.",
      };
    }

    return {
      stats: {
        totalAccounts: row.total_accounts,
        newAccounts7d: row.new_accounts_7d,
        totalBooks: row.total_books,
        totalChapters: row.total_chapters,
      },
      error: null,
    };
  } catch (err) {
    return {
      stats: null,
      error: err instanceof Error ? err.message : "Failed to load admin stats.",
    };
  }
}

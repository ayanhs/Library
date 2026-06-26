import type { AdminAiMonitorStats } from "@/lib/ai-usage/types";
import { createClient } from "@/lib/supabase/server";

interface RawAdminStats {
  requests_today: number;
  requests_week: number;
  active_users_today: number;
  failed_today: number;
  usage_by_feature: Record<string, number>;
  most_active_users: Array<{
    user_id: string;
    email: string;
    request_count: number;
  }>;
  recent_logs: Array<{
    id: string;
    user_id: string;
    user_email: string;
    feature: string;
    status: string;
    error_message: string | null;
    created_at: string;
  }>;
  ai_enabled: boolean;
}

export async function getAdminAiMonitorStats(): Promise<{
  stats: AdminAiMonitorStats | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_admin_ai_monitor_stats");

    if (error) {
      const message = error.message.includes("Could not find")
        ? "Run supabase/setup-ai-limits.sql in Supabase SQL Editor."
        : error.message;
      return { stats: null, error: message };
    }

    const row = data as RawAdminStats;
    return {
      stats: {
        requestsToday: row.requests_today ?? 0,
        requestsWeek: row.requests_week ?? 0,
        activeUsersToday: row.active_users_today ?? 0,
        failedToday: row.failed_today ?? 0,
        usageByFeature: row.usage_by_feature ?? {},
        mostActiveUsers: row.most_active_users ?? [],
        recentLogs: row.recent_logs ?? [],
        aiEnabled: row.ai_enabled ?? true,
      },
      error: null,
    };
  } catch {
    return { stats: null, error: "Failed to load AI monitor stats." };
  }
}

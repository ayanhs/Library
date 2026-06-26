export type AiFeature = "chapter" | "story_bible" | "editor" | "cover" | "blueprint";

export type AiFeatureWithDailyLimit = "chapter" | "story_bible" | "editor" | "cover";

export const DAILY_LIMITS: Record<AiFeatureWithDailyLimit, number> = {
  chapter: 10,
  story_bible: 5,
  editor: 20,
  cover: 3,
};

export const RATE_LIMITS = {
  perMinute: 5,
  perHour: 20,
} as const;

export const COVER_COOLDOWN_MS = 60_000;

export const FEATURE_LABELS: Record<AiFeature, string> = {
  chapter: "Chapter generations",
  story_bible: "Story Bible generations",
  editor: "AI editing requests",
  cover: "Cover art generations",
  blueprint: "Blueprint generations",
};

export interface AiUsageRemaining {
  feature: AiFeatureWithDailyLimit;
  label: string;
  limit: number;
  used: number;
  remaining: number;
}

export interface AiUsageSummary {
  aiEnabled: boolean;
  remaining: AiUsageRemaining[];
  coverCooldownSeconds: number;
  rateLimit: {
    minuteUsed: number;
    minuteLimit: number;
    hourUsed: number;
    hourLimit: number;
  };
}

export interface AiGuardResult {
  allowed: boolean;
  message?: string;
  code?: "kill_switch" | "rate_limit" | "daily_limit" | "cooldown";
  coverCooldownSeconds?: number;
}

export interface AdminAiMonitorStats {
  requestsToday: number;
  requestsWeek: number;
  activeUsersToday: number;
  failedToday: number;
  usageByFeature: Record<string, number>;
  mostActiveUsers: Array<{
    user_id: string;
    email: string;
    request_count: number;
  }>;
  recentLogs: Array<{
    id: string;
    user_id: string;
    user_email: string;
    feature: string;
    status: string;
    error_message: string | null;
    created_at: string;
  }>;
  aiEnabled: boolean;
}

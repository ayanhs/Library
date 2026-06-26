import {
  COVER_COOLDOWN_MS,
  DAILY_LIMITS,
  FEATURE_LABELS,
  RATE_LIMITS,
  type AiFeature,
  type AiFeatureWithDailyLimit,
  type AiGuardResult,
  type AiUsageRemaining,
  type AiUsageSummary,
} from "@/lib/ai-usage/types";
import { createClient } from "@/lib/supabase/server";

function hasDailyLimit(feature: AiFeature): feature is AiFeatureWithDailyLimit {
  return feature in DAILY_LIMITS;
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getAiEnabled(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_settings")
      .select("ai_enabled")
      .eq("id", "global")
      .maybeSingle();

    return data?.ai_enabled ?? true;
  } catch {
    return true;
  }
}

async function getDailySuccessCount(
  userId: string,
  feature: AiFeatureWithDailyLimit
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_usage_daily")
    .select("success_count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("usage_date", todayUtcDate())
    .maybeSingle();

  return data?.success_count ?? 0;
}

async function getRateLimitCounts(userId: string): Promise<{
  minuteCount: number;
  hourCount: number;
}> {
  const supabase = await createClient();
  const now = Date.now();
  const minuteAgo = new Date(now - 60_000).toISOString();
  const hourAgo = new Date(now - 3_600_000).toISOString();

  const [minuteRes, hourRes] = await Promise.all([
    supabase
      .from("ai_request_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", minuteAgo),
    supabase
      .from("ai_request_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", hourAgo),
  ]);

  return {
    minuteCount: minuteRes.count ?? 0,
    hourCount: hourRes.count ?? 0,
  };
}

async function getCoverCooldownSeconds(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_request_log")
    .select("created_at")
    .eq("user_id", userId)
    .eq("feature", "cover")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.created_at) return 0;

  const elapsed = Date.now() - new Date(data.created_at).getTime();
  const remaining = COVER_COOLDOWN_MS - elapsed;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export async function checkAiUsage(
  userId: string,
  feature: AiFeature
): Promise<AiGuardResult> {
  const aiEnabled = await getAiEnabled();
  if (!aiEnabled) {
    return {
      allowed: false,
      message: "AI generation is temporarily unavailable.",
      code: "kill_switch",
    };
  }

  const { minuteCount, hourCount } = await getRateLimitCounts(userId);

  if (minuteCount >= RATE_LIMITS.perMinute) {
    return {
      allowed: false,
      message: "Too many requests. Please wait before generating again.",
      code: "rate_limit",
    };
  }

  if (hourCount >= RATE_LIMITS.perHour) {
    return {
      allowed: false,
      message: "Too many requests. Please wait before generating again.",
      code: "rate_limit",
    };
  }

  if (hasDailyLimit(feature)) {
    const used = await getDailySuccessCount(userId, feature);
    if (used >= DAILY_LIMITS[feature]) {
      return {
        allowed: false,
        message: "Daily limit reached. Please try again tomorrow.",
        code: "daily_limit",
      };
    }
  }

  if (feature === "cover") {
    const cooldownSeconds = await getCoverCooldownSeconds(userId);
    if (cooldownSeconds > 0) {
      return {
        allowed: false,
        message: `Please wait ${cooldownSeconds}s before generating another cover.`,
        code: "cooldown",
        coverCooldownSeconds: cooldownSeconds,
      };
    }
  }

  return { allowed: true };
}

export async function recordAiRequest(
  userId: string,
  feature: AiFeature,
  status: "success" | "failure",
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("log_ai_request", {
      p_user_id: userId,
      p_feature: feature,
      p_status: status,
      p_error_message: errorMessage ?? null,
    });
  } catch (err) {
    console.error("Failed to log AI request:", err);
  }
}

export async function getUserAiUsageSummary(
  userId: string
): Promise<AiUsageSummary> {
  const aiEnabled = await getAiEnabled();
  const [{ minuteCount, hourCount }, coverCooldownSeconds] = await Promise.all([
    getRateLimitCounts(userId),
    getCoverCooldownSeconds(userId),
  ]);

  const features = Object.keys(DAILY_LIMITS) as AiFeatureWithDailyLimit[];
  const usedCounts = await Promise.all(
    features.map((feature) => getDailySuccessCount(userId, feature))
  );

  const remaining: AiUsageRemaining[] = features.map((feature, index) => {
    const limit = DAILY_LIMITS[feature];
    const used = usedCounts[index];
    return {
      feature,
      label: FEATURE_LABELS[feature],
      limit,
      used,
      remaining: Math.max(0, limit - used),
    };
  });

  return {
    aiEnabled,
    remaining,
    coverCooldownSeconds,
    rateLimit: {
      minuteUsed: minuteCount,
      minuteLimit: RATE_LIMITS.perMinute,
      hourUsed: hourCount,
      hourLimit: RATE_LIMITS.perHour,
    },
  };
}

export function formatAiGuardMessage(result: AiGuardResult): string {
  return result.message ?? "AI request not allowed.";
}

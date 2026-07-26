import {
  checkAiUsage,
  formatAiGuardMessage,
  recordAiRequest,
} from "@/lib/ai-usage/guard";
import type { AiFeature } from "@/lib/ai-usage/types";

type GuardedResult<T> =
  | { success: true; data: T }
  | { success: false; message: string; code?: string; coverCooldownSeconds?: number };

export async function withAiGuard<T>(
  userId: string,
  feature: AiFeature,
  operation: () => Promise<T>
): Promise<GuardedResult<T>> {
  const guard = await checkAiUsage(userId, feature);
  if (!guard.allowed) {
    return {
      success: false,
      message: formatAiGuardMessage(guard),
      code: guard.code,
      coverCooldownSeconds: guard.coverCooldownSeconds,
    };
  }

  try {
    const data = await operation();
    await recordAiRequest(userId, feature, "success");
    return { success: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI request failed. Please try again.";
    await recordAiRequest(userId, feature, "failure", message);
    return { success: false, message };
  }
}

/** Check limits without consuming a daily credit (used before multi-step cover flow). */
export async function assertAiUsageAllowed(
  userId: string,
  feature: AiFeature
): Promise<GuardedResult<null>> {
  const guard = await checkAiUsage(userId, feature);
  if (!guard.allowed) {
    return {
      success: false,
      message: formatAiGuardMessage(guard),
      code: guard.code,
      coverCooldownSeconds: guard.coverCooldownSeconds,
    };
  }

  return { success: true, data: null };
}

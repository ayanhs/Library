import { createFallbackCoverImage } from "@/lib/covers/fallback-cover";

const GEN_BASE_URL = "https://gen.pollinations.ai";
const LEGACY_BASE_URL = "https://image.pollinations.ai/prompt";

const COVER_WIDTH = 768;
const COVER_HEIGHT = 1152;
const COVER_WIDTH_FAST = 512;
const COVER_HEIGHT_FAST = 768;

const FETCH_TIMEOUT_MS = 55_000;
const VERCEL_LEGACY_TIMEOUT_MS = 9_000;
const AUTHED_DELAY_MS = 4_000;
const ANONYMOUS_DELAY_MS = 8_000;
const MAX_ATTEMPTS = 2;

const AUTHED_MODELS = ["klein", "zimage", "flux"] as const;
const LEGACY_MODELS = ["flux"] as const;

const RETRYABLE_STATUSES = new Set([402, 429, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPollinationsToken(): string | undefined {
  const token = process.env.POLLINATIONS_API_KEY?.trim();
  return token || undefined;
}

export function isPollinationsConfigured(): boolean {
  return !!getPollinationsToken();
}

export function getCoverRequestDelayMs(): number {
  return isPollinationsConfigured() ? AUTHED_DELAY_MS : ANONYMOUS_DELAY_MS;
}

export function getCoverGenerationConfig(): {
  requestDelayMs: number;
  pollinationsConfigured: boolean;
  warning?: string;
} {
  const pollinationsConfigured = isPollinationsConfigured();
  const requestDelayMs = getCoverRequestDelayMs();

  if (process.env.VERCEL === "1" && !pollinationsConfigured) {
    return {
      requestDelayMs,
      pollinationsConfigured,
      warning:
        "Cover art requires POLLINATIONS_API_KEY in Vercel environment variables. Get a free key at enter.pollinations.ai/keys.",
    };
  }

  return { requestDelayMs, pollinationsConfigured };
}

function getDimensions(): { width: number; height: number } {
  if (process.env.VERCEL === "1" && !isPollinationsConfigured()) {
    return { width: COVER_WIDTH_FAST, height: COVER_HEIGHT_FAST };
  }

  return { width: COVER_WIDTH, height: COVER_HEIGHT };
}

function getFetchTimeoutMs(): number {
  if (process.env.VERCEL === "1" && !isPollinationsConfigured()) {
    return VERCEL_LEGACY_TIMEOUT_MS;
  }

  return FETCH_TIMEOUT_MS;
}

function buildAuthenticatedImageUrl(
  prompt: string,
  seed: number,
  model: string
): string {
  const { width, height } = getDimensions();
  const url = new URL(`${GEN_BASE_URL}/image/${encodeURIComponent(prompt)}`);
  url.searchParams.set("model", model);
  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  url.searchParams.set("seed", String(seed));
  return url.toString();
}

function buildLegacyImageUrl(
  prompt: string,
  seed: number,
  model: string
): string {
  const { width, height } = getDimensions();
  const url = new URL(`${LEGACY_BASE_URL}/${encodeURIComponent(prompt)}`);
  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  url.searchParams.set("nologo", "true");
  url.searchParams.set("seed", String(seed));
  url.searchParams.set("model", model);
  url.searchParams.set("private", "true");
  return url.toString();
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") {
    return true;
  }

  const status = (err as Error & { status?: number }).status;
  return status !== undefined && RETRYABLE_STATUSES.has(status);
}

function formatPollinationsError(status: number): string {
  if (status === 401 || status === 403) {
    return "Pollinations API key is missing or invalid. Add POLLINATIONS_API_KEY in Vercel environment variables (get a key at enter.pollinations.ai/keys).";
  }

  if (status === 402) {
    return "Pollinations account is out of credits. Top up at enter.pollinations.ai.";
  }

  if (status === 429) {
    return "The image service is rate limited. Wait a minute and try again.";
  }

  return `Image service returned ${status}. Please try again.`;
}

async function fetchCoverImageOnce(
  prompt: string,
  seed: number,
  model: string,
  authenticated: boolean
): Promise<Buffer> {
  if (process.env.VERCEL === "1" && !authenticated) {
    throw new Error(
      "Cover art requires POLLINATIONS_API_KEY on Vercel. Add it under Project Settings → Environment Variables. Get a free key at enter.pollinations.ai/keys."
    );
  }

  const token = getPollinationsToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getFetchTimeoutMs());

  try {
    const headers: Record<string, string> = { Accept: "image/*" };
    const url = authenticated
      ? buildAuthenticatedImageUrl(prompt, seed, model)
      : buildLegacyImageUrl(prompt, seed, model);

    if (authenticated && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      const error = new Error(formatPollinationsError(response.status));
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error("Image service returned an unexpected response.");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 1000) {
      throw new Error("Generated image was too small.");
    }

    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSingleCoverImage(
  prompt: string,
  seed: number,
  style: string
): Promise<{ buffer: Buffer; usedFallback: boolean; errorMessage?: string }> {
  const token = getPollinationsToken();
  const models = token ? AUTHED_MODELS : LEGACY_MODELS;
  let lastError: string | undefined;

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const buffer = await fetchCoverImageOnce(
          prompt,
          seed + attempt,
          model,
          !!token
        );
        return { buffer, usedFallback: false };
      } catch (err) {
        lastError =
          err instanceof Error ? err.message : "Cover image generation failed.";

        if (!isRetryableError(err) || attempt === MAX_ATTEMPTS - 1) {
          break;
        }

        await sleep(Math.min(8_000, 2_000 * (attempt + 1)));
      }
    }
  }

  return {
    buffer: createFallbackCoverImage(style, seed),
    usedFallback: true,
    errorMessage: lastError,
  };
}

export async function fetchCoverImages(
  prompts: string[],
  styles: string[]
): Promise<{ buffers: Buffer[]; fallbackCount: number; lastError?: string }> {
  const baseSeed = Date.now();
  const delayMs = getCoverRequestDelayMs();
  const buffers: Buffer[] = [];
  let fallbackCount = 0;
  let lastError: string | undefined;

  for (let index = 0; index < prompts.length; index++) {
    if (index > 0) {
      await sleep(delayMs);
    }

    const result = await fetchSingleCoverImage(
      prompts[index],
      baseSeed + index * 997,
      styles[index] ?? `Cover ${index + 1}`
    );

    buffers.push(result.buffer);
    if (result.usedFallback) {
      fallbackCount += 1;
      lastError = result.errorMessage ?? lastError;
    }
  }

  return { buffers, fallbackCount, lastError };
}

export async function waitBetweenCoverRequests(): Promise<void> {
  await sleep(getCoverRequestDelayMs());
}

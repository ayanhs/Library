import { createFallbackCoverImage } from "@/lib/covers/fallback-cover";

const GEN_BASE_URL = "https://gen.pollinations.ai";
const LEGACY_BASE_URL = "https://image.pollinations.ai/prompt";

const COVER_WIDTH = 768;
const COVER_HEIGHT = 1152;
const COVER_WIDTH_VERCEL = 512;
const COVER_HEIGHT_VERCEL = 768;

const FETCH_TIMEOUT_MS = 45_000;
/** Space between images in one batch — matches Pollinations free-tier pacing. */
const IMAGE_DELAY_MS = 12_000;
const MAX_ATTEMPTS = 2;

const LEGACY_MODELS = ["flux", "turbo"] as const;
const AUTHED_MODELS = ["klein", "flux", "zimage"] as const;

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
/** Pollinations query API max seed (32-bit signed integer). */
const POLLINATIONS_MAX_SEED = 2_147_483_647;

function normalizePollinationsSeed(seed: number): number {
  const normalized = Math.abs(Math.floor(seed)) % POLLINATIONS_MAX_SEED;
  return normalized === 0 ? 1 : normalized;
}

export function createCoverImageSeed(index = 0): number {
  return normalizePollinationsSeed(Date.now() + index * 997);
}

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
  return IMAGE_DELAY_MS;
}

export function getCoverGenerationConfig(): {
  requestDelayMs: number;
  pollinationsConfigured: boolean;
} {
  return {
    requestDelayMs: IMAGE_DELAY_MS,
    pollinationsConfigured: isPollinationsConfigured(),
  };
}

function getDimensions(): { width: number; height: number } {
  if (process.env.VERCEL === "1") {
    return { width: COVER_WIDTH_VERCEL, height: COVER_HEIGHT_VERCEL };
  }

  return { width: COVER_WIDTH, height: COVER_HEIGHT };
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") {
    return true;
  }

  const status = (err as Error & { status?: number }).status;
  return status !== undefined && RETRYABLE_STATUSES.has(status);
}

function formatPollinationsError(status: number, detail?: string): string {
  if (status === 429) {
    return "The free image service is busy. Wait a moment and try again.";
  }

  if (detail) {
    return detail;
  }

  return `Image service returned ${status}. Please try again.`;
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string };
      message?: string;
    };
    return body.error?.message || body.message || "";
  } catch {
    return "";
  }
}

function validateImageBuffer(buffer: Buffer): void {
  if (buffer.length < 1000) {
    throw new Error("Generated image was too small.");
  }
}

async function fetchLegacyCoverImage(
  prompt: string,
  seed: number,
  model: string
): Promise<Buffer> {
  const { width, height } = getDimensions();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = new URL(`${LEGACY_BASE_URL}/${encodeURIComponent(prompt)}`);
    url.searchParams.set("width", String(width));
    url.searchParams.set("height", String(height));
    url.searchParams.set("nologo", "true");
    url.searchParams.set("seed", String(normalizePollinationsSeed(seed)));
    url.searchParams.set("model", model);
    url.searchParams.set("private", "true");

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "image/*" },
    });

    if (!response.ok) {
      const detail = await parseErrorResponse(response);
      const error = new Error(formatPollinationsError(response.status, detail));
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error("Image service returned an unexpected response.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    validateImageBuffer(buffer);
    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAuthenticatedCoverImagePost(
  prompt: string,
  model: string,
  token: string
): Promise<Buffer> {
  const { width, height } = getDimensions();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEN_BASE_URL}/v1/images/generations`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        prompt,
        model,
        size: `${width}x${height}`,
        response_format: "b64_json",
        n: 1,
      }),
    });

    if (!response.ok) {
      const detail = await parseErrorResponse(response);
      const error = new Error(formatPollinationsError(response.status, detail));
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const body = (await response.json()) as {
      data?: Array<{ b64_json?: string }>;
    };
    const b64 = body.data?.[0]?.b64_json;

    if (!b64) {
      throw new Error("Image service returned no image data.");
    }

    const buffer = Buffer.from(b64, "base64");
    validateImageBuffer(buffer);
    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

async function tryLegacyModels(
  prompt: string,
  seed: number
): Promise<Buffer | null> {
  let lastError: string | undefined;

  for (const model of LEGACY_MODELS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        return await fetchLegacyCoverImage(prompt, seed + attempt, model);
      } catch (err) {
        lastError =
          err instanceof Error ? err.message : "Legacy cover generation failed.";

        if (!isRetryableError(err) || attempt === MAX_ATTEMPTS - 1) {
          break;
        }

        await sleep(Math.min(IMAGE_DELAY_MS, 4_000 * (attempt + 1)));
      }
    }
  }

  if (lastError) {
    throw new Error(lastError);
  }

  return null;
}

async function tryAuthenticatedModels(
  prompt: string,
  token: string
): Promise<Buffer | null> {
  for (const model of AUTHED_MODELS) {
    try {
      return await fetchAuthenticatedCoverImagePost(prompt, model, token);
    } catch {
      continue;
    }
  }

  return null;
}

export async function fetchSingleCoverImage(
  prompt: string,
  seed: number,
  style: string
): Promise<{ buffer: Buffer; usedFallback: boolean; errorMessage?: string }> {
  const token = getPollinationsToken();

  try {
    const legacyBuffer = await tryLegacyModels(prompt, seed);
    if (legacyBuffer) {
      return { buffer: legacyBuffer, usedFallback: false };
    }
  } catch (legacyError) {
    if (token) {
      const authedBuffer = await tryAuthenticatedModels(prompt, token);
      if (authedBuffer) {
        return {
          buffer: authedBuffer,
          usedFallback: false,
          errorMessage:
            "Used premium Pollinations tier because the free tier was busy.",
        };
      }
    }

    return {
      buffer: createFallbackCoverImage(style, seed),
      usedFallback: true,
      errorMessage:
        legacyError instanceof Error
          ? legacyError.message
          : "Free image tier unavailable.",
    };
  }

  if (token) {
    const authedBuffer = await tryAuthenticatedModels(prompt, token);
    if (authedBuffer) {
      return { buffer: authedBuffer, usedFallback: false };
    }
  }

  return {
    buffer: createFallbackCoverImage(style, seed),
    usedFallback: true,
    errorMessage: "Could not generate a cover image. Please try again.",
  };
}

export async function fetchCoverImages(
  prompts: string[],
  styles: string[]
): Promise<{ buffers: Buffer[]; fallbackCount: number; lastError?: string }> {
  const buffers: Buffer[] = [];
  let fallbackCount = 0;
  let lastError: string | undefined;

  for (let index = 0; index < prompts.length; index++) {
    if (index > 0) {
      await sleep(IMAGE_DELAY_MS);
    }

    const result = await fetchSingleCoverImage(
      prompts[index],
      createCoverImageSeed(index),
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
  await sleep(IMAGE_DELAY_MS);
}

import { createFallbackCoverImage } from "@/lib/covers/fallback-cover";

const COVER_WIDTH = 768;
const COVER_HEIGHT = 1152;
const FETCH_TIMEOUT_MS = 45_000;
const ANONYMOUS_DELAY_MS = 16_000;
const AUTHED_DELAY_MS = 6_000;
const MAX_ATTEMPTS = 2;
const PLACEHOLDER_MIN_BYTES = 1_200_000;

const RETRYABLE_STATUSES = new Set([402, 429, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPollinationsToken(): string | undefined {
  const token = process.env.POLLINATIONS_API_KEY?.trim();
  return token || undefined;
}

export function getCoverRequestDelayMs(): number {
  return getPollinationsToken() ? AUTHED_DELAY_MS : ANONYMOUS_DELAY_MS;
}

function buildImageUrl(prompt: string, seed: number, model: string): string {
  const url = new URL(
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
  );
  url.searchParams.set("width", String(COVER_WIDTH));
  url.searchParams.set("height", String(COVER_HEIGHT));
  url.searchParams.set("nologo", "true");
  url.searchParams.set("seed", String(seed));
  url.searchParams.set("model", model);
  url.searchParams.set("private", "true");
  return url.toString();
}

function isLikelyPlaceholder(buffer: Buffer): boolean {
  return buffer.length >= PLACEHOLDER_MIN_BYTES;
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") {
    return true;
  }
  const status = (err as Error & { status?: number }).status;
  return status !== undefined && RETRYABLE_STATUSES.has(status);
}

async function fetchCoverImageOnce(
  prompt: string,
  seed: number,
  model: string
): Promise<Buffer> {
  const token = getPollinationsToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { Accept: "image/*" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(buildImageUrl(prompt, seed, model), {
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      const error = new Error(`Image service returned ${response.status}`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 1000) {
      throw new Error("Generated image was too small.");
    }

    if (isLikelyPlaceholder(buffer)) {
      const error = new Error("Image service rate limited (placeholder returned).");
      (error as Error & { status?: number }).status = 429;
      throw error;
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
): Promise<{ buffer: Buffer; usedFallback: boolean }> {
  const models = ["turbo", "flux"];

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const buffer = await fetchCoverImageOnce(prompt, seed + attempt, model);
        return { buffer, usedFallback: false };
      } catch (err) {
        if (!isRetryableError(err) || attempt === MAX_ATTEMPTS - 1) {
          break;
        }
        await sleep(Math.min(16_000, 3_000 * (attempt + 1)));
      }
    }
  }

  return {
    buffer: createFallbackCoverImage(style, seed),
    usedFallback: true,
  };
}

export async function fetchCoverImages(
  prompts: string[],
  styles: string[]
): Promise<{ buffers: Buffer[]; fallbackCount: number }> {
  const baseSeed = Date.now();
  const delayMs = getCoverRequestDelayMs();
  const buffers: Buffer[] = [];
  let fallbackCount = 0;

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
    }
  }

  return { buffers, fallbackCount };
}

export async function waitBetweenCoverRequests(): Promise<void> {
  await sleep(getCoverRequestDelayMs());
}

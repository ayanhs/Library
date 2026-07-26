import { createFallbackCoverImage } from "@/lib/covers/fallback-cover";

const GEN_BASE_URL = "https://gen.pollinations.ai";
const LEGACY_BASE_URL = "https://image.pollinations.ai/prompt";

const COVER_WIDTH = 768;
const COVER_HEIGHT = 1152;
const COVER_WIDTH_VERCEL = 512;
const COVER_HEIGHT_VERCEL = 768;

const FETCH_TIMEOUT_MS = 55_000;
const VERCEL_LEGACY_TIMEOUT_MS = 9_000;
const AUTHED_DELAY_MS = 4_000;
const ANONYMOUS_DELAY_MS = 8_000;
const MAX_ATTEMPTS = 2;

const AUTHED_MODELS = ["klein", "flux", "zimage"] as const;
const LEGACY_MODELS = ["flux"] as const;

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

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
        "Cover art requires POLLINATIONS_API_KEY in Vercel environment variables. Get a free key at enter.pollinations.ai/keys, add it under Project Settings → Environment Variables, then redeploy.",
    };
  }

  return { requestDelayMs, pollinationsConfigured };
}

function getDimensions(): { width: number; height: number } {
  if (process.env.VERCEL === "1") {
    return { width: COVER_WIDTH_VERCEL, height: COVER_HEIGHT_VERCEL };
  }

  return { width: COVER_WIDTH, height: COVER_HEIGHT };
}

function getFetchTimeoutMs(): number {
  if (process.env.VERCEL === "1" && !isPollinationsConfigured()) {
    return VERCEL_LEGACY_TIMEOUT_MS;
  }

  return FETCH_TIMEOUT_MS;
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") {
    return true;
  }

  const status = (err as Error & { status?: number }).status;
  return status !== undefined && RETRYABLE_STATUSES.has(status);
}

function isFatalCoverError(message: string): boolean {
  return (
    message.includes("POLLINATIONS_API_KEY") ||
    message.includes("missing or invalid") ||
    message.includes("out of credits") ||
    message.includes("Authentication required")
  );
}

function formatPollinationsError(status: number, detail?: string): string {
  if (status === 401 || status === 403) {
    return "Pollinations API key is missing or invalid. In Vercel, set POLLINATIONS_API_KEY to your secret key (sk_...) from enter.pollinations.ai/keys, then redeploy.";
  }

  if (status === 402) {
    return "Pollinations account is out of credits. Top up at enter.pollinations.ai.";
  }

  if (status === 429) {
    return "The image service is rate limited. Wait a minute and try again.";
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

async function fetchAuthenticatedCoverImagePost(
  prompt: string,
  model: string,
  token: string
): Promise<Buffer> {
  const { width, height } = getDimensions();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getFetchTimeoutMs());

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

async function fetchAuthenticatedCoverImageGet(
  prompt: string,
  seed: number,
  model: string,
  token: string
): Promise<Buffer> {
  const { width, height } = getDimensions();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getFetchTimeoutMs());

  try {
    const url = new URL(`${GEN_BASE_URL}/image/${encodeURIComponent(prompt)}`);
    url.searchParams.set("model", model);
    url.searchParams.set("width", String(width));
    url.searchParams.set("height", String(height));
    url.searchParams.set("seed", String(seed));
    url.searchParams.set("key", token);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "image/*",
        Authorization: `Bearer ${token}`,
      },
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

async function fetchLegacyCoverImage(
  prompt: string,
  seed: number,
  model: string
): Promise<Buffer> {
  if (process.env.VERCEL === "1") {
    throw new Error(
      "Cover art requires POLLINATIONS_API_KEY on Vercel. Add your secret key (sk_...) under Project Settings → Environment Variables, then redeploy."
    );
  }

  const { width, height } = getDimensions();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getFetchTimeoutMs());

  try {
    const url = new URL(`${LEGACY_BASE_URL}/${encodeURIComponent(prompt)}`);
    url.searchParams.set("width", String(width));
    url.searchParams.set("height", String(height));
    url.searchParams.set("nologo", "true");
    url.searchParams.set("seed", String(seed));
    url.searchParams.set("model", model);
    url.searchParams.set("private", "true");

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "image/*" },
    });

    if (!response.ok) {
      const error = new Error(formatPollinationsError(response.status));
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    validateImageBuffer(buffer);
    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCoverImageOnce(
  prompt: string,
  seed: number,
  model: string,
  token?: string
): Promise<Buffer> {
  if (token) {
    try {
      return await fetchAuthenticatedCoverImagePost(prompt, model, token);
    } catch (postError) {
      if (!isRetryableError(postError)) {
        const message =
          postError instanceof Error ? postError.message : "Cover generation failed.";
        if (isFatalCoverError(message)) {
          throw postError;
        }
      }

      return await fetchAuthenticatedCoverImageGet(prompt, seed, model, token);
    }
  }

  return fetchLegacyCoverImage(prompt, seed, model);
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
          token
        );
        return { buffer, usedFallback: false };
      } catch (err) {
        lastError =
          err instanceof Error ? err.message : "Cover image generation failed.";

        if (isFatalCoverError(lastError)) {
          throw err instanceof Error ? err : new Error(lastError);
        }

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

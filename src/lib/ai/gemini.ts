import OpenAI from "openai";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";
export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

/** Bracket access so Next.js/Vercel don't bake in `undefined` at build time. */
function readGeminiApiKey(): string | undefined {
  return (
    process.env["GEMINI_API_KEY"]?.trim() ||
    process.env["GOOGLE_API_KEY"]?.trim()
  );
}

export function getGeminiClient() {
  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. In Vercel, add GEMINI_API_KEY under Settings → Environment Variables (Production), then redeploy. For local dev, add it to .env.local and restart npm run dev."
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: GEMINI_BASE_URL,
  });
}

export function getGeminiModel() {
  return (
    process.env["GEMINI_MODEL"]?.trim() ||
    process.env["GOOGLE_MODEL"]?.trim() ||
    DEFAULT_GEMINI_MODEL
  );
}

export function isGeminiConfigured(): boolean {
  return !!readGeminiApiKey();
}

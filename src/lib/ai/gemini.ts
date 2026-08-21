import { loadEnvConfig } from "@next/env";
import OpenAI from "openai";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";
export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

let devEnvLoaded = false;

function ensureEnvLoaded() {
  if (devEnvLoaded) return;
  // Loads .env.local in dev when Next hasn't injected vars yet (OneDrive/sync edge cases).
  if (process.env.NODE_ENV !== "production") {
    loadEnvConfig(process.cwd());
  }
  devEnvLoaded = true;
}

/** Dynamic lookup so Next.js/Vercel don't inline `undefined` at build time. */
function readGeminiApiKey(): string | undefined {
  ensureEnvLoaded();

  const env = process.env;
  const candidates = [
    env["GEMINI" + "_API_KEY"],
    env["GOOGLE" + "_API_KEY"],
    env.GEMINI_API_KEY,
    env.GOOGLE_API_KEY,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }

  return undefined;
}

export function getGeminiClient() {
  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Add GEMINI_API_KEY to .env.local (local) or Vercel → Settings → Environment Variables → Production (live site), then redeploy with cache cleared."
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: GEMINI_BASE_URL,
  });
}

export function getGeminiModel() {
  ensureEnvLoaded();
  return (
    process.env["GEMINI" + "_MODEL"]?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    process.env["GOOGLE" + "_MODEL"]?.trim() ||
    DEFAULT_GEMINI_MODEL
  );
}

export function isGeminiConfigured(): boolean {
  return !!readGeminiApiKey();
}

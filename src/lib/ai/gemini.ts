import OpenAI from "openai";

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";
export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Add GEMINI_API_KEY to your .env.local file."
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: GEMINI_BASE_URL,
  });
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

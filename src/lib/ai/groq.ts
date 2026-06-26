import OpenAI from "openai";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Groq API key is missing. Add GROQ_API_KEY to your .env.local file."
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: GROQ_BASE_URL,
  });
}

export function getGroqModel() {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

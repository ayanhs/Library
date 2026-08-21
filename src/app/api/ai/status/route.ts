import { NextResponse } from "next/server";
import { DEFAULT_GEMINI_MODEL, isGeminiConfigured } from "@/lib/ai/gemini";

export async function GET() {
  return NextResponse.json({
    geminiConfigured: isGeminiConfigured(),
    model: process.env["GEMINI_MODEL"]?.trim() || DEFAULT_GEMINI_MODEL,
    hint: isGeminiConfigured()
      ? "Gemini API key is loaded on the server."
      : "GEMINI_API_KEY is not visible to the server. Add it in Vercel → Settings → Environment Variables (Production), then redeploy.",
  });
}

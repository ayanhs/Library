import type { Book } from "@/lib/books/types";
import { getGroqClient, getGroqModel } from "@/lib/ai/groq";
import type { StoryBlueprint } from "@/lib/blueprint/types";
import { coverPromptsSchema } from "@/lib/covers/validation";

interface CoverPromptInput {
  book: Book;
  blueprint: StoryBlueprint;
  authorName: string;
  description: string;
}

function buildPrompt(input: CoverPromptInput): string {
  return `You are a professional book cover art director. Create 3 DISTINCT cover art prompts for AI image generation.

BOOK:
- Title: ${input.book.title}
- Author: ${input.authorName}
- Genre: ${input.book.genre || "Fiction"}
- Audience: ${input.book.audience || "General"}
- Description: ${input.description}
- Story summary: ${input.blueprint.summary}

Return ONLY valid JSON:
{
  "covers": [
    {
      "style": "Short style label (e.g. Dark Fantasy, Minimalist, Illustrated)",
      "prompt": "Detailed image generation prompt for a professional book cover — describe composition, mood, colors, key visual elements. NO text or typography in the image. Portrait orientation book cover art, cinematic, publishable quality."
    }
  ]
}

Requirements:
- Exactly 3 covers with visually different styles and moods
- Prompts must suit the genre and story
- Never include book title or author name in the image prompt (text added separately at export)
- Each prompt 2-4 sentences, highly visual and specific`;
}

export async function generateCoverPromptsWithAI(
  input: CoverPromptInput
): Promise<{ style: string; prompt: string }[]> {
  const groq = getGroqClient();
  const model = getGroqModel();

  const completion = await groq.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.9,
    messages: [
      {
        role: "system",
        content:
          "You are an expert book cover designer. Return only valid JSON with exactly 3 cover prompts.",
      },
      { role: "user", content: buildPrompt(input) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response. Please try again.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Failed to parse cover prompts. Please try again.");
  }

  const result = coverPromptsSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("AI returned invalid cover prompts. Please regenerate.");
  }

  return result.data.covers;
}

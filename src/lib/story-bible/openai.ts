import type { Book } from "@/lib/books/types";
import { getGroqClient, getGroqModel } from "@/lib/ai/groq";
import type { StoryBlueprint } from "@/lib/blueprint/types";
import { generatedStoryBibleSchema } from "@/lib/story-bible/validation";
import type { GeneratedStoryBible } from "@/lib/story-bible/validation";

function buildPrompt(book: Book, blueprint: StoryBlueprint): string {
  const outline = blueprint.chapterOutline
    .map(
      (c) =>
        `  Ch.${c.chapterNumber} "${c.title}": ${c.summary}`
    )
    .join("\n");

  return `You are an expert story development consultant. Build a comprehensive Story Bible — the permanent reference document for this novel.

BOOK:
- Title: ${book.title}
- Genre: ${book.genre || "Not specified"}
- Audience: ${book.audience || "Not specified"}
- Main Character: ${book.main_character || "Not specified"}${book.character_age ? ` (Age: ${book.character_age})` : ""}
- Setting: ${book.setting || "Not specified"}

STORY SUMMARY:
${blueprint.summary}

MAIN CONFLICT:
${blueprint.conflict}

CHARACTER ARC:
- Beginning: ${blueprint.characterArc.beginning}
- Middle: ${blueprint.characterArc.middle}
- Ending: ${blueprint.characterArc.ending}

CHAPTER OUTLINE:
${outline}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "characters": [
    {
      "name": "string",
      "age": "string",
      "personality": "string",
      "appearance": "string",
      "goals": "string",
      "fears": "string",
      "relationships": "string"
    }
  ],
  "locations": [
    {
      "name": "string",
      "description": "string",
      "importance": "string"
    }
  ],
  "worldRules": [
    {
      "category": "Magic | Technology | Society | Other",
      "rule": "string"
    }
  ],
  "timelineEvents": [
    {
      "title": "string",
      "description": "string",
      "eventOrder": 1
    }
  ]
}

Requirements:
- Include 4-8 characters (protagonist, antagonist, and key supporting cast)
- Include 4-8 important locations
- Include 6-12 world rules covering magic, technology, and society where relevant to the genre
- Include 6-12 timeline events in strict chronological order (eventOrder starting at 1)
- Be specific and consistent with the blueprint — this is the canonical reference for all future chapter writing`;
}

export async function generateStoryBibleWithAI(
  book: Book,
  blueprint: StoryBlueprint
): Promise<GeneratedStoryBible> {
  const groq = getGroqClient();
  const model = getGroqModel();

  const completion = await groq.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.75,
    messages: [
      {
        role: "system",
        content:
          "You are a professional story bible architect. Always respond with valid JSON matching the requested schema exactly.",
      },
      {
        role: "user",
        content: buildPrompt(book, blueprint),
      },
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
    throw new Error("Failed to parse AI response. Please try again.");
  }

  const result = generatedStoryBibleSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "AI returned an invalid Story Bible structure. Please regenerate."
    );
  }

  return result.data;
}

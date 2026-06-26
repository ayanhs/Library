import type { Book } from "@/lib/books/types";
import { getGroqClient, getGroqModel } from "@/lib/ai/groq";
import { storyBlueprintSchema } from "@/lib/blueprint/validation";
import type { StoryBlueprint } from "@/lib/blueprint/types";

function buildPrompt(book: Book): string {
  return `You are an expert story architect and novelist. Create a detailed story blueprint based on the following book project.

BOOK DETAILS:
- Title: ${book.title}
- Genre: ${book.genre || "Not specified"}
- Target Audience: ${book.audience || "Not specified"}
- Main Character: ${book.main_character || "Not specified"}${book.character_age ? ` (Age: ${book.character_age})` : ""}
- Character Description: ${book.character_description || "Not specified"}
- Setting: ${book.setting || "Not specified"}
- Story Prompt: ${book.story_prompt || "Not specified"}

Return ONLY valid JSON with this exact structure (no markdown, no extra keys):
{
  "summary": "2-3 paragraph story summary",
  "conflict": "The central conflict driving the narrative",
  "characterArc": {
    "beginning": "Where the protagonist starts emotionally and situationally",
    "middle": "The transformation and trials they face",
    "ending": "Where they end up and what they learned"
  },
  "supportingCharacters": [
    {
      "name": "Character name",
      "role": "Their role in the story",
      "personality": "Key personality traits"
    }
  ],
  "chapterOutline": [
    {
      "chapterNumber": 1,
      "title": "Chapter title",
      "summary": "What happens in this chapter"
    }
  ]
}

Requirements:
- Include 3-5 supporting characters
- Include 8-12 chapters in the outline
- Tailor tone and complexity to the target audience
- Ensure the blueprint aligns with the genre and story prompt`;
}

export async function generateBlueprintWithAI(
  book: Book
): Promise<StoryBlueprint> {
  const groq = getGroqClient();
  const model = getGroqModel();

  const completion = await groq.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.8,
    messages: [
      {
        role: "system",
        content:
          "You are a professional story architect. Always respond with valid JSON matching the requested schema exactly.",
      },
      {
        role: "user",
        content: buildPrompt(book),
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

  const result = storyBlueprintSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "AI returned an invalid blueprint structure. Please regenerate."
    );
  }

  return result.data;
}

import type { Book } from "@/lib/books/types";
import type { BookChapter } from "@/lib/chapters/types";
import { formatStoryBibleForPrompt } from "@/lib/story-bible/context";
import type { StoryBibleData } from "@/lib/story-bible/types";
import {
  formatPageEstimate,
  maxTokensForPages,
  pagesToWordTarget,
} from "@/lib/chapters/length";
import { getGroqClient, getGroqModel } from "@/lib/ai/groq";
import type {
  ChapterOutlineItem,
  StoryBlueprint,
} from "@/lib/blueprint/types";

interface GenerateChapterInput {
  book: Book;
  blueprint: StoryBlueprint;
  outlineItem: ChapterOutlineItem;
  previousChapters: BookChapter[];
  targetPages: number;
  storyBible: StoryBibleData;
}

function buildChapterPrompt({
  book,
  blueprint,
  outlineItem,
  previousChapters,
  targetPages,
  storyBible,
}: GenerateChapterInput): string {
  const targetWords = pagesToWordTarget(targetPages);
  const wordEstimate = formatPageEstimate(targetPages);
  const bibleContext = formatStoryBibleForPrompt(storyBible);

  const previousContext =    previousChapters.length > 0
      ? previousChapters
          .map(
            (c) =>
              `Chapter ${c.chapter_number} — ${c.title}:\n${c.content.slice(0, 1500)}${c.content.length > 1500 ? "..." : ""}`
          )
          .join("\n\n")
      : "This is the first chapter.";

  return `You are a professional novelist. Write Chapter ${outlineItem.chapterNumber} of a book.

BOOK DETAILS:
- Title: ${book.title}
- Genre: ${book.genre || "Not specified"}
- Audience: ${book.audience || "Not specified"}
- Main Character: ${book.main_character || "Not specified"}
- Setting: ${book.setting || "Not specified"}

STORY SUMMARY:
${blueprint.summary}

MAIN CONFLICT:
${blueprint.conflict}

THIS CHAPTER OUTLINE:
- Chapter ${outlineItem.chapterNumber}: ${outlineItem.title}
- Summary: ${outlineItem.summary}

PREVIOUS APPROVED CHAPTERS:
${previousContext}

STORY BIBLE (canonical reference — stay consistent with all details):
${bibleContext}

TARGET LENGTH:
- ${targetPages} book pages (${wordEstimate})
- Aim for at least ${targetWords} words of full prose
- Write a complete, substantial chapter — expand scenes, use dialogue and description, and do not summarize or skip events

Write the full chapter prose. Use vivid description, natural dialogue, and match the genre tone for the target audience. Do NOT include chapter titles or meta-commentary — output only the chapter text.`;
}

export async function generateChapterWithAI(
  input: GenerateChapterInput
): Promise<string> {
  const groq = getGroqClient();
  const model = getGroqModel();
  const maxTokens = maxTokensForPages(input.targetPages);

  const completion = await groq.chat.completions.create({
    model,
    temperature: 0.85,
    max_tokens: maxTokens,
    messages: [
      {
        role: "system",
        content: `You are an expert fiction writer. Write engaging, publishable chapter prose at the requested length. Hit the word-count target — never write a short summary when a full chapter is requested.`,
      },
      {
        role: "user",
        content: buildChapterPrompt(input),
      },
    ],
  });
  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq returned an empty response. Please try again.");
  }

  return content;
}

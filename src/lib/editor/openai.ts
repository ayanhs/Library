import type { Book } from "@/lib/books/types";
import type { BookChapter } from "@/lib/chapters/types";
import { getGroqClient, getGroqModel } from "@/lib/ai/groq";
import { formatStoryBibleForPrompt } from "@/lib/story-bible/context";
import type { StoryBibleData } from "@/lib/story-bible/types";
import type { StoryBlueprint } from "@/lib/blueprint/types";
import { chapterAnalysisSchema } from "@/lib/editor/validation";
import type { ChapterAnalysis, ImprovementFocus } from "@/lib/editor/types";
import { IMPROVEMENT_OPTIONS } from "@/lib/editor/types";

interface AnalyzeChapterInput {
  book: Book;
  chapter: BookChapter;
  blueprint: StoryBlueprint;
  storyBible: StoryBibleData;
  previousChapters: BookChapter[];
}

function buildAnalyzePrompt({
  book,
  chapter,
  blueprint,
  storyBible,
  previousChapters,
}: AnalyzeChapterInput): string {
  const prevContext =
    previousChapters.length > 0
      ? previousChapters
          .map(
            (c) =>
              `Chapter ${c.chapter_number} "${c.title}": ${c.content.slice(0, 800)}${c.content.length > 800 ? "…" : ""}`
          )
          .join("\n\n")
      : "No prior chapters.";

  return `You are a professional fiction editor. Analyze this chapter critically and constructively.

BOOK: ${book.title} (${book.genre || "Fiction"})
CHAPTER ${chapter.chapter_number}: ${chapter.title}

STORY SUMMARY:
${blueprint.summary}

STORY BIBLE:
${formatStoryBibleForPrompt(storyBible)}

PREVIOUS CHAPTERS (for continuity):
${prevContext}

CHAPTER TO ANALYZE:
${chapter.content.length > 12000 ? `${chapter.content.slice(0, 12000)}\n\n[Chapter truncated for analysis — ${chapter.content.length.toLocaleString()} characters total]` : chapter.content}

Evaluate:
- Plot holes and logic gaps
- Character consistency (with Story Bible and prior chapters)
- Pacing (too slow, rushed, uneven)
- Dialogue quality (natural, distinct voices)
- Repetitive wording or phrases
- Grammar issues
- Readability (clarity, flow, sentence variety)

Return ONLY valid JSON:
{
  "overallScore": 0-100,
  "plotScore": 0-100,
  "characterScore": 0-100,
  "pacingScore": 0-100,
  "grammarScore": 0-100,
  "readabilityScore": 0-100,
  "issues": [
    {
      "category": "plot_hole|character_consistency|pacing|dialogue|repetition|grammar|readability",
      "severity": "low|medium|high",
      "problem": "Brief title of the issue",
      "explanation": "Why this is a problem in context",
      "suggestedFix": "Specific actionable fix"
    }
  ]
}

Include 3-12 issues if found. Be honest but constructive. Scores should reflect issue severity.`;
}

export async function analyzeChapterWithAI(
  input: AnalyzeChapterInput
): Promise<ChapterAnalysis> {
  const groq = getGroqClient();
  const model = getGroqModel();

  const completion = await groq.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content:
          "You are an expert fiction editor. Return only valid JSON matching the requested schema.",
      },
      {
        role: "user",
        content: buildAnalyzePrompt(input),
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
    throw new Error("Failed to parse analysis. Please try again.");
  }

  const result = chapterAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    console.error("Analysis validation failed:", result.error.flatten());
    throw new Error(
      "AI returned an invalid analysis structure. Please retry."
    );
  }

  return result.data;
}

interface ImproveChapterInput extends AnalyzeChapterInput {
  focusAreas: ImprovementFocus[];
}

function buildImprovePrompt(input: ImproveChapterInput): string {
  const focusLabels = input.focusAreas
    .map(
      (f) =>
        IMPROVEMENT_OPTIONS.find((o) => o.id === f)?.label ?? f
    )
    .join(", ");

  return `You are a professional fiction editor rewriting a chapter while preserving story continuity.

BOOK: ${input.book.title}
CHAPTER ${input.chapter.chapter_number}: ${input.chapter.title}

STORY SUMMARY:
${input.blueprint.summary}

STORY BIBLE (stay consistent):
${formatStoryBibleForPrompt(input.storyBible)}

IMPROVEMENT FOCUS: ${focusLabels}

ORIGINAL CHAPTER:
${input.chapter.content}

Rewrite the full chapter applying the improvement focus areas. Rules:
- Preserve all plot events and story beats — do not change what happens
- Keep character names, relationships, and world rules consistent with the Story Bible
- Maintain roughly the same length (within 10% of original word count)
- Output ONLY the improved chapter prose — no titles, notes, or commentary`;
}

export async function improveChapterWithAI(
  input: ImproveChapterInput
): Promise<string> {
  const groq = getGroqClient();
  const model = getGroqModel();
  const wordCount = input.chapter.content.split(/\s+/).filter(Boolean).length;
  const maxTokens = Math.min(16384, Math.ceil(wordCount * 1.8));

  const completion = await groq.chat.completions.create({
    model,
    temperature: 0.75,
    max_tokens: maxTokens,
    messages: [
      {
        role: "system",
        content:
          "You are an expert fiction editor. Rewrite chapters to improve quality while preserving plot and continuity.",
      },
      {
        role: "user",
        content: buildImprovePrompt(input),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq returned an empty response. Please try again.");
  }

  return content;
}

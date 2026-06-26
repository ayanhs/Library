import { z } from "zod";

export const storyBlueprintSchema = z.object({
  summary: z.string().min(1),
  conflict: z.string().min(1),
  characterArc: z.object({
    beginning: z.string().min(1),
    middle: z.string().min(1),
    ending: z.string().min(1),
  }),
  supportingCharacters: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        personality: z.string().min(1),
      })
    )
    .min(1),
  chapterOutline: z
    .array(
      z.object({
        chapterNumber: z.number().int().positive(),
        title: z.string().min(1),
        summary: z.string().min(1),
      })
    )
    .min(1),
});

export type StoryBlueprintInput = z.infer<typeof storyBlueprintSchema>;

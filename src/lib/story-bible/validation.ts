import { z } from "zod";

export const generatedCharacterSchema = z.object({
  name: z.string(),
  age: z.string().optional().default(""),
  personality: z.string(),
  appearance: z.string().optional().default(""),
  goals: z.string(),
  fears: z.string(),
  relationships: z.string(),
});

export const generatedLocationSchema = z.object({
  name: z.string(),
  description: z.string(),
  importance: z.string(),
});

export const generatedWorldRuleSchema = z.object({
  category: z.string(),
  rule: z.string(),
});

export const generatedTimelineEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  eventOrder: z.number().int().positive(),
});

export const generatedStoryBibleSchema = z.object({
  characters: z.array(generatedCharacterSchema).min(1),
  locations: z.array(generatedLocationSchema).min(1),
  worldRules: z.array(generatedWorldRuleSchema).min(1),
  timelineEvents: z.array(generatedTimelineEventSchema).min(1),
});

export type GeneratedStoryBible = z.infer<typeof generatedStoryBibleSchema>;

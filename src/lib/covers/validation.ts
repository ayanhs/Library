import { z } from "zod";

export const coverPromptsSchema = z.object({
  covers: z
    .array(
      z.object({
        style: z.string(),
        prompt: z.string().min(20),
      })
    )
    .length(3),
});

export type GeneratedCoverPrompts = z.infer<typeof coverPromptsSchema>;

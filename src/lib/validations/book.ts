import { z } from "zod";

/** Drafts accept any combination of fields — no required inputs. */
export const bookDraftSchema = z.object({
  title: z.string().optional(),
  genre: z.string().optional(),
  audience: z.string().optional(),
  mainCharacter: z.string().optional(),
  characterAge: z.string().optional(),
  characterDescription: z.string().optional(),
  setting: z.string().optional(),
  storyPrompt: z.string().optional(),
});

export const bookCreateSchema = z.object({
  title: z.string().min(1, "Book title is required"),
  genre: z.string().optional(),
  audience: z.string().optional(),
  mainCharacter: z.string().min(1, "Main character name is required"),
  characterAge: z.string().optional(),
  characterDescription: z.string().optional(),
  setting: z.string().optional(),
  storyPrompt: z.string().min(1, "Story prompt is required"),
});

export type BookDraftInput = z.infer<typeof bookDraftSchema>;
export type BookCreateInput = z.infer<typeof bookCreateSchema>;

export const UNTITLED_BOOK_TITLE = "Untitled Book";

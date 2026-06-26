import type { Book, BookFormData } from "@/lib/books/types";
import { UNTITLED_BOOK_TITLE } from "@/lib/validations/book";

export function bookToFormData(book: Book): BookFormData {
  return {
    title: book.title === UNTITLED_BOOK_TITLE ? "" : book.title,
    genre: book.genre ?? "",
    audience: book.audience ?? "",
    mainCharacter: book.main_character ?? "",
    characterAge: book.character_age ?? "",
    characterDescription: book.character_description ?? "",
    setting: book.setting ?? "",
    storyPrompt: book.story_prompt ?? "",
  };
}

export function getMissingSetupFields(book: Book): string[] {
  const missing: string[] = [];
  const title =
    book.title === UNTITLED_BOOK_TITLE ? "" : book.title?.trim() ?? "";

  if (!title) missing.push("Book Title");
  if (!book.main_character?.trim()) missing.push("Main Character");
  if (!book.story_prompt?.trim()) missing.push("Story Prompt");

  return missing;
}

export function isBookSetupComplete(book: Book): boolean {
  return book.status === "active";
}

export function getSetupProgress(book: Book): { filled: number; total: number } {
  const fields = [
    book.title && book.title !== UNTITLED_BOOK_TITLE ? book.title : "",
    book.genre,
    book.audience,
    book.main_character,
    book.character_description,
    book.setting,
    book.story_prompt,
  ];
  const filled = fields.filter((f) => f?.trim()).length;
  return { filled, total: fields.length };
}

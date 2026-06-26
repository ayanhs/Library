export type BookStatus = "draft" | "active";

export interface Book {
  id: string;
  user_id: string;
  title: string;
  genre: string | null;
  audience: string | null;
  main_character: string | null;
  character_age: string | null;
  character_description: string | null;
  setting: string | null;
  story_prompt: string | null;
  author_name: string | null;
  book_description: string | null;
  selected_cover_id: string | null;
  status: BookStatus;
  created_at: string;
  updated_at: string;
}

export interface BookFormData {
  title: string;
  genre: string;
  audience: string;
  mainCharacter: string;
  characterAge: string;
  characterDescription: string;
  setting: string;
  storyPrompt: string;
}

export interface BookCardData {
  id: string;
  title: string;
  genre: string | null;
  status: BookStatus;
  updated_at: string;
}

export type BlueprintStatus = "draft" | "approved";

export interface CharacterArc {
  beginning: string;
  middle: string;
  ending: string;
}

export interface SupportingCharacter {
  name: string;
  role: string;
  personality: string;
}

export interface ChapterOutlineItem {
  chapterNumber: number;
  title: string;
  summary: string;
}

export interface StoryBlueprint {
  summary: string;
  conflict: string;
  characterArc: CharacterArc;
  supportingCharacters: SupportingCharacter[];
  chapterOutline: ChapterOutlineItem[];
}

export interface StoryBlueprintRecord {
  id: string;
  book_id: string;
  user_id: string;
  blueprint: StoryBlueprint;
  status: BlueprintStatus;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryBibleCharacter {
  id: string;
  book_id: string;
  user_id: string;
  name: string;
  age: string;
  personality: string;
  appearance: string;
  goals: string;
  fears: string;
  relationships: string;
  created_at: string;
  updated_at: string;
}

export interface StoryBibleLocation {
  id: string;
  book_id: string;
  user_id: string;
  name: string;
  description: string;
  importance: string;
  created_at: string;
  updated_at: string;
}

export interface StoryBibleWorldRule {
  id: string;
  book_id: string;
  user_id: string;
  category: string;
  rule: string;
  created_at: string;
  updated_at: string;
}

export interface StoryBibleTimelineEvent {
  id: string;
  book_id: string;
  user_id: string;
  title: string;
  description: string;
  event_order: number;
  created_at: string;
  updated_at: string;
}

export interface StoryBibleData {
  characters: StoryBibleCharacter[];
  locations: StoryBibleLocation[];
  worldRules: StoryBibleWorldRule[];
  timelineEvents: StoryBibleTimelineEvent[];
}

export type StoryBibleCharacterInput = Omit<
  StoryBibleCharacter,
  "id" | "book_id" | "user_id" | "created_at" | "updated_at"
>;

export type StoryBibleLocationInput = Omit<
  StoryBibleLocation,
  "id" | "book_id" | "user_id" | "created_at" | "updated_at"
>;

export type StoryBibleWorldRuleInput = Omit<
  StoryBibleWorldRule,
  "id" | "book_id" | "user_id" | "created_at" | "updated_at"
>;

export type StoryBibleTimelineEventInput = Omit<
  StoryBibleTimelineEvent,
  "id" | "book_id" | "user_id" | "created_at" | "updated_at"
>;

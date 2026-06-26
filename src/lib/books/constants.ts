export const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Romance",
  "Mystery",
  "Thriller",
  "Horror",
  "Literary Fiction",
  "Historical Fiction",
  "Non-Fiction",
  "Biography",
  "Self-Help",
  "Children's",
  "Other",
] as const;

export const AUDIENCES = [
  "Children (Ages 5–8)",
  "Middle Grade (Ages 9–12)",
  "Young Adult (13–17)",
  "New Adult (18–25)",
  "Adult (25+)",
  "All Ages",
] as const;

export type Genre = (typeof GENRES)[number];
export type Audience = (typeof AUDIENCES)[number];

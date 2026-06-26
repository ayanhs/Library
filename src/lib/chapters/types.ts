export type ChapterStatus = "draft" | "approved";

export interface BookChapter {
  id: string;
  book_id: string;
  user_id: string;
  chapter_number: number;
  title: string;
  content: string;
  target_pages: number | null;
  status: ChapterStatus;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

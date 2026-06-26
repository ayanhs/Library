/** Standard fiction paperback: ~275 words per page (6"×9", 12pt). */
export const WORDS_PER_PAGE = 275;

export const MIN_CHAPTER_PAGES = 1;
export const MAX_CHAPTER_PAGES = 30;
export const DEFAULT_CHAPTER_PAGES = 10;

export function pagesToWordTarget(pages: number): number {
  return pages * WORDS_PER_PAGE;
}

export function formatPageEstimate(pages: number): string {
  const words = pagesToWordTarget(pages);
  return `~${words.toLocaleString()} words`;
}

export function clampChapterPages(pages: number): number {
  return Math.min(MAX_CHAPTER_PAGES, Math.max(MIN_CHAPTER_PAGES, Math.round(pages)));
}

export function validateChapterPages(pages: number): string | null {
  if (!Number.isFinite(pages) || !Number.isInteger(pages)) {
    return "Enter a whole number of pages.";
  }
  if (pages < MIN_CHAPTER_PAGES || pages > MAX_CHAPTER_PAGES) {
    return `Pages must be between ${MIN_CHAPTER_PAGES} and ${MAX_CHAPTER_PAGES}.`;
  }
  return null;
}

export function maxTokensForPages(pages: number): number {
  const targetWords = pagesToWordTarget(pages);
  return Math.min(16384, Math.ceil(targetWords * 1.6));
}

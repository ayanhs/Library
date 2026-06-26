export interface BookCover {
  id: string;
  book_id: string;
  user_id: string;
  batch_id: string;
  prompt: string;
  image_data: string;
  mime_type: string;
  created_at: string;
}

export interface BookCoverPreview {
  id: string;
  prompt: string;
  mimeType: string;
  imageUrl: string;
}

export interface CoverImagePayload {
  buffer: Buffer;
  mimeType: string;
}

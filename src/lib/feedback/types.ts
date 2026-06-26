export interface UserFeedback {
  id: string;
  user_id: string;
  user_email: string;
  message: string;
  page_path: string | null;
  created_at: string;
}

-- Export metadata for professional book exports
-- Run in Supabase → SQL Editor (safe to re-run)

alter table public.books
  add column if not exists author_name text not null default '';

alter table public.books
  add column if not exists book_description text not null default '';

notify pgrst, 'reload schema';

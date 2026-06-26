-- AI Editor reports — chapter analysis and improvements
-- Run in Supabase → SQL Editor (safe to re-run)

create table if not exists public.editor_reports (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  chapter_number integer not null,
  report_type text not null check (report_type in ('analysis', 'improvement')),
  analysis jsonb,
  improvement_focus text[] default '{}',
  improved_content text,
  created_at timestamptz default now() not null
);

alter table public.editor_reports enable row level security;

drop policy if exists "Users manage own editor reports" on public.editor_reports;
create policy "Users manage own editor reports"
  on public.editor_reports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists editor_reports_book_id_idx on public.editor_reports (book_id);
create index if not exists editor_reports_chapter_idx on public.editor_reports (book_id, chapter_number);

notify pgrst, 'reload schema';

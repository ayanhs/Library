-- Publishing workflow: blueprint approval + chapter writing
-- Run this entire script in Supabase → SQL Editor → Run
--
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS checks throughout.

-- ── Story blueprints (base table, if you haven't run setup-blueprints.sql) ──
create table if not exists public.story_blueprints (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null unique,
  user_id uuid references auth.users on delete cascade not null,
  blueprint jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.story_blueprints enable row level security;

drop policy if exists "Users can manage own blueprints" on public.story_blueprints;
create policy "Users can manage own blueprints"
  on public.story_blueprints for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists story_blueprints_book_id_idx
  on public.story_blueprints (book_id);

-- ── Blueprint approval columns ──
alter table public.story_blueprints
  add column if not exists status text not null default 'draft';

alter table public.story_blueprints
  add column if not exists approved_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'story_blueprints_status_check'
  ) then
    alter table public.story_blueprints
      add constraint story_blueprints_status_check
      check (status in ('draft', 'approved'));
  end if;
exception when others then null;
end $$;

-- ── Book chapters (full AI-written content, sequential workflow) ──
create table if not exists public.book_chapters (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  chapter_number integer not null,
  title text not null,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'approved')),
  approved_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (book_id, chapter_number)
);

alter table public.book_chapters enable row level security;

drop policy if exists "Users can manage own book chapters" on public.book_chapters;
create policy "Users can manage own book chapters"
  on public.book_chapters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists book_chapters_book_id_idx on public.book_chapters (book_id);

-- Target page count chosen before each chapter is generated
alter table public.book_chapters
  add column if not exists target_pages integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'book_chapters_target_pages_check'
  ) then
    alter table public.book_chapters
      add constraint book_chapters_target_pages_check
      check (target_pages is null or (target_pages >= 1 and target_pages <= 30));
  end if;
exception when others then null;
end $$;

-- Refresh PostgREST schema cache so the app sees new columns/tables immediately
notify pgrst, 'reload schema';

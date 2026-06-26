-- Story Blueprints table for AI Story Architect
-- Run in Supabase → SQL Editor

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

create index if not exists story_blueprints_user_id_idx
  on public.story_blueprints (user_id);

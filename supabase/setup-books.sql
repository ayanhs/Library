-- Run this in Supabase → SQL Editor → New query → Run
-- Creates the books table required for Save Draft / Create Book

create table if not exists public.books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  genre text,
  audience text,
  main_character text,
  character_age text,
  character_description text,
  setting text,
  story_prompt text,
  status text not null default 'draft' check (status in ('draft', 'active')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.books enable row level security;

drop policy if exists "Users can manage own books" on public.books;
create policy "Users can manage own books"
  on public.books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: chapters table (for future features)
create table if not exists public.chapters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  book_id uuid references public.books on delete cascade,
  title text not null,
  created_at timestamptz default now() not null
);

alter table public.chapters enable row level security;

drop policy if exists "Users can manage own chapters" on public.chapters;
create policy "Users can manage own chapters"
  on public.chapters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

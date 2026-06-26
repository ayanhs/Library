-- Migration: extend books table with book creation fields
-- Run this if you already created the books table from an earlier schema

alter table public.books add column if not exists genre text;
alter table public.books add column if not exists audience text;
alter table public.books add column if not exists main_character text;
alter table public.books add column if not exists character_age text;
alter table public.books add column if not exists character_description text;
alter table public.books add column if not exists setting text;
alter table public.books add column if not exists story_prompt text;
alter table public.books add column if not exists status text not null default 'draft';

-- Add check constraint if not exists (safe for re-runs)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'books_status_check'
  ) then
    alter table public.books
      add constraint books_status_check
      check (status in ('draft', 'active'));
  end if;
end $$;

alter table public.books add column if not exists updated_at timestamptz default now() not null;

-- Drop legacy projects table if you no longer need it
-- drop table if exists public.projects;

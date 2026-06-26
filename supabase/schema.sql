-- AI Publishing Studio Database Schema
-- Run this in your Supabase SQL Editor (new projects)

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Books table
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

create policy "Users can manage own books"
  on public.books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Chapters table
create table if not exists public.chapters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  book_id uuid references public.books on delete cascade,
  title text not null,
  created_at timestamptz default now() not null
);

alter table public.chapters enable row level security;

create policy "Users can manage own chapters"
  on public.chapters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Story blueprints (AI Story Architect)
create table if not exists public.story_blueprints (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null unique,
  user_id uuid references auth.users on delete cascade not null,
  blueprint jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.story_blueprints enable row level security;

create policy "Users can manage own blueprints"
  on public.story_blueprints for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

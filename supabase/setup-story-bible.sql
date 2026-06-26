-- Story Bible tables — permanent book memory for AI chapter generation
-- Run in Supabase → SQL Editor (safe to re-run)

create table if not exists public.characters (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  name text not null default '',
  age text not null default '',
  personality text not null default '',
  appearance text not null default '',
  goals text not null default '',
  fears text not null default '',
  relationships text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.locations (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  name text not null default '',
  description text not null default '',
  importance text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.world_rules (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  category text not null default '',
  rule text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.timeline_events (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default '',
  description text not null default '',
  event_order integer not null default 1,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.characters enable row level security;
alter table public.locations enable row level security;
alter table public.world_rules enable row level security;
alter table public.timeline_events enable row level security;

drop policy if exists "Users manage own characters" on public.characters;
create policy "Users manage own characters"
  on public.characters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own locations" on public.locations;
create policy "Users manage own locations"
  on public.locations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own world rules" on public.world_rules;
create policy "Users manage own world rules"
  on public.world_rules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own timeline events" on public.timeline_events;
create policy "Users manage own timeline events"
  on public.timeline_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists characters_book_id_idx on public.characters (book_id);
create index if not exists locations_book_id_idx on public.locations (book_id);
create index if not exists world_rules_book_id_idx on public.world_rules (book_id);
create index if not exists timeline_events_book_id_idx on public.timeline_events (book_id);
create index if not exists timeline_events_order_idx on public.timeline_events (book_id, event_order);

notify pgrst, 'reload schema';

-- Book cover art for exports
-- Run in Supabase → SQL Editor (safe to re-run)

create table if not exists public.book_covers (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  batch_id uuid not null default gen_random_uuid(),
  prompt text not null default '',
  image_data text not null,
  mime_type text not null default 'image/jpeg',
  created_at timestamptz default now() not null
);

alter table public.books
  add column if not exists selected_cover_id uuid references public.book_covers on delete set null;

alter table public.book_covers enable row level security;

drop policy if exists "Users manage own book covers" on public.book_covers;
create policy "Users manage own book covers"
  on public.book_covers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists book_covers_book_id_idx on public.book_covers (book_id);
create index if not exists book_covers_batch_idx on public.book_covers (book_id, batch_id);

notify pgrst, 'reload schema';

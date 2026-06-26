-- Run if your books table was created before the status column was added

alter table public.books add column if not exists genre text;
alter table public.books add column if not exists audience text;
alter table public.books add column if not exists main_character text;
alter table public.books add column if not exists character_age text;
alter table public.books add column if not exists character_description text;
alter table public.books add column if not exists setting text;
alter table public.books add column if not exists story_prompt text;
alter table public.books add column if not exists status text default 'draft';
alter table public.books add column if not exists updated_at timestamptz default now();

-- Ensure status constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'books_status_check'
  ) then
    alter table public.books
      add constraint books_status_check
      check (status in ('draft', 'active'));
  end if;
exception when others then
  null;
end $$;

update public.books set status = 'draft' where status is null;

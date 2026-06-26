-- Admin dashboard stats (restricted to admin email)
-- Run in Supabase → SQL Editor (safe to re-run)

drop function if exists public.get_admin_stats();

create or replace function public.get_admin_stats()
returns table (
  total_accounts bigint,
  new_accounts_7d bigint,
  total_books bigint,
  total_chapters bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_email text;
  book_count bigint := 0;
  chapter_count bigint := 0;
begin
  select lower(u.email)
  into caller_email
  from auth.users u
  where u.id = auth.uid();

  if caller_email is distinct from 'shuklaayanh@gmail.com' then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'books'
  ) then
    select count(*) into book_count from public.books;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'book_chapters'
  ) then
    select count(*) into chapter_count from public.book_chapters;
  elsif exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'chapters'
  ) then
    select count(*) into chapter_count from public.chapters;
  end if;

  return query
  select
    (select count(*) from auth.users)::bigint,
    (
      select count(*) from auth.users
      where created_at >= now() - interval '7 days'
    )::bigint,
    book_count,
    chapter_count;
end;
$$;

revoke all on function public.get_admin_stats() from public;
grant execute on function public.get_admin_stats() to authenticated;

notify pgrst, 'reload schema';

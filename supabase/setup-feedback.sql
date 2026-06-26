-- User feedback for admin review
-- Run in Supabase → SQL Editor (safe to re-run)

create table if not exists public.user_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  user_email text not null default '',
  message text not null check (char_length(trim(message)) >= 3),
  page_path text,
  created_at timestamptz default now() not null
);

create index if not exists user_feedback_created_at_idx
  on public.user_feedback (created_at desc);

alter table public.user_feedback enable row level security;

-- Reusable admin check
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select coalesce(
    (
      select lower(u.email) = lower('shuklaayanh@gmail.com')
      from auth.users u
      where u.id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Users submit own feedback" on public.user_feedback;
create policy "Users submit own feedback"
  on public.user_feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admin reads all feedback" on public.user_feedback;
create policy "Admin reads all feedback"
  on public.user_feedback for select
  using (public.is_admin());

notify pgrst, 'reload schema';

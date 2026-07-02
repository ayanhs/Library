-- Admin: list recently registered users (name + email)
-- Run in Supabase → SQL Editor (safe to re-run)

drop function if exists public.get_admin_recent_users(integer);

create or replace function public.get_admin_recent_users(p_days integer default 30)
returns table (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_email text;
  day_limit integer := greatest(coalesce(p_days, 30), 1);
begin
  select lower(u.email)
  into caller_email
  from auth.users u
  where u.id = auth.uid();

  if caller_email is distinct from 'shuklaayanh@gmail.com' then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(
      nullif(trim(p.full_name), ''),
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      split_part(u.email, '@', 1)
    ) as full_name,
    u.created_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.created_at >= now() - (day_limit || ' days')::interval
  order by u.created_at desc
  limit 100;
end;
$$;

revoke all on function public.get_admin_recent_users(integer) from public;
grant execute on function public.get_admin_recent_users(integer) to authenticated;

notify pgrst, 'reload schema';

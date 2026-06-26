-- AI usage limits, logging, and admin controls
-- Run in Supabase → SQL Editor (safe to re-run)

-- Admin helper (safe if already created by setup-feedback.sql)
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

create table if not exists public.ai_settings (
  id text primary key default 'global',
  ai_enabled boolean not null default true,
  updated_at timestamptz default now() not null,
  updated_by uuid references auth.users on delete set null
);

insert into public.ai_settings (id, ai_enabled)
values ('global', true)
on conflict (id) do nothing;

create table if not exists public.ai_usage_daily (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  feature text not null check (feature in ('chapter', 'story_bible', 'editor', 'cover')),
  usage_date date not null default ((timezone('utc', now()))::date),
  success_count integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, feature, usage_date)
);

create table if not exists public.ai_request_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  feature text not null,
  status text not null check (status in ('success', 'failure')),
  error_message text,
  created_at timestamptz default now() not null
);

create index if not exists ai_usage_daily_user_date_idx
  on public.ai_usage_daily (user_id, usage_date);

create index if not exists ai_request_log_user_created_idx
  on public.ai_request_log (user_id, created_at desc);

create index if not exists ai_request_log_created_idx
  on public.ai_request_log (created_at desc);

create index if not exists ai_request_log_feature_created_idx
  on public.ai_request_log (feature, created_at desc);

alter table public.ai_settings enable row level security;
alter table public.ai_usage_daily enable row level security;
alter table public.ai_request_log enable row level security;

-- Users read own daily usage
drop policy if exists "Users read own ai usage" on public.ai_usage_daily;
create policy "Users read own ai usage"
  on public.ai_usage_daily for select
  using (auth.uid() = user_id);

-- Users read own request log (optional, for debugging)
drop policy if exists "Users read own ai logs" on public.ai_request_log;
create policy "Users read own ai logs"
  on public.ai_request_log for select
  using (auth.uid() = user_id);

-- Settings: everyone can read kill switch state
drop policy if exists "Anyone reads ai settings" on public.ai_settings;
create policy "Anyone reads ai settings"
  on public.ai_settings for select
  using (true);

-- Admin updates settings
drop policy if exists "Admin updates ai settings" on public.ai_settings;
create policy "Admin updates ai settings"
  on public.ai_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- Increment daily usage (via RPC only)
create or replace function public.increment_ai_daily_usage(
  p_user_id uuid,
  p_feature text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_usage_daily (user_id, feature, usage_date, success_count)
  values (
    p_user_id,
    p_feature,
    (timezone('utc', now()))::date,
    1
  )
  on conflict (user_id, feature, usage_date)
  do update set
    success_count = ai_usage_daily.success_count + 1,
    updated_at = now();
end;
$$;

revoke all on function public.increment_ai_daily_usage(uuid, text) from public;
grant execute on function public.increment_ai_daily_usage(uuid, text) to authenticated;

-- Log AI request
create or replace function public.log_ai_request(
  p_user_id uuid,
  p_feature text,
  p_status text,
  p_error_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  log_id uuid;
begin
  insert into public.ai_request_log (user_id, feature, status, error_message)
  values (p_user_id, p_feature, p_status, p_error_message)
  returning id into log_id;

  if p_status = 'success' and p_feature in ('chapter', 'story_bible', 'editor', 'cover') then
    perform public.increment_ai_daily_usage(p_user_id, p_feature);
  end if;

  return log_id;
end;
$$;

revoke all on function public.log_ai_request(uuid, text, text, text) from public;
grant execute on function public.log_ai_request(uuid, text, text, text) to authenticated;

-- Admin AI monitor stats
create or replace function public.get_admin_ai_monitor_stats()
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_email text;
begin
  select lower(u.email) into caller_email
  from auth.users u where u.id = auth.uid();

  if caller_email is distinct from 'shuklaayanh@gmail.com' then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return json_build_object(
    'requests_today', (
      select count(*)::int from public.ai_request_log
      where created_at >= (timezone('utc', now()))::date
    ),
    'requests_week', (
      select count(*)::int from public.ai_request_log
      where created_at >= (timezone('utc', now()))::date - interval '7 days'
    ),
    'active_users_today', (
      select count(distinct user_id)::int from public.ai_request_log
      where created_at >= (timezone('utc', now()))::date
    ),
    'failed_today', (
      select count(*)::int from public.ai_request_log
      where status = 'failure'
        and created_at >= (timezone('utc', now()))::date
    ),
    'usage_by_feature', (
      select coalesce(json_object_agg(feature, cnt), '{}'::json)
      from (
        select feature, count(*)::int as cnt
        from public.ai_request_log
        where created_at >= (timezone('utc', now()))::date
        group by feature
      ) f
    ),
    'most_active_users', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json)
      from (
        select
          l.user_id,
          coalesce(p.email, u.email, 'unknown') as email,
          count(*)::int as request_count
        from public.ai_request_log l
        left join public.profiles p on p.id = l.user_id
        left join auth.users u on u.id = l.user_id
        where l.created_at >= (timezone('utc', now()))::date - interval '7 days'
        group by l.user_id, p.email, u.email
        order by request_count desc
        limit 10
      ) t
    ),
    'recent_logs', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json)
      from (
        select
          l.id,
          l.user_id,
          coalesce(p.email, u.email, 'unknown') as user_email,
          l.feature,
          l.status,
          l.error_message,
          l.created_at
        from public.ai_request_log l
        left join public.profiles p on p.id = l.user_id
        left join auth.users u on u.id = l.user_id
        order by l.created_at desc
        limit 50
      ) t
    ),
    'ai_enabled', (
      select ai_enabled from public.ai_settings where id = 'global'
    )
  );
end;
$$;

revoke all on function public.get_admin_ai_monitor_stats() from public;
grant execute on function public.get_admin_ai_monitor_stats() to authenticated;

notify pgrst, 'reload schema';

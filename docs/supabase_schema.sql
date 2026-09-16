-- ==============================================================================
-- INSCRIBE: PRODUCTION SUPABASE POSTGRES SCHEMA
-- Covenant Memory, Shared Streaks, Push Notifications, and User Profiles
-- ==============================================================================

-- 1. Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";
create extension if not exists "pg_net";

-- 2. User Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  display_name text not null,
  avatar_url text,
  invite_code text unique not null,
  timezone text not null default 'Europe/Bucharest',
  locale text not null default 'ro' check (locale in ('ro', 'en')),
  push_token text,
  streak_freezes_available int not null default 1 check (streak_freezes_available >= 0),
  longest_streak int not null default 0 check (longest_streak >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for fast lookups
create index if not exists idx_profiles_invite_code on public.profiles(invite_code);
create index if not exists idx_profiles_timezone on public.profiles(timezone);

-- 3. Dedicated Push Tokens Table (Multi-device Support)
create table if not exists public.push_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  token text unique not null,
  platform text not null default 'unknown' check (platform in ('ios', 'android', 'web', 'unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_tokens_user_id on public.push_tokens(user_id);
create index if not exists idx_push_tokens_token on public.push_tokens(token);

-- 4. Trigger: Automatically provision profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  generated_code text;
  user_tz text;
  user_loc text;
begin
  generated_code := 'INSC-' || upper(substring(md5(random()::text) from 1 for 4));
  user_tz := coalesce(new.raw_user_meta_data->>'timezone', 'Europe/Bucharest');
  user_loc := coalesce(new.raw_user_meta_data->>'locale', 'ro');

  insert into public.profiles (
    id,
    email,
    display_name,
    avatar_url,
    invite_code,
    timezone,
    locale
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    generated_code,
    user_tz,
    user_loc
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: Sync latest push token to profile
create or replace function public.sync_push_token_to_profile()
returns trigger as $$
begin
  update public.profiles
  set push_token = new.token, updated_at = now()
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_push_token_upsert on public.push_tokens;
create trigger on_push_token_upsert
  after insert or update on public.push_tokens
  for each row execute procedure public.sync_push_token_to_profile();

-- 5. Covenants Table (Accountability Pairs)
create table if not exists public.covenants (
  id uuid default uuid_generate_v4() primary key,
  user_1_id uuid references public.profiles(id) on delete cascade not null,
  user_2_id uuid references public.profiles(id) on delete set null,
  invite_code text references public.profiles(invite_code),
  shared_streak int not null default 0 check (shared_streak >= 0),
  longest_streak int not null default 0 check (longest_streak >= 0),
  freeze_reserves int not null default 1 check (freeze_reserves >= 0),
  status text not null default 'active' check (status in ('pending', 'active', 'paused', 'broken')),
  last_streak_date date,
  created_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_distinct_partners check (user_1_id <> user_2_id)
);

create index if not exists idx_covenants_user_1 on public.covenants(user_1_id);
create index if not exists idx_covenants_user_2 on public.covenants(user_2_id);
create index if not exists idx_covenants_status on public.covenants(status);

-- 6. Daily Reviews Table (Duo Streak Record)
create table if not exists public.covenant_daily_reviews (
  id uuid default uuid_generate_v4() primary key,
  covenant_id uuid references public.covenants(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  review_date date not null,
  duration_seconds int not null default 60 check (duration_seconds > 0),
  verse_reference text,
  stage_reached int not null default 4 check (stage_reached between 1 and 4),
  completed_at timestamptz not null default now(),
  status text not null default 'completed' check (status in ('completed', 'freeze_applied', 'skipped')),
  constraint unique_covenant_user_date unique(covenant_id, user_id, review_date)
);

create index if not exists idx_daily_reviews_covenant_date on public.covenant_daily_reviews(covenant_id, review_date);
create index if not exists idx_daily_reviews_user_date on public.covenant_daily_reviews(user_id, review_date);

-- 7. Notification Logs Table (Rescue Nudge & Cron Audit)
create table if not exists public.notification_logs (
  id uuid default uuid_generate_v4() primary key,
  covenant_id uuid references public.covenants(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  partner_id uuid references public.profiles(id) on delete set null,
  notification_type text not null check (
    notification_type in (
      'rescue_nudge_10pm',
      'self_reminder_10pm',
      'manual_partner_nudge',
      'partner_completed',
      'streak_saved_freeze',
      'streak_broken'
    )
  ),
  target_date date not null,
  sent_at timestamptz not null default now(),
  expo_ticket_id text,
  status text not null default 'sent' check (status in ('sent', 'failed', 'delivered')),
  constraint unique_notification_record unique(covenant_id, recipient_id, notification_type, target_date)
);

-- 8. Row-Level Security (RLS) Policies
alter table public.profiles enable row level security;
alter table public.push_tokens enable row level security;
alter table public.covenants enable row level security;
alter table public.covenant_daily_reviews enable row level security;
alter table public.notification_logs enable row level security;

-- Profiles: Authenticated users can read profiles, users can update own profile
create policy "Public profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Push Tokens: Users can only manage their own device tokens
create policy "Users can view own push tokens"
  on public.push_tokens for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own push tokens"
  on public.push_tokens for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own push tokens"
  on public.push_tokens for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own push tokens"
  on public.push_tokens for delete
  to authenticated
  using (auth.uid() = user_id);

-- Covenants: Users can only see covenants they belong to
create policy "Users can view their covenants"
  on public.covenants for select
  to authenticated
  using (auth.uid() = user_1_id or auth.uid() = user_2_id);

create policy "Users can insert covenants"
  on public.covenants for insert
  to authenticated
  with check (auth.uid() = user_1_id);

create policy "Partners can update shared covenant"
  on public.covenants for update
  to authenticated
  using (auth.uid() = user_1_id or auth.uid() = user_2_id);

-- Daily Reviews: Partners can see each other's reviews in the covenant
create policy "Covenant partners can view daily reviews"
  on public.covenant_daily_reviews for select
  to authenticated
  using (
    exists (
      select 1 from public.covenants c
      where c.id = covenant_daily_reviews.covenant_id
      and (c.user_1_id = auth.uid() or c.user_2_id = auth.uid())
    )
  );

create policy "Users can log their own daily reviews"
  on public.covenant_daily_reviews for insert
  to authenticated
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.covenants c
      where c.id = covenant_daily_reviews.covenant_id
      and (c.user_1_id = auth.uid() or c.user_2_id = auth.uid())
    )
  );

create policy "Users can update own daily reviews"
  on public.covenant_daily_reviews for update
  to authenticated
  using (auth.uid() = user_id);

-- Notification Logs: Users can view their notifications
create policy "Users can view own notification logs"
  on public.notification_logs for select
  to authenticated
  using (auth.uid() = recipient_id);

-- 9. Stored Procedures / RPCs
create or replace function public.register_device_token(
  p_token text,
  p_platform text default 'unknown'
)
returns json as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.push_tokens (user_id, token, platform, updated_at)
  values (v_user_id, p_token, p_platform, now())
  on conflict (token) do update
  set user_id = v_user_id, platform = excluded.platform, updated_at = now();

  update public.profiles
  set push_token = p_token, updated_at = now()
  where id = v_user_id;

  return json_build_object('success', true, 'token', p_token);
end;
$$ language plpgsql security definer;

create or replace function public.complete_daily_review(
  p_covenant_id uuid,
  p_duration_seconds int default 60,
  p_verse_ref text default null,
  p_stage int default 4
)
returns json as $$
declare
  v_user_id uuid := auth.uid();
  v_covenant public.covenants%rowtype;
  v_user_profile public.profiles%rowtype;
  v_partner_id uuid;
  v_today date;
  v_partner_review public.covenant_daily_reviews%rowtype;
  v_both_done boolean := false;
  v_new_streak int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_covenant from public.covenants where id = p_covenant_id;
  if not found then
    raise exception 'Covenant not found';
  end if;

  if v_covenant.user_1_id <> v_user_id and v_covenant.user_2_id <> v_user_id then
    raise exception 'User does not belong to this covenant';
  end if;

  select * into v_user_profile from public.profiles where id = v_user_id;
  v_partner_id := case when v_covenant.user_1_id = v_user_id then v_covenant.user_2_id else v_covenant.user_1_id end;

  v_today := (now() at time zone coalesce(v_user_profile.timezone, 'Europe/Bucharest'))::date;

  insert into public.covenant_daily_reviews (
    covenant_id,
    user_id,
    review_date,
    duration_seconds,
    verse_reference,
    stage_reached,
    status,
    completed_at
  ) values (
    p_covenant_id,
    v_user_id,
    v_today,
    p_duration_seconds,
    p_verse_ref,
    p_stage,
    'completed',
    now()
  )
  on conflict (covenant_id, user_id, review_date) do update
  set
    duration_seconds = excluded.duration_seconds,
    verse_reference = coalesce(excluded.verse_reference, public.covenant_daily_reviews.verse_reference),
    stage_reached = greatest(excluded.stage_reached, public.covenant_daily_reviews.stage_reached),
    status = 'completed',
    completed_at = now();

  if v_partner_id is not null then
    select * into v_partner_review
    from public.covenant_daily_reviews
    where covenant_id = p_covenant_id
      and user_id = v_partner_id
      and review_date = v_today
      and status = 'completed';

    if found then
      v_both_done := true;
      if v_covenant.last_streak_date is null or v_covenant.last_streak_date < v_today then
        v_new_streak := v_covenant.shared_streak + 1;
        update public.covenants
        set
          shared_streak = v_new_streak,
          longest_streak = greatest(longest_streak, v_new_streak),
          last_streak_date = v_today,
          last_synced_at = now(),
          updated_at = now()
        where id = p_covenant_id;

        update public.profiles
        set longest_streak = greatest(longest_streak, v_new_streak), updated_at = now()
        where id in (v_covenant.user_1_id, v_covenant.user_2_id);
      else
        v_new_streak := v_covenant.shared_streak;
      end if;
    else
      v_new_streak := v_covenant.shared_streak;
    end if;
  else
    v_new_streak := v_covenant.shared_streak;
  end if;

  return json_build_object(
    'success', true,
    'both_completed', v_both_done,
    'shared_streak', v_new_streak,
    'review_date', v_today
  );
end;
$$ language plpgsql security definer;

-- 10. Realtime Publications (Enables WebSocket Live Sync on Mobile)
alter publication supabase_realtime add table public.covenant_daily_reviews;
alter publication supabase_realtime add table public.covenants;

-- 11. pg_cron Scheduled Hourly Background Jobs
-- Runs every hour at minute 0: evaluates 10:00 PM nudges and midnight streak cutoffs
create or replace function public.cron_process_hourly_events()
returns void as $$
declare
  v_base_url text;
  v_service_key text;
begin
  -- Resolve Edge Function base URL and service role key from settings or project defaults
  v_base_url := coalesce(
    current_setting('app.settings.edge_function_url', true),
    'https://project-ref.functions.supabase.co'
  );
  v_service_key := coalesce(
    current_setting('app.settings.service_role_key', true),
    ''
  );

  -- Invoke 10:00 PM Rescue Nudge Edge Function via pg_net if available
  if exists (select 1 from pg_extension where extname = 'pg_net') then
    perform net.http_post(
      url := v_base_url || '/rescue-nudge',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := '{}'::jsonb
    );

    -- Invoke Midnight Streak Resolution Edge Function via pg_net
    perform net.http_post(
      url := v_base_url || '/resolve-streaks',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := '{}'::jsonb
    );
  end if;
end;
$$ language plpgsql security definer;

-- Schedule with pg_cron
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('inscribe-hourly-nudges-and-streaks')
    where exists (
      select 1 from cron.job where jobname = 'inscribe-hourly-nudges-and-streaks'
    );

    perform cron.schedule(
      'inscribe-hourly-nudges-and-streaks',
      '0 * * * *',
      $$select public.cron_process_hourly_events()$$
    );
  end if;
exception
  when others then
    raise notice 'pg_cron extension not configured in current environment';
end;
$$;

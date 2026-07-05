-- ============================================================
-- HEALTH POP — full schema. Run once in Supabase SQL Editor.
-- Security model: sensitive tables are owner-only via RLS.
-- Friends can ONLY read daily_summary (mood/streak/logged flag),
-- which is populated by a trigger — never raw health data.
-- ============================================================

-- ---------- core tables ----------
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,   -- name, goals, conditions, futureYou, custom fields, photo path
  updated_at timestamptz not null default now()
);

create table if not exists logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  data jsonb not null default '{}'::jsonb,   -- mood, sleepHrs, steps, exercised, healthyFood, weightKg, ...
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- ---------- social layer ----------
-- Friends may read ONLY this table. Populated by trigger below.
create table if not exists daily_summary (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  logged boolean not null default true,
  mood text,
  exercised boolean default false,
  healthy_food boolean default false,
  primary key (user_id, log_date)
);

create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);

create table if not exists invites (
  code text primary key,
  inviter uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_by uuid references auth.users(id)
);

-- One nudge per friend per day, enforced by the primary key itself.
create table if not exists nudges (
  from_id uuid not null references auth.users(id) on delete cascade,
  to_id uuid not null references auth.users(id) on delete cascade,
  nudge_date date not null default current_date,
  primary key (from_id, to_id, nudge_date)
);

-- Public display info friends are allowed to see (name + evo stage).
create table if not exists public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Friend',
  evo_stage int not null default 0
);

-- Daily per-user call count for the AI coach — the rate limit for /api/coach.
create table if not exists coach_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  count int not null default 0,
  primary key (user_id, usage_date)
);

-- ---------- trigger: logs -> daily_summary ----------
create or replace function sync_daily_summary() returns trigger as $$
begin
  insert into daily_summary (user_id, log_date, logged, mood, exercised, healthy_food)
  values (
    new.user_id, new.log_date, true,
    new.data->>'mood',
    coalesce((new.data->>'exercised')::boolean, false),
    coalesce((new.data->>'healthyFood')::boolean, false)
  )
  on conflict (user_id, log_date) do update
    set mood = excluded.mood,
        exercised = excluded.exercised,
        healthy_food = excluded.healthy_food,
        logged = true;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_sync_summary on logs;
create trigger trg_sync_summary after insert or update on logs
for each row execute function sync_daily_summary();

-- ---------- invite acceptance (security definer RPC) ----------
create or replace function accept_invite(invite_code text) returns text as $$
declare inv record;
begin
  select * into inv from invites where code = invite_code and used_by is null and expires_at > now();
  if inv is null then return 'invalid'; end if;
  if inv.inviter = auth.uid() then return 'self'; end if;
  insert into friendships (user_a, user_b)
  values (least(inv.inviter, auth.uid()), greatest(inv.inviter, auth.uid()))
  on conflict do nothing;
  update invites set used_by = auth.uid() where code = invite_code;
  return 'ok';
end;
$$ language plpgsql security definer;

-- ---------- invite lookup: inviter's first name for the sign-in email (no auth required) ----------
create or replace function invite_inviter_first_name(invite_code text) returns text as $$
  select split_part(p.display_name, ' ', 1)
  from invites i
  join public_profiles p on p.user_id = i.inviter
  where i.code = invite_code and i.used_by is null and i.expires_at > now();
$$ language sql security definer stable;

-- ---------- coach rate limit (atomic increment, returns today's count) ----------
create or replace function increment_coach_usage() returns int as $$
declare new_count int;
begin
  insert into coach_usage (user_id, usage_date, count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, usage_date) do update set count = coach_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$ language plpgsql security definer;

-- helper: are two users friends?
create or replace function are_friends(a uuid, b uuid) returns boolean as $$
  select exists (
    select 1 from friendships
    where (user_a = least(a,b) and user_b = greatest(a,b))
  );
$$ language sql security definer stable;

-- ---------- row level security ----------
alter table profiles enable row level security;
alter table logs enable row level security;
alter table daily_summary enable row level security;
alter table friendships enable row level security;
alter table invites enable row level security;
alter table nudges enable row level security;
alter table public_profiles enable row level security;
alter table coach_usage enable row level security;

-- sensitive: owner only
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own logs" on logs;
create policy "own logs" on logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- summaries: owner full access; friends read-only
drop policy if exists "own summary" on daily_summary;
create policy "own summary" on daily_summary
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "friends read summary" on daily_summary;
create policy "friends read summary" on daily_summary
  for select using (are_friends(auth.uid(), user_id));

-- friendships: participants only
drop policy if exists "own friendships" on friendships;
create policy "own friendships" on friendships
  for select using (auth.uid() = user_a or auth.uid() = user_b);
drop policy if exists "delete own friendship" on friendships;
create policy "delete own friendship" on friendships
  for delete using (auth.uid() = user_a or auth.uid() = user_b);

-- invites: inviter manages own
drop policy if exists "own invites" on invites;
create policy "own invites" on invites
  for all using (auth.uid() = inviter) with check (auth.uid() = inviter);

-- nudges: sender inserts (to friends only), both sides read
drop policy if exists "send nudge to friend" on nudges;
create policy "send nudge to friend" on nudges
  for insert with check (auth.uid() = from_id and are_friends(from_id, to_id));
drop policy if exists "read own nudges" on nudges;
create policy "read own nudges" on nudges
  for select using (auth.uid() = from_id or auth.uid() = to_id);

-- public_profiles: owner writes; friends read
drop policy if exists "own public profile" on public_profiles;
create policy "own public profile" on public_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "friends read public profile" on public_profiles;
create policy "friends read public profile" on public_profiles
  for select using (are_friends(auth.uid(), user_id));

-- coach_usage: owner only (written via the security-definer increment_coach_usage() RPC)
drop policy if exists "own coach usage" on coach_usage;
create policy "own coach usage" on coach_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- storage: private attachments bucket ----------
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false)
on conflict do nothing;

drop policy if exists "own attachments read" on storage.objects;
create policy "own attachments read" on storage.objects
  for select using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own attachments write" on storage.objects;
create policy "own attachments write" on storage.objects
  for insert with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own attachments delete" on storage.objects;
create policy "own attachments delete" on storage.objects
  for delete using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

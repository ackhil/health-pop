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

-- sensitive: owner only
create policy "own profile" on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own logs" on logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- summaries: owner full access; friends read-only
create policy "own summary" on daily_summary
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "friends read summary" on daily_summary
  for select using (are_friends(auth.uid(), user_id));

-- friendships: participants only
create policy "own friendships" on friendships
  for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "delete own friendship" on friendships
  for delete using (auth.uid() = user_a or auth.uid() = user_b);

-- invites: inviter manages own
create policy "own invites" on invites
  for all using (auth.uid() = inviter) with check (auth.uid() = inviter);

-- nudges: sender inserts (to friends only), both sides read
create policy "send nudge to friend" on nudges
  for insert with check (auth.uid() = from_id and are_friends(from_id, to_id));
create policy "read own nudges" on nudges
  for select using (auth.uid() = from_id or auth.uid() = to_id);

-- public_profiles: owner writes; friends read
create policy "own public profile" on public_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "friends read public profile" on public_profiles
  for select using (are_friends(auth.uid(), user_id));

-- ---------- storage: private attachments bucket ----------
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false)
on conflict do nothing;

create policy "own attachments read" on storage.objects
  for select using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own attachments write" on storage.objects
  for insert with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own attachments delete" on storage.objects
  for delete using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

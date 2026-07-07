-- Isolated, minimal fix: creates ONLY the feedback table + its policy, independent of
-- anything else in schema.sql. Use this if the full schema.sql script is failing
-- somewhere else and silently rolling back the feedback table with it.
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nps int not null check (nps between 0 and 10),
  message text,
  attachment_path text,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

drop policy if exists "own feedback" on feedback;
create policy "own feedback" on feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

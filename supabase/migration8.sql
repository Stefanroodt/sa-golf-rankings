-- Pin High — migration 8: feedback form
-- Run once in Supabase SQL Editor.
-- Read submissions with: select * from feedback order by created_at desc;

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;
create policy "anyone can send feedback" on feedback for insert with check (true);
-- no select policy: submissions are visible only in this dashboard

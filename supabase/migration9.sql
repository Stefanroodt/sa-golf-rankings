-- Pin High — migration 9: 19th hole ratings (separate from course ratings)
-- Run once in Supabase SQL Editor.

create table if not exists nineteenth_ratings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  overall numeric(3,2) not null check (overall between 1 and 5),
  atmosphere numeric(3,2) not null check (atmosphere between 1 and 5),
  drinks numeric(3,2) not null check (drinks between 1 and 5),
  food numeric(3,2) not null check (food between 1 and 5),
  view numeric(3,2) not null check (view between 1 and 5),
  service numeric(3,2) not null check (service between 1 and 5),
  comment text check (char_length(comment) <= 600),
  ip_hash text,
  suspect boolean not null default false,
  created_at timestamptz not null default now(),
  unique (course_id, user_id)
);

alter table nineteenth_ratings enable row level security;
create policy "19th ratings are public" on nineteenth_ratings for select using (true);
-- No insert/update policies: writes go through the site's server endpoint only.

create view nineteenth_rankings with (security_invoker = on) as
select
  c.*,
  count(r.id)::int as n_ratings,
  coalesce(avg(r.overall), 0)    as avg_overall,
  coalesce(avg(r.atmosphere), 0) as avg_atmosphere,
  coalesce(avg(r.drinks), 0)     as avg_drinks,
  coalesce(avg(r.food), 0)       as avg_food,
  coalesce(avg(r.view), 0)       as avg_view,
  coalesce(avg(r.service), 0)    as avg_service
from courses c
left join nineteenth_ratings r on r.course_id = c.id and r.suspect = false
group by c.id;

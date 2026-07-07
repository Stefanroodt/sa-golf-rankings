-- FairwayRank ZA — migration 3: category averages, reports, websites, auto-descriptions
-- Run once in Supabase SQL Editor.

-- 1. Extra course fields
alter table courses add column if not exists website text;
alter table courses add column if not exists image_url text;

-- 2. Rebuild ranking view with per-category averages (for sort by value/conditions)
drop view if exists course_rankings;
create view course_rankings with (security_invoker = on) as
select
  c.*,
  count(r.id)::int as n_ratings,
  coalesce(avg(r.overall), 0)    as avg_overall,
  coalesce(avg(r.value), 0)      as avg_value,
  coalesce(avg(r.conditions), 0) as avg_conditions,
  coalesce(avg(r.layout), 0)     as avg_layout,
  coalesce(avg(r.pace), 0)       as avg_pace,
  coalesce(avg(r.staff), 0)      as avg_staff
from courses c
left join ratings r on r.course_id = c.id
group by c.id;

-- 3. Review reports (visible only in the Supabase dashboard, not on the site)
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid not null references ratings(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (rating_id, reporter_id)
);
alter table reports enable row level security;
create policy "signed-in users can report" on reports for insert
  with check (auth.uid() = reporter_id);

-- 4. Neutral auto-descriptions for courses that have none
update courses set description =
  holes || '-hole ' ||
  case when access = 'Resort' then 'resort course' else 'course' end ||
  ' in ' || town || ', ' || province || '. GolfRSA-affiliated. ' ||
  'Played here? Rate it and tell fellow golfers what to expect.'
where description is null;

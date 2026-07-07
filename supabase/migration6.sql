-- Pin High — migration 6: anti-gaming (IP tracking + suspect flagging, server-side writes)
-- Run once in Supabase SQL Editor.

-- 1. Track a salted hash of the rater's IP + a suspect flag
alter table ratings add column if not exists ip_hash text;
alter table ratings add column if not exists suspect boolean not null default false;

-- 2. Rankings ignore suspect ratings entirely
drop view if exists course_rankings;
create view course_rankings with (security_invoker = on) as
select
  c.*,
  count(r.id)::int as n_ratings,
  coalesce(avg(r.overall), 0)    as avg_overall,
  coalesce(avg(r.value), 0)      as avg_value,
  coalesce(avg(r.conditions), 0) as avg_conditions,
  coalesce(avg(r.layout), 0)     as avg_layout,
  coalesce(avg(r.clubhouse), 0)  as avg_clubhouse,
  coalesce(avg(r.staff), 0)      as avg_staff
from courses c
left join ratings r on r.course_id = c.id and r.suspect = false
group by c.id;

-- 3. Close the side door: ratings can no longer be written directly from the
--    browser — only through the site's server endpoint, which checks the IP.
drop policy if exists "users insert own rating" on ratings;
drop policy if exists "users update own rating" on ratings;

-- 4. Review queue: see flagged ratings any time with
--    select * from ratings where suspect = true;

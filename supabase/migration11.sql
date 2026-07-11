-- Pin High — migration 11: add Greens category to course ratings
-- Run once in Supabase SQL Editor.
-- (The Clubhouse -> Halfway House change is a label only; no data change needed.)

drop view if exists course_rankings;

alter table ratings add column if not exists greens numeric(3,2)
  check (greens between 1 and 5);

-- Existing ratings: greens starts at that rating's overall score
update ratings set greens = overall where greens is null;

create view course_rankings with (security_invoker = on) as
select
  c.*,
  count(r.id)::int as n_ratings,
  coalesce(avg(r.overall), 0)    as avg_overall,
  coalesce(avg(r.value), 0)      as avg_value,
  coalesce(avg(r.conditions), 0) as avg_conditions,
  coalesce(avg(r.greens), 0)     as avg_greens,
  coalesce(avg(r.layout), 0)     as avg_layout,
  coalesce(avg(r.clubhouse), 0)  as avg_clubhouse,
  coalesce(avg(r.staff), 0)      as avg_staff
from courses c
left join ratings r on r.course_id = c.id and r.suspect = false
group by c.id;

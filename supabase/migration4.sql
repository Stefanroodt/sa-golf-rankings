-- FairwayRank ZA — migration 4: rename rating category "pace" -> "clubhouse"
-- Run once in Supabase SQL Editor.

drop view if exists course_rankings;

alter table ratings rename column pace to clubhouse;

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
left join ratings r on r.course_id = c.id
group by c.id;

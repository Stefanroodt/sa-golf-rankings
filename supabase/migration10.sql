-- Pin High — migration 10: first raters (Pioneer badge)
-- Run once in Supabase SQL Editor.

create or replace view first_raters with (security_invoker = on) as
select distinct on (course_id) course_id, user_id
from ratings
where suspect = false
order by course_id, created_at asc;

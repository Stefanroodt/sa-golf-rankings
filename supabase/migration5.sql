-- FairwayRank ZA — migration 5: decimal ratings + import Stefan's 103 course ratings
-- Run once in Supabase SQL Editor. Requires migration4 (clubhouse rename) first.
-- IMPORTANT: you must have created your account on the site with stevelroodt@gmail.com before running this.

-- 1. Allow decimal star ratings (e.g. 4.8) while keeping the 1–5 range
drop view if exists course_rankings;
alter table ratings
  alter column overall    type numeric(3,2),
  alter column value      type numeric(3,2),
  alter column conditions type numeric(3,2),
  alter column layout     type numeric(3,2),
  alter column clubhouse  type numeric(3,2),
  alter column staff      type numeric(3,2);

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

-- 2. Import ratings under your account (safe to re-run; updates existing)
with me as (
  select id, coalesce(raw_user_meta_data->>'display_name', split_part(email,'@',1)) as dn
  from auth.users where email = 'stevelroodt@gmail.com'
),
data(slug, overall, value, conditions, layout, clubhouse, staff) as (values
('fancourt-links',4.96,4.8,5,5,5,5),
('fancourt-montagu',4.5,3,5,4.5,5,5),
('fancourt-outeniqua',4.52,3,5,4.6,5,5),
('george',4.26,5,4.5,4.8,4,3),
('pezula',4.2,4,4.5,4.5,4,4),
('simola',4.34,4,4.6,4.6,4.5,4),
('knysna',3.4,3,3,3,4,4),
('goose-valley',3.58,3.5,3.8,3.6,3.5,3.5),
('plettenberg-bay',3.5,3.5,3.5,3.5,3.5,3.5),
('mossel-bay',3.6,3.6,3.6,3.6,3.6,3.6),
('pinnacle-point',4.4,4,5,4,5,4),
('oubaai',4.3,4.5,4.5,5,3.5,4),
('katberg-eco',4,4.5,4,4,3.5,4),
('east-london',4.46,5,4.5,5,3.8,4),
('olivewood',3.4,3,3,3,4,4),
('humewood',4.42,4.8,4.6,4.7,4,4),
('st-francis-links',4.9,5,5,4.5,5,5),
('hermanus',4.8,5,4.7,4.8,5,4.5),
('arabella',4.02,3.5,4.5,4.6,3.5,4),
('somerset-west',2.84,3,3.2,3,3,2),
('strand',3.5,3.5,3.5,3.5,3.5,3.5),
('westlake',4.48,4.5,4.6,4.5,4.5,4.3),
('clovelly',4.62,4.8,4.7,4.5,4.6,4.5),
('simonstown',2.9,3,1,1.5,4,5),
('royal-cape',3.96,3,4.5,4,4,4.3),
('royal-port-alfred',3.4,3,3,3,4,4),
('rondebosch',3.3,3,3,3,3.5,4),
('king-david-mowbray',3.62,3.5,3.5,3.5,3.5,4.1),
('worcester',3.8,3.8,3.5,3.7,4,4),
('durbanville',3.32,3,3.3,3.5,3.8,3),
('bellville',3.04,2.8,2.9,3,3.5,3),
('malmesbury',3,3,3,3,3,3),
('langebaan-country-estate',4.04,4.2,4,4,4,4),
('atlantic-beach',4.2,4,4,4,4,5),
('milnerton',3.74,3.5,3.5,3.7,4,4),
('paarl',4.4,3.8,4.8,4.6,4.5,4.3),
('devonvale-golf-wine-estate',3.84,3.8,3.6,3.6,4,4.2),
('stellenbosch',4.3,4.2,4.6,4.4,4.1,4.2),
('de-zalze',4.06,4,4.3,4,4,4),
('metropolitan',3.86,4.2,3.9,3.6,4,3.6),
('steenberg',4.24,3,4.8,4.5,4.4,4.5),
('robertson',3.62,3,3.6,3.5,4,4),
('benoni',3.72,3.6,4.2,3.6,4.2,3),
('the-lake-club-benoni',3.46,3.2,2.8,3.3,4,4),
('erpm',3,3,3,3,4,2),
('ebotse-links',4.18,4,4.4,4.5,3.8,4.2),
('serengeti',4.44,4,4.6,4.6,4.7,4.3),
('reading',3.72,3.7,3.7,3.5,3.8,3.9),
('eye-of-africa',3.98,3.9,4,4,4,4),
('eagle-canyon',4,4,4,4,4,4),
('jackal-creek',3.84,3.5,3.6,3.6,4,4.5),
('royal-johannesburg-east',4.5,4.5,4.5,4.5,4.5,4.5),
('royal-johannesburg-kensington-west',4.5,4.5,4.5,4.5,4.5,4.5),
('glendower',4.7,4.7,4.7,4.7,4.7,4.7),
('huddle-park',3.6,4,2.5,3,4,4.5),
('houghton',4.36,4.3,4.3,4.6,4.3,4.3),
('killarney',3.9,3.9,3.9,3.9,3.9,3.9),
('kempton-park',3.36,2.8,2.5,3,4,4.5),
('woodhill',4.3,4,4.6,4.5,4.2,4.2),
('pretoria',4.2,4,4.5,4.5,4,4),
('wingate-park',4.08,4.5,4,3.8,4,4.1),
('the-els-club-copperleaf',4.34,3.8,4.7,4.7,4.5,4),
('mbombela',3.86,4,3.8,3.5,4,4),
('champagne-sports-resort',4.32,4.5,4.5,3.5,4.6,4.5),
('durban-country-club',4.14,3.7,4.5,4.5,4,4),
('zimbali',3.98,3.5,4.6,4.3,4,3.5),
('princes-grant',4.04,4,4.2,4,4,4),
('umhlali',3.86,4,3.5,3.5,4.1,4.2),
('wild-coast-sun',4.52,4.8,4.7,4.3,4.3,4.5),
('umdoni-park',3.98,4.7,3,3.5,4.2,4.5),
('umkomaas',3,2,1.5,3,4,4.5),
('kloof',3.84,3.5,3.7,3.8,4,4.2),
('cotswold-downs',4.66,4.7,4.8,4,4.8,5),
('beachwood',4.04,4.2,3.7,3.5,4.3,4.5),
('pecanwood',3.92,3.8,3.8,4,4,4),
('gowrie-farm',4.44,4.3,4.5,4,4.7,4.7),
('pearl-valley',4.5,3.5,5,4.8,4.7,4.5),
('dainfern',3.82,3.7,4,3.7,4,3.7),
('glenvista',3.78,3.6,3.6,3.5,4.2,4),
('irene',3.98,4.2,3.8,3.6,4.1,4.2),
('kyalami',4.22,4.2,4.3,4.4,4.2,4),
('modderfontein',3.9,4,3.5,3.5,4.2,4.3),
('royal-oak',3.12,2.5,2,3,3.8,4.3),
('silver-lakes',3.96,3.8,4,3.7,4.3,4),
('waterkloof',3.88,3.8,3.4,3.9,4.1,4.2),
('san-lameer',4.3,4,4,3.8,4.7,5),
('mount-edgecombe',3.86,3.7,3.9,4,3.8,3.9),
('selborne',3.94,4,4,3.6,4,4.1),
('victoria',4.04,3.9,3.8,4.5,4,4),
('zebula',4.06,4,3.6,3.8,4.5,4.4),
('white-river',3.7,3.5,3.6,3.6,3.8,4),
('bankenveld',3.4,3.4,3.4,3.4,3.4,3.4),
('erinvale',4.44,4.2,4.8,4.7,4.5,4),
('kingswood',3.84,3.7,3.9,3.6,4,4),
('kuils-river',4.18,4.4,3.5,3.5,4.5,5),
('parow',2.9,2,2,2,4,4.5),
('blue-valley',3.82,3.7,3.7,3.5,4,4.2),
('state-mines',3.78,4,3.7,3.6,3.6,4),
('maccauvlei',3.9,4,3.8,3.7,4,4),
('observatory',3,2.6,2.2,2.2,4,4),
('parkview',4.14,4,4.4,4.3,4,4),
('parys-golf-country-estate',3.82,3.9,3.5,3.7,4,4),
('vaal-de-grace',3.82,4,3.6,3.5,4,4)
)
insert into ratings (course_id, user_id, display_name, overall, value, conditions, layout, clubhouse, staff)
select c.id, me.id, me.dn, d.overall, d.value, d.conditions, d.layout, d.clubhouse, d.staff
from data d
join courses c on c.slug = d.slug
cross join me
on conflict (course_id, user_id) do update set
  overall = excluded.overall, value = excluded.value, conditions = excluded.conditions,
  layout = excluded.layout, clubhouse = excluded.clubhouse, staff = excluded.staff;

-- Expected result: 103 rows affected. If 0 rows: no account with stevelroodt@gmail.com exists yet.

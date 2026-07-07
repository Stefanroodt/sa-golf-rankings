#!/usr/bin/env python3
"""Convert Stefan's ratings CSV into migration5.sql (decimal ratings + upsert under his account)."""
import csv, sys

CSV = sys.argv[1]
EMAIL = 'stevelroodt@gmail.com'

# CSV course name -> database slug
SLUGS = {
 'Fancourt Links':'fancourt-links','Fancourt Montagu':'fancourt-montagu',
 'Fancourt Outeniqua':'fancourt-outeniqua','George Country Club':'george','Pezula':'pezula',
 'Simola':'simola','Knysna Golf Club':'knysna','Goose Valley':'goose-valley',
 'Plettenberg Country Club':'plettenberg-bay','Mossel Bay Golf Course':'mossel-bay',
 'Pinnacle Point':'pinnacle-point','Oubaai':'oubaai','Katberg':'katberg-eco',
 'East London Golf Club':'east-london','Olivewood':'olivewood','Humewood':'humewood',
 'St Francis Links':'st-francis-links','Hermanus Golf Club':'hermanus','Arabella':'arabella',
 'Somerset West Golf Club':'somerset-west','Strand Golf Club':'strand','Westlake':'westlake',
 'Clovelly':'clovelly',"Simon's Town":'simonstown','Royal Cape':'royal-cape',
 'Royal Port Alfred':'royal-port-alfred','Rondebosch Golf Club':'rondebosch',
 'King David Mowbray':'king-david-mowbray','Worcester Golf Club':'worcester',
 'Durbanville Golf Club':'durbanville','Bellville Golf Club':'bellville','Malmesbury':'malmesbury',
 'Langebaan':'langebaan-country-estate','Atlantic Beach':'atlantic-beach','MIlnerton':'milnerton',
 'Paarl':'paarl','Devonvale':'devonvale-golf-wine-estate','Stellenbosch':'stellenbosch',
 'De Zalze':'de-zalze','The Metropolitan':'metropolitan','Steenberg':'steenberg',
 'Robertson':'robertson','Benoni Country Club':'benoni','Lake Club Benoni':'the-lake-club-benoni',
 'ERPM':'erpm','Ebotse':'ebotse-links','Serengeti':'serengeti','Reading':'reading',
 'Eye of Africa':'eye-of-africa','Eagle Canyon':'eagle-canyon','Jackal Creek':'jackal-creek',
 'Royal Johannesburg East':'royal-johannesburg-east',
 'Royal Johannesburg West':'royal-johannesburg-kensington-west','Glendower':'glendower',
 'Huddle Park':'huddle-park','Houghton':'houghton','Killarney':'killarney',
 'Kempton Park':'kempton-park','Woodhill':'woodhill','Pretoria Country Club':'pretoria',
 'Wingate Park':'wingate-park','Copperleaf':'the-els-club-copperleaf',
 'Mbombela Golf Club':'mbombela','Champagne Sports':'champagne-sports-resort',
 'Durban Country Club':'durban-country-club','Zimbali':'zimbali','Princes Grant':'princes-grant',
 'Umhlali':'umhlali','Wild Coast':'wild-coast-sun','Umdoni':'umdoni-park','Umkomaas':'umkomaas',
 'Kloof':'kloof','Cotswold Downs':'cotswold-downs','Beachwood':'beachwood','Pecanwood':'pecanwood',
 'Gowrie Farm':'gowrie-farm','Pearl Valley':'pearl-valley','Dainfern':'dainfern',
 'Glenvista':'glenvista','Irene':'irene','Kyalami':'kyalami','Modderfontein':'modderfontein',
 'Royal Oak':'royal-oak','Silver Lakes':'silver-lakes','Waterkloof':'waterkloof',
 'San Lameer':'san-lameer','Mount Edgecombe':'mount-edgecombe','Selborne':'selborne',
 'Victoria Country Club':'victoria','Zebula':'zebula','White River':'white-river',
 'Bankenveld':'bankenveld','Erinvale':'erinvale','Kingswood':'kingswood','Kuilsriver':'kuils-river',
 'Parow':'parow','Blue Valley':'blue-valley','State Mines':'state-mines','Maccauvlei':'maccauvlei',
 'Observatory':'observatory','Parkview':'parkview','Parys':'parys-golf-country-estate',
 'Vaal De Grace':'vaal-de-grace',
}

rows, missing = [], []
with open(CSV, newline='', encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        name = r['course'].strip()
        if not name:
            continue
        slug = SLUGS.get(name)
        if not slug:
            missing.append(name)
            continue
        def n(key):
            v = (r.get(key) or r.get(key.capitalize()) or '').strip()
            return v if v else r['overall'].strip()  # blank category -> overall
        vals = [r['overall'].strip(), n('value'), n('conditions'), n('layout'), n('clubhouse'), n('staff')]
        for v in vals:
            fv = float(v)
            assert 1 <= fv <= 5, f'{name}: {v} out of range'
        rows.append(f"('{slug}',{','.join(vals)})")

if missing:
    sys.exit('UNMATCHED: ' + '; '.join(missing))

values_block = ',\n'.join(rows)
sql = f"""-- FairwayRank ZA — migration 5: decimal ratings + import Stefan's {len(rows)} course ratings
-- Run once in Supabase SQL Editor. Requires migration4 (clubhouse rename) first.
-- IMPORTANT: you must have created your account on the site with {EMAIL} before running this.

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
  from auth.users where email = '{EMAIL}'
),
data(slug, overall, value, conditions, layout, clubhouse, staff) as (values
{values_block}
)
insert into ratings (course_id, user_id, display_name, overall, value, conditions, layout, clubhouse, staff)
select c.id, me.id, me.dn, d.overall, d.value, d.conditions, d.layout, d.clubhouse, d.staff
from data d
join courses c on c.slug = d.slug
cross join me
on conflict (course_id, user_id) do update set
  overall = excluded.overall, value = excluded.value, conditions = excluded.conditions,
  layout = excluded.layout, clubhouse = excluded.clubhouse, staff = excluded.staff;

-- Expected result: {len(rows)} rows affected. If 0 rows: no account with {EMAIL} exists yet.
"""
open('migration5.sql', 'w').write(sql)
print(f'{len(rows)} ratings -> migration5.sql')

#!/usr/bin/env python3
"""Generate migration + seed SQL for all GolfRSA-affiliated courses.
Source: satop100courses.com A-Z of SA golf courses (414 affiliated clubs)."""
import re, unicodedata

GP, WC, EC, KZN, MP, LP, NW, FS, NC = ('Gauteng', 'Western Cape', 'Eastern Cape',
    'KwaZulu-Natal', 'Mpumalanga', 'Limpopo', 'North West', 'Free State', 'Northern Cape')

# Slugs already in the database (first 53) — skip these
EXISTING = {
    'leopard-creek','fancourt-links','fancourt-montagu','fancourt-outeniqua','st-francis-links',
    'humewood','durban-country-club','zimbali','princes-grant','mount-edgecombe','san-lameer',
    'southbroom','selborne','wild-coast-sun','royal-johannesburg-east','glendower',
    'country-club-johannesburg','houghton','randpark-firethorn','serengeti','steyn-city',
    'blair-atholl','river-club','gary-player-cc','lost-city','pecanwood','millvale','elements',
    'euphoria','legend-signature','zebula','white-river','highland-gate','arabella','pearl-valley',
    'erinvale','de-zalze','steenberg','royal-cape','clovelly','westlake','atlantic-beach',
    'milnerton','pinnacle-point','oubaai','simola','pezula','goose-valley','east-london',
    'port-elizabeth','bloemfontein','sishen','kimberley',
}

# (names, province, holes). Entry: "Name" or ("Name", "Town") or ("Name","Town",slug_override)
DATA = [
    # ---------- 18-HOLE ----------
    ([('Bryanston Country Club','Johannesburg'),('CMR Golf Club','Roodepoort'),
      ('Country Club Johannesburg (Rocklands)','Johannesburg'),('Dainfern Golf Estate','Fourways'),
      ('Eagle Canyon Golf Estate','Roodepoort'),('Emfuleni Golf Estate','Vanderbijlpark'),
      ('Eye of Africa Golf Estate','Eikenhof'),('Glenvista Country Club','Johannesburg'),
      ('Goldfields West Golf Club','Westonaria'),('Huddle Park Golf Club','Johannesburg'),
      ('Jackal Creek Golf Estate','Roodepoort'),('Killarney Country Club','Johannesburg'),
      ('Krugersdorp Golf Club','Krugersdorp'),('Kyalami Country Club','Midrand'),
      ('Meyerton Golf Club','Meyerton'),('Modderfontein Golf Club','Modderfontein'),
      ('Observatory Golf Club','Johannesburg'),('Parkview Golf Club','Johannesburg'),
      ('Randpark (Bushwillow)','Johannesburg'),('Riviera on Vaal Country Club','Vereeniging'),
      ('Royal Johannesburg & Kensington (West)','Johannesburg'),('Ruimsig Country Club','Roodepoort'),
      ('Southdowns Country Club','Centurion'),('Soweto Country Club','Soweto'),
      ('Wanderers Golf Club','Johannesburg')], GP, 18),
    ([('Benoni Country Club','Benoni'),('Ebotse Links','Benoni'),('ERPM Golf Club','Boksburg'),
      ('Germiston Golf Club','Germiston'),('Kempton Park Golf Club','Kempton Park'),
      ('Nigel Golf Club','Nigel'),('Pollak Park Golf Club','Springs'),('Reading Country Club','Alberton'),
      ('Royal Oak Country Club','Alberton'),('Springs Country Club','Springs'),
      ('State Mines Country Club','Brakpan'),('The Lake Club Benoni','Benoni')], GP, 18),
    ([('Akasia Golf Club','Pretoria'),('Blue Valley Golf Estate','Midrand'),
      ('Bronkhorstspruit Golf Club','Bronkhorstspruit'),('Centurion Country Club','Centurion'),
      ('Irene Country Club','Centurion'),('Pebble Rock Golf Village','Pretoria'),
      ('Pretoria Country Club','Pretoria'),('Pretoria Golf Club','Pretoria'),
      ('Services Golf Club','Thaba Tshwane'),('Silver Lakes Golf Estate','Pretoria'),
      ('The Els Club Copperleaf','Centurion'),('Waterkloof Golf Club','Pretoria'),
      ('Wingate Park Country Club','Pretoria'),('Woodhill Golf Estate','Pretoria')], GP, 18),
    ([('Kameeldoring Golf Club','Mookgophong'),('Koro Creek Bushveld Golf Estate','Modimolle'),
      ('Mogol Golf Club','Lephalale'),('Polokwane Golf Club','Polokwane'),
      ('Tzaneen Country Club','Tzaneen')], LP, 18),
    ([('Ermelo Golf Club','Ermelo'),('Graceland Golf Course','Secunda'),
      ('Mbombela Golf Club','Mbombela'),(('Middelburg Golf Club'),'Middelburg','middelburg-mpumalanga'),
      ('Sabi River Sun Golf Course','Hazyview'),('Walker Park Golf Club','Evander'),
      ('Witbank Golf Club','eMalahleni')], MP, 18),
    ([('Klerksdorp Golf Club','Klerksdorp'),('Magalies Park Golf Club','Hartbeespoort'),
      ('Orkney Golf Club','Orkney'),('Potchefstroom Golf Club','Potchefstroom'),
      ('Rustenburg Golf Club','Rustenburg'),('Seasons Eco Golf Estate','Hartbeespoort')], NW, 18),
    ([('Devonvale Golf & Wine Estate','Stellenbosch'),('Hermanus Golf Club','Hermanus'),
      ('Langebaan Country Estate','Langebaan'),('Paarl Golf Club','Paarl'),
      ('Robertson Golf Club','Robertson'),('Stellenbosch Golf Club','Stellenbosch'),
      ('Worcester Golf Club','Worcester')], WC, 18),
    ([('George Golf Club','George'),('Kingswood Golf Estate','George'),('Knysna Golf Club','Knysna'),
      ('Mossel Bay Golf Club','Mossel Bay'),('Oudtshoorn Golf Club','Oudtshoorn'),
      ('Plettenberg Bay Country Club','Plettenberg Bay')], WC, 18),
    ([('Bellville Golf Club','Cape Town'),('Durbanville Golf Club','Cape Town'),
      ('King David Mowbray Golf Club','Cape Town'),('Kuils River Golf Club','Cape Town'),
      ('Parow Golf Club','Cape Town'),('Rondebosch Golf Club','Cape Town'),
      ('Somerset West Golf Club','Somerset West'),('Strand Golf Club','Strand')], WC, 18),
    ([('Amanzimtoti Country Club','Amanzimtoti'),('Bluff National Park Golf Club','Durban'),
      ('Cato Ridge Country Club','Cato Ridge'),('Champagne Sports Resort','Winterton'),
      ('Cotswold Downs Golf Estate','Hillcrest'),('Drakensberg Gardens Golf Resort','Underberg'),
      ('Dundee Golf Club','Dundee'),('Empangeni Golf Club','Empangeni'),('Eshowe Hills Golf Estate','Eshowe'),
      ('Gowrie Farm Golf Club','Nottingham Road'),('Kloof Country Club','Kloof'),
      ('Margate Country Club','Margate'),('Maritzburg Golf Club','Pietermaritzburg'),
      ('Newcastle Golf Club','Newcastle'),('Papwa Sewgolum Golf Course','Durban'),
      ('Port Shepstone Country Club','Port Shepstone'),('Richards Bay Country Club','Richards Bay'),
      ('Royal Durban Golf Club','Durban'),('Scottburgh Golf Club','Scottburgh'),
      ('Simbithi Country Club','Ballito'),('Umdoni Park Golf Club','Pennington'),
      ('Umhlali Country Club','Ballito'),('Umkomaas Golf Club','Umkomaas'),
      ('Victoria Country Club','Pietermaritzburg'),('Vulintaba Country Club','Newcastle'),
      ('Windsor Park Golf Club','Durban')], KZN, 18),
    ([('Bethlehem Golf Club','Bethlehem'),('Clarens Golf Estate','Clarens'),
      ('Ficksburg Golf Club','Ficksburg'),('Harrismith Golf Club','Harrismith'),
      ('Heron Banks Golf Estate','Sasolburg'),('Kroonstad Golf Club','Kroonstad'),
      ('Ladybrand Golf Club','Ladybrand'),('Maccauvlei Golf Club','Vereeniging'),
      ('Oppenheimer Park Golf Club','Welkom'),('Parys Golf & Country Estate','Parys'),
      ('Schoeman Park Golf Club','Bloemfontein'),('Vaal de Grace Golf Estate','Parys')], FS, 18),
    ([('Calvinia Golf Club','Calvinia'),('Carnarvon Golf Club','Carnarvon'),
      ('Magersfontein Memorial Golf Course','Kimberley'),('Upington Golf Club','Upington'),
      ('Victoria West Golf Club','Victoria West')], NC, 18),
    ([('Katberg Eco Golf Estate','Katberg'),('Mthatha Golf Club','Mthatha'),
      ('Olivewood Golf Estate','East London'),('Queenstown Golf Club','Komani'),
      ('West Bank Golf Club','East London'),('Royal Port Alfred Golf Club','Port Alfred'),
      ('St Francis Bay Golf Club','St Francis Bay'),('The Belmont Golf Club','Makhanda'),
      ('Uitenhage Golf Club','Kariega')], EC, 18),
    # ---------- 9-HOLE ----------
    ([('Avion Park Golf Club','Kempton Park'),('Cullinan Golf Club','Cullinan'),
      ('Daveyton Golf Club','Daveyton'),(('Heidelberg Golf Club'),'Heidelberg','heidelberg-gauteng'),
      ('Hillside Golf Club','Randfontein'),('Sandonia Golf Club','Muldersdrift'),
      ('SAPS Training Centre Golf Club','Pretoria'),('Waterpan Golf Club','Carletonville'),
      ('Zwartkop Golf Club (AFB)','Centurion')], GP, 9),
    ([('Amandelbult Golf Club','Thabazimbi'),('Chrome Golf Club','Steelpoort'),
      ('Drakensig Golf Club','Hoedspruit'),('Groblersdal Golf Club','Groblersdal'),
      ('Marble Hall Golf Club','Marble Hall'),('Messina Golf Club','Musina'),
      ('Naboomspruit Golf Club','Mookgophong'),('Sesambos Golf Club','Tzaneen'),
      ('Soutpansberg Golf Club','Makhado'),('Swartklip Golf Club','Northam'),
      ('Thabazimbi Golf Club','Thabazimbi'),('University of Limpopo Golf Club','Mankweng')], LP, 9),
    ([('Amersfoort Golf Club','Amersfoort'),('Arnot Golf Club','Arnot'),('Badplaas Golf Club','Badplaas'),
      ('Bankenveld Golf Club','eMalahleni'),('Barberton Golf Club','Barberton'),
      ('Belfast Golf Club','Belfast'),('Bethal Golf Club','Bethal'),('Carolina Golf Club','Carolina'),
      ('Delmas Golf Club','Delmas'),('Greenside Golf Club','Standerton'),('Kambaku Golf Club','Komatipoort'),
      ('Kranspoort Golf Club','Machadodorp'),('Kriel Golf Club','Kriel'),('Kruger Lodge Golf Club','Malelane'),
      ('Lydenburg Golf Club','Lydenburg'),('Malelane Golf Club','Malelane'),('Morgenzon Golf Club','Morgenzon'),
      ('Piet Retief Golf Club','Piet Retief'),('Pilgrims Rest Golf Club','Pilgrims Rest'),
      ('Sabie Country Club','Sabie'),('Skukuza Golf Club','Skukuza'),('Standerton Golf Club','Standerton'),
      ('Volksrust Golf Club','Volksrust')], MP, 9),
    ([('Bloemhof Golf Club','Bloemhof'),('Christiana Golf Club','Christiana'),
      ('Delareyville Golf Club','Delareyville'),('Koster Golf Club','Koster'),
      ('Landboukollege Golf Club','Potchefstroom'),('Lichtenburg Golf Club','Lichtenburg'),
      ('Mooinooi Golf Club','Mooinooi'),('Ottosdal Golf Club','Ottosdal'),('Reivilo Golf Club','Reivilo'),
      ('Sandy Lane Golf Club','Brits'),('Sannieshof Golf Club','Sannieshof'),
      ('Schweizer-Reneke Golf Club','Schweizer-Reneke'),('Ventersdorp Golf Club','Ventersdorp'),
      ('Vryburg Golf Club','Vryburg'),('Wolmaransstad Golf Club','Wolmaransstad'),
      ('Zeerust Golf Club','Zeerust')], NW, 9),
    ([('Balkfontein Golf Club','Bothaville'),('Bethulie Golf Club','Bethulie'),
      ('Bothaville Golf Club','Bothaville'),('Brandfort Golf Club','Brandfort'),
      ('Bultfontein Golf Club','Bultfontein'),('Clocolan Golf Club','Clocolan'),
      ('Dewetsdorp Golf Club','Dewetsdorp'),('Edenburg Golf Club','Edenburg'),
      ('Frankfort Golf Club','Frankfort'),('Heilbron Golf Club','Heilbron'),
      ('Hoopstad Golf Club','Hoopstad'),('Jacobsdal Golf Club','Jacobsdal'),
      ('Jagersfontein Golf Club','Jagersfontein'),('Kestell Golf Club','Kestell'),
      ('Koffiefontein Golf Club','Koffiefontein'),('Marquard Golf Club','Marquard'),
      ('Maseru Golf Club','Maseru (Lesotho)'),('Petrus Steyn Golf Club','Petrus Steyn'),
      ('Reitz Golf Club','Reitz'),('Sand River Golf Club','Virginia'),('Senekal Golf Club','Senekal'),
      ('Smithfield Golf Club','Smithfield'),('Tempe Golf Club','Bloemfontein'),
      ('Theunissen Golf Club','Theunissen'),('Viljoenskroon Golf Club','Viljoenskroon'),
      ('Vrede Golf Club','Vrede'),('Wesselsbron Golf Club','Wesselsbron'),
      ('Westminster Golf Club','Westminster'),('Zastron Golf Club','Zastron')], FS, 9),
    ([('Alexander Bay Golf Club','Alexander Bay'),('Arendskraal Golf Club','Kathu'),
      ('Black Mountain Golf Club','Aggeneys'),('Colesberg Golf Club','Colesberg'),
      ('De Aar Golf Club','De Aar'),('Douglas Golf Club','Douglas'),('Hartswater Golf Club','Hartswater'),
      ('Hopetown Golf Club','Hopetown'),('Hotazel Golf Club','Hotazel'),
      ('Jan Kemp Golf Club','Jan Kempdorp'),('Kakamas Golf Club','Kakamas'),
      ('Kleinzee Golf Club','Kleinzee'),('Kuruman Golf Club','Kuruman'),
      ('Lime Acres Golf Club','Lime Acres'),('Loeriesfontein Golf Club','Loeriesfontein'),
      ('Prieska Golf Club','Prieska'),(('Richmond Golf Club'),'Richmond','richmond-northern-cape'),
      ('Springbok Golf Club','Springbok'),('Ulco Golf Club','Ulco'),('Williston Golf Club','Williston')], NC, 9),
    ([('Berg River Golf Club','Paarl'),('Bonnievale Golf Club','Bonnievale'),
      ('Boschenmeer Golf Estate','Paarl'),('Bredasdorp Golf Club','Bredasdorp'),
      ('Caledon Golf Club','Caledon'),('Ceres Golf Club','Ceres'),('Citrusdal Golf Club','Citrusdal'),
      ('Clanwilliam Golf Club','Clanwilliam'),('Darling Golf Club','Darling'),
      ('De Hoek Golf Club','Tulbagh'),('Gansbaai Golf Club','Gansbaai'),
      ('Hex Valley Golf Club','De Doorns'),('Kleinmond Golf Club','Kleinmond'),
      ('Lamberts Bay Golf Club','Lamberts Bay'),('Lutzville Golf Club','Lutzville'),
      ('Malmesbury Golf Club','Malmesbury'),('Montagu Golf Club','Montagu'),
      ('Moorreesburg Golf Club','Moorreesburg'),('Porterville Golf Club','Porterville'),
      ('Riverside Golf Club','Robertson'),('Riviersonderend Golf Club','Riviersonderend'),
      ('Shelley Point Country Club','St Helena Bay'),('Swellendam Golf Club','Swellendam'),
      ('Theewaterskloof Golf Club','Villiersdorp'),('Vredenburg Golf Club','Vredenburg'),
      ('Vredendal Golf Club','Vredendal'),('Wellington Golf Club','Wellington'),
      ('Xamarin Golf Club','Tulbagh')], WC, 9),
    ([('Albertinia Golf Club','Albertinia'),('Beaufort West Golf Club','Beaufort West'),
      ('Boggomsbaai Golf Club','Boggomsbaai'),('Dolphin Creek Golf Club','Groot Brakrivier'),
      ('Glenwood Golf Club','George'),(('Heidelberg Golf Club'),'Heidelberg','heidelberg-western-cape'),
      ('Ladismith Golf Club','Ladismith'),('Riversdale Golf Club','Riversdale'),
      ('Stilbaai Golf Club','Stilbaai'),('Uniondale Golf Club','Uniondale'),
      ('Willowmore Golf Club','Willowmore')], WC, 9),
    ([('Fairview Golf Club','Cape Town'),('Helderberg Village Golf Club','Somerset West'),
      ('Metropolitan Golf Club','Cape Town'),('Simonstown Country Club','Simon''s Town')], WC, 9),
    ([('Amatikulu Golf Club','Amatikulu'),('Amphitheatre Golf Club','Bergville'),
      ('Beachwood Golf Club','Durban'),('Bosch Hoek Golf Club','Balgowan'),
      ('Camelot Golf Estate','Mooi River'),('Cathedral Peak Golf Club','Winterton'),
      ('Darnall Country Club','Darnall'),('Estcourt Golf Club','Estcourt'),
      ('Glencoe Correctional Golf Club','Glencoe'),('Greytown Country Club','Greytown'),
      ('Harding Country Club','Harding'),('Howick Golf Club','Howick'),
      ('Kilbarchan Golf Club','Newcastle'),('Kwambonambi Golf Club','KwaMbonambi'),
      ('Ladysmith Golf Club','Ladysmith'),('Maidstone Golf Club','Tongaat'),
      ('Mandini Golf Club','Mandeni'),('Melmoth Golf Club','Melmoth'),
      ('Monks Cowl Golf Club','Winterton'),('Monzi Golf Club','St Lucia'),
      (('Mooi River Golf Club'),'Mooi River','mooi-river-kzn'),('Mtunzini Country Club','Mtunzini'),
      ('Noodsberg Country Club','Dalton'),('Paulpietersburg Golf Club','Paulpietersburg'),
      ('Pongola Golf Club','Pongola'),('Port Edward Country Club','Port Edward'),
      (('Richmond Country Club'),'Richmond','richmond-kzn'),('Sakabula Golf Club','Howick'),
      ('St Cathryns Country Estate','Hilton'),('Umfolozi Golf Club','Mtubatuba'),
      ('Underberg Country Club','Underberg'),('Utrecht Golf Club','Utrecht'),
      ('Vryheid Golf Club','Vryheid')], KZN, 9),
    ([('Adelaide Golf Club','Adelaide'),('Aliwal North Golf Club','Aliwal North'),
      ('Barkly East Golf Club','Barkly East'),('Bedford Golf Club','Bedford'),
      ('Burgersdorp Golf Club','Burgersdorp'),('Cathcart Golf Club','Cathcart'),
      ('Cradock Golf Club','Cradock'),('Dordrecht Golf Club','Dordrecht'),
      ('Elliot Golf Club','Elliot'),('Fort Beaufort Golf Club','Fort Beaufort'),
      ('Gonubie Golf Club','Gonubie'),('Kei Mouth Golf Club','Kei Mouth'),
      ('Komga Golf Club','Komga'),('Lady Grey Golf Club','Lady Grey'),
      ('Maclear Golf Club','Maclear'),('Matatiele Golf Club','Matatiele'),
      (('Middelburg Golf Club'),'Middelburg','middelburg-eastern-cape'),('Molteno Golf Club','Molteno'),
      ('Port St Johns Golf Club','Port St Johns'),('Stutterheim Golf Club','Stutterheim')], EC, 9),
    ([('Alexandria Golf Club','Alexandria'),('Fynbos Golf Club','Eersterivier'),
      ('Graaff-Reinet Golf Club','Graaff-Reinet'),('Hankey Golf Club','Hankey'),
      ('Jeffreys Bay Golf Club','Jeffreys Bay'),('Kirkwood Golf Club','Kirkwood'),
      ('Kragga Kamma Golf Club','Gqeberha'),('Langkloof Golf Club','Kareedouw'),
      ('Sardinia Bay Golf Club','Gqeberha'),('Somerset East Golf Club','Somerset East'),
      ('Walmer Country Club','Gqeberha'),('Walmer Golf Club','Gqeberha'),
      ('Zwartenbosch Golf Club','Loerie')], EC, 9),
]

RESORTS = {'sabi-river-sun-golf-course','champagne-sports-resort','drakensberg-gardens-golf-resort',
           'magalies-park-golf-club','seasons-eco-golf-estate','katberg-eco-golf-estate'}
HOLES_OVERRIDE = {'ladysmith-golf-club': 13}

def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii','ignore').decode()
    s = re.sub(r'[^a-z0-9]+','-', s.lower()).strip('-')
    return s

def esc(s): return s.replace("'","''")

rows, seen = [], set(EXISTING)
for group, prov, holes in DATA:
    for entry in group:
        if isinstance(entry, tuple) and len(entry) == 3:
            name, town, slug = entry
        else:
            name, town = entry
            slug = slugify(name.replace(' Golf Club','').replace(' Country Club','')
                           .replace(' Golf Estate','').replace(' Golf Course',''))
        if slug in seen:
            slug = slugify(name)
            if slug in seen:
                raise SystemExit(f'DUPLICATE SLUG: {slug} ({name})')
        seen.add(slug)
        h = HOLES_OVERRIDE.get(slugify(name), holes)
        access = 'Resort' if slug in RESORTS else 'Members & visitors'
        rows.append(f"('{esc(slug)}','{esc(name)}','{esc(town)}','{prov}','{access}',{h})")

values_block = ',\n'.join(rows)
sql = f"""-- FairwayRank ZA — migration 2: full GolfRSA course list ({len(rows)} new courses)
-- Run once in Supabase SQL Editor.

drop view if exists course_rankings;

alter table courses add column if not exists holes int not null default 18;

create view course_rankings with (security_invoker = on) as
select
  c.*,
  count(r.id)::int as n_ratings,
  coalesce(avg(r.overall), 0) as avg_overall
from courses c
left join ratings r on r.course_id = c.id
group by c.id;

insert into courses (slug, name, town, province, access, holes) values
{values_block}
on conflict (slug) do nothing;
"""
path = 'seed2.sql'
open(path,'w').write(sql)
print(f'{len(rows)} new courses -> {path}')

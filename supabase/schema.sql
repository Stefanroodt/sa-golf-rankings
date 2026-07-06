-- Fairway Rank ZA — run this once in Supabase: SQL Editor -> New query -> paste -> Run

-- COURSES
create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  town text not null,
  province text not null,
  access text not null default 'Public',
  designer text,
  description text
);

-- RATINGS (one per user per course)
create table ratings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  overall int not null check (overall between 1 and 5),
  value int not null check (value between 1 and 5),
  conditions int not null check (conditions between 1 and 5),
  layout int not null check (layout between 1 and 5),
  pace int not null check (pace between 1 and 5),
  staff int not null check (staff between 1 and 5),
  comment text check (char_length(comment) <= 600),
  created_at timestamptz not null default now(),
  unique (course_id, user_id)
);

-- RANKING VIEW
create view course_rankings with (security_invoker = on) as
select
  c.*,
  count(r.id)::int as n_ratings,
  coalesce(avg(r.overall), 0) as avg_overall
from courses c
left join ratings r on r.course_id = c.id
group by c.id;

-- ROW LEVEL SECURITY
alter table courses enable row level security;
alter table ratings enable row level security;

create policy "courses are public" on courses for select using (true);
create policy "ratings are public" on ratings for select using (true);
create policy "users insert own rating" on ratings for insert
  with check (auth.uid() = user_id);
create policy "users update own rating" on ratings for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own rating" on ratings for delete
  using (auth.uid() = user_id);

-- SEED COURSES
insert into courses (slug, name, town, province, access, designer, description) values
('leopard-creek', 'Leopard Creek Country Club', 'Malelane', 'Mpumalanga', 'Private', 'Gary Player', 'Set on the border of the Kruger National Park, with crocodiles and elephants alongside the fairways. Host of the Alfred Dunhill Championship and widely regarded as one of the world''s most spectacular settings.'),
('fancourt-links', 'Fancourt (The Links)', 'George', 'Western Cape', 'Resort', 'Gary Player', 'A manufactured links masterpiece sculpted from a former airfield, inspired by the great courses of the British Isles. Hosted the 2003 Presidents Cup.'),
('fancourt-montagu', 'Fancourt (Montagu)', 'George', 'Western Cape', 'Resort', 'Gary Player', 'Fancourt''s stately parkland course, immaculately conditioned with mountain views over the Outeniqua range.'),
('fancourt-outeniqua', 'Fancourt (Outeniqua)', 'George', 'Western Cape', 'Resort', 'Gary Player', 'The friendliest of Fancourt''s three courses, a beautifully kept parkland layout playable for all levels.'),
('st-francis-links', 'St Francis Links', 'St Francis Bay', 'Eastern Cape', 'Public', 'Jack Nicklaus', 'Nicklaus links design threaded through massive dunes near Cape St Francis, with wind an ever-present factor.'),
('humewood', 'Humewood Golf Club', 'Gqeberha', 'Eastern Cape', 'Members & visitors', 'S.V. Hotchkin', 'South Africa''s only true traditional links, opened in 1931 and a regular SA Open host. Brutal in the wind, brilliant always.'),
('durban-country-club', 'Durban Country Club', 'Durban', 'KwaZulu-Natal', 'Members & visitors', 'Waters & Waterman', 'Rolling dune land beside the Indian Ocean; has hosted more South African Opens than any other course.'),
('zimbali', 'Zimbali Country Club', 'Ballito', 'KwaZulu-Natal', 'Resort', 'Tom Weiskopf', 'Carved through coastal forest on the Dolphin Coast, with dramatic elevation changes and ocean glimpses.'),
('princes-grant', 'Prince''s Grant Golf Estate', 'KwaDukuza', 'KwaZulu-Natal', 'Public', 'Peter Matkovich', 'Charming coastal course on the KZN North Coast, tight and strategic with sea breezes throughout.'),
('mount-edgecombe', 'Mount Edgecombe Country Club', 'Durban', 'KwaZulu-Natal', 'Members & visitors', null, 'Two parkland courses through indigenous bush and sugar cane country, minutes from Umhlanga.'),
('san-lameer', 'San Lameer Country Club', 'Southbroom', 'KwaZulu-Natal', 'Resort', 'Peter Matkovich', 'Lush subtropical resort course on the South Coast, framed by lagoons and dense coastal forest.'),
('southbroom', 'Southbroom Golf Club', 'Southbroom', 'KwaZulu-Natal', 'Members & visitors', null, 'A South Coast gem with fairways running to the sea and views over the Indian Ocean.'),
('selborne', 'Selborne Golf Estate', 'Pennington', 'KwaZulu-Natal', 'Resort', null, 'Tree-lined coastal parkland on the KZN South Coast, tight driving lines and superb greens.'),
('wild-coast-sun', 'Wild Coast Sun Country Club', 'Port Edward', 'Eastern Cape', 'Resort', 'Robert Trent Jones Jr', 'Rollercoaster resort course over ravines and gorges above the Indian Ocean; short but unforgettable.'),
('royal-johannesburg-east', 'Royal Johannesburg & Kensington (East)', 'Johannesburg', 'Gauteng', 'Members & visitors', 'Robert Grimsdell', 'Big, classic highveld parkland and multiple SA Open host, with towering trees and kikuyu fairways.'),
('glendower', 'Glendower Golf Club', 'Edenvale', 'Gauteng', 'Members & visitors', 'Charles Alison', 'A parkland classic and bird sanctuary, regular SA Open venue with fast greens and strategic bunkering.'),
('country-club-johannesburg', 'Country Club Johannesburg (Woodmead)', 'Johannesburg', 'Gauteng', 'Private', null, 'Stately private club with two courses; Woodmead is a long, tree-lined championship test.'),
('houghton', 'Houghton Golf Club', 'Johannesburg', 'Gauteng', 'Members & visitors', 'Jack Nicklaus (redesign)', 'Fully redesigned by Nicklaus, a modern championship layout in the heart of Johannesburg.'),
('randpark-firethorn', 'Randpark (Firethorn)', 'Johannesburg', 'Gauteng', 'Members & visitors', null, 'Host of the Joburg Open; generous parkland with a strong closing stretch.'),
('serengeti', 'Serengeti Estates (Masai Mara)', 'Kempton Park', 'Gauteng', 'Members & visitors', 'Jack Nicklaus', 'Links-style championship course on the East Rand, host of past Joburg Opens, with wild grasses and huge greens.'),
('steyn-city', 'The Club at Steyn City', 'Midrand', 'Gauteng', 'Members & visitors', 'Jack Nicklaus', 'Immaculate modern estate course with dramatic bushveld ravines and no parallel fairways.'),
('blair-atholl', 'Blair Atholl Golf Estate', 'Midrand', 'Gauteng', 'Private', 'Gary Player', 'Gary Player''s expansive signature estate design along the Crocodile River, with enormous greens.'),
('river-club', 'The River Club', 'Johannesburg', 'Gauteng', 'Private', 'Gary Player (redesign)', 'Exclusive Sandton club reworked by Gary Player into one of Gauteng''s finest modern parklands.'),
('gary-player-cc', 'Gary Player Country Club', 'Sun City', 'North West', 'Resort', 'Gary Player', 'Home of the Nedbank Golf Challenge — ''Africa''s Major''. A monster championship test of kikuyu and speed.'),
('lost-city', 'Lost City Golf Course', 'Sun City', 'North West', 'Resort', 'Gary Player', 'Desert-style resort course at Sun City, famous for the crocodile pit guarding the 13th green.'),
('pecanwood', 'Pecanwood Golf & Country Club', 'Hartbeespoort', 'North West', 'Members & visitors', 'Jack Nicklaus', 'Nicklaus signature course on the shores of Hartbeespoort Dam beneath the Magaliesberg.'),
('millvale', 'Millvale Golf & Wildlife Estate', 'Ventersdorp', 'North West', 'Private', null, 'A modern minimalist bushveld course that has shot up the SA rankings since opening.'),
('elements', 'Elements Private Golf Reserve', 'Bela-Bela', 'Limpopo', 'Public', 'Peter Matkovich', 'Raw bushveld golf on a Big Five reserve in the Waterberg — no fences between you and the wildlife.'),
('euphoria', 'Euphoria Golf Estate', 'Mookgophong', 'Limpopo', 'Public', 'Annika Sörenstam', 'Annika Sörenstam''s only African design, perched on a Waterberg plateau with 40km views.'),
('legend-signature', 'Legend Golf & Safari Resort (Signature)', 'Mookgophong', 'Limpopo', 'Resort', '18 tour professionals', 'Each hole designed by a different tour pro, plus the famous Extreme 19th par-3 played from a mountaintop by helicopter.'),
('zebula', 'Zebula Golf Estate & Spa', 'Bela-Bela', 'Limpopo', 'Resort', null, 'Popular bushveld resort course in the Waterberg with wildlife roaming the estate.'),
('white-river', 'White River Country Club', 'White River', 'Mpumalanga', 'Members & visitors', null, 'Lowveld parkland charm near the Kruger gates, tight fairways under old trees.'),
('highland-gate', 'Highland Gate Golf & Trout Estate', 'Dullstroom', 'Mpumalanga', 'Public', 'Ernie Els', 'Ernie Els design in the Steenkampsberg mountains — the highest-altitude championship course in SA.'),
('arabella', 'Arabella Country Estate', 'Kleinmond', 'Western Cape', 'Resort', 'Peter Matkovich', 'Sweeping parkland along the Bot River lagoon with the Kogelberg mountains behind; a famous closing stretch.'),
('pearl-valley', 'Pearl Valley (Val de Vie)', 'Paarl', 'Western Cape', 'Public', 'Jack Nicklaus', 'Nicklaus signature course in the Cape Winelands, consistently rated among SA''s best-conditioned courses.'),
('erinvale', 'Erinvale Golf Club', 'Somerset West', 'Western Cape', 'Members & visitors', 'Gary Player', 'Host of the 1996 World Cup of Golf; front nine on the flats, back nine climbing the Helderberg with False Bay views.'),
('de-zalze', 'De Zalze Golf Club', 'Stellenbosch', 'Western Cape', 'Public', 'Peter Matkovich', 'Winelands golf between vineyards and olive groves on the Kleine Zalze estate.'),
('steenberg', 'Steenberg Golf Club', 'Cape Town', 'Western Cape', 'Members & visitors', 'Peter Matkovich', 'Constantia Valley beauty beneath the Steenberg mountains, with the famous all-carry par-3 14th over water.'),
('royal-cape', 'Royal Cape Golf Club', 'Cape Town', 'Western Cape', 'Members & visitors', null, 'South Africa''s oldest club (1885) and multiple SA Open host; flat, classic, and deceptively hard in the Cape Doctor.'),
('clovelly', 'Clovelly Country Club', 'Cape Town', 'Western Cape', 'Members & visitors', null, 'Links-like valley course beside Fish Hoek beach, shaped by coastal dunes and wind.'),
('westlake', 'Westlake Golf Club', 'Cape Town', 'Western Cape', 'Members & visitors', null, 'Friendly parkland under the Silvermine mountains near Muizenberg, a Cape favourite for value.'),
('atlantic-beach', 'Atlantic Beach Golf Estate', 'Melkbosstrand', 'Western Cape', 'Public', 'Gary Player', 'Windswept links-style course on the West Coast with postcard views of Table Mountain across the bay.'),
('milnerton', 'Milnerton Golf Club', 'Cape Town', 'Western Cape', 'Members & visitors', null, 'The closest thing to links golf in Cape Town, squeezed between lagoon and ocean with Table Mountain as backdrop.'),
('pinnacle-point', 'Pinnacle Point Golf Estate', 'Mossel Bay', 'Western Cape', 'Public', 'Peter Matkovich & Darren Clarke', 'Clifftop spectacle above the Indian Ocean — several holes play across sea gorges. Arguably SA''s most dramatic course.'),
('oubaai', 'Oubaai Golf Club', 'Herolds Bay', 'Western Cape', 'Resort', 'Ernie Els', 'Ernie Els'' first signature design in SA, links-style on cliffs above Herolds Bay on the Garden Route.'),
('simola', 'Simola Golf & Country Estate', 'Knysna', 'Western Cape', 'Resort', 'Jack Nicklaus', 'Nicklaus signature layout on a ridge above the Knysna River valley with staggering views.'),
('pezula', 'Pezula Golf Course', 'Knysna', 'Western Cape', 'Resort', 'Ronald Fream', 'Clifftop course on the Knysna Heads, cut through fynbos with Indian Ocean panoramas.'),
('goose-valley', 'Goose Valley Golf Estate', 'Plettenberg Bay', 'Western Cape', 'Public', 'Gary Player', 'Gary Player links-style design beside the Keurbooms lagoon in Plettenberg Bay.'),
('east-london', 'East London Golf Club', 'East London', 'Eastern Cape', 'Members & visitors', null, 'Coastal-bush classic ranked among SA''s best traditional courses, with dune-top ocean views.'),
('port-elizabeth', 'Port Elizabeth Golf Club', 'Gqeberha', 'Eastern Cape', 'Members & visitors', null, 'Founded 1890, a charming old parkland across the road from Humewood territory.'),
('bloemfontein', 'Bloemfontein Golf Club', 'Bloemfontein', 'Free State', 'Members & visitors', null, 'The Free State''s premier parkland, a long-standing championship venue in the City of Roses.'),
('sishen', 'Sishen Golf Club', 'Kathu', 'Northern Cape', 'Members & visitors', null, 'A green oasis in the Kalahari — remarkable parkland conditioning in mining country, the Northern Cape''s best.'),
('kimberley', 'Kimberley Golf Club', 'Kimberley', 'Northern Cape', 'Members & visitors', null, 'Historic club in the diamond city, one of the oldest golfing sites in the country.');

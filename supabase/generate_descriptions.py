#!/usr/bin/env python3
"""Generate migration12.sql: real descriptions for notable courses,
warmer generic copy for small clubs where no reliable info exists."""

D = {
 # --- Gauteng (Central) ---
 'bryanston': "Established parkland in Sandton's leafy suburbs — tight, tree-lined and a long-standing fixture of northern Joburg golf.",
 'cmr': "Classic West Rand parkland, one of Johannesburg's older clubs, known for friendly golf and honest value.",
 'country-club-johannesburg-rocklands': "The second course on Country Club Johannesburg's Woodmead estate — shorter and sportier than its championship sibling.",
 'dainfern': "Gary Player-designed estate parkland along the Jukskei in Fourways, sharing a boundary with Steyn City.",
 'eagle-canyon': "Modern estate course wrapped around a quarry canyon on the West Rand, with dramatic elevation changes and water in play.",
 'emfuleni': "Vaal Triangle parkland in Vanderbijlpark with mature trees and a strong competitive tradition.",
 'eye-of-africa': "Greg Norman signature estate south of Johannesburg — one of very few Norman designs in Africa, long and links-flavoured.",
 'glenvista': "Rolling parkland in the Klipriviersberg foothills of southern Joburg, with more elevation change than most highveld courses.",
 'goldfields-west': "West Wits mining-belt parkland in Westonaria, a stalwart of far West Rand golf.",
 'huddle-park': "Revived public parkland in Linksfield sharing a fence with Royal Johannesburg — Joburg's favourite pay-and-play.",
 'jackal-creek': "Estate course in North Riding with wetlands and water shaping the closing stretch.",
 'killarney': "Historic parkland in the heart of Johannesburg's northern suburbs — tight, treed and wonderfully walkable.",
 'krugersdorp': "West Rand parkland with big trees and quick kikuyu, serving Mogale City golfers for generations.",
 'kyalami': "Midrand parkland neighbouring the famous grand prix circuit, well conditioned year-round.",
 'modderfontein': "Parkland threaded through the old dynamite-factory estate's plantations east of Johannesburg.",
 'observatory': "One of Johannesburg's oldest layouts — a compact ridge-top parkland with city views.",
 'parkview': "Beloved Joburg parkland beneath the Westcliff ridge, famous for towering trees and its walkability.",
 'randpark-bushwillow': "Randpark's second championship course, co-host of the Joburg Open alongside Firethorn.",
 'riviera-on-vaal': "Riverside parkland on the banks of the Vaal at Vereeniging — a golf-weekend favourite for decades.",
 'royal-johannesburg-kensington-west': "The classic older sibling of the East course at Royal Johannesburg & Kensington — shorter and full of charm.",
 'ruimsig': "Spacious West Rand parkland at Roodepoort with ridge-line backdrops.",
 'southdowns': "Estate parkland beside Irene's pastures in Centurion, with a genteel country feel.",
 'soweto': "The home of golf in Soweto — a proud, community-driven club that has produced generations of township golfers.",
 'wanderers': "City parkland within the famous Wanderers sporting precinct in Illovo.",
 # --- Gauteng (Ekurhuleni) ---
 'benoni': "East Rand parkland with a strong championship pedigree and lakes-district setting.",
 'ebotse-links': "Links-style estate at Benoni with water everywhere — among Gauteng's best-conditioned modern courses.",
 'erpm': "The old East Rand Proprietary Mines club in Boksburg — big trees, mining history and honest parkland golf.",
 'kempton-park': "Established parkland near OR Tambo, a popular society-golf venue on the East Rand.",
 'nigel': "Far East Rand country parkland with quiet fairways and a welcoming clubhouse.",
 'pollak-park': "Springs parkland set among old bluegums, a stalwart of East Rand golf.",
 'reading': "Alberton parkland with plenty of water in play.",
 'springs': "Big classical tree-lined parkland, one of the East Rand's traditional championship tests.",
 'state-mines': "Brakpan's mining-heritage parkland — generous fairways under mature gums.",
 'the-lake-club-benoni': "Golf beside Benoni's famous lakes — relaxed parkland with water views.",
 # --- Gauteng (North) ---
 'akasia': "Pretoria North parkland with bushveld touches, a stalwart of Gauteng North golf.",
 'blue-valley': "Gary Player signature estate in Midrand with sweeping water features and immaculate conditioning.",
 'centurion': "Parkland along the Hennops River in the heart of Centurion, water threading the back nine.",
 'irene': "Historic parkland on the old Smuts-country estate at Irene — oaks, pastures and charm.",
 'pebble-rock': "Bushveld golf village northeast of Pretoria, rocky outcrops framing the holes.",
 'pretoria': "The capital's grande dame at Waterkloof — championship parkland with a storied amateur history.",
 'pretoria-golf-club': "One of Pretoria's oldest clubs, a classic city parkland west of the CBD.",
 'services': "The old military club at Thaba Tshwane — no-frills parkland with deep golfing tradition.",
 'silver-lakes': "Estate parkland along the Pienaars River in Pretoria East, water on half the holes.",
 'the-els-club-copperleaf': "Ernie Els signature design at Centurion — one of the longest tests in the country from the tips, yet playable from sensible tees.",
 'waterkloof': "Ridge-top parkland above Pretoria's southern suburbs with views across the capital.",
 'wingate-park': "Championship parkland in Pretoria East, a regular host of top amateur events.",
 'woodhill': "Residential estate championship course in Pretoria East — manicured and water-lined.",
 # --- Limpopo ---
 'kameeldoring': "True bushveld golf at Mookgophong, thorn trees framing every hole.",
 'koro-creek': "Bushveld estate at Modimolle beneath the Waterberg, with giraffe and zebra beyond the fairway lines.",
 'mogol': "Lephalale's bushveld course — a green oasis in coal country.",
 'polokwane': "Limpopo's capital-city championship parkland and provincial tournament host.",
 'tzaneen': "Subtropical parkland in the Letaba valley — lush, hilly and green year-round.",
 # --- Mpumalanga ---
 'ermelo': "Highveld town parkland with big skies and honest golf.",
 'graceland': "Casino-resort course at Secunda, styled with water and links touches.",
 'mbombela': "The Lowveld capital's parkland — tropical trees and quick greens on the Kruger corridor.",
 'middelburg-mpumalanga': "Coalfields parkland with mature trees and a strong club culture.",
 'sabi-river-sun': "Resort parkland on the Sabie River at Hazyview — hippos and crocodiles occasionally in the gallery.",
 'walker-park': "Sasol-country parkland at Evander, a friendly highveld club.",
 'witbank': "eMalahleni's championship parkland, long a force in Mpumalanga amateur golf.",
 # --- North West ---
 'klerksdorp': "Goldfields parkland, one of the North West's traditional championship venues.",
 'magalies-park': "Resort course curling along the Magalies River below the mountains at Hartbeespoort.",
 'orkney': "Mining-town parkland with a proud Vaal River district history.",
 'potchefstroom': "University-town parkland with mature oaks and a strong student golf tradition.",
 'rustenburg': "Parkland at the foot of the Magaliesberg on the bushveld's edge.",
 'seasons-eco': "Eco-estate resort course in the Hartbeespoort hills.",
 # --- Western Cape (Boland) ---
 'devonvale': "Winelands golf-and-wine estate outside Stellenbosch — vines beside the fairways and a cellar at the clubhouse.",
 'langebaan-country-estate': "West Coast links-style estate above the Langebaan lagoon — firm, windy and fun.",
 'robertson': "Breede Valley country course among vineyards, a wine-route favourite.",
 'stellenbosch': "Historic oak-lined parkland in the university town — among the Cape's prettiest inland courses.",
 'worcester': "Breede Valley parkland ringed by mountains, a Boland stalwart.",
 # --- Western Cape (Southern Cape) ---
 'george': "The Garden Route's beloved traditional parkland — towering trees, true greens and famous value.",
 'kingswood': "Modern championship estate on George's outskirts with Outeniqua mountain views.",
 'knysna': "Lagoon-side parkland below the Knysna Heads — short, tight and full of charm.",
 'mossel-bay': "Clifftop course above the Indian Ocean, sea views from nearly every hole and whales in season.",
 'oudtshoorn': "Klein Karoo parkland in ostrich country — an oasis of green beneath big mountains.",
 'plettenberg-bay': "Country club above the Keurbooms lagoon with Tsitsikamma views.",
 # --- Western Cape (Western Province) ---
 'bellville': "Northern-suburbs parkland, a Cape Town stalwart with quick greens.",
 'durbanville': "Rolling parkland among the Durbanville wine hills — wind, views and value.",
 'king-david-mowbray': "Classic Cape parkland and historic SA Open venue, with Table Mountain on the horizon.",
 'kuils-river': "Friendly northern-suburbs parkland along the Kuils River.",
 'parow': "Compact parkland beneath the Tygerberg — honest value golf.",
 'rondebosch': "Southern-suburbs parkland along the Black River, Devil's Peak looming over every hole.",
 'somerset-west': "Helderberg-basin parkland of oaks and mountain views on the winelands' edge.",
 'strand': "Seaside-town parkland at the foot of the Hottentots Holland mountains.",
 # --- KwaZulu-Natal ---
 'amanzimtoti': "Coastal parkland south of Durban with subtropical bush and sea breezes.",
 'bluff-national-park': "Durban's Bluff course amid coastal forest — monkeys included.",
 'cato-ridge': "Country course on the Midlands edge between Durban and Pietermaritzburg.",
 'champagne-sports-resort': "Resort golf beneath the Drakensberg amphitheatre — arguably SA's most scenic mountain backdrop.",
 'cotswold-downs': "Rolling estate parkland at Hillcrest, among KZN's best-conditioned modern courses.",
 'drakensberg-gardens': "Mountain resort course in the southern Berg — crisp air and trout-stream country.",
 'dundee': "Battlefields-country parkland in northern KZN.",
 'empangeni': "Zululand parkland wrapped in lush coastal vegetation.",
 'eshowe-hills': "Golf on the edge of the indigenous Dlinza forest at Eshowe.",
 'gowrie-farm': "A Midlands gem at Nottingham Road — bentgrass greens and trout-country views.",
 'kloof': "Gorge-side parkland in the Upper Highway — forested, cool and green.",
 'margate': "South Coast holiday golf — compact, fun and breezy.",
 'maritzburg': "Founded in 1886 and the site of some of South Africa's earliest golf.",
 'newcastle': "Northern KZN parkland below the Drakensberg foothills.",
 'papwa-sewgolum': "Durban course named for the legendary Papwa Sewgolum — golf history in every sense.",
 'port-shepstone': "South Coast course with one of the country's largest club memberships, and ocean views to match.",
 'richards-bay': "Coastal parkland near the harbour — short on the card, tricky in the wind.",
 'royal-durban': "Utterly unique: a parkland laid out inside the Greyville racecourse oval in central Durban.",
 'scottburgh': "South Coast favourite and the country's shortest full 18 — endless fun in the sea air.",
 'simbithi': "Executive-style course at Ballito with thirteen par 3s — the country's cleverest short course.",
 'umdoni-park': "Forest-and-sea parkland at Pennington, whales sometimes on view from the 19th.",
 'umhlali': "North Coast country club among sugar cane and coastal bush.",
 'umkomaas': "Clifftop village course on the South Coast, railway line and salt air part of the furniture.",
 'victoria': "Pietermaritzburg parkland with a proud championship history.",
 'vulintaba': "Estate course beneath the Drakensberg foothills at Newcastle.",
 'windsor-park': "Durban's municipal stalwart, a road's width away from Durban Country Club.",
 # --- Free State ---
 'bethlehem': "Eastern Free State parkland in Golden Gate country.",
 'clarens': "Highland golf village ringed by sandstone cliffs — the Free State's prettiest setting.",
 'ficksburg': "Cherry-country course on the Lesotho border.",
 'harrismith': "One of South Africa's oldest country clubs, founded 1887, beneath the Platberg.",
 'heron-banks': "Vaal River estate at Sasolburg with links leanings.",
 'kroonstad': "Northern Free State parkland stalwart.",
 'ladybrand': "Border-country course beneath sandstone koppies.",
 'maccauvlei': "Grand old Vaal River parkland — generations of championship golf under giant trees.",
 'oppenheimer-park': "Welkom's goldfields parkland, built in the mining boom years.",
 'parys-golf-country-estate': "Estate course on the Vaal at Parys — river frontage and weekend-town charm.",
 'schoeman-park': "Bloemfontein's championship parkland, sharing a boundary with Bloemfontein Golf Club.",
 'vaal-de-grace': "Vaal River estate golf with water on both nines.",
 # --- Northern Cape ---
 'calvinia': "Hantam Karoo course — remote, characterful and proudly maintained.",
 'carnarvon': "Upper Karoo town course — genuine frontier golf.",
 'magersfontein': "Golf on the 1899 Anglo-Boer battlefield outside Kimberley — history in every bunker.",
 'upington': "Orange River oasis among vineyards on the Kalahari's edge.",
 'victoria-west': "Karoo heartland course serving its district for generations.",
 # --- Eastern Cape ---
 'katberg-eco': "Mountain eco-estate in the Winterberg — highland golf with forest and game.",
 'mthatha': "The championship course of the old Transkei interior.",
 'olivewood': "Modern estate design outside East London, laid out among olive groves.",
 'queenstown': "Komani's traditional parkland, a border-country stalwart.",
 'west-bank': "East London classic with links leanings beside the Buffalo River mouth.",
 'royal-port-alfred': "One of only a handful of Royal clubs in South Africa — charming duneland golf at the Kowie.",
 'st-francis-bay': "The village course among the canals — short, breezy and beloved.",
 'the-belmont': "Makhanda's course in the Belmont Valley along the Bloukrans.",
 'uitenhage': "Kariega parkland, one of the Eastern Cape's oldest clubs.",
}

def esc(s): return s.replace("'", "''")

out = ["-- Pin High — migration 12: real course descriptions (~%d courses)" % len(D),
       "-- Run once in Supabase SQL Editor.", ""]
for slug, desc in D.items():
    out.append(f"update courses set description = '{esc(desc)}' where slug = '{slug}';")

out.append("")
out.append("-- Remaining auto-template courses get a warmer honest line")
out.append("""update courses set description =
  'A ' || holes || '-hole country course in ' || town ||
  ' — the kind of local club that keeps South African golf alive. Played it? Add a rating and put it on the map.'
where description like '%GolfRSA-affiliated. Played here?%';""")

open('migration12.sql', 'w').write('\n'.join(out) + '\n')
print(f"{len(D)} descriptions -> migration12.sql")

# Location Onboarding Playbook

A cold-start checklist for onboarding any US city to empowered.vote. Follows the Cambridge, MA proof-of-concept from v5.0.

**How to use:** Work through Steps 1–8 in order before writing any code or migrations. Each step has a decision log section — record your answers as you go. When a step is complete, check it off and move to the phase template linked at the end of the step.

> **Cambridge example annotations** appear throughout as blockquotes. They are examples, not defaults.

---

## Core Principle: Citizen Experience First

Honor how a city presents itself to residents, even when it creates backend complexity. Model the government as residents know it — not as it is most convenient to store.

This principle drives decisions like:
- Using "Councillor" (double-L) not "Councilor" when that is the city's official spelling
- Using "City of Cambridge" not "Cambridge MA" as the government name
- Keeping the Mayor as `district_type=LOCAL` (not `LOCAL_EXEC`) when the city runs Council-Manager government — because residents do not elect the Mayor as a separate executive; they elect councillors, and the council selects the Mayor from within its own body
- Dropping the unique index on `offices.politician_id` to support a Council-Manager Mayor who simultaneously holds a council seat — schema convenience yields to accurate representation

When this principle conflicts with implementation convenience, citizen experience wins.

---

## Cities Onboarded

Check this table before starting a new city — proven patterns from prior onboardings are available to borrow.

| City | State | Onboarded | Election method | Notable patterns |
|------|-------|-----------|-----------------|-----------------|
| Cambridge | MA | 2026-05-17 | stv_proportional | Council-Manager; odd-year (next: 2027-11-02); 17 offices (9 councillors + 1 Mayor + 1 City Manager + 6 School Committee); STV since 1941 |
| Portland | ME | 2026-05-19 | rcv | RCV for Mayor, Auditor, and at-large Council; 18 officials seeded (Phase 53); CivicPlus API + portlandmaine.gov headshot source; Finalsite CDN for school board |
| Lewiston | ME | 2026-05-19 | plurality | Tier 2 incumbents-only seed (migration 180); 8 officials; external_id prefix -23387xxxx |
| Bangor | ME | 2026-05-19 | plurality | Tier 2 incumbents-only seed (migration 180); 9 officials; 9 emails @bangormaine.gov; external_id prefix -23027xxxx |
| South Portland | ME | 2026-05-19 | plurality | Tier 2 incumbents-only (migration 180); Tipton dual-office (Mayor + District 5); external_id prefix -23719xxxx |
| Auburn | ME | 2026-05-19 | plurality | Tier 2 incumbents-only (migration 181); 8 officials; 8 emails @auburnmaine.gov; external_id prefix -23020xxxx |
| Biddeford | ME | 2026-05-19 | plurality | Tier 2 incumbents-only (migration 181); 10 council seats (Mayor + 7 wards + 2 at-large); external_id prefix -23048xxxx |
| Maine (state) | ME | 2026-05-20 | plurality | State legislature: 35 Senate + 151 House; legislature-elected AG/SoS/Treasurer (is_appointed=true, no race rows); 380 race rows for 2026 cycle (Phase 55); PowerShell generator for 372-row migration 184 |
| California (state) | CA | 2026-05-21 | plurality (state primary: jungle/top-two) | Pre-existing seed: govt row + 8 exec chambers + 8 politicians existed before v7.0; geo_id was NULL (fixed to '06' in migration 189); chamber names use short form ('Governor', not 'California Governor'); mtfcc swap (STATE_UPPER=G5220, STATE_LOWER=G5210); districts.state='CA' uppercase |
| San Francisco | CA | 2026-05-22 | rcv (all chambers) | Consolidated city-county: both G4110 (0667000) + G4020 (06075) returned for any SF address; DataSF Socrata loader (no outSR, field=sup_dist_num float); sf.gov circular PNG headshots (alpha corners safe in 4:5 crop); 20 officials across 10 chambers; ext_ids -630001..-630028 |
| San Jose | CA | 2026-05-23 | rcv (Mayor + City Council) | ArcGIS DISTRICTINT field (not DISTRICT); outSR=4326 required; City Attorney + Auditor are APPOINTED per SJ Charter — no chambers created; geo_id=0668000; ext_ids -640001, -640010..-640019 |
| San Diego | CA | 2026-05-22 | plurality | ArcGIS outSR=4326 required (WKID 2230 native); NAME field holds council member name (changes with elections) — use integer DISTRICT field for district number; sandiego.gov headshots (public_domain); D4 Foster headshot has anomalous CMS filename; ext_ids -650001..-650018 |
| Sacramento | CA | 2026-05-28 | plurality (no RCV yet) | AEM/CQ5 CMS headshots: CSS background-image, curl+grep required (WebFetch cannot extract); ArcGIS DISTNUM field; outSR=4326 required; City Attorney/Auditor/Treasurer/Clerk all APPOINTED; geo_id=0664000; ext_ids -660001, -660010..-660017 |
| Fremont | CA | 2026-05-22 | plurality | ArcGIS outSR=4326 required (WKID 102643 native); fremont.gov 403 workaround (Node.js browser UA + Referer header); City Attorney APPOINTED per charter; geo_id=0626000; ext_ids -670001, -670010..-670015 |
| Berkeley | CA | 2026-05-22 | rcv (Mayor, City Council, City Auditor) | Socrata loader (NO outSR, field='district' lowercase string); City Attorney APPOINTED; both Mayor and Auditor share single LOCAL_EXEC district; geo_id=0606000; ext_ids -680001..-680017 |
| Oregon (state) | OR | 2026-05-30 | plurality (state + federal); rcv (Portland City Council, Auditor) | All 5 constitutional officers voter-elected (unlike ME); cd119 TIGER key; sos.oregon.gov Blue Book headshot source (500×623, crop to 4:5); external_ids: exec -4100001..-4100005, US Senators -4101001/-4101002, House -4102001..-4102006, State Senate -4110001..-4110030, House -4120001..-4120060; 241 G4110 cities; oregonlegislature.gov MemberPhotos headshot source (non-obvious filenames with disambiguation suffixes) |
| Portland | OR | 2026-05-30 | rcv (City Council 12 seats, City Auditor) | 2024 charter reform: 4 districts × 3 seats (RCV); boundaries from PortlandMaps ArcGIS MapServer Layer 17 (NOT TIGER), mtfcc=X0012, outSR=4326+ST_MakeValid required; portland.gov WAF blocks /public/ — use Drupal 1_1_320w style URLs for headshots; gov name 'City of Portland, Oregon, US' (disambiguates from Portland ME); D3+D4+Auditor on 2026 ballot; Mayor+D1+D2 on 2028 ballot; ext_ids -690001..-690004 (citywide) + -690010..-690021 (council D1-D4) |
| Maryland (state) | MD | 2026-06-08 | plurality | State legislature: 47 Senate + 141 Delegates; 71 SLDL polygons (not 47 or 141 — sub-districts); legislature-elected Treasurer (is_appointed=true); mgaleg.maryland.gov headshot discovery (scrape HTML, not HEAD probe); Baltimore City dual-tier (G4110 + G4020); external_ids exec -240001..-240005, senators -2410001..-2410047, delegates -2420001..-2420141 |
| Leonardtown | MD | 2026-06-08 | plurality | Tier 1 deep seed (migration 277); Mayor=LOCAL_EXEC + 5 council=LOCAL; mtfcc=NULL on district rows (migration 246 pattern); ext_ids under St. Mary's County government |
| Massachusetts (state) | MA | 2026-06-13 | plurality | State legislature: 40 Senate + 160 House; municipal elections odd-year for most cities; G4110 cities (58) loaded v5.0 + G4040 COUSUB towns (293) loaded v5.0 — BOTH layers required for full MA resident routing; malegislature.gov HTML scrape for headshots; primary 2026-09-08, general 2026-11-03 |
| Boston | MA | 2026-06-10 | plurality (fptp for district seats; plurality_at_large for at-large seats) | Hybrid council: 9 single-member district seats (geo_ids boston-ma-council-district-{1-9}, mtfcc=X0013) + 4 at-large seats (geo_id=2507000); Mayor Wu is LOCAL_EXEC (directly elected — NOT council-selected); School Committee 7 APPOINTED (is_appointed=true, no election_method); ArcGIS FeatureServer bulk fetch for district boundaries (no TIGER); ext_ids -2507000001..-2507000014 (Mayor + council) + -2502790001..-2502790007 (SC); boston.gov for headshots |
| Newton | MA | 2026-06-14 | plurality | Mayor + 16 at-large + 8 ward City Councilors (24 council + Mayor = 25 total); 8-ward-elected SC + Mayor ex-officio (SC geo_id=2508610 NCES LEAID); uses American single-L 'City Councilor'; geo_id=2545560; ext_ids -2545560001..-2545560025 (city) + -2508610001..-2508610008 (SC); newtonma.gov = CivicEngage/Revize CMS — HTTP 403 even with Chrome UA — 0/33 headshots (100% gap); Phases 117 |
| Somerville | MA | 2026-06-14 | plurality | Mayor + 4 at-large + 7 ward City Councillors (11 council + Mayor = 12 total); SC: 7 elected ward members + Mayor + Council President ex-officio (TWO ex-officio — not just Mayor); uses British double-L 'City Councillor'; geo_id=2562535; ext_ids -2562535001..-2562535012 (city) + -2510890001..-2510890007 (SC); somervillema.gov S3 + /sites/default/files/-2022.jpg pattern; 9/12 city uploaded; 3 Nov 2025 newly-elected gaps; Phase 118 |
| Lynn | MA | 2026-06-14 | plurality | Mayor + 4 at-large + 7 ward City Councilors (11 council + Mayor = 12 total); SC: 6 elected members + Mayor ex-officio; uses American single-L 'City Councilor'; geo_id=2537490; ext_ids -2537490001..-2537490012 (city) + -2507110001..-2507110006 (SC); CivicLive CDN (cdnsm5-hosted2.civiclive.com) for all 11 councilors; Wikipedia Commons for Mayor (requires WIKIMEDIA_HEADERS — Chrome UA returns 429); MegieMaddrey.png CDN filename (no hyphen despite DB last_name='Megie-Maddrey'); Phase 119 |
| New Bedford | MA | 2026-06-14 | plurality | Mayor + 5 at-large + 6 ward City Councilors (11 council + Mayor = 12 total); no SC seeded (scope limited to city council); uses American single-L 'City Councilor'; NOT a sanctuary city (police cooperate with ICE — contrast with Lynn 2025 ICE resolution); geo_id=2545000 (RESEARCH.md estimated 2524000 — wrong); ext_ids -2545000001..-2545000012; no headshots (headshot migration 588 applied best-effort); Phase 120 |
| Fall River | MA | 2026-06-15 | plurality | Mayor + 9 at-large City Councilors (all-at-large — plan assumed ward mix; confirmed all-at-large from official site); uses American single-L 'City Councilor'; geo_id=2523000 (plan estimated 2522640 — always verify from DB); ext_ids -2523000001..-2523000010; fallriverma.org = Revize CMS — group-photo-only council page — 0/10 headshots (100% gap); Phase 121 |
| Medford | MA | 2026-06-15 | plurality | Mayor + 7 at-large City Councilors (all-at-large — no ward seats); SC: 6 elected at-large + Mayor ex-officio (SC geo_id=2506600 NCES LEAID); uses American single-L 'City Councilor'; geo_id=2539835 (RESEARCH.md estimated 2540115 — wrong; external_id prefix -2540115xxx was seeded from wrong estimate); ext_ids -2540115001..-2540115008 (city) + -2506600001..-2506600006 (SC); medfordma.org finalsite.net CDN for Mayor only; council page = group selfie, 0 individual bio pages; 1/14 headshots (Mayor Lungo-Koehn only); Phase 121 |
| Waltham | MA | 2026-06-15 | plurality | Mayor + 6 at-large + 9 ward City Councillors (15 council + Mayor = 16 total); uses British double-L 'City Councillor'; geo_id=2572600 (plan estimated 2573440 — always verify from DB); ext_ids -2572600001..-2572600016; city.waltham.ma.us = Cloudflare JS challenge (HTTP 200 but body is 'Just a moment... Enable JavaScript') — 0/16 headshots (100% gap); MBTA Communities Act compliance vote is primary evidence source for all 15 councillors; Phase 121 |
| Alhambra | CA | 2026-06-15 (stances) | plurality | Officials seeded v7.0; v15.0 evidence-only stances (Phase 126); 5 council, **rotational mayor** (Wang held rotational Mayor title — reasoning uses Council Member, no Mayor office); geo_id=0600884; 26 stance rows |
| Beverly Hills | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 127; Mayor + 4 council (City Treasurer Fisher EXCLUDED — administrative, 0 rows); geo_id=0606308; 42 stance rows; Mirisch progressive outliers (campaign-finance/climate 2.0) |
| Carson | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 128; **directly-elected Mayor** (Davis-Holmes LOCAL_EXEC) + 4 district council; City Clerk + Treasurer EXCLUDED (0 rows); geo_id=0611530; 34 stance rows; 2017 immigration-protective resolution = local-immigration 2.0 pattern |
| Compton | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 129; **directly-elected Mayor** (Sharif LOCAL_EXEC) + 4 district council; no clerk/treasurer seeded (none excluded); geo_id=0615044; 20 stance rows; Spicer public-safety 1.0 outlier ("almost nothing to do with law enforcement") |
| Culver City | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 130; 5 council, **rotational mayor**; geo_id=0617568; 29 stance rows; full ideological spread (McMorrin 1.0s ↔ Vera rent-regulation 5.0); MOVE Culver City 2023 bus/bike-lane rollback = defining distinguishing vote; Bryan Fish public name "Bubba Fish" |
| El Segundo | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 131; 5 council, **rotational mayor**; geo_id=0622412; 15 stance rows; business/aerospace city — pro-economic-development 2.0 + controlled-growth/preservation 4.0 + fiscal restraint cluster |
| Gardena | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 132; **directly-elected Mayor** (Cerda LOCAL_EXEC) + 4 council; geo_id=0628168; 19 stance rows; Tanaka (ex-PD Lt) public-safety 4.0 + local-control zoning 4.0; Love lone "no" on 333-unit development |
| Hawthorne | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 133; **directly-elected Mayor** (Vargas LOCAL_EXEC) + 4 council; geo_id=0632548; 17 stance rows; SpaceX/Tesla economic-development anchor; Johnson "Treatment First, Housing Second" homelessness 3.0 |
| Santa Monica | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 134; **rotational mayor**; geo_id=0670000; 41 stance rows; strong SMRR-progressive vs moderate-Change factional spread. **Roster reconciled (migration 774):** 3 departed members (Brock, de la Torre, Parra — terms ended Dec 2024) unlinked from council; live council now correctly 7 (Torosis, Zwick, Negrete, Hall, Raskin, Snell, Zernitskaya). Departed politician + stance records kept (office_id nulled) |
| South Gate | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 135; 5 council, **rotational mayor**; geo_id=0673080; 8 stance rows (thin-record small city — Barron Mayor zero-INSERT ledger, honest blank spokes) |
| West Hollywood | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 136; 5 council, **rotational mayor**; geo_id=0684410; 21 stance rows; uniformly progressive (rent control/LGBTQ+ founding city); Heilman rent/housing/civil-rights all 1.0; Meister cross-cut (rent 1.0 but growth 4.0) |
| Whittier | CA | 2026-06-16 (stances) | plurality | Officials seeded v7.0; stances Phase 137; **directly-elected Mayor** (Becerra LOCAL_EXEC) + 4 **district** council; geo_id=0685292; moderate/suburban. **Roster reconciled (migrations 774-776):** D1/D3 office occupants in seed were former members; repointed to current members Mary Ann Pacheco (D1) + Cathy Warner (D3) and researched their stances (+4 rows → 20 total); departed Dutra/Martinez unlinked (politician + stance records kept). Current council: Becerra (Mayor), Pacheco (D1), Santana (D2), Warner (D3), Macedo (D4) |
| Long Beach | CA | 2026-06-18 | plurality | **v17.0 Wave-2 deep-seed (Phase 142).** Charter city — 5 chambers, 13 active: 9-member Council + directly-elected Mayor (Rex Richardson) + 3 elected citywide officers (City Attorney McIntosh, City Prosecutor Haubert, City Auditor Doud). Reconcile (new LB ext_ids -700050..-700099). geo_id=0643000; 13/13 headshots; **113 stance rows** (richest in wave; Auditor Doud honest blank) |
| Santa Clarita | CA | 2026-06-19 | plurality | **v17.0 Wave-2 deep-seed (Phase 143).** At-large + rotational mayor. Reconcile: reseat McLean (-201394) + Miranda (-200980) onto existing rows — NOT duplicate -700xxx. geo_id=0669088; 5/5 headshots; 26 stance rows |
| Glendale | CA | 2026-06-19 | plurality | **v17.0 Wave-2 deep-seed (Phase 144).** At-large; **June-2026 election turnover** (Najarian out → Bartrosouf reseated 66cd60ba→-700101). glendaleca.gov is **WAF-403** → headshots from gaor.org 2026 candidate interviews + Wikipedia + glendaleca.gov mix. geo_id=0630000; 5/5 headshots; 38 stance rows |
| Lancaster | CA | 2026-06-19 | plurality | **v17.0 Wave-2 deep-seed (Phase 145).** At-large. geo_id=0640130; **4/5 headshots — Ken Mann gap** (no official source); 4/5 stances (Hughes-Leslie honest blank); 13 stance rows |
| Palmdale | CA | 2026-06-20 | plurality | **v17.0 Wave-2 deep-seed (Phase 146).** **By-district** — relabel existing At-Large rows to district occupants + create missing; rotational mayor as a title on a seat. cityofpalmdaleca.gov **NO-WAF** — headshots curl directly from /ImageRepository/Document?documentID=NNNN. geo_id=0655156; 5/5 headshots; Alarcón 0-stance honest gap; 10 stance rows |
| Pomona | CA | 2026-06-20 | plurality | **v17.0 Wave-2 deep-seed (Phase 147).** By-district. pomonaca.gov **FULLY WAF-403** → use Pomona Choice Energy 2020 photos; **BEWARE stale PCE-2025 wrong-person photos** (Gonzalez/Torres `/2025/02/638723568` — those people are NOT on the seated council). geo_id=0658072; 7/7 headshots; 32 stance rows |
| Torrance | CA | 2026-06-20 | plurality | **v17.0 Wave-2 deep-seed (Phase 148).** At-large. geo_id=0680000; 7/7 headshots; 7/7 stances; 19 stance rows |
| Pasadena | CA | 2026-06-20 | plurality | **v17.0 Wave-2 deep-seed (Phase 149).** **By-district reconcile** — merged 2 'City Council' chambers (survivor 2e7f01d0), relabel At-Large→D1-D7; **shared-district fix** by repurposing an unused orphan At-Large row (no new row); directly-elected Mayor (Victor Gordo, LOCAL_EXEC). geo_id=0656000; 8/8 headshots; 54 stance rows |
| Downey | CA | 2026-06-21 | plurality | **v17.0 Wave-2 deep-seed (Phase 150).** Rotational mayor is **Frometa (D4), NOT Sosa** — research was wrong; verify rotational mayor on the official city site. downeyca.org **WAF-403**. Ortiz (D1) created fresh -700991. geo_id=0619766; 5/5 headshots; 23 stance rows |
| El Monte | CA | 2026-06-21 | plurality | **v17.0 Wave-2 deep-seed (Phase 151).** **By-district overturn (Ord. 3010)** + Cortez D6 created fresh -701001 + directly-elected Mayor (Jessica Ancona); 3-way shared-district fix. ci.el-monte.ca.us **NO-WAF**. geo_id=0622230; 7/7 headshots; 5/7 stances (Crippen-Thomas + Longoria honest blanks); 12 stance rows |
| West Covina | CA | 2026-06-21 | plurality | **v17.0 Wave-2 deep-seed (Phase 152).** By-district reconcile + dual-chamber merge; **wrong-person Gutierrez headshot fix** (corrected to official westcovina.gov ImageRepository documentID=1053). geo_id=0684200; 5/5 headshots; 17 stance rows |
| Inglewood | CA | 2026-06-22 | plurality | **v17.0 Wave-2 deep-seed (Phase 153).** Messiest reconcile — dual-chamber merge + Eloy Morales dedup + Padilla absent→created -701002 + directly-elected Mayor (James T. Butts Jr.) kept. cityofinglewood.org **NO-WAF**. geo_id=0636546; 5/5 headshots; 4/5 stances (Gloria D. Gray honest blank); 13 stance rows |
| Burbank | CA | 2026-06-22 | plurality | **v17.0 Wave-2 deep-seed (Phase 154).** At-large + rotational mayor (Takahashi=Mayor / Mullins=Vice Mayor; official_count=5). burbankca.gov requires **Chrome UA** (not full WAF). geo_id=0608954; 5/5 headshots; 5/5 stances; 42 stance rows |
| Norwalk | CA | 2026-06-22 | plurality | **v17.0 Wave-2 deep-seed (Phase 155).** Rotational Mayor=Perez / VM=Rios (Ayala NOT mayor — LOCAL_EXEC mis-seed converted to At-Large). norwalkca.gov Revize **NO-WAF** but Ramirez source 404→RR-Digital + Rios `%20%20` double-space filename quirk. geo_id=0652526; 5/5 headshots; 26 stance rows |
| Bellflower | CA | 2026-06-22 | plurality | **v17.0 Wave-2 deep-seed (Phase 156).** Single-chamber but **by-district (Ord. 1410)** + rotational mayor; Dunton LOCAL_EXEC mis-seed→D5; Santa Ines D3 created -701003 (Mayor) / Sanchez D4 (Mayor Pro Tem). NO-WAF Revize /photo_gallery/. geo_id=0604982; 5/5 headshots; **thin stances 2/5** (Santa Ines 2 + Morse 5; Dunton/Koops/Sanchez honest blanks); 7 stance rows |
| Las Vegas | NV | 2026-06-28 | plurality | **v18.0 deep-seed (Phase 162).** By-ward (6 X0015 custom geofences); Mayor Berkley LOCAL_EXEC (directly elected); 7 officials total. ext -3205001 (Mayor Berkley) + -3205002..-3205007 (6 council). geo_id=3240000; 7/7 headshots; 6/7 stances (1 councilmember honest blank — no attributable record); 36 stance rows. Purple chip. |
| Henderson | NV (city) | 2026-06-28 | plurality | **v18.0 deep-seed (Phase 163).** By-ward (4 X0016 custom geofences); Mayor Romero LOCAL_EXEC (directly elected); 5 officials. ext -3206001 (Mayor) + -3206002..-3206005 (wards 1-4). cityofhenderson.com = **Akamai WAF-403** — per-member fallback chain (NVBiz / campaign PNG RGBA→white composite / Ballotpedia upscale). Ward 2 geofence had 19 rings → ST_MakeValid. geo_id=3231900; 5/5 headshots; 5/5 stances; 28 stance rows. Purple chip. |
| North Las Vegas | NV (city) | 2026-06-29 | plurality | **v18.0 deep-seed (Phase 164).** By-ward (X0017 from Clark County GISMO PLACE=80); Mayor LOCAL_EXEC; 5 officials. ext -3207xxx (Arabic ward numeral labels). cityofnorthlasvegas.com **WAF-403** → Wikimedia fallback. geo_id=3251800; 5/5 headshots; 5/5 stances; 18 stance rows. Purple chip. |
| Boulder City | NV (city) | 2026-06-29 | plurality | **v18.0 deep-seed (Phase 165).** At-large (no wards); Mayor + 4 council, 5 officials. ext -3208xxx. flybouldercity.com = clean/NO-WAF. geo_id=3206500; 5/5 headshots; 5/5 stances; 19 stance rows. Purple chip. |
| Clark County School District | NV (school) | 2026-06-29 | plurality | **v18.0 deep-seed (Phase 166).** G5420 school district geofence (TIGER UNSD); 7 elected trustees (A–G) + 4 appointed trustees = 11 total (official_count=11). ext -3209xxx. School-board compass **deferred by design** — 0 stances. geo_id=3200060/G5420; 7/11 headshots (4 appointed trustees no accessible portrait). Plain chip (no hasContext). |
| Clark County | NV (county) | 2026-06-24 | plurality | **v18.0 deep-seed (Phase 161).** Standalone county government (NOT under State of NV — own governments row, geo_id=32003). Board of County Commissioners: 7 commissioners, Chair Naft title-on-seat. ext -3200301..-3200307. Single COUNTY district (state='nv' lowercase). Governs the unincorporated Strip/Paradise/Spring Valley. official_count=NULL (data-soft; roster correct at 7). clarkcountynv.gov AEM 175x175 headshots. geo_id=32003; 7/7 headshots; 7/7 stances; 32 stance rows. Purple chip. |
| Washington County | OR (county) | 2026-07-01 | plurality (May primary + Nov runoff) | **v20.0 deep-seed (Phase 175).** Standalone county govt (NOT under State of OR; geo_id=41067). Board of Commissioners = Chair + 4 district commissioners on custom LOCAL geofences `washco-or-commissioner-district-1..4` (X0018). districts.state='or' lowercase. geo_id=41067; 5/5 headshots; 5/5 stances; 67 stance rows. Purple chip. |
| Beaverton | OR | 2026-07-02 | plurality (May primary + Nov runoff) | **v20.0 deep-seed (Phase 176).** At-large numbered Positions + directly-elected Mayor (LOCAL_EXEC). geo_id=4105350; 7/7 headshots + stances; 91 stance rows (richest in milestone). Purple chip. |
| Hillsboro | OR | 2026-07-02 | plurality (straight-to-November) | **v20.0 deep-seed (Phase 177).** Ward/Position labels (Wards 1–3 × Positions A/B). CivicWeb NO-WAF. geo_id=4134100; 7/7; 60 stance rows. Purple chip. |
| Tigard | OR | 2026-07-02 | plurality (straight-to-November) | **v20.0 deep-seed (Phase 178).** Pure at-large (multiple plain 'Councilor' offices — resolve by incumbent, not title). tigardlife photo source. geo_id=4173650; 7/7; 48 stance rows. Purple chip. |
| Tualatin | OR | 2026-07-02 | plurality (straight-to-November) | **v20.0 deep-seed (Phase 179).** At-large numbered Positions. geo_id=4174950 (**stated 4175200 was wrong** — verify from DB). 7/7; 59 stance rows. Purple chip. |
| Forest Grove | OR | 2026-07-03 | plurality (straight-to-November) | **v20.0 deep-seed (Phase 180).** Pure at-large. D-16 headshot chain required (no city photos). geo_id=4126200; 7/7; 39 stance rows. Purple chip. |
| Sherwood | OR | 2026-07-03 | plurality (straight-to-November) | **v20.0 deep-seed (Phase 181).** Pure at-large, 2-yr Mayor term. City-site square/webp headshots. geo_id=4167100; 7/7; 23 stance rows. Purple chip. |
| Cornelius | OR | 2026-07-04 | plurality (straight-to-November) | **v20.0 deep-seed (Phase 182).** Pure at-large, 2-yr Mayor, 1 vacant seat (filled by appointment, not election). geo_id=4115550 (**CORRECTED from stated 4115350 = Coquille, a different city**). Circle-cutout PNG headshot crop lesson. 4/4 headshots; **thin stances (3/4 officials, 4 rows)** — appointed-interim councilors, honest blanks. Purple chip. |
| Beaverton School District 48J | OR (school) | 2026-07-04 | plurality (May odd-year) | **v20.0 (Phase 183).** G5420 geo_id=4101920; 7/7 headshots; **compass deferred by design** (0 stances). Search-only, plain chip. |
| Hillsboro School District 1J | OR (school) | 2026-07-04 | plurality (May odd-year) | **v20.0 (Phase 183).** G5420 geo_id=4100023; 7/7 headshots; compass deferred. Search-only, plain chip. |
| Tigard-Tualatin School District 23J | OR (school) | 2026-07-04 | plurality (May odd-year) | **v20.0 (Phase 184).** G5420 geo_id=4112240; 5/5 headshots; compass deferred. Search-only, plain chip. |
| Sherwood School District 88J | OR (school) | 2026-07-04 | plurality (May odd-year) | **v20.0 (Phase 184).** G5420 geo_id=4111290; 5/5 headshots; compass deferred. Search-only, plain chip. |
| Forest Grove School District 15 | OR (school) | 2026-07-04 | plurality (May odd-year) | **v20.0 (Phase 184).** G5420 geo_id=4105160; **4/5 headshots (Harrington gap — no source)**; compass deferred. Search-only, plain chip. |
| Wisconsin (state) | WI | 2026-07-26 | plurality (partisan primary Aug + general Nov; **judicial/municipal are April nonpartisan**) | **PR ev-accounts#88 (migrations 1441–1461).** 144 state officials (33 Sen + 99 Assembly + execs + 7 Supreme Court). Open States roster + docs.legis photos: **136/144 photos, 132/144 emails, 0/144 websites**. `office_terms` temporal model shipped here (Bradley→Taylor handoff on 2026-08-01). Geofences G4020/G5200/G5210/G5220 + 607 places + 1243 MCDs. |
| Racine County | WI | 2026-07-26 | County Exec + Board = **April nonpartisan**; Sheriff/Clerk of Circuit Court/DA etc = November partisan | **PR ev-accounts#88.** 38 officials (7 countywide + 21 supervisors + 10 circuit judges). Custom supervisor geofence `X-RC-SUP`. **Enrichment 0/38 — see Wisconsin Quick Reference; whole domain is Akamai-403 to curl.** |
| Racine + 16 Racine Co. municipalities | WI | 2026-07-26 | plurality (April nonpartisan) | **PR ev-accounts#88.** All 17 seeded (2 cities, 11 villages, 4 towns) = 116 officials. Villages/cities on G4110 place geo_id, **towns on G4040 cousub** (mixing them double-matches). **Enrichment 0/116.** No ward geometry — council members surface municipality-wide. |
| Washington (state) | WA | 2026-08-14 | **top-two primary** (Aug 4) → November general; all state/county/city offices | **Seattle deep seed (migs 1742–1753).** 7 chambers / 152 offices: 49 Senate + 98 House + 5 statewide execs. **House is multi-member** — 49 SLDL polygons, 98 seats (Position 1/2). **Senate is staggered** — 24 of 49 on the 2026 ballot. `districts.state='wa'` lowercase for legislative/local tiers, `'WA'` uppercase for STATE_EXEC. **MTFCC is INVERTED vs CA: sldu→G5210, sldl→G5220.** 281 G4110 places + 39 G4020 counties. leg.wa.gov/memberphoto headshots (900×1200), **147/147**. **0 stance rows — deferred to its own milestone.** ⚠ Only 5 of WA's 9 statewide execs seeded (see `.planning/WA-GAPS.md`). |
| Seattle | WA | 2026-08-14 | plurality (top-two primary; **odd-year city cycle**) | **Deep seed (migs 1742–1753).** 3 chambers / 11 offices: Mayor (LOCAL_EXEC) + 9 Council (7 districts + 2 citywide Positions 8/9) + elected City Attorney. 7 custom **X0025** council geofences. geo_id=5363000; ext -5363001..-5363011; **11/11 headshots** (seattle.gov studio, only 300×300); **2 stance rows / 1 of 11 officials** (Strauss) — the other 10 blank after a full 2020–2026 corpus read. **Council D5 IS on the 2026 ballot** (Juarez appointed 2025-07-28 to fill a vacancy); next full city cycle 2027. Purple chip. |
| King County | WA (county) | 2026-08-14 | plurality (**nonpartisan**; even-year since the 2022 charter amendment) | **Deep seed (migs 1742–1753).** Standalone county govt (NOT under State of WA; geo_id=53033). 6 chambers / 14 offices: Executive + 9-member Council + Assessor + Prosecuting Attorney + Director of Elections + **appointed Sheriff** (2020 charter amendment). 9 custom **X0026** council geofences. ext -5303301..-5303314; **14/14 headshots** (the 1600×700 "banner" IS a letterboxed studio portrait); **9 stance rows / 6 of 14**. ⚠ geo_id 53033 also = LD33 Senate + LD33 House — always qualify by mtfcc. Search-only entry in `COVERAGE_COUNTIES` (inert — tree-shaken out). |

---

## LA-Area City Stances (v15.0) Quick Reference

**Read before adding stances to any pre-seeded city cluster.** v15.0 added evidence-only compass stances to 12 LA-area cities (65 officials, 288 stance rows) that were already officials-seeded in v7.0 — stances-only, no geofence/officials work.

| Trap / Pattern | One-Line Summary |
|----------------|------------------|
| Stance migrations bypass the ledger | Applied via raw `psql -f` / MCP `execute_sql` — they do NOT register in `supabase_migrations.schema_migrations` (MAX stayed 718 all milestone). The **on-disk file counter is authoritative** for "next migration", not the ledger query |
| Rotational vs directly-elected Mayor | Rotational (Alhambra/Culver/El Segundo/Santa Monica/South Gate/WeHo): no Mayor office, all "Council Member", no rotational qualifier unless tied to a mayoral-term action. Directly-elected (Carson/Compton/Gardena/Hawthorne/Whittier + BH per Phase 127): LOCAL_EXEC, "Mayor X" correct |
| Clerk/Treasurer exclusion varies | BH (Treasurer), Carson (Clerk+Treasurer) had administrative roles seeded → EXCLUDED, 0 rows. Compton + most others had none seeded → nobody to exclude. Always Wave-0 check the full roster |
| Seed-roster drift | Santa Monica (10 seeded = 2020-24 + Dec-2024 cohorts; live council 7) and Whittier (district-label drift) — apply to the seeded set per scope, flag the discrepancy, never invent/delete officials |
| Evidence-only / no defaulting | Blank spokes where the record is silent (South Gate Barron 0; Compton Darden 1). Values span full 1.0–5.0 with evidence — never default everyone to one side or to 3.0 |
| Apply path in main context | mcp__supabase-local execute_sql works from the main agent (writes to production); psql -f from C:/EV-Accounts/backend/.env DATABASE_URL also works. Subagent executors may lack MCP — psql is the portable fallback |

---

## LA County Wave-2 (v17.0) Quick Reference

**Read before onboarding any further LA-area city.** v17.0 deep-seeded 15 LA County cities (Phases 142–156: government + roster + headshots + evidence-only stances) — 92 officials, 91/92 headshots, 445 stance rows. Unlike v15.0 (stances-only on pre-seeded cities), Wave-2 was a full **reconcile-heavy** deep-seed. DB-verified in `.planning/v17.0-MILESTONE-AUDIT.md`.

| Trap / Pattern | One-Line Summary |
|----------------|------------------|
| Reconcile-vs-greenfield is the DEFAULT | Most Wave-2 cities were already partially seeded (Long Beach, Pasadena, etc.). **DB pre-check every city by NAME** before writing — `governments.geo_id` was often originally NULL then backfilled, so match the gov row by name first, geo_id second |
| June-2026 election turnover | Several cities reseated for the June 2026 election (e.g. Glendale Najarian→Bartrosouf). Verify the CURRENT officeholder on the official site; reseat onto the existing politician row where possible (don't mint duplicate -700xxx) |
| Duplicate-chamber merge / reseating | By-district reconciles often had TWO 'City Council' chambers — merge to one survivor, move occupants, relabel At-Large→D1-DN. Count the **survivor chamber only**; unlinked rows (office_id NULL / is_active=false) are intentionally KEPT but must not be counted as live roster |
| districts.government_id is NULL | Across these rows `essentials.districts.government_id` is NULL — **join districts via geo_id**, never government_id (audit queries + browse logic both rely on this) |
| Directly-elected vs rotational Mayor | Directly-elected (LOCAL_EXEC, seated above council count): El Monte (Ancona), Inglewood (Butts), Pasadena (Gordo), Long Beach (Richardson). Rotational (title on a council seat, official_count unchanged): Santa Clarita, Palmdale, Downey (**Frometa D4, NOT Sosa** — research was wrong), Burbank (Takahashi), Norwalk (Perez, **NOT Ayala**), Bellflower. Always confirm the rotational mayor on the official city site |
| Wrong-person headshot pitfalls | West Covina Gutierrez (fixed → official ImageRepository); Pomona Gonzalez/Torres (**stale PCE-2025 `/2025/02/` photos are wrong people — and not even seated**); Glendale (use distinct per-member sources). Spot-check identity, never reuse a shared/candidate image |
| WAF-403 vs NO-WAF headshot sources | **WAF-403** (need alt source): glendaleca.gov, pomonaca.gov, downeyca.org. **NO-WAF** (curl directly): cityofpalmdaleca.gov (/ImageRepository/Document?documentID=NNNN), ci.el-monte.ca.us, cityofinglewood.org, norwalkca.gov + Bellflower Revize /photo_gallery/. **Chrome-UA-required** (not full WAF): burbankca.gov. Filename quirks: Norwalk Rios `%20%20` double-space, Pomona PCE 2020/06 path |
| Split-section clean here, deferred elsewhere | All 15 Wave-2 cities pass the split-section scan (0 rows). The 5 known split-section defect cities (Whittier, Compton, Carson, South El Monte, South Pasadena) are NON-Wave-2, pre-existing, and remain a deferred cleanup |
| Stance migrations bypass the ledger | Same as v15.0 — stance rows applied via raw SQL / MCP `execute_sql`, NOT registered in `supabase_migrations.schema_migrations`. Count stances from `inform.politician_answers`; the on-disk file counter is authoritative for "next migration" |

---

## California Quick Reference

**Read this before starting any CA city.** These traps are CA-specific — general playbook guidance above does not warn for them.

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| Pre-existing CA seed | Step 1, Step 5 | CA govt row + 8 chambers + 8 politicians pre-existed; always pre-check before writing any CA state-level INSERT |
| districts.state casing | Step 3 | Pre-existing CA districts use state='CA' (uppercase); lowercase 'ca' returns 0 rows |
| mtfcc swap | Step 3 | CA STATE_UPPER=G5220, STATE_LOWER=G5210 (inverse); do NOT join on d.mtfcc — routing uses gb.mtfcc |
| External ID range collision | Step 5 | Multiple CA ranges occupied; always run pre-flight query before assigning any CA external_id |
| DataSF vs ArcGIS (outSR) | Step 3 | SF/Berkeley use Socrata (native WGS84, no outSR); Sacramento/SD/Fremont/SJ use ArcGIS (LA County GeoHub also uses ArcGIS — anticipated but not confirmed via city deep seed) (must add outSR=4326) |
| SF consolidated city-county | Step 3 | SF returns G4110 + G4020 for any address — assert BOTH in smoke tests |
| CA COUSUB = CCDs | Step 3 | CA G4040 are all FUNCSTAT='S'; do NOT add CA to COUSUB_FUNCSTAT_STATES |
| CA jungle primary | Step 2 | ONE unified primary race row for ALL candidates; sos.ca.gov is authoritative (not Ballotpedia) |
| RCV at seed time | Step 2, Step 6 | Set election_method='rcv' on chamber row during structure migration — not as a follow-up TODO |
| AEM/CQ5 headshots (Sacramento) | Step 4 | cityofsacramento.gov embeds headshots in CSS background-image — use curl+grep, not WebFetch |
| lavote.gov election ID | Step 2 | ID changes per cycle (June + November); update discovery_jurisdictions row manually after each election |

---

## Oregon Quick Reference

**Read this before starting any OR city or state work.** These traps are OR-specific — general playbook guidance above does not warn for them.

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| Portland council NOT in TIGER | Step 3 | Source from PortlandMaps ArcGIS MapServer Layer 17 per-OBJECTID; always use outSR=4326 + ST_MakeValid |
| Portland 2024 charter reform | Step 1, 2 | 4 districts × 3 seats (12 total) elected by RCV; authoritative roster from portland.gov/auditor/elections/elected-city-officials |
| All OR constitutional officers voter-elected | Step 1, 5 | Unlike Maine: all 5 officers (Gov, AG, SoS, Treasurer, Labor) are elected; is_appointed_position=false; race rows required |
| portland.gov WAF blocks headshots | Step 4, 7 | Use Drupal 1_1_320w style CDN URLs; photo_license=public_domain; extract itok token from profile page HTML |
| PowerShell Unicode mangling | Step 6 | Use [char]0xNNNN for all diacriticals (HD-38 Nguyễn, HD-45 Thuy Tran, HD-22 Munoz) in .ps1 generators |
| Federal officials may pre-exist | Step 5 | Pre-flight SELECT before INSERT; OR senators Wyden+Merkley pre-existed under -400065/-400066; UPDATE external_id, not INSERT |
| Portland 2026 ballot: D3/D4/Auditor only | Step 2, 6 | Mayor+D1+D2 have 4-year terms; only D3+D4+Auditor (7 races) are on the November 2026 ballot |
| G4110 count needs dry-run confirmation | Step 3 | OR actual count is 241 (not 242); always dry-run place layer; update count in loader + verify SQL + smoke test |

---

## Washington County / West-Metro Quick Reference (v20.0)

**Read before any Washington County OR city/county/school work.** v20.0 deep-seeded Washington County + 7 west-metro cities + 5 school districts (Phases 174–186), then seeded the 2026 election + discovery layer (Phase 185). DB-verified in `.planning/v20.0-MILESTONE-AUDIT.md`.

| Trap / Pattern | One-Line Summary |
|----------------|------------------|
| Two-table state casing | `essentials.districts.state='or'` (LOWERCASE) for every OR district join; but `essentials.elections.state` and `essentials.discovery_jurisdictions.state='OR'` (UPPERCASE, char(2)). Same word, two conventions — do not conflate. |
| Migration counter drifts hourly | The shared on-disk counter in `C:/EV-Accounts/backend/migrations` advances multiple times/day from parallel workstreams (MN/IN/MD/AZ). Re-run `ls | sort -n | tail` immediately before EVERY migration write; take number = live_max+1. v20.0's `1213_seed_washco_2026_local_races.sql` cosmetically collides with a parallel IN `1213_*` — harmless in the direct-apply/no-ledger model. |
| Standalone county (not under state) | Washington County is its own `governments` row (geo_id=41067), NOT under State of Oregon — same pattern as Clark County NV. Board = Chair (geo_id 41067 COUNTY district) + 4 commissioners on custom LOCAL geofences `washco-or-commissioner-district-1..4`. |
| geo_id correction traps | Cornelius = **4115550** (stated 4115350 = Coquille, a DIFFERENT city); Tualatin = **4174950** (stated 4175200 wrong). Always name-match probe geo_ids against the DB before seeding. |
| Election mechanic split | WashCo Commission + Beaverton use **May primary + November runoff** (only seats with no May majority reach the Nov ballot). The other 6 cities (Hillsboro/Tigard/Tualatin/Forest Grove/Sherwood/Cornelius) go **straight to November** (plurality). Do not seed a Nov race for a May-decided seat. |
| Plain-'Councilor' at-large councils | Tigard/Forest Grove/Sherwood/Cornelius have MULTIPLE offices titled 'Councilor' sharing one LOCAL district — resolve each seat by its CURRENT incumbent's office linkage, NOT by `o.title` (title alone collapses them). |
| races.position_name unique indexes | `essentials.races` has `idx_races_election_position_no_party (election_id, position_name) WHERE primary_party IS NULL` + `races_election_position_party_unique`. All rows in one election need DISTINCT position_name — use `{City} {Body} {Seat}` labels; untitled at-large seats get lettered "Seat A/B/C". |
| Per-table idempotency (races layer) | `races` & `race_candidates` → `NOT EXISTS` (NO unique constraint for the dedupe key; never `ON CONFLICT`). `politicians.external_id` & `discovery_jurisdictions (jurisdiction_geoid, election_date)` → `ON CONFLICT DO NOTHING` (real unique indexes). |
| Data-seed migrations = no ledger | races/candidates/discovery/headshot migrations do NOT write `supabase_migrations.schema_migrations` (1109/1110/1112/1113 family). On-disk counter is authoritative. |
| Discovery host trap | Trigger discovery via `POST https://accounts-api.empowered.vote/api/admin/discover/jurisdiction/:id` (`:id` = discovery_jurisdictions UUID). `accounts-api.onrender.com` 404s. `X-Admin-Token` from `.env` — never echo/log/commit. |
| School boards: search-only, compass deferred | 5 west-metro G5420 districts (4101920/4100023/4112240/4111290/4105160) are in `COVERAGE_SCHOOL_DISTRICTS` (search-only, plain chip, no `hasContext`) — AND now removed from the search typeahead too (cities+states only). Compass stances DEFERRED by design (0 rows). OR school elections are May odd-year (2025/2027), so NO Nov 2026 school races. |
| Admin roles → policy_engagement_level | To give a non-policy office the "administrative, no compass" treatment, set `essentials.chambers.policy_engagement_level='none'` (API-read, per-chamber, no deploy). `src/lib/classify.js` `computeVariant` is DEAD CODE — do not edit it for this. |
| Pre-check every jurisdiction | Some west-metro govs were pre-seeded; DB pre-check each by geo_id/name before writing (join districts by geo_id — `districts.government_id` is often NULL). |

**West-Metro Key Facts:**
- geo_ids: Washington County 41067 · Beaverton 4105350 · Hillsboro 4134100 · Tigard 4173650 · Tualatin 4174950 · Forest Grove 4126200 · Sherwood 4167100 · Cornelius 4115550
- School districts (G5420): Beaverton SD 48J 4101920 · Hillsboro SD 1J 4100023 · Tigard-Tualatin SD 23J 4112240 · Sherwood SD 88J 4111290 · Forest Grove SD 15 4105160
- OR 2026 General election: id `de10e3a7-f5c2-47e6-acd7-ee87be9413db`, name `'OR 2026 General'`, state `'OR'`, 2026-11-03
- 2026 challenger external_id band: -4850001..-4850099 (Callaway -4850001, Philip -4850002, Kocher -4850003, Dittman -4850004)
- Headshot bucket `politician_photos`; CDN `https://kxsdzaojfaibhuzmclfq.supabase.co/storage/v1/object/public/politician_photos/{id}-headshot.jpg`; politician_images = (politician_id, url, type='default', photo_license='press_use'); photo_origin_url lives on `politicians`.
- Browse: city/county `?browse_government_list=<geo_id>`; school district `?browse_geo_id=<geo_id>&browse_mtfcc=G5420`; state `?browse_state_officials=OR`
- Next migration after v20.0 close: re-verify live (`ls C:/EV-Accounts/backend/migrations | sort -n | tail`) — counter drifts.

---

## Maryland Quick Reference

**Read this before starting any MD city or state work.** These traps are MD-specific — general playbook guidance above does not warn for them.

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| Multi-member delegate districts | Step 1, 5 | 47 TIGER SLDL polygons cover 141 delegates; 3 per whole-district polygon; NOT EXISTS guard uses (district_id, politician_id) |
| A/B subdistrict polygons | Step 5 | Districts with A/B/C suffix have separate polygons; 71 total TIGER polygons (not 47 or 141) |
| State Treasurer appointed by GA | Step 5 | Treasurer is legislature-elected: is_appointed_position=true, zero race rows; AG/Gov/LG/Comptroller ARE voter-elected |
| mgaleg headshot URL discovery | Step 4 | Scrape roster page HTML for img src — HEAD probing misses higher suffix numbers (jackson04, young04, harris03) |
| Compound last-name mgaleg keys | Step 4 | Lewis Young→young04, White Holland→white01, Fraser-Hidalgo→fraser01 — pattern varies; always scrape to confirm |
| Baltimore City dual-tier | Step 3 | Like SF: returns G4110 (2404000) AND G4020 (24510) — assert BOTH in smoke tests |
| politician_photos bucket | Step 4 | Upload to 'politician_photos' bucket (NOT 'politician-headshots' — that bucket does not exist); path: {politician_id}-headshot.jpg |
| Peña-Melnyk headshot filename | Step 4 | mgaleg uses pena.jpg (strips Melnyk suffix and tilde); Jacobs J. filename has space → URL-encode |
| MD-GOV-04 NOT EXISTS guard | Step 5 | Multi-member district INSERT must guard on (district_id, politician_id) NOT (district_id, chamber_id) |
| discovery_jurisdictions cron_active | Step 6 | MD discovery_jurisdictions has no cron_active column; date-based eligibility is the correct mechanism |

**Maryland Key Facts:**
- FIPS: 24 (state='24' in geofence_boundaries; districts.state='md' for STATE/COUNTY tiers, 'MD' for NATIONAL)
- TIGER SLDL: 71 polygons (not 47 or 141 — sub-districts create extra polygons)
- TIGER SLDU: 47 polygons (1 per senate district)
- Legislature: 47 senators + 141 delegates (3 per whole district, split for A/B/C sub-districts)
- Constitutional officers (voter-elected): Governor, LG, AG, Comptroller
- State Treasurer: General Assembly-elected (is_appointed_position=true; NO race rows)
- Legislature headshots: mgaleg.maryland.gov/mgaleg-sys/images/officials/{year}/{lastname}{NN}.jpg
- Executive headshots: governor.maryland.gov official portraits (600x750 standard)
- Federal headshots: congress.gov primary + Wikimedia Commons fallback
- External ID scheme: exec -240001..-240005, senators -2410001..-2410047, delegates -2420001..-2420141, US House -2440001..-2440008
- US senators pre-existed under -400033 (Van Hollen) / -400034 (Alsobrooks)
- Elections site: elections.maryland.gov
- Legislature site: mgaleg.maryland.gov

---

## Massachusetts Quick Reference

**Read this before starting any MA city or state work. These traps are MA-specific — general playbook guidance above does not warn for them.**

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| G4040 COUSUB towns required | Step 3 | MA residents are split between 58 G4110 cities and 293 G4040 towns — both layers must be present or town residents get no LOCAL routing |
| G4110 already loaded — assert, do not reload | Step 3 | 58 G4110 cities were loaded in v5.0; loading again silently skips via ON CONFLICT DO NOTHING — run the zero-row assert gate, not the loader |
| Boston hybrid council (9 district + 4 at-large) | Step 1, Step 3 | Boston City Council has 9 single-member geographic districts (X0013 ArcGIS geofences, NOT in TIGER) + 4 at-large seats; do NOT model as all-at-large (Wikipedia is wrong) |
| Boston School Committee is APPOINTED | Step 1, Step 5 | School Committee members are mayor-appointed (is_appointed=true, election_method=NULL); the November 2024 ballot measure to elect SC members did NOT pass — model is appointment, not election; blank stances are expected (no public compass record) |
| malegislature.gov headshot HTML scrape | Step 4 | Official MA legislator portraits at malegislature.gov/People/{chamber} — scrape the page HTML for img src; do NOT HEAD-probe suffix numbers (same pattern as mgaleg.maryland.gov) |
| Municipal elections are odd-year | Step 2 | Most MA municipalities hold elections in odd-numbered years (2025, 2027, etc.); do NOT seed a 2026 city election without confirming from the city's election commission website |
| MA Tier 3 geo_id estimates wrong — always verify from DB | Step 5 | Plan estimates routinely mismatch DB geo_ids: Fall River 2522640→2523000, Waltham 2573440→2572600, New Bedford 2524000→2545000, Medford 2540115→2539835; always query geofence_boundaries before writing any migration |
| MA Tier 3 council structure varies — never assume at-large | Step 1 | Every Tier 3 city had a wrong council-structure assumption; Fall River assumed 3 at-large + 6 ward but is 9 all-at-large; Medford assumed mixed but is 7 all-at-large; Waltham assumed 9 but is 6 at-large + 9 ward (15 total); verify from official charter/site before migration |
| MA councillor spelling is city-specific | Step 5 | Single-L 'Councilor': Newton/Lynn/New Bedford/Fall River/Medford; double-L 'Councillor': Somerville/Waltham/Cambridge; no default is safe — verify from official website |
| MA CivicEngage/Revize + Cloudflare cities block all headshots | Step 4 | Newton (CivicEngage) HTTP 403 even with Chrome UA; Fall River (Revize) HTTP 200 but group-photo-only, 0 individual bios; Waltham (Cloudflare) HTTP 200 but body is 'Just a moment' — treat these as 100% headshot gaps; UA manipulation does not help |

**Massachusetts Key Facts:**
- FIPS: 25 (state='25' in geofence_boundaries; districts.state='ma' for STATE/COUNTY tiers, 'MA' for NATIONAL)
- G4110 cities loaded (v5.0): 58 — assert with zero-row gate before any G4110 reload attempt
- G4040 COUSUB towns loaded (v5.0): 293 (state='25', mtfcc='G4040') — assert with SELECT COUNT(*) gate
- Boston geo_id: 2507000 (G4110, in geofences since v5.0; no G4040 row — FUNCSTAT excludes Boston)
- Boston council district geo_ids: boston-ma-council-district-{1-9} (mtfcc=X0013, sourced from ArcGIS FeatureServer, NOT TIGER)
- Boston School Committee BPS geo_id: 2502790 (NCES LEAID 02790; mtfcc=G5420, direct INSERT pattern)
- Legislature: 40 senators (40 SLDU polygons) + 160 house reps (160 SLDL polygons)
- Legislature headshots: malegislature.gov/People/{chamber} — scrape roster HTML for img src (same pattern as mgaleg.maryland.gov; HEAD probing alone misses representatives with high suffix numbers)
- Boston headshots: boston.gov/departments/city-council (direct official JPEG; no WAF issues)
- Boston School Committee headshots: bostonpublicschools.org (best-effort; low coverage expected)
- Elections site: sec.state.ma.us (Secretary of State — authoritative for all MA elections)
- Primary 2026: 2026-09-08
- General 2026: 2026-11-03
- External ID scheme: Boston (Mayor + council) -2507000001..-2507000014, Boston SC -2502790001..-2502790007
- Tier 3 city geo_ids (DB-verified from v14.0): Newton 2545560, Somerville 2562535, Lynn 2537490, New Bedford 2545000, Fall River 2523000, Medford 2539835, Waltham 2572600
- Lynn councilor headshots: CivicLive CDN (cdnsm5-hosted2.civiclive.com); filenames may strip punctuation from last_name (MegieMaddrey.png, not Megie-Maddrey.png) — always HEAD-probe before computing filename from DB
- Medford Mayor headshot: medfordma.org finalsite.net CDN (1/14 officials — only Mayor Lungo-Koehn had individual bio); city and SC domain are distinct (city: medfordma.org; schools: mps02155.org — NOT medfordschools.org which had TLS failures)
- CivicEngage/Revize block (Newton, Fall River): 0 headshots; HTTP 403 or group-photo-only; server-side bot detection beyond UA; treat as 100% headshot gap
- Cloudflare JS challenge (Waltham): HTTP 200 with 'Just a moment... Enable JavaScript' body — 0 headshots; detect by checking response body for 'Just a moment' or 'Enable JavaScript'
- Wikipedia Commons headshots: require WIKIMEDIA_HEADERS descriptive bot UA (e.g., EmpoweredVoteBot/1.0; +https://empowered.vote); Chrome UA returns HTTP 429 (confirmed Lynn Mayor Nicholson, Phase 119)
- Next migration (end of v14.0): 699

---

## Nevada Quick Reference

**Read this before starting any NV city, county, or state work.** These traps are NV-specific — general playbook guidance above does not warn for them.

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| Custom ward MTFCCs per city | Step 3 | Las Vegas wards = X0015; Henderson wards = X0016; North Las Vegas wards = X0017 (Clark County GISMO PLACE=80); CCSD = G5420 (TIGER UNSD); the Strip is unincorporated Clark County (no city geofence) |
| Clark County is standalone, NOT under State of NV | Step 1, Step 5 | Clark County is a **separate government row** with its own `essentials.governments` entry (geo_id=32003); it does NOT roll up under the State of Nevada government. Single COUNTY district, state='nv' lowercase. Governs the unincorporated Strip/Paradise/Spring Valley/Sunrise Manor/Enterprise. |
| Per-city WAF map | Step 4 | **WAF-403** (need alt source): cityofhenderson.com (Akamai — per-member fallback chain); cityofnorthlasvegas.com (WAF-403 → Wikimedia fallback). **NO-WAF** (curl directly): flybouldercity.com; clarkcountynv.gov (AEM 175x175). No city website scrape confirmed for LV (gov.lasvegasnevada.gov — verify on next wave). |
| lowercase 'nv' casing everywhere | Step 3, Step 5 | All NV district rows (SLDU/SLDL/LOCAL/COUNTY tiers) use **`state='nv'`** (lowercase). Only STATE_EXEC and NATIONAL tiers use uppercase `'NV'`. Casing mismatch = silent routing failure. |
| Wikimedia requires descriptive bot UA | Step 4 | Wikimedia Commons headshots return HTTP 429 on a browser UA — use a descriptive bot UA (e.g., `EmpoweredVoteBot/1.0; +https://empowered.vote`). Same pattern as MA (Phase 119 Lynn Mayor confirmed). |
| Legislature surfaces via browse_state_officials=NV | Step 3 | NV legislature (21 senators + 42 assembly) is NOT in a city-grid entry in coverage.js. It surfaces automatically via `?browse_state_officials=NV` (STATE_NAME_TO_ABBREV has `nevada: 'NV'` → auto-builds COVERAGE_BROWSE_STATES). Do NOT add a separate legislature entry to COVERAGE_STATES. |
| School-board compass deferred by design | Step 5 | CCSD and any future NV school board: civic compass is not applied to school boards. Do NOT add compass stances; board stays listed/browsable but with no purple chip (hasContext omitted). |
| CCSD 4 appointed trustees lack headshots | Step 4 | 7 elected A–G trustees have headshots; 4 appointed trustees have no accessible official portrait. Accept as documented gap (not a structural defect). |
| Migration counter — stance migrations audit-only | Step 5 | NV stance migrations apply via raw `psql -f` (audit-only, unregistered) — same pattern as LA v15.0/v17.0. Do NOT register them in `supabase_migrations.schema_migrations`. The **on-disk file counter is authoritative** for "next migration". |

**Nevada Key Facts:**
- FIPS: 32 (state='32' in geofence_boundaries; districts.state='nv' for STATE/COUNTY/LOCAL/SLDU/SLDL tiers, 'NV' for STATE_EXEC/NATIONAL)
- Custom ward geofences: Las Vegas X0015 (6 wards), Henderson X0016 (4 wards), North Las Vegas X0017 (4 wards from GISMO PLACE=80)
- School district geofence: CCSD G5420 (TIGER UNSD), geo_id=3200060
- **ext_id schemes:**
  - Clark County Commission: -3200301..-3200307 (Chair Naft -3200301)
  - Controller (constitutional officer): -3200006
  - State Senate (SLDU): -3203001..-3203021 (21 senators)
  - State Assembly (SLDL): -3204001..-3204042 (42 assembly members)
  - City of Las Vegas: **-3205001..-3205007** (Mayor Berkley -3205001; 6 council -3205002..-3205007) — **DISTINCT from Henderson** (-3206xxx)
  - City of Henderson: -3206001..-3206005 (Mayor -3206001; 4 ward council -3206002..-3206005) — **DISTINCT from Las Vegas** (-3205xxx)
  - City of North Las Vegas: -3207xxx (Arabic ward numerals in district labels)
  - City of Boulder City: -3208xxx (at-large, no wards)
- **geo_ids:** Las Vegas 3240000 · Henderson 3231900 · North Las Vegas 3251800 · Boulder City 3206500 · Clark County 32003 · CCSD 3200060
- **Browse params:**
  - Statewide officials (legislature + execs): `?browse_state_officials=NV`
  - City or county: `browse_government_list=<geo_id>` (e.g., `?browse_government_list=3240000`)
  - CCSD: `?browse_geo_id=3200060&browse_mtfcc=G5420`
- Legislature headshots: archive.leg.state.nv.us/84th2027 (us_government_work, 63/63 legislators)
- Clark County Commission headshots: clarkcountynv.gov AEM (175x175 — upscale to 600×750)
- Elections site: nvsos.gov (Nevada Secretary of State)
- Next migration after v18.0 close: **1115** (on-disk counter authoritative; verify before writing migration)

---

## Wisconsin Quick Reference

**Read this before starting any WI city, county, state, or enrichment work.** Structural seeding for Wisconsin + Racine County is DONE (PR ev-accounts#88, migrations 1441–1461). What remains is almost entirely **enrichment**, and the traps below are what make WI enrichment different from every state before it.

### Enrichment status as of 2026-07-26 (measured, not estimated)

| Tier | Officials | Photos | Emails | Websites | Stances |
|------|-----------|--------|--------|----------|---------|
| State of Wisconsin | 144 | **144** (migration 1475 closed the last 9) | 132 | **0** | 0 |
| Racine County | 38 | 23 (migration 1472) | 26 (migration 1472) | **0** | 0 |
| City of Racine | 16 | **16** (migration 1473) | 15 + 1 web form (1473) | **0** | 0 |
| 16 other Racine Co. municipalities | 96 | 10 (migration 1474) | 56 (migration 1474) | **0** | 0 |
| WI 2026 candidates (`race_candidates`) | 322 | **0** | **0** | n/a | 0 |

**Villages & towns are DONE (migration 1474, applied 2026-07-26, idempotent).** Per-municipality result — emails are plentiful, portraits are not, which is the normal shape at this tier:

| Municipality | n | Photo | Email | Note |
|---|---|---|---|---|
| Rochester | 7 | **7** | 0 | High-res Google Cloud `juniper-media-library`; no emails published |
| Caledonia | 6 | 2 | **6** | Via the Munibit JSON API; 4 photos rejected (logo / declined) |
| Mount Pleasant · Waterford vil. · Wind Point · Elmwood Park · Sturtevant · Union Grove | 7 each | 0 | **7 each** | Emails only |
| Yorkville | 5 | 0 | **5** | Emails only |
| North Bay | 4 | 0 | 1 | Role inboxes only; President's stored, portfolio mailboxes not |
| Raymond | 5 | 0 | 1 | **All 5 API portraits are the village crest** — see gotcha |
| Burlington city | 9 | 1 | 1 | Names published, **zero** addresses; the 1 is Preusker's shared county row |
| Norway town | 5 | 0 | 0 | 5 portraits exist but only at 75×100 — declined |
| Dover town · Burlington town | 3 · 5 | 0 | 0 | Nothing published |
| **Waterford town** | 5 | 0 | 0 | **Not reached** — `tn.waterford.wi.gov` TLS handshake fails outright; retry later |

**Racine County enrichment is DONE (migration 1472, applied 2026-07-26, idempotent).** 23 headshots mirrored to the `politician_photos` bucket + 26 emails. The remaining 15 photo gaps are **source gaps, not work left**: D14 Hoffman and D18 McReynolds (county publishes an explicit `no picture` placeholder), the County Clerk / Treasurer / Register of Deeds (no portrait on their department pages), and all 10 circuit judges (the court-officials page lists names and branches only). Don't re-plan these without a new source. The 12 email gaps are the Treasurer, the DA, and the 10 judges.

**City of Racine enrichment is DONE (migration 1473, applied 2026-07-26, idempotent) — 100% coverage.** All 16 officials have a portrait and all have a contact route: 15 aldermen emails plus a `web_form_url` for Mayor Mason, who publishes no personal address. All four WI enrichment migrations (1472–1475) are audit-only (applied via `supabase db query --linked`, not registered in `supabase_migrations.schema_migrations`), so the on-disk counter stays authoritative — next free is **1476**. They were authored as 1468–1471 and renumbered after `check-migration-numbers.mjs` caught a collision on origin/master; **run that guard before every push** — this repo collides constantly.

Reproduce this table by joining `essentials.office_current_holder` (**never** `offices.politician_id`) → `politicians` → `chambers` → `governments WHERE state ILIKE 'WI'`, counting `politician_images`/`photo_custom_url`/`photo_origin_url`, `array_length(email_addresses,1)`, and `array_length(urls,1)`.

**Candidate photo gap is partly cosmetic:** the 97 sitting legislators who are also 2026 candidates reuse their officeholder `politicians` row, so the election card falls back to the politician photo even though `race_candidates.photo_url` is empty. Only genuinely new challengers are truly photoless.

### Traps

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| `racinecounty.gov` 403s to curl until you add **`--compressed`** | Step 4 | Pages, `showpublishedimage` headshots, and the officials-directory PDF all 403 to curl/WebFetch at any UA. Akamai just wants an `Accept-Encoding` header. **Browser UA + `curl --compressed` = 200 on everything.** No browser needed. |
| County emails are **entity-encoded in the href**, plaintext in the link text | Step 4 | A `/mailto:.../` regex on raw HTML matches nothing and looks like "no emails published." Parse the HTML (entities decode) or match link text `>(…@racinecounty\.gov)<`. Address drops middle names and is sometimes initials-only — never derive it. |
| Countywide officers publish **departmental inboxes**, not personal addresses | Step 4 | `RCExecutive@`, `RCClerk@`, `rod@`, `RCSheriff@`, `rcclerkofcourts@`. Stored deliberately in migration 1472 as the official contact route. Treasurer and DA publish nothing. Only the 21 supervisors have personal addresses. |
| Circuit judges have **no portraits anywhere** on the county site | Step 4 | The court-officials page lists all 10 judges with branch and start year, and nothing else. Accept as a documented source gap. Same page also lists 12 Reserve/Retired judges and the Court Commissioners — both **exclude** (not current / not elected). |
| County URL slugs carry the **previous** occupant's name | Step 1, Step 4 | "Visit District 1" → `/county-board-of-supervisors/nick-demske` but the page renders **Valena Lena Coleman**. The CMS retitles the page and keeps the old slug. Content is current; the slug is not. **Never derive a name from a racinecounty.gov URL.** |
| Three disagreeing name vintages on the county board | Step 1 | Roster display name (current) vs. link slug (previous occupant) vs. ArcGIS `REPNAME` (a third, older vintage). D3 is Osterman / `steve-smetana` / `TOM RUTKOWSKI` — three different people. Roster display name is authoritative. |
| ArcGIS `Photos` field is an **internal UNC path** | Step 4 | `Supervisor_Districts` layer `Photos` = `\\rcarcgis\ROD_stuff\supervisor_photos\*.jpg` — a file-server path, not a URL, unfetchable from anywhere. It is also the *stale* name vintage (D1 Coleman → `nickdemske1.jpg`). Use that layer for **geometry only**. |
| District **map** image is a portrait-shaped decoy | Step 4 | Each supervisor page carries the 384×384 headshot AND a district map (596×570, 513×607 — varies). An "pick the portrait-oriented image" heuristic grabs the map. Select on `alt` matching the official's name (lowercase, sometimes misspelled — Rossi's alt is `erinie rossi`). |
| City of Racine emails: different domain **and** mixed case | Step 4 | Site is `cityofracinewi.gov`; emails are `@cityofracine.org`, rendered `@CityOfRacine.org`. A case-sensitive regex found only 9 of 15. Match case-insensitively; normalise the domain on storage. |
| Racine city headshots are invisible to WebFetch (lazy-load) | Step 4 | All 15 aldermen have headshots, but every `<img src>` is an inline SVG data-URI placeholder with no `srcset`. Scan raw markup for the `media.cityofracinewi.gov` host. **`-L` is required** — the apex URL 301s. |
| City sources are 300×300 / 212×250 only — upscale needs sign-off | Step 4 | No larger variants exist (all probes 403). 2.5–3.0× Lanczos + unsharp; `headshots.md` requires sample approval before the batch. Approved 2026-07-26. |
| Mayor publishes a contact **form**, not an email | Step 4 | Use `politicians.web_form_url`. Do not guess an address and do not promote the aide's address listed under "Staff Info" into his record. |
| Dual officeholders share one `politicians` row | Step 4, Step 5 | Renee Kelly = County D2 + City D13; Tom Preusker = County D20 + Burlington city D4; Troy McReynolds = County D18 + Waterford village. Enrich once, keep the higher-resolution portrait, and **`array_append`** emails — a plain `SET email_addresses = ARRAY[…]` destroys the other tier's address. |
| A CMS will serve one placeholder as N people's portrait | Step 4 | Raymond's API gave all 5 officials the **village crest**; Caledonia gave Lambrecht the **village logo**. All returned 200 + valid images. `md5` the batch, reject repeated hashes, and eyeball a contact sheet. |
| Dynamic boards often have a public JSON API | Step 4 | Caledonia + Raymond render via Munibit; grep the HTML for `mwjsPeople` and call `app.membershipware.com/api/public/mwjsPeople?et=…&eb=…`. **Enumerate every block** — Raymond's first returns 1 of 5 people. Replaced the old screenshot workflow. |
| `<base href>` overrides relative image paths | Step 4 | Norway (Revize) images 404 if resolved against the page URL; the `<base>` tag points at the site root. |
| Two photo storage conventions coexist | Step 4 | Roster imports write `photo_custom_url`/`photo_origin_url`; the headshot pipeline writes `politician_images`. WI's legislature is 136 by the first, 5 by the second. Count both or you'll report phantom data loss. |
| **`photo_origin_url` is rendered as an `<img src>`** | Step 4 | ev-ui prefers `photo_origin_url` over `images[0].url`, so a source-PAGE URL there beats a good bucket image and breaks the portrait. Always set `photo_custom_url` alongside any `politician_images` insert. Fixed for 48 officials in 1475. |
| WI legislature photos are hot-linked off-site | Step 4 | 99 point at docs.legis **/2023/** (previous session), 33 at arbitrary media hosts; only 5 `politician_images` rows exist. Works today, but link-rot and licensing exposure. Mirroring is future work. |
| Village email schemes are all different; Sturtevant is inverted | Step 4 | Seven distinct local-part patterns across seven villages, and Sturtevant is `{surname}{initial}@` — backwards vs the rest. Nicknames (`bnash@` for Robert) break derivation entirely. Always scrape. |
| Emails are plentiful at village level, photos are not | Step 4 | 56/96 emails but only 10/96 photos across the 16 municipalities. Scope the tier accordingly. |
| Town of Waterford is unreachable | Step 4 | `tn.waterford.wi.gov` TLS handshake fails outright (curl 000 on every TLS version, openssl silent, browser refuses); `http://` 301s into it. 5 officials pending; site has been flaky before, so retry. |
| Racine city photo paths embed an unguessable timestamp dir | Step 4 | `…/uploads/2025/07/**02010109**/District-4-David-Maack.jpg`. The `District-{N}-{First}-{Last}` filename looks derivable but the timestamp segment is not. Scrape; never construct. Mixed `.jpg`/`.png`. |
| Legislator websites do not exist in **any** machine source | Step 4 | Open States returns empty `links`/`offices` for WI, and docs.legis has no website field either. That is why `urls=0` for all 144 state officials. Use the docs.legis profile page itself as the bio URL, or accept the gap. |
| Only **one** compass topic is tagged `local` | Step 5 | `compass.topics` has 21 rows total and exactly one (`housing`) with `'local' = ANY(level)`. Racine's 154 county+municipal officials have essentially nothing to be scored against. **Local stance work is blocked on topic-building first** — run `compass-topic-builder` (ev-accounts) before `research-stances`. |
| County pages publish officials' **home addresses** | Step 4 | Supervisor pages list personal street addresses and personal phones (e.g. "424 Lake Ave. Apt. 211"). Ingest the email only. Do not import home addresses or personal phone numbers. |
| Racine County Eye rate-limits WebFetch | Step 4 | Returns HTTP 429 to WebFetch. Use the browser pane. Best source for WI spring-election results and per-candidate Q&As. |
| In-page `fetch()` is **same-origin only** | Step 4 | The browser-pane workaround dies with `TypeError: Failed to fetch` if the tab is on a different origin. Navigate to the target origin *first*, then fetch. |
| School-board tier is not seeded and the loader can't cover it | Step 3 | WI has a three-tier school structure. `load-state-tiger-boundaries.ts` supports `unsd` (G5420) only — no `elsd` (G5400, 43 in WI) or `scsd` (G5410, 10 in WI). Rural Racine addresses sit in an elementary joint district **and** a union high district = two separate elected boards. New loader work, not an allowlist entry. |

### The Akamai workaround (reusable for any WAF-walled `.gov`)

Two factors, both required — a browser User-Agent **and** compression. Nothing else matters:

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
curl -sL --compressed -A "$UA" "$URL"      # 200 on pages, images, and PDFs alike
```

| Variant | Result |
|---------|--------|
| plain `curl` | 403 |
| `curl -A "<browser UA>"` (no compression) | 403 |
| `curl --compressed` (default UA) | 403 |
| **`curl --compressed -A "<browser UA>"`** | **200** |
| adding `Referer` / `Accept` / `Sec-Fetch-*` | no effect either way |

Verified 2026-07-26 on the roster page, per-supervisor pages, `showpublishedimage` binaries, and `showpublisheddocument/54564` — the officials-directory PDF previously recorded as permanently unreachable. This retired the browser-pane workaround entirely; all 23 headshots in migration 1472 were pulled with plain curl.

### Verified enrichment sources

**State tier photos are COMPLETE at 144/144 (migration 1475).** The last 9 were the 7 Supreme Court justices plus Ann Roe (AD 44) — i.e. mostly *not* a legislature problem:
- **Supreme Court:** `wicourts.gov/courts/supreme/justices/index.htm` → 450×550 portraits at `/courts/supreme/justices/images/{name}lg.jpg` (`karofsky`, `ziegler`, `rbradley`, `dallet`, `hagedorn`, `protasiewicz`, `crawford`). Per-justice bio pages are `/{name}.htm`. Only a 1.33× upscale.
- **Court of Appeals** uses the identical shape: `/courts/appeals/judges/images/{name}.jpg` (300×366) — that's the source for **Chris Taylor**, seeded ahead of her 2026-08-01 Supreme Court term so she isn't photoless on day one. Useful when Court of Appeals District II gets built.
- **Ann Roe** AD 44 = docs.legis ID **2889**. Her 150×200 source is not a defect: docs.legis serves 150×200 for *every* legislator, so any legislator mirror is a 4.0× upscale (the approved Maine Phase 52-03 ratio).
- **[VERIFY] Title drift:** wicourts lists **Jill Karofsky as Chief Justice**, but her `offices.title` is plain "Justice". The court also uses fuller names than the DB (Rebecca **Grassl** Bradley, Rebecca **Frank** Dallet, Annette **Kingsland** Ziegler, Janet **C.** Protasiewicz, Jill **J.** Karofsky) — candidates for `politician_name_aliases`. Neither was touched by 1475.

**State legislature (144 officials) — `docs.legis.wisconsin.gov`, fully machine-readable, no WAF:**
- Profile: `https://docs.legis.wisconsin.gov/2025/legislators/{assembly|senate}/{ID}` (numeric ID, e.g. `2870` = Rep. Subeck)
- **Photo is derivable from the profile URL:** append `.jpg` → `…/assembly/2870.jpg` (HTTP 200, `image/jpeg`, ~41 KB). This is the one WI headshot source you do *not* have to scrape.
- Email pattern `Rep.{LastName}@legis.wisconsin.gov` / `Sen.{LastName}@…`; also Madison office address, phone, fax, occupation, committee assignments, staff emails.
- **No website field** — see the `urls=0` trap above.
- Roster/party/district come from Open States (`OPENSTATES_API_KEY` already in `backend/.env`): `GET https://v3.openstates.org/people?jurisdiction=Wisconsin` → 135 rows, complete AD 1–99 / SD 1–33.

**Racine County (38 officials) — browser pane only:**
- Roster (authoritative for names): `racinecounty.gov/departments/county-board/county-board-of-supervisors-4659`. Names render **ALL CAPS** — title-case them, and preserve suffixes (`Q.A. SHAKOOR, II`).
- Per-supervisor pages: two coexisting URL schemes, `/county-board-of-supervisors/{stale-slug}` and `/county-board-supervisors/{name}-district-{N}`. Reach them from the roster's links; don't construct them.
- Headshot: the 384×384 `showpublishedimage/{docId}/{ticks}` whose `alt` matches the official. Doc IDs are opaque and **not** ordered by district (Rossi 12804, Coleman 12812).
- Email: `First.Last@racinecounty.gov` — but **middle names are dropped** ("Valena Lena Coleman" → `Valena.Coleman`), so scrape rather than derive.
- Circuit judges (10 branches): `racinecounty.gov/departments/clerk-of-circuit-court/info-resources/court-information/court-officials`. Exclude the 12 Reserve/Retired judges and the appointed Court Commissioners.

**City of Racine (16 officials) — `curl -sL` works, no browser needed. DONE in migration 1473:**
- Roster + all 15 headshots: `cityofracinewi.gov/government/city-leadership/common-council/cityalderman/` (grep the `media.cityofracinewi.gov` host — the `<img src>` values are lazy-load placeholders), plus `/mayor/` for Mason (`Mayor-Cory-Mason-2.webp`, 212×250).
- Per-member pages hold the email, phone, and a `term ends {Month} {Year}` string. **URL pattern is inconsistent** — districts 1 and 5–15 are `/district-{N}/`, but 2/3/4 are `/0{N}-district/`. Enumerate the roster's hrefs.
- Emails `First.Last@cityofracine.org`, rendered `@CityOfRacine.org` — match case-insensitively (see gotcha).
- Mayor's contact form: `cityofracinewi.gov/government/city-leadership/mayor/contact-the-mayor/` → `web_form_url`.
- All sources are 300×300 (aldermen) / 212×250 (mayor); no larger variants exist.

**Stances + candidate websites — Racine County Eye per-candidate Q&As:**
- Pattern `racinecountyeye.com/{yyyy}/{mm}/{dd}/{slug}/`, browser pane (429 to WebFetch). Coverage reaches down to village trustees.
- Each Q&A carries a **"Campaign Website"** field (the only working source for municipal `urls`), occupation/employer, and five substantive policy questions: role and representation, most critical issue facing the city, economic development vs. affordability, working through disagreement, and election integrity.
- **No candidate headshot in the article body** — the large images are ads and unrelated article thumbnails. Q&As give stances and websites, not photos.
- Answers are editorially "edited for clarity and punctuation," and the outlet is reader-funded — cite and link, do not reproduce wholesale. Route any quotes through the `audit-quotes` skill per `research-stances`.

**Wisconsin Key Facts:**
- FIPS 55. **`geofence_boundaries.state='55'`** (2-digit FIPS — filtering on `'WI'` silently returns almost nothing; the lone G4000 state row is the exception and uses `'WI'`).
- `districts.state` is lowercase `'wi'` for SLDU/SLDL/COUNTY/LOCAL tiers, uppercase `'WI'` for STATE_EXEC/NATIONAL. `governments.state` is uppercase `'WI'`. Don't "normalize" either.
- **geo_id collides three ways:** SLDU 55001–55033, SLDL 55001–55099, county FIPS 55001–55141. `55001` is Adams County AND Senate District 1 AND Assembly District 1 — disambiguated **only** by `mtfcc`, so every office↔district join must pin `mtfcc`/`district_type`.
- Custom geofences: `X-RC-SUP` (21 Racine County supervisor districts, geo_id `55101-sup-d{N}`). Custom polygons need `mtfcc LIKE 'X%'`, not in `('X0001'..'X0004')`, and `district_type IN ('LOCAL','COUNTY')` to route.
- Two COUNTY tiers coexist under `state='wi'` (72 G4020 + 21 X-RC-SUP).
- Racine County is 100% inside WI-1 (verified spatially). Overlaps SD 11/21/22 and AD 33/62/63/64/65/66. **AD 61 is Milwaukee-only, not Racine.**
- Elections: **WEC "Ballot Access Report"** is the authoritative candidate source (`elections.wi.gov/sites/default/files/documents/D.%20Ballot%20Access%20Report%20<date>.pdf`) — fetch and run `pdftotext -layout`; WebFetch returns raw bytes. It covers Gov/LtGov/AG/SoS/Treasurer/US House/State Senate/State Assembly **only**. County offices file with the **county clerk** and appear on sample ballots, not the WEC report.
- **Do NOT trust Ballotpedia for WI 2026** (had Godlewski in a race she'd left). WUWM per-office guides agreed with WEC.
- Judicial terms run **Aug 1 → Jul 31**; April winners are not seated until Aug 1. Supreme Court terms are exactly 10 years, so `term_start = expiry − 10 years`.
- Migration guard is mandatory: `BASE_REF=origin/master node backend/scripts/check-migration-numbers.mjs` (this WI work was renumbered three times). Guard diffs **committed** state.
- Still open: Court of Appeals District II polygon (`ST_Union` of 12 counties under a custom `X-` mtfcc); school-board tier; municipal judges (deliberately skipped when seeding towns/villages).

---

## Washington State Quick Reference

**Read before any WA state / Seattle / King County work.** ⚠ Not to be confused with the
**Washington County / West-Metro** section above, which is **Oregon**. This section is the state
of Washington (FIPS 53). Seeded 2026-08-13/14 (Seattle deep seed, EV-Accounts migs 1742–1759);
boundary of the milestone is recorded in `.planning/WA-GAPS.md`.

| Trap / Pattern | One-Line Summary |
|----------------|------------------|
| **MTFCC is INVERTED** | `sldu` → **G5210** (upper/Senate), `sldl` → **G5220** (lower/House) — the opposite of CA. Confirmed from the boundary names themselves; the spec had it backwards. |
| **geo_id is NOT unique across MTFCCs** | `53033` is King County (G4020) **and** LD33 Senate (G5210) **and** LD33 House (G5220). Join on `(geo_id, district_type, mtfcc)`, never geo_id alone. Same trap as Collin County TX. |
| Two state-column conventions, three values | `districts.state='wa'` (lowercase) for STATE_UPPER/STATE_LOWER/LOCAL/LOCAL_EXEC/COUNTY, but `'WA'` (uppercase) for STATE_EXEC. `geofence_boundaries.state='53'` (FIPS) for every TIGER layer, but **`'wa'` for the custom X0025/X0026 polygons**. `governments.state='WA'`. Don't normalize any of them. |
| The TIGER loader writes district rows itself | `writeDistrictRow=true` for sldu/sldl — all 98 legislative district rows existed before the structure migration. Don't re-create them. |
| `load-state-tiger-boundaries.ts` was a silent no-op on Windows | The isMainModule guard compared `import.meta.url` to a `file://${argv[1]}` template. Fixed with `pathToFileURL`. **Any state load attempted from this machine before 2026-08-13 did nothing.** |
| **House is multi-member** | 49 SLDL polygons cover 98 seats — Position 1 and Position 2 have separate ballot lines in the same district. The `NOT EXISTS` guard must key on `(district_id, title)`, not `(district_id, chamber_id)`. |
| **Senate is staggered** | Only **24** of 49 districts are on the 2026 ballot. Read the set from the SoS filed list — never infer it from district numbers. |
| `races` / `race_candidates` DO have unique indexes here | Contrary to the older playbook note. Check before choosing `ON CONFLICT` vs `NOT EXISTS`. |
| psql via backend `.env` runs as `ev_api` | It CAN insert into `essentials.*` but CANNOT do DDL there. Always verify counts through MCP afterwards. |
| **Seattle DOES have a 2026 race** | Council District 5 — Juarez was appointed 2025-07-28 to replace Cathy Moore and serves only until a successor is elected. The spec said Seattle had none. Otherwise Seattle is an odd-year city (next full cycle 2027, Districts 1–7). |
| King County moved to even years | 2022 charter amendment. Its **Sheriff is appointed** (2020 charter amendment) — no race row. Both King County and Seattle are **nonpartisan**, so `party IS NULL` is correct data, not a gap. |
| Nonpartisan county races can skip the primary | Races with ≤2 candidates never appear in the results feed — they exist **only** in the filings. |
| **`browse_state_officials=WA` does NOT return legislators** | It returns statewide executives + federal officials (41 rows — identical shape for OR and MD). The 147 legislators are reached **by address**, through their G5210/G5220 geofences. |
| The WA state banner was already a Seattle photo | Resolved the state/city collision by **moving the state banner off Seattle** (the ME/OR precedent), not by giving Seattle a non-skyline subject. |
| Seattle sponsorship is **weak** evidence | This inverts the MD/Berkeley rule: Seattle land-use bills are routinely mayor/SDCI-transmitted with a councilmember as nominal sponsor. Prefer a **divided roll-call vote** or a **member-sponsored amendment**. King County is the opposite — sponsor/mover is the strong filter there. |
| Legistar caps result sets at ~1,000 rows | `events?$filter=EventDate ge 2023-01-01` returned exactly **999**. Index **year by year** and verify by summing, or a wider window truncates silently. |
| **Vote labels differ by Legistar client** | Seattle uses `In Favor`/`Opposed`; King County uses `Yes`/`No`. Hard-coding one pair returns **0 divided votes**, which is indistinguishable from a council that never disagrees. Always print every label seen. |

**Washington Key Facts:**

- FIPS **53**. Governments: State of Washington `53` (7 chambers / 152 offices) · City of Seattle `5363000` (3 / 11) · King County `53033` (6 / 14, standalone — NOT under the state).
- Geofences loaded: **281** G4110 places · **39** G4020 counties · **10** G5200 congressional · **49** G5210 Senate · **49** G5220 House · **7** X0025 Seattle council · **9** X0026 King County council.
- Statewide executives seeded: Governor, Lieutenant Governor, Attorney General, Secretary of State, Treasurer. ⚠ **The other 4 of WA's 9 are not seeded** (Auditor, Commissioner of Public Lands, Insurance Commissioner, Superintendent of Public Instruction) — see `.planning/WA-GAPS.md`.
- External id bands: execs `-5300001..-5300005` · Senate `-5310001..-5310049` · House `-5320001..-5320098` · Seattle `-5363001..-5363011` · King County `-5303301..-5303314`.
- Election row: **`WA 2026 Statewide General`**, id `51e7a875-bff9-4e96-adcf-41736454d25d`, state `WA`, 2026-11-03 — **140 races / 382 candidates** (98 WA House + 24 WA Senate + 10 U.S. House + 7 King County + 1 Seattle). Every candidate carries `provisional_until = 2026-08-24`; **gate the cull on the certified canvass**, not the primary date.
- Results API: `results.votewa.gov/results/public/api/elections/{jurisdiction}/{id}/data` — host is **results.votewa.gov**, NOT results.vote.wa.gov (which 404s everything). Jurisdictions `washington` / `king-county-wa`; primary id `20260804`.
- Filings: `voter.votewa.gov/CandidateList.aspx?e=898` (primary) / `899` (general). The grid paginates at 100 of 1,108 — drive its Export-to-CSV button by replaying the whole form with the submit button's value set to a single space. Script: `C:/EV-Accounts/backend/scripts/export-wa-sos-filings.mjs`. ⚠ The county filter does NOT apply to the export — attribute county races by **race name**, never by mailing address (candidates share campaign PO boxes across counties).
- Headshots, all hosts **NO-WAF**: legislature `leg.wa.gov/memberphoto/{wslId}.jpg` (900×1200; `/memberthumbnail/` is only 150×200, legacy `/PublishingImages/` is dead) · King County bio-page "1600×700 banner" **is** a letterboxed studio headshot with the subject **off-centre** — crop around the face, never the frame centre · seattle.gov is AEM-style with zero `img` tags and only 300×300 portraits. Subject-aware cropper: `C:/EV-Accounts/backend/scripts/headshot-smartcrop.py`.
- seattle.gov filename traps: Foster has an encoded space, Strauss is misspelled "Struass", and member pages carry staff photos with **mismatched alt text**.
- Banners: `states/WA.jpg` Hurricane Ridge, Olympic NP (anchor 0.68) · `cities/seattle.jpg` Kerry Park (the previous state banner bytes) · `cities/king-county.jpg` Snoqualmie Falls (anchor 0.45). `CURATED_LOCAL` is keyed by lowercased `representing_city`/`browse_label` **substring, not geo_id**.
- Stance corpora: `seattle.legistar.com` and `kingcounty.legistar.com` (⚠ King County **attachments** live on `kingcounty.legistar1.com`, with the `1`). `MatterHistoryTally` is null on Seattle matters — screen divided votes with the per-matter roll call.
- Browse: city/county `?browse_government_list=<geo_id>&browse_label=<Label>&browse_state=WA`; state `?browse_state_officials=WA`; legislators by address only.

---

## Step 1: Government Structure Research

Before touching the database, confirm how the city government is structured.

### Required questions

- [ ] What is the form of government? (Strong Mayor-Council, Council-Manager, Commission, Town Meeting, other)
- [ ] List all elected offices: city council (ward-based, at-large, or mixed), school committee, mayor, other
- [ ] Is the Mayor directly elected by voters, or selected from within the council after the council election?
- [ ] If Mayor is council-selected: does the Mayor also hold a council seat, or is Mayor a separate role that replaces their council seat?
- [ ] Is there an appointed City Manager or Administrator? Who holds the position currently?
- [ ] Are there appointed positions that should appear in lookup results (City Attorney, City Clerk, etc.)?
- [ ] What are the current incumbents for each elected office (full legal names, term start dates)?
- [ ] Has the city's charter changed in the last 5 years? If yes, confirm the current structure from the official charter document — not Wikipedia.

> [GOTCHA] **[STATE-SPECIFIC: CA] CA government row + 8 chambers + 8 politicians may already exist in production:** The State of California government row, all 8 executive chambers, and all 8 executive politicians were seeded before v7.0. Before writing any CA state-level government migration, run: `SELECT id, geo_id FROM essentials.governments WHERE name = 'State of California'`. If it returns a row with `geo_id=NULL`, apply an UPDATE — do not INSERT. CA chamber names use short form ('Governor', not 'California Governor'). CA constitutional officer politician rows also pre-existed under positive external_ids; do not assume the -06000xxx range is empty. Phase 59 migration 189 was written entirely as WHERE NOT EXISTS + UPDATE guards — use this as the CA state-level migration template.

> [GOTCHA] **[STATE-SPECIFIC: OR] Portland 4-district RCV multi-member council structure:** Portland's November 2024 charter reform (effective January 2025) replaced the old 5-seat at-large council with 4 geographic districts × 3 seats each (12 total council seats) elected by RCV. An agent using pre-reform Wikipedia data would model Portland as a 5-seat at-large body with plurality voting — completely wrong. The authoritative roster must come from `portland.gov/auditor/elections/elected-city-officials` (the CONTEXT.md D-06 roster had 9 wrong names). Article 2-201 of the 2024 charter lists only 3 elective offices: Mayor, Auditor, and 12 Councilors. Government name must be `'City of Portland, Oregon, US'` to distinguish from `'City of Portland, Maine, US'` already in DB. Phase 77 confirmed this structure.

> [GOTCHA] **[STATE-SPECIFIC: MD] State Treasurer is elected by the General Assembly — not by voters — AND the delegate count is 141 across 47 districts (3 per polygon):** Maryland's State Treasurer (Dereck Davis) is elected by the General Assembly, not by voters. Modeling this office as voter-elected and creating race rows would display a fake election that does not exist. Set `is_appointed_position=true` on the State Treasurer office row and create zero race rows for that chamber. Maryland Governor, LG, AG, and Comptroller ARE voter-elected — only the Treasurer is legislature-elected; do not copy Maine's pattern of treating the AG as appointed. Separately: the MD House of Delegates has 141 positions across 47 geographic districts — most districts have 3 delegates sharing a single TIGER SLDL polygon. TIGER loads 71 SLDL polygons (whole districts = 1 polygon, A/B/C sub-districts = separate polygons). The NOT EXISTS guard for delegate INSERTs must check `(district_id, politician_id)` — NOT `(district_id, chamber_id)`, which blocks all but the first delegate per district. Phase 92 + Phase 93 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: MA] Boston City Council is a HYBRID body (9 district seats + 4 at-large seats) — NOT all at-large; Mayor Wu is LOCAL_EXEC (directly elected by voters, not council-selected):** Wikipedia and pre-2024 secondary sources describe Boston City Council as an at-large body — this is wrong. Boston City Council has 9 single-member geographic district seats (elected by district voters) and 4 city-wide at-large seats (13 total). The Mayor of Boston (Michelle Wu) is directly elected by voters and is a separately-elected executive (district_type=LOCAL_EXEC, is_appointed_position=false) — Boston does NOT use a Council-Manager form of government. Do NOT model Boston using the Cambridge pattern (Cambridge Mayor is council-selected, district_type=LOCAL, is_appointed_position=true). For district councillors: link each to their district's geo_id (boston-ma-council-district-{N}). For at-large councillors and Mayor: link to geo_id='2507000'. Phase 108-01 confirmed structure from official Boston.gov sources.

> [GOTCHA] **[STATE-SPECIFIC: MA] Boston School Committee members are APPOINTED by the Mayor — not elected — despite a 2024 ballot question narrative:** Boston School Committee (7 members) members are appointed by the Mayor of Boston (is_appointed=true). The November 2024 ballot question on school committee elections received significant media coverage — an agent reading those news articles could incorrectly model the School Committee as elected-since-2024. That ballot question did NOT pass; the appointment model from 1991 remains in effect as of v13.0 (2026-06-10). Set is_appointed=true on all 7 politician rows; set election_method=NULL on the School Committee chamber row (no election_method for an appointed body); create zero race rows. External IDs: -2502790001..-2502790007 under BPS geo_id='2502790' (NCES LEAID 02790). G5420 geofence is a direct INSERT (no MA G5420 TIGER loader exists — same pattern as ACPS migration 313). Blank compass stances are expected and appropriate for appointed members with no public policy record. Phase 108-02 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: MA] MA Tier 3 council structure assumptions were wrong for every city — verify from official charter/site before writing any migration:** Every v14.0 Tier 3 city had a wrong council-structure assumption in the planning documents. Fall River was assumed to have 3 at-large + 6 ward councilors — it actually has 9 all-at-large (no ward seats at all). Medford was assumed to have a mixed structure — it is 7 all-at-large. Waltham was assumed to have 9 councilors — it actually has 6 at-large + 9 ward = 15 total. An agent seeding the wrong structure creates extra office rows, wrong titles, and a mismatch between the displayed council and the actual elected body. Always verify council structure from the city's official website or city charter before writing any migration — not from Wikipedia, Ballotpedia, or planning estimates. Phase 121 confirmed all three mismatches.

> [GOTCHA] **[STATE-SPECIFIC: MA] Somerville School Committee has TWO ex-officio members (Mayor AND Council President) — not just Mayor:** Most MA cities with a Mayor ex-officio on the School Committee have exactly one ex-officio member. Somerville has two: Mayor Jake Wilson AND Council President Lance Davis. This requires a different seeding pattern than Newton/Lynn/Medford (which have Mayor-only ex-officio). The external_id back-fill range for elected SC members must exclude BOTH ex-officio external_ids to avoid overwriting their canonical office_ids. An agent copying the Newton/Lynn one-ex-officio SC pattern for Somerville would overwrite the Council President's city council office_id with the SC office_id. Always check the city's school committee enabling legislation or official site to confirm the number of ex-officio members. Phase 118-02 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: NV] Clark County is a STANDALONE county government — NOT under the State of Nevada government row:** When seeding Clark County, do NOT link its government row to the State of Nevada. Clark County is a fully independent `essentials.governments` entry with its own geo_id (32003) — the same standalone-county pattern as any other county government that browses independently. Its Board of County Commissioners attaches to a single COUNTY district (districts.state='nv' lowercase). All officials in the unincorporated Strip, Paradise, Spring Valley, Sunrise Manor, and Enterprise fall under Clark County, not any incorporated city. Phase 161 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: NV] Each NV city uses a DISTINCT custom ward MTFCC — Las Vegas X0015, Henderson X0016, North Las Vegas X0017 — do NOT mix them up:** Nevada's Clark County cities each have their own custom ward-geofence MTFCC that must be kept distinct. Las Vegas uses X0015 (6 wards), Henderson uses X0016 (4 wards), North Las Vegas uses X0017 (4 wards, sourced from Clark County GISMO PLACE=80). Reusing one city's MTFCC for another city's wards would merge their routing — a Henderson ward address would return Las Vegas council members. Always assert the correct MTFCC in the post-load smoke test. Clark County School District uses G5420 (TIGER UNSD, the standard school-district MTFCC). The unincorporated Strip has NO city-ward geofence — it routes through the Clark County (32003) G4020 boundary. Phases 162–164 confirmed these MTFCCs.

> [GOTCHA] **[STATE-SPECIFIC: NV] NV district casing is lowercase 'nv' everywhere EXCEPT STATE_EXEC and NATIONAL tiers:** All NV district rows for LOCAL, COUNTY, STATE_UPPER, and STATE_LOWER tiers use `districts.state='nv'` (lowercase). STATE_EXEC offices (Governor, Lt. Gov, AG, etc.) and NATIONAL offices (US Senators, US House members) use `state='NV'` (uppercase). This matches the casing rule established in OR/ME/UT and is set by the TIGER loader's `abbrev`/`abbrevUpper` variables. After seeding any new NV tier, spot-check: `SELECT DISTINCT state FROM essentials.districts WHERE state ILIKE 'nv'` — any uppercase STATE/COUNTY/SLDU/SLDL row is a bug. Phase 158 (TIGER loader) + Phase 160 (legislature) confirmed. Violating this causes silent routing failures (all district lookups return empty).

### Schema decisions to record before migrating

| Decision | Your Answer |
|----------|-------------|
| Form of government | |
| Mayor district_type | LOCAL or LOCAL_EXEC (use LOCAL if Mayor is not a separately-elected executive; use LOCAL_EXEC only if Mayor is the primary executive AND directly elected) |
| Mayor is_appointed_position | true or false |
| City Manager exists? | yes / no — if yes, is_appointed = true on politician row |
| School Committee elected seats | count |
| Council seats total | count |
| Ward-based, at-large, or mixed? | |

> **Cambridge example:**
> - Form of government: Council-Manager (Plan E)
> - Mayor district_type: LOCAL (NOT LOCAL_EXEC — Cambridge Mayor is NOT a separately elected executive; they are selected from within the 9-councillor body by the councillor who received the most first-choice votes)
> - Mayor is_appointed_position: true on the Mayor office row
> - City Manager: Yi-An Huang, is_appointed = true
> - School Committee: 6 elected seats (Mayor is NOT an automatic member under the 2025 charter — confirm the specific charter version before seeding)
> - Council seats: 9 at-large (no ward-based districts)

### Sources for government structure

1. Official city website — mayor's office, city council, city manager pages
2. City charter document (PDF from official city website)
3. MMA Data Hub (mma.org) — fastest cold-start for MA cities; check for your state's equivalent municipal association
4. Ballotpedia city page (check: many smaller cities are not covered)
5. DO NOT use Wikipedia as primary — it lags charter changes by months

---

## Step 2: Election System Confirmation

Confirm the election mechanics before seeding any election or race rows.

### Required questions

- [ ] What is the election method? (Plurality, Ranked-Choice/IRV, STV/Proportional Ranked-Choice, Runoff, other)
- [ ] [GOTCHA] `election_method` is a TEXT column on `essentials.chambers` — it is **NOT** enforced by a pg_constraint CHECK constraint. The `SELECT constrname, consrc FROM pg_constraint...` query returns nothing useful for this column. To verify valid values, check the [elections-seed template reference block](.planning/templates/elections-seed.md). Do not run the pg_constraint query for election_method verification.
- [ ] [GOTCHA] **RCV jurisdictions: `election_method='rcv'` belongs on the CHAMBER row, not just the race.** Election method is a property of the body (how the seat is filled), not the contest. If you only set it on the race and leave the chamber default as `'plurality'`, the display logic will show the wrong voting method for the city. In Maine, Portland's Mayor, Auditor, and at-large Council chamber rows all require `election_method='rcv'` (Phase 53). For your state: confirm election method per chamber before writing any SQL — an RCV city that has even one plurality chamber (e.g., school board) requires per-chamber verification. **[STATE-SPECIFIC: CA]** Set `election_method='rcv'` at structure-seed time — do not defer to a follow-up migration. Berkeley (Phase 68) deferred this and required a second migration pass to correct. CA RCV cities: SF (Mayor + all 11 BoS districts + City Attorney + DA + others), Berkeley (Mayor, City Council, City Auditor), San Jose (Mayor + City Council).

> [GOTCHA] **[STATE-SPECIFIC: CA] CA jungle primary — ONE unified race row for ALL candidates:** California's top-two primary puts all candidates from all parties into a single unified primary race. Do NOT create separate "CA Governor Democratic Primary" or "CA Governor Republican Primary" rows — there is no party-specific primary ballot in CA. Use ONE `races` row per office (e.g., "CA Governor Primary 2026") and link ALL candidates as `race_candidates` to that single row. `sos.ca.gov` is the authoritative source — not Ballotpedia, which uses confusing top-two terminology. Post-primary: update the general election race to show only the top 2 finishers. Phase 62 confirmed this pattern for the CA Governor 2026 race.

> [GOTCHA] **[STATE-SPECIFIC: OR] Portland 2026 ballot covers only D3/D4/Auditor — NOT Mayor or D1/D2 (staggered charter reform terms):** Portland's 2024 charter reform intentionally staggered council terms. Districts 3 and 4 received 2-year initial terms (up for election November 3, 2026). Mayor Wilson and Districts 1 and 2 received 4-year terms (NOT up in 2026). An agent assuming all 12 council seats are on the 2026 ballot would create 7 wrong race rows for Mayor + D1 + D2 that do not exist. Research staggered term start dates from official charter before creating race rows. 2026 Portland races: D3 Seats A/B/C + D4 Seats A/B/C + City Auditor = 7 races total. Use OFFSET 0/1/2 on ORDER BY o.id to enumerate 3 distinct office_ids per district (no other discriminator exists between the 3 seats within a district). Mayor+D1+D2 are on the 2028 ballot (4-year terms). Phase 79 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: CA] lavote.gov election ID changes every cycle — two updates per year required:** The LA County discovery pipeline depends on `discovery_jurisdictions.source_url` containing a lavote.gov election ID (e.g., `?id=4338`). The June primary and November general each get a DISTINCT ID. After each LA election, browse lavote.gov, extract the current URL parameter, and run: `UPDATE essentials.discovery_jurisdictions SET source_url = '...?id=<NEW_ID>' WHERE id = '9fd492a8-895e-4bd7-91e7-81f9bfa2b3e2';`. Two updates per year — June AND November. Phase 62 confirmed June 2026 ID = 4338; the November 2026 general ID is pending post-June update.

- [ ] Are elections held in odd-numbered years, even-numbered years, or off-cycle? (Do not assume even-year alignment with state/federal elections)
- [ ] When was the last municipal election? When is the next?
- [ ] Are municipal races partisan (party labels on ballot) or nonpartisan?
- [ ] Approximately how many candidates typically file per race? (Affects UI load testing requirements)
- [ ] For multi-seat races (council, school committee): how many seats per race?

### Schema decisions to record before migrating

| Decision | Your Answer |
|----------|-------------|
| election_method TEXT value | |
| Is election_method value a known valid TEXT value? | yes / no — check the [elections-seed template](.planning/templates/elections-seed.md) reference block |
| Last election date | YYYY-MM-DD |
| Next election date | YYYY-MM-DD |
| Partisan or nonpartisan? | |
| Candidate count per major race | ~N candidates |

> **Cambridge example:**
> - Election method: stv_proportional (Single Transferable Vote — Cambridge has used STV since 1941, the longest-running STV jurisdiction in the US)
> - Verify enum exists in DB before migrating — stv_proportional may not be in the constraint yet
> - Last election: November 4, 2025
> - Next election: November 2027 (Massachusetts law requires municipal elections in odd-numbered years — there is NO Cambridge city election in 2026; do not seed a 2026 date)
> - Nonpartisan (candidates have no party label on the ballot, though affiliations are widely known via endorsements)
> - Cambridge City Council 2025: 19 candidates for 9 seats
> - Cambridge School Committee 2025: 18 candidates for 6 seats
> - Warning: 37 total candidate cards on the elections page — pre-validate UI at this scale before seeding election data

**Critical:** Confirm the next election date from the city's election commission website, not from state-level sources. Many cities have off-cycle dates within their state's municipal calendar.

---

## Step 3: Geofence Sources

Identify what boundary data you need and where to get it.

### Required questions

- [ ] What is the city's GEOID? (7-digit Census place code — look up at census.gov or data.census.gov; do NOT use the county FIPS code)
- [ ] How many state senate districts split the city? (Test 3+ addresses spread across the city at malegislature.gov/Search/FindMyLegislator or your state's equivalent)
- [ ] How many state house districts split the city? (Same method — cities can be split by more districts than expected)
- [ ] How many congressional districts split the city?
- [ ] For TIGER boundaries: does `load-state-tiger-boundaries.ts` already allowlist this state? (Check `STATE_LAYER_ALLOWLIST` in `C:\EV-Accounts\backend\scripts\load-state-tiger-boundaries.ts`)
- [ ] Is a verification source available for state legislative boundaries? (e.g., MassGIS for MA, CalGIS for CA, Texas Legislative Council for TX)

### Schema decisions to record before migrating

| Decision | Your Answer |
|----------|-------------|
| City geo_id (7-digit place code) | |
| County FIPS (5-digit, for G4020 congressional intersection) | |
| State senate district count covering city | |
| State house district count covering city | |
| Congressional district count covering city | |
| TIGER allowlist addition needed? | yes / no |
| Verification source URL for state districts | |

> **Cambridge example:**
> - City geo_id: 2511000 (NOT 25017 — that is Middlesex County; the county FIPS is a 5-digit code, the city place code is 7 digits)
> - Middlesex County FIPS: 25017 (needed for congressional G4020 intersection support)
> - State senate: 2 confirmed + 1 probable (Cambridge spans Second Middlesex + at least one additional — verify third by testing Cambridge Ward 1-7 addresses at malegislature.gov/Search/FindMyLegislator)
> - State house: 3 confirmed (24th Middlesex/Rogers, 25th Middlesex/Decker, 26th Middlesex/Connolly) + up to 3 partial edge districts
> - Congressional: 2 districts (MA-05 Clark + MA-07 Pressley — verify the split before seeding)
> - TIGER allowlist addition needed: yes — add `MA: new Set(['cd', 'sldu', 'sldl', 'place'])` to STATE_LAYER_ALLOWLIST in load-state-tiger-boundaries.ts
> - Verification source: MassGIS 2021 shapefiles (these ARE the current effective post-2020-redistricting boundaries despite the 2021 label); use malegislature.gov/Search/FindMyLegislator to spot-check at least 4 Cambridge addresses in different wards

**State-level onboarding (legislatures, executive chambers):** Before onboarding individual cities in a new state, run the TIGER loader for the whole state first — CD + SLDU + SLDL + PLACE + COUNTY layers in one loader run. City-level work depends on state district rows existing first. Maine onboarding example: Phase 49-01 loaded 23 cities (G4110) + 2 CD + 35 SLDU + 151 SLDL + 16 counties in a single run before any city migration began.

> [GOTCHA] **[STATE-SPECIFIC] TIGER congressional file naming varies by state:** The loader key may not be `cd` — always browse `https://www2.census.gov/geo/tiger/TIGER2024/CD/` and check the actual filename for your state FIPS before configuring `STATE_LAYER_ALLOWLIST`. In Maine, the congressional file is `tl_2024_23_cd119.zip` — the correct loader key is `cd119`, not `cd`. Using the wrong key causes a silent no-op: the loader runs without error but loads zero boundaries. **[STATE-SPECIFIC: OR]** OR also uses `cd119` (same loader key as ME). Additionally: the OR G4110 PLACE count is 241 (not 242 as estimated from TIGERweb). Always dry-run the place layer first — the MtfccAssertionError output from the dry-run gives the actual count. Update the count in all 3 files (loader config, verify SQL, smoke test) before running the live load. Phase 72 confirmed: dry-run set to 242 → MtfccAssertionError; actual = 241; updated all 3 files → live run passed with "241 boundaries inserted".

> [GOTCHA] **`districts.state` casing is set by the loader's `abbrev`/`abbrevUpper` variables — verify before running:** The loader writes lowercase state abbreviation (e.g., `'me'`) for STATE_UPPER, STATE_LOWER, COUNTY, and LOCAL tiers, but uppercase (e.g., `'ME'`) for NATIONAL_LOWER (congressional). This is controlled by the `abbrev` (lowercase) and `abbrevUpper` (uppercase) variables in the loader config. If you misconfigure these — or copy from a prior state without checking — district rows will have the wrong casing, which breaks routing queries that filter on `districts.state`. In Maine, STATE_UPPER/STATE_LOWER rows use `'me'` (lowercase) and NATIONAL_LOWER rows use `'ME'` (uppercase). Always verify loader config before running and spot-check `SELECT DISTINCT state FROM essentials.districts WHERE ...` after. **[STATE-SPECIFIC: CA]** Pre-existing CA state legislature district rows use `state='CA'` (uppercase) — CA was seeded before the TIGER loader lowercase-abbrev pattern was established. Migration JOINs filtering on `d.state` must match: use `'CA'` for CA STATE_UPPER and STATE_LOWER rows. Phase 61 confirmed that `WHERE state='ca'` returned 0 rows — the actual data has `state='CA'`.

> [GOTCHA] **[STATE-SPECIFIC: CA] CA mtfcc swap — STATE_UPPER=G5220, STATE_LOWER=G5210 (inverse of standard TIGER codes):** Pre-existing CA district rows have `mtfcc='G5220'` for STATE_UPPER (senate) and `mtfcc='G5210'` for STATE_LOWER (assembly) — the inverse of standard TIGER codes. Do NOT attempt to correct this — it would require re-seeding 120 CA district rows and re-linking all offices. Do NOT join on `d.mtfcc` for CA routing queries — routing uses `gb.mtfcc` (from `geofence_boundaries`), making the `d.mtfcc` column irrelevant. Smoke tests for CA routing must use the essentialsService join pattern. Phase 61 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: Maine] Cities (G4110 PLACE) vs. towns (G4040 COUSUB) in TIGER:** In Maine, only 23 cities are incorporated places (G4110). The majority of Maine residents live in G4040 COUSUB towns — which are NOT loaded in a G4110-only TIGER run. Loading only the G4110 layer means most rural and suburban residents get no LOCAL district routing. This is a Maine outlier: in states like Texas or California, almost all residents live in incorporated G4110 places. For your state: check the Census TIGER documentation for how your state's municipalities are classified before deciding which TIGER layers to load. In Maine, Phase 49 loaded G4110 only — Phases 48 (MA) and 49 (ME) document the G4110 vs. G4040 distinction. If your state has significant COUSUB population, add the G4040 COUSUB layer to the loader run. **[STATE-SPECIFIC: CA]** CA G4040 records are all FUNCSTAT='S' (Census County Divisions — statistical areas, not active governments). Do NOT add 'CA' to `COUSUB_FUNCSTAT_STATES` — that filter would skip ALL 404 CA G4040 records, loading zero cousub boundaries for CA. CA G4040s load without FUNCSTAT filtering; the loader correctly handles this via the state-conditional check. Phase 57 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: CA] DataSF Socrata vs ArcGIS MapServer — outSR=4326 required for ArcGIS endpoints:** CA city open data APIs use two different GIS backends. DataSF Socrata (SF, Berkeley): returns native WGS84 — do NOT add `outSR=4326`; district field is `sup_dist_num` (float, e.g. `11.0` — use `parseInt(String(...))`) for SF, or `district` (lowercase string) for Berkeley. ArcGIS MapServer (Sacramento, San Diego, Fremont, San Jose; LA County GeoHub also uses ArcGIS — anticipated but not confirmed via city deep seed): returns CA State Plane feet by default (SRID 2229) — MUST add `outSR=4326`. Silent failure mode: omitting `outSR=4326` returns coordinates in feet (X≈6,900,000, Y≈2,100,000); PostGIS accepts the insert but ST_Covers returns zero rows for every address lookup — smoke test is the only catch. WGS84 confirmation: lon≈-122.xx, lat≈37.xx for Bay Area; lon≈-118.xx, lat≈34.xx for LA. Phases 63/65/66/67/68 confirmed per city.

> [GOTCHA] **[STATE-SPECIFIC: CA] SF consolidated city-county returns BOTH G4110 and G4020 for any SF address:** San Francisco is a consolidated city-county. Any SF address lookup returns BOTH a G4110 row (geo_id=0667000, "San Francisco city") AND a G4020 row (geo_id=06075, "San Francisco County"). This is correct TIGER behavior — not a duplicate or routing error. A smoke test asserting "exactly one G4110 row" or "no G4020 row" for an SF address will fail incorrectly. Correct assertion: assert BOTH G4110 (geo_id=0667000) AND G4020 (geo_id=06075) are present for any SF address. No other CA city behaves this way. Phase 57 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: OR] Portland council district boundaries are NOT in TIGER — source from PortlandMaps ArcGIS MapServer Layer 17:** Portland's 2024 charter reform created 4 new multi-member council districts (Districts 1-4, 3 seats each) effective January 2025. These districts are NOT in TIGER 2024. Loading only TIGER data for Portland leaves ALL council district routing broken — a Portland address returns no LOCAL district match. Source boundaries from PortlandMaps ArcGIS MapServer Layer 17 using a per-OBJECTID fetch loop (4 HTTP calls, one per district). Load with `outSR=4326` (ArcGIS returns State Plane by default). Apply `ST_MakeValid()` because Districts 1 and 4 have source GeoJSON self-intersections that cause `ST_Covers` to silently return 0 rows. Endpoint: `https://www.portlandmaps.com/arcgis/rest/services/Public/Basemap_2011_New/MapServer/17` — OBJECTID 1-4 = Districts 1-4. mtfcc=X0012, geo_ids: `portland-or-council-district-{1-4}`. Portland City Hall (-122.6794, 45.5231) → portland-or-council-district-4 (District 4, not District 1). Phase 76 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: OR] Portland City Hall routes to District 4, not District 1 — always use confirmed DB routing, never assume:** The Portland City Hall coordinate (-122.6794, 45.5231) routes to `portland-or-council-district-4` (District 4). An agent assuming "City Hall = District 1" (e.g., from its proximity to the historic core) would write an incorrect smoke test gate that silently fails. Always commit the confirmed routing result as the smoke test assertion, not a derived assumption. Smoke gate: `ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-122.6794, 45.5231), 4326))` → `portland-or-council-district-4`. Phases 76 and 77 confirmed this value.

> [GOTCHA] **[STATE-SPECIFIC: MD] Baltimore City is a dual-tier entry (G4110 + G4020) — AND the SLDL polygon count is 71, not 47 or 141:** Baltimore City is both a G4110 incorporated place (geo_id=`2404000`) AND a G4020 independent city-county (geo_id=`24510`). Any Baltimore City address lookup returns BOTH rows — similar to SF's consolidated city-county. An assertion of "exactly one local row" or "no G4020 row" for a Baltimore City address will fail incorrectly. Correct assertion: assert BOTH `geo_id='2404000'` (G4110) AND `geo_id='24510'` (G4020) are present for any Baltimore City address. Additionally: the MD House of Delegates has 141 positions but TIGER loads only 71 SLDL polygons. The discrepancy is correct — whole-numbered districts (e.g., District 3, District 8) have one polygon covering all 3 delegates; sub-districts (42A, 42B, 43A, 43B) each get their own polygon. Do not treat the 71/141 mismatch as a data error. Phase 91 confirmed both facts.

> [GOTCHA] **[STATE-SPECIFIC: MA] Massachusetts requires BOTH G4110 cities and G4040 COUSUB towns — G4110-only leaves the majority of MA addresses unrouted:** Massachusetts has 58 incorporated G4110 cities loaded in v5.0, but the majority of MA residential addresses fall in G4040 COUSUB towns (293 rows loaded v5.0). Loading only the G4110 city layer means residents in Concord, Lexington, Brookline, and the other 290 towns receive no LOCAL district routing. This is a Massachusetts outlier — unlike states like Texas or California where most residents live in G4110 incorporated places. For any MA onboarding: assert both layers present before seeding any city. Zero-row gate: `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4040'` must return 293. Do NOT re-run the COUSUB loader — it was loaded in v5.0 (ON CONFLICT DO NOTHING gives false sense of re-load; assertion is the correct pattern). Cambridge (FUNCSTAT=F) and Boston (FUNCSTAT=I) are correctly absent from the G4040 layer — they appear only in G4110. Phase 107 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: MA] Boston council district boundaries are NOT in TIGER — source from ArcGIS FeatureServer (mtfcc=X0013):** Boston's 9 single-member council district boundaries (Districts 1-9) are not in TIGER 2024. Loading only TIGER data for Boston leaves all 9 district councillors unroutable — a Boston address returns the Mayor + at-large councillors but not the resident's district councillor. Source boundaries from Boston ArcGIS FeatureServer: `https://bostonopendata-boston.opendata.arcgis.com/datasets/...` (FeatureServer bulk fetch with `where=1=1` returns all 9 features in a single call — no per-OBJECTID fallback needed unlike Portland OR). Assign mtfcc=X0013 (extends Portland OR X0012 registry). geo_id pattern: `boston-ma-council-district-{N}` (N=1..9). Load with `outSR=4326` (ArcGIS FeatureServer returns State Plane by default). Boston City Hall routes to District 3 — always confirm routing via ST_Covers smoke test rather than assumed proximity. Phase 108-01 confirmed.

**Warning:** Do not assume the city falls in a single house district. Dense urban cities are frequently carved across 4–6 districts.

---

## Step 4: Data Sources

Map out where you will get each type of data before starting any migration.

### Required questions

- [ ] City website: where are officials listed with names, titles, contact info? (Usually /departments/citycouncil or /government/elected-officials)
- [ ] Does the city use Cloudflare or other bot protection on contact pages? (If yes, email_address = NULL is acceptable; bio URL satisfies coverage target)
- [ ] State election authority: where are candidate filings and official results? (e.g., MA: sec.state.ma.us; TX: sos.state.tx.us; CA: sos.ca.gov)
- [ ] Is Ballotpedia coverage available for this city? (Check: many cities under ~150K population are not covered)
- [ ] Does an open data portal exist for this city? (Note: open data portals almost never contain officials or contact data — they contain service/operational data)
- [ ] For compass stances: what are the dominant policy issues? Where do candidates/officials go on record? (City council meeting minutes, local newspaper Q&As, LWV voter guides, candidate websites)
- [ ] For headshots: where are official photos? (Check official website members page, city council meeting recordings, local news archives)
- [ ] If a site 403s to curl/WebFetch: did you try an **in-page `fetch()` from the browser pane** before recording a coverage gap? (See the WI Akamai gotcha — this recovered an entire county tier that the MA-era rule would have written off)
- [ ] Are contact emails present in the **rendered DOM but absent from the fetched HTML**? (JS-injected addresses make a fetch-and-parse loop report "no emails published" — verify one member by rendering the page before concluding)
- [ ] Do the roster page, the per-member URL slugs, and any GIS/open-data layer **agree on names**? (If they disagree, the displayed roster name wins — see the WI three-vintage gotcha)

> **Cambridge example:**
> - Officials: https://www.cambridgema.gov/Departments/citycouncil/members (primary); https://www.cpsd.us/school-committee (for school committee)
> - Cloudflare protection: NOT present for Cambridge city website; verify email format per member before seeding
> - State election authority: https://www.sec.state.ma.us/divisions/elections/
> - Cambridge election results: https://www.cambridgema.gov/Departments/electioncommission
> - Ballotpedia: limited coverage for Cambridge (population ~118K; Ballotpedia threshold is roughly 200K for reliable coverage)
> - Open data portal: data.cambridgema.gov exists BUT contains permits, police logs, and service data only — does NOT have officials or contact information; do not waste time searching it for personnel data
> - Compass stances: public statements, city council meeting voting records (cambridgema.gov meeting minutes), local press (Cambridge Chronicle, Harvard Crimson for charter-related coverage)
> - Headshots: https://www.cambridgema.gov/Departments/citycouncil/members (official council photos); http://vote.cambridgecivic.com (volunteer civic site, useful as backup)
> - Campaign finance: MA OCPF (ocpf.us) — different format from LA Ethics Commission; do not assume FPPC/LA equivalents exist in other states

> [GOTCHA] **[STATE-SPECIFIC: CA] AEM/CQ5 CMS embeds headshots in CSS `background-image`, not `<img>` tags (Sacramento):** Sacramento's cityofsacramento.gov uses Adobe Experience Manager (AEM / CQ5). Official headshots appear in `style="background-image:url(...)"` attributes — WebFetch and standard HTML parsers cannot extract them. Use raw curl + grep: `curl -s <url> | grep -o 'background-image:url([^)]+)'`. This returns paths like `/content/dam/portal/mayor-council/...` which must be prepended with `https://www.cityofsacramento.gov` to form the full download URL. Square CMS renditions (514×514 or 500×500): center-crop to 4:5 ratio, then resize 600×750 Lanczos q90. Other CA cities NOT affected: SF (media.api.sf.gov direct JPEG), San Diego (sandiego.gov direct JPEG), San Jose (sanjoseca.gov + Wikimedia), Fremont (fremont.gov CDN), Berkeley (berkeleyca.gov direct JPEG). Phase 66 confirmed all 9 Sacramento officials were sourced via curl+grep.

> [GOTCHA] **[STATE-SPECIFIC: OR] portland.gov WAF blocks direct file downloads — use Drupal 1_1_320w style CDN URLs:** Portland official headshots are on portland.gov but direct file paths at `/sites/default/files/public/{year}/{filename}` return HTTP 404. The WAF blocks all direct access to the `/public/` file tree. Standard WebFetch or curl to the `/public/` path fails silently. Use Drupal image style derivative URLs: `/sites/default/files/styles/1_1_320w/public/{year}/{filename}?h=XXXXXXXX&itok=XXXXXXXX`. These CDN URLs return HTTP 200 and provide 320×320 WebP images. Extract the `itok` token from each official's profile page HTML. Record the canonical `/public/` path in `photo_origin_url` for audit trail. Processing: center-crop 320×320 to 256×320 (4:5), then resize to 600×750 Lanczos q90 JPEG. Example: Wilson headshot downloaded from `portland.gov/sites/default/files/styles/1_1_320w/public/2024/Wilson-Blue-Background_0.png?h=...&itok=...`. All 14 Portland elected officials sourced from portland.gov with photo_license='public_domain'. Phase 77-03 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: MD] mgaleg.maryland.gov headshot URL discovery requires HTML scraping — HEAD probing misses delegates with high suffix numbers — AND the headshot bucket is 'politician_photos' (not 'politician-headshots'):** The Maryland General Assembly website hosts official portraits at `https://mgaleg.maryland.gov/mgaleg-sys/images/officials/{year}/{lastname}{NN}.jpg`. The suffix number (e.g., `01`, `03`, `04`) is NOT guessable — HEAD probing misses delegates with higher suffixes (e.g., `jackson04`, `watson04`, `harris03`, `young04`). Always scrape the roster page HTML for the chamber to find actual `img src` values before attempting any download. Compound last-name pattern is inconsistent: Lewis Young→`young04` (final word), White Holland→`white01` (first word), Fraser-Hidalgo→`fraser01` (first word), Palakovich Carr→`palakovich01` (first word), Fry Hester→`hester01` (final word) — always scrape to confirm. Special cases: Joseline Peña-Melnyk → file is `pena.jpg` (strips Melnyk and tilde); Jacobs J. filename has a literal space → URL-encode as `jacobs%20j.jpg`. Headshots upload to the `politician_photos` bucket (NOT `politician-headshots` — that bucket does not exist in this project). Path pattern: `{politician_id}-headshot.jpg`. Phase 93-05 and Phase 94-01 confirmed all patterns.

> [GOTCHA] **[STATE-SPECIFIC: MA] malegislature.gov legislator headshots require HTML scraping — suffix numbers are not guessable (same pattern as mgaleg.maryland.gov):** The Massachusetts Legislature website hosts official portraits at `https://malegislature.gov/People/{chamber}` (e.g., /People/Senate, /People/House). Portrait URLs are embedded in the page HTML and must be extracted by scraping — do NOT attempt HEAD-probing sequential suffix numbers. The URL structure varies per legislator and is not predictable from name alone. Apply the same scrape-before-download pattern established for Maryland's mgaleg.maryland.gov. Boston city officials use direct official JPEG from boston.gov/departments/city-council (no authentication or WAF blocking observed; URL format: `https://www.boston.gov/sites/default/files/img/profile-page/{name}.jpg` or similar per-official path). Boston School Committee: bostonpublicschools.org is the headshot source but coverage is low — blank is acceptable for SC members with no photo. Upload all headshots to the 'politician_photos' bucket (NOT 'politician-headshots' — that bucket does not exist); path: `{politician_id}-headshot.jpg`. Phase 108-03 confirmed patterns.

> [GOTCHA] **[STATE-SPECIFIC: MA] MA city CMS platforms (CivicEngage/Revize) and Cloudflare-JS-challenge sites block all programmatic headshot access — HTTP 200 does not mean content is accessible:** Newton (newtonma.gov, CivicEngage CMS) returns HTTP 403 even with a Chrome browser User-Agent — this is server-side bot detection beyond UA string manipulation; no UA workaround exists. Fall River (fallriverma.org, Revize CMS) returns HTTP 200 but the council page shows only a group photo with no individual bio pages anywhere on the site — 0 individual headshots available. Waltham (city.waltham.ma.us) returns HTTP 200 but the response body is 'Just a moment... Enable JavaScript and cookies to continue' — this is a Cloudflare managed challenge; detect it by checking the response body for 'Just a moment' or 'Enable JavaScript'. Standard Python requests and curl cannot penetrate Cloudflare managed challenges. For any city using CivicEngage, Revize, or Cloudflare-protected sites: treat as a 100% headshot gap immediately — do not spend time on UA manipulation or alternative request libraries. Confirmed Phases 117 (Newton), 121 (Fall River, Waltham).

> [GOTCHA] **[STATE-SPECIFIC: MA] Wikipedia Commons headshots require WIKIMEDIA_HEADERS descriptive bot UA — Chrome UA returns HTTP 429:** Lynn Mayor Nicholson was sourced from Wikipedia Commons. Downloading with a Chrome User-Agent returned HTTP 429 (Too Many Requests). Wikipedia's API policy rejects browser-mimicry agents. Fix: use a descriptive bot User-Agent such as `EmpoweredVoteBot/1.0 (https://empowered.vote; contact@empowered.vote)`. This pattern is documented in the project as `WIKIMEDIA_HEADERS`. Applies to any Wikipedia Commons image, not just MA cities. Confirmed Phase 119.

> [GOTCHA] **[STATE-SPECIFIC: MA] MA CivicLive CDN headshot filenames may strip punctuation from DB last_name — always confirm via HEAD before computing filename:** Lynn councilors use the CivicLive CDN (cdnsm5-hosted2.civiclive.com). Natasha Megie-Maddrey has `last_name='Megie-Maddrey'` in the DB (with hyphen) but the CDN filename is `MegieMaddrey.png` (no hyphen — punctuation stripped). An automated script that constructs CDN filenames directly from DB last_name values would fail silently or 404 for officials with punctuation in their names. Always HEAD-probe the actual CDN filename before computing it from the roster. The CDN filename is the authoritative source — not the DB last_name. Confirmed Phase 119.

> [GOTCHA] **An Akamai "Access Denied" 403 is often just a missing `Accept-Encoding` header — add `curl --compressed` before writing the site off:** All of `racinecounty.gov` — HTML pages, the `showpublishedimage` headshot files, and the consolidated officials-directory PDF — returns HTTP 403 to plain `curl` and to WebFetch at **any** User-Agent, which reads exactly like the MA-era "CivicEngage/Cloudflare = 100% gap" verdict. It is not. Akamai here rejects requests that send no `Accept-Encoding`, and curl omits it by default. **Browser UA + `--compressed` returns HTTP 200 on every one of those URLs** (verified 2026-07-26 across pages, images, and the PDF that was previously recorded as permanently unreachable):
>
> ```bash
> curl -sL --compressed -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36" "$URL"
> ```
>
> Both factors are required — UA alone is 403, `--compressed` alone is 403. Neither `Referer`, `Accept`, nor the `Sec-Fetch-*` set makes any difference. **Always test this two-line variant before declaring a WAF-403 site a coverage gap**, and prefer it to browser automation: it needs no browser, no same-origin dance, and no moving image bytes through a tool boundary. (A browser pane's in-page `fetch()` also works, since the browser sends the header natively, but it is strictly same-origin and far more awkward — treat it as the fallback, not the first move.)

> [GOTCHA] **[STATE-SPECIFIC: WI] racinecounty.gov entity-encodes the mailto href but leaves the address in the link TEXT — a `mailto:` regex misses all 21 emails:** The markup is `<a href="mailto:&#69;&#114;&#110;&#105;&#101;...">Ernie.Rossi@racinecounty.gov</a>`. A regex like `/mailto:([\w.%+-]+@[\w.-]+)/` against the raw HTML matches nothing (the href is all numeric entities), which looks identical to "this county publishes no emails" and tempts you into 21 browser navigations to read rendered DOM. Two things work on plain fetched HTML: parse it (`DOMParser` / any HTML parser decodes the entities, so `a[href^="mailto"]` resolves normally), or match the **link text** with `>([\w.%+-]+@racinecounty\.gov)<`. Also note the address **drops middle names** (`Valena Lena Coleman` → `Valena.Coleman@`) and is occasionally initials-only (`Melissa Kaprelian` → `mkb@`), so it can never be derived from `full_name` — scrape it.

> [GOTCHA] **[STATE-SPECIFIC: WI] Racine County publishes THREE disagreeing name vintages — and a URL slug is the worst of them:** For any county board district you may encounter three different names: the roster's displayed name (**current, authoritative**), the per-supervisor URL slug (the **previous** occupant — the CMS retitles the page and keeps the old slug, so "Visit District 1" points at `/county-board-of-supervisors/nick-demske` while the page itself renders *Valena Lena Coleman*), and the ArcGIS `Supervisor_Districts.REPNAME` attribute (a **third, older** vintage). District 3 is Osterman / `steve-smetana` / `TOM RUTKOWSKI` — three distinct people. **Never derive a person's name from a racinecounty.gov URL, and never seed a roster from the GIS layer.** That layer's `Photos` attribute is likewise useless: it holds internal file-server UNC paths (`\\rcarcgis\ROD_stuff\supervisor_photos\nickdemske1.jpg`) matching the *stale* name generation. Use the GIS layer for **geometry only**. Roster names render ALL CAPS — title-case them and preserve suffixes (`Q.A. SHAKOOR, II`).

> [GOTCHA] **[STATE-SPECIFIC: WI] Select county headshots by `alt` text, not aspect ratio — every supervisor page ships TWO decoy images:** Each page carries the 384×384 square headshot plus (1) a district **map** whose dimensions vary and are often portrait (596×570, 513×607), and (2) a **sitewide County Executive promo portrait** (`showpublishedimage/14217/…`, alt `ralph malicki - 2024`, 1023×1363) that appears on *every* page of the county site. The usual "portrait-oriented image near the name" heuristic grabs the map; an "is it a portrait of a person" heuristic grabs Malicki — which would silently give all 21 supervisors the County Executive's face. Match on the `alt` attribute containing the official's own name, lowercased, and tolerate typos (`erinie rossi` for Ernie Rossi, `Tony varanth` for Tony Veranth). Doc IDs are opaque and **not** ordered by district (Rossi 12804, Coleman 12812), so they must be scraped per page. Note 14217 *is* legitimately Malicki's photo on `/departments/county-executive` — exclude it everywhere else.

> [GOTCHA] **[STATE-SPECIFIC: WI] `alt="no picture"` is an explicit placeholder — treat it as a gap, not a photo:** Supervisors with no available portrait get a real image file whose alt text is literally `no picture` (D14 Hoffman `16198`, D18 McReynolds `16208`). It downloads with HTTP 200 like any other image, so a pipeline that only checks status code will import a placeholder graphic as a headshot. Skip any candidate whose alt is `no picture`. Confirmed 2026-07-26: 19 of 21 supervisors have real portraits, those 2 do not.

> [GOTCHA] **A single CMYK print-export JPEG among web headshots renders inverted green/purple — detect it by outlier file size:** Racine County supervisor D10 (Tony Veranth) is a Photoshop **CMYK** JPEG (`Colorspace: CMYK`, `Type: ColorSeparation`, `illustrator:StartupProfile: Print`) carrying a 557 KB embedded ICC profile — 914 KB total against ~130–260 KB for every other portrait in the same set. Naive RGB handling produces a lurid green/purple negative that is obvious in a contact sheet and invisible in a per-file success log. Convert explicitly (`magick in.jpg -colorspace sRGB out.jpg`, applying the CMYK profile first) and **always eyeball a montage of a batch before importing** — the file-size outlier is the tell. Not WI-specific; expect it wherever a print/design workflow feeds the web CMS.

> [GOTCHA] **HASH EVERY BATCH — a CMS will happily serve the same placeholder image as N different people's portrait:** The Village of Raymond's Munibit API returns a populated `personPhoto` URL for **all 5** board members, each returning HTTP 200 and a valid 800×800 WEBP. All four trustee files are **byte-identical** (`md5 3f8a0ed2…`) and the image is the village crest — "EST. 1846", a tree and a barn. Caledonia's API likewise returns the village **logo** as Michael Lambrecht's `personPhoto`. Every per-file check (200, valid image, right dimensions) passes; only two things catch it: `md5` the batch and reject any hash appearing more than once, and *look at a contact sheet*. Two more files returned HTTP 400 with 0 bytes while still being listed as photos. **A populated photo field is not evidence of a photo.** Run `for f in *; do md5 -q $f; done | sort | uniq -d` before importing anything.

> [GOTCHA] **Dynamic municipal boards are often backed by a public JSON API — look for it before resorting to screenshots:** Caledonia and Raymond render their rosters through a **Munibit** (`app.membershipware.com`) web component, which is why both previously had to be seeded from user screenshots. But the component loads from `https://app.membershipware.com/api/public/mwjsPeople?et=<token>&eb=<block>` and the tokens are sitting in the page HTML — grep for `mwjsPeople`. The response is a JS module wrapping a JSON `"people":[…]` array with `personName`, `personFirst`, `personLast`, `personEmail`, `personPhone`, `personPhoto`, `personBio` and title items: strictly better than scraping rendered DOM. **A page can carry several blocks** — Raymond has 4 query strings across 3 `<mwjspeople-obj*>` tags, and the first returns only the President; enumerate them all or you will silently get 1 of 5 people. This is what made Caledonia's 6 emails and Raymond's roster machine-readable for the first time.

> [GOTCHA] **A `<base href>` tag silently redirects every relative image path — `urljoin` against the fetch URL gets 404s:** Town of Norway (Revize CMS) serves images as `revize_photo_gallery/Government/Elected Officials/Jean Jacobson (Custom).jpg` from a page at `/government/elected_officials.php`, so the obvious resolution is `/government/revize_photo_gallery/…` → **404**. The document declares `<base href="https://townofnorwaywi.gov/elected_officials.php" />`, so relative paths actually resolve at the site root. Always check for a `<base>` tag before resolving relative asset URLs, and URL-encode the spaces and parentheses these galleries love.

> [GOTCHA] **`photo_origin_url` is consumed as an IMAGE SRC, not just provenance — putting a source-page URL there hides a perfectly good headshot:** [`.claude/commands/find-headshots.md`](.claude/commands/find-headshots.md) documents setting `politicians.photo_origin_url` to the *page* the photo was found on, plus a `politician_images` row. But the read path prefers the column over the table, in two layers: the backend selects `COALESCE(p.photo_custom_url, p.photo_origin_url, '') AS photo_origin_url` (in `essentialsService.ts` and 7 other sites), and **ev-ui's `renderPortrait`/`renderAvatar` resolve `imageSrc = politician.photo_origin_url || politician.images[0].url`** — so an HTML page URL WINS over the mirrored bucket image and the portrait renders broken. `Landing.jsx` uses the field directly as `<img src>` too. `PoliticianGrid` and `Results` prefer `images[]` and are unaffected, which is why a grid can look correct while every profile is broken. Migrations 1472/1473/1474 hit this for 48 Racine officials; **migration 1475 fixes it by setting `photo_custom_url` to the mirrored bucket URL**, which makes the COALESCE resolve to a real image while `photo_origin_url` keeps its documented provenance meaning. **Whenever you insert a `politician_images` row, set `photo_custom_url` in the same migration** (respecting `photo_custom_url_manual_override` from migration 192 D-08). Verify through the API, not the DB: `GET /api/essentials/politicians/<id>` and confirm the returned `photo_origin_url` ends in an image extension.

> [GOTCHA] **[STATE-SPECIFIC: WI] The legislature's 131 photos are HOT-LINKED to third-party URLs, 99 of them to a stale session path:** They live in `photo_origin_url` as direct image URLs (not mirrored to the bucket, no `politician_images` rows — only 5 exist). **99 point at `docs.legis.wisconsin.gov/2023/…`** — the *previous* session, even though the 2025 session is current and serves the same IDs — and **33 point at arbitrary media hosts** (e.g. a Wisconsin Public TV S3 bucket), which carry both a link-rot and a licensing question. All spot-checked `/2023/` URLs still return 200, so nothing is broken today; the exposure is that the legislature tier's photos are entirely dependent on external hosts and will silently vanish if those paths change. Mirroring them into the `politician_photos` bucket is worthwhile future work — not urgent, but it is why WI shows 136 photos with only 5 `politician_images` rows.

> [GOTCHA] **Two photo storage conventions coexist in `essentials` — counting only one badly undercounts coverage:** WI's 144 state officials show **136** photos via `politicians.photo_custom_url` / `photo_origin_url` (written by the Open States + docs.legis roster import) but only **5** rows in `essentials.politician_images`. The headshot pipeline writes `politician_images`; bulk roster imports often write the columns instead. A coverage query that checks only `politician_images` reports the WI legislature as 5/144 and looks like catastrophic data loss. Always count `EXISTS (politician_images) OR photo_custom_url IS NOT NULL OR photo_origin_url IS NOT NULL`, and state which definition you used.

> [GOTCHA] **[STATE-SPECIFIC: WI] Every Racine village invents its own email local-part scheme, and Sturtevant inverts it — none are derivable:** `{i}{surname}@mtpleasantwi.gov` (Mount Pleasant) · `{i}{surname}@waterfordwi.gov` (Waterford village) · `{i}{surname}@villageofyorkville.com` (Yorkville) · `{i}.{surname}@windpoint.org` (Wind Point) · `{first}.{last}@elmwoodparkwi.gov` (Elmwood Park) · `{I}{Surname}@Caledonia-WI.gov` (Caledonia) · `{i}{surname}@vi.uniongrove.wi.gov` (Union Grove) · and **`{surname}{i}@sturtevant-wi.gov` — surname first**, the reverse of everyone else. Nicknames break the rule anyway (Robert Nash publishes `bnash@`, Ali Gasser is `alicia.gasser@`). Scrape and verify against the page's own list; never compute. Watch neighbour-bleed when matching by proximity — a window around "Nelson" in Yorkville's list picks up `dnelson@` for *Steve* Nelson unless you score the local part against first-initial + surname.

> [GOTCHA] **Small-village and town boards publish emails but almost never portraits — plan the tier that way:** Across the 16 Racine County municipalities outside the city: **56 of 96** officials have an email, but only **10** have a photo, and 7 of those are one village (Rochester). Nine municipalities publish zero portraits. This is the normal shape at this tier — do not scope a "headshots for every municipality" phase and then report it as a failure. Conversely, do not skip the tier: emails are the cheap, high-yield win here.

> [GOTCHA] **Pillow is not installable in this environment (PEP 668) — use ImageMagick for the crop/resize spec:** `pip install Pillow` fails with `externally-managed-environment`, so the PIL recipe in [`.planning/templates/headshots.md`](.planning/templates/headshots.md) cannot run as written. `magick` (ImageMagick 7) is available and does the documented 4:5 → 600×750 Lanczos q90 pipeline in one call: `magick in.jpg -colorspace sRGB -gravity center -crop 4:5 +repage -filter Lanczos -resize 600x750! -quality 90 -strip out.jpg`. For labelled contact sheets, `magick montage` needs an explicit `-font` (e.g. `/System/Library/Fonts/Supplemental/Arial.ttf`) or it dies with `unable to read font`.

> [GOTCHA] **[STATE-SPECIFIC: WI] WebFetch reports "placeholder image" for the City of Racine council page when all 15 headshots are actually present — the `<img src>` really IS a placeholder:** The roster lazy-loads, so each `<img src>` is literally an inline SVG data URI (`data:image/svg+xml,…viewBox='0 0 100 0'`) with `width="100%"` and **no `srcset`**. WebFetch faithfully reports what it sees; the real files are only reachable by scanning the raw markup for the `media.cityofracinewi.gov` CDN host. `curl -sL` + grep returns all 15. **`-L` is mandatory** — the apex URL 301s and a plain `curl` returns 162 bytes. The path embeds an unguessable timestamp directory (`…/uploads/2025/07/02010109/District-4-David-Maack.jpg`), so despite the tidy `District-{N}-{First}-{Last}` filename you must scrape rather than construct; extensions are mixed `.jpg`/`.png`/`.webp`. Per-member URLs are inconsistent: districts 1 and 5–15 are `/district-{N}/` but 2/3/4 are `/0{N}-district/` — enumerate the roster's hrefs. Per-member pages also carry a `term ends {Month} {Year}` string, which is real term data if you want it.

> [GOTCHA] **[STATE-SPECIFIC: WI] City of Racine emails are on a different domain than the site AND the markup capitalises it — a case-sensitive regex silently drops 6 of 15:** The site is `cityofracinewi.gov` but addresses are `@cityofracine.org` (different domain, `.org` not `.gov`) — and the pages render it `@CityOfRacine.org`. Matching `/@cityofracine\.org/` without the `i` flag returned 9 of 15 aldermen and made the other 6 look like they publish nothing. **Every "this official has no email" conclusion should be re-tested case-insensitively before you record a gap.** Normalise the domain to lowercase for storage; leave the local part as published (`Olivia.Turquoise-Davis@…` keeps its hyphen).

> [GOTCHA] **Low-resolution-only sources are common at municipal level — check for larger variants, then follow the upscale sign-off rule:** City of Racine publishes aldermen at **300×300** and the Mayor at **212×250**, and nothing bigger exists (probing `-scaled`, bare-name, and alternate-extension WordPress variants all returned 403). Reaching the 600×750 standard therefore means a 2.5–3.0× upscale. [`headshots.md`](.planning/templates/headshots.md) requires showing 1–2 sample upscales for approval **before** batch processing — honour it; it is a real quality gate, not a formality. ImageMagick equivalent of the documented PIL unsharp mask: `-filter Lanczos -resize 600x750! -unsharp 2x1+1.5+0.012`. Approved for Racine 2026-07-26; result is soft but clearly recognisable, matching the Maine Phase 52-03 outcome.

> [GOTCHA] **An official with no published email may still have a published contact route — use `web_form_url` rather than inventing an address or borrowing a staffer's:** Mayor Cory Mason's page lists a phone, a Gravity contact form, and — under a "Staff Info" heading — only his aide's address. Neither guessing `Cory.Mason@…` nor attributing the aide's address to him is acceptable. `essentials.politicians.web_form_url` exists for exactly this case (migration 1473 stores the contact-form URL and leaves `email_addresses` empty). Check for a form before recording a contact gap, and never promote a named staffer's address into an officeholder's record.

> [GOTCHA] **Officials holding two seats share ONE politician row — enrich once and APPEND, never overwrite:** Renee Kelly is both Racine County Supervisor D2 and City of Racine Alderman D13, and the dedup merge (migration 1450) collapsed her into a single `politicians` row. Two consequences when enriching tier by tier: (1) her county 384×384 portrait already existed when the city tier ran, so migration 1473 deliberately inserts **no** city image row (the `WHERE NOT EXISTS (… politician_id)` guard also makes this automatic) — compare source resolution and keep the better one; (2) emails must use `array_append(coalesce(email_addresses,'{}'), …)` with a membership test, **not** `SET email_addresses = ARRAY[…]`, or the second tier silently destroys the first tier's address. She correctly ends up with both `@racinecounty.gov` and `@cityofracine.org`. Expect ~10% of Racine-area municipal officials to be dual officeholders.

> [GOTCHA] **[STATE-SPECIFIC: WI] No machine source publishes a WI legislator's website — the `urls` gap is structural, not an oversight:** Open States returns empty `links` and `offices` arrays for the Wisconsin jurisdiction, and `docs.legis.wisconsin.gov` has no website field either, so all 144 WI state officials sit at `urls=0` and no amount of re-running the roster import will fix it. Either store the docs.legis profile page as the bio URL or accept the gap; don't plan a phase around finding a source that doesn't exist. The good news on the same domain: the **headshot is derivable** — append `.jpg` to the profile URL (`…/legislators/assembly/2870` → `…/2870.jpg`, HTTP 200, image/jpeg) with no WAF and no scraping, which is the only WI headshot source that behaves that way.

> [GOTCHA] **Local compass stance work is gated on topic-building — `compass.topics` has exactly ONE `local` topic:** The table holds 21 rows total, of which precisely one (`housing`) has `'local' = ANY(level)`; 12 rows have `level IS NULL`. So for any newly-seeded county or municipal tier there is effectively nothing to score officials against, and running `research-stances` first produces near-empty output that looks like failed research rather than a missing rubric. Run `compass-topic-builder` (ev-accounts) to establish local topics **before** any local stance research. This is not WI-specific — it applies to every municipal tier — but Racine is where it bites first, with 154 county+municipal officials and one applicable topic.

> [GOTCHA] **[STATE-SPECIFIC: WI] County supervisor pages publish officials' home addresses and personal phone numbers — ingest the email only:** Racine County per-supervisor pages list what are plainly residential addresses and personal phones (e.g. "424 Lake Ave. Apt. 211", "3332 North Elmwood Dr."). These are published by the county, but that does not make them appropriate to mirror into a consumer-facing profile. Take the `@racinecounty.gov` email and the committee assignments; leave the home address and personal phone out of the seed.

**Reminder:** LA data richness (LACBA attorney ratings, CJP judicial database, Ethics Commission campaign finance API) is an outlier, not a baseline. Do not plan phases around finding LA-equivalent sources for other cities.

---

## Step 5: Schema Decisions Before Migration

Make these decisions before writing any SQL. Wrong answers here corrupt the schema.

### Required questions

- [ ] geo_id confirmed? (7-digit Census place code — verified against TIGER or Census Bureau, not inferred from county FIPS)
- [ ] [VERIFY] Check the valid election_method TEXT values list in the [elections-seed template](.planning/templates/elections-seed.md) before writing any chambers INSERT — `election_method` is a plain TEXT column, not a pg_constraint CHECK constraint; the pg_constraint query returns nothing useful
- [ ] Mayor office modeling decided: LOCAL vs LOCAL_EXEC, is_appointed_position true/false
- [ ] Are there any offices where the same politician holds two roles simultaneously? (e.g., Cambridge Mayor is simultaneously a City Councillor — one politician row, two office linkages)
- [ ] What name does the city officially use for the council chamber? ("City Council" vs "Town Council" vs "Board of Aldermen" etc.)
- [ ] What name does the city officially use for council members? ("Councillor" vs "Councilor" vs "Council Member" vs "Alderman")
- [ ] What is the government name? ("City of Cambridge" vs "Town of Cambridge" vs "Cambridge" — match exactly what the city uses on official documents)
- [ ] What is the next migration number? (Run `SELECT MAX(version) FROM supabase_migrations.schema_migrations;` via psql before writing any migration file)
- [ ] [GOTCHA] **Legislature-elected offices (AG, SoS, Treasurer in some states) are NOT on any ballot:** In states where the Attorney General, Secretary of State, or Treasurer is elected by the legislature rather than by voters, these offices need `is_appointed_position=true` on the office row AND zero rows in `essentials.elections` or `essentials.races` for those chambers. If you assume popular election and create race rows for these offices, you will display a fake election that does not exist. Research the state constitution before assuming: Wikipedia's state government page is sufficient. In Maine, Frey (AG), Bellows (SoS), and Perry (Treasurer) are all legislature-elected — they have politician rows and headshots but zero race rows (Phase 51-01). States where this applies: Maine, Tennessee, Virginia, and others. **[STATE-SPECIFIC: OR]** Oregon's 5 constitutional officers (Governor, AG, SoS, Treasurer, Labor Commissioner) are ALL voter-elected — do NOT copy the Maine is_appointed=true pattern for OR. Set `is_appointed_position=false` on all 5 office rows and create race rows for all 5 offices. Note: OR has a 5th executive office (Labor Commissioner) not present in Maine — always verify the full list from the official state government page, not a template from a prior state. Chamber slugs: governor-of-oregon, attorney-general-of-oregon, oregon-secretary-of-state, oregon-state-treasurer, oregon-labor-commissioner. Phase 73-74 confirmed.
- [ ] [GOTCHA] **For bicameral legislatures: senator office uniqueness key is `(district_id, politician_id)`, NOT `(district_id, chamber_id)`:** In a US state senate, two senators share the same NATIONAL_UPPER district (e.g., Collins + King both represent Maine's single NATIONAL_UPPER district). If you model the uniqueness key as `(district_id, chamber_id)`, the second senator INSERT violates the constraint because chamber_id is identical for both. The correct key is `(district_id, politician_id)`. In Maine, Collins (external_id=-230101) and King (external_id=-230102) both link to the same NATIONAL_UPPER district_id — verified in Phase 51-02 migration 170. This affects any state with two US senators (i.e., all 50 states).

> [GOTCHA] **[STATE-SPECIFIC: CA] CA pre-existing seed reminder for schema phase — verify all ranges before writing any CA INSERT:** By the time you reach schema decisions, the CA government row + 8 executive chambers + 8 politician rows may already exist. Run `SELECT id, geo_id FROM essentials.governments WHERE name = 'State of California'` before any CA state-level INSERT. If it returns a row with `geo_id=NULL`, UPDATE — do not INSERT. Phase 59 confirmed: ALL 8 chamber INSERTs were no-ops; migration 189 used WHERE NOT EXISTS + UPDATE pattern exclusively.

> [GOTCHA] **[STATE-SPECIFIC: OR] Federal officials may pre-exist under non-canonical external_ids — pre-flight before INSERT:** Ron Wyden (external_id=-400065) and Jeff Merkley (external_id=-400066) already existed in the DB with correct office rows before Phase 74. A standard INSERT migration targeting the canonical -4101001/-4101002 range would silently skip them (NOT EXISTS guard) and leave the canonical external_ids absent. Before any federal officials migration, run: `SELECT external_id, full_name FROM essentials.politicians WHERE full_name IN ('Ron Wyden', 'Jeff Merkley')` (or your state's senators) to detect pre-existing rows. If they pre-exist under different external_ids with correct offices, use UPDATE to reassign external_ids to the canonical scheme rather than INSERT+new office rows. Phase 74-02 confirmed: `UPDATE essentials.politicians SET external_id=-4101001 WHERE external_id=-400065` (Wyden). General rule: pre-flight by senator name before any federal officials migration.

> [GOTCHA] **[STATE-SPECIFIC: CA] CA external_id range -1000xx is occupied by CA Assembly — use -60003xx for CA House reps:** The planned external_id range for CA US House representatives (-100049..-100119) was already occupied by pre-existing CA State Assembly members seeded before v7.0. This caused a duplicate key constraint error on the first migration attempt (Phase 60). Established CA external_id scheme: executive constitutional officers (-6000101 through -6000108); US Senators (-6000201, -6000202); CA House reps (-6000301 through -6000352); CA State Senators (-6001001 through -6001040); CA Assembly members (-6002001 through -6002080); LAUSD board members (-6004001 through -6004007). Pre-flight rule: before assigning any CA external_id range, run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -N AND -M` to confirm the range is clear.

> [GOTCHA] **[STATE-SPECIFIC: MD] Multi-member delegate INSERT NOT EXISTS guard must use (district_id, politician_id) — NOT (district_id, chamber_id):** In the MD House of Delegates, most geographic districts have 3 delegates who all share the same SLDL polygon and thus the same district_id. If the WHERE NOT EXISTS guard checks `(district_id, chamber_id)`, the 2nd and 3rd delegate INSERTs for the same district will be silently blocked — all three delegates share the same chamber_id. The correct guard is `(district_id, politician_id)`, which allows multiple delegates per district but prevents duplicating the same individual. This is identical to the US Senate two-senators-per-district pattern documented elsewhere in this playbook. Example: District 3 has delegates Lafferty (external_id=-2420007), Boafo (-2420008), and Nazarian (-2420009) — all three link to the same district_id. Phase 93-03 confirmed; wrong guard caused all sub-threshold delegates to be silently skipped.

> [GOTCHA] **[STATE-SPECIFIC: MA] MA Tier 3 geo_id estimates routinely mismatch the DB — always run a verification query before writing any migration:** Planning documents and Census FIPS lookups give plausible-looking geo_ids, but these estimates were wrong for every Tier 3 city that had an unusual value. Confirmed mismatches: Fall River estimated 2522640, actual is 2523000; Waltham estimated 2573440, actual is 2572600; New Bedford estimated 2524000, actual is 2545000; Medford estimated 2540115, actual is 2539835. The Medford mismatch also propagated into the external_id prefix (politicians were seeded with prefix -2540115xxx despite the actual geo_id being 2539835 — a perpetual discrepancy in that city's data). Before writing any MA city migration, always run: `SELECT geo_id, name FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4110' AND name ILIKE '%{city}%'` and use the returned geo_id, not the plan estimate. Confirmed Phases 120, 121.

> **Cambridge example:**
> - geo_id: 2511000 (confirmed against US Census official GEOID documentation)
> - election_method: stv_proportional — verify this value is a known valid TEXT value before migrating (see elections-seed template reference block); do NOT use the pg_constraint query
> - Mayor modeling: is_appointed_position = true; district_type = LOCAL; politician_id on Mayor office row points to Sumbul Siddiqui (who also holds a Councillor office row); no election race row for Mayor
> - Dual-office: Sumbul Siddiqui holds both a Councillor seat AND the Mayor title — seed ONE politician row for Siddiqui, then link that politician_id to BOTH office rows (the Councillor office and the Mayor office); requires the unique index on offices.politician_id to be dropped first (see Step 6 item 4)
> - Council chamber name: "City Council"
> - Member title: "Councillor" (double-l — Cambridge official spelling; do not auto-normalize to "Councilor")
> - Government name: "City of Cambridge" (NOT "Cambridge, MA" or "Cambridge City")
> - Migration number: always run `SELECT MAX(version) FROM supabase_migrations.schema_migrations;` before writing — never assume from prior session notes

---

## Step 6: Migration Order

Always migrate in this sequence. Skipping steps or migrating out of order creates broken foreign key references.

```
1. Geofences — state legislative + congressional + city place boundaries
   → TIGER loader run (load-state-tiger-boundaries.ts) OR manual shapefile import
   → Verify with FindMyLegislator or state equivalent before proceeding

2. Government row — one row in essentials.governments for this city
   → Confirm geo_id, state, name_formal before inserting
   → [GOTCHA] `essentials.governments` has NO unique constraint on `geo_id` — use `WHERE NOT EXISTS` guard, not `ON CONFLICT (geo_id)`. `ON CONFLICT (geo_id)` will fail at runtime with "no unique constraint" error. In Maine, the State of Maine government row (UUID da88de8b-9afa-4d87-86d5-7eb83c3e9792) was seeded via `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE geo_id = '23')` in migration 169.

3. Chambers — one row per legislative/school/governing body
   → [VERIFY] Confirm election_method TEXT value is valid before inserting — see [elections-seed template](.planning/templates/elections-seed.md) reference block. Do not use the pg_constraint query (election_method is TEXT, not a CHECK constraint).
   → [GOTCHA] **`slug` is a GENERATED column on `essentials.chambers` — never include it in INSERT statements.** PostgreSQL will throw an error if you include `slug` in the column list. The value is auto-computed from the chamber name. In Maine, we confirmed this when building the maine-senate, maine-house-of-representatives, maine-governor, maine-attorney-general, maine-secretary-of-state, and maine-treasurer chamber rows (Phase 50). For your state: omit `slug` from every chamber INSERT.
   → [REMINDER] If any chamber uses RCV/IRV: set `election_method='rcv'` on this chamber row (not just on the race rows). See Step 2 GOTCHA above.
   → Confirm seat counts match official charter

4. Offices — one row per seat
   → At-large councils: N individual office rows, same title, no Place numbers (unless city uses Place numbers)
   → Ward-based councils: one office per ward/district
   → Mayor (if appointed): is_appointed_position = true
   → City Manager: is_appointed_position = true
   → [REMINDER] Legislature-elected executive offices (AG, SoS, Treasurer): set `is_appointed_position=true` and create NO race rows for these chambers. See Step 5 GOTCHA above.
   → [GOTCHA] For Council-Manager cities where the Mayor is a sitting council member: the unique index on `essentials.offices.politician_id` must be dropped in this migration before seeding incumbents. This index blocks the dual-office pattern (same politician_id on both the Councillor office and the Mayor office). Add DROP INDEX + CREATE INDEX (non-unique) steps to the migration.

5. Incumbents (politicians) — one row per person
   → Dual-role incumbents (e.g., Mayor who is also a Councillor): ONE politician row, linked to BOTH office rows
   → is_appointed = true for appointed positions
   → email_address only if verified from official source; NULL is acceptable
   → [PATTERN] `generate_series(1, N)` is the cleanest pattern for N identical at-large office rows — avoids copy-paste arithmetic errors (e.g., 9 councillors + 1 Mayor + 1 City Manager + 6 school committee = 17, not 16)
   → [PATTERN] **Multi-tier seeding for states with many cities:** Use a tiered approach to manage coverage depth across many cities. Tier 1 = deep seed (incumbents + headshots + emails + addresses); Tier 2 = incumbents only (names + emails where easy, no headshots); Tier 3-4 = skeletal offices with `politician_id=NULL` plus a documented gap entry in `[STATE]-GAPS.md`. The GAPS.md file makes coverage visible — silent omissions create permanent confusion about what the platform actually covers. In Maine, Phase 53 = Tier 1 (Portland, 18 officials fully seeded); Phase 54 = Tiers 2-4 (Lewiston/Bangor/SouthPortland/Auburn/Biddeford incumbents + 18 skeletal cities).
   → [PATTERN] **PowerShell bulk-seed generator for 100+ row migrations:** When seeding state legislatures or any migration with 100+ repetitive INSERT blocks, use a PowerShell script that generates the SQL file rather than hand-writing. CRITICAL encoding rule: use `[System.IO.File]::WriteAllLines($path, $lines, [System.Text.UTF8Encoding]::new($false))` — the `$false` disables BOM. `Out-File` and `Set-Content` produce BOM/UTF-16 that PostgreSQL rejects with a parse error. In Maine, Phase 55-02 used a PowerShell generator to produce migration 184 (372 legislative race rows). See `.planning/templates/officials-seed.md` for the full pattern. **[STATE-SPECIFIC: OR]** PowerShell 5.1 reads `.ps1` files without BOM as ANSI codepage (not UTF-8) — non-ASCII characters in string literals (e.g., Vietnamese diacriticals) will be mangled even if the file is correctly encoded UTF-8. For any non-ASCII character in the roster hashtable, use `[char]0xNNNN` escape sequences: HD-38 Daniel Nguyễn uses `[char]0x1EBF` for ễ; HD-45 Thuy Tran uses `[char]0x1EE7` + `[char]0x1EA7`; HD-22 Lesly Munoz uses `[char]0x00F1` for ñ. These escape sequences render correctly in the generated SQL output regardless of how PowerShell reads the script file. Phase 75-02 confirmed.

6. Elections + race_candidates
   → Confirm election date from election commission (not assumed from state cycle)
   → For historical/completed elections: seed as completed with all race_candidates
   → For future elections: seed as upcoming placeholder; do not activate discovery until filing opens
   → [GOTCHA] `race_candidates` has NO unique constraint on `(race_id, full_name)` — use `WHERE NOT EXISTS` guards, not `ON CONFLICT DO NOTHING`. `ON CONFLICT DO NOTHING` is a no-op without a unique constraint and does not prevent duplicate rows.

> [GOTCHA] **[STATE-SPECIFIC: MD] discovery_jurisdictions has NO cron_active column — date-based eligibility is the correct mechanism:** Some states' discovery_jurisdictions rows use `cron_active=true` to arm the discovery cron. Maryland's discovery_jurisdictions rows do NOT have this column — it was never added to the MD rows. The cron fires based on date proximity to the election_date field alone. If you attempt to INSERT or UPDATE a `cron_active` column for MD discovery rows, the query will fail with an unknown column error. Note: REQUIREMENTS.md MD-ELECTIONS-02 text says "cron_active=true" — this wording is stale; the actual MD rows rely on date-based eligibility, not a cron_active flag. Phase 96-03 confirmed via migration 281 (no cron_active column in INSERT).

7. Headshots
   → 600×750 JPEG, Lanczos resize, 4:5 ratio (crop first, then resize — never distort)
   → Upload to Supabase Storage via existing headshot upload pattern
   → No banners, text, or graphics over face

8. Compass stances (optional, do after officials are stable)
   → Research one politician at a time (rate limit rule)
   → Citation required for every stance
   → Apply via existing apply-*.ts ingest pattern
```

> **Cambridge migration order:**
> - Phase 38 (MA Geofences) runs first — no DB dependencies
> - Phase 39 (MA Government DB) starts after Phase 38 completes (district rows must exist before politicians link to them)
> - Phase 41 (Cambridge City Structure) depends on Phase 39
> - Phase 42 (Cambridge Headshots) depends on Phase 41
> - Phase 43 (Cambridge Elections) depends on Phase 41 + Phase 38
> - Discovery pipeline configured in Phase 43 but left INACTIVE until 2027 filing opens

---

## Step 7: Common Pitfalls (Check Before Every Migration)

These mistakes have been made on prior cities. Check this list before writing each migration.

| Pitfall | How to Catch It |
|---------|----------------|
| Mayor modeled as LOCAL_EXEC when actually council-selected | Verify: does the Mayor appear on the ballot as a standalone race? If no — use LOCAL + is_appointed_position = true |
| Wrong geo_id (county FIPS instead of city place code) | City geo_id = 7 digits (SSCCCCC format); county = 5 digits (SSCCC) |
| Wrong election year (even vs. odd) | Check election commission — do not assume even-year alignment with state elections |
| Assuming single house/senate district when city spans multiple | Test 3+ addresses spread across city with FindMyLegislator before seeding geofences |
| Missing charter amendments | Charter changes can remove or add offices (e.g., Cambridge 2025 removed Mayor as automatic School Committee member) |
| Open data portals mistaken for officials source | Open data portals contain operational data, not personnel data |
| LA-specific sources assumed available | Bar ratings, judicial databases, Ethics Commission APIs are California-specific — verify source availability per state |
| Councillor vs. Councilor spelling | Match the city's official spelling exactly; do not normalize |
| Email addresses guessed from patterns | Only seed emails verified from official city website at time of seeding; NULL is acceptable |
| Discovery cron firing on far-future election | Mark discovery_jurisdictions row inactive until filing period opens |
| slug in chamber INSERT | slug is a GENERATED column on essentials.chambers — never include in INSERT statements |
| Partisan/nonpartisan assumption | Confirm explicitly — some US cities run partisan local races |
| offices.politician_id unique index blocks Council-Manager dual-office | For Council-Manager cities: DROP the unique index on offices.politician_id in the migration before assigning politician_id to any office that shares a politician with the Mayor office |
| Wrong government idempotency guard | essentials.governments has no unique constraint on geo_id — use WHERE NOT EXISTS, never ON CONFLICT (geo_id) |
| election_method pg_constraint query returns nothing | election_method is a TEXT column, not a pg_constraint enum — use the elections-seed template reference block to verify valid values |
| race_candidates duplicate rows | race_candidates has no unique constraint on (race_id, full_name) — WHERE NOT EXISTS required; ON CONFLICT DO NOTHING is a no-op |
| Office count arithmetic errors | Explicitly verify: 9 councillors + 1 mayor + 1 city manager + 6 school committee = 17 (not 16); write the arithmetic as a comment in the migration |
| CA jungle primary modeled as separate D/R primaries | CA uses top-two jungle primary — ONE unified race row for ALL candidates regardless of party; sos.ca.gov is authoritative |
| CA pre-existing seed silently duplicated | Before any CA state-level INSERT, run `SELECT id, geo_id FROM essentials.governments WHERE name = 'State of California'`; if geo_id IS NULL, UPDATE — do not INSERT |
| ArcGIS outSR=4326 omitted for CA city boundaries | CA State Plane feet (SRID 2229) looks valid to PostGIS but ST_Covers returns 0 rows for all addresses — always add outSR=4326 to ArcGIS MapServer queries for CA cities |
| AEM/CQ5 CMS headshots not extractable by WebFetch | Sacramento cityofsacramento.gov uses CSS background-image — use curl+grep pattern |
| CA external_id range collision | Before assigning any CA external_id, run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -N AND -M`; known occupied ranges include -1000xx (Assembly), -60030xx (House reps), -60031xx (challengers); always query — do not rely on range list |
| Portland council district boundaries not in TIGER | Source from PortlandMaps ArcGIS MapServer Layer 17 per-OBJECTID; always add outSR=4326 and ST_MakeValid |
| Portland council structure seeded from pre-2025 charter | 2024 charter reform: 4 districts × 3 seats = 12 council seats; official roster from portland.gov/auditor/elections/elected-city-officials not Wikipedia |
| portland.gov headshots not downloadable from /public/ direct paths | Use Drupal 1_1_320w style CDN URLs (extract itok token from profile page HTML); photo_origin_url records canonical path |
| PowerShell Unicode encoding: non-ASCII names mangled in PS 5.1 scripts | Use [char]0xNNNN escape sequences for all diacritical characters in .ps1 roster hashtables |
| OR constitutional officers modeled as appointed (Maine pattern) | All 5 OR officers are voter-elected; is_appointed_position=false and race rows required for all 5 |
| Portland 2026 races include all 12 council seats | Staggered terms: D3+D4+Auditor on 2026 ballot; Mayor+D1+D2 on 2028 ballot (4-year terms from 2024 charter reform) |
| OR federal senators pre-exist in DB under legacy external_ids | Pre-flight SELECT by senator name before INSERT; OR senators Wyden (-400065) + Merkley (-400066) already loaded — UPDATE external_id, do not duplicate INSERT |
| MD multi-member delegate INSERT blocks on 2nd/3rd delegate | Use NOT EXISTS on (district_id, politician_id) NOT (district_id, chamber_id); chamber_id as discriminator blocks all but the first delegate per district |
| mgaleg headshot suffix not guessable | Scrape roster HTML for actual img src; HEAD probing misses delegates with suffix >01 (e.g., jackson04, young04, harris03) |
| Baltimore City dual-tier missed in smoke test | Assert BOTH geo_id='2404000' (G4110) AND geo_id='24510' (G4020) for any Baltimore City address; "exactly one local row" assertion fails incorrectly |
| MD State Treasurer modeled as voter-elected | Treasurer is elected by General Assembly: is_appointed_position=true, zero race rows, no discovery_jurisdictions entry; AG/Gov/LG/Comptroller ARE voter-elected |
| Upload to wrong MD headshot bucket | Use 'politician_photos' bucket (NOT 'politician-headshots' — that bucket does not exist); path pattern: {politician_id}-headshot.jpg |
| discovery_jurisdictions cron_active column assumed | MD discovery_jurisdictions has no cron_active column; date-based eligibility is the correct mechanism; REQUIREMENTS.md MD-ELECTIONS-02 text is stale on this point |
| MA Tier 3 geo_id estimate wrong | Always query geofence_boundaries before writing: `SELECT geo_id FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4110' AND name ILIKE '%{city}%'`; plan estimates were wrong for Fall River, Waltham, New Bedford, Medford |
| HTTP 200 does not mean content accessible (Cloudflare JS challenge) | Check response body for 'Just a moment' or 'Enable JavaScript'; Waltham (city.waltham.ma.us) returns HTTP 200 with Cloudflare challenge body — treat as 100% headshot gap; UA manipulation does not help |

---

## Step 8: Phase Templates

Use these templates when writing GSD plan files for each phase type. Templates are in `.planning/templates/`:

- [`db-foundation.md`](.planning/templates/db-foundation.md) — New government row, chambers, offices setup
- [`officials-seed.md`](.planning/templates/officials-seed.md) — Seeding incumbents with contact data
- [`headshots.md`](.planning/templates/headshots.md) — Photo collection and upload
- [`discovery-setup.md`](.planning/templates/discovery-setup.md) — Discovery pipeline configuration
- [`compass-stances.md`](.planning/templates/compass-stances.md) — Stance research and ingestion
- [`elections-seed.md`](.planning/templates/elections-seed.md) — Election rows, race seeding (incumbents + challengers), discovery_jurisdictions rows, placeholder elections for future cycles

---

## Compass and Treasury Tracker (companion products)

These sections are stubs — Essentials provides the foundational government data (officials, offices, elections) that Compass and Treasury Tracker build on top of.

### Compass (political stance research)

`[TO BE COMPLETED BY COMPASS TEAM]`

The Compass team authors this section. This stub documents the minimum Essentials owner needs to know:

- **Check topic coverage for the tier before researching anything.** `compass.topics` currently holds 21 rows with exactly **one** (`housing`) tagged `'local'`. A local tier with no local topics yields near-empty stance output that reads as failed research when it is actually a missing rubric — run `compass-topic-builder` (ev-accounts) first. Verify with: `SELECT count(*) FROM compass.topics WHERE is_active AND 'local' = ANY(level);`
- Stance research runs **one politician at a time** — never in parallel (rate limit rule; parallel runs exhaust Claude API quota with no usable output)
- Every stance placement requires a **citation** — no citation = no staging entry (hallucination prevention)
- Citation requirement: link to a public source (news article, voting record, candidate statement, council minutes) for every value placed
- Rate limit memory note: $0.004/run estimate (Haiku-class); flag if actual costs balloon
- See: [`.planning/templates/compass-stances.md`](.planning/templates/compass-stances.md) for the full compass stance ingestion template
- See: [`.planning/phases/18-compass-stances/`](.planning/phases/18-compass-stances/) for prior compass work patterns

### Treasury Tracker (campaign finance)

`[TO BE COMPLETED BY TREASURY TEAM]`

The Treasury Tracker team authors this section. This stub documents the minimum Essentials owner needs to know:

- Campaign finance data ingestion is **state-specific** — each state has its own filing authority, data format, and API (or lack thereof)
- Data richness varies significantly: LA Ethics Commission has a queryable API; MA OCPF (ocpf.us) has downloadable exports; Maine equivalent may differ
- Do not assume LA-equivalent source richness for other states — verify per state before planning campaign finance phases
- LA campaign finance work documented in Phase 30 + Phase 19 (TX); use as reference for future states

---

## Checklist Summary

Use this as your pre-execution checklist before starting any city or state:

- [ ] [VERIFY] Step 1 complete: Form of government confirmed; Mayor modeling decided; incumbents listed; **for state onboarding: legislature structure + executive officer election method confirmed**
- [ ] [VERIFY] Step 2 complete: Election method confirmed per chamber; next election date confirmed from election commission; partisan/nonpartisan confirmed; **RCV jurisdictions: election_method='rcv' set on chamber row**
- [ ] [AUTO]+[VERIFY] Step 3 complete: **For state onboarding: TIGER loader run for all layers (CD + SLDU + SLDL + PLACE + COUNTY);** city geo_id confirmed; TIGER allowlist checked [AUTO]; district counts verified with FindMyLegislator [VERIFY]; **TIGER file naming verified (not always `cd`)** [VERIFY]; **districts.state casing verified after loader run** [AUTO]
- [ ] [VERIFY] Step 4 complete: Data sources mapped for officials, elections, headshots, stances
- [ ] [VERIFY] Step 5 complete: Schema decisions recorded; migration number confirmed; spelling confirmed; election_method TEXT value verified against elections-seed reference block; **legislature-elected offices identified (is_appointed=true, no race rows)** [VERIFY]; **senator uniqueness key confirmed as (district_id, politician_id)**
- [ ] [AUTO]+[VERIFY] Step 6 complete: Migration order planned; [GOTCHA] items reviewed (slug GENERATED on chambers, governments WHERE NOT EXISTS, senator uniqueness key, legislature-elected = appointed, offices unique index drop, race_candidates WHERE NOT EXISTS)
- [ ] [AUTO] Step 7 complete: Pitfall checklist reviewed
- [ ] [AUTO] Step 8 complete: Phase templates selected for each planned GSD phase

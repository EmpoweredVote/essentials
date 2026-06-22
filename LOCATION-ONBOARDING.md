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

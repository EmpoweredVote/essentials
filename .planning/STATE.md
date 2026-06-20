---
gsd_state_version: 1.0
milestone: v17.0
milestone_name: LA County City Coverage — Wave 2
status: executing
last_updated: "2026-06-20T04:14:31.566Z"
last_activity: 2026-06-20 -- Phase 157 planning complete
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
---

# State

## Current Position

Phase: 144 (glendale-deep-seed) — EXECUTING
Plan: 1 of 4
Status: Ready to execute
Last activity: 2026-06-20 -- Phase 157 planning complete
Next migration: 902 (structural; stance/headshot files 896–901 did NOT register — ledger MAX 895)
Resume file: .planning/phases/157-wave-2-close-out/157-CONTEXT.md

### Phase 144 context summary (Glendale, geo_id 0630000) — ready to plan

- Near-identical reconcile to SC. Gov shell a7433437 (geo_id NULL→0630000). Empty duplicate chamber c019a553 (-200687) to DELETE; survivor 771727ec (10450, official_count 5).
- Roster VERIFIED CURRENT live 2026-06-19 (5 at-large): Najarian -700100, Kassakhian 686339, Brotman 686340, Asatryan 686337, Gharpetian 686336. Gharpetian NOT stale (re-won 2024) — no member retirement needed (contrast SC Smyth).
- Mayor = Kassakhian (686339, selected Apr 2026) → flag title='Mayor' on his seat (rotational, no LOCAL_EXEC). ⚠ Research MUST check June 2 2026 election for seat/mayor turnover before writing.
- Headshots: 2/5 exist (Kassakhian, Asatryan); 3 missing (Najarian, Brotman, Gharpetian) → glendaleca.gov. Stances 0/5 → full, chairs model, NO judicial (appointed City Attorney).

### Phase 143 outcome (Santa Clarita, geo_id 0669088)

- NOT greenfield. Reconciled a duplicate-chamber partial seed. KEY: McLean (-201394) + Miranda (-200980) already existed in the doomed Chamber A with headshots → RESEATED into surviving Chamber B (eeabd028), NOT inserted as new -700181/-700182 (avoided duplicate people). Cameron Smyth (-700180) RETIRED (departed Dec 2024), not reseated.
- Migrations: 894 reconcile (ledger), 895 roster (ledger), 896 headshots (audit-only), 897–901 stances (audit-only). Ledger MAX=895.
- Roster (Chamber B, official_count=5): Weste 665693 (rotational Mayor by title), Ayala 665689, Gibbs 665692, McLean -201394, Miranda -200980. All 1 press_use 600×750 headshot.
- Stances: 26 total (Weste 7 / McLean 8 / Miranda 6 / Gibbs 4 / Ayala 1), evidence-only, 100% cited, chairs model, no judicial topics. SB54/local-immigration only for 2018-seated (Weste/McLean/Miranda).
- ⚠ OUT-OF-SCOPE flag: global split-section check found 5 OTHER cities with pre-existing split-section defects (Whittier 8, Compton 6, Carson 5, South El Monte 4, South Pasadena 3) from prior phases — Santa Clarita is clean. Recommend a future cleanup pass.

### v17.0 milestone (active)

Bring the 15 largest uncovered LA County cities to Tier 1 depth. Phases 142–157, one per
city + close-out. **⚠️ NOT all greenfield — DB-pre-check every city before seeding.** At least
Long Beach (142) and Carson were already seeded in v7.0 + LA wave-1/wave-3 gap-fill migrations.
Truly greenfield city → create government + chamber → roster → headshots (600×750) → stances.
Partially-seeded city (e.g. Long Beach: gov + 9 officials + headshots exist, 0 stances) →
reconcile + complete + stances. Stances: evidence-only, one agent at a time, no defaults, honest
blanks. Verify per city: existing DB rows, form of government, mayor type, district vs at-large,
seat count. Reuses v7.0 CA city-deep-seed playbook + LOCATION-ONBOARDING.md. Requirements:
.planning/REQUIREMENTS.md · Roadmap: .planning/ROADMAP.md.

City order + geo_ids: 142 Long Beach 0643000 · 143 Santa Clarita 0669088 · 144 Glendale 0630000 ·
145 Lancaster 0640130 · 146 Palmdale 0655156 · 147 Pomona 0658072 · 148 Torrance 0680000 ·
149 Pasadena 0656000 · 150 Downey 0619766 · 151 El Monte 0622230 · 152 West Covina 0684200 ·
153 Inglewood 0636546 · 154 Burbank 0608954 · 155 Norwalk 0652526 · 156 Bellflower 0604982 ·
157 close-out.

### Previous milestone (v16.0 Utah Coverage — CLOSED 2026-06-18)

DB-verified: 104/104 legislators with stances (955 rows) + 10 cities deep-seeded (63 officials
with stances, 296 rows; 71/72 headshots); 1,251 total UT stance rows. Migration 877 resolved
UT-CITY-01 (removed 5 duplicate SLC/Ogden/Layton council office rows; SLC 8 / Ogden 8 /
Layton 6). Records: .planning/v16.0-MILESTONE-AUDIT.md + milestones/v16.0-{REQUIREMENTS,ROADMAP}.md.
Open carry-forward: SLC D4 Napier-Pearce portrait + stances (appointed, no source yet).

> The detailed Utah per-legislator / per-city research notes below are retained as historical
> reference; all are complete (see the ✅ section markers).

## Utah State LEGISLATURE stance research (in progress, started 2026-06-17)

Filling stances for the 82 UT legislators without them (22/104 had stances pre-start). **SENATE FIRST, one at a time, evidence-only.** 18 senators lacked stances; working in district order.
**✅ SENATE COMPLETE 2026-06-17 — 29/29 senators now have stances (DB-verified, 0 remaining).** Final 5 done this session: D25 McKell (6, mig 808), D26 Hinkins (6, mig 809), D27 Owens (4, mig 810), D28 Vickers (8, mig 811), D29 Ipson (9, mig 812). Next migration 813.

### HOUSE stance research (in progress — 64 reps without stances, district order, one at a time)

**✅ BATCH 1 COMPLETE (first 10 of 64; HD1→HD13; migrations 813-822; 70 stance rows; DB-verified 10/10 have stances).**

- HD1 Thomas W. Peterson (6, mig 813): abortion 4, civil-rights 5, fossil-fuels 5, school-vouchers 5, taxes 4, voting-rights 4 — all name+district confirmed (disambiguated from Petersen M./Peterson K.).
- HD2 Michael J. Petersen (7, mig 814): abortion 4, school-vouchers 5, civil-rights 5, taxes 4, voting-rights 4, trans-athletes 5 (first-party stmt — seated 2023 so NOT HB11 vote), religious-freedom 5 (HCR004 chief sponsor).
- HD4 Tiara Auxier (7, mig 815): voting-rights 4, taxes 4, deportation 5, immigration 5, redistricting 5 (SB1011), religious-freedom 5 (HB312 Bible-curriculum sponsor), childcare 2 (SB214 floor sponsor — ⚠ borderline polarity flag). Seated Jan 2025 so older canonical bills excluded.
- HD6 Rob Bishop (12, mig 816): former US Rep (2003-21), seated Apr 2026 → NO Utah votes; scored from 20-yr congressional record + campaign stmts: abortion 4, same-sex-marriage 5, civil-rights 5, immigration 5, healthcare 4, taxes 4, social-security 5, school-vouchers 5, voting-rights 4, climate-change 4, fossil-fuels 5, local-environment 5.
- HD7 Ryan D. Wilcox (6, mig 817): school-vouchers 5, civil-rights 5, trans-athletes 5, abortion 4, voting-rights 4, taxes 4. Service gap 2014-21 → 2019/2020 bills excluded.
- HD8 Jason B. Kyle (5, mig 818): taxes 4, voting-rights 4, deportation 5, local-immigration 5 (HB226), civil-rights 5 (SB295 2026). abortion+trans-athletes blank (no attributable vote).
- HD9 Jake Sawyer (3, mig 819): voting-rights 4, taxes 4, civil-rights 5 (SB295 2026). Freshman, thin record — honest blanks elsewhere.
- HD10 Jill Koford (5, mig 820): taxes 4, voting-rights 4, data-centers 2 (HB76 water-transparency sponsor), housing 4, economic-development 2 (free-market/anti-subsidy — polarity trap handled). Couldn't confirm name on HB226 → deportation blank.
- HD12 Mike Schultz (10, mig 821, HOUSE SPEAKER): abortion 4, school-vouchers 5, trans-athletes 5 (HB11 override by name), civil-rights 5, taxes 4, voting-rights 4, fossil-fuels 5 ("save coal"), housing 4 ("policy not funding"), homelessness 4 + homelessness-response 4 (enforcement-first). climate-change DROPPED for consistency (don't infer from fossil-fuels alone).
- HD13 Karen M. Peterson (9, mig 822): school-vouchers 5, trans-athletes 5, civil-rights 5, abortion 4, voting-rights 4, taxes 4, economic-development 2 (anti-subsidy), housing 4 + residential-zoning 4 (anti-density-mandate/local-control). Seated Jan 2022 → full canonical set valid.
- ⚠ NAME-COLLISION handled: Peterson T. (D1) vs Petersen M. (D2) vs Peterson K. (D13) vs Peterson V. (D56) — all confirmed by name+district per roll call.
- METHOD VALIDATED on House: agents correctly excluded pre-tenure bills (seating checks), caught the Doug-Owens-style risk, handled economic-development/residential-zoning inverted polarities, and left honest blanks for thin records. Next migration 823. **HOUSE: 10/64 done.**

**BATCH 2 (in progress — target HD14→HD34, mixed-party; dual-party prompt handles Dems via HB300-NO→voting-rights=2 caucus rule + progressive-record research).** Done so far:

- HD14 Karianne Lisonbee (8, mig 823): abortion 4 (SB174 floor sponsor), trans-athletes 5 (HB11 cosp), voting-rights 4 (HB332 ERIC-withdrawal sponsor — not HB300), civil-rights 5 (presented HB261), religious-freedom 5 (HB390), deportation 5, immigration 5, local-immigration 5 (campaign platform).
- HD15 Ariel Defay (7, mig 824): abortion 4 (first-party), taxes 4 (HB106), voting-rights 4 (HB300), deportation 5 + local-immigration 5 (HB226), civil-rights 5 (SB295 2026), ai-regulation 2 (HB276 AI-guardrail sponsor). Seated Nov 2023.
- HD16 Trevor Lee (7, mig 825): abortion 4, civil-rights 5 (HB183 sex-designation anti-discrim rollback, chief sponsor), deportation 5 + local-immigration 5 (HB226), school-vouchers 5, taxes 4 (HB54), voting-rights 4. trans-athletes BLANK (his trans bills are flags/sex-designation not sports → EXTRA).
- HD17 Stewart E. Barlow (10, mig 826, physician): voting-rights 4, abortion 4 (SB174+HB467), school-vouchers 5, trans-athletes 5 (HB11), civil-rights 5, taxes 4, medicare/aid 4 (SB96, seated 2019), deportation 5 + local-immigration 5 (HB226), healthcare 5 (first-party market-based). Confirmed District 17 (FastDemocracy D43 mislabel noted).
- HD18 Paul A. Cutler (10, mig 827): abortion 4, ai-regulation 5 (HB320 pro-deployment sandbox — light-touch, opposite of Defay's guardrails), civil-rights 5, deportation 5 + local-immigration 5 (HB226), religious-freedom 5, school-vouchers 5, taxes 4, voting-rights 4, local-environment 2 (first-party GSL protection — cross-cut).
- HD19 Raymond P. Ward (13, mig 828, MODERATE physician — most independent R so far): abortion 4 (HB467; 2020 trigger-ban NAY noted), civil-rights 5, climate-change 1 (HJR3 carbon-fee sponsor!), deportation 5 + local-immigration 5 (HB226), fossil-fuels 2 (HB340 solar), healthcare 2 (pro-Medicaid-expansion), housing 2 + residential-zoning 4 (pro-density YIMBY: HB175 4-plex/HB88 ADU/HB90 lot-caps), school-vouchers 5, taxes 4, trans-athletes 5, voting-rights 4 (confirmed YEA, NOT a defector here). medicare/aid + local-environment BLANK (conflicting evidence — SB96 YEA vs pro-expansion; HB470 NOx repeal vs clean-air record).
- HD20 Melissa G. Ballard (11, mig 829): abortion 4, voting-rights 4, school-vouchers 5, trans-athletes 5, civil-rights 5, taxes 4, medicare/aid 4 (SB96), deportation 5 + local-immigration 5 (HB226), fossil-fuels 5 (HCR9 coal co-sponsor), transportation-priorities 2 (transit/EV record). climate-change BLANK (mixed: pro-EV bills + pro-coal).
- ⚠ POLARITY FIX APPLIED: HD13 Karen Peterson residential-zoning corrected 4→2. She PRESERVES single-family/opposes density mandates = LOW end of inverted scale (1=preserve SF, 5=end SF). Agent wrote right reasoning, wrong number. **LESSON: double-check residential-zoning numbers — "opposes density/preserve single-family" = 1-2 NOT 4-5; "ends single-family/pro-density (ADU/4-plex/lot-caps)" = 4-5.** Ward=4 (pro-density) vs K.Peterson=2 (anti-density) now correct.
- HD22 Jennifer Dailey-Provost (10, mig 830, DEM): abortion 1, healthcare 1, voting-rights 2 (HB300 caucus NO), civil-rights 1 (opposed HB261, quote), trans-athletes 1, fossil-fuels 2, climate-change 2, housing 2, childcare 2, local-environment 2. From first-party statements + caucus-unanimous HB300 (agent rejected a hallucinated "supported HB300" claim).
- HD23 Hoang Nguyen (14, mig 831, DEM, seated 2025): abortion 1, voting-rights 2 (HB300 NAY by NAME), school-vouchers 1, civil-rights 1, same-sex-marriage 1, immigration 2, local-immigration 2, climate-change 2, fossil-fuels 2, local-environment 1, housing 2, homelessness 1, homelessness-response 1, redistricting 1. From Vote411 + campaign issue pages + HB141 floor debate.
- HD24 Grant Amjad Miller (6, mig 832, DEM, freshman 2025): voting-rights 2 (HB300 NAY by name; disambiguated from Miller T. D45 who voted YEA), homelessness 1 + homelessness-response 1 (HB362 Homeless Rights chief sponsor), trans-athletes 1 + civil-rights 1 (opposed HB269 + ACLU board), abortion 2.
- HD25 Angela Romero (14, mig 833, DEM, MINORITY LEADER): civil-rights 1 (HB261 NAY) + school-vouchers 1 (HB215 NAY) roll-call confirmed; abortion 1, voting-rights 2, climate-change 2, fossil-fuels 2, local-environment 1, transportation-priorities 1, healthcare 2, homelessness 2, homelessness-response 2, housing 2, immigration 1, public-safety-approach 2 (police reform). deportation/local-immigration/medicare-aid/trans-athletes BLANK.
- HD26 Matt MacPherson (4, mig 834, R, seated Oct 2023): civil-rights 5 (HB261), taxes 4 (HB106), deportation 5 + local-immigration 5 (HB226 co-sponsor). voting-rights BLANK (ABSENT both HB300 votes — no inference); abortion BLANK (HB560 ambiguous).
- HD27 Anthony E. Loubet (8, mig 835, R): voting-rights 4, abortion 4 (HB467), school-vouchers 5, civil-rights 5, taxes 4 (HB54), deportation 5 + local-immigration 5 (HB226), residential-zoning 1 (first-party opposes density = LOW inverted).
- HD28 Nicholeen P. Peck (6, mig 836, R, seated 2025): voting-rights 4, abortion 4 (HB232 sponsor), civil-rights 5 (SB295), taxes 4, religious-freedom 5 (HB095 sponsor + WOW president), same-sex-marriage 5 (WOW org statement). trans-medical bills → EXTRA.
- HD29 Bridger Bolinder (4, mig 837, R): abortion 4 (HB467), school-vouchers 5, civil-rights 5 (HB261), taxes 4 (HB54). voting-rights BLANK (absent HB300); thin rural record.
- HD30 Jake Fitisemanu (10, mig 838, DEM, seated 2025): voting-rights 2 + civil-rights 1 (HB174 trans-care-ban NAY) roll-call confirmed; healthcare 1, housing 2, transportation-priorities 1, climate-change 2, local-environment 2, taxes 2 (food-tax repeal), immigration 2, public-safety-approach 2. deportation/abortion BLANK (absent HB226 / no statement).
- HD31 Verona Mauga (9, mig 839, DEM, seated 2025): voting-rights 2, abortion 2 (HB233 NAY), civil-rights 1 (HB77 Pride-flag-ban NAY), deportation 1 + local-immigration 1 + immigration 2 (HB226 NAY), transportation-priorities 1 (HB290 sponsor), housing 2 (HB541 sponsor), public-safety-approach 2 (HB166 open-carry-limit sponsor). All roll-call/sponsorship confirmed.
- HD32 Sahara Hayes (11, mig 840, DEM, seated 2023): school-vouchers 1 (HB215 NAY), civil-rights 1 (HB261+HB77 NAY), voting-rights 2, deportation 1 + local-immigration 1 + immigration 2 (HB226 NAY), abortion 1, healthcare 1, housing 1, climate-change 2, local-environment 1 (platform).
- HD33 Doug Owens (11, mig 841, DEM, moderate, seated 2023; ≠ Sen. Derrin Owens): abortion 2 (HB467 NAY), school-vouchers 2 (HB215 NAY), civil-rights 1 (HB261 NAY), voting-rights 2, deportation 2 + local-immigration 2 (HB226 NAY — held Dem line, didn't cross), healthcare 2, medicare/aid 2, climate-change 2 (Clean Air Caucus), fossil-fuels 2, local-environment 1 (GSL bills).
- HD34 Carol Spackman Moss (11, mig 842, DEM, seated 2001; ≠ J. Moss R): school-vouchers 1 (HB215 NAY), civil-rights 1 (HB261 NAY), voting-rights 2, deportation 1 + local-immigration 2 (HB226 NAY), redistricting 1 (SB200 floor sponsor), climate-change 1, fossil-fuels 2, local-environment 1, transportation-priorities 1, trans-athletes 1 (opposed HB11). abortion UNCERTAIN (only 3rd-party endorsement).
- ✅ **BATCH 2 COMPLETE (20 reps HD14-34; migrations 823-842).** ⚠ DEM HANDLING WORKS: HB300 caucus-unanimous NO → voting-rights=2; Vote411/campaign pages = first-party progressive evidence; LOW (1-2) except residential-zoning inverted. ⚠ Rs ABSENT on HB300 (MacPherson, Bolinder) → voting-rights blank. Name-collisions all handled: Peterson T/Petersen M/Peterson K/V, Miller G vs T, Doug vs Derrin Owens, Carol vs J. Moss.
- Next migration 843. **HOUSE: 41/75 have stances (DB-verified); 34 reps remain.** (30 added this session: batch 1 = 10, batch 2 = 20.)

### HOUSE BATCH 3 (in progress — target HD36-61, ~20 reps, unified dual-party prompt)

- HD36 James A. Dunnigan (7, mig 843, R pragmatic): abortion 4, school-vouchers 1 (GOP defector — NAY HB215), trans-athletes 5, civil-rights 5, taxes 4, childcare 5 (NO on 2026 SB248 Child Care Expansion Act), voting-rights 2 (LONE GOP NAY on HB300). healthcare UNCERTAIN (mixed insurance-expert record).
- HD37 Ashlee Matthews (6, mig 844, DEM): school-vouchers 2, civil-rights 1, voting-rights 2 (HB215/HB261/HB300 NAY), childcare 1 (sponsor), transportation-priorities 2, local-environment 2 (platform).
- HD38 Cheryl K. Acton (6, mig 845, R): abortion 4 (HB136 prime sponsor + HB467), school-vouchers 5, civil-rights 5, trans-athletes 5, voting-rights 4, taxes 4.
- HD39 Ken Ivory (10, mig 846, R public-lands figure): abortion 4, school-vouchers 5, trans-athletes 5, civil-rights 5, taxes 4, deportation 5 + local-immigration 5 (HB226), fossil-fuels 5 + climate-change 4 (HB425 chief sponsor), local-environment 5 (public-lands transfer). voting-rights BLANK (absent HB300).
- HD40 Andrew Stoddard (13, mig 847, DEM prosecutor): abortion 1, civil-rights 1, trans-athletes 1 (HB467/HB261/HB11 NAY), voting-rights 2, school-vouchers 2, local-environment 1 (HB220 sponsor), climate-change 2, data-centers 2 (opposes Stratos), housing 2, taxes 2, public-safety-approach 2, childcare 2, healthcare 2. deportation/local-immigration BLANK (voted YES on narrowed HB226 — conflicts with platform; honest blank).
- ⚠ CLARIFICATION for future agents: HB226 (2025 "Criminal Amendments") IS the ICE-coordination/deportation bill (raises max sentence to trigger federal deportation + jail-ICE notification). One agent wrongly doubted this. HB215 Dem caucus also unanimous NO (safe caucus-inference like HB300).
- HD41 John Arthur (10, mig 848, DEM teacher, seated DEC 2025 — NOT 2025-GS): school-vouchers 1 (HB198 sponsor), housing 1 (HB478 rent-notice sponsor), healthcare 2, childcare 2, climate-change 2, local-environment 2, transportation-priorities 2, taxes 2, civil-rights 2 (book-bans local-control), public-safety-approach 2. All first-party (sworn in too late for 2023/2025-GS votes).
- HD42 Clinton Okerlund (6, mig 849, R MODERATE, freshman 2025): voting-rights 4, taxes 4 (HB300/HB106 YEA), housing 4, local-environment 2 (GSL+water bill), climate-change 2, transportation-priorities 2 (anti-LCC-gondola). Env/transit left of GOP norm. deportation blank (absent HB226).
- HD44 Jordan D. Teuscher (12, mig 850, R leadership): abortion 4, school-vouchers 5, civil-rights 5, trans-athletes 5, taxes 4, voting-rights 4, deportation 5 + local-immigration 5 (HB226), immigration 4, fossil-fuels 4 (all-of-above), growth-and-development 2, housing 4 (corrected from agent's 2 — deregulation=market=HIGH). HB267 anti-union sponsor → EXTRA.
- HD46 Calvin Roberts (6, mig 851, R, freshman 2025): voting-rights 4, taxes 4 (+HB575 fuel-tax cut), deportation 5 + local-immigration 5 (HB226), fossil-fuels 5 (HB575 oil/gas prime sponsor), childcare 5 (SB248 NAY).
- HD47 Mark A. Strong (7, mig 852, R): school-vouchers 5, abortion 4, civil-rights 5, voting-rights 4, taxes 4, deportation 5 + local-immigration 5 (HB226). Energy vote was 69-1 (not clean) → fossil blank.
- ⚠ HOUSING POLARITY (recurring): deregulation/"get govt out"/market = HIGH (4); intervention/affordability/tenant-protection = LOW (1-2); interventionist pro-density YIMBY mandates (Ward) = LOW (2). Corrected Teuscher 2→4.
- HD50 Stephanie Gricius (7, mig 853, R): abortion 4, voting-rights 4, school-vouchers 5, civil-rights 5, taxes 4, deportation 5 + local-immigration 5 (HB226). ai-regulation blank (HB452 is Moss's, not hers); fluoride-ban + sex-designation → EXTRA.
- HD51 Leah Hansen (1, mig 854, R, appointed Aug 2025): civil-rights 5 (first-party HB261 advocacy) ONLY. Most-dissenting member in 20 years (54% NO) — caucus inference unsafe + no accessible roll-call data; honest near-empty.
- HD52 A. Cory Maloy (9, mig 855, R): abortion 4 (SB174+HB467), school-vouchers 5, trans-athletes 5 (HB11), civil-rights 5, taxes 4, voting-rights 4, deportation 5 + local-immigration 5 (HB226), childcare 5 (SB248 NAY). Disambiguated from US Rep Celeste Maloy.
- HD54 Kristen Chevrier (4, mig 856, R, seated 2025): voting-rights 4, taxes 4, deportation 5 + local-immigration 5 (HB226). Health-freedom/medical-autonomy record → EXTRA (not forced onto healthcare); 2023/24 anchors excluded (seated 2025).
- HD55 Jon Hawkins (6, mig 857, R): abortion 4, school-vouchers 5, taxes 4 (HB54), civil-rights 5, deportation 5 + local-immigration 5 (HB226). voting-rights blank (absent HB300). Agent re-confirmed HB226 IS the ICE bill.
- TODO batch 3: HD56 Val L. Peterson(R — the 4th Peterson), HD58 Shallenberger, HD59 Kohler(R), HD60 Pace, HD61 Shepherd(R).
- HD56 Val L. Peterson (10, mig 858, R, the 4th Peterson — all confirmed "Peterson, V." D56): abortion 4, school-vouchers 5, civil-rights 5, trans-athletes 5, voting-rights 4, taxes 4, deportation 5 + local-immigration 5 + immigration 5 (HB226), childcare 5 (SB248 NAY). Parser sanity-checked vs T/K/M Peterson.
- HD58 David Shallenberger (7, mig 859, R, seated 2025): voting-rights 4, deportation 5 + local-immigration 5 (HB226), taxes 4, healthcare 5 (free-market/HSAs), economic-development 2 (anti-subsidy), local-environment 4 (market-based/property).
- HD59 Mike L. Kohler (8, mig 860, R): voting-rights 4, school-vouchers 5, trans-athletes 5 (HB11), civil-rights 5, taxes 4, deportation 5 + local-immigration 5 (HB226), childcare 5 (SB248 NAY). abortion blank (Not Voting on HB467).
- HD60 Grant Pace (2, mig 861, R, appointed MAY 2026 — no floor record): housing 2 (anti-hedge-fund), residential-zoning 2 (preserve-character). Platform-only; honest thin.
- HD61 Lisa Shepherd (6, mig 862, R, seated 2025): voting-rights 4, taxes 4, deportation 5 + local-immigration 5 (HB226), childcare 5 (SB248 NAY), civil-rights 5 (SB295 2026 YEA). [childcare+civil-rights set to 5 for cross-rep consistency.]
- ✅ **BATCH 3 COMPLETE (20 reps HD36-61; migrations 843-862).** Disambiguations handled: all 4 Petersons, Cory vs Celeste Maloy, Miller G/T. Seating-date catches: Arthur (Dec 2025), Pace (May 2026), Chevrier/Roberts/Okerlund/Shepherd/Shallenberger (Jan 2025) — pre-tenure anchors excluded. Housing-polarity correction (Teuscher 2→4). Multiple voting-rights blanks for Rs absent on HB300 (Ivory, Hawkins, MacPherson, Bolinder).
- Next migration 863. **HOUSE: 61/75 have stances (DB-verified); 14 remain.** (50 added this session: batch 1=10, batch 2=20, batch 3=20.)

### HOUSE BATCH 4 (FINAL 14, in progress — HD62-75, all rural/southern-UT Republicans)

- HD62 Norman K. Thurston (12, mig 863, R): abortion 4, civil-rights 5, deportation 5, fossil-fuels 5 (HB191 coal), healthcare 5 (anti-ACA+SB96), local-immigration 5, medicare/aid 4 (SB96), school-vouchers 5, taxes 4, trans-athletes 5, voting-rights 4, childcare 5 (SB248 NAY).
- HD63 Stephen L. Whyte (10, mig 864, R): voting-rights 4, abortion 4, school-vouchers 5, civil-rights 5, taxes 4, deportation 5 + local-immigration 5 (HB226), residential-zoning 5 + housing 4 + growth-and-development 5 (Housing Affordability Commission co-chair, deregulatory YIMBY).
- HD64 Jackie Larson (2, mig 876, R, appointed MAY 2026): residential-zoning 2 + growth-and-development 2 — local-control/community-character growth platform is her DOCUMENTED SIGNATURE ISSUE (entered politics fighting a rezoning; "I support local control over planning and zoning"; "Responsible Growth that Respects Community Character"; electjackielarson.com/issues). No floor record (appointed after both sessions adjourned), so all other topics honest BLANK. Prior session marked her full-blank as "values-level platform only"; on actual research her growth/zoning stance is specific+directional, not boilerplate → 2 evidence-bounded stances kept (user-confirmed 2026-06-18). school-vouchers/taxes dropped as too soft (generic "right to choose" / balanced-budget language ≠ directional placement). Revisit other topics after 2027 session.
- HD65 Doug Welton (8, mig 865, R teacher): voting-rights 4, school-vouchers 5, abortion 4, civil-rights 5, trans-athletes 5, deportation 5 + local-immigration 5 (HB226), taxes 4. EXTRA: opposed HB267 union ban (teacher cross-pressure); childcare UNCERTAIN.
- HD66 Troy Shelley (8, mig 866, R, seated 2025): voting-rights 4, taxes 4, civil-rights 5 (SB295), deportation 5 + local-immigration 5 (HB226), fossil-fuels 5, climate-change 4 (anti-renewable platform), immigration 4.
- HD67 Christine Watkins (9, mig 867, R ex-Dem): school-vouchers 5, civil-rights 5, trans-athletes 5, voting-rights 4, deportation 5 + local-immigration 5 (HB226), taxes 4, fossil-fuels 5, childcare 2 (SB248 YES — DEFECTED left). EXTRA: opposed HB267 union ban (labor defection). abortion blank (absent).
- HD68 Scott H. Chew (11, mig 868, R rancher): voting-rights 4, civil-rights 5, school-vouchers 5, trans-athletes 5, taxes 4, medicare/aid 4 (SB96), deportation 5 + local-immigration 5 (HB226), childcare 5 (SB248 NAY), fossil-fuels 5 + local-environment 5 (SB224 coal). abortion blank (absent all 3).
- HD69 Logan Monson (12, mig 869, R freshman 2025): abortion 4 (sanctity-of-life+HB233), civil-rights 5 (SB295), childcare 5, deportation 5 + local-immigration 5 + immigration 5 (HB226), taxes 4, voting-rights 4, economic-development 2, public-safety-approach 4, school-vouchers 5, religious-freedom 5.
- HD70 Carl R. Albrecht (10, mig 870, R energy leader): voting-rights 4, abortion 4, civil-rights 5, trans-athletes 5, taxes 4, medicare/aid 4, deportation 5 + local-immigration 5 (HB226), fossil-fuels 5 + climate-change 4 (SB224 floor sponsor). school-vouchers UNCERTAIN (voted NAY — rural funding objection).
- HD71 Rex P. Shipp (10, mig 871, R): abortion 4 (SB174+HB467), voting-rights 4 (+HB213 sponsor), school-vouchers 5, civil-rights 5, trans-athletes 5, taxes 4, medicare/aid 4 (SB96), deportation 5 + local-immigration 5 (HB226), childcare 5 (SB248 NAY).
- HD72 Joseph Elison (8, mig 872, R): abortion 4, school-vouchers 5, civil-rights 5, voting-rights 4, taxes 4, deportation 5 + local-immigration 5 (HB226), childcare 5 (SB248 NAY).
- HD73 Colin W. Jack (8, mig 873, R, energy cmte chair): abortion 4, school-vouchers 5, civil-rights 5, voting-rights 4, taxes 4, deportation 5 + local-immigration 5 (HB211 chief sponsor — absent on HB226), climate-change 4 (anti-renewable solar-restriction bills HB241/HB201).
- HD74 R. Neil Walter (8, mig 874, R): abortion 4, school-vouchers 5, civil-rights 5, taxes 4, voting-rights 4, deportation 5 + local-immigration 5 (HB226), fossil-fuels 5 (SB514 IPP-coal prime sponsor).
- HD75 Walt Brooks (9, mig 875, R): voting-rights 4, abortion 4, school-vouchers 5, trans-athletes 5, civil-rights 5, taxes 4, medicare/aid 4 (SB96), deportation 5 + local-immigration 5 (HB226). FINAL UT LEGISLATURE REP.

## ✅✅ UTAH LEGISLATURE STANCE RESEARCH COMPLETE (2026-06-18)

**DB-verified: Senate 29/29 + House 75/75 = 104/104 legislators have evidence-only compass stances (FULLY COMPLETE 2026-06-18).** Final fill: **HD64 Jackie Larson** got 2 evidence-bounded stances (residential-zoning 2 + growth-and-development 2, mig 876) from her documented signature growth/zoning local-control platform — re-research overturned the prior session's "values-level only" full-blank call (user-confirmed). All her other topics remain honest blanks (appointed May 2026, no floor record; revisit after 2027 session). Migrations 808-876 (Senate 808-812; House batch1 813-822, batch2 823-842, batch3 843-862, batch4 863-875, Larson 876). **Next migration 877.**
Method held throughout: one research agent at a time (rate-limit rule), every value name-confirmed on le.utah.gov roll calls / sponsored bill / first-party statement, no defaults, honest blanks. Cross-rep consistency enforced on housing/residential-zoning inverted polarity, economic-development anti-subsidy=LOW, childcare SB248 (NO=5 / YES=2), and SB295/HB261 civil-rights=5. Disambiguations: all 4 Petersons, Cory vs Celeste Maloy, Doug vs Derrin Owens, Carol vs Jefferson Moss, Miller G/T. Many honest blanks: GOP defectors (Hinkins/Owens vouchers; Dunnigan lone HB300 NAY→voting-rights 2; Watkins childcare 2/labor), Rs absent on HB300 (Ivory/Hawkins/MacPherson/Bolinder/Kohler/Bolinder), seating-date exclusions (10+ freshmen). REMAINING UT GAPS: SLC D4 Napier-Pearce (city, appointed, 0 stances). [HD64 Larson resolved 2026-06-18 — 2 stances added. Sandy headshots VERIFIED COMPLETE 2026-06-18 — all 8/8 live in Supabase Storage (politician_photos/{id}-headshot.jpg), 600×750, type=default, press_use; the "0 photos / CivicPlus SPA" note was stale, resolved in an earlier session.]
**LANDING.JSX — VERIFIED COMPLETE 2026-06-18:** Utah is fully wired identically to every other covered state. All 10 UT cities in COVERAGE_STATES (Landing.jsx:117-129, commits 3cf6fe4/27e16e1) carry browseStateAbbrev:'UT' + hasContext:true (purple). The state legislature surfaces via browse_state=UT (city browse sends {government_geo_ids, state:'UT'} → backend returns city officials + UT legislators). DB-verified all 104 UT legislator offices have districts.state='ut' (lowercase STATE_UPPER/STATE_LOWER) — the exact casing browse_state relies on. NO standalone statewide browse tile exists for ANY state by design (legislature always rides along with a city browse). Decision (user, 2026-06-18): leave as-is — nothing to add. (A dedicated statewide-legislature tile would be a NEW UI pattern + backend change if ever wanted.)

- DONE: D1 Sandall (6), D2 Wilson (5), D4 Musselman (2), D6 Stevenson (7), D8 Weiler (7), D13 Blouin (14), D15 Riebe (6), D16 Harper (7), D17 Fillmore (6), D19 Cullimore (6), D20 Winterton (7), D22 Balderree (4). [12/18]
- DONE+: D24 Stratton (2), D25 McKell (6, mig 808), D26 Hinkins (6, mig 809), D27 Owens (4, mig 810), D28 Vickers (8, mig 811). [17/18]. TODO: D29 Ipson 389df734-b0a0-4223-befd-e02105c4160b
  - Vickers (migration 811, Senate Majority Leader): voting-rights 4, abortion 4, school-vouchers 5, trans-athletes 5, civil-rights 5, taxes 4, medicare/aid 4, fossil-fuels 5 — ALL confirmed by name on roll calls (medicare/aid also first-party quote). ✅ HB300 FLAG RESOLVED: Vickers voted NAY in committee but YEA on final passage (19-10) — confirmed by name, voting-rights=4 valid. climate-change + healthcare left blank (ambiguous polarity despite pharmacist background — good rigor). Next migration 812.
  - Owens (migration 810): abortion 4 (HB467), civil-rights 5 (HB261), taxes 4 (SB69), fossil-fuels 5 (sponsored SB161 Energy Security to block coal decommissioning). FALSE-POSITIVE CAUGHT: "Owens, D." NAY on HB11 trans-athletes = DOUG Owens (House D33), NOT Derrin (who was out of legislature 2021-22) → trans-athletes NOT scored. DEFECTOR: voted NO on HB215 vouchers as an educator → school-vouchers blank (ambiguous). voting-rights blank (HB300 name unconfirmed). EXTRA: voted YEA HB257 trans-bathroom (no clean topic, NOT forced). Next migration 811.
  - Hinkins (migration 809): abortion 4 (SB174), civil-rights 5 (HB261), trans-athletes 5 (HB11 override), taxes 4 (SB69), medicare/aid 4 (SB96 Prop3, named by SL Trib), fossil-fuels 5 (chief sponsor SB250/SB172, coal-country businessman). DEFECTOR FLAGS: voted NAY on HB300 → voting-rights NOT scored (GOP defector, ambiguous polarity per caucus rule); voted NO on HB215 vouchers for rural-access reasons → school-vouchers NOT scored (ambiguous). climate-change left blank (no direct climate statement — not inferred from fossil-fuels). Next migration 810.
  - McKell (migration 808): all 6 confirmed by NAME on le.utah.gov roll calls / first-party sponsorship → voting-rights 4 (HB300 floor sponsor), civil-rights 5 (HB261 anti-DEI), school-vouchers 5 (HB215), abortion 4 (HB467 ban+exceptions), trans-athletes 5 (HB11 override), taxes 4 (HB106 income-tax cut). Honest blanks: fossil-fuels/climate (only nuclear evidence — doesn't map to coal/IPP anchors), childcare (no McKell bill — SB176/SB248 are others'), medicare/aid (no attributable SB96/Prop3 vote). EXTRA: prime sponsor SB152 social-media age-verification (no clean in-scope topic). Next migration 809.
- ⚠ CHILDCARE FLAG: applied Weiler childcare=4 (NO) & Winterton childcare=2 (YES) from Freedom Index "SB248 childcare." BUT 2025 SB248 = Controlled Substances; childcare bill is 2026 SB248 (possibly in-progress). Votes are opposite (internally consistent) so likely real committee/floor votes, but VERIFY both against a named 2026 roll call later; revert if unconfirmed.
- ECON-DEV POLARITY TRAP: a conservative's "anti-crony-capitalism / govt shouldn't pick winners & losers / free-market" = ANTI-subsidy = LOW end (1-2), NOT 5. Anti-union/labor bills do NOT map to economic-development at all (EXTRA). Agents keep mis-scoring this 5 — drop or invert. Vickers (D28) voted YEA on HB300 final passage (only Weiler was GOP no there) — confirm names, don't assume.
- HB300 voting-rights inference rule: Dem caucus voted unanimously NO (confirmed) → safe to score Dems voting-rights=2 without individual name. GOP NOT unanimous (Weiler+Vickers defected) → require individual name to score a Republican; else skip.
- METHOD: research agent per senator → mine BOTH le.utah.gov/DynaBill/svotes.jsp named roll calls AND campaign/platform issue statements (first-party stated positions are valid evidence, same as city officials). Apply via inform.politician_answers (1-5 direct). Then HOUSE (64 reps).
- FAIRNESS NOTE: D1/D2/D4/D6 (Sandall/Wilson/Musselman/Stevenson) were vote-mined ONLY (low counts 2-7); Blouin platform-mined → 14. For balance, those 4 GOP senators may warrant a later platform pass so coverage isn't systematically higher for Dems. Skip judicial-* topics for all legislators.
- CANONICAL UT GOP votes → score (most R senators voted identically; still verify each by name): trigger-ban SB174 / clinic bills = abortion **4** (has rape/incest/life exceptions, NOT 5); HB215 Utah-Fits-All = school-vouchers **5**; HB11 sports/override = trans-athletes **5**; HB261 anti-DEI = civil-rights **5**; HB300 = voting-rights **4**; annual income-tax-rate cut (HB54/SB69/HB106) = taxes **4** (incremental, not 5); SB96 Prop3 Medicaid scaleback = medicare/aid **4**; coal/IPP energy bills = fossil-fuels **5**, climate-change **4**.
- MAPPING GUARDRAILS: pride-flag ban, trans-bathroom, trans-medical bills = NO clean topic (report EXTRA, do NOT force civil-rights/same-sex-marriage). abortion only from access/legality votes. economic-development = corporate incentives only (NOT labor/union). Verify scale text in inform.compass_stances when unsure.

## Utah State Senate split-section repair (migration 807, 2026-06-17)

Utah Senate showed 25/29 members. Root cause: 4 senators (Johnson D3, Millner D5, Buss D11, Brammer D21) existed with correct office titles/districts/photos/stances but their offices' chamber_id pointed at COUNTY chambers (Box Elder/Cache/Davis/Iron) instead of Utah State Senate (972db9ce-9f24-4df8-b828-1e2951e8fa90) — a split-section mis-parent bug. Fix: repointed the 4 offices' chamber_id (NOT new records — they had 18-24 stances each + photos). Senate now 29/29, House 75/75; split-section scan = 0 mis-parented. Their provider external_ids: Johnson -327384, Millner -301441, Buss -334574, Brammer -314306. (Utah Senate convention: external_id = provider numeric ID, district STATE_UPPER geo_id 490NN G5210 state='ut', image politician_photos/ut/{absid}.jpg type=default license=sourced.)

## Utah City Deep-Seed (in progress, started 2026-06-17)

Goal: full deep-seed (roster → headshots → stances) of all 10 Utah city governments, biggest first. Cities existed as empty shells (government + 1 chamber, no officials except SLC's 1).
Order: Salt Lake City → West Valley City → West Jordan → Provo → Orem → Ogden → Sandy → St. George → Lehi → Layton.

- **Migration 777 (applied as raw SQL):** Salt Lake City structure. Reused existing gov (geo_id 4967000) + "Salt Lake City Council" chamber. Fixed stale "Ward 4/5" → numbered districts. Seeded Mayor (citywide LOCAL_EXEC, geo_id 4967000) + 7 council districts (LOCAL, OCD geo_ids, state='UT'). external_ids: Mayor -4967000001, D1 -4967000011 … D7 -4967000017 (D5 Erika Carlsen kept existing record -375831 + her 5 stances + photo). 8 filled offices verified.
- Roster (verified June 2026, slc.gov): Mayor Erin J. Mendenhall; D1 Victoria Petro-Eschler; D2 Alejandro Puy (Chair); D3 Chris Wharton; D4 Jennifer Napier-Pearce (appointed 2026-06-09); D5 Erika Carlsen (Vice Chair); D6 Daniel E. Dugan; D7 Sarah Young.
- **Migration 778 (applied):** SLC headshots. Uploaded 6 official slc.gov portraits (full-res, 4:5 → 600x750) to Storage + politician_images (type='default', press_use): Mayor + D1/D2/D3/D6/D7. Carlsen (D5) already had one. **7/8 have photos.**
  - **GAP — D4 Jennifer Napier-Pearce:** slc.gov page still shows only the district seal (page "to be updated"). A cropped slc.gov swearing-in photo was prepared but user chose to SKIP for now; revisit when slc.gov posts her official portrait.
- **Migration 779 (applied):** SLC stance research — evidence-only, one agent at a time, all live compass topics, no defaults. New stances applied: Mendenhall 17, Petro-Eschler 7, Puy 7, Wharton 10, Dugan 5, Young 8 (= 54 new); Carlsen already had 5. **Total 59 across SLC; 7/8 officials have stances.**
  - **GAP — D4 Napier-Pearce: 0 stances (intentional).** Appointed 2026-06-09; journalist + ex-Gov-Cox-spokesperson background = professional neutrality; no attributable council votes yet. Honest blank per no-default rule. Revisit after she accumulates District 4 votes.
  - Scale notes verified against inform.compass_stances: residential-zoning polarity inverted (1=preserve single-family, 5=end it); transportation-priorities IS a valid 1-5 scale (1=transit/bike/ped-first, 5=highways+parking) despite being absent from the compass-topics-reference.md file.
- **WEST VALLEY CITY COMPLETE** (geo_id 4983470; migrations 780 structure / 781 headshots / 782 stances). 7 elected (Mayor Karen Lang + 2 At-Large Christensen/Nordfelt on citywide LOCAL_EXEC + D1 Huynh/D2 Harmon/D3 Whetstone/D4 Wood). external_ids -4983470001 (mayor), -002/-003 (at-large), -011..-014 (districts). 7/7 headshots (wvc-ut.gov CMS /ImageRepository/Document?documentId=NNNN, press_use). 18 stances (council-manager suburb = thin records: 4/3/2/1/3/3/2). Efficiency win: ONE consolidated stance agent for the 6 council members (not 6 separate) — honors no-parallel rule, far cheaper. Going forward: 1 roster+photo agent + 1 consolidated stance agent (whole roster) per city.
- **WEST JORDAN COMPLETE** (geo_id 4982950; migrations 783/784/785). Strong-mayor system, 8 elected (Mayor Burton + 3 At-Large Wignall/Harris/Whitelock citywide LOCAL_EXEC + D1 Lamb/D2 Bedore/D3 Jacob/D4 Shelton). external_ids -4982950001 (mayor), -002..-004 (at-large), -011..-014 (districts). 8/8 headshots (westjordan.utah.gov wp-content, press_use). 21 stances. NOTE: taxes topic (f7e5678d) scale is wealthy/corporate-tax-vs-shrink-gov — only assign for clear low-tax IDEOLOGY (Burton/Whitelock=4), NOT mere municipal budget prudence (dropped Jacob).
- **PROVO COMPLETE** (geo_id 4962470; migrations 786/787/788). Mayor-council, 8 elected (Mayor Judkins + Citywide I MacKay/Citywide II Garrett on LOCAL_EXEC + D1 Christensen/D2 Whitlock/D3 Bogdin/D4 Hoban/D5 Whipple — note 5 districts). external_ids -4962470001 (mayor), -002/-003 (citywide), -011..-015 (districts). 8/8 headshots (provo.gov /ImageRepository/Document?documentID=NNNN — capital ID, press_use). 26 stances; Bogdin & Hoban = honest 0 (generic platform only). Judkins trans-athletes=4 (co-sponsored Utah HB11).
- **OREM COMPLETE** (geo_id 4957300; migrations 789/790/791). Council-manager, 7 all-AT-LARGE (Mayor McCandless + 6 council, no districts, all on citywide LOCAL_EXEC). external_ids -4957300001..-007. 7/7 headshots (orem.gov wp-content, mostly .webp; Millett's is low-res 240x300 — only official available; press_use). 18 stances (strong anti-high-density signal; Wilkerson Farm 4-3 rezone = growth evidence).
- **OGDEN COMPLETE** (geo_id 4955980; migrations 792/793/794). Strong-mayor, 8 elected (Mayor Nadolski + 3 At-Large Seat A/B/C + 4 districts). external_ids -4955980001 (mayor), -002..-004 (at-large), -011..-014 (districts). 8/8 headshots (ogdencity.gov CivicPlus /ImageRepository/Document?documentID=NNNN; Nadolski's low-res 250x350; press_use). 13 stances; Lopez/Hyer/Richey honest 0 (non-directional/process-only). Aspen Care Center homeless-housing fight = key evidence.
- **SANDY structure+stances complete; HEADSHOTS = GAP** (geo_id 4967440; migration 795 structure / 796 stances). Strong-mayor, 8 elected (Mayor Zoltanski + 3 At-Large D'Sousa/Dekeyzer/Sharkey + 4 districts Christensen/Stroud/Nicholl/Houseman). external_ids -4967440001 (mayor), -002..-004 (at-large), -011..-014 (districts). 30 stances (LCC gondola fight = key axis). **0/8 headshots** — sandy.utah.gov is a CivicPlus/Borealis HCMS SPA; photos load via content.civicplus.com API (Bearer token in page), NOT static HTML; Playwright MCP not available this session. TODO: backfill Sandy headshots via browser render / HCMS content API (client_id ut-sandycity:borealis).
- **ST. GEORGE COMPLETE** (geo_id 4965330; migrations 797/798/799). Six-member council form, 6 all-AT-LARGE (Mayor Hughes + 5 council Tanner/Larsen/Larkin/Kemp/Anderson). Anderson appointed Jan 2026 (is_appointed=true). external_ids -4965330001..-006. 6/6 headshots (sgcityutah.gov /bus-directory/... paths with spaces, %20-encode; press_use). 27 stances; Anderson honest 0 (just appointed). Larkin = lone progressive outlier.
- **LEHI COMPLETE** (geo_id 4944320; migrations 800/801/802). Six-member council form, 6 all-AT-LARGE (Mayor Binns + 5 council Freeman/Harrison/Lockhart/Newall/Stallings). Lockhart appointed Jan 2026. external_ids -4944320001..-006. 6/6 headshots (lehi-ut.gov /media/ CMS; press_use). 24 stances (managed-growth dominant; Lockhart clearest right-leaning).
- **LAYTON COMPLETE** (geo_id 4943660; migrations 803/804/805). Six-member council form, 6 all-AT-LARGE (Mayor Petro + 5 council Bloxham/Edmondson/Morris/Thomas/Kolendrianos). external_ids -4943660001..-006. 6/6 headshots (laytoncityutah.gov /LC/Content/gfx/gov/, small 320x360, press_use). 4 stances (very thin small-suburb record; Petro/Bloxham/Morris honest 0). NOTE: `full` is a reserved SQL word — alias the full_name VALUES column as `fullname`.

## ✅ UTAH 10-CITY DEEP-SEED COMPLETE (2026-06-17)

All 10 Utah city governments seeded end-to-end. **72 officials, 63 headshots, 240 stances.**
Per-city (officials / photos / stances): SLC 8/7/59 · WVC 7/7/18 · West Jordan 8/8/21 · Provo 8/8/26 · Orem 7/7/18 · Ogden 8/8/13 · Sandy 8/0/30 · St. George 6/6/27 · Lehi 6/6/24 · Layton 6/6/4.
**Remaining gaps:** Sandy headshots now **8/8 COMPLETE** (migration 806). 7 council backfilled via each member's detail page (sandy.utah.gov/{id}/Name server-renders ONE content.civicplus.com/api/assets/{GUID}; fetch ?width=800 for full-res). Mayor Zoltanski's official photo (red hat) was user-supplied (her bio photo renders client-side only) — cropped 4:5 from a 640x427 landscape, uploaded. **Only remaining photo gap across all 10 UT cities: SLC D4 Napier-Pearce** (appointed, no official portrait + 0 stances). All-UT-cities photo coverage: 71/72.
**Sandy council headshot asset GUIDs (content.civicplus.com/api/assets/{guid}?width=800):** D'Sousa 33b5adad / Dekeyzer b189d94b / Sharkey 45f7f338 / Christensen ae40a744 / Stroud c054060b / Nicholl 50d462d2 / Houseman 7b45a7ee.
**NOT on Landing.jsx login page yet** — Utah still needs the deferred scope decision (which UT jurisdictions to surface; all 10 cities now qualify as purple/has-stances). Next: add Utah to COVERAGE_STATES + backfill the two photo gaps.

- **SALT LAKE CITY COMPLETE** (structure + headshots 7/8 + stances 7/8). Qualifies as a purple/has-stances city, but Utah is NOT yet on the Landing.jsx login page (deferred — needs scope decision on which UT jurisdictions to surface). Next Utah city: West Valley City (geo_id 4983470, empty shell).

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-14 after v13.0 milestone close)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** Phase 144 — glendale-deep-seed

## v15.0 Roadmap Summary

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 126 — Alhambra Stances | Evidence-only stances for 5 council members | ALHAMBRA-01 | Complete (2026-06-15) |
| 127 — Beverly Hills Stances | Evidence-only stances for Mayor + 4 council | BEVHILLS-01 | Complete (2026-06-16) |
| 128 — Carson Stances | Evidence-only stances for Mayor + 4 council | CARSON-01 | Complete (2026-06-16) |
| 129 — Compton Stances | Evidence-only stances for Mayor + 4 council | COMPTON-01 | Complete (2026-06-16) |
| 130 — Culver City Stances | Evidence-only stances for 5 council members | CULVERCITY-01 | Complete (2026-06-16) |
| 131 — El Segundo Stances | Evidence-only stances for 5 council members | ELSEGUNDO-01 | Complete (2026-06-16) |
| 132 — Gardena Stances | Evidence-only stances for Mayor + 4 council | GARDENA-01 | Complete (2026-06-16) |
| 133 — Hawthorne Stances | Evidence-only stances for Mayor + 4 council | HAWTHORNE-01 | Complete (2026-06-16) |
| 134 — Santa Monica Stances | Evidence-only stances for 10 council members | SANTAMONICA-01 | Complete (2026-06-16) |
| 135 — South Gate Stances | Evidence-only stances for 5 council members | SOUTHGATE-01 | Complete (2026-06-16) |
| 136 — West Hollywood Stances | Evidence-only stances for 5 council members | WEHO-01 | Complete (2026-06-16) |
| 137 — Whittier Stances | Evidence-only stances for Mayor + 4 council | WHITTIER-01 | Complete (2026-06-16) |
| 138 — LA Tier 1 Retrospective | LOCATION-ONBOARDING.md 12 city rows + milestone close | LA-RETRO-01 | Complete (2026-06-16) |

## Key v15.0 Facts (carry into plans)

- All 12 cities already deep-seeded in v7.0 — no geofence or officials work needed; stances only
- 65 politicians total (clerks/treasurers excluded): verify politician_ids from DB before each phase
- City geo_ids: Alhambra=0600884, Beverly Hills=0606308, Carson=0611530, Compton=0615044, Culver City=0617568, El Segundo=0622412, Gardena=0628168, Hawthorne=0632548, Santa Monica=0670000, South Gate=0673080, West Hollywood=0684410, Whittier=0685292
- 44 live compass topics — full coverage target; evidence-only rule always applies
- Stances research: ONE at a time — never parallel; per-individual migration files; apply immediately
- No default values — blank spoke = no evidence found (never Neutral/Likely as fallback)
- CSV format: politician_id,topic_id,topic_key,value,notes — no commas or quotes in notes
- Values are 1–5 directly (1=most progressive, 5=most conservative)
- Apply scripts use `npx tsx` via Bash (PowerShell blocked by execution policy)
- Next migration: 777

## Accumulated Context

### Key Decisions (carry forward)

- MD TIGER loader scaffold complete: STATE_LAYER_ALLOWLIST/STATE_CITY_ASSERTIONS/STATE_RUN_MAKEVALID all have MD entry; EXPECTED_MD_MTFCC confirmed: cd119=8, sldu=47, sldl=71, place=157, county=24
- MD geofence_boundaries loaded (Plan 02/03 complete): 307 rows total — G4020=24, G4110=157, G5200=8, G5210=47, G5220=71
- Baltimore City dual-tier (D-01): geo_id='2404000' (G4110 incorporated place) AND geo_id='24510' (G4020 independent city-county) — CONFIRMED present in production DB
- districts.state casing confirmed per D-07: md/COUNTY=24, md/STATE_LOWER=71, md/STATE_UPPER=47, MD/NATIONAL_LOWER=8
- Candidate ordering is seeded-random per session (sessionStorage key `ev:election-seed`), never alphabetical
- Party data lives on races (`primary_party`), never on individual candidates — antipartisan design
- Connected users must never see address input if `me.jurisdiction` is non-null (EDOC-01)
- Legislature-elected offices = is_appointed_position=true, zero race rows (ME/OR pattern; MD Treasurer same)
- computeDisplaySpokes() is the single source of truth for compass spoke selection; import from src/lib/compass.js
- politician_images.type must be 'default' (not 'headshot') — UI filters with .find(img => img.type === 'default')
- slug is a GENERATED column on essentials.chambers — never include in INSERT statements
- essentials.governments has NO unique constraint on geo_id — WHERE NOT EXISTS pattern required
- Jurisdictions processed sequentially (never parallel) — exhausts Claude API rate limit quota
- STATE_EXEC district_id should be empty string (not named string) for multi-position districts (OR lesson)
- TIGER congressional shapefile key: always browse census.gov directory first; key may be 'cd119' not 'cd'

- Maryland Senate chamber name_formal='Maryland State Senate'; House of Delegates name_formal='Maryland House of Delegates' (self-qualifying, OR House precedent)
- Migration 272 applied: 2 MD legislative chambers seeded under government_id 85973301-a859-45c8-9b58-4a14ab7b44ab
- Multi-member NOT EXISTS guard for delegates: (district_id, politician_id) NOT (district_id, chamber_id) — critical for 3-office-per-whole-district model
- Migration 274 applied out-of-sequence (after 275): 141 MD delegates seeded; Supabase tracks by name; STATE.md counter (276) remains correct
- District 42A confirmed vacant (2026-06-05); seeded with is_vacant=true placeholder
- Joseline Pena-Melnyk (HD-21, Speaker) has n-tilde encoded as [char]0x00F1 in generator
- MD headshots use politician_photos bucket (NOT 'politician-headshots') + {politician_id}-headshot.jpg path — project standard
- mgaleg headshot URL discovery: always scrape roster page HTML for img src; HEAD probing alone misses higher suffixes (jackson04, watson04, harris03, young04)
- Compound last names on mgaleg: Lewis Young→young04, Fry Hester→hester01 (uses final word of compound name)
- Delegate headshots complete: 140/140 ingested (0 gaps); jacobs j.jpg has space (URL-encode as %20); pena.jpg for Peña-Melnyk
- mgaleg compound last name pattern varies: White Holland→white01 (first word), Harrison→harrison01 (last word), Palakovich Carr→palakovich01 (first word), Fraser-Hidalgo→fraser01 (first word)
- gen_migration.py generate_migration() groups by name-only (not (name, pid) tuple) — simplified CSV format for MD batches has no politician_id column
- MD exec UUIDs: Moore=21e534c8, Miller=ea9fc2d6, Brown=60329719, Lierman=b26fb5d2, Davis=75378a96
- Migration 282 applied: 5 MD execs, 74 total stances in production (Moore=21, Brown=17, Lierman=16, Miller=15, Davis=5)
- Migration 283 applied: 15 MD senators Batch A (SD-01 through SD-15), 177 stances in production
- Migration 284 applied: 16 MD senators Batch B (SD-16 through SD-31), 258 stances in production; Q2=0 Q3=0 evidence-only=0
- Batch B senator UUIDs confirmed from DB; Smith Jr. CSV quoting fix (comma in name requires quoted field)
- Migration 285 applied: 16 MD senators Batch C (SD-32 through SD-47), 220 stances in production; Q2-C=0 Q3-C=0; Q-PHASE-1=52 rows Q-PHASE-2=0 Q-PHASE-3=0; Phase 97 complete (MD-STANCES-01 + MD-STANCES-02 satisfied); Phase 98 unblocked
- Phase 99 verification sweep confirmed all 22 non-Phase-90 v11.0 requirements PASS against production; Phase 90 items deferred pending Phase 90 Plan 03 execution (see 99-01-VERIFICATION.md)
- Migration 312 applied: Alexandria city government (Mayor Gaskins + 6 council); 7 offices linked to geo_id=5101000
- Migration 313 applied: ACPS school board (9 members under SCHOOL district geo_id=5100090); G5420 geofence inserted directly per D-03
- Migration 314 applied: 7 Alexandria + 9 ACPS headshots in politician_photos bucket; VA-DEEP-03 satisfied; Sandy Marks sourced from alxnow.com (no official portrait yet on city website)

### Pending Todos

- **[BEVERLY HILLS — ~JULY 7 2026]** Mayor title corrected 2026-06-16 (migration 777: swapped Mayor office Friedman→Corman; Friedman now Council Member; stances intact). REMAINING after July 7 install: (a) install the new councilmember for Mirisch's seat (Mirisch leaving), (b) research stances for the new member, (c) re-verify the rotational-Mayor designation in case it rotates again at the July reorg. Note BH uses a ROTATIONAL mayor (unlike the DB's fixed "Mayor" office on Friedman) — consider matching the all-"Council Member" pattern used for other rotational cities (Alhambra/Culver/El Segundo/Santa Monica/South Gate/WeHo). Surfaced by the 2026-06-16 staleness sweep.
- **[CARSON — verify later]** Possible district-label nuance: one source put Jawane Hilton in District 3 (DB has D1; Hicks D3). All 5 people are current/seated — low priority, confirm against official Carson district map before changing any labels.

- **[MA — active]** v14.0 scope: Newton / Somerville / Lynn / New Bedford / Fall River / Medford / Waltham — all at full Tier 1 depth (officials + headshots + stances). See REQUIREMENTS.md.

- **[ME — RCV PENDING]** Phase 90: ME-02 D nominee not yet declared — RCV tabulation ongoing as of 2026-06-13; frontrunner Joe Baldacci (state senator, Bangor, ~31.5% first-round). Add to ME-02 general race_candidates once AP/official call issued. migration 574 already applied Collins+Platner (Senate) and LePage (ME-02 R).
- **[CA — JULY]** Phase 90: lavote.gov November 2026 general election CandidateList ID not yet published; filing opens mid-to-late July 2026. Update discovery_jurisdictions id=9fd492a8 source_url to new ?id=XXXX at that time.
- **[ME-01 R]** ME-01 Republican primary (Pietrowicz vs Russell) still TBD — add winner to ME-01 general race once called.

### Blockers/Concerns

None — v13.0 complete; v14.0 roadmap defined.

## Session Continuity

Last session: 2026-06-20T04:01:41.315Z
Stopped at: Phase 157 context gathered
Resume file: .planning/phases/143-santa-clarita-deep-seed/143-CONTEXT.md

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 91 P02 | 45m | 2 tasks | 2 files |
| Phase 91 P03 | 20m | 2 tasks | 0 files (DB-only) |
| Phase 91 P04 | 15m | 2 tasks | 0 files (verification-only) |
| Phase 93 P01 | 7m | 1 task | 1 file (272_md_legislative_chambers.sql) |
| Phase 93 P02 | 18m | 2 tasks | 3 files (generate_md_senate.ps1, 273_md_state_senators.sql, _apply-migration-273.ts) |
| Phase 93 P03 | 45m | 3 tasks | 3 files (generate_md_house.ps1, 274_md_delegates.sql, _apply-migration-274.ts) |
| Phase 93 P04 | 20m | 1 task | 1 file (275_md_federal_officials.sql) |
| Phase 93 P05 | 35m | 3 tasks | 1 file (scripts/md_senators_headshots.py) |
| Phase 93 P06 | 60min | 3 tasks | 1 files |
| Phase 95 P01 | 25m | 3 tasks | 4 files |
| Phase 97 P01 | 45m | 3 tasks | 7 files (compass-topics-reference.md, 5 CSVs, 282_md_exec_stances.sql) |
| Phase 97 P03 | 60m | 3 tasks | 17 files (16 CSVs + 284_md_senators_batch_b.sql); 258 stances for SD-16 through SD-31 |
| Phase 97 P04 | 60m | 3 tasks | 17 files |
| Phase 103 P01 | 20m | 3 tasks | 1 files |
| Phase 103 P02 | 25m | 3 tasks | 1 files |
| Phase 103 P03 | 50m | 2 tasks | 2 files |
| Phase 106-va-compass-stances P07 | 35 | 3 tasks | 8 files |
| Phase 106 P08 | 2 days | 3 tasks | 20 files |
| Phase 107 P01 | 25m | 3 tasks | 1 file (107-01-VERIFICATION.md) |
| Phase 109 P06 | 60m | 2 tasks | 2 files (_tmp-ma-tier2-headshots.py, 356_ma_tier2_headshots.sql); 47/59 uploaded |
| Phase 111 P03 | 45m | 3 tasks | 1 file (365_warren_stances.sql); Warren 43 stances applied |
| Phase 111 P04 | 35m | 3 tasks | 1 file (366_markey_stances.sql); Markey 43 stances applied |
| Phase 111 P05 | ~4h | 3 tasks | 5 files (367-371 stances SQLs); 5 reps x 43 stances; multi-session |
| Phase 112 P01 | ~6h | 21 tasks | 20 files (376-395 stances SQLs); 20 senators 25D01-25D20; multi-session; 0 unpaired, 0 uncited |
| Phase 112 P02 | ~4h | 21 tasks | 20 files (396-415 stances SQLs); 20 senators 25D21-25D40; 0 unpaired, 0 uncited |
| Phase 114 P01 | ~3h | 21 tasks | 20 files (496-515 stances SQLs); 20 reps HD-81–HD-100; 289 stances; 0 unpaired, 0 uncited |
| Phase 114 P02 | ~4h | 21 tasks | 20 files (516-535 stances SQLs); 20 reps HD-101–HD-120; 138 DB rows; 0 unpaired, 0 uncited |
| Phase 114 P04 | ~2h | 18 tasks | 18 files (556-573 stances SQLs); 18 reps HD-141–HD-158; 182 DB rows; 0 unpaired, 0 uncited |
| Phase 114 P05 | 35m | 3 tasks | 1 file (114-05-SUMMARY.md); Q1=78 Q2=0 Q3=0; 1778 combined stances; compass APPROVED on Decker HD-81 |
| Phase 116-ma-playbook-retrospective P01 | 4m | 2 tasks | 1 files |
| Phase 118 P01 | 20m | 1 task | 1 file (581_somerville_city_government.sql) |
| Phase 118 P02 | 6m | 1 task | 1 file (582_somerville_school_committee.sql) |
| Phase 118 P03 | 25m | 2 tasks | 2 files (_tmp-somerville-headshots.py, 583_somerville_headshots.sql); 9/12 uploaded |
| Phase 122 P02 | 35m | 2 tasks | 8 files |
| Phase 122 P03 | 22m | 2 tasks | 10 files |
| Phase 122 P04 | ~90m | 3 tasks | 12 files |
| Phase 123 P01 | ~45m | 3 tasks | 2 files (638_mcclain_stances.sql, 639_net_stances.sql); 635-637 verified from prior session; 27 stance rows total |
| Phase 123 P02 | ~30m | 2 tasks | 7 files (640-646 ward councillors); 14 stance rows; 41 total Lynn stances |
| Phase 123 P03 | ~90m | 2 tasks | 6 files (647-652 Mayor+At-Large NB); 13 stance rows; 0 unpaired, 0 uncited |
| Phase 123 P04 | ~60m | 2 tasks | 6 files (653-658 Ward councillors NB); 3 stance rows; Choquette+Oliver immigration=4.0; Pereira economic-development=2.0; 3 blank-spoke officials |
| Phase 123 P05 | ~10m | 2 tasks | 3 files (REQUIREMENTS.md, ROADMAP.md, STATE.md); Q1=0 Q2=0 Q3=0 Q4=0; 57 total stance rows; LYNN-03+NEWBED-03 closed |
| Phase 124 P01 | ~75m | 4 tasks | 10 files (665-674 stances SQLs); 17 stances for 10 Fall River officials; 5 blank-spoke; 0 uncited; FALLRIV-03 closed |
| Phase 124 P02 | ~60m | 3 tasks | 8 files (675-682 stances SQLs); 40 stances for 8 Medford officials; 1 blank-spoke (Mullane); 0 uncited; MEDFORD-03 closed |
| Phase 124 P03 | ~25m | 2 tasks | 7 files (683-689 stances SQLs); 10 stances for 7 Waltham at-large officials; 2 blank-spoke (Tzioumis+Vidal); 0 uncited; WALTHAM-03 partial (at-large batch) |
| Phase 124 P04 | ~35m | 3 tasks | 9 files (690-698 stances SQLs); 9 stances for 9 Waltham ward councillors; 0 blank-spoke; 0 uncited; WALTHAM-03 fully closed; total Waltham 19 rows |
| Phase 124 P05 | ~15m | 2 tasks | 3 files (REQUIREMENTS.md, ROADMAP.md, STATE.md); Q1-Q6=0; 76 total stances across 34 officials; FALLRIV-03+MEDFORD-03+WALTHAM-03 closed |
| Phase 125 P01 | ~9m | 3 tasks | 1 file (LOCATION-ONBOARDING.md); 7 Cities Onboarded rows; 4 MA trap rows; 7 Key Facts bullets; 6 new MA GOTCHAs (11 total) |
| Phase 126 P01 | ~50m | 3 tasks | 3 files (703-705 stances SQLs); 15 stance rows for Lee/Maza/Maloney; 0 unpaired, 0 uncited; all 5 Alhambra UUIDs resolved |
| Phase 126 P02 | ~25m | 2 tasks | 2 files (706-707 stances SQLs); 11 stance rows for Wang/Andrade-Stadler; 0 unpaired, 0 uncited; all 5 Alhambra officials complete (26 total) |
| Phase 127 P01 | ~45m | 3 tasks | 2 files (714-715 stances SQLs); 16 stance rows for Friedman(9)+Corman(7); 0 unpaired, 0 uncited; 713 applied as deviation |
| Phase 127 P02 | ~30m | 3 tasks | 3 files (716-718 stances SQLs); 26 stance rows for Mirisch(11)+Nazarian(7)+Wells(8); 0 unpaired, 0 uncited; all 5 BH officials complete |

## Decisions

- [Phase ?]: Scioscia (migration 345) had no public record — skipped per D-03/D-04; blank spoke is honest
- [Phase 107]: Verification-only: 293 G4040 rows were loaded in v5.0 (2026-05-19); re-running loader would silently skip via ON CONFLICT DO NOTHING; assert-not-reload is the correct pattern for idempotent TIGER loads
- [Phase 107]: Section-split direction: geofence NOT IN districts is the PASS signal (0 rows); reverse direction yields ~7 expected rows for statewide districts with no polygon (NOT a failure)
- [Phase 107]: G4040 districts join must be state-scoped; global join returns 54 rows from Indiana CCDs (G4040 mtfcc); MA-scoped join confirms 0 rows (writeDistrictRow=false for COUSUB)
- [Phase 109 P06]: Quincy all-GAP — quincyma.gov (Revize CMS) has no headshot images; Lowell City Manager Golden GAP (text-only CM page); Brockton Lally GAP (HTTP 403); Springfield TYPO3 _processed_ URLs accepted; 47/59 total uploaded; migration 356 applied
- [Phase 111 P03]: Warren had 30 stances pre-existing in production (prior session); migration 365 re-upserts all 30 + adds 13 new topics; same supplemental pattern as Galvin (Plan 111-02); total 43 stances, city-sanitation omitted (no federal record)
- [Phase 111 P04]: Markey had 30 stances pre-existing in production (prior session); migration 366 re-upserts all 30 (3 value corrections: climate-change/campaign-finance/social-security) + 13 new topics; total 43 stances, city-sanitation omitted (no federal record)
- [Phase 111 P05]: All 5 House reps (Neal/McGovern/Trahan/Auchincloss/Clark) had 23-30 pre-existing stances; supplemental pattern used; data-centers topic (UUID 4559b513) discovered active in DB but missing from 111-PATTERNS.md — added to all 5; each rep reached 43 total
- [Phase 111 P05]: Neal abortion=4.0 evidence-only from Catholic background; Auchincloss tariffs=1.0 explicit free-trader (outlier for MA delegation); Clark childcare=1.0 signature issue (DNC 2024)
- [Phase 112 P01]: Durant (R, SD-06) + Fattman (R, SD-05) received conservative values 4.0-5.0 with evidence; cannabis-policy topic does NOT exist in inform.compass_topics — removed from Finegold migration; state senate stances applied one-at-a-time per feedback rule
- [Phase 112 P02]: Tarr (R), O'Connor (R), Dooner (R) received conservative values with evidence; Brownsberger authored 2018 MA CJ reform (judicial-criminal-justice=1.0, judicial-bail-pretrial=1.0); Rodrigues = South Coast Rail champion + Ways & Means Chair; Montigny co-authored 2006 MA healthcare reform; 20 senators 25D21-25D40 complete; MA-STANCES-03 fully satisfied
- [Phase 114 P01]: HD-81–HD-100 complete; progressive Camberville reps (Decker/Connolly/Uyterhoeven/Barber) 25-28 stances each; Speaker Mariano (HD-96) 19 stances reflecting centrist-pragmatic leadership positions; 6 reps had pre-existing rows from prior sessions — upserted correctly; pre-existing 3.0 neutral-default rows deferred to cleanup phase
- [Phase 114 P02]: HD-101–HD-120 complete; mix of Norfolk/Plymouth districts; 5 Republican reps (Vaughn, Gaskey, DeCoste, Sweezey, Sullivan-Almeida) received conservative values with evidence; 8 reps had pre-existing rows upserted correctly; malegislature.gov bill sponsorships as sole evidence source; healthcare was most common topic (14/20 reps)
- [Phase 114 P04]: HD-141–HD-158 complete; all-Worcester County batch; 6 Republican reps received conservative values 4.0-5.0 (Berthiaume, Marsi, Frost, Soter, Muradian, McKenna); Hannah Kane treated as moderate R with 3.0 values; 7 reps had pre-existing rows upserted; migration 556 re-applied (existed on disk, 0 DB rows on resume)
- [Phase 114 P05]: Phase-wide verification PASSED; Q1=78 rows, Q2=0 uncited, Q3=0 unpaired, Q4=1778 combined stances; compass render APPROVED on Marjorie Decker HD-81; MA-STANCES-04 FULLY CLOSED (Wave 1 HD-01–HD-80 Phase 113 + Wave 2 HD-81–HD-158 Phase 114)
- [Phase 115]: Boston stances complete; 21 officials attempted (Mayor Wu 27 stances + 13 councillors + 7 SC blank per D-01); stances from bulk migration 574 (prior session) + Wu supplemental 577; Q1=21 rows, Q2=0 uncited, Q3=0 unpaired, Q4=162 total stances; compass APPROVED on Wu (21 topics); MA-STANCES-05 FULLY CLOSED; next migration=578
- [Phase ?]: [Phase 116-01]: MA-RETRO-01 closed: LOCATION-ONBOARDING.md updated with MA Quick Reference block, 2 Cities Onboarded rows (MA state + Boston), and 5 STATE-SPECIFIC MA GOTCHA callouts
- [Phase 118-01]: Somerville city government seeded — migration 581 applied; Mayor Jake Wilson + 11 City Councillors; Jake Wilson public name used (not 'Jacob D. Wilson'); Davis title='City Councilor (Ward 6)' (Council President is internal officer role only); external IDs in ward-number order
- [Phase 116]: v13.0 Massachusetts Expanded closed 2026-06-13; LOCATION-ONBOARDING.md updated with MA Quick Reference, 5 MA-specific GOTCHAs, and Cities Onboarded rows for Massachusetts state + Boston; MA-RETRO-01 satisfied
- [Phase 118-02]: Somerville School Committee seeded — migration 582 applied; TWO ex-officio pattern (Mayor Wilson + Council President Davis) established; back-fill range -2510890001..-2510890007 excludes both city ex-officio external_ids; all 10 post-verification gates passed including Gates (i)+(j) confirming city office_ids intact
- [Phase 118-03]: Somerville headshots complete — migration 583 applied; 9/12 city officials uploaded from somervillema.gov (S3 + /sites/default/files/-2022.jpg patterns); 3 city gaps (Link/Wheeler/Hardt newly-elected Nov 2025); all 7 SC members gap (no individual headshots on SPS site); Pitfall 3 avoided (Emily Hardt stale URL not attempted); SOMERVILLE-01 + SOMERVILLE-02 satisfied; Phase 118 CLOSED
- [Phase 119-01]: Lynn city government seeded — migration 584 applied; Mayor Nicholson + 4 at-large + 7 ward councilors; Alinsug title='City Councilor (Ward 3)' (not Council President); Dr. honorific excluded from Meaney first_name per DB convention; file naming conflict with pre-existing 584_lowell_stances.sql resolved by renaming Lynn file to 584_lynn_city_government.sql
- [Phase 119-02]: Lynn School Committee seeded — migration 585 applied; 6 elected SC members (Ortiz McGrath no hyphen in name; Peña with ñ character); Mayor Nicholson ex-officio via CROSS JOIN pattern; Gate (i) confirmed Mayor LOCAL_EXEC office_id preserved; autocommit pattern (no BEGIN/COMMIT) per Newton 579 analog
- [Phase 122-03]: Newton Wave 3 complete — all 25 Newton officials attempted; Baker (7 stances) richest record from Suffolk Law professor role; 6 thin-record officials (Silber/Block/Farrell/Irish/Malakie/Micley) each received 2 stances (MBTA vote evidence only); 112 total Newton stance rows; 0 unpaired, 0 uncited; psql CLI used for DB access (Supabase MCP not available in restricted executor context)
- [Phase 122-05]: Phase 122 CLOSED — 37 officials (25 Newton + 12 Somerville); 197 total stance rows (migrations 598-634); Q2=0 uncited, Q3=0 unpaired; 14 blank-spoke officials (thin record, correct per evidence-only rule); compass approved on Mayor Laredo (7 stances) + Mayor Wilson (18 DB / 13 displayed — display cap under investigation); NEWTON-03 + SOMERVILLE-03 satisfied; next migration=635
- [Phase 123-01]: Lynn At-Large stances complete — 27 rows for 5 officials (Mayor + 4 At-Large); Net (3 stances) thin record per evidence-only rule; LaPierre public-safety-approach=3.0 (center, combined enforcement+services); all 12 Lynn UUIDs recorded in 123-01-SUMMARY.md for Plans 02-05
- [Phase 122-04]: Somerville Wave 1 complete — all 12 Somerville officials attempted; Wilson (18 stances) richest record from MA State Rep tenure; Ewen-Campen (12) second richest from council resolution authorship; Hardt (2) thin record as Nov 2025 newcomer; 85 total Somerville stance rows; 0 unpaired, 0 uncited; A3 UUID mapping confirmed before any write
- [Phase 119-03]: Lynn headshots complete — migration 586 applied; 12/12 city officials uploaded (11 CivicLive CDN + Mayor from Wikipedia Commons); Wikipedia required WIKIMEDIA_HEADERS descriptive UA (Chrome UA returned 429); MegieMaddrey.png CDN filename confirmed (no hyphen despite DB last_name='Megie-Maddrey'); 6 SC gaps documented per D-01 (SchoolMessenger text-only pages); LYNN-01 + LYNN-02 satisfied; Phase 119 CLOSED
- [Phase 123-02]: All 7 Lynn ward councillors received 2 stances each (housing=2.0 + local-immigration=2.0) — only full-council votes with documented evidence; individual ward-level news quotes absent for other topics; blank spokes correct per evidence-only rule; 41 total Lynn stance rows across all 12 officials; psql CLI used for DB access (mcp__supabase-local not available in sequential executor context)
- [Phase 123-03]: NB is NOT a sanctuary city (no council immigration resolution; police cooperate with ICE per WBSM) — contrast with Lynn which passed 2025 ICE resolution; no local-immigration row for NB at-large councillors; Mitchell public-safety-approach=4.0 from former AUSA (Whitey Bulger task force) background; Burgo proposed rent stabilization ballot question 2023 (direct individual evidence → rent-regulation=2.0); Gomes voted to override Mitchell veto on rent stabilization ballot question; Choquette+Oliver (ward councillors) switched to Republican Party per WBSM — relevant for Plan 04
- [Phase 123-04]: Choquette(W1) + Oliver(W3) both received immigration=4.0 from documented non-citizen police ballot question ("Hiring non-citizens as NBPD officers is not responsible government" — Choquette WBSM quote); Pereira(W6/President) received economic-development=2.0 from renaming Labor&Industry→Economic Development Committee + creating Special Permits & Licensing to cut business wait times; Pemberton(W2) zero-INSERT (new member Nov 2025, <6 months); Baptiste(W4)+Lopes(W5) zero-INSERT (votes documented but no individual attributed policy quotes); NEWBED-03 satisfied; all 12 NB officials complete; 16 total NB stance rows
- [Phase 123-05]: Phase 123 CLOSED — 24 officials (12 Lynn + 12 New Bedford); Q1=0 Q2=0 Q3=0 Q4=0; 41 Lynn stance rows + 16 New Bedford stance rows = 57 total; 14 blank-spoke officials (correct per evidence-only rule); LYNN-03 + NEWBED-03 satisfied; next migration=659
- [Phase 124-01]: Migrations 659-664 pre-occupied by MA Tier 2 geofencing (Boston council backfill, Worcester/Springfield/Lowell/Brockton/Quincy district geofencing); Fall River stances used 665-674 instead; 10 officials done; Coogan(R, Mayor) richest record (9 stances); 5 blank-spoke at-large councillors; FALLRIV-03 closed; Linda Pereira (Fall River, migration 670) confirmed distinct from Ryan Pereira (New Bedford, migration 658)
- [Phase 124-02]: Migrations 669-676 specified in plan pre-occupied by Fall River Plan 01; Medford stances used 675-682 instead; 8 officials done; LungoKoehn(Mayor) richest record (15 stances, former MA state rep); Bears(CP) 9 stances from MA House record; Mullane blank-spoke (no individual evidence); Scarpelli documented as fiscal conservative and law-and-order outlier; MEDFORD-03 closed; Isaac Bears searched under public name "Zac Bears"
- [Phase 124-03]: Migrations 677-683 specified in plan pre-occupied by Medford Plan 02; Waltham at-large stances used 683-689 instead; 7 officials done; Donahue(Mayor) 3 stances (MBTA compliance + Route 128); Tzioumis+Vidal blank-spoke (newer members, no individual evidence); MBTA Communities Act compliance vote primary evidence for 5 of 7 officials; city.waltham.ma.us Cloudflare-blocked; all 16 Waltham UUIDs captured for Plan 04
- [Phase 124-04]: Migrations 684-692 specified in plan pre-occupied by Plan 03 at-large files (683-689); ward stances used 690-698 instead; all 9 ward councillors received housing=2.0 (MBTA compliance vote only available evidence); no blank-spoke officials; Logan(CP) searched specifically but no additional statements found; total Waltham 19 stance rows; WALTHAM-03 fully closed; Phase 124 COMPLETE
- [Phase 124-05]: Phase 124 CLOSED — 34 officials (10 Fall River + 8 Medford + 16 Waltham); Q1=0 Q2=0 Q3=0 Q4=0 Q5=0 Q6=0; 17 Fall River + 40 Medford + 19 Waltham = 76 total stances; 8 blank-spoke officials (correct per evidence-only rule); FALLRIV-03+MEDFORD-03+WALTHAM-03 satisfied; next migration=699
- [Phase 125-01]: LOCATION-ONBOARDING.md updated with 7 MA Tier 3 Cities Onboarded rows (Newton/Somerville/Lynn/New Bedford/Fall River/Medford/Waltham) + 4 MA Quick Reference trap rows + 7 Key Facts bullets + 6 new STATE-SPECIFIC: MA GOTCHAs (11 total); Medford geo_id DB-verified as 2539835 (estimate 2540115 wrong; external_id prefix -2540115xxx already seeded from wrong estimate — perpetual discrepancy documented); all 7 geo_ids confirmed from geofence_boundaries query; New Bedford 2545000 reconfirmed from migration 587
- [Phase 125-02]: All 22 v14.0 requirements marked complete in REQUIREMENTS.md; traceability table all ✅; STATE.md + ROADMAP.md milestone close applied; v14.0 MA Tier 3 City Coverage milestone formally closed 2026-06-15; next migration 699
- [Phase 126-01]: Alhambra stances Wave 1 — Lee(7)+Maza(4)+Maloney(4)=15 rows; migrations 703-705; actual starting migration 703 (699-702 were applied; STATE.md 699 was stale); 5 Alhambra UUIDs resolved (Lee=f22187bb, Maza=27441d13, Maloney=e4df4fce, Wang=abad7f66, Andrade-Stadler=f6d52199); 2019 Welcoming City resolution unanimous vote = local-immigration evidence for Lee+Maloney; next migration=706
- [Phase 126-02]: Alhambra stances Wave 2 — Wang(7)+Andrade-Stadler(4)=11 rows; migrations 706-707; Wang rotational Mayor pitfall avoided (no Mayor office created; all reasoning uses Council Member Wang or rotational Mayor qualifier); Andrade-Stadler 4 stances from unanimous votes; all 5 Alhambra officials complete (26 total rows); next migration=708
- [Phase 126-03]: Phase 126 CLOSED — 5 officials (Lee D1=7, Maza D2=4, Maloney D3=4, Wang D4=7, Andrade-Stadler D5=4); Q1=5 rows, Q2=0 uncited, Q3=0 unpaired, Q4=0 rows on inactive topics; 26 total stance rows across migrations 703-707; 0 blank-spoke officials; Wang rotational Mayor handled correctly (Council Member context only); ALHAMBRA-01 FULLY CLOSED; next migration=708
- [Phase 127-01]: Beverly Hills Wave 0 revealed 713_alhambra_dedup.sql existed on disk but was NOT applied to DB (MAX applied = 712); applied and registered 713 first; NNN confirmed = 714. Friedman (directly-elected Mayor) 9 stances: housing 4.0, residential-zoning 5.0, homelessness-response 5.0, public-safety-approach 4.0, local-immigration 5.0, transportation-priorities 4.0, taxes 4.0, growth-and-development 4.0, local-environment 3.0; migration 714 applied. Corman 7 stances: housing 4.0, residential-zoning 4.0, homelessness-response 4.0, public-safety-approach 4.0, local-immigration 4.0, transportation-priorities 4.0, taxes 4.0; migration 715 applied. 16 total rows; 0 unpaired, 0 uncited; next migration=716
- [Phase 127-02]: Mirisch (longest-serving BH council member) 11 stances including progressive outliers campaign-finance=2.0 (documented op-ed advocacy for local contribution limits) and climate-change=2.0 (documented environmental concern); residential-zoning=5.0 (most protective on council); migration 716 applied. Nazarian 7 stances including civil-rights=2.0 (documented anti-discrimination/hate crime advocacy — progressive outlier); all other topics 4.0 reflecting council consensus; migration 717 applied. Wells 8 stances all 4.0 reflecting council consensus on housing/zoning/homelessness/safety/immigration/taxes/development/transportation; migration 718 applied. 26 total rows; 0 unpaired, 0 uncited; all 5 BH officials complete; next migration=719
- [Phase 127-03]: Phase 127 Beverly Hills Stances CLOSED — Q1=5 rows (all 5 officials with stances), Q2=0 uncited, Q3=0 unpaired, Q4=0 rows on inactive topics, Q5=0 (Fisher exclusion confirmed). Per-official counts: Friedman (Mayor, directly elected)=9, Corman=7, Mirisch=11, Nazarian=7, Wells=8; total 42 stance rows (migrations 714-718); 0 blank-spoke officials; Fisher (City Treasurer, external_id -700011, UUID 7f162e20) excluded throughout — zero rows across all plans; BEVHILLS-01 FULLY CLOSED; next migration=719
- [Phase 128-01]: Carson Wave 0 confirmed NNN=719 (MAX applied=718; 716+717+718 all present); 44 active topics; all 7 Carson UUIDs resolved. Davis-Holmes (Mayor, directly elected LOCAL_EXEC) 9 stances: homelessness-response=3.0, housing=2.0, public-safety-approach=3.0, economic-development=2.0, local-environment=2.0, growth-and-development=2.0, taxes=2.0, transportation-priorities=2.0, local-immigration=2.0; migration 719 applied. Hilton (D1) 5 stances: housing=2.0, homelessness-response=3.0, public-safety-approach=3.0, local-environment=2.0, local-immigration=2.0; migration 720 applied. 14 total rows; 0 unpaired, 0 uncited; Bradshaw(-700305, 8523d499) + Cooper(-700306, 702d8439) excluded (0 rows); next migration=721
- [Roster staleness sweep 2026-06-16]: Audited all 10 remaining LA cities' seeded rosters vs current real-world councils (after the SM+Whittier fixes). 9/10 CLEAN — Alhambra, Carson, Compton, Culver City, El Segundo, Gardena, Hawthorne, South Gate, West Hollywood all match current seated councils (Gardena verified against certified June-2026 results: Cerda re-elected, Love stayed on council, "Mato" was new Treasurer not councilmember — false alarm). NO wrong-person issues like Whittier. Two non-blocking notes: (1) BEVERLY HILLS — membership current until ~July 7 installation, but rotational-Mayor title is stale (DB flags Friedman as Mayor; Corman has been rotational Mayor since Apr 2026); June-2-2026 election (Mirisch seat) not installed until ~July 7 → recommend ONE consolidated BH update after July 7 (see Pending Todos). (2) CARSON — all 5 people current/seated; one source put Hilton in D3 vs DB's D1 (Hicks D3) — possible district-label nuance, low confidence, verify later. No DB changes made (no stale memberships found).
- [Post-v15.0 reconciliation 2026-06-16]: Fixed stale Santa Monica + Whittier rosters surfaced during the retrospective (migrations 774-776). Decision: UNLINK departed officials (delete/repoint office rows; KEEP politician + stance records). Santa Monica: deleted 3 surplus office rows (Brock, de la Torre, Parra — terms ended Dec 2024); council now correctly 7. Whittier: repointed D1 office Dutra→Mary Ann Pacheco (-700405) and D3 office Martinez→Cathy Warner (-700406), created the 2 current members + researched stances (Pacheco 2: public-safety 3.0 community-policing + housing 2.0; Warner 2: public-safety 4.0 + transportation 2.0 Goldline light rail); Dutra/Martinez office_id nulled, stances kept. Verified: SM=7 council, Whittier=5 (Becerra/Pacheco/Santana/Warner/Macedo), 5 departed have office_id=NULL with stance rows intact, new members 0 unpaired/0 uncited. Only essentials.races FKs offices.id (0 races referenced SM offices — safe delete). Whittier now 20 stance rows. Next migration 777.
- [Phase 138-01]: v15.0 LA City Stances MILESTONE CLOSED 2026-06-16 — Phase 138 retrospective (LA-RETRO-01) complete. All 13 requirements ✅. 288 evidence-only stance rows across 65 officials in 12 LA-area cities (Alhambra 26, Beverly Hills 42, Carson 34, Compton 20, Culver City 29, El Segundo 15, Gardena 19, Hawthorne 17, Santa Monica 41, South Gate 8, West Hollywood 21, Whittier 16; migrations 703-773); 0 uncited, 0 unpaired, 0 inactive-topic rows across the whole milestone. LOCATION-ONBOARDING.md updated: 12 Cities Onboarded rows + "LA-Area City Stances (v15.0) Quick Reference" (6 traps). Carry-forward: Santa Monica seed has 10 council rows (2020-24 + Dec-2024 cohorts; live council 7); Whittier district-label drift; stance migrations never register in schema_migrations (on-disk counter authoritative). Next migration 774.
- [Phase 137-01]: Phase 137 Whittier Stances CLOSED — Mayor + 4 council (Dutra 4, Becerra/Santana/Martinez/Macedo 3 each); 16 total stance rows (migrations 769-773); 0 unpaired, 0 uncited, 0 inactive. Directly elected Mayor Becerra (none excluded). Moderate/suburban profile: public-safety 4.0 cluster (Becerra/Dutra/Santana/Martinez) + neighborhood-character growth 4.0 (Becerra, Macedo "not a developer") + economic-development 2.0; Dutra transportation 2.0 (LA Metro Board Chair); Macedo rights-conscious public-safety 3.0. DB district labels drift vs current reality (Dutra D1-seeded/lost D4 2026 to Macedo; Martinez D3-seeded/reported D2) — flagged for Phase 138. Applied via psql -f. WHITTIER-01 FULLY CLOSED; next migration=774
- [Phase 136-01]: Phase 136 West Hollywood Stances CLOSED — 5 council members (Byers 5, Erickson 5, Hang 4, Meister 4, Heilman 3); 21 total stance rows (migrations 764-768); 0 unpaired, 0 uncited, 0 inactive. Rotational mayor (none excluded). Uniformly progressive city (rent control/LGBTQ+ founding): Heilman rent-regulation+housing+civil-rights all 1.0; Erickson abortion 1.0 (former PPLA VP); Meister cross-cut (rent-regulation 1.0 but growth-and-development 4.0 neighborhood-preservation). Applied via psql -f. WEHO-01 FULLY CLOSED; next migration=769
- [Phase 135-01]: Phase 135 South Gate Stances CLOSED — 5 council members (Hurtado 3, Rios 2, Avalos 2, Davila 1, Barron 0); 8 total stance rows (migrations 759-763); 0 unpaired, 0 uncited, 0 inactive. Rotational mayor (none excluded). Thin-record small working-class city — Barron (Mayor, elected 2022) zero-INSERT ledger (no findable directional positions); Davila 1 (Housing Authority chair). Hurtado public-safety 4.0 (POA endorsement); Avalos healthcare 2.0 (mental-health funding); Rios transportation 2.0 (light rail). Honest blank spokes, no defaulting. Applied via psql -f. SOUTHGATE-01 FULLY CLOSED; next migration=764
- [Phase 134-01]: Phase 134 Santa Monica Stances CLOSED — 10 council members; 41 total stance rows (migrations 749-758); 0 unpaired, 0 uncited, 0 inactive. Rotational mayor (none excluded). SEED COHORT NOTE: DB includes both 2020-24 cohort (de la Torre, Parra) and Dec-2024 incoming (Hall, Raskin, Snell, Zernitskaya) = 10 seeded (live council is 7 seats); all 10 given evidence-based stances per milestone scope; flag for Phase 138 retrospective. Strong factional spread: SMRR/pro-housing progressives (Torosis rent-reg 1.0 + housing 1.0; Zwick/Hall/Raskin housing 1.0 + transportation 1.0; Zernitskaya housing 1.0; de la Torre police-accountability 2.0 + voting-rights 2.0) vs moderate Change bloc (Brock/Negrete/Parra/Snell public-safety 4.0; Brock+Parra growth 4.0; Snell residential-zoning 4.0 from SB 79 delay vote). Per-member: Zwick/Hall/Raskin 6, Brock/Parra/Zernitskaya 4, Negrete/Snell/de la Torre 3, Torosis 2. Applied via psql -f. SANTAMONICA-01 FULLY CLOSED; next migration=759
- [Phase 133-01]: Phase 133 Hawthorne Stances CLOSED — Mayor + 4 council (Vargas 4, Manning 2, Monteiro 3, English 4, Johnson 4); 17 total stance rows (migrations 744-748); 0 unpaired, 0 uncited, 0 inactive. Directly elected Mayor Vargas (none excluded). SpaceX/Tesla/Boring economic-development heavy city → economic-development 2.0 common; public-safety 4.0 cluster (Monteiro/English) + Vargas 3.0 (crime + youth prevention); Johnson distinctive homelessness-response 3.0 ("Treatment First, Housing Second"). Applied via psql -f from disk artifacts. HAWTHORNE-01 FULLY CLOSED; next migration=749
- [Phase 132-01]: Phase 132 Gardena Stances CLOSED — Mayor + 4 council (Cerda 5, Henderson 3, Tanaka 3, Francis 4, Love 4); 19 total stance rows (migrations 739-743); 0 unpaired, 0 uncited, 0 inactive. Directly elected Mayor Cerda (LOCAL_EXEC, no rotational qualifier), none excluded. Diverse profile: services/dev cluster 2.0 (homelessness/housing/economic-development/healthcare/environment) + enforcement/preservation cluster 4.0. Notable: Tanaka (retired Gardena PD Lt.) public-safety 4.0 + residential-zoning 4.0 (local-control vs Sacramento); Love lone "no" vote on 333-unit 5-story development → residential-zoning 4.0, housing 3.0; Francis healthcare 2.0 (low-cost access). Applied via psql -f from disk artifacts. GARDENA-01 FULLY CLOSED; next migration=744
- [Phase 131-01]: Phase 131 El Segundo Stances CLOSED — 5 council members (Pimentel 3, Baldino 3, Boyles 4, Giroux 2, Keldorf 3); 15 total stance rows (migrations 734-738); 0 unpaired, 0 uncited, 0 inactive. Rotational mayor (Alhambra pattern), none excluded. Business/aerospace South Bay city — consistently business-friendly + fiscally conservative + preservationist council: pro-economic-development 2.0 (Pimentel/Boyles/Giroux), controlled-growth/character-preservation 4.0 (all), well-resourced public safety 4.0, fiscal restraint taxes 4.0 (Baldino/Boyles), Boyles residential-zoning 4.0 (protect single-family). Keldorf cross-cut: local-environment 2.0 (LA League of Conservation Voters endorsement) alongside public-safety 4.0. ELSEGUNDO-01 FULLY CLOSED; next migration=739
- [Phase 130-01]: Phase 130 Culver City Stances CLOSED — 5 council members (Puza 6, Fish 6, McMorrin 6, O'Brien 6, Vera 5); 29 total stance rows (migrations 729-733); 0 unpaired, 0 uncited, 0 rows on inactive topics. Rotational mayor (Alhambra pattern) — no Mayor office, all "Council Member", none excluded. FULL ideological spread captured with evidence: progressive bloc (McMorrin all 1.0-2.0 incl. PD-defunding 1.0 + rent-control 1.0; Puza + Fish transportation 1.0, civil-rights/housing 1.0) vs moderate O'Brien (PD-staffing 4.0, R1-preservation 4.0, MOVE-rollback 3.0) vs conservative Vera (rent-regulation 5.0 anti-RC/Measure-B, PD 4.0, ended Incremental Infill 4.0). MOVE Culver City 2023 bus/bike-lane rollback (3-2) is the defining distinguishing vote. Bryan Fish public name "Bubba Fish". Executed continuous sequential flow via Supabase MCP execute_sql. CULVERCITY-01 FULLY CLOSED; next migration=734
- [Phase 129-01]: Phase 129 Compton Stances CLOSED — 5 officials (Sharif Mayor=7, Duhart D1=3, Spicer D2=5, Bowers D3=4, Darden D4=1); 20 total stance rows (migrations 724-728); 0 unpaired, 0 uncited, 0 rows on inactive topics. NO excluded officials (Compton has no separately-seeded City Clerk/Treasurer in DB — distinct from Carson/BH). Compass diversity on public-safety-approach: Spicer 1.0 (explicit "almost nothing to do with law enforcement" outlier) → Sharif 2.0 (community prevention/Violence Reduction Network) → Bowers 3.0 (40-yr emergency-response career, enforcement + commissions, genuine center). Darden thin record (1 stance, HOPICS homeless-services engagement) — most coverage biographical (former Water Dept GM); blank spokes honest per evidence-only rule. Reconciliation note: schema_migrations MAX stays 718 because stance migrations apply via raw SQL and never register there — on-disk file counter (now 728) is authoritative. Executed in one continuous sequential flow via Supabase MCP execute_sql; applied one official at a time. COMPTON-01 FULLY CLOSED; next migration=729
- [Phase 128-03]: Phase 128 Carson Stances CLOSED — Q1=5 rows (all 5 officials with stances), Q2=0 uncited, Q3=0 unpaired, Q4=0 rows on inactive topics, Q5=0 (Bradshaw+Cooper exclusion confirmed). Per-official counts: Davis-Holmes(Mayor, directly elected)=9, Hilton(D1)=5, Dear(D2)=8, Hicks(D3)=6, Rojas(D4)=6; total 34 stance rows (migrations 719-723); Carson 2017 immigration-protective resolution established local-immigration=2.0 pattern for all 5 officials; Dear richest D1-D4 record (growth-and-development+taxes); Hicks/Rojas local-environment=2.0 from AQMD advocacy near industrial zones; CARSON-01 FULLY CLOSED; next migration=724

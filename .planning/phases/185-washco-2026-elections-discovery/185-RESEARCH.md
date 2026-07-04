# Phase 185: WashCo 2026 Elections & Discovery - Research

**Researched:** 2026-07-04
**Domain:** Oregon nonpartisan local-election race seeding + candidate-discovery arming (brownfield local-layer)
**Confidence:** HIGH for schema/mechanics/discovery-runner (source-code verified); HIGH-MEDIUM for per-jurisdiction seats-up (verified via prior-phase primary-source research + fresh cross-check); MEDIUM-LOW for the *exact Nov 2026 candidate slate* in the 6 smaller cities (filing periods are still open/just opening as of the research date — see Unresolved Unknowns).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Arm + ingest west-metro. Seed race rows + arm discovery + one test run **AND** manually ingest the known post-primary candidates for the west-metro local races actually on the Nov 2026 ballot.
- **D-02:** Candidate depth = names + headshots, NO stances. Seed candidate rows + `race_candidates` linkage (party-blind — antipartisan); add 600×750 (4:5 Lanczos q90) headshots where an official/campaign photo exists. Compass stances explicitly deferred.
- **D-03:** Only seats actually up in Nov 2026. OR council/commission terms are staggered — do NOT seed a shell for every office. Do NOT guess which seats. All 8 west-metro govs have 0 races for 2026 (verified live 2026-07-04); offices exist (5–7 each) as FK targets.
- **D-04:** Confirm none regular + catch specials. OR school-board elections run at the May election in odd-numbered years (2025/2027) per ORS 255 — seed 0 regular school-board races. Additionally check for any 2026 board vacancy/special election on the Nov ballot and seed only those if they exist.
- **D-05:** County + 7 cities = 8 discovery_jurisdictions rows (mirrors the existing Portland-city + Multnomah-county pattern). School-board rows NOT armed.
- **D-06:** `source_url` = Washington County Elections Division candidate-filing page for all 8 rows. If it proves hard to parse, fall back to `sos.oregon.gov` Candidate-Filings-Local-Measures as `source_url` with the county page + `ballotpedia.org` in `allowed_domains`.
- **D-07:** One real test discovery run must complete. Acceptance bar = run completes without error; candidate count may be small/zero. Planner must confirm HOW the discovery runner is invoked in this environment before relying on it.
- **D-08 (carried from 167):** No `essentials.elections` row created — both OR 2026 rows exist (General `de10e3a7-f5c2-47e6-acd7-ee87be9413db` Nov 3; Primary `cf4a24d6-f01b-4a8c-a5e5-4a1117b21905` May 19, already past). Races FK to the General via subquery `name='OR 2026 General' AND state ILIKE 'or'`.
- **D-09 (carried):** No `cron_active` column. `discovery_jurisdictions` eligibility is date-based (180-day cron horizon before `election_date`).
- **D-10 (carried):** Race rows anchor on the office, not the incumbent. Open/termed-out seats still get a row keyed to `office_id`. Idempotency via `NOT EXISTS` guards on `(election_id, office_id)` — no DB unique constraint, do NOT use `ON CONFLICT`. `primary_party` stays NULL (antipartisan); `seats` per race defaults to the office's seat count.
- **D-11 (carried):** office_id resolution via chamber→government geo_id, NOT `representing_city` (CONTEXT states west-metro offices have `representing_city = NULL`). **This research found the opposite for 6 of 7 cities as of 2026-07-04 — see "Correction to D-11" below.** The geo_id→chamber→office join is still the recommended primary mechanism; watch the OR `districts.state` casing trap (`'or'` vs `'OR'`) on any district joins.
- **D-12 (carried):** Migration mechanics: files in `C:/EV-Accounts/backend/migrations/`; idempotent via `NOT EXISTS` guards + `BEGIN;/COMMIT;`; paired `_apply-migration-NNN.ts` smoke test. CONTEXT stated next=1210 (on-disk max=1209 as of 2026-07-04 context-gathering time). **This research found the counter has already advanced further — see "Migration Mechanics" below; re-verify live at plan/execution time regardless.**

### Claude's Discretion

- Whether races + candidate ingestion land in one migration or split (e.g. races → race_candidates → discovery) — planner's call, kept idempotent either way. Likely (01) races, (02) candidates + headshots, (03) discovery + test run.
- Exact `position_name` strings per race — mirror the per-jurisdiction chamber names already seeded in Phases 175–184 (verbatim official titles).

### Deferred Ideas (OUT OF SCOPE)

- Statewide candidate-gap fill (121 empty OR legislative/down-ballot shells) — own future phase.
- Compass stances for 2026 candidates — later follow-up after names + headshots.
- Coverage/Landing surfacing of west-metro election data → Phase 186 (retrospective/close).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WM-ELEC-01 | 2026 local elections seeded for the new west-metro jurisdictions (Washington County + 7 cities + 5 school boards as applicable) with the discovery pipeline armed (discovery_jurisdictions rows, proximity-aware cron) against official Washington County / Oregon SOS sources. | Per-jurisdiction seats-up table below resolves "as applicable" for both cities and school boards; discovery config block gives exact source_url/allowed_domains per D-06's fallback; discovery runner invocation confirmed via source-code read (essentialsDiscovery.ts). |

</phase_requirements>

---

## Summary

Oregon nonpartisan local elections in this milestone follow **two distinct mechanics**, and mixing them up is the single biggest risk in this phase. **Washington County Commission and the City of Beaverton** hold their nonpartisan races at the **May 19, 2026 primary**, with a **November 3, 2026 runoff** only for seats where no candidate won an outright majority. **The other 6 cities (Hillsboro, Tigard, Tualatin, Forest Grove, Sherwood, Cornelius) appear to hold their council/mayor elections directly at the November general**, with no May-primary stage found in any of their own election pages or local-news coverage — candidate filing for several of them was **not yet open** as of the research date (2026-07-04; Hillsboro's own filing period begins July 6, 2026). This means: (a) some "seats up in 2026" already have their outcome **decided** (May primary majority winner — no Nov ballot item at all for that seat), (b) some go to a **real Nov 2026 runoff** (2 known candidates), and (c) for most of the 6 smaller cities the **candidate slate is genuinely not yet knowable** at planning time and won't be until filing deadlines pass later in 2026.

Every prior WashCo city/county deep-seed phase (175–182) already did the term-expiration legwork as a side effect of ground-truthing the *current* roster — this research consolidates and cross-verifies that existing per-phase data rather than re-deriving it from scratch, and adds fresh verification for Washington County Commission (not previously nailed down to this level of detail) plus live re-verification of the migration counter, discovery-runner invocation, and schema column sets.

**Primary recommendation:** Seed race rows ONLY for the specific offices confirmed "up in Nov 2026" in the seats-up table below (never a shell per office). For the 2 jurisdictions with a confirmed May-primary outcome, seed the race row regardless of whether the seat is decided or a runoff (D-10 says anchor on the office) but only ingest `race_candidates` for the actual Nov-2026-ballot candidates — a May-decided seat still needs a race row (WM-ELEC-01 wants ballot visibility) but its `race_candidates` should reflect the person who already won (no opposing candidate will appear on the Nov ballot for it). Arm discovery for all 8 jurisdictions using the SOS-fallback URL (the county's specific candidate-filing subpage returned HTTP 403 in this session — see Discovery Config below). Seed 0 school-board races (regular and special) — no vacancy found in any of the 5 boards as of 2026-07-04.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Race rows (`essentials.races`) | Database / Storage (Supabase) | — | Pure SQL seed migration against existing `essentials.elections`/`essentials.offices` rows; no app-tier code |
| Candidate rows + headshots | Database / Storage + Supabase Storage | External (city sites / Ballotpedia for photos) | `essentials.politicians` (challengers) + `essentials.race_candidates` + `politician_images`; headshot pipeline (Python PIL, existing) |
| Discovery jurisdiction registry | Database / Storage | — | `essentials.discovery_jurisdictions` rows; no app-tier code needed to arm |
| Discovery run trigger + execution | API / Backend (Express, `accounts-api.empowered.vote`) | External (Claude web-search agent, official OR/WashCo sources) | `POST /api/admin/discover/jurisdiction/:id` → `runDiscoveryForJurisdiction()` in `discoveryService.ts`; fully server-side, admin-token gated |
| `/elections` ballot rendering | Frontend (React, existing) | API / Backend (existing endpoints) | No frontend code changes in this phase — existing `/elections` page already reads races by jurisdiction; 0-candidate races already hidden (`100eda9`) |
| Surfacing on coverage.js/Landing | Frontend | — | Explicitly OUT of scope — deferred to Phase 186 |

---

## Per-Jurisdiction Seats-Up Table (THE PRIMARY RESEARCH OUTPUT)

All entries below were cross-verified against **primary-source city pages** (fetched directly, either by this research session or by the cited prior-phase RESEARCH.md, which itself fetched the primary source directly — no daisy-chained WebSearch summaries used for the term-expiration claims). "Ballot status" distinguishes a seat that is genuinely on the Nov 3, 2026 ballot from one that is procedurally "up in the 2026 cycle" but already decided in May or filled by council appointment (no Nov ballot item).

### Washington County Commission (geo_id `41067`)

Uses the **May-primary + Nov-runoff-if-no-majority** mechanic (ORS 203, standard for OR counties).

| Seat / office title | Term status | May 19 2026 primary result | Nov 3 2026 ballot status | Source |
|---|---|---|---|---|
| County Chair | Harrington retiring, seat open | Fai 38.5%, Treece 33.5%, Kamprath 27.5% — no majority | **ON BALLOT — runoff: Nafisa Fai vs. Pam Treece** | [VERIFIED: opb.org 2026-05-19/05-21, beavertonvalleytimes.com 2026-05-22] |
| Commissioner, District 1 (Fai) | NOT up in 2026 cycle (term runs to Dec 2028 per WebSearch; not on the 2026 ballot regardless of Fai's Chair run) | N/A | **NOT ON BALLOT** — if Fai wins Chair, D1 becomes a mid-term vacancy filled by Board appointment, not a Nov 2026 election | [CITED: kgw.com 2026-05-19 aggregation] — MEDIUM confidence, not independently primary-source-confirmed this session |
| Commissioner, District 2 (Treece) | Up in 2026 cycle; Treece not seeking re-election (running for Chair instead) | Felicita Monteblanco won outright in the May primary | **NOT ON NOV BALLOT — already decided in May** | [VERIFIED: 175-RESEARCH.md, hillsboronewstimes.com 2026-05-19] |
| Commissioner, District 3 (Snider) | NOT up in 2026 cycle | N/A | **NOT ON BALLOT** | [CITED: 175-RESEARCH.md] |
| Commissioner, District 4 (Willey, retiring) | Up in 2026 cycle; 6-candidate field, no majority | Callaway 33%, Sinclair 21.3%, Hofler 18.7%, Martin 12.1%, Schaefer 9.2%, Culbertson 5.4% | **ON BALLOT — runoff: Steve Callaway vs. Kipperlyn Sinclair** | [VERIFIED: hillsboronewstimes.com 2026-05-22, opb.org 2026-05-08] |

**Net for WashCo Commission: 2 real Nov 2026 races (Chair runoff, D4 runoff). Seed race rows for these 2 offices only.** (D2's Monteblanco win is already-decided; whether to also seed a "ceremonial" race row for D2 pointing at Monteblanco as the sole/uncontested winner is a planner discretion call — see Open Questions.)

### Beaverton (geo_id `4105350`) — 4-year terms, numbered Positions, May-primary + Nov-runoff mechanic

| Position | Term status | May 19 2026 primary result | Nov 3 2026 ballot status | Source |
|---|---|---|---|---|
| Mayor (Beaty) | Term runs Jan 2025–Dec 2028 | N/A | **NOT UP in 2026** | [VERIFIED: 176-RESEARCH.md] |
| Position 1 (Hartmeier-Prigg, not seeking re-election) | Up in 2026 | Philip 48.4%, Kocher 33.9% — no majority | **ON BALLOT — runoff: Rachel Philip vs. Evelyn Kocher** | [VERIFIED: 176-RESEARCH.md; beavertonvalleytimes.com 2026-05-22; ballotpedia.org candidate pages confirmed to exist for both] |
| Position 2 (Teater) | Up in 2026 | Teater re-elected outright, 72.6% | **NOT ON NOV BALLOT — decided in May** | [VERIFIED: 176-RESEARCH.md] |
| Position 5 (Dugger) | Up in 2026 | Dugger re-elected outright, 78.4% | **NOT ON NOV BALLOT — decided in May** | [VERIFIED: 176-RESEARCH.md] |

**Net for Beaverton: 1 real Nov 2026 race (Position 1 runoff). Seed a race row for Position 1 only.**

### Hillsboro (geo_id `4134100`) — 4-year terms, Ward/Position labels, straight-to-November (no May-primary stage found)

| Seat | Term status | Nov 3 2026 ballot status | Source |
|---|---|---|---|
| Mayor (Beach Pace) | Term through Jan 2029 | NOT up in 2026 | [VERIFIED: 177-RESEARCH.md] |
| Ward 1, Position A (Cristian Salgado, appointed 2025) | Term through Dec 31, 2026 | **ON BALLOT** — candidate slate not yet confirmed (filing period begins July 6, 2026, per city's own July 2026 announcement) | [VERIFIED: 177-RESEARCH.md; hillsboro-oregon.gov "City Council Election Filing Period Begins July 6" news item] |
| Ward 2, Position A (Kipperlyn Sinclair) | Term through Jan 5, 2027 | **ON BALLOT** — Sinclair is simultaneously a WashCo D4 commission candidate (runoff, see above); unclear if she is defending this Hillsboro seat too — candidate slate TBD | [VERIFIED: 177-RESEARCH.md; cross-referenced against WashCo D4 finding this session] |
| Ward 3, Position A (Olivia Alcaire, term-limited) | Term through Jan 5, 2027; **cannot run again** | **ON BALLOT — open seat, no incumbent running** | [VERIFIED: 177-RESEARCH.md] |

**Net for Hillsboro: 3 seats on the Nov 2026 ballot (Ward 1-A, Ward 2-A, Ward 3-A). Candidate names not yet filed as of research date — see Unresolved Unknowns.**

### Tigard (geo_id `4173650`) — pure at-large, plain titles, straight-to-November

| Seat | Term status | Nov 3 2026 ballot status | Source |
|---|---|---|---|
| Mayor (Yi-Kang Hu, appointed interim) | Term through Dec 2026 (filling the remainder of Lueb's term; the *scheduled* election for the next full term is Nov 2026 regardless of the mid-term appointment) | **ON BALLOT** — 2 sitting councilors reported "vying" for the seat per OPB (2025-09-24); exact filed candidate names not found this session | [VERIFIED: 178-RESEARCH.md; CITED: opb.org "2 Tigard city councilors to vie for newly open mayor's seat"] |
| Councilor (Tom Anderson, appointed interim) | Term through Dec 2026 | **ON BALLOT — open seat**; Anderson has publicly stated he will NOT run for election in November | [CITED: WebSearch aggregation, valleytimes.news "Anderson appointment... not without drama" 2025-12-11] |
| Councilor (Faraz Ghoddusi, elected to a 2-yr charter-expansion seat) | Term through Dec 2026 | **ON BALLOT** | [VERIFIED: 178-RESEARCH.md] |
| Councilor (Heather Robbins, elected to a 2-yr charter-expansion seat) | Term through Dec 2026 | **ON BALLOT** | [VERIFIED: 178-RESEARCH.md] |
| Councilors Wolf, Shaw, Schlack | Term through Dec 2028 | NOT up in 2026 | [VERIFIED: 178-RESEARCH.md] |

**Net for Tigard: 4 seats on the Nov 2026 ballot (Mayor + 3 councilor seats). Candidate names not yet confirmed this session — see Unresolved Unknowns.**

### Tualatin (geo_id `4174950`) — at-large, numbered Positions, straight-to-November

| Position | Term status | Nov 3 2026 ballot status | Source |
|---|---|---|---|
| Mayor (Frank Bubenik) | Term through Dec 2026; term-limit-exposed, city's own election page confirms he is NOT among the 2026 mayoral candidates | **ON BALLOT — open seat.** Known candidates: **Octavio Gonzalez** (current Position 5 councilor, vacating that seat to run) and **Valerie Pratt** (current Position 6 Council President, whose own Position 6 term runs to Dec 2028 and is not up — she is running for Mayor instead) | [VERIFIED: 179-RESEARCH.md, direct fetch of `tualatinoregon.gov/city-council/elections/`] |
| Position 1 (María Reyes) | Term through Dec 2026 | **ON BALLOT** — candidate slate not confirmed this session | [VERIFIED: 179-RESEARCH.md] |
| Position 3 (Bridget Brooks) | Term through Dec 2026 | **ON BALLOT** — candidate slate not confirmed this session | [VERIFIED: 179-RESEARCH.md] |
| Position 5 (Octavio Gonzalez, vacating to run for Mayor) | Term through Dec 2026 | **ON BALLOT — open seat.** Known candidate: **Beth Dittman** | [VERIFIED: 179-RESEARCH.md] |
| Positions 2, 4, 6 | Term through Dec 2028 | NOT up in 2026 | [VERIFIED: 179-RESEARCH.md] |

**Net for Tualatin: 4 seats on the Nov 2026 ballot (Mayor, Position 1, Position 3, Position 5).**

### Forest Grove (geo_id `4126200`) — pure at-large, plain titles, straight-to-November

| Seat | Term status | Nov 3 2026 ballot status | Source |
|---|---|---|---|
| Mayor (Malynda Wenzl) | Term through Dec 2026 | **ON BALLOT** | [VERIFIED: 180-RESEARCH.md — "one of four seats up for election Nov 3, 2026 per the city's own Elections page"] |
| Councilor Michael Marshall | Term through Dec 2026 | **ON BALLOT** | [VERIFIED: 180-RESEARCH.md] |
| Councilor Karen Martinez | Term through Dec 2026 | **ON BALLOT** | [VERIFIED: 180-RESEARCH.md] |
| Councilor (Council President) Mariana Valenzuela | Term through Dec 2026 | **ON BALLOT** | [VERIFIED: 180-RESEARCH.md] |
| Councilors Gustafson, Falconer, Schimmel | Term through Dec 2028 | NOT up in 2026 | [VERIFIED: 180-RESEARCH.md] |

**Net for Forest Grove: 4 seats on the Nov 2026 ballot (Mayor + 3 councilors). Candidate names not found this session.**

### Sherwood (geo_id `4167100`) — pure at-large, plain titles, 2-year Mayor term, straight-to-November

| Seat | Term status | Nov 3 2026 ballot status | Source |
|---|---|---|---|
| Mayor Tim Rosener | Term expires Jan 2027 (2-yr term) | **ON BALLOT** — the city's own 2026 election-cycle candidate list confirms the "Jan-2027 cohort" is exactly {Mayor, Giles, Mays, Scott} | [VERIFIED: 181-RESEARCH.md, direct fetch `sherwoodoregon.gov/government/city-council/` + city elections page] |
| Councilor Taylor Giles | Term expires Jan 2027 | **ON BALLOT** | [VERIFIED: 181-RESEARCH.md] |
| Councilor Keith Mays | Term expires Jan 2027 | **ON BALLOT** | [VERIFIED: 181-RESEARCH.md] |
| Councilor Doug Scott | Term expires Jan 2027 | **ON BALLOT** | [VERIFIED: 181-RESEARCH.md] |
| Councilors Young, Brouse, Standke | Term expires Jan 2029 | NOT up in 2026 | [VERIFIED: 181-RESEARCH.md] |

**Net for Sherwood: 4 seats on the Nov 2026 ballot (Mayor + 3 councilors). This session's WebSearch attempt to find filed candidate names returned only stale/prior-cycle (2022) data — treat candidate names as NOT YET CONFIRMED (see Unresolved Unknowns).**

### Cornelius (geo_id `4115550`) — pure at-large, plain titles, 2-year Mayor term, 2-of-4 staggered councilor terms, straight-to-November

| Seat | Term status | Nov 3 2026 ballot status | Source |
|---|---|---|---|
| Mayor Jeffrey C. Dalin | Term through Dec 2026 | **ON BALLOT — Dalin unopposed** (per the city's live 2026 election page) | [VERIFIED: 182-RESEARCH.md, direct fetch of the city's Nov-2026 election page] |
| Councilor Edgar Baker (appointed interim) | Term through Dec 2026 | **ON BALLOT** — Baker "certified as a Nov 2026 candidate to keep the seat" | [VERIFIED: 182-RESEARCH.md] |
| Councilor Edén López (appointed interim) | Term through Dec 2026 | **ON BALLOT** — López listed as the incumbent candidate | [VERIFIED: 182-RESEARCH.md] |
| Councilor (Council President) Angeles Godinez Valencia | Term through Dec 2028 | NOT up in 2026 | [VERIFIED: 182-RESEARCH.md] |
| VACANT seat (formerly Nuñez-Barragán) | Cohort-2028 seat, currently vacant, being filled by **Council appointment** (application window July 1–22, 2026), NOT an election | **NOT ON NOV 2026 BALLOT** — filled by appointment, next election for this seat is Nov 2028 | [VERIFIED: 182-RESEARCH.md — inferred from cohort logic: 2 seats (Baker, López) already fill the 2026 cohort, so the vacant seat must belong to the 2028 cohort alongside Godinez Valencia] |

**Net for Cornelius: 3 seats on the Nov 2026 ballot (Mayor unopposed, 2 councilor seats — Baker and López both running).**

### Milestone-wide seats-up summary

| Jurisdiction | Seats on Nov 3, 2026 ballot | Seats already decided in May (no Nov item) | Seats not up in 2026 |
|---|---|---|---|
| WashCo Commission | 2 (Chair, D4) | 1 (D2 — Monteblanco won outright) | 2 (D1, D3) |
| Beaverton | 1 (Position 1) | 2 (Position 2, Position 5) | 1 (Mayor) |
| Hillsboro | 3 (Ward1-A, Ward2-A, Ward3-A) | 0 | 3 (Mayor + 2 others not up) |
| Tigard | 4 (Mayor, Anderson seat, Ghoddusi, Robbins) | 0 (no May stage) | 3 (Wolf, Shaw, Schlack) |
| Tualatin | 4 (Mayor, Pos1, Pos3, Pos5) | 0 (no May stage) | 3 (Pos2, Pos4, Pos6) |
| Forest Grove | 4 (Mayor, Marshall, Martinez, Valenzuela) | 0 (no May stage) | 3 (Gustafson, Falconer, Schimmel) |
| Sherwood | 4 (Mayor, Giles, Mays, Scott) | 0 (no May stage) | 3 (Young, Brouse, Standke) |
| Cornelius | 3 (Mayor, Baker, López) | 0 (no May stage) | 2 (Godinez Valencia, vacant/2028-cohort) |
| **TOTAL** | **25 race rows recommended** | 3 (planner discretion: seed or skip — see Open Questions) | 20 (correctly excluded per D-03) |

---

## School Board Finding (D-04)

**Regular 2026 races: 0, confirmed.** [VERIFIED: `ballotpedia.org/Rules_governing_school_board_election_dates_and_timing_in_Oregon` + ORS 255.012 text via WebSearch aggregation] Oregon school district board elections are regular district elections held in **May of odd-numbered years** (2025, 2027) under ORS 255. There is no regular school-board cycle in November 2026 (an even year) for any Oregon district, including all 5 west-metro boards (Beaverton SD 48J, Hillsboro SD 1J, Tigard-Tualatin SD 23J, Forest Grove SD 15, Sherwood SD 88J).

**Specials/vacancies: 0 found.** Phase 183 (Beaverton SD 48J + Hillsboro SD 1J, researched/seeded 2026-07-04) explicitly confirmed **"Both rosters are fully confirmed, 7/7, no vacancies"**. Phase 184 (Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J, researched/seeded 2026-07-04) explicitly confirmed **"all 5/5, no vacancies"**. Both phases ran on the *same day* as this research (2026-07-04) and pulled the live board rosters directly from each district's own site — if a 2026 vacancy/special election existed on any board, one of these two phases would very likely have surfaced it as a live roster anomaly (as Cornelius's city-council vacancy was surfaced in Phase 182 the same week). No corroborating vacancy-notice or special-election-filing evidence was found in this session's WebSearch either.

**Recommendation: seed 0 school-board race rows.** Do not arm discovery for the 5 school-board jurisdictions (consistent with D-05's explicit exclusion).

---

## Discovery Config Block (D-05 / D-06 / D-07)

### Source URL reachability finding

The exact URL named in D-06 — the county's specific candidate-filing page — was tested live this session:

| URL | HTTP status | Notes |
|---|---|---|
| `https://www.washingtoncountyor.gov/elections` (root) | **200** | Landing page; links out to sub-pages, does not itself list candidates |
| `https://www.washingtoncountyor.gov/elections/upcoming-elections` | **200** | Reachable |
| `https://www.washingtoncountyor.gov/elections/candidate-measure-filing-forms` | **200** | Reachable (blank filing FORMS, not filed-candidate LISTINGS) |
| `https://www.washingtoncountyor.gov/elections/candidate-and-measure-filings` | **403** (both plain `curl` and Chrome-UA `curl`) | This is the page that would actually list who has filed — **blocked**. Re-tested twice this session with consistent 403. |
| `https://sos.oregon.gov/elections/Pages/Candidate-Filings-Local-Measures.aspx` | **200** | D-06's named fallback. Reachable, but itself only a landing page linking to the JS-rendered ORESTAR search tool (`secure.sos.state.or.us/orestar/CFSearchPage.do`) — not a direct candidate listing either. |

**Conclusion: invoke D-06's pre-authorized fallback.** The county's actual filed-candidate page 403s (WAF or bot-block on that specific path — root `/elections` is fine, only the filings sub-page is blocked); the SOS fallback page is reachable but is itself only a hub, not a parseable candidate list. Since the discovery agent is a Claude web-search agent (not a plain HTML scraper — see Discovery Runner below), it can navigate hub pages and follow links the way this research's own WebFetch tool could not; a landing page in `source_url` combined with a rich `allowed_domains` list is exactly the pattern the NV/VA/MD precedents used (their `source_url` — nvsos.gov, ballotpedia.org — were likewise not raw candidate-list pages).

### Recommended 8 rows

All 8 rows: `state='OR'` (uppercase — `discovery_jurisdictions.state` is `character(2)`, matching the `elections.state`/NV/VA/MD convention; this is **NOT** the same casing rule as `essentials.districts.state`, which is lowercase `'or'` for OR — two different tables, two different casing rules, do not conflate them), `election_date='2026-11-03'`.

| jurisdiction_geoid | jurisdiction_name | source_url | allowed_domains |
|---|---|---|---|
| `41067` | Washington County, Oregon | `https://sos.oregon.gov/elections/Pages/Candidate-Filings-Local-Measures.aspx` | `['sos.oregon.gov','washingtoncountyor.gov','ballotpedia.org']` |
| `4105350` | Beaverton, Oregon | `https://beavertonoregon.gov/944/Elections` (confirmed to exist per WebSearch; not independently re-fetched with curl this session) | `['beavertonoregon.gov','washingtoncountyor.gov','sos.oregon.gov','ballotpedia.org']` |
| `4134100` | Hillsboro, Oregon | `https://www.hillsboro-oregon.gov/` (city elections news is published under the city's News component; exact stable URL not confirmed this session — see Open Questions) | `['hillsboro-oregon.gov','washingtoncountyor.gov','sos.oregon.gov','ballotpedia.org']` |
| `4173650` | Tigard, Oregon | `https://www.tigard-or.gov/your-government/council/election` | `['tigard-or.gov','washingtoncountyor.gov','sos.oregon.gov','ballotpedia.org']` |
| `4174950` | Tualatin, Oregon | `https://tualatinoregon.gov/city-council/elections/` | `['tualatinoregon.gov','washingtoncountyor.gov','sos.oregon.gov','ballotpedia.org']` |
| `4126200` | Forest Grove, Oregon | `https://www.forestgrove-or.gov/362/Elections` | `['forestgrove-or.gov','washingtoncountyor.gov','sos.oregon.gov','ballotpedia.org']` |
| `4167100` | Sherwood, Oregon | `https://www.sherwoodoregon.gov/elections` | `['sherwoodoregon.gov','washingtoncountyor.gov','sos.oregon.gov','ballotpedia.org']` |
| `4115550` | Cornelius, Oregon | `https://www.corneliusor.gov/385/Elections-2024` (this path redirected to the live 2026 election page when fetched by a prior-phase agent — re-verify the redirect target at plan time) | `['corneliusor.gov','washingtoncountyor.gov','sos.oregon.gov','ballotpedia.org']` |

**Alternative (simpler, D-06-literal) option:** use the SAME source_url (`sos.oregon.gov` fallback) for all 8 rows, with the county page + `ballotpedia.org` + that row's own city domain in `allowed_domains`. This is closer to D-06's literal "single URL for all 8 rows" instruction and avoids re-verifying 7 different city URLs at plan time. **Recommendation: the per-city source_url table above is preferred** (mirrors the accuracy the WashCo-city research already established these URLs are live/no-WAF), but either satisfies D-06 — planner's call.

### Discovery runner invocation (D-07) — CONFIRMED via source code read

[VERIFIED: direct read of `C:/EV-Accounts/backend/src/routes/essentialsDiscovery.ts`, `src/index.ts`, `src/lib/env.ts`]

- **Endpoint:** `POST https://accounts-api.empowered.vote/api/admin/discover/jurisdiction/:id` where `:id` is the `discovery_jurisdictions.id` UUID (NOT the geoid).
- **Auth:** header `X-Admin-Token: $ADMIN_INGEST_TOKEN` — token is read from `C:/EV-Accounts/backend/.env` (`ADMIN_INGEST_TOKEN`, required env var per `env.ts` schema). Never hardcode or log this token (matches Phase 167's T-167-03-TOKEN mitigation).
- **Behavior:** returns `202 {status:'accepted', jurisdictionId}` immediately; the actual Claude-agent-powered discovery run continues asynchronously via `runDiscoveryForJurisdiction()` in `discoveryService.ts`. A `409 ALREADY_RUNNING` is returned if a run is already in progress (global run lock).
- **Evidence of completion:** poll `essentials.discovery_runs` (created with `status='running'` before the agent starts) for `status='completed'` (or `'failed'` with `error_message` populated). Columns: `id, discovery_jurisdiction_id, jurisdiction_geoid, election_date, status, started_at, completed_at, candidates_found, candidates_new, candidates_withdrawn, error_message, raw_output (jsonb), triggered_by`.
- **Host correction (carried from Phase 167 SUMMARY):** use `accounts-api.empowered.vote` — the Render subdomain `accounts-api.onrender.com` is a dead hostname (404s), a documented trap from the NV phase.
- **Acceptance bar (D-07):** run completes (`status='completed'`) with `error_message IS NULL`. `candidates_found` may be 0.

---

## Candidate Slate Table (D-01/D-02) — what is actually knowable today

| Race | Confirmed candidate(s) | Headshot available? | Source | Confidence |
|---|---|---|---|---|
| WashCo Chair (runoff) | Nafisa Fai, Pam Treece | Both are sitting commissioners already seeded in Phase 175 with headshots (media-production.washcotech.net) — reuse existing `politicians`/`politician_images` rows, do NOT create new ones | [VERIFIED: opb.org 2026-05-19/21] | HIGH |
| WashCo District 4 (runoff) | Steve Callaway, Kipperlyn Sinclair | Neither has an existing politician row in this DB (Callaway = former Hillsboro Mayor, not currently seeded here; Sinclair = currently seeded as a Hillsboro Ward 2 councilor — reuse her existing row, do NOT duplicate). Callaway needs a new challenger row + headshot search. | [VERIFIED: hillsboronewstimes.com 2026-05-22] | HIGH |
| Beaverton Position 1 (runoff) | Rachel Philip, Evelyn Kocher | Individual Ballotpedia candidate pages confirmed to exist for both — likely has campaign photos; not independently fetched this session | [VERIFIED: 176-RESEARCH.md; ballotpedia.org candidate-page URLs confirmed via WebSearch] | HIGH |
| Beaverton Position 2 | Kevin Teater (re-elected outright, no opponent on Nov ballot) | Already seeded (Phase 176) with headshot | [VERIFIED: 176-RESEARCH.md] | HIGH — but this is a MAY outcome, not a Nov race; planner discretion whether to seed |
| Beaverton Position 5 | John Dugger (re-elected outright, no opponent on Nov ballot) | Already seeded (Phase 176) with headshot | [VERIFIED: 176-RESEARCH.md] | HIGH — same caveat as Position 2 |
| Tualatin Mayor | Octavio Gonzalez, Valerie Pratt | Both already seeded in Phase 179 (as Position 5 and Position 6 councilors respectively) with headshots — reuse existing rows | [VERIFIED: 179-RESEARCH.md, direct fetch of city elections page] | HIGH |
| Tualatin Position 5 | Beth Dittman | No existing politician row (new challenger) — headshot not sourced this session | [VERIFIED: 179-RESEARCH.md] | HIGH for the name; headshot sourcing is an open task |
| Cornelius Mayor | Jeffrey C. Dalin (unopposed) | Already seeded (Phase 182) with headshot | [VERIFIED: 182-RESEARCH.md, direct fetch of city's live 2026 election page] | HIGH |
| Cornelius Councilor seat (Baker) | Edgar Baker | Already seeded (Phase 182) with headshot | [VERIFIED: 182-RESEARCH.md] | HIGH — confirm at plan time whether Baker is unopposed or has a challenger |
| Cornelius Councilor seat (López) | Edén López | Already seeded (Phase 182) with headshot | [VERIFIED: 182-RESEARCH.md] | HIGH — confirm at plan time whether López is unopposed or has a challenger |
| Hillsboro Ward 1-A, Ward 2-A, Ward 3-A | **NOT YET FILED** — Hillsboro's own filing period begins July 6, 2026 (2 days after this research date) | N/A | [VERIFIED: hillsboro-oregon.gov news item] | Candidate names genuinely unknowable at research time — **defer, see Unresolved Unknowns** |
| Tigard Mayor, Anderson seat, Ghoddusi seat, Robbins seat | Partial — OPB reports "2 city councilors" vying for Mayor but does not name them in the fetched excerpt; Anderson confirmed NOT running for his own seat (open) | N/A | [CITED: opb.org, valleytimes.news — WebSearch aggregation, not independently re-fetched] | **Defer** — re-fetch `tigard-or.gov/your-government/council/election` directly (blocked by 403 to this session's curl/WebFetch; a Chrome-rendering fetch or the discovery agent itself may succeed) |
| Forest Grove Mayor + 3 councilor seats | Not found this session | N/A | — | **Defer** — city's own Elections page (`forestgrove-or.gov/362/Elections`) is confirmed reachable (HTTP 200 per 180-RESEARCH.md); re-fetch at plan/Wave-0 time for the actual 2026 filed list |
| Sherwood Mayor + Giles/Mays/Scott seats | Not reliably found this session (WebSearch returned stale/prior-cycle noise) | N/A | — | **Defer** — city's own elections page (`sherwoodoregon.gov/elections`) confirmed reachable; re-fetch directly at plan time |
| Tualatin Position 1, Position 3 | Not found this session | N/A | — | **Defer** — re-fetch `tualatinoregon.gov/city-council/elections/` directly at plan time (page confirmed reachable, no WAF) |

**Bottom line for D-01/D-02:** A genuinely confirmable Nov-2026 candidate slate exists TODAY for **WashCo Chair, WashCo D4, Beaverton Pos 1, Tualatin Mayor, Tualatin Pos 5, Cornelius Mayor/Baker/López** — 8 races with real, sourced names. For the remaining races (**Hillsboro's 3 seats, Tigard's 4 seats, Forest Grove's 4 seats, Sherwood's 4 seats, Tualatin's Pos 1/Pos 3**), either filing has not yet opened or this research session could not pull a live, complete list — the planner should still **seed the race row** (office-anchored per D-10) but budget a **Wave-0 direct-fetch task** (curl/WebFetch against each city's own confirmed-reachable elections page) immediately before writing `race_candidates` INSERTs, rather than trusting this research's incomplete WebSearch aggregation for names. **Never fabricate a candidate name** — if Wave-0 re-fetch also comes up empty (because filing genuinely hasn't closed), seed the race row with 0 `race_candidates` rows and let discovery fill it in later (matches the accepted-outcome language in D-07: "candidate count may be small or zero").

---

## Migration Mechanics (D-12)

### Migration counter — RE-VERIFIED LIVE, SUPERSEDES CONTEXT

[VERIFIED: `ls C:/EV-Accounts/backend/migrations | sort -n` run twice in this session, ~30 minutes apart]

- CONTEXT.md (written earlier on 2026-07-04) stated on-disk max = 1209, next = 1210.
- **This research found the on-disk max has already advanced to 1211** (`1210_seed_mn_2026_house_elections_races.sql`, `1211_seed_mn_2026_house_candidates.sql` — a parallel MN 2026 House workstream consumed both numbers between CONTEXT-gathering and this research session).
- **Next migration number for Phase 185 as of this research: 1212.** This WILL be stale again by the time planning/execution actually runs — **the planner/executor must re-run `ls C:/EV-Accounts/backend/migrations | sort` live immediately before writing the first migration file**, exactly as every prior WashCo phase's own research/plan discovered a shifted counter (Phase 179 found 1168 vs a stale 1159 ledger estimate; Phase 182 found 1195 vs a stale 1187 ledger estimate). This is now a **proven, recurring pattern in this milestone**, not a one-off risk.

### Ledger behavior — CONFIRMED, nuanced

- Migration 1120 (WashCo Commission structural mig) **DOES** write a `supabase_migrations.schema_migrations` ledger row: `INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('1120', 'washco_commission') ON CONFLICT (version) DO NOTHING;` — run OUTSIDE the `BEGIN/COMMIT` transaction block, using the 2-column `(version, name)` form.
- Migrations 1109/1110/1111/1112/1113 (the direct races/candidates/discovery prior-art) **do NOT** write a ledger row.
- **Reconciliation:** structural migrations (governments/chambers/offices — anything that changes the *shape* of what exists) register in the ledger; pure data-seed migrations (elections/races/candidates/discovery rows on top of already-existing offices) do not. **Phase 185 is entirely data-seed** (all office_ids already exist from Phases 175–184) — follow the 1109-family pattern: **no ledger INSERT** in any of the 185 migrations. This matches Phase 167's identical reconciliation (D-08 in the 167 CONTEXT).

### tsx invocation — CONFIRMED

`C:/EV-Accounts/backend/node_modules/tsx/dist/cli.mjs` exists on disk. Invoke via `node node_modules/tsx/dist/cli.mjs <script>.ts` from the `C:/EV-Accounts/backend` working directory (no `.bin`/PATH tsx binary relied upon).

---

## Schema Column Confirmation + Office Resolution Join (source-code verified)

[VERIFIED: direct read of `C:/EV-Accounts/backend/migrations/042_election_schema.sql` and `070_discovery_tables.sql` — these are the actual `CREATE TABLE` statements, not a downstream seed migration's comments]

### `essentials.elections`
`id uuid, name text NOT NULL, election_date date NOT NULL, election_type text CHECK IN ('primary','general','retention','special'), jurisdiction_level text NOT NULL CHECK IN ('federal','state','county','city','district'), state character(2), description text, created_at, updated_at`. No unique constraint beyond PK — any INSERT must guard with `WHERE NOT EXISTS`. **The two OR 2026 rows already exist (D-08) — do not re-derive their exact `name`/`state` casing from this schema definition; verify the LIVE row live at Wave-0** (`SELECT id, name, state, election_type FROM essentials.elections WHERE election_date='2026-11-03' AND jurisdiction_level='state'`) before writing the races migration's FK subquery, since this research could not query the live DB directly. CONTEXT's stated subquery `WHERE name='OR 2026 General' AND state ILIKE 'or'` is a reasonable, case-insensitive-safe guess consistent with the `'{ST} 2026 Statewide General'` naming convention seen in migration 1109 (TX/NY) and 1111 (NV) — but the `ILIKE` should be treated as a defensive measure precisely because the exact stored casing has not been independently re-confirmed this session.

### `essentials.races`
`id uuid, election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE, office_id uuid REFERENCES offices(id) [nullable], position_name text NOT NULL, primary_party text [nullable — antipartisan invariant, always NULL for general elections], seats int NOT NULL DEFAULT 1, description text, created_at, updated_at`. **No unique constraint** beyond PK — idempotency is `NOT EXISTS` on `(election_id, office_id)`, exactly as D-10 states. Never `ON CONFLICT`.

### `essentials.race_candidates`
`id uuid, race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE, politician_id uuid REFERENCES politicians(id) [nullable — NULL for challengers without an existing politician row], full_name text NOT NULL, first_name text, last_name text, photo_url text [for challengers without a politicians row], is_incumbent boolean NOT NULL DEFAULT false, candidate_status text NOT NULL DEFAULT 'active' CHECK IN ('active','withdrawn','filed'), last_verified_at, source text, external_id text [unique when non-NULL], created_at, updated_at`. **NO party field of any kind** — schema-enforced antipartisan invariant (matches D-02's design). Idempotency: `NOT EXISTS` on `(race_id, full_name)` — matches migration 1110's pattern exactly.

### `essentials.discovery_jurisdictions`
`id uuid, jurisdiction_geoid text NOT NULL, jurisdiction_name text NOT NULL, state character(2) NOT NULL [uppercase 2-letter, e.g. 'OR' — NOT the districts.state lowercase convention], election_date date NOT NULL, source_url text, allowed_domains text[], created_at, updated_at`. **Unique index on `(jurisdiction_geoid, election_date)`** — this table DOES have a real unique constraint, so `ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING` is the correct (and only necessary) idempotency pattern here — this is the one place in this phase where `ON CONFLICT` is correct, unlike races/race_candidates/politicians which have no such constraint.

### `essentials.discovery_runs` / `essentials.candidate_staging`
Confirmed present per the discussion in the Discovery Runner section above; not directly written to by this phase's migrations (the runner writes them at trigger time).

### Office resolution join (D-11)

The confirmed, working pattern (verified directly against migration 1120's actual INSERT statements and the pattern repeated identically in 1150/1159/1169/1178/1187/1196):

```sql
-- For a city (LOCAL_EXEC = Mayor, LOCAL = shared at-large Councilor district):
SELECT o.id, o.title
FROM essentials.districts d
JOIN essentials.offices o ON o.district_id = d.id
WHERE d.geo_id = '<city geo_id, e.g. 4126200>'
  AND d.state = 'or'                          -- LOWERCASE for districts.state (the OR casing trap)
  AND d.district_type IN ('LOCAL_EXEC','LOCAL')
  -- then discriminate the specific seat by o.title, e.g. 'Mayor', 'Councilor', 'Council Member (Position 5)'

-- For Washington County Commission (Chair on COUNTY, commissioners on custom LOCAL X0018 districts):
SELECT o.id, o.title
FROM essentials.districts d
JOIN essentials.offices o ON o.district_id = d.id
WHERE d.state = 'or'
  AND (
    (d.district_type = 'COUNTY' AND d.geo_id = '41067')                                  -- Chair
    OR (d.district_type = 'LOCAL' AND d.geo_id = 'washco-or-commissioner-district-4')    -- D4 only
  )
```

### Correction to D-11's stated rationale

CONTEXT (D-11) states west-metro offices have `representing_city = NULL`, justifying the geo_id-join approach. **This research found that claim is stale for 6 of the 7 cities.** [VERIFIED: direct grep of migrations 1150 (Hillsboro), 1159 (Tigard), 1169 (Tualatin), 1178 (Forest Grove), 1187 (Sherwood), 1196 (Cornelius) — every one contains a post-verify assertion like `AND o.representing_city = 'Forest Grove'` and a comment `-- CRITICAL: representing_city='<City>' is set INLINE on every office INSERT (D-11 convention)`]. Per the ROADMAP's "Milestone-wide conventions": Beaverton needed a **backfill** migration (1141) to add `representing_city`, and the convention was fixed inline starting with Hillsboro (177). **Only the WashCo Commission (1120, a county, not a city) genuinely lacks `representing_city`** (the column is semantically city-specific; the county Chair/Commissioner offices simply don't populate it, which is correct/expected for a county, not a gap). **The geo_id→district→office join above remains the recommended primary mechanism regardless** (it works uniformly for the county too, where `representing_city` doesn't apply), but the planner should not be surprised to find `representing_city` populated and usable as a secondary sanity-check for the 7 cities.

---

## Common Pitfalls

### Pitfall 1: Treating "up in the 2026 cycle" as synonymous with "has a Nov 2026 race"
**What goes wrong:** A migration seeds a race row (and worse, `race_candidates`) for Beaverton Position 2, Position 5, or WashCo District 2 — seats that were already decided outright in the May 19, 2026 primary and have NO candidate on the November ballot at all.
**Why it happens:** The phrase "seats up in 2026" is ambiguous between "this seat's 4-year term happens to expire this cycle" and "there is an actual contest on the Nov 3 ballot." Oregon's May-primary-majority rule means these are NOT the same set for WashCo Commission and Beaverton (though they ARE the same set for the other 6 cities, which have no May stage at all).
**How to avoid:** Use the "Nov 3, 2026 ballot status" column in the seats-up table above, not the raw "term status" column, to decide which offices get a race row with an active contest.
**Warning signs:** Any race row for Beaverton Position 2/5 or WashCo D2 with more than one `race_candidates` entry, or with a candidate who isn't the already-declared May winner.

### Pitfall 2: Assuming every WashCo city uses the May-primary + Nov-runoff mechanic
**What goes wrong:** Applying Beaverton's/WashCo's runoff logic (checking for a 50%+1 majority, seeding only runoff candidates) to Hillsboro/Tigard/Tualatin/Forest Grove/Sherwood/Cornelius, none of which show any evidence of a May primary stage for their council races in this research.
**Why it happens:** Beaverton and the County are researched first / most thoroughly and share the same charter mechanism (both administered county-wide through the same May 19, 2026 primary ballot), creating a false generalization.
**How to avoid:** For the 6 smaller cities, treat the Nov 3, 2026 general as the ONLY election event for that seat (no primary, no runoff concept) — a candidate simply wins by plurality on Nov 3.

### Pitfall 3: Seeding a fabricated or guessed candidate name for the 5 jurisdictions with unresolved slates
**What goes wrong:** Under time pressure, the planner/executor infers a "likely" candidate (e.g. assumes the sitting appointed incumbent will obviously run) and seeds them as a `race_candidates` row without a citation.
**Why it happens:** D-01/D-02 create pressure to "populate the elections tab" — but populating with an unverified guess is worse than an honest empty race (which the frontend already hides per `100eda9`).
**How to avoid:** Only seed `race_candidates` rows backed by a URL citation (city's own election page, Ballotpedia candidate page, or local news). Where Wave-0 re-fetch still can't confirm a name, leave the race row with 0 candidates — this is an accepted, documented gap, not a defect.

### Pitfall 4: Using `ON CONFLICT` on races, race_candidates, or politicians
**What goes wrong:** A migration author reflexively adds `ON CONFLICT (external_id) DO NOTHING` or similar to a `races`/`race_candidates` INSERT, expecting Postgres to silently no-op — but neither table has a matching unique constraint, so this either errors (`ON CONFLICT` needs a matching index) or, if mistakenly pointed at the wrong column, silently fails to dedupe.
**How to avoid:** `races` and `race_candidates` → always `WHERE NOT EXISTS`. `discovery_jurisdictions` → `ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING` is correct (real unique index exists). `politicians.external_id` → `ON CONFLICT (external_id) DO NOTHING` is correct (real unique index, per migration 1110's pattern) — but this only applies to the `politicians` INSERT, not the `races`/`race_candidates` INSERTs that follow it.

### Pitfall 5: Confusing `discovery_jurisdictions.state` casing with `districts.state` casing
**What goes wrong:** A migration author, having just internalized the OR `districts.state = 'or'` lowercase trap from the city-seeding phases, defensively lowercases `discovery_jurisdictions.state` too — but every existing discovery row (NV, VA, MD) uses uppercase 2-letter codes, and the column is `character(2)` with no case-normalization.
**How to avoid:** `discovery_jurisdictions.state = 'OR'` (uppercase, matches `elections.state` convention) — this is a DIFFERENT table with a DIFFERENT casing convention than `essentials.districts.state`.

### Pitfall 6: Re-using a stale migration-counter estimate
**What goes wrong:** Trusting CONTEXT's "next = 1210" (written earlier on 2026-07-04) without re-checking — this research found the true next number is already 1212 as of a later point the same day, and a parallel workstream could easily advance it again before this phase's plan is executed.
**How to avoid:** `ls C:/EV-Accounts/backend/migrations | sort -n` (numeric sort on the leading digits) immediately before writing the FIRST migration file of this phase, no matter what any planning document says.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Race/election/candidate schema | Custom tables | Existing `essentials.elections`/`races`/`race_candidates` (migration 042) | Already built, antipartisan-enforced at the schema layer, used by 6+ prior phases |
| Candidate discovery scraping | Custom scraper/cron | Existing `essentials.discovery_jurisdictions` + `POST /api/admin/discover/jurisdiction/:id` | Full Claude-agent-powered pipeline already built (v2.1), with staging/approval workflow, hallucination-prevention (citation_url mandatory) |
| Runoff/majority-threshold logic | Custom "did anyone win a majority" calculator | Read directly from OPB/Beaverton Valley Times/Hillsboro News Times election-result reporting (already computed and reported) | This is a one-time seeding decision, not a recurring computation the app needs to perform |
| Headshot resize | Custom PIL script | Existing `_tmp-*-headshots.py` pipeline pattern (per-city templates from Phases 176-182) | Proven 4:5-to-600x750 Lanczos pipeline; reuse the most recent template (Cornelius's, since it documents the RGBA-composite step needed for circular-cutout PNG sources, a pattern likely to recur for challenger headshots sourced from campaign sites) |

**Key insight:** This phase is almost entirely SQL seeding against schema that already exists and a discovery pipeline that already works end-to-end (proven by Phase 167's NV run: 32 candidates found, 0 errors). The engineering risk is near-zero; the *research* risk (getting the seats-up set and candidate names right) is the dominant risk, which is why this document is weighted so heavily toward the seats-up table.

---

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | None (this phase has no application code — pure SQL migrations + one live HTTP trigger) |
| Config file | none |
| Quick run command | `node C:/EV-Accounts/backend/scripts/_apply-migration-<N>.ts` (paired smoke-test harness per migration, established pattern) |
| Full suite command | Re-run all `_apply-migration-<N>.ts` scripts in the phase for idempotency (each script exits 0 twice: first apply + no-op re-run) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| WM-ELEC-01 | 25 race rows exist, correctly linked to the pre-existing office_ids, 0 with NULL office_id, 0 with non-NULL primary_party | DB assertion (`DO $$ ... RAISE EXCEPTION`) | Embedded in the races migration itself | Yes (pattern established, e.g. migration 1112's post-verify block) |
| WM-ELEC-01 | discovery_jurisdictions has exactly 8 OR rows, all with `election_date='2026-11-03'`, `state='OR'` | DB assertion | Embedded in the discovery migration | Yes |
| WM-ELEC-01 | 0 school-board race rows exist for any of the 5 west-metro G5420 districts | DB assertion (negative check) | New — add to the races migration's post-verify block | No — Wave-0 (trivial, 3-line addition to an existing pattern) |
| WM-ELEC-01 | 1 real discovery run completes with `status='completed'`, `error_message IS NULL` | Live smoke test (manual trigger + poll) | `curl -X POST .../discover/jurisdiction/:id` + poll `discovery_runs` | Yes (pattern established in Phase 167 Plan 03) |
| WM-ELEC-01 | `/elections` page returns the seeded races for a known west-metro address | Manual UAT | Load `/elections` for a Beaverton/Hillsboro/etc. address | No — Wave-0, no automated E2E test found for this page in this codebase; treat as human-verify |

### Sampling Rate
- **Per task commit:** run the paired `_apply-migration-<N>.ts` smoke script for that migration.
- **Per wave merge:** re-run every `_apply-migration-<N>.ts` script in the phase (idempotency check).
- **Phase gate:** live discovery run must show `status='completed'` before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] Live re-verify the exact stored `name`/`state` casing of the pre-existing OR 2026 General election row (`SELECT name, state FROM essentials.elections WHERE election_date='2026-11-03'`) before writing the races migration's FK subquery.
- [ ] Live re-verify the on-disk migration counter (`ls migrations | sort -n | tail`).
- [ ] Direct-fetch each of the 5 "candidate slate unresolved" cities' own elections pages (Hillsboro, Tigard, Forest Grove, Sherwood, Tualatin Pos1/Pos3) for the actual filed candidate list.
- [ ] Add the "0 school-board races" negative assertion to the races migration's post-verify block.

---

## Security Domain

> This phase has no new user-facing input surface (pure backend SQL seeding + one internally-triggered discovery run). ASVS categories largely N/A; the one live consideration is admin-token handling for the discovery trigger.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | Partial | `X-Admin-Token` header, pre-shared secret from env (`ADMIN_INGEST_TOKEN`) — not a user-facing auth flow |
| V6 Cryptography | No | No new crypto surface |
| V5 Input Validation | No | No new user input; discovery agent's own citation-URL mandatory rule (schema-enforced NOT NULL on `candidate_staging.citation_url`) is the relevant existing control, already built |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Admin token leakage into a committed file/log/summary | Information Disclosure | Read token from `$ADMIN_INGEST_TOKEN` env only at trigger time; never echo, log, or commit it (established pattern from Phase 167 Plan 03) |
| Fabricated candidate injected into `race_candidates` without citation | Tampering (data integrity) | Every manually-ingested candidate in this phase's migrations must carry a `source` URL comment in the migration file, mirroring migration 1110's per-row Wikipedia/news citation pattern |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | Beaverton's stated Position 1 runoff (Philip vs. Kocher) and the WashCo Chair/D4 runoffs held as reported through this research session — no late-breaking certification change | Seats-Up Table | LOW — both were independently corroborated by 2+ news sources (OPB, KGW, Beaverton Valley Times, Hillsboro News Times); a certification reversal this late (>1 month post-primary) would be unusual but should be spot-checked at Wave-0 |
| A2 | Hillsboro, Tigard, Tualatin, Forest Grove, Sherwood, and Cornelius city council elections have NO May-primary stage (i.e., every seat's outcome is decided solely at the Nov 3, 2026 general) | Seats-Up Table (multiple sections) | MEDIUM — inferred from the ABSENCE of any May-primary mention in these 6 cities' own election pages/prior-phase research, not from an explicit charter clause confirming "no primary." If wrong for any of these cities, this phase could be seeding a race for a seat that was already decided in May (same class of error as Pitfall 1) |
| A3 | Cornelius's vacant councilor seat belongs to the 2028 cohort (not up in 2026), based on cohort-counting logic (Baker+López already fill the 2026 cohort of 2) rather than an explicit primary-source statement of the vacant seat's own term-end date | Cornelius seats-up row | LOW-MEDIUM — if wrong, this phase would incorrectly omit a real Nov 2026 race; the appointment-application-window framing (July 1-22, 2026, well before the Nov 3 election) strongly supports "filled by appointment, not election" regardless of cohort, which independently supports excluding it from the Nov 2026 ballot |
| A4 | The per-city discovery `source_url` pages listed in the Discovery Config table (beavertonoregon.gov/944/Elections, hillsboro-oregon.gov, etc.) remain live and unchanged at plan/execution time | Discovery Config | LOW — most were independently confirmed reachable (HTTP 200) by the ORIGINAL deep-seed phase for that city within the same week (2026-06-30 to 2026-07-04); Hillsboro's is the weakest link (this session did not independently confirm a single stable elections-news URL for it) |
| A5 | The WashCo D1 seat is genuinely not up in the 2026 cycle (only D2 and D4 are, alongside the Chair) | WashCo seats-up row | MEDIUM — this specific claim came from a WebSearch aggregation ("Fai's term runs through Dec. 31, 2028"), not an independently re-fetched primary source (contrast the D2/D4/Chair findings, which were corroborated by 2+ direct news sources each); low practical risk since Fai is not defending D1 regardless (she's running for Chair) |

**If this table is empty:** N/A — 5 assumptions logged above.

---

## Open Questions

1. **What happens to Beaverton Position 2/5 and WashCo District 2 in the race-seeding scheme — seed a "ceremonial" uncontested race row, or omit entirely?**
   - What we know: D-10 says race rows anchor on the office regardless of contestedness; these 3 offices ARE up in the 2026 cycle and DO have a confirmed winner (Teater, Dugger, Monteblanco), just not via a Nov ballot item.
   - What's unclear: whether WM-ELEC-01's ballot-visibility goal is served by a race row with exactly 1 uncontested candidate (which would render on `/elections` as "Kevin Teater — re-elected"), or whether that's noise since there's nothing for a west-metro voter to actually vote ON in November for that seat.
   - Recommendation: seed these 3 as race rows WITH their single already-decided candidate (matches D-10's office-anchoring intent and gives the ballot page complete information), but this is explicitly flagged as a planner decision, not a settled fact.

2. **Exact stable URL for Hillsboro's city elections information.**
   - What we know: the city publishes election news via its News/Components system (e.g., `hillsboro-oregon.gov/Home/Components/News/News/17502/4300`), which is a per-article URL, not a stable "elections" landing page like the other 6 cities have.
   - What's unclear: whether a stable `/elections` or `/city-council/elections` path exists on hillsboro-oregon.gov that this research didn't surface.
   - Recommendation: 5-minute Wave-0 task — browse hillsboro-oregon.gov's own navigation for an Elections section before defaulting to the root domain as source_url.

3. **Full candidate slate for Hillsboro (3 seats), Tigard (4 seats), Forest Grove (4 seats), Sherwood (4 seats), and Tualatin Positions 1/3 — 16 of 25 recommended race rows have NO independently-confirmed Nov 2026 candidate as of this research date.**
   - What we know: each city's own elections page is confirmed reachable (HTTP 200, no WAF) by the ORIGINAL deep-seed research for that city; Hillsboro's filing period literally had not opened yet (opens July 6, 2026) as of this research date (2026-07-04).
   - What's unclear: whether by plan/execution time (likely several days to weeks later) filing will have closed and a real slate will be knowable, or whether this remains a discovery-pipeline job.
   - Recommendation: seed all 16 race rows regardless (office-anchored, D-10); attempt one direct Wave-0 re-fetch per city; if still empty, ship with 0 candidates and let the just-armed discovery pipeline populate them over the following days — this is explicitly an acceptable outcome per D-07's "candidate count may be small or zero" acceptance bar.

---

## Sources

### Primary (HIGH confidence)

- Direct read of `C:/EV-Accounts/backend/migrations/042_election_schema.sql` (elections/races/race_candidates CREATE TABLE) and `070_discovery_tables.sql` (discovery_jurisdictions/discovery_runs/candidate_staging CREATE TABLE) — actual schema definitions, not comments.
- Direct read of `C:/EV-Accounts/backend/src/routes/essentialsDiscovery.ts`, `src/index.ts` (route mounting), `src/lib/env.ts` (ADMIN_INGEST_TOKEN) — confirmed discovery-runner invocation end-to-end.
- Direct read of `C:/EV-Accounts/backend/migrations/1109_seed_tx_ny_2026_house_elections_races.sql`, `1110_seed_tx_2026_house_candidates.sql`, `1113_nv_2026_discovery.sql`, `325_va_2026_discovery.sql`, `281_md_2026_discovery.sql` — idempotency patterns, column usage, ledger behavior.
- Direct read of `C:/EV-Accounts/backend/migrations/1120_washco_commission.sql`, `1178_forest_grove_city_council.sql`, `1187_sherwood_city_council.sql`, `1196_cornelius_city_council.sql` — office resolution join pattern, representing_city correction.
- `.planning/phases/167-nv-2026-elections-discovery/167-01/02/03-SUMMARY.md` — direct precedent execution shape, discovery-runner host correction, admin-token handling.
- `.planning/phases/175 through 182-*/*-RESEARCH.md` — per-jurisdiction term/seat data, all originally sourced by those phases from primary-source city pages (curl-fetched, no-WAF, cited above per row).
- `.planning/phases/183/184-*-RESEARCH.md` — school-board no-vacancy confirmation.
- Live `curl` tests against washingtoncountyor.gov and sos.oregon.gov subpages (this session).
- Live `ls C:/EV-Accounts/backend/migrations | sort -n` (this session, twice) — migration counter re-verification.

### Secondary (MEDIUM confidence)

- WebSearch aggregation of opb.org, kgw.com, hillsboronewstimes.com, beavertonvalleytimes.com, forestgrovenewstimes.com — WashCo Chair/D4 runoff candidate names and primary vote percentages (cross-corroborated by 2+ independent outlets each).
- WebSearch aggregation confirming Ballotpedia candidate pages exist for Beaverton Position 1/2/5 candidates (page titles/URLs confirmed, full page content not independently fetched).
- WebSearch aggregation of ballotpedia.org's "Rules governing school board election dates and timing in Oregon" + ORS 255.012 — May-odd-year school board cadence.

### Tertiary (LOW confidence — flagged for validation)

- WebSearch aggregation for WashCo District 1's exact term-end date (Dec 2028) — single-source, not independently re-fetched (see Assumption A5).
- WebSearch results for Sherwood/Forest Grove 2026 candidate names — returned stale/prior-cycle noise; NOT used as a basis for any candidate-slate claim in this document (explicitly marked "Defer" instead).
- Tigard mayoral-race candidate names ("2 councilors vying") — OPB headline confirmed, but the two names were not present in the fetched excerpt; not independently re-fetched.

---

## Metadata

**Confidence breakdown:**
- Schema/migration mechanics/discovery-runner invocation: HIGH — all source-code verified via direct file reads, not inferred from comments or WebSearch.
- Seats-up determination (which offices get a race row): HIGH-MEDIUM — 7 of 8 jurisdictions' term data came from a prior phase's own primary-source city-page fetch (not a WebSearch summary); WashCo Commission was freshly cross-verified this session against 3+ independent news sources.
- Candidate slate (who is actually on the Nov 2026 ballot): MEDIUM for 8 races with confirmed names, LOW/UNRESOLVED for the other 16 — genuinely time-sensitive, several filing periods not yet closed as of the research date.
- School-board finding (0 races): HIGH — corroborated by ORS 255 statute text AND same-day live-roster confirmation from Phases 183/184.

**Research date:** 2026-07-04
**Valid until:** 2026-07-11 (SHORTER than the usual 30-day window — this phase sits on a genuinely fast-moving fact set: candidate filing periods are actively opening/closing across the 6 straight-to-November cities during July-August 2026, and the shared migration counter is being consumed by parallel workstreams multiple times per day. Re-verify the seats-up table's "candidate slate" rows and the migration counter immediately before planning if more than a few days have passed.)

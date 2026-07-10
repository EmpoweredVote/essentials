# Phase 181: City of Sherwood Deep-Seed — Research

**Researched:** 2026-07-03
**Domain:** Oregon municipal deep-seed — council-manager city, Mayor (2-year term, directly elected citywide) + 6 Councilors (4-year terms, all at-large), no wards, no numbered positions
**Confidence:** HIGH (form of government, roster, geo_id correction, headshots, migration counter: all VERIFIED direct from sherwoodoregon.gov, official Washington County SEL101 candidate-filing PDFs, the City's own Dec-2024 organizational chart PDF, and live production DB queries this session). **geo_id 4167450 (ROADMAP/CONTEXT-stated) is WRONG — CORRECTED to 4167100.** This is the third of six WashCo cities in this milestone requiring a geo_id correction (after Hillsboro 4133850→4134100 and Tualatin 4175200→4174950; Tigard and Forest Grove were both correct as stated). **Headshot sourcing is the best in the entire milestone**: all 7 official portraits are directly embedded as static `<img>` tags on `sherwoodoregon.gov/government/city-council/` (no WAF, no JS/AJAX widget gate unlike Forest Grove, no bulk-portal-absence gap unlike Tigard) — 7/7 confirmed downloadable, uniform 600×600 official studio-style portraits.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Form of government & council routing — VERIFY AT PLAN TIME (directive, carried forward)**
- **D-01:** Sherwood's council structure is NOT assumed from memory. Sherwood is commonly described as council-manager with a Mayor + 6 councilors elected at-large — but the routing branch is decided by the charter/municipal code ground-truthed from sherwoodoregon.gov at plan time.
- **D-02:** Tie-breaker rule: WHO VOTES decides routing, not residency. If ward/district voters alone elect their councilors: load custom X00xx ward geofences BEFORE seeding (official GIS only; no authoritative machine-readable file = blocker to surface, not a license to hand-trace). If the whole city votes for all seats: no new geofences — model at-large on the verified city geo_id, exactly like Beaverton/Tigard/Tualatin/Forest Grove.
- **D-03:** If ward branch: one district per ward, offices attached to it. Seat identity lives on the office title, NOT on duplicate district rows.
- **D-04:** Either branch must produce no section-split and no empty LOCAL section.

**Mayor & leadership modeling — VERIFY AT PLAN TIME (directive, carried forward)**
- **D-05:** Mayor's role ground-truthed from the charter at plan time. If directly-elected citywide: the Beaverton 176/Tualatin 179/Forest Grove 180 shape — LOCAL_EXEC district (Mayor) + LOCAL at-large district (councilors), both on the city geo_id, both `state='or'`; Mayor sorts first (groupHierarchy.js). If council-member/rotating president: seat-with-title on the council, no LOCAL_EXEC.
- **D-06:** Council President / Vice Mayor = title-on-seat if one exists — no separate office row. 180 also settled title style: plain titles ('Mayor'/'Councilor', no position numbers) unless the city itself uses numbered positions.

**Roster & body name — strict ground-truth (carried forward)**
- **D-07:** Researcher pulls the seated roster + exact chamber/body name verbatim from sherwoodoregon.gov at plan time. No hardcoding names, seat count, or position naming from memory — account for recent turnover. Researcher also notes WAF status AND photo availability of sherwoodoregon.gov so the executor isn't surprised (forestgrove-or.gov had NO member photos even via real-browser fetch — perpetual ajax-loader, not WAF).

**Stance scope + headshots (carried forward, locked)**
- **D-08:** All live compass topics per official, one agent at a time, evidence-only / 100% cited / honest blank spokes / zero default values; 18–21+ depth where the record supports it; skip judicial-* topics. Stance agents author their own migration files directly (179/180 pattern — worked well, keep it). Small-city reality: 180 landed 39 stances across 7 officials — depth is evidence-bounded, never padded.
- **D-09:** Headshots from sherwoodoregon.gov first; then the D-16 standing fallback chain (Ballotpedia/Wikimedia → local-news/community-paper/campaign photos as documented last resort — but note Ballotpedia has NO individual profiles for small WashCo cities, per 180). Crop-to-4:5 then resize to 600×750 (Lanczos q90, no overlays), mirrored to Storage `politician_photos/{uuid}-headshot.jpg`; `photo_license` set at execution by actual source (`'sourced'` for press/campaign photos, per 180). Genuine gaps documented, no fabrication.

**Community banner (carried forward + 180 lesson)**
- **D-10:** Subject: operator picks the recognizable everyday street view (see D-14 for the Sherwood priority hint). Wikimedia Commons first, Unsplash fallback; NO AI-generated images; no baked-in text/graphics. Follow `docs/banner-asset-pipeline.md` (`process_banner.py` → 1700×540 @ 3.15:1 → `upload_banner.py` → `cities/sherwood.jpg`) + `CURATED_LOCAL` entry with attribution in `src/lib/buildingImages.js`.
- **D-11:** Banner asset work lives in the final surfacing plan (alongside coverage.js) — keeps the proven 5-plan deep-seed shape. `offices.representing_city='Sherwood'` is set in the structural migration.

**Surfacing (locked)**
- **D-12:** Add Sherwood to the Oregon block of `COVERAGE_STATES` in `src/lib/coverage.js`: `{ label: 'Sherwood', browseGovernmentList: ['<verified geo_id>'], browseStateAbbrev: 'OR', hasContext: true }` — city entry alphabetical among the Oregon cities. Live browse link at completion: `essentials.empowered.vote/results?browse_geo_id=<verified geo_id>&browse_mtfcc=G4110`.

**Roster edge cases (carried forward)**
- **D-13:** Non-voting / ex-officio seats are EXCLUDED from the roster (carries 179 D-14 / 180 D-17). Vacant seats: seed the office row only if the milestone precedent supports it — otherwise document the vacancy in research/summary; never seed a placeholder person. Very recent appointees count as seated officials if confirmed on the official city site.

**Sherwood-specific decisions (resolved this discussion — recommended defaults, user AFK)**
- **D-14:** Banner subject priority hint — Old Town Sherwood street-level scene (the historic Smockville-era main street / Cannery Square area), refined by the user 2026-07-03. Two winning subject classes: (1) a recognizable everyday street-level scene a resident knows, or (2) a wide multi-roofline skyline — "Dallas Skyline" / "NYC Skyline" framing with many buildings. Failure modes to reject: a zoomed-in crop of the top of a single unidentifiable building, and aerials. Browse the Wikimedia Category:Sherwood, Oregon gallery and present street-level + true-skyline candidates to the operator FIRST. As always, a clean license + crops-well-to-1700×540 beats subject preference.
- **D-15:** All three 180-REVIEW latent fixes are LOCKED into this phase's artifacts:
  - **WR-A (note-text sync):** when cloning the headshot migration's ORCHESTRATOR NOTE, keep the note text in sync with the actual gate default.
  - **WR-B (pairwise identity gate):** upgrade the structural migration's in-file identity gate from set-membership (two IN lists) to pairwise `(external_id, full_name)` assertion against the researched roster.
  - **WR-C (empty-roster guard):** the headshot script's `test_download_guard(OFFICIALS[0])` must guard `len(OFFICIALS) > 0` first.
  - The WR-01 (sys.exit(1) on any upload failure) and WR-02 (in-file identity gate) fixes from 179-REVIEW are already SHIPPED in the 180 templates — clone from 180, not 179.
- **D-16:** Pamplin Media search-index extraction is PRE-AUTHORIZED as a documented evidence/photo source tier. Sherwood's local paper (Sherwood Gazette) is Pamplin Media, and pamplinmedia.com fails TLS for ALL fetchers (curl/Playwright/WebFetch). Recover Q&A/coverage content via search-index extraction, cite the original article URL, and stay strictly evidence-only per D-08. Sites that 403 direct fetch get the same treatment. Never fabricate content the index doesn't actually show.

### Claude's Discretion
- Council office title labeling — planner picks after seeing the official roster page (city-verbatim vs plain 'Mayor'/'Councilor'; 180 used plain).
- External_id block — Wave-0 DB probe picks an unused OR range (geo_id-derived block is the natural analog; Forest Grove used -4126201..-4126207).
- Next migration number — memory says next on-disk = 1187 post-Forest Grove (confirmed against disk: max is 1186); Wave-0 confirms on-disk MAX (on-disk counter is authoritative; stance migs are audit-only and never register; DB ledger MAX is a known trap).
- Custom `X00xx` mtfcc + district_type — only if the D-02 ward branch fires; Wave-0 finds next unused code.

### Deferred Ideas (OUT OF SCOPE)
- Cornelius (182) — the last west-metro city.
- School boards (Phases 183–184; Sherwood SD 88J board is Phase 184); 2026 elections + discovery (Phase 185); milestone close (186).
- Washington County Commission (175), Beaverton (176), Hillsboro (177), Tigard (178), Tualatin (179), Forest Grove (180) — all complete.
- Sherwood appointed boards/commissions and city-manager staff — elected officials only (non-voting/ex-officio seats excluded per D-13).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WASH-07 | City of Sherwood deep-seeded — government + roster + headshots + evidence-only stances. | Fully resolved: **geo_id CORRECTED 4167450 → 4167100** (the ROADMAP/CONTEXT-stated value does not exist in `essentials.geofence_boundaries`; `4167100` is the sole G4110 row named "Sherwood city"); council-manager form confirmed via the city's own organizational chart (City Manager Craig Sheldon reports to Council; Municipal Court Judge and City Attorney connect directly to Council, not through the City Manager chain); Mayor directly elected citywide on a **2-year term** (a new pattern for this milestone — every other WashCo Mayor so far is 4-year) via a distinct "vote for one" ballot line (Beaverton/Tualatin/Forest Grove LOCAL_EXEC+LOCAL shape); 6 Councilors elected at-large citywide on 4-year staggered terms, confirmed via three independent primary sources (live city site, 2022 Washington County certified-candidate SEL101 filings, Dec-2024 org chart) — zero "Position N" or "Ward N" language found anywhere, matching Tigard/Forest Grove's plain-title convention; 7-member current roster fully named with term-expiry dates cross-verified across all three sources with zero discrepancy; Council President Kim Young confirmed via the org chart (title-on-seat, no separate office row); headshot sourcing is the BEST in the milestone — all 7 official 600×600 portraits are static `<img>` tags on the live council page, directly downloadable via plain curl (HTTP 200, no WAF, no JS-rendering gate); City Attorney/Municipal Court Judge confirmed council-appointed via the org chart's direct-to-Council connector lines (Sherwood-specific primary-source confirmation, stronger than Forest Grove's cross-city-pattern assumption); pamplinmedia.com TLS-handshake failure re-confirmed live this session (D-16 applies); a strong, recent (Oct 2025), unanimous-council stance-evidence anchor found (three Charter-amendment resolutions on state housing-law local control, later ratified by an 80-90%+ margin in a Jan 2026 special election) — usable across most/all of the 7 officials for growth-and-development/housing-adjacent topics with a polarity nuance flagged for the stance-research agents; two strong Wikimedia Commons street-level banner candidates found and visually inspected (license/dimensions/composition all confirmed), matching D-14's exact "Old Town" street-level hint. |
</phase_requirements>

---

## Summary

Sherwood operates under a **council-manager form of government** with a City Council of **7 members: a Mayor plus 6 Councilors, ALL elected at-large citywide** — no wards, no numbered positions, no residency-based seat differentiation. [VERIFIED: direct `curl` fetch of `https://www.sherwoodoregon.gov/government/city-council/`, HTTP 200, no WAF — primary-source city text] The city's own council page states: *"Sherwood's City Council is made up of a Mayor and six Councilor positions, including that of Council President... The Council members are elected for four-year terms of office through a general election, except when a position is vacated before term completion and filled by special appointment of the Council. The Mayor is elected to a two-year term."* [VERIFIED: Washington County Elections Division SEL101 candidate-filing PDFs, 2022 cycle] Independently, every 2022 SEL101 filing form for a Sherwood Councilor candidate lists **"District, Position or County"** as either blank or simply **"City of Sherwood"** / **"Washington County"** — never a ward or position number — and the Mayor's own filing form lists **"City of Sherwood"** in that field for a **"vote for one"** citywide ballot line, while the 4 Councilor candidates that year ran on a single **"vote for four"** at-large block. This is the third city in the milestone (after Tigard and Forest Grove) with zero ward/position differentiation of any kind, and the plain `'Mayor'`/`'Councilor'` title convention applies exactly as it did there.

**One genuinely new structural wrinkle for this milestone: the Mayor's term is 2 years, not 4.** Every other WashCo Mayor seeded so far (Beaverton, Hillsboro, Tigard, Tualatin, Forest Grove) serves a 4-year term. Sherwood's Mayor is elected separately from the Council (a distinct "vote for one" ballot line) every 2 years. **This does not change the structural shape** — model exactly as the Beaverton/Tualatin/Forest Grove LOCAL_EXEC (Mayor) + LOCAL (at-large Council) split — but the migration's comment/documentation should record the real 2-year cadence rather than assuming 4-year uniformity.

**geo_id CORRECTED: 4167450 (ROADMAP/CONTEXT-stated) → 4167100 (verified correct).** [VERIFIED: live query against production `essentials.geofence_boundaries`, 2026-07-03] `SELECT geo_id, mtfcc, state, name, source FROM essentials.geofence_boundaries WHERE geo_id='4167450'` returns **0 rows** — this geo_id does not exist in the database at all. `SELECT ... WHERE name ILIKE '%sherwood%'` returns exactly one G4110 row: **`4167100`, mtfcc `G4110`, state `41`, name `Sherwood city`, source `census_tiger_2024`** (a companion `4111290`/G5420/"Sherwood School District 88J" row also exists, loaded by Phase 174, relevant to the future Phase 184, not a collision risk here). This is the **third** of six WashCo cities in this milestone requiring a geo_id correction (Hillsboro 4133850→4134100, Tualatin 4175200→4174950, now Sherwood 4167450→4167100); Tigard and Forest Grove were both correct as ROADMAP-stated. **All downstream ext_id ranges, district rows, and coverage.js entries in this research use the CORRECTED value 4167100 — do not use 4167450 anywhere.**

**Mayor Tim Rosener** is directly elected citywide (not a rotating council-member title): current term expires January 2027 (2-year term, so began January 2025 following the Nov 2024 election). Model as the **Beaverton/Tualatin/Forest Grove shape**: one LOCAL_EXEC district (Mayor) + one shared LOCAL district (all 6 Councilors), both on geo_id `4167100`, both `state='or'`.

**Zero currently-appointed or vacant seats.** All 7 seats are presently held by election, confirmed identically across three independent sources spanning Dec 2024 (org chart) through the live 2026-07-03 city page (no turnover in the interim).

**Council President Kim Young** holds the title — confirmed via both the live city council page and the city's own Dec-2024 organizational chart, which lists her directly under the Mayor as "Kim Young, Council President." This is the same title-on-seat treatment as every prior WashCo city's Council President/Council President-equivalent seat (Hillsboro's Rob Harris, Tigard's Maureen Wolf, Tualatin's Valerie Pratt, Forest Grove's Mariana Valenzuela) — no separate office row.

**7-member roster** (all confirmed live from sherwoodoregon.gov's council page, independently cross-checked against a 2022 Washington County certified-candidate letter and the city's own Dec-2024 organizational chart — zero discrepancies found across all three sources):

| Seat | Name | Term Length | Term Expires | Notes |
|------|------|-------------|---------------|-------|
| Mayor | Tim Rosener | 2 years | January 2027 | Directly elected citywide, separate "vote for one" ballot line. Up for election Nov 2026. |
| Councilor (Council President) | Kim Young | 4 years | January 2029 | Elected Nov 2024. Not up in 2026. |
| Councilor | Renee Brouse | 4 years | January 2029 | Elected Nov 2024. Not up in 2026. |
| Councilor | Taylor Giles | 4 years | January 2027 | Up for election Nov 2026. |
| Councilor | Keith Mays | 4 years | January 2027 | Former Mayor of Sherwood (2018-2022 and 2005-2012) and former Council President (2001-2004) — now serving as a plain Councilor. Up for election Nov 2026. |
| Councilor | Doug Scott | 4 years | January 2027 | Up for election Nov 2026. |
| Councilor | Dan Standke | 4 years | January 2029 | Elected/re-elected Nov 2024 (ran for "another term" per contemporary local-news coverage — see Open Question 1 re: the exact 2022→2024 seat-continuity mechanics). Not up in 2026. |

**Total officials to seed: 7 (Mayor + 6 Councilors). `official_count` on chamber = 7. Zero vacancies, zero currently-appointed seats.** The 2026 election-cycle candidate list independently confirms the Jan-2027 cohort is exactly {Mayor, Giles, Mays, Scott} — matching this table precisely.

**sherwoodoregon.gov has NO WAF block, and — uniquely in this milestone — all 7 headshots are directly embedded static `<img>` tags, fully retrievable via plain `curl`.** [VERIFIED: 7/7 direct downloads this session, HTTP 200 each, 600×600 JPEG, 32KB-69KB each] URLs follow a uniform `wp-content/uploads/2025/02/<firstname>-<lastname>-600.jpg` pattern. This is a materially better sourcing situation than Forest Grove (JS/AJAX-gated, 0 curl-retrievable) or Tigard (no bulk portal, per-official manual search required) — Sherwood is the cleanest headshot outcome of the milestone so far.

**City Attorney and Municipal Court Judge are council-appointed, confirmed Sherwood-specific** (not an inferred cross-city pattern, unlike Forest Grove's A7). [VERIFIED: City of Sherwood Organizational Chart, dated 12.06.2024, PDF fetched directly] The chart shows "Municipal Court Judge: Jack Morris" and "City Attorney: Sebastian Tapia (Interim)" both connecting directly to the "Mayor and City Council" box — a structurally distinct reporting line from "City Manager: Craig Sheldon" and the departments beneath him. Skip all 8 judicial-* compass topics for all 7 officials.

**Primary recommendation:** Seed as pure at-large with plain titles — the exact Tigard/Forest Grove structural shape (no ward/position differentiation) combined with the Beaverton/Tualatin/Forest Grove Mayor+Council district split — single 'City Council' chamber (`official_count=7`). Government name `'City of Sherwood, Oregon, US'`. geo_id `4167100` (CORRECTED). Ext_id block **-4167101..-4167107** (7 slots, confirmed unused; derived from the CORRECTED geo_id, not the stated 4167450). Next structural migration **1187** (on-disk MAX confirmed 1186 this session — Forest Grove's `1186_schimmel_stances.sql` — matching the milestone-memory expectation exactly). Community banner: two strong, visually-inspected Wikimedia Commons candidates — "Railroad St - panoramio.jpg" (primary — a vibrant Old Town commercial street scene, exact match to D-14's hint) and "Downtown - panoramio - dreid1987.jpg" (alternate — a quieter historic-cottage street scene) — both CC BY 3.0, both requiring a significant vertical crop from their native 4:3 ratio to the pipeline's 3.15:1 target (a compositional judgment call for the executor, same class of issue as Forest Grove's Old College Hall crop).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| City government row | Database / Storage | — | Structural migration inserts into essentials.governments |
| Chamber row | Database / Storage | — | Single 'City Council' chamber, official_count=7 |
| Mayor office (LOCAL_EXEC) | Database / Storage | — | Directly-elected citywide, 2-year term, links to LOCAL_EXEC district |
| Council offices (LOCAL, plain titles) | Database / Storage | — | All 6 share one LOCAL district; no ward/position differentiation |
| Official headshots (600×750) | Database / Storage | CDN | politician_images rows + Supabase Storage; sourced directly from sherwoodoregon.gov, no fallback chain needed |
| Compass stances | Database / Storage | — | inform.politician_answers rows, evidence-only; strong Oct-2025 unanimous-vote anchor available |
| Community banner | Database / Storage | CDN | Supabase Storage `cities/sherwood.jpg`; wired via `buildingImages.js` CURATED_LOCAL |
| Frontend surfacing | Frontend Server (SSR) | CDN | coverage.js Oregon block, purple hasContext chip |
| Address routing | API / Backend | — | PIP query against G4110 geofence (geo_id 4167100 — CORRECTED), no ward layer |

---

## geo_id Verification — CORRECTED (4167450 → 4167100)

[VERIFIED: live query against production `essentials.geofence_boundaries`, 2026-07-03]

```sql
SELECT geo_id, mtfcc, state, name, source FROM essentials.geofence_boundaries WHERE geo_id='4167450';
-- (0 rows) — this geo_id does not exist

SELECT geo_id, mtfcc, state, name, source FROM essentials.geofence_boundaries WHERE name ILIKE '%sherwood%';
--  geo_id  | mtfcc | state |             name             |            source
-- ---------+-------+-------+-------------------------------+------------------------------
--  4111290 | G5420 | 41    | Sherwood School District 88J | tiger_unsd_or_2024_westmetro
--  4167100 | G4110 | 41    | Sherwood city                | census_tiger_2024
```

**CORRECTION REQUIRED.** The ROADMAP/CONTEXT-stated `4167450` is not a valid geo_id in this database at all (0 rows on direct lookup) — a materially different failure mode from Hillsboro/Tualatin, where the stated value existed but pointed at the wrong/superseded row. **The correct, sole, G4110 row for the City of Sherwood is `4167100`.** The companion `4111290`/G5420/"Sherwood School District 88J" row (loaded by Phase 174) is a distinct, correct geofence for the future Phase 184 (WSCH-05) — not a collision risk here.

```sql
SELECT COUNT(*) FROM essentials.districts WHERE geo_id='4167100';                                          -- 0 (greenfield)
SELECT id, name, geo_id FROM essentials.governments WHERE geo_id='4167100' OR name ILIKE '%sherwood%';     -- 0 rows (greenfield)
SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -4167110 AND -4167095; -- 0 rows (ext_id block clean)
SELECT external_id, full_name FROM essentials.politicians
  WHERE full_name ILIKE ANY(ARRAY['%Rosener%','%Kim Young%','%Renee Brouse%','%Taylor Giles%',
                                    '%Keith Mays%','%Doug Scott%','%Dan Standke%','%Daniel Standke%']);   -- 0 rows (no stale/duplicate names anywhere in DB)
```

**This phase IS greenfield** for Sherwood's government/chamber/offices — confirmed no pre-existing rows by geo_id, by name search, by ext_id-block collision, AND by a name-based scan across the entire `essentials.politicians` table for all 7 officials (no legacy partial-seed anywhere). **Wave-0 must re-run this exact geofence-existence probe as the first step regardless** — standing lesson re-confirmed a third time this milestone (never trust the stated value without a direct check, even after two prior corrections might suggest a false sense of "we already caught the pattern").

---

## Form of Government — RESOLVED (three independent primary sources, no WAF)

**DETERMINATION: PURE AT-LARGE, PLAIN TITLES. NO WARDS, NO NUMBERED POSITIONS. DIRECTLY-ELECTED MAYOR ON A 2-YEAR TERM (new pattern this milestone).**

[VERIFIED: `curl https://www.sherwoodoregon.gov/government/city-council/` — HTTP 200, no WAF, primary-source city text]

> "Sherwood's City Council is made up of a Mayor and six Councilor positions, including that of Council President. The Mayor presides over Council meetings and, in the Mayor's absence, the Council President may substitute in the performance of mayoral duties. The Council members are elected for four-year terms of office through a general election, except when a position is vacated before term completion and filled by special appointment of the Council. The Mayor is elected to a two-year term. The Council is governed by Sherwood City Charter and adopted Council Rules."

[VERIFIED: Washington County Elections Division SEL101 candidate-filing forms, 2022 general election cycle, fetched as PDF and read directly] Every "City Councilor" filer's "District, Position or County" field is either blank or reads "Washington County"/"City of Sherwood" — **never a ward or position number**. The Mayor's own SEL101 form lists **"City of Sherwood"** as the district/position field for a **"Mayor (2 Year Term) (Vote for one)"** ballot line, distinct from the **"City Councilor (4 Year Term) (Vote for four)"** block-vote line that the 4 Councilor candidates that cycle all ran on together. This is direct documentary evidence of at-large, whole-city voting for every seat — no residency subdistrict of any kind.

[VERIFIED: City of Sherwood Organizational Chart, dated 12.06.2024, fetched as PDF] Confirms council-manager form: "City Manager: Craig Sheldon" sits below "Mayor and City Council" and above all operational departments (Police, Public Works, Community Development, Community Services, Citywide Administration and Support) — the classic council-manager structure, identical in shape to every other OR council-manager city in this milestone.

**Routing conclusion:** every seat — Mayor and all 6 Councilor seats — is voted on by the entire city. There is no ward-residency requirement of any kind. **No custom X00xx geofences of any kind are appropriate here.** Model exactly as **Beaverton (176) / Tualatin (179) / Forest Grove (180)** for the district split (LOCAL_EXEC + LOCAL), but use **Tigard (178)/Forest Grove (180)'s plain title convention** (`'Mayor'` / `'Councilor'`, no numbered positions, no ward suffixes) — Sherwood's own text and its candidates' own SEL101 filings never use "Position N" or "Ward N" language anywhere found in this session.

**City Attorney / Municipal Court Judge — CONFIRMED council-appointed, Sherwood-specific (stronger evidence than Forest Grove's cross-city-pattern assumption).** [VERIFIED: City of Sherwood Organizational Chart, 12.06.2024] Both "Municipal Court Judge: Jack Morris" and "City Attorney: Sebastian Tapia (Interim)" connect via a direct line to the "Mayor and City Council" box — not through the City Manager's operational chain. [CITED: WebSearch — general municipal-judge appointment norms] independently corroborates the pattern. **Skip all 8 judicial-* topics for all 7 officials.**

**Youth Advisory Board — confirmed a standalone advisory board, NOT a Council dais seat.** [VERIFIED: sherwoodoregon.gov site navigation, direct curl fetch] The city's own "Boards and Committees" list (Budget Committee, Cultural Arts Commission, Library Advisory Board, Parks and Recreation Advisory Board, Planning Commission, Police Advisory Board, Senior Advisory Board, Traffic Safety Board, Youth Advisory Board) is entirely separate from the 7-member City Council roster page. **D-13 finding: there is no non-voting seat on the Sherwood council dais to exclude — the roster is cleanly 7 members, same finding class as Forest Grove's MYAC.**

---

## Live Roster — Verified 2026-07-03, cross-checked against 2022 SEL101 filings and the Dec-2024 org chart

**Official body name:** `Sherwood City Council` (formal); chamber name `City Council` follows the milestone convention. Government name: `City of Sherwood, Oregon, US`.

[VERIFIED: direct `curl` fetch of `https://www.sherwoodoregon.gov/government/city-council/`, HTTP 200, full bio/term text extracted for all 7 members via stripped-HTML text extraction]

| Seat | Name | Term Length | Term Expires | Notes |
|------|------|-------------|---------------|-------|
| Mayor | Tim Rosener | 2 years | January 2027 | Software engineer/business consultant background; Air Force veteran. Directly elected citywide. Up for election Nov 3, 2026. |
| Councilor (Council President) | Kim Young | 4 years | January 2029 | Elected Nov 2024. Not up in 2026. |
| Councilor | Renee Brouse | 4 years | January 2029 | CEO, Sherwood Chamber of Commerce. Elected Nov 2024. Not up in 2026. |
| Councilor | Taylor Giles | 4 years | January 2027 | Product-management executive; co-founded Voices for the Performing Arts. Up for election Nov 3, 2026. |
| Councilor | Keith Mays | 4 years | January 2027 | **Former Mayor of Sherwood 2018-2022 AND 2005-2012; former Council President 2001-2004** — now seated as a plain Councilor, NOT Mayor or Council President. Up for election Nov 3, 2026. |
| Councilor | Doug Scott | 4 years | January 2027 | Software Product Director. Up for election Nov 3, 2026. |
| Councilor | Dan Standke | 4 years | January 2029 | US Navy veteran; cabinet maker/small-business owner. Elected/re-elected Nov 2024 ("seeks another term" per contemporary local-news headline). Not up in 2026. |

**Total officials to seed: 7 (Mayor + 6 Councilors). `official_count` on chamber = 7. Zero vacancies, zero currently-appointed seats.**

**Independent cross-check #1 (2022 Washington County certified-candidate letter, dated Sept 7, 2022):** [VERIFIED: PDF fetched directly from washingtoncountyor.gov] Lists the outgoing council (as of Sept 2022) as "Mayor: Keith Mays; Council President: Tim Rosener; Councilors: Renee Brouse, Taylor Giles, Doug Scott, Kim Young" — this is a **PRIOR** council configuration (Mays was Mayor and Rosener was Council President in 2022, exactly swapped from their CURRENT 2026 roles) — useful only as confirmation that Mays/Rosener/Brouse/Giles/Scott/Young have all been continuously part of Sherwood city government since at least 2022, not as a source for current titles. The same letter certifies the Nov 8, 2022 ballot: "Mayor (2 Year Term, Vote for one): Tim Rosener" and "City Councilor (4 Year Term, Vote for four): Dan Standke, Keith Mays, Taylor Giles, Doug Scott" — confirming Rosener's move from Council President to Mayor began with the Nov 2022 election, and confirming the at-large "vote for four" block-election mechanic.

**Independent cross-check #2 (City of Sherwood Organizational Chart, dated 12.06.2024):** [VERIFIED: PDF fetched directly] Lists "Mayor and City Council: Tim Rosener (Mayor), Kim Young (Council President), Renee Brouse, Taylor Giles, Keith Mays, Doug Scott, Dan Standke" — an **EXACT MATCH** to the live 2026-07-03 roster, 19 months apart, confirming zero council turnover in that window and independently confirming Rosener=Mayor / Young=Council President as of Dec 2024 (consistent with the current live page).

**Sources:**
- [VERIFIED: `https://www.sherwoodoregon.gov/government/city-council/`, direct curl, HTTP 200] — full bio text and term-expiry dates for all 7 current members.
- [VERIFIED: Washington County SEL101 certified-candidate PDF, Sept 7 2022, fetched directly] — 2022 election-cycle roster snapshot, at-large ballot-line confirmation, individual candidate SEL101 forms for Rosener/Standke/Mays/Giles/Scott.
- [VERIFIED: City of Sherwood Organizational Chart PDF, 12.06.2024, fetched directly] — independent Dec-2024 roster snapshot (exact match to live 2026 roster), council-manager reporting-line confirmation, City Attorney/Municipal Court Judge appointment-line confirmation.
- [CITED: WebSearch aggregation of `valleytimes.news`/`beavertonvalleytimes.com`, "Dan Standke seeks another term on Sherwood City Council," Sept 2024] — confirms Standke's Nov 2024 re-election and general campaign themes.

---

## Web Presence / WAF Status — BEST HEADSHOT SOURCING IN THE MILESTONE

**sherwoodoregon.gov has NO WAF block — confirmed via direct curl, both with and without a Chrome UA.**

```
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" https://www.sherwoodoregon.gov/
HTTP 200
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" https://www.sherwoodoregon.gov/government/city-council/
HTTP 200
```

**Unlike Forest Grove (JS/AJAX-gated photo widget) or Tigard (no bulk portal — per-official manual local-news search required), Sherwood's council page embeds all 7 headshots as plain static `<img>` tags directly retrievable via `curl`.** [VERIFIED: 7/7 direct downloads this session]

| Purpose | Live URL | Status |
|---------|----------|--------|
| Council roster + bios + term dates | `https://www.sherwoodoregon.gov/government/city-council/` | HTTP 200, no WAF — text AND headshots both directly recoverable |
| Elections (2026 candidate list, eligibility rules) | `https://www.sherwoodoregon.gov/elections` (redirects, HTTP 301→200) | HTTP 200 |
| Org chart PDF (roster + reporting-line cross-check) | `https://www.sherwoodoregon.gov/wp-content/uploads/2025/07/Organizational-chart-12.6.24.pdf` | HTTP 200, directly readable PDF |
| City Charter (JS-rendered SPA, not fetchable via curl) | `https://library.municode.com/or/sherwood/codes/code_of_ordinances?nodeId=SHCH` | HTTP 200 but Angular SPA shell — NOT usable via plain curl; not relied upon for any load-bearing claim in this research |
| Legacy site (DNS does not resolve — do NOT use) | `https://legacywebsite.sherwoodoregon.gov/citycouncil/page/council-members-0` | **`getaddrinfo ENOTFOUND` — dead subdomain, remove from any future citation list** |
| Local news (Pamplin Media network) | `https://valleytimes.news/`, `https://beavertonvalleytimes.com/` | Both directly WebFetch-able (unlike the root `pamplinmedia.com` domain) |
| Local news (Pamplin Media root domain — TLS FAILURE) | `https://pamplinmedia.com/...` | **TLS handshake failure for ALL fetchers, re-confirmed live this session via raw `curl -v`** — D-16 search-index-extraction fallback applies |

**Practical consequence for Wave-0/execution:** this is the cleanest sourcing situation of the milestone — no D-16 fallback chain is needed for headshots at all. Stance-evidence sourcing should lean on the live city site's Agenda Center/meeting-packet PDFs (directly fetchable, per the org-chart PDF precedent) plus `valleytimes.news`/`beavertonvalleytimes.com` (both directly WebFetch-able), with `pamplinmedia.com`'s Sherwood Gazette content recovered via search-index extraction only when a direct fetch fails.

---

## Headshot Sources — 7/7 CONFIRMED, NO FALLBACK CHAIN NEEDED

[VERIFIED: 7 direct `curl` downloads this session, all HTTP 200, all confirmed 600×600 JPEG via binary header inspection]

| Official | Source URL | Dimensions | File Size | License |
|----------|-----------|-----------|-----------|---------|
| Tim Rosener (Mayor) | `sherwoodoregon.gov/wp-content/uploads/2025/02/tim-rosener-600.jpg` | 600×600 | 46,946 bytes | `press_use` (official city portrait) |
| Kim Young (Council President) | `sherwoodoregon.gov/wp-content/uploads/2025/02/kim-young-600.jpg` | 600×600 | 50,631 bytes | `press_use` |
| Renee Brouse | `sherwoodoregon.gov/wp-content/uploads/2025/02/renee-brouse-600.jpg` | 600×600 | 68,921 bytes | `press_use` |
| Taylor Giles | `sherwoodoregon.gov/wp-content/uploads/2025/02/taylor-giles-600.jpg` | 600×600 | 47,309 bytes | `press_use` |
| Keith Mays | `sherwoodoregon.gov/wp-content/uploads/2025/02/keith-mays-600.jpg` | 600×600 | 47,192 bytes | `press_use` |
| Doug Scott | `sherwoodoregon.gov/wp-content/uploads/2025/02/doug-scott-600.jpg` | 600×600 | 31,978 bytes | `press_use` |
| Dan Standke | `sherwoodoregon.gov/wp-content/uploads/2025/02/daniel-standke-600.jpg` | 600×600 | 41,562 bytes | `press_use` |

**A genuinely new pipeline nuance: all 7 source images are SQUARE (1:1), not the usual wider/taller mixed-ratio sources seen in prior phases.** The pipeline's 4:5 target (600×750) is TALLER than 1:1, so cropping a square image to 4:5 means **cropping the WIDTH down** (600→480px, centered on the face) rather than the more common "crop height off a wide photo" pattern — then upscaling the resulting 480×600 crop to the final 600×750 (a 25% upscale in both dimensions). This is well within the project's established acceptable-upscale precedent (e.g., Pasadena's Masuda/Jones sources were far smaller and still used). **No genuine sourcing gap exists for this phase — recommend the executor build the headshot script with these 7 URLs directly, skip the D-16 fallback chain entirely, and verify the standard crop-first-then-resize order still applies correctly to a square-source input.**

**Photo license:** `press_use` for all 7 (uniform official-site studio-style portraits, uploaded via the CMS's own media library — same convention as every other WashCo city's official-site-sourced headshots).

---

## Community Banner

Follow `docs/banner-asset-pipeline.md` Stages 1–8, matching the Beaverton/Hillsboro/Tigard/Tualatin/Forest Grove precedent in `src/lib/buildingImages.js`.

**Wikimedia Commons Category:Sherwood, Oregon** was browsed in full (36 file members). Every candidate was checked against D-14's two winning classes (recognizable street-level scene, or true wide multi-roofline skyline) and its two rejection classes (single-building close-up, aerial).

**Primary candidate — matches D-14's "Old Town" street-level hint exactly:** [VERIFIED: Wikimedia Commons API `imageinfo` query + direct visual inspection this session] `File:Railroad St - panoramio.jpg` — **3264×2448** (4:3, ≈1.33:1), **CC BY 3.0**, photographer "dreid1987" (a Panoramio-era username, no fuller name available — same attribution-name situation as several prior WashCo Panoramio-sourced images). Visually confirmed: a vibrant, recognizable Old Town/downtown commercial street — multiple two-and-three-story storefronts (including a distinctive turreted corner building), a marked pedestrian crosswalk, hanging flower baskets on lamp posts, parked cars, an "OPEN" sign — exactly the "recognizable everyday scene a resident knows" class D-14 calls for. **No people's faces are identifiable at this resolution/distance** (cars and general street activity only), consistent with the project's no-identifiable-bystanders convention for city banners.

**Alternate candidate — a quieter historic-cottage street scene, also street-level:** [VERIFIED: Wikimedia Commons API + direct visual inspection] `File:Downtown - panoramio - dreid1987.jpg` — **3264×2448**, **CC BY 3.0**, same photographer. Visually confirmed: a residential/heritage-building street with converted-cottage small businesses (a "Mosaic Arts Loft" sign visible), a white picket fence, mature trees, no cars or people prominently visible. A gentler, more historic-character alternate to the busier Railroad St scene.

**Candidates examined and REJECTED (documented per D-14's failure-mode guidance):**

| File | Reason for rejection |
|------|----------------------|
| `Sherwood DJIMini 1.jpg` / `Sherwood DJIMini 2.jpg` (4000×2250, drone-shot) | Aerial — explicit D-14 rejection class |
| `Library - panoramio - dreid1987.jpg` (3264×2448, CC BY 3.0) | Visually confirmed a single-building close-up (the Sherwood Library entrance) — explicit D-14 rejection class, not a street/skyline scene |
| `Looking down Sunset Blvd - panoramio.jpg` (3264×2448, CC BY 3.0) | Visually confirmed a generic suburban residential hill-street overlook with a distant "...ESTWOOD HEIGHTS" subdivision sign — not a recognizable civic/downtown scene, fails the "resident recognizes it" bar |
| `Old mill - panoramio.jpg` (3264×2448, CC BY 3.0) | Visually confirmed an empty harvested field with a distant, barely-visible industrial structure — despite the filename, no identifiable "old mill" building is actually in frame; not usable |
| `DSCN6746 sherwoodcoffeecompany e.jpg` (565×373, CC BY-SA 3.0) | Resolution far below any usable threshold (565×373); also a single-storefront close-up |

**Compositional crop challenge (same class as Forest Grove's Old College Hall issue):** both surviving candidates are native 4:3 (≈1.33:1), needing a substantial vertical crop to the pipeline's 3.15:1 target — at 3264px width, the target height is ≈1037px (down from the native 2448px, roughly a 58% vertical crop). For "Railroad St," the street/storefronts occupy the lower-middle two-thirds of the frame with sky in the upper third — a `--vertical-anchor` in the 0.4-0.55 range likely preserves the storefronts and crosswalk while trimming sky and a little foreground pavement, but **this is an untested compositional judgment call for the executor to verify by viewing the actual crop**, same as every prior WashCo banner decision in this milestone.

**Recommendation:** Try "Railroad St - panoramio.jpg" first (busier, more recognizably "downtown," exact match to D-14's top-priority hint). If the crop trims too much of the storefronts or crosswalk context, fall back to "Downtown - panoramio - dreid1987.jpg" (quieter composition, buildings sit lower in the frame, may crop more forgivingly).

- **Storage path:** `cities/sherwood.jpg` (Stage 5 — standalone-city scheme, matching `beaverton`/`hillsboro`/`tigard`/`tualatin`/`forest-grove`).
- **Wiring:** Add `'sherwood': '...supabase.co/.../politician_photos/cities/sherwood.jpg'` to `CURATED_LOCAL` in `src/lib/buildingImages.js`. **Sherwood is a single-word city name — no space-vs-hyphen trap like Forest Grove's two-word key.** The lowercase key `'sherwood'` will correctly substring-match `representing_city.toLowerCase()` = `'sherwood'` in `getBuildingImages()`'s `city.includes(key)` loop, same as every single-word city so far in the milestone.
- **Attribution comment:** e.g. `//   sherwood - Railroad St, Sherwood, Oregon | dreid1987 | CC BY 3.0` per the existing convention.
- **No AI-generated images** (per `docs/banner-asset-pipeline.md`).

**Verify live per Stage 8:**
```
https://essentials.empowered.vote/results?browse_geo_id=4167100&browse_mtfcc=G4110
```

---

## Migration / Schema Technical Reference

### Next Migration Number

[VERIFIED: `ls C:/EV-Accounts/backend/migrations | sort -t_ -k1 -n | tail -1`, 2026-07-03] On-disk MAX is **1186** (`1186_schimmel_stances.sql` — the last of Forest Grove's stance migrations). **Next available: 1187** — matches the milestone-memory expectation exactly.

[VERIFIED: `SELECT MAX(version::bigint) FROM supabase_migrations.schema_migrations WHERE version ~ '^[0-9]{1,6}$'` = **1178** — Forest Grove's structural migration, the only registered migration since Tualatin's 1169.] **Do not use the ledger MAX (1178) as the next number — the true on-disk MAX is 1186.** Standing lesson, re-confirmed a sixth consecutive time this milestone.

**Migration split for this phase (following the Tigard/Forest Grove shape):**
- `1187_sherwood_city_council.sql` — structural (registered in schema_migrations); government + chamber + 2 districts (LOCAL_EXEC + LOCAL) + 7 offices, `representing_city='Sherwood'` set INLINE (no follow-up backfill migration).
- `1188_sherwood_headshots.sql` — audit-only (NOT registered); expect a full 7/7 outcome given the confirmed direct-download sourcing.
- `1189_rosener_stances.sql` through `1195_standke_stances.sql` (or similar per-official naming) — 7 stance migrations, audit-only (one per official, NOT registered).

Total: 1 structural + 1 headshots + 7 stance = 9 migrations consumed (1187–1195). **Re-verify the exact starting number at Wave-0 regardless.**

### Ext_id Block

**Recommended range: -4167101 to -4167107** (7 slots: Mayor + 6 Councilors), derived from the **CORRECTED** geo_id `4167100` — NOT from the stated-but-nonexistent `4167450`.

[VERIFIED: `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4167110 AND -4167095` — 0 rows. Range is clean.]

**Suggested assignment (planner's discretion to reorder):**
| Official | ext_id |
|----------|--------|
| Mayor Tim Rosener | -4167101 |
| Councilor Kim Young (Council President) | -4167102 |
| Councilor Renee Brouse | -4167103 |
| Councilor Taylor Giles | -4167104 |
| Councilor Keith Mays | -4167105 |
| Councilor Doug Scott | -4167106 |
| Councilor Dan Standke | -4167107 |

Wave-0 must re-run the range query to reconfirm it is still clean at execution time.

### Schema Shapes (Tigard mig 1159 / Forest Grove mig 1178 are the closest title-convention analogs — plain titles, no wards/positions, no current appointments; Beaverton/Tualatin/Forest Grove is the closest district-split analog — directly-elected Mayor + shared at-large Council district)

```sql
-- governments: slug GENERATED ALWAYS — NEVER INSERT slug; no unique constraint on geo_id
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Sherwood, Oregon, US',
       'LOCAL', 'OR', 'Sherwood', '4167100'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City of Sherwood, Oregon, US'
);

-- chambers: slug GENERATED ALWAYS — never include in INSERT column list
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'City Council', 'Sherwood City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Sherwood, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                          WHERE name = 'City of Sherwood, Oregon, US')
);

-- districts: state='or' LOWERCASE for LOCAL/LOCAL_EXEC; no name_formal column; government_id NULL
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4167100', 'Sherwood (Mayor, Citywide, 2-Year Term)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id='4167100' AND district_type='LOCAL_EXEC' AND state='or'
);

INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4167100', 'Sherwood (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id='4167100' AND district_type='LOCAL' AND state='or'
);

-- offices: guard on (district_id, politician_id) — NOT EXISTS; representing_city inline
-- representing_state = 'OR' (uppercase); representing_city = 'Sherwood'
-- title convention (Tigard/Forest Grove precedent — plain titles, no positions/wards): 'Mayor' for the LOCAL_EXEC seat,
-- 'Councilor' for each of the 6 LOCAL seats
```

**politician_images schema:** `id, politician_id, url, type, photo_license` — NO `photo_origin_url` column (confirmed absent in every prior-phase research, unchanged).

**Stance schema:** `inform.politician_answers` ON CONFLICT `(politician_id, topic_id)`; topic_id resolved LIVE via `JOIN inform.compass_topics WHERE topic_key='...' AND is_live=true`; value integer 1-5 (chairs model). [VERIFIED: 44 live topics, 8 judicial-*, re-confirmed live in this session, unchanged from Hillsboro/Tigard/Tualatin/Forest Grove.]

### Migration Template Fixes to Carry Forward (D-15 — locked, from 180-REVIEW.md, applied on top of the already-shipped 179-REVIEW WR-01/WR-02)

**WR-A (note-text sync):** when cloning the headshot migration's ORCHESTRATOR NOTE from `1179_forest_grove_headshots.sql`, verify the note text describing the identity-gate default still matches whatever the gate's actual code does after any edits made during this phase's execution — do not let the two drift, as happened in 180's 1179.

**WR-B (pairwise identity gate):** upgrade the structural migration's in-file identity gate from the Tigard/Forest Grove set-membership pattern (two separate `IN (...)` lists for external_id and full_name, checked independently) to a **pairwise `(external_id, full_name)` assertion** — i.e., assert each specific external_id maps to its specific expected name, not just that the two sets independently contain the right elements (which would pass even if two officials' names were transposed onto each other's external_ids). Example:
```sql
DO $$
DECLARE v_pair_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_pair_count
  FROM essentials.politicians
  WHERE (external_id, full_name) IN (
    (-4167101, 'Tim Rosener'), (-4167102, 'Kim Young'), (-4167103, 'Renee Brouse'),
    (-4167104, 'Taylor Giles'), (-4167105, 'Keith Mays'), (-4167106, 'Doug Scott'),
    (-4167107, 'Dan Standke')
  );
  IF v_pair_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: pairwise identity gate — expected 7 exact (external_id, full_name) matches, found %', v_pair_count;
  END IF;
END $$;
```

**WR-C (empty-roster guard):** the headshot script's `test_download_guard(OFFICIALS[0])` (or equivalent smoke-test call) must first assert `len(OFFICIALS) > 0` before indexing into it, to avoid an `IndexError` if the OFFICIALS list is ever empty at test time (defensive fix — not expected to trigger here given the confirmed 7/7 sourcing, but must still be present per D-15).

Also carry forward the standard independent geofence-existence assertion (not a same-transaction dead gate):
```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4167100' AND mtfcc='G4110'; -- must be >= 1
```

And the stance-migration row-count assertion (per Tigard/Tualatin/Forest Grove pattern):
```sql
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n FROM inform.politician_answers WHERE politician_id = '<uuid>';
  IF n <> <expected_count> THEN
    RAISE EXCEPTION 'Expected % answers, found % — topic_key mismatch dropped rows', <expected_count>, n;
  END IF;
END $$;
```

### Office Title Convention

**Plain titles — follow Tigard/Forest Grove's exact convention (NOT Beaverton's numbered positions, NOT Hillsboro's ward+position):** `'Mayor'` for the LOCAL_EXEC seat, `'Councilor'` for each of the 6 LOCAL seats. Sherwood's own site text and its candidates' own SEL101 filings use no "Position N" or "Ward N" language anywhere found in this session. Council President Kim Young keeps the plain `'Councilor'` title with the Council President designation carried only in a migration comment (title-on-seat, no separate office row — mirrors exactly how Tigard's Maureen Wolf, Tualatin's Valerie Pratt, and Forest Grove's Mariana Valenzuela were handled).

### OR Casing Rules (identical to every prior WashCo city — critical, wrong case = silent routing failure)

| Context | Casing | Why |
|---------|--------|-----|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | [RE-VERIFIED live this session against existing OR geofence rows for Forest Grove/Tualatin/Tigard] |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `essentials.politicians.party` | `NULL` | Antipartisan design — never set |

### Live Compass Topics (44 total, is_live=true — re-verified live this session, unchanged from Hillsboro/Tigard/Tualatin/Forest Grove)

abortion, ai-regulation, campaign-finance, childcare, city-sanitation, civil-rights, climate-change, data-centers, deportation, economic-development, fossil-fuels, growth-and-development, healthcare, homelessness, homelessness-response, housing, immigration, jail-capacity, judicial-access-to-justice, judicial-bail-pretrial, judicial-criminal-justice, judicial-government-deference, judicial-interpretation, judicial-police-accountability, judicial-prosecution-priorities, judicial-transparency, local-environment, local-immigration, medicare/aid, misinformation, public-safety-approach, redistricting, religious-freedom, rent-regulation, residential-zoning, same-sex-marriage, school-vouchers, social-security, tariffs, taxes, trans-athletes, transportation-priorities, ukraine-support, voting-rights.

**Skip all 8 judicial-* topics** — City Attorney and Municipal Court Judge confirmed council-appointed via the Sherwood-specific org chart (see Form of Government section — this is a firmer confirmation than Forest Grove's cross-city-pattern assumption).

---

## Stance Evidence Landscape (guidance for the stance plan, not exhaustive research)

**Strong, recent, whole-council anchor found: the Jan 2026 Charter-amendment special election on state housing-law local control.** [CITED: WebSearch aggregation of OPB, rosener.com, and city-site coverage] On **October 28, 2025**, the Sherwood City Council voted **unanimously** to pass three resolutions calling a special emergency election:
- **Resolution 2025-073** — Declaring an Emergency and Calling for a Special Election to Amend the Sherwood City Charter to Protect Home Rule Authority
- **Resolution 2025-074** — Charter Amendment Establishing City Authority Over Annexation Decisions (requiring voter approval for annexations, "except in rare public health emergencies")
- **Resolution 2025-075** — Charter Amendment Regarding Citizen Involvement in Land Use Decisions (guaranteeing a neighborhood meeting + public hearing before any Type III+ development can proceed)

The measures passed in the Jan 13, 2026 special election by wide margins (one ~80%, one ~90%+). Mayor Rosener's own public statements frame this explicitly around **local control vs. state housing mandates**: *"Sherwood's voters, not lawmakers in Salem, decide how our community grows"* and *"cities don't build housing; developers do. What we need are tools, not rules, and partnerships, not mandates."*

**Polarity nuance — flag for stance-research agents, do not force onto `residential-zoning` uncritically:** this vote is about **WHO decides** (state mandate vs. local/voter control over annexation and land-use process), not a direct position on single-family-zoning preservation vs. density (the more typical `residential-zoning` axis seen in other cities' RSO/upzoning votes). It may fit `growth-and-development` more cleanly than `residential-zoning`, or could support both with different framing — **this is a genuine interpretive judgment call for the stance-research agent, not a mechanical lookup**, similar in kind to Pasadena's SB79-recusal nuance and Forest Grove's inherited-history pitfall. Since the vote was unanimous and by all accounts occurred with all 7 current officials seated (all 7 were on record as seated well before Oct 2025 — Young/Brouse/Standke since Jan 2025, the rest since at least 2022), it is potentially usable as evidence for **all 7 officials**, not just Rosener — but each stance-research agent should independently verify each official's specific individual involvement/quotes where possible, rather than mechanically copy-pasting one shared value across all 7.

**Individual campaign-platform themes found (starting points, not stances themselves):**
- **Mayor Rosener:** local control over growth/annexation/land-use process (see above); background as a 900+-local-government software consultant.
- **Councilor Standke (2024 campaign, per `valleytimes.news`):** "apply Sherwood common sense to our design standards, annexation policies and development goals," constituent service (parking issues, grant-application help for local orgs), balanced growth planning.
- **Councilor Mays:** extensive institutional history (multiple past terms as Mayor and Council President, Oregon Mayors Association president, League of Oregon Cities president/treasurer) — a long public record likely to yield rich material via meeting minutes/Agenda Center, though this session did not deep-dive his specific vote history beyond the housing-charter anchor.
- **Councilors Young, Brouse, Giles, Scott:** bios on the city site emphasize community-service background (charter-school board, Chamber of Commerce leadership, Voices for the Performing Arts co-founding, product-management careers) rather than specific policy positions — expect these four to need Agenda Center/meeting-minutes research for issue-specific stances beyond the shared housing-charter anchor.

**No Forest Grove-style "genuinely thin bio" pattern found here** — Sherwood's bios are comparably rich to Tualatin's, and the housing-charter vote gives a concrete, dated, multi-topic anchor unavailable to several prior cities. **Recommend the stance-research plan budget for a comparably deep or deeper outcome than Forest Grove's 39 stances across 7 officials**, contingent on how much additional material the Agenda Center/meeting-packet PDFs yield per official — city council meeting packets are directly fetchable as PDFs (confirmed via the org-chart PDF and a `02.03.2026-City-Council-Meeting-Mintues.pdf` found via WebSearch), a stronger sourcing situation than several prior cities.

**Pamplin Media (Sherwood Gazette) — D-16 applies.** `pamplinmedia.com` TLS-fails for all fetchers (re-confirmed live this session). `valleytimes.news` and `beavertonvalleytimes.com` (both Pamplin-network subdomains, but NOT the root domain) ARE directly WebFetch-able and should be preferred over search-index extraction wherever a direct URL is found — reserve the D-16 search-index-extraction technique specifically for `pamplinmedia.com`-hosted content that has no working mirror URL.

---

## Architecture Patterns

### Closest Analogs: Tigard (178) / Forest Grove (180) for title convention, Beaverton/Tualatin/Forest Grove (176/179/180) for district split

Sherwood combines Tigard/Forest Grove's plain-title, no-appointment structural shape with Beaverton/Tualatin/Forest Grove's directly-elected-Mayor district split — with the added wrinkle of a 2-year (not 4-year) Mayor term, which affects only the migration's documentation comment, not the structural shape itself.

```
City of Sherwood, Oregon, US (governments)
└── City Council (chambers, official_count=7)
    ├── LOCAL_EXEC district (geo_id=4167100, state='or', mtfcc=NULL)
    │   └── Mayor office → Tim Rosener (-4167101, 2-year term, expires Jan 2027)
    └── LOCAL district (geo_id=4167100, state='or', mtfcc=NULL)
        ├── Councilor (Council President) → Kim Young (-4167102, term expires Jan 2029)
        ├── Councilor → Renee Brouse (-4167103, term expires Jan 2029)
        ├── Councilor → Taylor Giles (-4167104, term expires Jan 2027)
        ├── Councilor → Keith Mays (-4167105, term expires Jan 2027)
        ├── Councilor → Doug Scott (-4167106, term expires Jan 2027)
        └── Councilor → Dan Standke (-4167107, term expires Jan 2029)
```

### System Architecture Diagram

```
Sherwood resident address
        |
        v
  Backend /representatives/me
        |
  PIP query against geofence_boundaries
        |
  ┌─────────────────────────────────────────┐
  │  G4110 city boundary (geo_id=4167100)   │   <-- CORRECTED geo_id (was stated 4167450)
  │  → LOCAL_EXEC district (Mayor)          │
  │  → LOCAL district (all 6 Councilors)    │
  └─────────────────────────────────────────┘
        |
        v
  7 officials returned
  (Mayor first via groupHierarchy.js)
        |
        v
  frontend PoliticianCard render
  (600x750 headshot [7/7 confirmed, no fallback needed] + compass stances + Local-section banner)
```

### Anti-Patterns to Avoid

- **Do NOT use geo_id `4167450`** — it does not exist in the database at all. The correct value is `4167100`.
- **Do NOT invent numbered positions or wards** — Sherwood uses plain `'Mayor'`/`'Councilor'` titles exclusively; confirmed via the city's own text AND its candidates' own official SEL101 filing forms (two independent primary-source types).
- **Do NOT model the Mayor's term as 4 years** — Sherwood's Mayor serves a distinct 2-year term (a new pattern for this milestone); document the real cadence in migration comments even though the LOCAL_EXEC/LOCAL structural shape is unchanged.
- **Do NOT confuse Keith Mays's past Mayor/Council-President history (2001-2013, 2018-2022) with his CURRENT seat** — he is presently a plain Councilor; his historical titles belong in stance-research bio context only, not in his current office title or district assignment.
- **Do NOT seed a Youth Councilor or Youth Advisory Board seat as an 8th office** — confirmed a standalone advisory board, not a Council dais seat.
- **Do NOT treat `pamplinmedia.com`'s TLS failure as "no evidence exists"** — use the D-16 search-index-extraction technique, or prefer the directly-fetchable `valleytimes.news`/`beavertonvalleytimes.com` mirror subdomains where available.
- **Do NOT mechanically copy the Oct-2025 housing-charter-vote stance value onto `residential-zoning` without judgment** — it is a local-control/annexation/process vote, not a direct single-family-vs-density position; `growth-and-development` may be the cleaner fit, or both, with careful independent reasoning per official.
- **Do NOT store or surface party affiliation** — antipartisan design forbids this regardless of source prominence (note: every SEL101 filing found this session was "Nonpartisan" anyway).
- **Do NOT seed any 2026 election candidate as an incumbent** — Phase 185 owns that data.
- **Do NOT insert `slug`** on chambers — GENERATED ALWAYS (migration will fail).
- **Do NOT use `photo_origin_url`** in politician_images INSERT — column does not exist.
- **Do NOT default stance values** — blank spoke is correct when no evidence found.
- **Do NOT use ON CONFLICT on districts** — no unique constraint; use WHERE NOT EXISTS.
- **Do NOT use the ledger MAX (1178) as the next migration number** — the true on-disk MAX is 1186; next is 1187.
- **Do NOT skip the D-15 WR-A/WR-B/WR-C fixes** — apply all three to this phase's structural and headshot migrations, on top of the already-shipped 179-REVIEW WR-01/WR-02.
- **Do NOT cite `legacywebsite.sherwoodoregon.gov`** — the subdomain's DNS does not resolve (`ENOTFOUND`), confirmed dead this session.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot resize | Custom PIL script | Existing `_tmp-*-headshots.py` pipeline (e.g. `_tmp-forest-grove-headshots.py` as the most recent template) | Phases 159-180 all reuse the same crop-4:5→600x750 Lanczos pattern; this phase's square 1:1 sources still fit the same crop-then-resize order |
| Stance research | Parallel agents | One agent at a time | Rate-limit rule — parallel burns quota with no usable output |
| Geofence load | Custom boundary ingest | None needed | At-large — city G4110 (4167100, CORRECTED) already loaded |
| groupHierarchy ordering | Custom sort | groupHierarchy.js Mayor-first rule | Already handles LOCAL_EXEC-first ordering |
| Banner processing | Custom crop/resize script | `scripts/banners/process_banner.py` + `upload_banner.py` | Already built, proven on Beaverton/Hillsboro/Tigard/Tualatin/Forest Grove/50 states |
| Meeting-minutes/agenda PDF reading | Custom PDF scraper | Direct fetch + the project's Read-tool PDF support (already proven this research session on the org chart and SEL101 forms) | No new tooling needed; PDFs are directly fetchable from sherwoodoregon.gov |
| geo_id trust | Trusting the phase description's stated geo_id at face value | Always run the geofence-existence probe FIRST | Third correction this milestone — the probe habit must never lapse, especially not because "we already found 2, surely this one's fine" |

---

## Common Pitfalls

### Pitfall 1: Using the stated geo_id 4167450 without verification
**What goes wrong:** A structural migration is written against a geo_id that has zero matching rows in `essentials.geofence_boundaries`, causing every downstream district/office insert to either fail a foreign-key-style assumption or silently route nothing.
**Why it happens:** The phase description and CONTEXT.md both state `4167450` as the "already present from v8.0" value, inviting a trust-without-verify shortcut, especially after Tigard and Forest Grove were both correct as stated (creating a false sense that the pattern of errors had stopped).
**How to avoid:** Always run the direct geofence-existence probe FIRST, exactly as D-02/Wave-0 mandates — this research found `4167450` returns 0 rows and `4167100` is the correct, sole G4110 row for "Sherwood city."
**Warning signs:** Any query against `4167450` returning 0 rows should immediately halt and trigger a name-based re-search, not a retry.

### Pitfall 2: Assuming the Mayor's term is 4 years like every prior WashCo city
**What goes wrong:** A migration comment or a stance-research agent's term-date reasoning assumes a 4-year Mayor cycle, leading to an incorrect assumed term-start date or an incorrect assumption about which year the Mayor is next up for election.
**Why it happens:** Every other WashCo Mayor seeded so far (Beaverton, Hillsboro, Tigard, Tualatin, Forest Grove) is a 4-year term — an easy pattern to over-generalize.
**How to avoid:** Sherwood's own city-council page explicitly states "The Mayor is elected to a two-year term" — quote this directly in the migration comment rather than assuming uniformity with prior cities.
**Warning signs:** Any generated migration comment stating a 4-year Mayor term for Sherwood should be treated as a copy-paste error from the Forest Grove/Tualatin templates.

### Pitfall 3: Attributing Keith Mays's past Mayor/Council-President titles to his current seat
**What goes wrong:** A structural migration or stance-research agent seats Mays as "Mayor" or "Council President" based on his bio's extensive institutional history (Mayor 2005-2012 and 2018-2022, Council President 2001-2004).
**Why it happens:** His bio prominently leads with this history, and it is genuinely substantial — a natural source of confusion for an agent skimming quickly, similar in shape to Forest Grove's Falconer/Milwaukie pitfall (though here the confusion would be intra-city, not cross-city).
**How to avoid:** Cross-check against the CURRENT live roster page and the Dec-2024 org chart — both independently and unambiguously list Mays as a plain "Councilor" today, with Rosener as Mayor and Young as Council President.
**Warning signs:** Any structural migration or stance file that assigns Mays the LOCAL_EXEC district or a "Council President" comment should be treated as an error.

### Pitfall 4: Forcing the Oct-2025 housing-charter vote onto `residential-zoning` uncritically
**What goes wrong:** A stance-research agent mechanically records a HIGH or LOW `residential-zoning` value for all 7 officials based solely on the housing-charter-amendment vote, without recognizing that the vote is about local-control-over-process (who decides annexation/land-use), not a direct position on single-family-zoning preservation vs. density.
**Why it happens:** It is the single richest, most-quotable, most clearly-unanimous piece of evidence found in this research, creating pressure to force it onto the most obviously-adjacent topic.
**How to avoid:** Treat it primarily as `growth-and-development` evidence (or both, with distinct reasoning), and require each stance-research agent to independently verify each official's own specific record/quotes rather than copy-pasting one shared value across all 7 from the Mayor's public statements alone.
**Warning signs:** Identical `residential-zoning` values and near-identical reasoning text across all 7 officials' stance migrations should trigger a re-review.

### Pitfall 5: districts.state uppercase 'OR' for LOCAL districts
**What goes wrong:** Routing fails silently — address lookup returns no city-level officials.
**How to avoid:** All LOCAL/LOCAL_EXEC districts in Oregon use `state='or'` (lowercase), consistent across every prior WashCo city.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | geo_id 4167100 is the correct, sole G4110 row for the City of Sherwood (and 4167450 does not exist) | geo_id Verification | LOW — directly verified against the live production DB via both a direct-value lookup (0 rows for 4167450) and a name search (exactly 1 G4110 row for "Sherwood city") |
| A2 | Sherwood's council is pure at-large with plain titles ('Mayor'/'Councilor'), zero ward/position differentiation, directly-elected Mayor on a 2-year term | Form of Government | LOW — directly quoted from the primary-source city page AND independently corroborated by multiple candidates' own official Washington County SEL101 filing forms (two distinct primary-source document types agreeing) |
| A3 | The 7-member roster (Rosener, Young, Brouse, Giles, Mays, Scott, Standke) reflects the CURRENT seated council as of 2026-07-03 | Live Roster | LOW — sourced directly from the official city roster page; independently cross-confirmed by a Dec-2024 organizational chart (19 months apart, exact match) and a Sept-2022 certified-candidate letter (5-year-old baseline, consistent with continuous service) |
| A4 | City Attorney and Municipal Court Judge are council-appointed (not elected), specifically for Sherwood | Form of Government | LOW — CONFIRMED via a Sherwood-specific primary source (the Dec-2024 org chart's direct-to-Council connector lines), a firmer basis than Forest Grove's cross-city-pattern-only assumption |
| A5 | Dan Standke's current 4-year term (expires Jan 2029) reflects continuous service since some point at or before 2022, via a Nov 2024 re-election, rather than a 2024 appointment | Live Roster | LOW-MEDIUM — his 2022 SEL101 filing and a Sept-2024 "seeks another term" news headline both establish continuity, but the exact 2022-term-length vs. 2024-term-length reconciliation (see Open Question 1) was not fully resolved this session; does not affect his `is_appointed` flag either way (both sources describe him as elected, never appointed) |
| A6 | All 7 currently-seated officials were seated (and thus could plausibly have voted) as of the Oct 28, 2025 housing-charter resolutions | Stance Evidence Landscape | LOW-MEDIUM — Young/Brouse/Standke were seated by Jan 2025 per their term-start math, and the rest have been seated since at least 2022 per the SEL101 filings; no specific per-member roll-call vote breakdown was found in this session (only "unanimously"), so Wave-0/stance-research should verify the precise Oct 2025 seated roster before attributing evidence to Young/Brouse/Standke specifically |
| A7 | Ext_id range -4167101..-4167107 is unused | Migration Reference | LOW — confirmed via live DB query in this session, plus an independent full-name scan across the entire politicians table (0 matches) |
| A8 | On-disk migration MAX is 1186 (next=1187) as of this research session | Migration Reference | LOW — directly verified via `ls`, matches the milestone-memory expectation exactly |
| A9 | "Railroad St - panoramio.jpg" and "Downtown - panoramio - dreid1987.jpg" will crop acceptably to 3.15:1 despite their native 4:3 (~1.33:1) aspect ratios | Community Banner | MEDIUM — license and dimensions directly confirmed via the Wikimedia API, and both images were directly viewed (not just metadata-checked) confirming street-level subject matter; but the specific crop-to-3.15:1 composition (nearly 58% vertical trim) is genuinely untested until the executor performs it |
| A10 | The Oct 2025 housing-charter vote is best classified under `growth-and-development` rather than (or in addition to) `residential-zoning` | Stance Evidence Landscape | MEDIUM — this is an interpretive judgment flagged explicitly for the stance-research agents to resolve with their own independent reasoning, not a settled fact |

---

## Open Questions

1. **Exact mechanics of Dan Standke's 2022→2024 seat continuity**
   - What we know: Standke's 2022 SEL101 filing lists him as a "City Councilor (4 Year Term)" candidate that cycle (alongside Mays/Giles/Scott, all four of whom won unopposed as "vote for four"); his current term is listed as expiring January 2029 (implying a term that began January 2025, i.e., a Nov 2024 election), and a Sept 2024 news headline explicitly describes him as "seeking another term."
   - What's unclear: whether his 2022 win was for a full 4-year term (which would have expired Jan 2027, not Jan 2029) or a shorter fill-in term for a mid-cycle vacancy that happened to be bundled onto the same "vote for four" 2022 ballot line as the other three (who DO show Jan 2027 expiry, consistent with a full 2022-elected 4-year term).
   - Recommendation: does not block planning — his `is_appointed` status is unambiguous (elected, not appointed) regardless of which explanation is correct, and his current term-expiry date (Jan 2029) is independently confirmed by the live site. If the exact continuity detail matters for a specific stance citation, a quick confirming search at Wave-0/stance-research is low-cost.

2. **Whether all 7 currently-seated officials specifically voted for the Oct 2025 housing-charter resolutions, or whether the "unanimous" characterization refers to whoever was seated that day**
   - What we know: three resolutions passed unanimously on Oct 28, 2025; all 7 current officials were very likely seated by that date (Young/Brouse/Standke since Jan 2025 at the latest).
   - What's unclear: no per-member roll-call breakdown was found in the time available this session (only the aggregate "unanimously" characterization from secondary reporting).
   - Recommendation: the stance-research plan should budget a quick primary-source check (the actual Oct 28, 2025 meeting minutes/packet, likely fetchable as a PDF from the Agenda Center the same way the 12.06.2024 org chart and a Feb 2026 meeting-minutes PDF were both directly fetched in this session) before attributing this vote to all 7 officials individually.

3. **Depth of Agenda Center / meeting-packet material available per official for stance research**
   - What we know: at least two meeting-packet/minutes PDFs (`01.21.2025-City-Council-Mtg.-Packet.pdf`, `02.03.2026-City-Council-Meeting-Mintues.pdf`) were found via WebSearch and are plausibly directly fetchable given this session's PDF-fetch success rate (org chart, SEL101 forms).
   - What's unclear: the full breadth of individual-member vote history beyond the housing-charter anchor was not exhaustively mined in this research pass (out of scope for a "guidance, not exhaustive research" landscape survey).
   - Recommendation: stance-research agents should treat the Agenda Center as a live, directly-fetchable primary source (unlike several prior WashCo cities where Agenda Center access was noted but not confirmed) and budget time accordingly — this may support a deeper stance outcome than Forest Grove's 39/7.

4. **Whether any council roster change occurred between this research session (2026-07-03) and plan/execution time**
   - What we know: the roster has been stable and exactly matching across a Dec-2024 snapshot and the live 2026-07-03 page — 19 months of zero turnover.
   - What's unclear: whether any change occurs between now and execution.
   - Recommendation: Wave-0 should re-fetch `sherwoodoregon.gov/government/city-council/` fresh immediately before finalizing the roster — cheap to do given the direct, no-WAF access, same standing practice as every prior WashCo phase.

---

## Environment Availability

No new external tools required beyond the existing project infrastructure. This phase has the least external-dependency risk of any WashCo city so far: no JS-capable fetch tool is needed for headshots (unlike Forest Grove), no bulk-portal-absence gap exists (unlike Tigard), and no custom geofence ingest is needed (pure at-large, city geo_id `4167100` already present from the v8.0 OR TIGER load, corrected and confirmed this session).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL / psql | Migration apply | Yes (via EV-Accounts .env, verified live this session) | PostgreSQL client, confirmed working this session | — |
| sherwoodoregon.gov | Roster + governance text + headshots | **YES — no WAF, direct HTTP 200 confirmed this session for text AND images** | WordPress-based CMS | Not needed |
| Washington County Elections PDFs | Roster cross-check, at-large confirmation | Yes — directly fetchable and readable via the project's PDF-reading tool | — | — |
| Wikimedia Commons | Community banner source | Yes — 2 strong street-level candidates found and visually confirmed, both license-checked | — | Unsplash fallback per pipeline doc |
| pamplinmedia.com | Stance/photo evidence (Sherwood Gazette) | **NO — TLS handshake failure for all fetchers, re-confirmed live this session** | — | D-16 search-index extraction; prefer `valleytimes.news`/`beavertonvalleytimes.com` mirror subdomains where a direct URL exists |
| legacywebsite.sherwoodoregon.gov | (attempted, not needed) | **NO — DNS does not resolve** | — | Use the current `sherwoodoregon.gov` site exclusively; do not cite the legacy subdomain |
| Python 3 + Pillow + requests | Headshot resize pipeline | Yes (existing `_tmp-*-headshots.py` pattern) | — | — |
| scripts/banners/process_banner.py + upload_banner.py | Community banner | Yes (proven on Beaverton/Hillsboro/Tigard/Tualatin/Forest Grove/50 states) | — | — |

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:** `pamplinmedia.com` direct fetch (fallback = D-16 search-index extraction or the directly-fetchable Pamplin-network subdomains).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | SQL verification queries (inline psql, no test runner) |
| Config file | None — inline verification gates in plan |
| Quick run command | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.politicians p ON o.politician_id=p.id JOIN essentials.chambers ch ON o.chamber_id=ch.id WHERE ch.name='City Council' AND ch.government_id=(SELECT id FROM essentials.governments WHERE name='City of Sherwood, Oregon, US')"` |
| Full suite command | 9-check E2E gate (see below), extended with a banner-render check |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WASH-07 | Correct geo_id used (4167100, CORRECTED) | SQL count | `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4167100' AND mtfcc='G4110'` = 1 | Wave-0 inline — MUST run before any other probe |
| WASH-07 | 7 officials seeded with offices | SQL count | `SELECT COUNT(*)... = 7` | Wave-0 inline |
| WASH-07 | Mayor sorts first in display | SQL + live browse | `groupHierarchy.js` + human verify | Existing code |
| WASH-07 | Headshots at 600×750 in Storage | SQL count + CDN HTTP 200 | `SELECT COUNT(*) FROM essentials.politician_images WHERE...` | Wave-2 inline; expect full 7/7 given confirmed direct sourcing |
| WASH-07 | Evidence-only stances render | SQL count + live browse | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id=...` | Wave-3 inline |
| WASH-07 | Purple hasContext chip | Browser/live browse | `essentials.empowered.vote/results?browse_geo_id=4167100&browse_mtfcc=G4110` | Wave-3 human verify |
| WASH-07 | Community banner renders (not gradient fallback) | Browser/live browse | Same browse URL — Local section shows photo; single-word `'sherwood'` key, no space/hyphen trap | Wave-3 human verify |
| WASH-07 | Section-split = 0 rows | SQL (canonical query) | Section-split query after seed | Wave-1 inline |
| WASH-07 | No duplicate government row | SQL | `SELECT COUNT(*) FROM essentials.governments WHERE name='City of Sherwood, Oregon, US'` = 1 | Wave-1 inline |

### 9-Check E2E Verification Gate (Wave-1 structural plan) + Banner Check (Wave-3)

1. `essentials.geofence_boundaries` row exists for geo_id='4167100' AND mtfcc='G4110' — run this FIRST (note: NOT 4167450)
2. `governments` row count = 1 for name='City of Sherwood, Oregon, US'
3. `chambers` row exists with name='City Council', official_count=7
4. `districts` rows: exactly 1 LOCAL_EXEC + 1 LOCAL for geo_id='4167100' state='or'
5. `offices` count = 7 for Sherwood chamber, `representing_city='Sherwood'` set on all 7 (inline)
6. `politician_images` count for Sherwood politicians — expect full 7/7 given confirmed direct sourcing; investigate any shortfall as a regression, not an expected gap
7. `politician_answers` count ≥ 1 per official (honest blanks OK; 0 for any official = re-check)
8. Section-split query (canonical version) returns 0 rows for geo_id 4167100
9. Human-verify: live browse link shows Mayor first + all 6 councilors, compass stances visible, no party label
10. (Wave-3 banner) Human-verify: Local section banner shows a Sherwood photo, not the tier gradient fallback

### Wave 0 Gaps

- [ ] DB probe (run first): confirm geo_id 4167100 has exactly 1 G4110 row (this research found it correct after correcting from the stated 4167450 — re-verify regardless)
- [ ] DB probe: confirm no existing government/chamber rows for Sherwood (name + geo_id) — this research found 0
- [ ] DB probe: confirm ext_id range -4167101..-4167107 is unused — this research found 0 rows
- [ ] DB probe / disk `ls`: re-confirm disk migration MAX (this research found 1186 → next 1187)
- [ ] Fresh fetch of `sherwoodoregon.gov/government/city-council/` to re-confirm the 7-member roster is unchanged
- [ ] Re-download all 7 headshot URLs to confirm continued availability (this research found 7/7 HTTP 200, 600×600 JPEG each)
- [ ] View the "Railroad St" and "Downtown" candidate images directly before finalizing the banner choice — the crop-to-3.15:1 compositional judgment was previewed but not finally executed in this research
- [ ] Quick confirming check of Standke's 2022→2024 seat-continuity mechanics if his stance-migration reasoning needs it (Open Question 1) — low priority, does not block the structural migration
- [ ] Quick confirming check of the exact Oct 28, 2025 seated roster before attributing the housing-charter vote to all 7 officials individually (Open Question 2)

---

## Security Domain

This phase is a data-seeding/migration phase with no new user-facing input surface, no new authentication/session code, and no new API endpoints. Most ASVS categories are not applicable.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No new auth surface introduced |
| V3 Session Management | No | No new session surface introduced |
| V4 Access Control | No | No new access-control surface introduced |
| V5 Input Validation | Marginal | All migration values are static, researcher-authored SQL literals — no dynamic/untrusted user input is concatenated into any query in this phase's deliverables |
| V6 Cryptography | No | No new cryptographic surface introduced |

### Known Threat Patterns for this phase's stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via migration authoring | Tampering | All migration SQL is static and researcher/executor-authored (no runtime string interpolation of external input); this is the same posture as every prior WashCo structural/headshot/stance migration in this milestone |
| Untrusted third-party image ingestion (headshots/banner) | Tampering | Images are sourced only from the official city site, Wikimedia Commons (license-verified), or the pre-authorized D-16 fallback chain — never from arbitrary user-submitted URLs; processed through the existing Pillow-based crop/resize pipeline (no execution of downloaded content) |

---

## Sources

### Primary (HIGH confidence)
- `essentials.geofence_boundaries` / `essentials.districts` / `essentials.governments` / `essentials.politicians` live queries (psql, this session) — CORRECTED geo_id from 4167450 (0 rows) to 4167100 (confirmed sole G4110 row); confirmed greenfield status; confirmed clean ext_id range; confirmed no stale politician rows by name.
- `https://www.sherwoodoregon.gov/government/city-council/` — fetched directly via curl, HTTP 200, no WAF — full roster, bios, term-expiry dates, Council President context, AND all 7 headshot image URLs, all confirmed via stripped-HTML text extraction and direct binary download.
- Washington County Elections Division SEL101 candidate-filing PDFs, Sept 7 2022 certification letter + individual candidate forms (Rosener/Standke/Mays/Giles/Scott) — fetched directly, read via PDF tool — at-large ballot-line confirmation, 2022-era roster snapshot.
- City of Sherwood Organizational Chart PDF, dated 12.06.2024 — fetched directly, read via PDF tool — independent Dec-2024 roster snapshot (exact match to live 2026 roster), council-manager reporting-line confirmation, City Attorney/Municipal Court Judge appointment-line confirmation.
- `https://commons.wikimedia.org/w/api.php` (categorymembers + imageinfo queries) — confirmed full 36-file category listing, license, and dimensions for all banner candidates; two candidates additionally directly downloaded and visually inspected.
- `ls C:/EV-Accounts/backend/migrations | sort -t_ -k1 -n` — confirmed disk MAX is 1186 as of 2026-07-03.
- `SELECT MAX(version::bigint) FROM supabase_migrations.schema_migrations WHERE version ~ '^[0-9]{1,6}$'` — confirmed ledger MAX is 1178.
- `inform.compass_topics` live query — confirmed 44 live topics, 8 of which are judicial-*, unchanged from prior phases.
- Forest Grove Phase 180 artifacts (180-RESEARCH.md, 180-PATTERNS.md via 178-PATTERNS.md cross-reference, 180-05-SUMMARY.md) — WR-A/WR-B/WR-C fix precedent (180-REVIEW.md), migration-split shape, Wave-0 gate pattern, single-word-vs-two-word CURATED_LOCAL key lesson.

### Secondary (MEDIUM confidence)
- WebSearch aggregation of OPB ("Sherwood votes overwhelmingly to challenge new state housing laws," "Sherwood voters appear to have passed measures...") — Jan 2026 special-election outcome; full article text was paywalled/not retrievable via WebFetch, so exact vote-margin figures are secondary-source aggregated, not primary-quoted.
- `https://rosener.com/therosenercorner/2025/1/9/...` (Mayor Rosener's own blog) — directly fetched via WebFetch; treated as MEDIUM (a primary-source politician statement, but self-published/advocacy in nature, not neutral reporting) rather than HIGH.
- WebSearch aggregation of `valleytimes.news`, "Dan Standke seeks another term on Sherwood City Council," Sept 2024 — directly WebFetch-able, confirms 2024 re-election and campaign themes.
- WebSearch aggregation on municipal-judge appointment norms — corroborates but is secondary to the Sherwood-specific org-chart confirmation (A4).

### Tertiary (LOW confidence)
- `library.municode.com` charter mirror — confirmed to exist and return HTTP 200, but is an Angular SPA shell not fetchable via plain curl; not relied upon for any load-bearing claim (the city's own plain-text pages and the candidates' own SEL101 filings were sufficient primary-source substitutes).
- Additional unvetted Wikimedia Commons files beyond the ones directly viewed (e.g., "130814-Z-B7541-139," a National Guard-tagged photo; "ChevroletCamaroB4C-06.jpg") — not examined in depth, near-certainly not usable banner candidates based on filename/category context alone.

---

## Metadata

**Confidence breakdown:**
- geo_id verification: HIGH — directly verified against live production DB; the stated value does not exist at all (0 rows), and the correct value was found via an unambiguous name search with no competing candidates.
- Form of government (pure at-large, plain titles, directly-elected 2-year Mayor): HIGH — directly quoted from the primary-source city page AND independently corroborated by multiple candidates' own official government-filed election documents (a stronger evidentiary combination than any single prior WashCo phase).
- Roster (7 of 7 officials, names/positions/term dates): HIGH — sourced directly from the official city roster page, cross-confirmed by two independent historical snapshots (2022 SEL101 letter, Dec-2024 org chart) with zero discrepancy.
- Headshot sourcing: HIGH — the best outcome of the milestone; all 7 directly confirmed downloadable, no fallback chain needed, no JS-rendering gate, no bulk-portal-absence gap.
- Migration shape (schema): HIGH — directly inherited from the Tigard/Forest Grove (title convention) + Beaverton/Tualatin/Forest Grove (district split) templates, with the D-15 WR-A/WR-B/WR-C improvements layered on top of the already-shipped WR-01/WR-02.
- Ext_id range + migration counter: HIGH — both independently confirmed live in this session, matching the milestone-memory expectation exactly.
- Stance evidence landscape: MEDIUM — a strong, dated, unanimous anchor was found, but the exact seated-roster-on-vote-date and polarity-classification questions are flagged as genuine judgment calls for the stance-research agents, not fully resolved facts.
- Community banner: MEDIUM — two candidates found with confirmed licenses, adequate resolution, AND direct visual inspection (stronger than a metadata-only check), but the compositional crop-to-3.15:1 judgment remains untested until execution.

**Research date:** 2026-07-03
**Valid until:** 2026-07-17 (standard 14-day window for this milestone, consistent with the pattern of active concurrent site changes and election-cycle data seen across prior WashCo phases).

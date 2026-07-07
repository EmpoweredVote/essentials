# Phase 183: School Boards Wave 1 — Beaverton SD 48J + Hillsboro SD 1J - Research

**Researched:** 2026-07-04
**Domain:** Two Oregon school-district government seeds (Beaverton SD 48J, Hillsboro SD 1J) on pre-loaded G5420 geofences + headshots + 0 compass stances by design
**Confidence:** HIGH (geofences/greenfield status/schema/roster/election-method/environment); MEDIUM (exact verbatim office-title convention for Hillsboro; exact verbatim chamber legal name for both — Wave-0 final lock recommended)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-Z1 (user-confirmed): WHO VOTES decides routing, not residency** — the city-chain D-02
  tie-breaker carries forward unchanged. Verified from each district's official election rules at
  plan time (district site / election filings), never assumed:
  - **If zone voters alone elect their director** → sub-zone geofences required before seeding
    (LAUSD G5420 sub-district precedent).
  - **If the whole district votes for every position** (zones = residency requirement only, the
    common Oregon ORS 332.118 shape; PPS/Multnomah v10.0 precedent) → single G5420 district,
    whole-board modeling, no new geofences.
  - Beaverton SD 48J uses zones — this branch is REAL for Beaverton, not theoretical. Hillsboro
    SD 1J is commonly described as at-large positions. Both get the same verification.
- **D-Z2 (recommended, AFK): Whole-district fallback if zone-voted with no official GIS** — if a
  board is confirmed zone-VOTED but no official machine-readable zone boundary exists (district GIS
  or Washington County open data), seed on the single G5420 geofence with the zone structure
  documented as a known modeling caveat (research + summary + Phase 186 retrospective). Phase 183's
  success criteria are district-level ("a Beaverton address returns the correct Beaverton SD board
  member"), so this stays honest — the school-board analog of at-large modeling. **Never
  hand-trace boundaries.** (Deliberately softer than the city D-02 blocker rule because the
  success criteria here don't demand zone precision.)

### Banner treatment (recommended, AFK)
- **D-B1: No community banner for school districts.** The licensed-banner standing constraint
  ([[feedback_deepseed_community_banner]]) is **city-scoped**; CCSD (Phase 166/173) shipped plain
  with no banner. District browse inherits the existing default banner behavior. No
  `buildingImages.js` work, no `cities/*.jpg` assets this phase. (If district banners are ever
  wanted, that's a deferred idea — see below.)

### Plan shape (recommended, AFK)
- **D-P1: Single shared plan-set covering both districts** — the v10.0 shape (6 Multnomah boards
  in one phase, one structural migration `254_or_school_districts.sql`), not two per-district
  chains. Expected shape: Wave-0 probes → structural (both boards) → headshots (both boards) →
  surfacing. No stances plan, no banner plan — this is a ~4-plan phase, lighter than the 5-plan
  city unit. Planner may split the structural migration into one file per district if cleaner;
  one file for both is equally acceptable (254 precedent).

### Roster edge cases (recommended, AFK — city conventions transfer unchanged)
- **D-R1: Ground-truth roster + exact body name verbatim** from each district's official site at
  plan time (beaverton.k12.or.us / hsd.k12.or.us — researcher confirms live domains). No
  hardcoding names, seat counts, or position naming from memory; account for recent turnover
  (May-2025 Oregon school-board elections seated new directors). Researcher notes **WAF status AND
  photo availability** of both district sites so the executor isn't surprised.
- **D-R2: Office title per district convention — never assume "Board Member."** SFUSD used
  Commissioner, BUSD used Director (v10.0 locked decision); Oregon districts typically use
  "Director" with numbered zones/positions — verified verbatim from each district site. If the
  district itself numbers seats (e.g., "Director, Zone 3"), keep the district's numbering on the
  office title.
- **D-R3: Chair / Vice Chair = title-on-seat** if the district designates one — same as the city
  Council-President convention (D-06 lineage); no separate LOCAL_EXEC-style row, no extra chamber.
- **D-R4: Non-voting seats EXCLUDED** — superintendents (appointed staff) and student
  representatives/advisors are not elected officials. Vacant zones: document the vacancy
  (Cornelius TX-23-style), **never seed a placeholder person**. Very recent appointees count as
  seated officials if confirmed on the official district site.
- **D-R5: Headshots** — official district site first, then the standing fallback chain
  (Ballotpedia/Wikimedia → local-news/community/campaign as documented last resort). Crop-to-4:5
  FIRST then resize 600×750 (Lanczos q90, no overlays); circle-cutout PNG sources get the
  **inscribed-crop** treatment ([[feedback_headshot_circle_cutout_sources]], Cornelius UAT
  lesson); transparent PNGs composite onto white. Mirror to Storage
  `politician_photos/{uuid}-headshot.jpg`; `photo_license` by actual source. Genuine gaps
  documented, no fabrication.

### Claude's Discretion
- **External_id block** — Wave-0 DB probe picks unused ranges; geo_id-derived blocks are the
  natural analog (e.g., -4101921.. for Beaverton SD, -4100024.. for Hillsboro SD), subject to
  probe verification.
- **Next migration number** — on-disk MAX verified at **1202** this session
  (`1202_seed_ma_2026_house_candidates.sql` landed from another workstream — the on-disk check
  exists for exactly this), so next = **1203**. Wave-0 re-confirms; on-disk counter authoritative;
  DB ledger MAX is a known trap.
- **Government naming** — follow the freshest school-district government naming precedent
  (`1107_ccsd_board_of_trustees.sql`, then `254_or_school_districts.sql` for the OR-specific
  shape); researcher confirms what renders well in browse.
- **Structural migration granularity** — one file for both districts vs one per district (D-P1).

### Deferred Ideas (OUT OF SCOPE)
- Wave 2 school boards (Tigard-Tualatin/Forest Grove/Sherwood) — Phase 184, same shape as this
  phase; carry any 183 lessons forward.
- 2026 school-board election races + discovery for these districts — Phase 185.
- **District banners** — if school-district browse should ever get licensed banner art (like the
  city banners), that's a new capability for a future phase/backlog; D-B1 ships plain.
- Superintendent/staff/student-rep representation — out of scope by design (not elected).

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WSCH-01 | Beaverton SD 48J Board deep-seeded — roster + headshots; board-district structure verified | (1) Geofence **already loaded and valid** (Phase 174, geo_id `4101920`, `source='tiger_unsd_or_2024_westmetro'`); (2) **Live-verified 7-member roster** with zone numbers, Chair/Vice-Chair, term dates (beaverton.k12.or.us, curled raw HTML, no WAF); (3) **Election method LIVE-VERIFIED as whole-district at-large** — "Though candidates are nominated from the Board Zone they live in, voters in the District elect them at-large" (site's own language, confirmed verbatim) — **this CONTRADICTS the CONTEXT.md's stated assumption that Beaverton uses zone-only voting; the D-Z1 zone-voted branch does NOT fire for either district** (see Key Finding 1 below); (4) 7/7 headshot URLs found directly in raw HTML (no JS execution needed), all HTTP 200, no WAF |
| WSCH-02 | Hillsboro SD 1J Board deep-seeded — roster + headshots | (1) Geofence **already loaded and valid** (Phase 174, geo_id `4100023`); (2) **Live-verified 7-member roster** with Position numbers, Chair/Vice-Chair, tenure dates (hsd.k12.or.us, curled raw HTML, no WAF); (3) **Election method confirmed at-large with Position numbers** (Ballotpedia + district's own "Position: N" field) — no zone/residency requirement documented at all (simpler than Beaverton); (4) 7/7 headshot URLs found in raw HTML, all HTTP 200, no WAF; 3 additional images found are **non-voting student representatives — must be excluded per D-R4** |

</phase_requirements>

---

## Summary

Phase 183 deep-seeds two Oregon school-district boards — Beaverton SD 48J (geo_id `4101920`, 7-zone board) and Hillsboro SD 1J (geo_id `4100023`, 7-position board) — onto the G5420 geofences Phase 174 already loaded and smoke-tested. **This phase needs NO new geofence work of any kind**: both boundaries exist, are valid, and are correctly named in `essentials.geofence_boundaries` (confirmed live via direct DB query). The structural shape is a verbatim copy of the proven `254_or_school_districts.sql` / `1107_ccsd_board_of_trustees.sql` school-district pattern: 2 governments (`type='LOCAL'`), 2 chambers, 2 single-shared `SCHOOL` districts (one G5420 geofence each), 14 politician+office CTEs (7 per district), and a coverage.js append with **no `hasContext`** (0-stances-by-design, CCSD precedent).

**The single most important research finding overturns a CONTEXT.md assumption: Beaverton SD 48J is NOT zone-voted.** The CONTEXT.md states "Beaverton SD 48J uses zones — this branch is REAL for Beaverton, not theoretical," but live verification of `beaverton.k12.or.us/school-board/board-members` (both via WebFetch and raw curl of the page HTML) found the district's own language: *"Though candidates are nominated from the Board Zone they live in, voters in the District elect them at-large. Each Board member has several school assignments that may or may not be in their zone."* This is the **common Oregon ORS 332.118 whole-district-vote shape** (zones = residency eligibility only, not a voting boundary) — the exact PPS/Multnomah precedent the D-Z1 decision describes as the *other* branch. Hillsboro SD 1J is even simpler: it uses numbered "Position" seats with no zone/residency language found anywhere (Ballotpedia: "seven members elected at large... each seat has a position number... candidates apply to run for a specific position number"). **Both districts resolve to the SAME D-Z1 branch: whole-district at-large voting → single G5420 district, whole-board modeling, zero new geofences.** D-Z2 (the zone-voted-but-no-GIS fallback) is therefore moot for this phase — it never fires. [VERIFIED: beaverton.k12.or.us/school-board/board-members raw HTML curl 2026-07-04; VERIFIED: Ballotpedia via WebSearch synthesis, cross-verified against hsd.k12.or.us/about-us/board-of-directors/board-members raw HTML]

**Both rosters are fully confirmed, 7/7, no vacancies, no WAF on either official site.** Beaverton: Zone 1 Van Truong (diacritic "Vân"), Zone 2 Karen Pérez, Zone 3 Melissa Potter (Vice Chair), Zone 4 Sunita Garg, Zone 5 Syed Qasim, Zone 6 Justice Rajee (Chair), Zone 7 Tammy Carpenter — all term-expire 2027 or 2029, no mid-term vacancies. Hillsboro: Position 1 Yessica Hardin Mercado, Position 2 Mark Watson, Position 3 Nancy Thomas, Position 4 See Eun Kim (Vice Chair), Position 5 Ivette Pantoja (Chair), Position 6 Katie Rhyne, Position 7 Patrick Maguire — all 7 positions filled. Both district pages returned plain HTTP 200 to a bare `curl` (no WAF, no UA spoofing needed), and all 14 headshot image URLs were found directly embedded in the raw HTML `data-image-sizes` JSON (finalsite CDN, `resources.finalsite.net`) — every one independently confirmed HTTP 200 and directly downloadable. Hillsboro's board page also embeds 3 additional headshot-style images for **student representatives** (Ethan Hernandez Jimenez, Keeton Sayre, Ma'Kaia Woods) — these are non-voting advisory seats and **must be excluded per D-R4**.

**A second finding resolves the CONTEXT.md's flagged frontend-verification concern about card subtitles as a non-issue, but the mechanism is different than stated.** CONTEXT.md says "groupHierarchy.js Rule 3.5 chamber_name fallback already handles school-board card subtitles... verify it fires for the two new chambers." Direct code read + a live production API query (Portland Public Schools, an existing seeded G5420 SCHOOL district) show Rule 3.5 literally does **not** apply to `district_type==='SCHOOL'` (its condition is `dt === 'LOCAL' || dt === 'LOCAL_EXEC'` only) and `government_body_name` is confirmed empty (`""`) in production for every existing OR school-board member (no `government_bodies` table rows exist for any OR district). However, this never surfaces as a bug: `Results.jsx` only renders a sub-group title when `body.subgroups.length > 1` (line 2004); all 7 same-tier school-board members land in exactly ONE sub-group (`MEMBER` role segment), so the sub-group label is never rendered. The visible heading instead comes from `getAccordionKey()`'s `SCHOOL`-specific fallback chain (`government_body_name || government_name || ...`), which resolves to `pol.government_name` (e.g., "Portland Public Schools, Oregon, US") and is stripped to "Portland Public Schools" for display. **No frontend changes are needed; the correct district name renders as the section heading today, verified live.** [VERIFIED: direct DB query of `essentials.government_bodies` (0 OR rows) + live `curl` of production `POST /api/essentials/browse/by-area` for geo_id=4110040 returning `"government_body_name":""` for all 7 PPS members; VERIFIED: `src/lib/groupHierarchy.js` and `src/pages/Results.jsx` read in full]

**Primary recommendation:** (1) Author ONE structural migration `1203_or_westmetro_school_boards_wave1.sql` (D-P1 single-file precedent) — 2 governments + 2 chambers + 2 SCHOOL districts (reusing the existing Phase-174 geofences, no loader script needed) + 14 politician/office CTEs (7 Beaverton "Director, Zone N" + 7 Hillsboro "Director, Position N"), Chair/Vice-Chair as title annotations, UTF-8 saved for the "Vân"/"Pérez" diacritics. (2) Author `1204_or_westmetro_school_boards_wave1_headshots.sql` (audit-only) sourcing all 14 headshots directly from the two districts' own finalsite-hosted image URLs (no fallback chain needed — both sites are clean). (3) Append 2 entries to `COVERAGE_SCHOOL_DISTRICTS` in `src/lib/coverage.js` — plain `{label, browseGeoId, browseMtfcc:'G5420', browseStateAbbrev:'OR'}`, no `hasContext`. No stance migrations (0-by-design). No new geofence loader, no zone sub-districts, no banner work.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Whole-district board routing (both districts) | Database / Storage (existing G5420 geofence) | API / Backend (ST_Covers PIP) | Geofences already loaded by Phase 174; this phase only attaches politicians/offices — no geofence work |
| Government/chamber/district/office seed | Database / Storage (migrations) | — | One SQL migration writes essentials.* tables for both districts |
| Chair/Vice-Chair distinction | Database (office title) | Frontend (label render) | Encoded as a title suffix on the office row; no schema flag |
| Headshot pipeline | API / Backend (Python script) | CDN / Static (Supabase Storage) | Source images pulled directly from each district's finalsite CDN (no WAF fallback chain needed this phase) |
| Board-name card subtitle | Frontend (`groupHierarchy.js` `getAccordionKey` SCHOOL fallback → `government_name`) | — | Confirmed via live production data — no code change needed; do NOT modify Rule 3.5 |
| School-district surfacing (plain chip) | Frontend (`coverage.js`) | — | Append 2 entries to `COVERAGE_SCHOOL_DISTRICTS`; search-only, no `hasContext` |
| Compass stances | N/A — deliberately absent | — | 0 rows by design; any stance row for either district is a defect |

---

## Standard Stack

Phase 183 introduces **no new tools, no new npm/PyPI packages, and no new geofence loader** — a lighter footprint than every prior phase in this milestone (174–182), because the G5420 boundaries are already loaded and both official district sites are directly scrapable with a bare `curl` (no WAF, no headless-browser workaround needed).

### Core (reused, all confirmed present in this session)

| Tool / Pattern | Purpose | Verification |
|----------------|---------|---------------|
| `psql` | Apply structural + audit-only migrations | `psql (PostgreSQL) 18.1` confirmed present [VERIFIED: `psql --version` 2026-07-04] |
| Python 3 (`py` launcher, NOT bare `python`) + Pillow + psycopg2 + requests | Headshot crop/resize/upload pipeline | `py -c "import PIL,psycopg2,requests"` succeeded — PIL 12.1.1, psycopg2 2.9.12, requests 2.34.2 [VERIFIED 2026-07-04]. **Pitfall: bare `python`/`python3` on this machine resolve to non-functional Windows Store stubs — use the `py` launcher.** |
| `254_or_school_districts.sql` / `1107_ccsd_board_of_trustees.sql` (templates) | School-district structural migration shape | Both read in full this session |
| `_tmp-*-headshots.py` (template, e.g. `_tmp-cornelius-headshots.py`) | Headshot download/crop/resize/upload script shape | Referenced per canonical_refs; carries WR-01/WR-02 fixes |

### Installation

No installs required. All dependencies already present:
```bash
psql --version                 # PostgreSQL 18.1
py -c "import PIL,psycopg2,requests; print('ok')"   # ok
```

**No G5420 loader script needed this phase** — unlike Phase 166 (CCSD, which had to load NV's first-ever G5420 boundary), Phase 174 already loaded and smoke-tested both target geofences.

---

## Package Legitimacy Audit

No new external packages required for Phase 183. All Python dependencies (`Pillow`/`PIL`, `psycopg2`, `requests`) and CLI tools (`psql`, `curl`) are pre-existing in the environment and were verified present and functional in this research session (2026-07-04). **Package Legitimacy Gate skipped (no new installs).**

---

## Architecture Patterns

### System Architecture Diagram

```
Phase 174 (ALREADY DONE — no work this phase):
  essentials.geofence_boundaries
    geo_id='4101920' mtfcc='G5420' state='41' name='Beaverton School District 48J'  source='tiger_unsd_or_2024_westmetro'
    geo_id='4100023' mtfcc='G5420' state='41' name='Hillsboro School District 1J'   source='tiger_unsd_or_2024_westmetro'
    (both confirmed present + valid geometry via live DB query 2026-07-04)
        │
        ▼
beaverton.k12.or.us/school-board/board-members  (HTTP 200, no WAF, no UA needed)
    │  7 directors, Zone 1-7, Chair=Rajee(Z6), Vice-Chair=Potter(Z3)
    │  Election language confirmed: "voters in the District elect them at-large"
    │  7/7 headshot URLs embedded directly in raw HTML (finalsite CDN)
    ▼
hsd.k12.or.us/about-us/board-of-directors/board-members  (HTTP 200, no WAF, no UA needed)
    │  7 directors, Position 1-7, Chair=Pantoja(P5), Vice-Chair=Kim(P4)
    │  3 student-rep images present — EXCLUDE (D-R4, non-voting)
    │  7/7 headshot URLs embedded directly in raw HTML (finalsite CDN)
    ▼
Wave 0: DB probes (greenfield confirm, ext_id collision, migration MAX)
    ▼
migration 1203_or_westmetro_school_boards_wave1.sql (STRUCTURAL, registered)
    INSERT governments: 'Beaverton School District 48J, Oregon, US' / 'Hillsboro School District 1J, Oregon, US'
    INSERT chambers:    'School Board' (Beaverton) / 'Board of Directors' (Hillsboro)
    INSERT districts:   1 SCHOOL row per district, geo_id matches the EXISTING geofence, state='or' lowercase
    INSERT 14 politician+office CTEs (7 + 7), titles 'Director, Zone N' / 'Director, Position N'
    Chair/Vice-Chair as title-on-seat suffix (e.g., 'Director, Zone 6 (Chair)')
    post-verify DO block: 2 govs, 14 offices (7/7 split), 0 section-split for BOTH geo_ids
    ▼
migration 1204_..._headshots.sql (AUDIT-ONLY)
    resources.finalsite.net image URLs (both districts) → crop-4:5 → 600×750 Lanczos q90
    → Supabase Storage politician_photos/{uuid}-headshot.jpg → politician_images rows
    ▼
coverage.js COVERAGE_SCHOOL_DISTRICTS (append 2, no hasContext)
    { label:'Beaverton School District 48J', browseGeoId:'4101920', browseMtfcc:'G5420', browseStateAbbrev:'OR' }
    { label:'Hillsboro School District 1J',  browseGeoId:'4100023', browseMtfcc:'G5420', browseStateAbbrev:'OR' }
    ▼
Backend ST_Covers query:
    Beaverton address → G5420 geo_id=4101920 → SCHOOL district → all 7 Beaverton directors
    Hillsboro address → G5420 geo_id=4100023 → SCHOOL district → all 7 Hillsboro directors
    (Frontend: getAccordionKey SCHOOL fallback → government_name → card heading "Beaverton School District 48J" / "Hillsboro School District 1J" — CONFIRMED working via live PPS production data, no code change)
```

### Recommended Project Structure (new files)

```
C:/EV-Accounts/backend/
├── migrations/
│   ├── 1203_or_westmetro_school_boards_wave1.sql            # STRUCTURAL (registered)
│   └── 1204_or_westmetro_school_boards_wave1_headshots.sql  # AUDIT-ONLY
└── scripts/
    └── _tmp-westmetro-school-wave1-headshots.py             # NEW (gitignored) — clean-source download, no WAF fallback needed

C:/Transparent Motivations/essentials/
└── src/lib/coverage.js                          # EDIT — append 2 entries to COVERAGE_SCHOOL_DISTRICTS
```

### Pattern 1: No geofence loader — reuse Phase 174's existing rows

**What:** Unlike CCSD (166), this phase's SCHOOL district INSERT points at a geofence row that **already exists**. Do not write or run any TS loader script.

**Verification query (already run this session):**
```sql
SELECT geo_id, mtfcc, source, name, ST_IsValid(geometry)
FROM essentials.geofence_boundaries
WHERE geo_id IN ('4101920','4100023') AND mtfcc='G5420';
-- 4100023 | G5420 | tiger_unsd_or_2024_westmetro | Hillsboro School District 1J  | t
-- 4101920 | G5420 | tiger_unsd_or_2024_westmetro | Beaverton School District 48J | t
```
[VERIFIED: live DB query 2026-07-04 — 2 rows, both `ST_IsValid=true`]

### Pattern 2: Structural Migration (school-district shape, single shared SCHOOL district per government, 7 offices each)

**Primary analog:** `254_or_school_districts.sql` (6-district-in-one-file shape, `type='LOCAL'`, `state='or'` lowercase on districts, `mtfcc='G5420'`). **Chamber-naming deviation from 254:** 254 uniformly named every district's chamber "Board of Education" — a researcher convenience, not necessarily each district's own verbatim name. D-R1/D-R2 require **verbatim per-district naming**, so this phase diverges:

```sql
-- Government (per district; WHERE NOT EXISTS guard — no unique constraint on governments)
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'Beaverton School District 48J, Oregon, US', 'LOCAL', 'OR', NULL, '4101920'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'Beaverton School District 48J, Oregon, US');

INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'Hillsboro School District 1J, Oregon, US', 'LOCAL', 'OR', NULL, '4100023'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'Hillsboro School District 1J, Oregon, US');

-- Chambers — VERBATIM per-district names (see Key Finding 3 below for the confidence caveat)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'School Board', 'Beaverton School District 48J School Board',
       (SELECT id FROM essentials.governments WHERE name = 'Beaverton School District 48J, Oregon, US')
WHERE NOT EXISTS (SELECT 1 FROM essentials.chambers WHERE name = 'School Board'
  AND government_id = (SELECT id FROM essentials.governments WHERE name = 'Beaverton School District 48J, Oregon, US'));

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'Board of Directors', 'Hillsboro School District 1J Board of Directors',
       (SELECT id FROM essentials.governments WHERE name = 'Hillsboro School District 1J, Oregon, US')
WHERE NOT EXISTS (SELECT 1 FROM essentials.chambers WHERE name = 'Board of Directors'
  AND government_id = (SELECT id FROM essentials.governments WHERE name = 'Hillsboro School District 1J, Oregon, US'));

-- SCHOOL districts — geo_id MUST match the EXISTING Phase-174 geofence row exactly
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'or', '4101920', 'Beaverton School District 48J', 'G5420'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id='4101920' AND district_type='SCHOOL' AND state='or');

INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'or', '4100023', 'Hillsboro School District 1J', 'G5420'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id='4100023' AND district_type='SCHOOL' AND state='or');
```

**Politician+office CTE (repeat 7× per district; verified roster below).** Follow the `254`/`1107` `WITH ins_p AS (INSERT...RETURNING id) INSERT INTO offices SELECT...` shape exactly — `party=NULL`, `is_appointed=false`, `is_appointed_position=false`, `representing_state='OR'` uppercase, `d.state='or'` lowercase in the WHERE clause (the #1 silent-failure pitfall carried over from every prior OR/NV phase):

```sql
-- Example: Justice Rajee (Zone 6, Chair) — external_id per Wave-0-confirmed block
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Justice Rajee', 'Justice', 'Rajee', NULL, true, false, false, true, -4101926)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'School Board'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'Beaverton School District 48J, Oregon, US')),
       p.id, 'Director, Zone 6 (Chair)', 'OR', false, false, NULL
FROM essentials.districts d CROSS JOIN ins_p p
WHERE d.geo_id = '4101920' AND d.district_type = 'SCHOOL' AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```

**Post-verify DO block** — extend the `254`/`1107` pattern to assert BOTH districts independently:
```sql
DO $$
DECLARE v_bsd_gov INTEGER; v_hsd_gov INTEGER; v_bsd_off INTEGER; v_hsd_off INTEGER; v_split INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bsd_gov FROM essentials.governments WHERE name = 'Beaverton School District 48J, Oregon, US';
  SELECT COUNT(*) INTO v_hsd_gov FROM essentials.governments WHERE name = 'Hillsboro School District 1J, Oregon, US';
  IF v_bsd_gov <> 1 OR v_hsd_gov <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 gov each, found BSD=%, HSD=%', v_bsd_gov, v_hsd_gov;
  END IF;

  SELECT COUNT(*) INTO v_bsd_off FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
    WHERE d.geo_id='4101920' AND d.district_type='SCHOOL' AND d.state='or';
  SELECT COUNT(*) INTO v_hsd_off FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
    WHERE d.geo_id='4100023' AND d.district_type='SCHOOL' AND d.state='or';
  IF v_bsd_off <> 7 OR v_hsd_off <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 7 offices each, found BSD=%, HSD=%', v_bsd_off, v_hsd_off;
  END IF;

  SELECT COUNT(*) INTO v_split FROM essentials.geofence_boundaries gb
    WHERE gb.geo_id IN ('4101920','4100023') AND gb.mtfcc='G5420'
      AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id=gb.geo_id AND d.district_type='SCHOOL' AND d.state='or');
  IF v_split <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: BSD gov=%/off=%, HSD gov=%/off=%, split_orphans=%',
    v_bsd_gov, v_bsd_off, v_hsd_gov, v_hsd_off, v_split;
END $$;
```

**Ledger registration (OUTSIDE transaction):**
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1203', 'or_westmetro_school_boards_wave1')
ON CONFLICT (version) DO NOTHING;
```

### Pattern 3: Verified Rosters (both 7/7, no vacancies, live-confirmed 2026-07-04)

**Beaverton SD 48J** (source: `beaverton.k12.or.us/school-board/board-members`, raw HTML curl — no WAF):

| Zone | Name (honorific dropped per credential-drop precedent) | Title on seat | Term Expires | Headshot filename (finalsite) |
|------|------|---------------|--------------|-------------------------------|
| 1 | Van Truong *(site spelling: "Vân Truong" — Vietnamese circumflex, UTF-8 required)* | Director, Zone 1 | 6-30-2029 | `van_Truong.jpg` |
| 2 | Karen Pérez | Director, Zone 2 | 6-30-2029 | `Karen-2.jpg` |
| 3 | Melissa Potter | Director, Zone 3 (Vice Chair) | 6-30-2027 | `MelissaPotterheadshot.jpg` |
| 4 | Sunita Garg | Director, Zone 4 | 6-30-2029 | `Sunita-2.jpg` |
| 5 | Syed Qasim | Director, Zone 5 | 6-30-2029 | `Syed_Qasim.jpg` |
| 6 | Justice Rajee | Director, Zone 6 (Chair) | 6-30-2027 | `JusticeRageeHeadshot.jpg` |
| 7 | Tammy Carpenter | Director, Zone 7 | 6-30-2027 | `TammyCarpenterHeadshot.jpg` |

Election language (verbatim, both instances found on the page): *"Though candidates are nominated from the Board Zone they live in, voters in the District elect them at-large."* No student rep, no vacancies. Both "Dr." honorifics dropped on Truong/Pérez/Potter/Carpenter per the `254`/LAUSD credential-drop precedent (store legal name, not academic title).

**Hillsboro SD 1J** (source: `hsd.k12.or.us/about-us/board-of-directors/board-members`, raw HTML curl — no WAF):

| Position | Name | Title on seat | Served Since | Term Ends | Headshot filename (finalsite) |
|----------|------|---------------|--------------|-----------|-------------------------------|
| 1 | Yessica Hardin Mercado | Director, Position 1 | 2025 | 2029 | `Yessica-Hardin-Mercado-256x230px.jpg` |
| 2 | Mark Watson | Director, Position 2 | 2017 | 2029 | `MarkWatson_sm2.jpg` |
| 3 | Nancy Thomas | Director, Position 3 | 2021 | 2029 | `NancyThomas_bbgrd_sm2.jpg` |
| 4 | See Eun Kim | Director, Position 4 (Vice Chair) | 2019 | 2027 | `seeeunkim_sm3.jpg` |
| 5 | Ivette Pantoja | Director, Position 5 (Chair) | 2023 | 2027 | `ivettepantojo_sm2.jpg` |
| 6 | Katie Rhyne | Director, Position 6 | 2025 | 2029 | `Katie-Rhyne-256x230px.jpg` |
| 7 | Patrick Maguire | Director, Position 7 | 2022 | 2027 | `patrickmaguire_sm2.jpg` |

**EXCLUDE (D-R4, non-voting student representatives, images present on the same page but not directors):** Ethan Hernandez Jimenez, Keeton Sayre, Ma'Kaia Woods — all labeled "Student Representative to the Board" on the page, served-since 2026. **Also exclude** Board Secretary Rose Roman (referenced in a search snippet as district staff contact, not an elected/appointed director — not found on the board-members roster page itself).

[VERIFIED: raw `curl` of both pages 2026-07-04, HTTP 200 with no User-Agent required; every name, position/zone number, and headshot filename extracted directly from the pages' own HTML `data-image-sizes` JSON and text content, cross-checked against Ballotpedia for Hillsboro's election-method description]

### Pattern 4: Office-title convention — confidence caveat

- **Beaverton "Director, Zone N" — HIGH confidence.** Confirmed not just on the board-members page but independently in official Washington/Multnomah County election-filing document titles found via WebSearch: *"Beaverton School District 48J, Director, Zone 3 (Vote for 1)"* — this is the district's own statutory filing language, not a researcher inference.
- **Hillsboro "Director, Position N" — MEDIUM confidence.** The district's own board-members page shows only "Position: N" as a field (no "Director" word used in the UI), and Ballotpedia's page-naming convention calls seats "school board Position N." The "Director" prefix is inferred from (a) Oregon ORS 332 statutory language calling school board members "directors," (b) the parallel Beaverton filing convention, and (c) the PDF meeting-packet header found via WebSearch: *"HILLSBORO SCHOOL DISTRICT 1J BOARD OF DIRECTORS."* **Recommend Wave-0 do one more confirmation** — pull an actual Washington County candidate-filing PDF for a Hillsboro seat (same document type that confirmed Beaverton's wording) before locking the title string, OR accept "Director, Position N" as the reasonable, well-supported convention if a filing PDF isn't quickly found.
- **Chamber legal names ("School Board" / "Board of Directors") — MEDIUM confidence.** Both are the primary self-identifying terms found in each district's own site navigation/URL structure and document headers (Beaverton: page title "Current Board Members - Beaverton School District", page heading "School Board"; Hillsboro: URL path `/board-of-directors/`, PDF header "HILLSBORO SCHOOL DISTRICT 1J BOARD OF DIRECTORS"). This is a **deliberate deviation from the `254_or` precedent's uniform "Board of Education"** naming, in favor of verbatim per-district naming per D-R1/D-R2. Recommend Wave-0 do a final visual confirmation of the exact letterhead term used in a recent board meeting agenda for each district if maximum precision is wanted, but the evidence gathered this session is sufficient to proceed with these names.

### Anti-Patterns to Avoid

- **Assuming Beaverton needs sub-zone geofences** — it does NOT. The D-Z1 zone-voted branch does not fire for either district (see Key Finding 1). Do not build LAUSD-style sub-district geofences for either board.
- **Reusing "Board of Education" as the chamber name for both districts** — that was a `254_or` researcher convenience for 6 *different* districts, not each district's verbatim name. Use "School Board" (Beaverton) and "Board of Directors" (Hillsboro) per the live-verified naming above.
- **Seeding the 3 Hillsboro student representatives as directors** — they are explicitly labeled "Student Representative to the Board," non-voting, and out of scope (D-R4).
- **Running a new G5420 TIGER loader** — both geofences already exist and are valid (Phase 174). Any new loader work for these two geo_ids would create a duplicate-source collision risk.
- **Uppercase `d.state='OR'` in office/district WHERE clauses** — the standing OR/NV silent-failure pitfall. District join keys are lowercase `'or'`; `governments.state`/`offices.representing_state` are uppercase `'OR'`.
- **Bare `python`/`python3` invocation on this machine** — resolves to a non-functional Windows Store stub. Use the `py` launcher for the headshot pipeline script.
- **Fabricating a title for the two Chair/Vice-Chair seats as separate offices** — they are titles on existing director seats (Rajee Z6, Potter Z3 for Beaverton; Pantoja P5, Kim P4 for Hillsboro), not extra rows. 7 offices per district, not 8 or 9.
- **Dropping the diacritics on Vân Truong / Karen Pérez** — save the migration file as UTF-8, matching the `254_or` Reynolds/David Douglas ñ/é precedent.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| School-district government/chamber/district/office structure | New schema inference | Copy `254_or_school_districts.sql` shape (single shared SCHOOL district, `WITH ins_p AS (...) INSERT INTO offices`) | Proven idempotent pattern across 6 OR + 1 NV school-district phases |
| Headshot download + crop + resize + upload | Manual one-off PIL script | Adapt `_tmp-cornelius-headshots.py` (crop-4:5-first, Lanczos 600×750 q90, x-upsert, RGBA→white-composite) | Battle-tested across every deep-seed phase 176–182; both target sites are clean (no WAF), so the fallback-chain logic in the script can be a no-op this phase |
| Government INSERT guard | Unique-constraint assumption | `WHERE NOT EXISTS (... WHERE name = ...)` | `essentials.governments` has no unique constraint |
| Coverage.js school-district entry | New surfacing shape | Copy the existing `COVERAGE_SCHOOL_DISTRICTS` CCSD entry verbatim (`{label, browseGeoId, browseMtfcc, browseStateAbbrev}`, no `hasContext`) | Exact template already in the file at `src/lib/coverage.js:253-255` |

**Key insight:** This phase is the *lightest* deep-seed unit in the entire v20.0 milestone — no geofence loader, no WAF workaround, no zone sub-districting, and no stance research. The only genuinely new work is the 14-row roster CTE block and the coverage.js append; everything else is a verbatim structural copy of `254_or_school_districts.sql`.

---

## Common Pitfalls

### Pitfall 1: Assuming Beaverton is zone-voted (per the CONTEXT.md's stated assumption)
**What goes wrong:** Planner builds sub-zone geofence tasks for Beaverton that are unnecessary and will stall on "no official machine-readable zone GIS" (D-Z2), burning a wave on work the success criteria don't need.
**Why it happens:** The CONTEXT.md explicitly states "Beaverton SD 48J uses zones — this branch is REAL for Beaverton, not theoretical" — this was an assumption made before live verification.
**How to avoid:** Trust this research's live verification: Beaverton's own site states voters district-wide elect every zone seat. Model as a single whole-district SCHOOL district exactly like Hillsboro and every existing OR precedent.
**Warning signs:** Any task file mentioning "Beaverton zone geofence" or "sub-district GIS lookup" should be flagged for review.

### Pitfall 2: `d.state='OR'` uppercase in WHERE clauses
**What goes wrong:** Zero rows match, 0 offices link, section-split fires.
**Why it happens:** Copy-paste from `governments.state`/`offices.representing_state` (uppercase 'OR') without noticing districts use lowercase.
**How to avoid:** `districts.state = 'or'` lowercase everywhere in JOIN/WHERE; `'OR'` uppercase only on `governments.state` and `offices.representing_state`.
**Warning signs:** Post-verify DO block raises "expected 7 offices, found 0."

### Pitfall 3: Bare `python`/`python3` invocation
**What goes wrong:** Headshot script fails immediately with "Python was not found; run without arguments to install from the Microsoft Store."
**Why it happens:** Windows App Execution Alias stubs shadow the real interpreter for `python`/`python3` on this machine.
**How to avoid:** Invoke the headshot script with the `py` launcher (`py script.py`), confirmed functional with Pillow/psycopg2/requests all importable.
**Warning signs:** Any Bash tool call to a headshot script silently exits with the Microsoft Store message instead of running.

### Pitfall 4: Seeding Hillsboro's 3 student representatives as directors
**What goes wrong:** Chamber ends up with 10 offices instead of 7; post-verify office-count gate fails or (worse) silently passes with a wrong count if the gate isn't tight.
**Why it happens:** Their headshot images sit in the same page markup as the 7 real directors and are easy to sweep up in a bulk image-URL extraction.
**How to avoid:** Filter by the "Student Representative to the Board" label / lack of a "Position: N" field before building the roster CTE list.
**Warning signs:** Roster count > 7 for Hillsboro during Wave-0 confirmation.

### Pitfall 5: Reusing "Board of Education" for both chambers
**What goes wrong:** Chamber name doesn't match either district's own self-identifying term, contradicting D-R1's verbatim requirement.
**Why it happens:** `254_or_school_districts.sql` used "Board of Education" uniformly for 6 *different* districts, and it's tempting to copy that string along with the rest of the migration shape.
**How to avoid:** Use "School Board" (Beaverton) and "Board of Directors" (Hillsboro) per this research's live findings.
**Warning signs:** Migration diff shows "Board of Education" for either district.

### Pitfall 6: Chambers auto-generated column / `politician_images` schema drift
**What goes wrong:** `slug` column included in an INSERT list (GENERATED ALWAYS — errors); or a `photo_origin_url` column referenced on `politician_images` (does not exist).
**Why it happens:** Copy-paste from an older, pre-schema-change migration.
**How to avoid:** `chambers` INSERT column list never includes the generated path/slug column; `politician_images` is exactly `(id, politician_id, url, type, photo_license)`.
**Warning signs:** SQL error on migration apply; or a grep of the migration finds `slug` in the INSERT column list.

---

## Code Examples

### Verified headshot source URLs (direct, no WAF, HTTP 200 confirmed 2026-07-04)

```
# Beaverton (7)
https://resources.finalsite.net/images/f_auto,q_auto/v1758746830/beavertonk12orus/nkbzzjp8k0c8xhmsgtkh/van_Truong.jpg
https://resources.finalsite.net/images/.../Karen-2.jpg          (Karen Pérez)
https://resources.finalsite.net/images/f_auto,q_auto/v1689276584/beavertonk12orus/qssf6ciotrwesh7bkqio/MelissaPotterheadshot.jpg
https://resources.finalsite.net/images/.../Sunita-2.jpg          (Sunita Garg)
https://resources.finalsite.net/images/f_auto,q_auto/v1757103853/beavertonk12orus/pus7aoeyu1hxrcuystpr/Syed_Qasim.jpg
https://resources.finalsite.net/images/.../JusticeRageeHeadshot.jpg  (Justice Rajee, Chair)
https://resources.finalsite.net/images/f_auto,q_auto/v1694210437/beavertonk12orus/wyhpt4fammntswwtaw2r/TammyCarpenterHeadshot.jpg

# Hillsboro (7)
https://resources.finalsite.net/images/f_auto,q_auto/v1751298869/hsdk12orus/oocvlh3zbemtkb8ao670/Yessica-Hardin-Mercado-256x230px.jpg
https://resources.finalsite.net/images/f_auto,q_auto/v1725555005/hsdk12orus/uqcmqlucd6gkd8tcbsi3/MarkWatson_sm2.jpg
https://resources.finalsite.net/images/f_auto,q_auto/v1724964142/hsdk12orus/lqahsd9oeakcsjy28ocp/NancyThomas_bbgrd_sm2.jpg
https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1724087027/hsdk12orus/hfoq86kp3ctc5tarbdnw/seeeunkim_sm3.jpg  (See Eun Kim, Vice Chair)
https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1724086901/hsdk12orus/esnie2smgzdotwyls1mn/ivettepantojo_sm2.jpg  (Ivette Pantoja, Chair)
https://resources.finalsite.net/images/f_auto,q_auto/v1759439288/hsdk12orus/x8z71d0yohinjwguk53i/Katie-Rhyne-256x230px.jpg
https://resources.finalsite.net/images/f_auto,q_auto/v1724087002/hsdk12orus/qkp73x7gfwq1no3rwiyd/patrickmaguire_sm2.jpg
```
Note: several Hillsboro filenames carry `_sm`/`256x230px` suffixes suggesting small source resolution (likely well under 600×750) — expect upscaling for at least Kim, Pantoja, Watson, Thomas per the `t_image_size_1` (256px) variant; try the larger `f_auto,q_auto` (no size suffix) variant first as shown above, which serves the CDN's largest cached rendition.

### Migration ledger check (re-run at Wave-0)

```bash
ls C:/EV-Accounts/backend/migrations | grep -oE '^[0-9]+' | sort -n | tail -1
# Confirmed 2026-07-04: 1202 → next = 1203
```

### External_id collision probe (re-run at Wave-0)

```sql
SELECT external_id FROM essentials.politicians
WHERE external_id BETWEEN -4101930 AND -4101920
   OR external_id BETWEEN -4100030 AND -4100020
ORDER BY external_id;
-- Confirmed 2026-07-04: 0 rows (both ranges fully free)
```
Recommended assignment: Beaverton `-4101921` (Zone 1) through `-4101927` (Zone 7); Hillsboro `-4100024` (Position 1) through `-4100030` (Position 7).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Phase 166 (CCSD): geofence had to be loaded THIS phase (NV had zero G5420 rows) | Phase 183: both geofences already loaded by Phase 174 | Phase 174 (2026-06-30) | No TS loader script needed — the lightest structural footprint in the milestone |
| `254_or_school_districts.sql` used a uniform "Board of Education" chamber name across 6 districts | This phase uses verbatim per-district names ("School Board" / "Board of Directors") | Phase 183 research (this session) | More accurate to each district's actual self-identification; slight departure from blanket reuse |
| CONTEXT.md assumption: Beaverton is zone-voted, Hillsboro is at-large | Live verification: BOTH are whole-district at-large (zones/positions are residency/numbering only) | Phase 183 research (this session) | D-Z2 (zone-voted-no-GIS fallback) never fires; single-G5420 whole-board modeling for both, matching every other OR school-district precedent |

**Deprecated/outdated:** The CONTEXT.md's framing of Beaverton as "the REAL, not theoretical" zone-voted case should be treated as superseded by this research's live verification.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Director, Position N" is the correct verbatim office title for Hillsboro (vs. some other convention like "Board Member, Position N") | Pattern 4 | Low functional risk (title string is display-only), but violates D-R2's verbatim requirement if wrong. Wave-0 can pull a Washington County candidate-filing PDF for a Hillsboro seat to lock this with the same confidence level achieved for Beaverton. |
| A2 | "School Board" (Beaverton) / "Board of Directors" (Hillsboro) are each district's own verbatim legal chamber name, not just a website navigation label | Pattern 2, Pattern 4 | Low risk — even if a more formal legal term exists (e.g., "Board of Education" per ORS default terminology), the chosen names are directly sourced from each district's own site structure/documents, a stronger evidentiary basis than the `254_or` precedent had. |
| A3 | The `t_image_size_1`/`_sm` suffixed Hillsboro images (Kim, Pantoja, Watson, Thomas, Hardin-Mercado, Rhyne, Maguire) will need upscaling to reach 600×750 without visible quality loss | Code Examples | If source resolution is too low, Wave-2 headshot execution documents a genuine partial-quality gap rather than fabricating detail — consistent with D-R5's "no fabrication" rule. |
| A4 | Rose Roman (mentioned only in a search-engine snippet as "Board Secretary" contact) is administrative staff, not an elected/appointed director, and should be excluded | Pattern 3 | Low risk — she does not appear anywhere on the actual board-members roster page (7 named directors only), so this is a straightforward exclusion, not a judgment call. |

---

## Open Questions (RESOLVED)

> Both questions below are operationally resolved by the plans: Plan 183-01 Task 2 locks
> "Director, Position N" as the non-blocking default with a Wave-0 confirmation pass, and
> Plan 183-03 implements the document-gap-don't-fabricate fallback per D-R5.

1. **Exact verbatim confirmation of Hillsboro's office-title convention ("Director, Position N")**
   - What we know: Ballotpedia + the district's own site confirm "Position N" numbering; ORS 332 + the parallel Beaverton filing convention support the "Director" prefix.
   - What's unclear: Whether an official Washington County candidate-filing document (the same document type that confirmed Beaverton's exact wording) would show a different phrasing.
   - Recommendation: Wave-0 does one more targeted search/fetch of a Washington County school-board candidate filing PDF for a Hillsboro seat (parallel to the `multco.us/file/2023-05_beaverton_sd.pdf` document type found this session); if not found quickly, proceed with "Director, Position N" as the well-supported default.

2. **Low-resolution Hillsboro headshot sources**
   - What we know: several filenames suggest small (256×230px or smaller) source images.
   - What's unclear: exact pixel dimensions until the headshot script downloads and inspects each file.
   - Recommendation: Wave-2 execution downloads the largest available finalsite CDN rendition (the `f_auto,q_auto` variant with no explicit width suffix, which serves the source's native/largest size) before falling back to any Ballotpedia/Wikimedia alternative; document any genuine sub-600×750 gap honestly per D-R5 rather than fabricating detail via aggressive upscaling.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql | Migration apply | ✓ | PostgreSQL 18.1 | — |
| `py` launcher (Python) | Headshot pipeline | ✓ | Python 3.14.3 via `py`, NOT bare `python`/`python3` | Use `py` explicitly |
| Pillow (PIL) | crop-4:5 → 600×750 Lanczos q90 | ✓ | 12.1.1 | — |
| psycopg2 | DB UUID resolution | ✓ | 2.9.12 | — |
| requests | HTTP fetch of headshot images | ✓ | 2.34.2 | — |
| beaverton.k12.or.us | Roster + headshots (Beaverton) | ✓ | HTTP 200, no WAF, no UA needed | — |
| hsd.k12.or.us | Roster + headshots (Hillsboro) | ✓ | HTTP 200, no WAF, no UA needed | — |
| resources.finalsite.net (CDN) | All 14 headshot images | ✓ | HTTP 200 for every URL tested | — |
| G5420 geofences (Beaverton/Hillsboro) | District routing | ✓ | Loaded + valid, Phase 174 | — |
| DATABASE_URL + service key | Migration + Storage | ✓ | `C:/EV-Accounts/backend/.env` | — |

**Missing dependencies with no fallback:** None. This is the cleanest environment-availability picture of any phase in the milestone — both official sites are unblocked and every headshot resolves directly.

---

## Validation Architecture

> `workflow.nyquist_validation` absent from `.planning/config.json` — treated as enabled. Data-seed phase: verification is SQL/HTTP gates + address-routing smoke tests, not a unit-test suite. Mirrors Phase 166/174's pattern, simplified (no new geofence loader to smoke-test — Phase 174's `smoke-or-westmetro-school.ts` already covers routing for both geo_ids).

### Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Inline SQL gates (`psql -f` / `psql -c`) + reuse of existing `npx tsx scripts/smoke-or-westmetro-school.ts` |
| Config file | none — ad-hoc scripts (project deep-seed convention) |
| Quick run command | `npx tsx scripts/smoke-or-westmetro-school.ts` (already asserts routing for BOTH geo_ids from Phase 174 — no changes needed, just re-run to confirm no regression) |
| Full suite command | Inline ~9-check E2E SQL/HTTP verification (see below) |
| Estimated runtime | ~20 seconds |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Automated Command | File Exists |
|-----|----------|-----------|-------------------|-------------|
| WSCH-01 | Beaverton SD 48J: 7 offices on the SCHOOL district | SQL gate | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id='4101920' AND d.district_type='SCHOOL' AND d.state='or'` = 7 | ❌ W0 |
| WSCH-01 | Beaverton address routes to the correct board | smoke | `smoke-or-westmetro-school.ts` (existing, Phase 174) — re-run, no change needed | ✅ (Phase 174) |
| WSCH-01 | 7 headshots (or documented gaps) | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -4101927 AND -4101921` (target 7 minus documented gaps) | ❌ W0 |
| WSCH-02 | Hillsboro SD 1J: 7 offices on the SCHOOL district | SQL gate | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE d.geo_id='4100023' AND d.district_type='SCHOOL' AND d.state='or'` = 7 | ❌ W0 |
| WSCH-02 | Hillsboro address routes to the correct board | smoke | `smoke-or-westmetro-school.ts` (existing, Phase 174) | ✅ (Phase 174) |
| WSCH-02 | 7 headshots (or documented gaps); 0 student reps seeded | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -4100030 AND -4100024` (target 7 minus gaps); manual name check excludes Hernandez Jimenez/Sayre/Woods | ❌ W0 |
| — | 0 section-split for both geo_ids | SQL gate | Section-split scan for `4101920` and `4100023` G5420 = 0 orphan rows | ❌ W0 |
| — | 0 compass stance rows (success state) | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -4101927 AND -4101921 OR p.external_id BETWEEN -4100030 AND -4100024` = 0 | ❌ W0 |
| — | Coverage.js has both entries, no `hasContext` | manual | Inspect `src/lib/coverage.js`; browse both `?browse_geo_id=...&browse_mtfcc=G5420` links | ❌ W0 manual |
| — | Casing correct | SQL gate | `SELECT DISTINCT state FROM essentials.districts WHERE geo_id IN ('4101920','4100023')` = `'or'` only | ❌ W0 |

### Sampling Rate
- **After structural migration 1203:** office-count, section-split, casing, smoke-routing checks
- **After headshot migration 1204:** headshot-count check
- **Phase gate:** all checks green + 0-stance-rows check + coverage.js manual browse-verify before `/gsd:verify-work`

### Wave 0 Requirements
- [ ] On-disk migration MAX re-confirm: `ls C:/EV-Accounts/backend/migrations | grep -oE '^[0-9]+' | sort -n | tail -1` (confirmed 1202 this session → next 1203)
- [ ] External_id collision re-probe: `-4101921..-4101927` and `-4100024..-4100030` both 0 rows (confirmed this session)
- [ ] No pre-existing governments: `SELECT COUNT(*) FROM essentials.governments WHERE name IN ('Beaverton School District 48J, Oregon, US','Hillsboro School District 1J, Oregon, US')` → 0 (confirmed this session)
- [ ] Geofence pre-check: both `4101920`/`4100023` G5420 rows exist with valid geometry (confirmed this session — do NOT re-load)
- [ ] Re-verify both district sites still return HTTP 200 with no WAF at execution time (sites can change between research and execution)
- [ ] Re-confirm roster hasn't changed (unlikely — no May-2026 election has occurred yet for either board's next cycle; both rosters were live-pulled 2026-07-04)

### Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct-person headshots, no student reps seeded | WSCH-01/02 | Visual identity check | Browse a Beaverton address and a Hillsboro address; confirm 7 directors each, correct photos, Chair/Vice-Chair labels visible, no 8th/9th/10th row |
| Card subtitle shows district name | Both | Frontend render | Confirm "Beaverton School District 48J" / "Hillsboro School District 1J" (or the district-name heading) renders above each 7-member group — per this research's finding, this is expected to work automatically via `getAccordionKey`'s SCHOOL fallback, no code change |
| Coverage chip renders as plain (no purple stance-count chip) | Both | Frontend render | Visit `essentials.empowered.vote/results?browse_geo_id=4101920&browse_mtfcc=G5420` and `...browse_geo_id=4100023&browse_mtfcc=G5420` |

---

## Security Domain

> `security_enforcement` absent from config — treated as enabled. This phase is a pure backend data-seed (SQL migrations + a local headshot script); it introduces no new API endpoints, no new user-facing input surface, and no new authentication/authorization paths. The relevant ASVS categories are therefore largely not-applicable, consistent with every prior deep-seed phase in this milestone.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No new auth surface introduced |
| V3 Session Management | No | No new session surface introduced |
| V4 Access Control | No | Reuses existing RLS policies (`government_bodies`, `politician_images`, etc. already have public-read policies; migrations run via the existing DATABASE_URL service role, same as every prior deep-seed phase) |
| V5 Input Validation | N/A (indirect) | All inserted data is idempotent, parameterized SQL written by a human/agent from verified sources — no end-user input path exists for this data |
| V6 Cryptography | No | No new secrets or cryptographic material introduced |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| SQL injection via hardcoded migration strings | Tampering | Not applicable — migration SQL is static, authored and reviewed before apply, not built from runtime user input |
| Malicious headshot payload (image bomb / disguised executable) | Tampering | Existing pipeline validates via Pillow's image decode (fails closed on non-image content) before any Storage upload; both source domains (finalsite CDN) are the districts' own official asset hosts |
| Migration re-run causing duplicate rows | Tampering (data integrity) | Every INSERT uses `WHERE NOT EXISTS` / `ON CONFLICT DO NOTHING` idempotency guards, consistent with every prior phase |

---

## Sources

### Primary (HIGH confidence)
- Live DB query 2026-07-04: `essentials.geofence_boundaries` — both `4101920`/`4100023` G5420 rows confirmed present, valid, correctly named
- Live DB query 2026-07-04: `essentials.governments`/`essentials.districts` — confirmed 0 pre-existing rows (greenfield) for both districts
- Live DB query 2026-07-04: `essentials.politicians` external_id collision probe — both ranges free
- Live DB query 2026-07-04: `essentials.government_bodies` — 0 rows for any OR school district (confirms the `government_body_name` empty-string finding)
- `curl` of production `POST https://accounts-api.empowered.vote/api/essentials/browse/by-area` (geo_id=4110040, mtfcc=G5420) 2026-07-04 — confirms live `government_body_name=""` for existing PPS board members, `chamber_name="Board of Education"`, `district_type="SCHOOL"`
- Raw `curl` of `beaverton.k12.or.us/school-board/board-members` 2026-07-04 — full 7-member roster, election-method language, 7 headshot URLs, HTTP 200 no-WAF
- Raw `curl` of `hsd.k12.or.us/about-us/board-of-directors/board-members` 2026-07-04 — full 7-member roster + 3 student-rep images, HTTP 200 no-WAF
- `.planning/phases/174-west-metro-school-district-geofences/174-01-SUMMARY.md` (read in full) — confirms geo_ids, source tag, smoke-test coverage
- `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` (read in full) — school-district structural shape template
- `C:/EV-Accounts/backend/migrations/1107_ccsd_board_of_trustees.sql` (read in full) — single-shared-district + post-verify DO block template
- `src/lib/groupHierarchy.js` and `src/pages/Results.jsx` (read in full) — subgroup-label rendering logic, confirms the card-subtitle finding
- `src/lib/coverage.js` (read) — `COVERAGE_SCHOOL_DISTRICTS` exact template
- `.planning/phases/166-ccsd-board-of-trustees-deep-seed/166-RESEARCH.md` (read in full) — school-board research shape precedent
- Live `ls C:/EV-Accounts/backend/migrations` 2026-07-04 — on-disk MAX = 1202
- `py -c "import PIL,psycopg2,requests"` 2026-07-04 — confirms working Python environment via the `py` launcher

### Secondary (MEDIUM confidence)
- WebSearch synthesis of Ballotpedia "Hillsboro School District, Oregon, elections" — at-large + Position-N election method
- WebSearch synthesis re: "Beaverton School District 48J, Director, Zone 3 (Vote for 1)" official election-filing document title (multco.us hosted PDF)
- WebSearch synthesis re: "HILLSBORO SCHOOL DISTRICT 1J BOARD OF DIRECTORS" PDF meeting-packet header

### Tertiary (LOW confidence)
- WebSearch synthesis mentioning "Board Secretary, Rose Roman" as a district staff contact — not independently verified beyond confirming she does not appear on the actual roster page (used only to justify exclusion, not to seed anyone)

---

## Metadata

**Confidence breakdown:**
- Geofence/greenfield status: HIGH — direct DB query, both geofences confirmed pre-loaded and valid
- Roster (14 members, 7+7): HIGH — both official sites live-verified via raw HTML curl, no WAF, cross-checked against Ballotpedia
- Election method (whole-district at-large for both, overturning the CONTEXT.md's Beaverton-zone-voted assumption): HIGH — verbatim language quoted directly from Beaverton's own site; Hillsboro confirmed via Ballotpedia + absence of any zone-residency language
- Schema/migration shape: HIGH — `254_or` + `1107` read in full, both directly applicable templates
- Card-subtitle rendering (no frontend change needed): HIGH — confirmed via live production API response + full code read of both `groupHierarchy.js` and `Results.jsx`
- Office-title convention (Beaverton "Director, Zone N"): HIGH — confirmed via official election-filing document title
- Office-title convention (Hillsboro "Director, Position N") and chamber legal names for both: MEDIUM — well-supported inference, recommend one more Wave-0 confirmation pass if maximum verbatim precision is wanted
- Headshot sourcing: HIGH — all 14 URLs directly found and confirmed HTTP 200, no fallback chain needed (cleanest headshot situation in the milestone)
- Environment availability: HIGH — every tool directly tested and confirmed working this session

**Research date:** 2026-07-04
**Valid until:** 2026-08-03 (30 days) — rosters stable until the next Oregon school-board election cycle (May 2027); headshot URLs/CDN paths could shift with a site redesign

---

## RESEARCH COMPLETE

**Phase:** 183 - School Boards Wave 1 — Beaverton SD 48J + Hillsboro SD 1J
**Confidence:** HIGH

### Key Findings

1. **CONTEXT.md's Beaverton zone-voted assumption is overturned by live verification.** Both districts are whole-district at-large (zones/positions are residency/numbering only, not voting boundaries) — the common ORS 332.118 shape. D-Z2 never fires; no sub-zone geofencing work of any kind this phase.

2. **No geofence work needed at all.** Both G5420 boundaries were already loaded and smoke-tested by Phase 174; confirmed live via direct DB query (valid geometry, correct names).

3. **Both rosters are fully confirmed, 7/7, no vacancies, no WAF.** Beaverton (Truong/Pérez/Potter-VC/Garg/Qasim/Rajee-Chair/Carpenter) and Hillsboro (Hardin Mercado/Watson/Thomas/Kim-VC/Pantoja-Chair/Rhyne/Maguire), plus 3 Hillsboro student reps that must be excluded. All 14 headshot URLs found directly in raw HTML and confirmed downloadable.

4. **The CONTEXT.md's flagged card-subtitle concern is a non-issue, but not for the stated reason.** Rule 3.5 does not actually cover `district_type='SCHOOL'`; the correct heading instead comes from `getAccordionKey`'s SCHOOL-specific `government_name` fallback, confirmed working today in live production data for Portland Public Schools. No frontend change needed.

5. **Chamber naming should deviate from the `254_or` "Board of Education" reuse** — verbatim per-district names ("School Board" for Beaverton, "Board of Directors" for Hillsboro) better satisfy D-R1/D-R2.

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Geofence/greenfield status | HIGH | Direct DB query |
| Roster + election method | HIGH | Live HTML curl, no WAF, cross-verified |
| Schema/migration shape | HIGH | Two full templates read |
| Card-subtitle rendering | HIGH | Live production API + full code read |
| Office-title/chamber-name exact verbatim strings | MEDIUM | Well-supported, one more confirmation pass recommended but not blocking |
| Headshot sourcing | HIGH | All 14 URLs directly confirmed |

### Open Questions
1. Hillsboro's exact office-title wording ("Director, Position N") — recommend one more filing-PDF confirmation at Wave-0, non-blocking.
2. A few Hillsboro headshot sources may be low-resolution — document any genuine gap rather than over-upscale.

### Ready for Planning
Research complete. The planner can write executable plans: (Wave 1) structural migration 1203 for both districts on the existing geofences; (Wave 2) headshot migration 1204 sourcing directly from both districts' finalsite CDN URLs; (Wave 3) coverage.js append + full E2E verification. No blocking unknowns; this is the lightest-effort phase in the v20.0 milestone.

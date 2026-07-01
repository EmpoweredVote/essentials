# Phase 176: City of Beaverton Deep-Seed — Research

**Researched:** 2026-07-01
**Domain:** Oregon municipal deep-seed — council-manager city, at-large council positions
**Confidence:** HIGH (form of government and roster: VERIFIED/CITED; headshot sourcing: MEDIUM/ASSUMED)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01/D-02:** Beaverton's council election structure must be ground-truthed from
  beavertonoregon.gov — resolved in this research (see §Form of Government below).
- **D-03:** Seeded result must produce no section-split and no empty LOCAL section.
- **D-04/D-05:** Mayor's role must be ground-truthed from the charter — resolved in
  this research (see §Mayor Modeling below).
- **D-06:** Seated roster + exact chamber/body name pulled verbatim from official sources.
- **D-07:** All live compass topics per official, one agent at a time, evidence-only,
  100% cited, honest blank spokes, zero default values.
- **D-08:** Headshots from beavertonoregon.gov; fallback Ballotpedia/Wikimedia; crop-
  to-4:5 then resize to 600x750 (Lanczos); no text/graphic overlays.
- **D-09:** Add Beaverton to Oregon block of `src/lib/coverage.js` COVERAGE_STATES
  with `{ label: 'Beaverton', browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true }`.

### Claude's Discretion

- External_id block for Beaverton officials (non-colliding OR city range).
- Next migration number (estimate 1131 — disk MAX is 1130; confirm in Wave-0).
- Whether council offices carry a free-text seat label for display clarity (recommended:
  "Council Position N" per city display convention).

### Deferred Ideas (OUT OF SCOPE)

- Other west-metro cities (Hillsboro 177, Tigard 178, Tualatin 179, Forest Grove 180,
  Sherwood 181, Cornelius 182).
- School boards (Phases 183-184); 2026 elections + discovery (Phase 185).
- Beaverton appointed boards/commissions and city-manager staff.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WASH-02 | City of Beaverton deep-seeded (Mayor + Council) — government + roster + headshots + evidence-only stances. Form of government verified at plan time. | Fully resolved: at-large council-manager form confirmed; directly-elected Mayor confirmed; 7-seat roster verified; headshot sources identified; structural migration shape established. |

</phase_requirements>

---

## Summary

Beaverton adopted a new city charter in the May 2020 primary (Measure 34-298), converting from a
**strong-mayor** form to a **council-manager** form. The chartered government consists of a
directly-elected Mayor (city-wide at-large, 4-year term) and six Councilors elected at-large to
six numbered positions (1-6). All seven offices are city-wide — there are **no geographic
wards or districts**. The City Manager (appointed by the council) handles day-to-day operations.

This resolves the central D-01/D-02 planning decision: **no custom X00xx ward geofences are
needed**. All seven officials (Mayor + 6 Councilors) link to the existing city geo_id 4105350
via a single LOCAL_EXEC district (Mayor) and a shared LOCAL district (all 6 Councilors) — the
same at-large pattern used for Gresham in migration 246.

**IMPORTANT 2026 ELECTION NOTE:** The May 19, 2026 primary filled Positions 2 and 5
(incumbents Teater and Dugger re-elected). Position 1 (Ashley Hartmeier-Prigg, running for
Oregon House) is heading to a **November 2026 runoff** between Rachel Philip (48.4%) and
Evelyn Kocher (33.9%) — results not certified until ~June 15-25. Seed with the **incumbent
roster that is in office on seed date (2026-07-01)**: Position 1 is still Ashley Hartmeier-Prigg
until January 2027. Plan execution must flag this in a Wave-0 verification.

**Primary recommendation:** Seed as pure at-large, no wards. Government name `'City of
Beaverton, Oregon, US'`, chamber `'City Council'`. Mayor office on LOCAL_EXEC district,
6 councilor offices on shared LOCAL district — all geo_id 4105350. Choose ext_id block
-4105351..-4105357 (unused range, see §Ext_id below). Start structural migration at 1131
(disk MAX = 1130; confirm in Wave-0).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| City government row | Database / Storage | — | Migration 1131 inserts into essentials.governments |
| Chamber row | Database / Storage | — | Single 'City Council' chamber, official_count=7 |
| Mayor office (LOCAL_EXEC) | Database / Storage | — | Citywide at-large, links to LOCAL_EXEC district |
| Council offices (LOCAL) | Database / Storage | — | All 6 on shared LOCAL district, city-wide |
| Official headshots (600x750) | Database / Storage | CDN | politician_images rows + Supabase Storage |
| Compass stances | Database / Storage | — | inform.politician_answers rows, evidence-only |
| Frontend surfacing | Frontend Server (SSR) | CDN | coverage.js Oregon block, purple hasContext chip |
| Address routing | API / Backend | — | PIP query against G4110 geofence, no ward layer |

---

## Form of Government — RESOLVED

**D-01 DETERMINATION: AT-LARGE, BY POSITION NUMBER. NO WARDS.**

[CITED: Charter Art. 5 beaverton.municipal.codes/Charter/5] The City of Beaverton is governed
under a **council-manager charter** adopted by voters in May 2020. The key provisions:

- **Mayor:** Directly elected at-large, city-wide, 4-year term. The Mayor is a **voting member
  of the council** (council-manager model — the Mayor is NOT a standalone executive). The Mayor
  chairs council meetings and has a public role, but the City Manager runs administration.
- **City Council:** 6 Councilors, each elected to a numbered **Council Position (1-6)**, all
  elected **at-large city-wide** (no geographic districts, no wards). 4-year staggered terms:
  Positions 1, 2, 5 elected in even years starting 2022; Mayor, Positions 3, 4, 6 elected in
  even years starting 2024.
- **Staggered election schedule:**
  - 2022: Positions 1, 2, 5 (+ special/vacancy fills)
  - 2024: Mayor, Positions 3, 4, 6
  - 2026: Positions 1, 2, 5 (current cycle — see election note above)

[CITED: search result from oregonstateauthority.com + Beaverton Valley Times coverage]
"The council is comprised of a mayor and six councilors nominated and elected from the city
at large."

**D-02 ROUTING BRANCH: NO NEW GEOFENCES.** Every Beaverton address returns Mayor (LOCAL_EXEC)
+ all 6 Councilors (LOCAL). This is identical to Gresham (migration 246) and Boulder City
(migration 1100). No X00xx ward-geofence ingest is needed.

---

## Mayor Modeling — RESOLVED

**D-04 DETERMINATION: DIRECTLY ELECTED, BUT NOT A SEPARATE LOCAL_EXEC IN THE STRONG-MAYOR SENSE.**

This is a subtle distinction. Beaverton's Mayor is:
- **Directly elected** by voters (not rotational, not council-selected)
- **Votes on the council** as a member (unlike a pure executive mayor)
- **Chairs council meetings** and is the public face of the city
- **Does NOT run operations** — the City Manager does

The correct seeding model (following the Gresham/246 precedent for OR directly-elected mayors
in council-manager cities): seed the Mayor on a **LOCAL_EXEC** district, `is_appointed_position=false`,
`role_canonical=NULL`. This places Mayor first in groupHierarchy display ordering. Do NOT use a
separate chamber for the Mayor — one `'City Council'` chamber covers all 7 seats.

[VERIFIED pattern: migration 246 `'Mayor', 'OR', false, false, NULL` on LOCAL_EXEC district for
Gresham Mayor Travis Stovall — same council-manager form.]

**Comparison with LA-area mis-seeds:** Norwalk/Bellflower LOCAL_EXEC mis-seeds were for
**rotational mayors** (title on council seat, no separate election). Beaverton's Mayor IS
separately elected — LOCAL_EXEC is CORRECT here.

---

## Live Roster — VERBATIM (as of 2026-07-01)

**Official body name:** `City Council` (chamber name); `Beaverton City Council`
(name_formal). Confirmed from beavertonoregon.gov navigation structure
showing positions labeled "Mayor of Beaverton" and "Council Position 1" through
"Council Position 6". [CITED: https://www.beavertonoregon.gov/789/City-Council]

**Government name:** `City of Beaverton, Oregon, US` (following the OR city pattern
from migration 246: `'City of Gresham, Oregon, US'`)

**Current seated roster (confirmed incumbent as of 2026-07-01):**

| Title | Name | Position | Notes |
|-------|------|----------|-------|
| Mayor | Lacey Beaty | Mayor | Directly elected 2020 (first female mayor); re-elected 2024 unopposed; term Jan 2025-Dec 2028 |
| Councilor | Ashley Hartmeier-Prigg | Position 1 | Elected 2021 (vacancy fill); re-elected 2022; NOT seeking re-election 2026 (running for OR House HD-27); term expires Dec 2026. SEATED until January 2027 — seed her. |
| Councilor | Kevin Teater | Position 2 | Elected 2022; re-elected May 2026 (72.6%); term Jan 2027-Dec 2030 |
| Councilor | Edward Kimmi | Position 3 | Elected 2022; re-elected 2024 unopposed; also serves as Council President (rotational title — do NOT give him a separate office for this) |
| Councilor | Allison Tivnon | Position 4 | Elected 2020 (initially), then 2024 unopposed |
| Councilor | John Dugger | Position 5 | Appointed Sept 2022; won 2022 election; re-elected May 2026 (78.4%); term Jan 2027-Dec 2030 |
| Councilor | Nadia Hasan | Position 6 | Elected 2020; re-elected 2024 |

**Total officials to seed:** 7 (Mayor + 6 Councilors)
**official_count on chamber:** 7

**Sources:**
- [CITED: beavertonresourceguide.com/about-beaverton/] — confirmed roster with names
- [CITED: beavertonvalleytimes.com — 2022 and 2024 election coverage + 2026 primary results]
- [CITED: en.wikipedia.org/wiki/Lacey_Beaty] — Mayor details
- [CITED: beavertonvalleytimes.com/2022/08/31/kimmi-dugger-sworn-in] — Kimmi (Pos 3) and Dugger (Pos 5) confirmed

**PLAN-TIME VERIFICATION REQUIRED (Wave-0):**
1. Confirm Ashley Hartmeier-Prigg is still the seated Position 1 holder (her term runs to
   end of 2026; she was not replaced early). Check beavertonoregon.gov/council-position-1.
2. Confirm Position 1 November runoff has NOT been resolved before seed date (as of
   2026-07-01, certification is pending ~June 25; she remains seated regardless).
3. Verify Edward Kimmi's "Council President" title is a rotational designation — not a
   separate office. Do NOT create a separate row; title='Councilor (Position 3)' is correct.

---

## Headshot Sources

beavertonoregon.gov uses **CivicPlus** as CMS. Individual council position pages serve headshot
images via `content.civicplus.com/api/assets/{UUID}?width=N&mode=min`. The UUID is embedded
in page `<link>` preload headers — fetchable via curl HEAD requests on each position page
without WAF blocking (confirmed HTTP 200, no auth required).

**Note:** All 7 position pages (mayor, council-position-1 through council-position-6) currently
share the same hero/banner image UUID `8f3b9429-373c-42f4-a76f-19dbe2f1cb7a` in the preload
header — this is the page background, NOT member headshots. The actual member portrait is
embedded deeper in page body via JavaScript-rendered HTML. [ASSUMED: executor will need to
curl the full page body or inspect page source to find per-member portrait UUIDs — same
CivicPlus UUID pattern applies.]

**Per-official headshot sourcing strategy:**

| Official | Primary Source | Fallback | Notes |
|----------|---------------|---------|-------|
| Lacey Beaty (Mayor) | beavertonoregon.gov/mayor | Wikimedia Commons | Wikimedia: `commons.wikimedia.org/wiki/File:Mayor_Lacey_Beaty_crop.jpg` — CC BY 2.0, 1000x1400px, Oregon National Guard photo. Excellent quality. [CITED] |
| Ashley Hartmeier-Prigg (Pos 1) | beavertonoregon.gov/council-position-1 | Campaign site / Ballotpedia | She is running for OR House; may have press photos at ashleyhartmeierprigg.com [ASSUMED] |
| Kevin Teater (Pos 2) | beavertonoregon.gov/council-position-2 | Ballotpedia 2026 candidate page | Confirmed Ballotpedia page exists [CITED: ballotpedia.org/Kevin_Teater_(Beaverton_City_Council_Position_2...)] |
| Edward Kimmi (Pos 3) | beavertonoregon.gov/council-position-3 | edwardkimmi.com (confirmed exists) | [ASSUMED] campaign site may have press photo |
| Allison Tivnon (Pos 4) | beavertonoregon.gov/council-position-4 | tivnonforbeaverton.com | [ASSUMED] campaign site confirmed exists |
| John Dugger (Pos 5) | beavertonoregon.gov/council-position-5 | Ballotpedia 2026 candidate page | Confirmed Ballotpedia page exists [CITED: ballotpedia.org/John_Dugger_(Beaverton_City_Council_Position_5...)] |
| Nadia Hasan (Pos 6) | beavertonoregon.gov/council-position-6 | nadiaforbeaverton.com | [CITED: campaign site confirmed] |

**Photo license:** For official city website photos: `press_use` (us_government_work pattern
from OR city precedents). For Wikimedia CC BY 2.0 (Beaty): use `cc_by_2.0`. For Ballotpedia:
`press_use` (Ballotpedia sourced from campaigns). [ASSUMED: license assignment pending
confirming actual source per official.]

**WAF status:** beavertonoregon.gov responds HTTP 200 to curl HEAD — NO WAF blocking
observed. [VERIFIED: curl -s -I confirmed 200 OK with CivicPlus CMS headers.] Full page
body fetch (curl with -A header) is expected to work to retrieve portrait UUIDs.

**No-photo gaps:** [ASSUMED] No official is expected to have zero online presence; all 7
have served publicly. Genuine gaps documented at execution if none found.

---

## Migration / Schema Technical Reference

### Next Migration Number

Disk MAX on 2026-07-01 is **1130** (`1130_seed_nc_2026_house_candidates.sql`). [VERIFIED: ls migration dir]
**Next available: 1131.** Confirm DB ledger MAX matches in Wave-0 (db MAX may differ if
unregistered stance migrations consumed numbers — stance migrations do NOT register in
schema_migrations, so disk counter is authoritative).

**Migration split for this phase:**
- `1131_beaverton_city_council.sql` — structural (registered in schema_migrations)
- `1132_beaverton_headshots.sql` — audit-only (NOT registered)
- `1133_beaty_stances.sql` through `1139_hasan_stances.sql` — 7 stance migrations,
  audit-only (one per official, NOT registered)

Total: 1 structural + 1 headshots + 7 stance = 9 migrations consumed (1131-1139).

### Ext_id Block

**Recommended range: -4105351 to -4105357** (7 slots: Mayor + 6 Councilors).

Rationale: Derived from geo_id `4105350` by appending offset digits — same pattern
used for Gresham (-4131251..-4131257), Troutdale (-4174851..-4174857), etc. in mig 246.
[VERIFIED: grep of migrations 244/246/231 confirmed these ranges; -4105350-based range
is unused.]

Existing OR ext_id blocks in use:
- `-410001` — Multnomah Chair; `-410010..-410013` — Multnomah commissioners (mig 244)
- `-410100` — WashCo Chair; `-410110..-410113` — WashCo commissioners (mig 1120)
- `-690001..-690021` — Portland officials (mig 231)
- `-4131251..-4131257` — Gresham (mig 246)
- `-4174851..` — Troutdale (mig 246)
- etc.

**Assignment suggestion:**
| Official | ext_id |
|----------|--------|
| Mayor Lacey Beaty | -4105351 |
| Councilor Hartmeier-Prigg (Pos 1) | -4105352 |
| Councilor Teater (Pos 2) | -4105353 |
| Councilor Kimmi (Pos 3) | -4105354 |
| Councilor Tivnon (Pos 4) | -4105355 |
| Councilor Dugger (Pos 5) | -4105356 |
| Councilor Hasan (Pos 6) | -4105357 |

Wave-0 must run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4105360 AND -4105350` to confirm range is clean.

### Schema Shapes (confirmed from mig 244/246/231)

```sql
-- governments: slug GENERATED ALWAYS — NEVER INSERT slug
-- governments has NO unique constraint on geo_id — always use WHERE NOT EXISTS
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'City of Beaverton, Oregon, US', 'LOCAL', 'OR', 'Beaverton', '4105350'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City of Beaverton, Oregon, US'
);

-- chambers: slug GENERATED ALWAYS — NEVER INSERT slug
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'City Council', 'Beaverton City Council', ..., 7
WHERE NOT EXISTS (...);

-- districts: state='or' (lowercase) for LOCAL/LOCAL_EXEC types
-- districts: NO name_formal column — use label only
-- districts: government_id is NULL for OR rows — join via geo_id
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4105350', 'Beaverton (Mayor, Citywide)', NULL
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id='4105350' AND district_type='LOCAL_EXEC' AND state='or');

INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4105350', 'Beaverton (At-Large)', NULL
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id='4105350' AND district_type='LOCAL' AND state='or');

-- offices: guard on (district_id, politician_id) — NOT EXISTS
-- offices columns: id, district_id, chamber_id, politician_id, title, representing_state,
--                  is_appointed_position, is_vacant, role_canonical
-- representing_state = 'OR' (uppercase) on offices
```

**politician_images schema:** `id, politician_id, url, type, photo_license` — NO `photo_origin_url` column. [VERIFIED: confirmed in CONTEXT.md code context]

**Stance schema:** `inform.politician_answers` ON CONFLICT `(politician_id, topic_id)`;
topic_id resolved LIVE via `JOIN inform.compass_topics WHERE topic_key='...' AND is_live=true`;
stance value is an integer 1-5 (chairs model, not polarity). [VERIFIED: confirmed Norwalk phase]

### Office Title Convention

Following the Gresham pattern from mig 246 (`'Council Member (Position 1)'`), title for
each councilor should be `'Councilor (Position N)'` OR `'Council Member (Position N)'` —
check what beavertonoregon.gov uses. The official site uses the label "Council Position N"
for navigation. Suggest: `'Councilor, Position N'` to match OR city conventions.

Mayor's title: `'Mayor'` (matches all OR and NV Mayor precedents).

### OR Casing Rules (critical — wrong case = silent exclusion)

| Context | Casing | Why |
|---------|--------|-----|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | Matches geocoder return + TIGER loader |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `essentials.politicians.party` | `NULL` | Antipartisan design — never set |

### Geofence Pre-Check

The city geo_id `4105350` was loaded in v8.0 OR TIGER geofences. [CITED: memory project_beaverton_or_recon]
Wave-0 must confirm:
```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4105350' AND mtfcc='G4110';
-- Expected: 1
SELECT COUNT(*) FROM essentials.districts WHERE geo_id='4105350';
-- Expected: 0 (no city districts yet — this migration creates them)
```

---

## Architecture Patterns

### Closest Analog: Gresham (migration 246)

Beaverton is structurally identical to Gresham (council-manager, directly-elected mayor, 6
at-large councilors by numbered position). Migration 246 is the PRIMARY template.

```
City of Beaverton, Oregon, US (governments)
└── City Council (chambers, official_count=7)
    ├── LOCAL_EXEC district (geo_id=4105350, state='or', mtfcc=NULL)
    │   └── Mayor office → Lacey Beaty (-4105351)
    └── LOCAL district (geo_id=4105350, state='or', mtfcc=NULL)
        ├── Councilor office, Position 1 → Ashley Hartmeier-Prigg (-4105352)
        ├── Councilor office, Position 2 → Kevin Teater (-4105353)
        ├── Councilor office, Position 3 → Edward Kimmi (-4105354)
        ├── Councilor office, Position 4 → Allison Tivnon (-4105355)
        ├── Councilor office, Position 5 → John Dugger (-4105356)
        └── Councilor office, Position 6 → Nadia Hasan (-4105357)
```

### System Architecture Diagram

```
Beaverton resident address
        |
        v
  Backend /representatives/me
        |
  PIP query against geofence_boundaries
        |
  ┌─────────────────────────────────────────┐
  │  G4110 city boundary (geo_id=4105350)   │
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
  (600x750 headshot + compass stances)
```

### Anti-Patterns to Avoid

- **Do NOT create ward/district geofences** — at-large council, all city-wide.
- **Do NOT create a separate Council President office** for Kimmi — rotational title, not a
  separate seat.
- **Do NOT insert `slug`** on chambers — GENERATED ALWAYS (migration will fail).
- **Do NOT use `photo_origin_url`** in politician_images INSERT — column does not exist.
- **Do NOT default stance values** — blank spoke is correct when no evidence found.
- **Do NOT use ON CONFLICT on districts** — no unique constraint; use WHERE NOT EXISTS.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Headshot resize | Custom PIL script | Existing `_tmp-*-headshots.py` pipeline | Phases 159-175 all reuse same crop-4:5→600x750 Lanczos pattern |
| Stance research | Parallel agents | One agent at a time | Rate-limit rule — parallel burns quota with no usable output |
| Geofence load | Custom boundary ingest | None needed | At-large — city G4110 already loaded |
| groupHierarchy ordering | Custom sort | groupHierarchy.js Mayor-first rule | Already handles LOCAL_EXEC-first + position ordering |

---

## Common Pitfalls

### Pitfall 1: Seeding a non-seated councilor (Position 1 election status)
**What goes wrong:** Position 1 goes to November 2026 runoff. The planner might incorrectly
seed Rachel Philip or Evelyn Kocher as the councilor-elect.
**Why it happens:** May 2026 primary results were initially reported as Philip winning with 53%,
then dropped below 50%. As of 2026-07-01, Philip has 48.4% — not a majority; runoff required.
**How to avoid:** Seed Ashley Hartmeier-Prigg as the current Position 1 holder. Her term runs
to end of December 2026. The seat does not change until the November 2026 election is certified
and the winner is sworn in (January 2027).
**Warning signs:** Wave-0 must confirm she has not vacated early (she is running for OR House
HD-27 but that election is November 2026 — she holds both the council seat AND the House
candidacy simultaneously through 2026).

### Pitfall 2: Council President as a separate office
**What goes wrong:** Edward Kimmi is Council President. This might be modeled as a separate
LOCAL_EXEC office or a second row in chambers.
**Why it happens:** The Council President title sounds executive-level.
**How to avoid:** Council President is a rotational designation selected by the council — not
a separate elected position. One row in offices, title `'Councilor (Position 3)'`. Can note
Council President in a comment only.

### Pitfall 3: districts.state uppercase 'OR' for LOCAL districts
**What goes wrong:** Routing fails silently — address lookup returns no city-level officials.
**Why it happens:** governments.state uses 'OR' (uppercase); devs apply same casing to districts.
**How to avoid:** All LOCAL/LOCAL_EXEC/COUNTY districts in Oregon use `state='or'` (lowercase).
Only NATIONAL_LOWER and STATE_EXEC use uppercase 'OR'. [VERIFIED: mig 246 + mig 244 comments]

### Pitfall 4: Duplicate government row
**What goes wrong:** Second INSERT of 'City of Beaverton, Oregon, US' without WHERE NOT EXISTS
guard creates a duplicate (governments has no unique constraint on geo_id).
**How to avoid:** Always use WHERE NOT EXISTS guard scoped to the exact government name.
Pre-flight RAISE NOTICE or RAISE EXCEPTION if government already exists (per mig 244 pattern).

### Pitfall 5: Headshots from beavertonoregon.gov — JavaScript-rendered content
**What goes wrong:** curl of page body returns raw HTML without the per-member portrait UUID
because the portrait is loaded via CivicPlus JavaScript.
**How to avoid:** Use a headless browser approach or identify portrait UUIDs via browser
DevTools network inspection. Alternatively, use campaign/Ballotpedia sources for all 7
members directly. The per-member CivicPlus UUID pattern IS publicly accessible once found
(`content.civicplus.com/api/assets/{UUID}?width=900&mode=min` returns JPEG, no WAF).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Strong-mayor Beaverton | Council-manager Beaverton | May 2020 charter vote | Mayor is directly elected but NOT a standalone executive — City Manager runs operations; LOCAL_EXEC pattern still correct for seeding |
| Marc San Soucie (Pos 5) | John Dugger (Pos 5) | Aug 2022 (San Soucie resigned early) | Dugger confirmed current holder |
| Unknown Pos 4 (pre-2020) | Allison Tivnon (Pos 4) | 2020 election | Tivnon re-elected 2024 |

**Deprecated/outdated:**
- Position-numbered seats DO NOT correspond to wards — the name "Council Position 1" is just
  an at-large seat identifier, not a district number. Do not confuse with ward-based cities.

---

## Surfacing

**Entry to add to `src/lib/coverage.js` Oregon block** (`COVERAGE_STATES`, name='Oregon',
abbrev='OR', `areas` array):

```js
{ label: 'Beaverton', browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true },
```

**Sort position:** Alphabetically before 'Fairview' (already first in OR block). Insert as
the first entry in the Oregon areas array: `{ label: 'Beaverton', ... }`.

**Browse link at completion:** `essentials.empowered.vote/results?browse_geo_id=4105350&browse_mtfcc=G4110`
[CITED: feedback_provide_city_browse_links pattern]

**hasContext: true** is correct once at least 1 stance row is inserted for a Beaverton official.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | beavertonoregon.gov individual council position pages serve per-member portrait images via CivicPlus UUID that can be retrieved once UUID is known | Headshot Sources | Headshots must come from Ballotpedia/campaign sites instead; photo_license attribution changes |
| A2 | Ashley Hartmeier-Prigg has NOT vacated Position 1 early (holds seat through end of 2026 while also running for OR House) | Live Roster | Would require seeding a vacant seat or an interim appointee |
| A3 | The 2026 May election certified Teater (Pos 2) and Dugger (Pos 5) re-election; Philip/Kocher runoff for Pos 1 holds | Live Roster | Election certification due ~June 25; Wave-0 must verify actual certified outcome |
| A4 | ext_id range -4105351..-4105357 is unused in DB | Migration Reference | Wave-0 DB probe to confirm; if collision, shift range to -4105401..-4105407 |
| A5 | photo_license for official city portal images is `press_use` (us_government_work pattern from prior OR phases) | Headshot Sources | May need `cc_by_sa` or other license per actual image source |
| A6 | Headshots for all 7 Beaverton officials are findable (no genuine zero-source gap) | Headshot Sources | Genuine gap is honest — document, do not fabricate |
| A7 | Edward Kimmi's Council President title is rotational/annual, not a separate elected office | Live Roster | Would require a separate office row if it were separately elected; charter confirms it is not |

---

## Open Questions (RESOLVED at execution — Wave-0 / executor-time determinations)

1. **Position 1 seat status at execution time**
   - What we know: As of 2026-07-01, May 2026 primary certification is pending (~June 25 deadline). Hartmeier-Prigg holds the seat until January 2027 regardless.
   - What's unclear: Whether she vacated early due to OR House campaign obligations (unlikely but possible).
   - Recommendation: Wave-0 checks beavertonoregon.gov/council-position-1 and Washington County elections for confirmation. Seed with Hartmeier-Prigg unless she has formally vacated.

2. **Exact headshot URL pattern for CivicPlus portraits**
   - What we know: CivicPlus serves images at `content.civicplus.com/api/assets/{UUID}?width=N&mode=min`. The banner UUID is shared across all position pages. Member portraits are JS-rendered.
   - What's unclear: Whether a static fallback URL exists or whether each member's portrait UUID is discoverable without a browser.
   - Recommendation: Executor uses `find-headshots` skill or browser-based inspection for the first member as a pattern-test, then applies to all 7. Campaign sites (all 7 officials have findable campaign/Ballotpedia pages) are a reliable fallback.

3. **Council President designation**
   - What we know: Edward Kimmi was designated Council President (confirmed from council meeting minutes May 2024). This rotates.
   - What's unclear: Whether the 2025 or 2026 Council President is still Kimmi or has changed.
   - Recommendation: No action needed — this is a display title, not a seeded office. title='Councilor (Position 3)' regardless.

---

## Environment Availability

No external tools beyond existing project infrastructure are needed. No new geofences to load. City geo_id already present.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL / psql | Migration apply | Yes (via EV-Accounts .env) | Live | — |
| beavertonoregon.gov | Headshots | Yes (HTTP 200, no WAF) | CivicPlus CMS | Campaign sites |
| Wikimedia Commons | Mayor headshot (Beaty) | Yes (CC BY 2.0 1000x1400px) | — | beavertonoregon.gov |
| Ballotpedia | Fallback headshots | Yes (confirmed pages for Teater/Dugger) | — | Campaign sites |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | SQL verification queries (inline psql, no test runner) |
| Config file | None — inline verification gates in plan |
| Quick run command | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM essentials.offices o JOIN essentials.politicians p ON o.politician_id=p.id JOIN essentials.chambers ch ON o.chamber_id=ch.id WHERE ch.name='City Council' AND ch.government_id=(SELECT id FROM essentials.governments WHERE name='City of Beaverton, Oregon, US')"` |
| Full suite command | 9-check E2E gate (see below) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WASH-02 | 7 officials seeded with offices | SQL count | `SELECT COUNT(*)... = 7` | Wave-0 inline |
| WASH-02 | Mayor sorts first in display | SQL + live browse | `groupHierarchy.js` + human verify | Existing code |
| WASH-02 | 7 headshots at 600x750 in Storage | SQL count + CDN HTTP 200 | `SELECT COUNT(*) FROM essentials.politician_images WHERE...` | Wave-2 inline |
| WASH-02 | Evidence-only stances render | SQL count + live browse | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id=...` | Wave-3 inline |
| WASH-02 | Purple hasContext chip | Browser/live browse | `essentials.empowered.vote/results?browse_geo_id=4105350&browse_mtfcc=G4110` | Wave-3 human verify |
| WASH-02 | Section-split = 0 rows | SQL | Section-split query after seed | Wave-1 inline |
| WASH-02 | No duplicate government row | SQL | `SELECT COUNT(*) FROM essentials.governments WHERE name='City of Beaverton, Oregon, US'` = 1 | Wave-1 inline |

### 9-Check E2E Verification Gate (Wave-3 plan)

1. `governments` row count = 1 for name='City of Beaverton, Oregon, US'
2. `chambers` row exists with name='City Council', official_count=7
3. `districts` rows: exactly 1 LOCAL_EXEC + 1 LOCAL for geo_id='4105350' state='or'
4. `offices` count = 7 for Beaverton chamber
5. `politician_images` count = 7 for Beaverton politicians (all HTTP 200 from CDN)
6. `politician_answers` count ≥ 1 per official (honest blanks OK; 0 for any official = re-check)
7. Section-split query returns 0 rows
8. Districts.state casing verified: all 'or' (lowercase)
9. Human-verify: live browse link shows Mayor first + all 6 councilors, compass stances visible

### Wave 0 Gaps

- [ ] DB probe: confirm geo_id='4105350' geofence exists in geofence_boundaries (G4110)
- [ ] DB probe: confirm no existing government/chamber rows for Beaverton
- [ ] DB probe: confirm ext_id range -4105357..-4105351 is unused
- [ ] DB probe: confirm disk migration 1130 = DB ledger MAX (schema_migrations)
- [ ] Verify Ashley Hartmeier-Prigg still seated (check beavertonoregon.gov/council-position-1)

---

## Sources

### Primary (HIGH confidence)
- Wikipedia: Lacey Beaty — https://en.wikipedia.org/wiki/Lacey_Beaty — Mayor identity, election history, directly-elected confirmed
- Beaverton Valley Times 2022 swearing-in — https://beavertonvalleytimes.com/2022/08/31/kimmi-dugger-sworn-in-as-beaverton-city-councilors/ — Kimmi (Pos 3) and Dugger (Pos 5) confirmed
- Beaverton Valley Times 2024 candidates — https://beavertonvalleytimes.com/2024/03/13/take-a-look-at-the-candidates-running-for-beaverton-city-council/ — Beaty (Mayor), Kimmi (Pos 3), Tivnon (Pos 4), Hasan (Pos 6) confirmed; 4 races
- Beaverton Valley Times 2026 election results — https://beavertonvalleytimes.com/2026/05/19/philip-teater-dugger-lead-in-initial-beaverton-city-council-election-results/ — Teater (Pos 2) and Dugger (Pos 5) re-elected; Pos 1 runoff
- Beaverton Valley Times 2026 runoff — https://beavertonvalleytimes.com/2026/05/22/philip-kocher-could-head-to-november-runoff-for-beaverton-city-council-seat/ — Pos 1 Philip 48.4%, no majority
- Oregon State Authority / multiple WebSearch results — council-manager form, at-large positions, 2020 charter change confirmed
- Beaverton Resource Guide About page — https://beavertonresourceguide.com/about-beaverton/ — confirmed full current roster (Mayor Beaty + 6 council members by name)
- Migration 244 (Multnomah) — confirmed OR schema patterns (slug GENERATED, lowercase districts.state, WHERE NOT EXISTS)
- Migration 246 (Multnomah cities including Gresham) — PRIMARY template for Beaverton structural seed
- curl HEAD on beavertonoregon.gov pages — confirmed HTTP 200, CivicPlus CMS, no WAF

### Secondary (MEDIUM confidence)
- Wikimedia Commons File:Mayor_Lacey_Beaty_crop.jpg — https://commons.wikimedia.org/wiki/File:Mayor_Lacey_Beaty_crop.jpg — CC BY 2.0, 1000x1400px, Oregon National Guard photo
- Oregon League of Cities city directory — https://www.orcities.org/resources/reference/city-directory/details/beaverton — confirmed Lacey Beaty as current Mayor
- Ballotpedia Kevin Teater candidate page — confirmed Ballotpedia presence for Pos 2 and Pos 5

### Tertiary (LOW confidence)
- Headshot UUIDs for individual council members on beavertonoregon.gov — not confirmed (JS-rendered, requires browser inspection)
- Photo license for beavertonoregon.gov portraits — assumed press_use based on prior OR city pattern

---

## Metadata

**Confidence breakdown:**
- Form of government: HIGH — confirmed from charter reference + multiple contemporary news sources
- Roster (6 of 7 officials): HIGH — confirmed by name + position from multiple independent sources
- Roster (Hartmeier-Prigg Pos 1 status): MEDIUM — confirmed as seated incumbent; runoff status adds uncertainty
- Headshot sourcing: MEDIUM — site confirmed no WAF; per-member portrait UUIDs require browser inspection
- Migration shape (schema): HIGH — directly confirmed from OR city migration templates (244/246)
- Ext_id range: MEDIUM — range derived from pattern; Wave-0 DB probe required to confirm no collision

**Research date:** 2026-07-01
**Valid until:** 2026-09-01 (30-day stable; note that Position 1 seat changes in January 2027 after November election)

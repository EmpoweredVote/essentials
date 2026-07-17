# Phase 198: South Tucson Deep-Seed - Research

**Researched:** 2026-07-17
**Domain:** Greenfield enclave-city council-manager government seeding where the Mayor, Vice Mayor, AND
Acting Mayor are ALL council-chosen TITLES (not separately elected offices) rotated among 7 at-large
council members, inside a wholly-surrounded municipal enclave (Postgres/PostGIS backend in
`C:/EV-Accounts`, React frontend in this repo).
**Confidence:** HIGH (structural/technical — geo_id, enclave-routing, migration numbering, ext_id range,
compass-topic scope all DB/PostGIS-verified live this session) / **MEDIUM (election-method and title
structure — corroborated 3+ ways via WebSearch composites of the site's own indexed content, but the
primary source itself could not be directly rendered — Cloudflare-blocked) / LOW-MEDIUM, HIGH-URGENCY
(roster currency — the July 21, 2026 primary is 4 DAYS from this research date, and the sitting Mayor
herself is a candidate)**

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (roster scope, carried forward, locked):** Seed elected officials only — Mayor + elected City
  Council members. No appointed staff (City Manager, etc.). Antipartisan: party never displayed;
  nonpartisan officials seeded with `party` NULL. Matches Pima/Tucson/Oro Valley/Marana/Sahuarita.
- **D-02 (seat structure):** Precedent default — mirror Oro Valley (195)/Marana (196)/Sahuarita (197),
  contingent on researcher verification. Expectation: at-large + nonpartisan. **This research does NOT
  confirm the CONTEXT's literal default shape ("Mayor = new LOCAL_EXEC seat")** — like Sahuarita, South
  Tucson has NO separately-elected Mayor office. Unlike Sahuarita (2 council-chosen titles), South Tucson
  appears to have **THREE** council-chosen titles (Mayor, Vice Mayor, AND Acting Mayor) on otherwise
  identical at-large seats. See Summary / Pattern 1. Fall back to by-ward ONLY if a live source proves
  wards — no evidence of wards was found this session.
- **D-03 (enclave routing, BLOCKING):** RESOLVED this session with HIGH confidence — see Summary /
  Common Pitfall 6 / Code Examples. South Tucson's own TIGER place geo_id (`0468850`) resolves distinctly
  from Tucson's (`0477000`); the two polygons do NOT overlap in area (a true topological "donut hole" —
  PostGIS `ST_Intersection` area = 0 km²), and a point-in-South-Tucson test (centroid + the
  City-Hall-area address) is covered EXCLUSIVELY by the South Tucson geofence.
- **D-04 (banner):** Claude sources one licensed real photo at a time (street-scene; no AI, no
  aerial/drone). Two hard collision constraints: NOT a Catalina/mountain shot (Pima/Oro Valley), NOT
  Tortolita/Dove Mountain (Marana), NOT downtown Tucson/Hotel Congress (Tucson city). Priority order:
  Chicano/community murals (front-runner), South 4th Avenue restaurant-district streetscape/signage, City
  welcome sign / Mercado. **This research found NO Commons-licensed photo of a specific South Tucson
  mural** (see Open Question 1) — two safe, verified, on-topic Commons candidates were found instead (a
  city-limits/welcome-sign shot and a City Hall shot), plus one additional streetscape candidate (a
  vintage motel sign). See Code Examples / Open Questions.
- **D-05 (stances, carried forward, locked):** Full, per convention — evidence-only across all live
  compass topics, one research agent at a time, 100% citation, no default values, honest blank spokes.
- **D-06 (headshots):** Standard order — direct fetch from southtucsonaz.gov council pages first, then
  `/find-headshots` Playwright WAF fallback, then Ballotpedia/Wikimedia/news. **This research confirms
  southtucsonaz.gov IS bot-protected** — but by Cloudflare's "Just a moment..." managed JS challenge
  (confirmed via direct `curl`, HTTP 403 with a Cloudflare challenge page), a DIFFERENT vendor signature
  than every prior AZ phase's Akamai block and Sahuarita's CivicPlus soft-block. Playwright (which can
  solve/wait-out a Cloudflare challenge) is the expected effective path, per D-06's stated fallback order.
- **D-07 (roster currency, BLOCKING):** 2026 is an active election year — re-verify the full seated
  roster against southtucsonaz.gov immediately before applying the migration and block if anything
  changed. **This research finds the risk MORE acute than stated in CONTEXT**: the July 21, 2026 primary
  (the SAME DATE as Sahuarita's, since both are Pima County jurisdictions) is only 4 days from this
  research date, THREE of the 7 seats are up, and the sitting MAYOR (Roxanna Valenzuela) is herself one of
  the three incumbent candidates. See Common Pitfall 1/2.

### Claude's Discretion

- Banner subject selection (D-04, "you decide") — a genuine mural-photo gap exists this session; the
  execution-phase sourcing pass should attempt a dedicated search for one of three specifically-named,
  real South Tucson murals (La Tusa/Tattoo Mural, Amor Querido, El Pueblo Viejo Salsa) before falling back
  to the two verified Commons candidates (city-limits sign / City Hall).
- Migration numbering (disk-authoritative), ext_id ranges, geofence source — resolved concretely this
  session (see Code Examples). governments.type: recommend `'City'` (South Tucson is legally incorporated
  as a City, matching the Tucson 194 precedent — NOT `'Town'` like Oro Valley/Marana/Sahuarita).
- Exact headshot fetch mechanics within the D-06 order — Playwright is very likely required (Cloudflare
  challenge confirmed on direct fetch); the `/directory` staff-directory page is an additional fetch
  target worth trying alongside `/citycouncil`.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. School boards, AZ Legislature stances, and appointed staff
remain out of scope per milestone conventions (unchanged from CONTEXT.md).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUB-04 | South Tucson deep-seed — government + roster → 600×750 headshots → evidence-only stances → licensed community banner → surfaced in `src/lib/coverage.js` | GOVERNMENT/GEOFENCE confirmed greenfield via direct production-DB query (0 rows in `essentials.governments` for `%south tucson%`; the G4110 place boundary `geo_id='0468850'` already exists from Phase 190, `essentials.districts` has 0 rows for it); ENCLAVE ROUTING (D-03, BLOCKING) resolved this session with a direct PostGIS query — South Tucson's polygon does NOT overlap Tucson's polygon in area (true donut hole; `ST_Intersection` area = 0 km²), and both the polygon centroid and the approximate City-Hall-area point are covered EXCLUSIVELY by the South Tucson geofence via the app's own `ST_Covers` routing predicate; ELECTION METHOD/SEAT STRUCTURE corroborated via 3+ independent WebSearch composites (all apparently indexing southtucsonaz.gov's own Elections/City-Council pages, though direct render of that site is Cloudflare-blocked) plus AZ Luminaria (2026-06-22) and Tucson Spotlight (2024-11) news coverage: 7-member at-large nonpartisan council, 4-year staggered terms (3 or 4 seats per even-year cycle), Mayor + Vice Mayor + Acting Mayor are ALL council-chosen titles among the 7 members — genuinely a THIRD title beyond the Sahuarita 2-title precedent; ROSTER resolved current as of 2026-07-17 (7 names + which 3 are up in the imminent primary) under an EXTREME timing risk (July 21, 2026 primary is 4 days away, and the sitting Mayor is herself a candidate); HEADSHOTS: `southtucsonaz.gov` direct fetch is Cloudflare-JS-challenge-blocked (confirmed HTTP 403 with a "Just a moment..." managed-challenge page) — Playwright fallback expected necessary; MIGRATIONS numbering DB-verified this session (ledger MAX=1354, disk MAX=1362, next structural=1363; ext_id block `-4015001..-4015007` confirmed unused) |
| BANR-01 | Licensed South Tucson community banner, processed via `scripts/banners/`, wired into `buildingImages.js`, distinct from Pima County (Catalinas)/Oro Valley (CDO bridge)/Marana (Dove Mountain)/Tucson (Hotel Congress)/Sahuarita (Sahuarita Lake)/AZ-state (Phoenix skyline) | 2 concrete Commons candidates confirmed usable this session (`Southtucson.JPG` "South Tucson city limits from 6th ave.", CC BY-SA 4.0, 2,816×2,112; `Southtucson1.JPG` "South Tucson City Hall", CC BY-SA 4.0, 2,816×2,112 — both by Rgper22008, 2009) plus 1 additional streetscape candidate (`Star motel south tucson`, CC BY 2.0, Dan DeLuca/Flickr 2017, 3,840×2,866); the D-04 front-runner subject (a Chicano/community mural) has NO confirmed Commons-licensed photo this session despite 3 real, documented, named South Tucson murals — flagged as Open Question 1 for the execution-phase sourcing pass |

</phase_requirements>

## Summary

**South Tucson is structurally the closest analog to Sahuarita (197) in this milestone, but with a
genuinely novel THIRD wrinkle: the council appears to choose not two but THREE titles — Mayor, Vice
Mayor, AND Acting Mayor — from among its 7 at-large elected members**, none of whom holds a
separately-elected office. This finding is corroborated by 3+ independent WebSearch composites that all
appear to trace back to `southtucsonaz.gov`'s own Elections/City-Council pages (the exact phrase "one of
whom shall be designated as mayor, and one of whom is designated as vice mayor and one whom is designated
as Acting-Mayor" recurred verbatim or near-verbatim across multiple independent search queries this
session), plus a corroborating charter-mechanics sentence: "following a regular city election, the
council shall meet on the following Tuesday for the purpose of choosing a mayor from among its
membership" — language structurally identical to Sahuarita's Town Code 2.10.010 mechanism. **This
research could NOT directly render `southtucsonaz.gov` itself** (a `curl` with a Chrome User-Agent
returned HTTP 403 with a genuine Cloudflare "Just a moment..." managed-JS-challenge page, confirmed this
session — a DIFFERENT bot-protection vendor than every prior AZ phase's Akamai block and Sahuarita's
CivicPlus soft-block) — so this election-method/title-structure finding is MEDIUM confidence (multiple
independently-worded search-engine-indexed excerpts agreeing, but not a directly-rendered primary source)
and should be re-confirmed by the execute-time Playwright fetch (which CAN solve a Cloudflare challenge)
before the migration is finalized.

**Current confirmed sitting roster (as of 2026-07-17, cross-verified via a Tucson Spotlight article on the
Nov 20, 2024 swearing-in/leadership reorganization and an AZ Luminaria June 22, 2026 voter guide):**

| Seat | Name | Title (council-chosen) | Term | 2026 election involvement |
|------|------|------------------------|------|----------------------------|
| Council (at-large) | Roxanna Valenzuela | **Mayor** (chosen by council; sworn in as Mayor Nov 20, 2024) | up 2026 | **Incumbent CANDIDATE for re-election to Council** — her Mayor title would be re-chosen separately by the new council after the election, not on the ballot itself |
| Council (at-large) | Melissa Brown-Dominguez | **Vice Mayor** (chosen by council, Nov 20, 2024) | to 2028 | not up |
| Council (at-large) | Pablo Robles | **Acting Mayor** (chosen by council, Nov 20, 2024) | to 2028 | not up |
| Council (at-large) | Dulce Jimenez | Council Member | to 2028 | not up |
| Council (at-large) | Paul Diaz | Council Member (former Mayor, pre-Nov-2024) | to 2028 | not up |
| Council (at-large) | Brian Flagg | Council Member | up 2026 | Incumbent candidate for re-election |
| Council (at-large) | Cesar Aguirre | Council Member | up 2026 | Incumbent candidate for re-election |

**A directly analogous — and in one respect SHARPER — timing risk to Sahuarita's (197) Pitfall 1 exists
here:** South Tucson's July 21, 2026 municipal primary (the SAME CALENDAR DATE as Sahuarita's — both are
Pima County jurisdictions holding coordinated elections) is **4 DAYS from this research date**. Three
seats are up (Aguirre, Flagg, and — critically — **Mayor Valenzuela herself**). Per the AZ Luminaria
voter guide, 8 total candidates are running for the 3 seats: the 3 incumbents plus 5 challengers (Zeke
Cook, Christopher Dodson, Debbie/Deborah Federico, Eduardo Baca, Diana Moreno-Sears). The article
describes South Tucson's elections as nonpartisan where "the three candidates who receive the majority
vote are declared to be elected" and separately notes "general elections are not held unless there are
other propositions on the ballot, which there aren't this year" — these two statements are in mild
tension (a strict "majority" threshold with no runoff mechanism, vs. a "top-3 plurality wins outright"
reading) and were NOT resolved to certainty this session; treat the exact win-threshold mechanics as an
item for the execute-time checkpoint to pull directly from certified results, not assumed. **Because the
sitting Mayor is herself on the ballot, this phase carries a UNIQUE compounding risk beyond Sahuarita's or
Marana's**: even if Valenzuela wins re-election to Council outright, the Mayor title itself is a SEPARATE,
SUBSEQUENT council vote (per the charter-mechanics language above) — so "Valenzuela won" does not by
itself confirm "Valenzuela remains Mayor." The same applies to Robles's Acting Mayor and
Brown-Dominguez's Vice Mayor titles if the new council chooses to reshuffle after any change in
membership.

**Direct production-DB verification this session (2026-07-17) confirms South Tucson is fully greenfield**,
structurally identical to every prior AZ suburb's gap: `essentials.governments` has 0 rows matching `%south
tucson%`; `essentials.geofence_boundaries` already has the whole-city G4110 boundary live from Phase 190
(`geo_id='0468850'`, matching the City's FIPS place code — DISTINCT from Tucson's `0477000`);
`essentials.districts` has **0 rows** for South Tucson's geo_id — this phase must create exactly ONE new
`LOCAL` district row (shared by all 7 offices, including the three titled ones) — NOT a `LOCAL_EXEC` row,
mirroring Sahuarita's simpler (no-separately-elected-Mayor) shape rather than Oro Valley/Marana's.

**D-03's BLOCKING enclave-routing check is RESOLVED THIS SESSION with HIGH confidence.** Direct PostGIS
queries against the live geometries confirm South Tucson's polygon and Tucson's polygon do NOT overlap in
area at all — `ST_Area(ST_Intersection(...))` returns exactly `0` km² even though `ST_Intersects` returns
`true` (they share only boundary-touching edges, the expected signature of a clean TIGER "enclave hole" —
Tucson's polygon has South Tucson cut out of it, not merely drawn over it). A direct `ST_Covers` point
test — run against both the South Tucson polygon's centroid AND an approximate point for South Tucson
City Hall (1601 S 6th Ave; note the mailing address says "Tucson, AZ 85713" because South Tucson has no
distinct USPS post office — a genuine pitfall for anyone scanning addresses for "South Tucson" as a
string) — is covered EXCLUSIVELY by the South Tucson geofence and NOT by Tucson's. This means the app's
existing `essentialsService.ts` `ST_Covers`-based routing (unchanged code) will correctly resolve any
South Tucson address to South Tucson's own council with ZERO risk of being silently swallowed by Tucson's
larger geofence — the enclave is topologically clean by construction, not merely "probably fine."

Headshots present the expected obstacle, but with a NEW vendor signature: a direct `curl` (Chrome UA) of
`southtucsonaz.gov/citycouncil` and `/elections/page/city-council-election-information` returned **HTTP
403** with a genuine Cloudflare "Just a moment..." managed-challenge page (JS-required, cookie-required —
confirmed via the raw response body this session) — a different bot-protection vendor than every prior
AZ phase's Akamai signature and Sahuarita's CivicPlus soft-empty-body signature. The `/find-headshots`
skill's Playwright-based flow (a real, JS-capable browser context) is the expected effective mitigation,
consistent with D-06's stated fallback order; the `/directory` staff-directory page is worth trying
alongside `/citycouncil` as an additional headshot source.

**Primary recommendation:** Model South Tucson as ONE `City Council` chamber (`official_count=7`) holding
7 offices ALL of `district_type='LOCAL'`, ALL joined to a SINGLE NEW `essentials.districts` row
(`geo_id='0468850'`, `mtfcc='G4110'`, `state='az'`) — NO `LOCAL_EXEC` row, NO per-seat districts,
mirroring Sahuarita's Pattern 1 hybrid exactly, but extended to a THREE-title gate (Mayor + Vice Mayor +
Acting Mayor, each independently asserted as "exactly 1 office with this title, bound to the correct
external_id"). Title the 7 offices: Valenzuela = `'Mayor'`, Brown-Dominguez = `'Vice Mayor'`, Robles =
`'Acting Mayor'`, the other 4 = `'Council Member'`. `role_canonical` NULL on all 7.
`essentials.governments.type` should be `'City'` (South Tucson is legally incorporated as a City, per
every source this session — NOT a Town, unlike Oro Valley/Marana/Sahuarita), matching the Tucson (194)
government-type convention. **The single highest-priority planning action is scoping a genuinely
substantive BLOCKING roster-currency checkpoint at execute time** — this window is 4 days from research
(the tightest in the milestone to date), the sitting Mayor herself is a candidate, and even a
"no-membership-change" primary outcome does not resolve whether the post-election council re-selects the
same three titleholders.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| City boundary (all 7 at-large seats share one geofence; enclave inside Tucson) | Database / Storage (`essentials.geofence_boundaries`, ALREADY LIVE from Phase 190, DB-confirmed 2026-07-17: `geo_id='0468850'`, non-overlapping with Tucson's `0477000`) | — | No new geometry work this phase — reuses the existing row entirely; enclave-routing correctness is a property of the already-loaded TIGER geometry, not new code |
| Government/chamber/office/politician seed | Database (`essentials.governments/chambers/districts/offices/politicians`) | — | Structural migration; simpler than Oro Valley/Marana/Tucson (one new district row, no `LOCAL_EXEC`), same shape as Sahuarita but with a 3rd title gate |
| Address → all-7-at-large-Council routing | API / Backend (`essentialsService.ts`, unchanged code, `ST_Covers`) | Database (geofence + district join) | The existing `G4110→LOCAL` mapping already covers this — zero code change; the enclave donut-hole geometry means no ambiguous double-match is possible |
| 600×750 headshots | Database / Storage (`politician_images`, `politician_photos` bucket) | Playwright (fallback sourcing for the Cloudflare-challenge-blocked `southtucsonaz.gov`) | Same DB/Storage tier as every prior phase; sourcing tier differs in WAF vendor (Cloudflare, not Akamai/CivicPlus) |
| Compass stances | Database (`inform.politician_answers`) | — | Evidence-only INSERTs; no frontend change |
| Community banner | Frontend (`src/lib/buildingImages.js` CURATED_LOCAL) + Storage (`politician_photos/cities/`) | Frontend (`src/lib/coverage.js`, EXISTING Arizona `COVERAGE_STATES` block — plain append) | The Arizona block already has 4 entries (Tucson, Oro Valley, Marana, Sahuarita) — this is the 5th append, not a new-block creation |
| Coverage surfacing (chip) | Frontend (`src/lib/coverage.js`) | — | `hasContext:true` once ≥1 stance row exists |

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PostgreSQL/PostGIS (Supabase) | Live prod (`kxsdzaojfaibhuzmclfq`) | Structural + audit migrations; enclave-geometry verification | Same DB as every prior phase — confirmed reachable this session via `psql` against `C:/EV-Accounts/backend/.env` |
| `psql` CLI | confirmed on PATH 2026-07-17 (PostgreSQL 18.1 client) | Inline orchestrator apply + DB-verify | `gsd-executor` has no Supabase MCP — orchestrator applies via `psql` |
| Python 3 + Pillow + `requests` + `psycopg2` | Proven in every prior AZ phase | Headshot crop/resize/upload pipeline | Verbatim reuse |
| `mcp__playwright__browser_navigate` (+ snapshot/click/close) | Available per `/find-headshots` skill | Headshot sourcing fallback for the Cloudflare-challenge-blocked `southtucsonaz.gov` | Confirmed necessary this session — direct `curl` of BOTH `/citycouncil` and the elections-info page returned HTTP 403 with a genuine Cloudflare "Just a moment..." managed challenge (JS/cookie required); a real browser context is required |
| `scripts/banners/process_banner.py` + `upload_banner.py` | Already present | Banner crop-to-1700×540 + Storage upload | No new tooling |

**NOT needed this phase (mirrors Sahuarita, simpler than Oro Valley/Marana/Tucson):** no `LOCAL_EXEC`
district row at all — every office (including the three titled ones) attaches to the SAME single new
`LOCAL` row. No TypeScript geofence loader — South Tucson has zero sub-jurisdiction geofences to source;
the whole-city G4110 boundary already covers all 7 seats.

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `azluminaria.org`, `tucsonspotlight.org`, `tucson.com`, `tucsonsentinel.com`, `kgun9.com` | live, confirmed reachable via WebFetch/WebSearch 2026-07-17 | Roster cross-check + stance-research evidence sourcing | Not WAF-blocked; directly fetchable this session (unlike `southtucsonaz.gov` itself) |
| Ballotpedia (per-candidate pages, e.g. `Roxanna_Valenzuela_(South_Tucson_City_Council,_Arizona,_candidate_2026)`) | live | Roster/candidate cross-check | Pages returned thin/JS-heavy content to a direct `curl` this session (confirmed HTTP 200 but minimal static text) — treat as a secondary corroboration source, not a primary text source, without a JS-capable fetch |
| `southtucsonaz.gov` (Cloudflare-protected) | live but JS-challenge-blocked to non-browser clients | Primary roster + election-info + headshot source | Confirmed HTTP 403 "Just a moment..." to direct `curl`/WebFetch this session — use Playwright (JS-capable) for both the HTML content and headshot images |
| `borderlore.org` | live, confirmed reachable via WebSearch this session | Mural documentation (La Tusa/Tattoo Mural at 29th & 4th Ave) — a lead for Open Question 1's banner-photo gap | Real, documented, named landmark — worth a dedicated photo-sourcing attempt at execution time |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sahuarita-style plain titles extended to 3 (`'Mayor'`, `'Vice Mayor'`, `'Acting Mayor'`, `'Council Member'`) | Marana/Oro-Valley-style annotated titles (`'Council Member (Mayor)'` etc.) | This research recommends the PLAIN style (Sahuarita/Palm-Springs/Indio precedent) because South Tucson, like Sahuarita, has NO separately-elected Mayor office — all three titled seats are structurally identical to the four plain seats except for the `title` string. Planner's final call — either style renders correctly. |
| `governments.type='City'` | `governments.type='Town'` (the Oro-Valley/Marana/Sahuarita convention) | South Tucson is legally incorporated as a City (every source this session refers to "City of South Tucson," "South Tucson City Council," etc. — never "Town"), matching Tucson's (194) `type='City'` row. Confirm against the live Tucson 1296 row at author time. |

**Installation:** No new packages. All tooling already present and proven across every prior AZ/CA
deep-seed phase in this milestone.

### Version verification
N/A — zero new dependencies introduced.

## Package Legitimacy Audit

**N/A this phase.** No new npm/pip/cargo packages are installed. All tooling (`pg`, Pillow, `requests`,
`psycopg2`, Playwright MCP) is already present and proven across every prior AZ/CA deep-seed phase.
`slopcheck` was not run — nothing to audit (matches every prior deep-seed phase's RESEARCH.md).

## Architecture Patterns

### System Architecture Diagram

```
City of South Tucson G4110 boundary (ALREADY LIVE from Phase 190: geo_id='0468850', state='04' FIPS —
DB-confirmed 2026-07-17: `SELECT geo_id, mtfcc, state, name FROM essentials.geofence_boundaries
WHERE name ILIKE '%south tucson%'` => 0468850 | G4110 | 04 | South Tucson city)
        │  ENCLAVE CHECK (D-03, BLOCKING, RESOLVED): South Tucson's polygon does NOT overlap Tucson's
        │  polygon in area (`ST_Area(ST_Intersection(south_tucson, tucson))` = 0 km², confirmed live
        │  2026-07-17) — a true TIGER "donut hole." A `ST_Covers` point test on the South Tucson
        │  centroid AND the approximate City-Hall address point is covered EXCLUSIVELY by the South
        │  Tucson geofence, never by Tucson's. No new code needed — the existing `ST_Covers`-based
        │  routing in `essentialsService.ts` already resolves this correctly.
        ▼
Structural migration <disk-MAX+1, provisionally 1363>_city_of_south_tucson.sql
   ├─ essentials.governments  ('City of South Tucson, Arizona, US', type='City', state='AZ', geo_id='0468850')
   ├─ essentials.chambers     ('City Council', official_count=7 — 7 at-large council members, ONE
   │                          chamber, NO separate Mayor chamber/office — Mayor/Vice Mayor/Acting Mayor
   │                          are ALL council-chosen TITLES, not seats)
   ├─ essentials.districts    ONE NEW LOCAL row (geo_id='0468850', mtfcc='G4110', state='az' — did NOT
   │                          exist before this phase, DB-confirmed 0 rows this session). NO LOCAL_EXEC
   │                          row at all — mirrors Sahuarita (197), simpler than Oro Valley/Marana/Tucson.
   └─ essentials.politicians + essentials.offices  (7 people, ext_id -4015001..-4015007, party=NULL,
                                title: Valenzuela='Mayor', Brown-Dominguez='Vice Mayor', Robles='Acting
                                Mayor', other 4='Council Member' — ALL 7 join the SAME single LOCAL row)
        │  office_id back-fill + post-verify DO block (row counts, casing, section-split, THREE title
        │  checks — Mayor/Vice Mayor/Acting Mayor each independently gated)
        ▼
Address routing (NO CODE CHANGE — the existing G4110→LOCAL routing map already covers all 7 seats;
NO LOCAL_EXEC join exercised at all this phase; enclave donut-hole geometry precludes double-match)
        │
        ▼
Resident's profile shows their at-large Council of 7 (3 of whom carry the Mayor/Vice-Mayor/Acting-Mayor
titles)
        │
        ├─ Headshots: southtucsonaz.gov IS Cloudflare-JS-challenge-blocked (HTTP 403 "Just a moment..."
        │             confirmed 2026-07-17, a DIFFERENT vendor than Akamai/CivicPlus) → Playwright
        │             fallback (/find-headshots skill; also try /directory staff page) → crop-first 4:5
        │             → 600×750 Lanczos → politician_images (audit-only).
        ├─ Stances: evidence-only research (azluminaria.org, tucsonspotlight.org, tucson.com,
        │           tucsonsentinel.com, kgun9.com — all confirmed reachable this session) →
        │           inform.politician_answers. Salient local issues to probe: public safety/policing
        │           (Mayor Valenzuela's stated top priority), city budget/department funding, the
        │           Mercado/South-4th-Ave small-business corridor, and South Tucson's historically
        │           fraught recall/turnover politics (multiple past recalls — treat as background
        │           context, NOT current-roster fact).
        └─ Banner: 2 verified Commons candidates (South Tucson city-limits sign / City Hall) + 1
                   additional streetscape candidate (vintage motel sign); D-04's front-runner subject
                   (a Chicano/community mural) has NO confirmed Commons photo — see Open Question 1
                   → process_banner.py (1700×540) → upload_banner.py (cities/south-tucson.jpg) →
                   buildingImages.js CURATED_LOCAL['south tucson'] → coverage.js EXISTING Arizona
                   COVERAGE_STATES block (5th `areas` entry — the block already exists)
```

### Recommended Project Structure (files this phase touches)
```
C:/EV-Accounts/backend/
├── migrations/<disk-MAX+1>_city_of_south_tucson.sql               # NEW — structural (registered)
├── migrations/<next>_city_of_south_tucson_headshots.sql           # NEW — audit-only (unregistered)
└── migrations/<next..next+6>_south_tucson_*_stances.sql           # NEW — audit-only, one per official

C:/Transparent Motivations/essentials/
├── src/lib/coverage.js         # MODIFIED — append 'South Tucson' to the EXISTING Arizona areas[] array
└── src/lib/buildingImages.js   # MODIFIED — add 'south tucson' to CURATED_LOCAL
```

**No new backend script/loader file is needed** — South Tucson has zero sub-jurisdiction geofences to
source, and (like Sahuarita, unlike Oro Valley/Marana/Tucson) needs zero `LOCAL_EXEC` district work.

### Pattern 1: Three council-chosen titles (Mayor/Vice Mayor/Acting Mayor) on otherwise-identical at-large seats sharing ONE LOCAL row
**What:** Extends Sahuarita's (197) two-title hybrid pattern to a THIRD title. When a council elects ALL
its members at-large AND separately chooses Mayor, Vice Mayor, AND Acting Mayor from among its own
membership (no directly-elected executive office exists), model all three distinctions PURELY as `title`
strings on 3 of the 7 otherwise-identical `LOCAL`-district offices. Do NOT create a `LOCAL_EXEC` row.
**When to use:** Exactly this phase. Directly reuses Sahuarita's 1354 migration STRUCTURE (government →
chamber → ONE LOCAL district → 7 offices → office_id backfill → post-verify gate → ledger registration)
with two substitutions: (1) `governments.type='City'` not `'Town'` (South Tucson is legally a City); (2)
the post-verify gate needs a THIRD title-assertion block (Acting Mayor), not just two.
```sql
-- Sahuarita's 1354_town_of_sahuarita.sql gates (e) and (f) (exactly-1-Mayor, exactly-1-Vice-Mayor,
-- each bound to a specific external_id) are the DIRECTLY-REUSABLE template. Add a THIRD, structurally
-- identical gate for 'Acting Mayor' bound to Pablo Robles's external_id. Copy the gate SHAPE verbatim
-- three times rather than inventing a new pattern.
```

### Pattern 2: Enclave donut-hole verification via `ST_Area(ST_Intersection(...))`, not merely `ST_Intersects`
**What:** When a phase involves ANY enclave/wholly-surrounded jurisdiction, `ST_Intersects` alone is
insufficient to characterize the relationship — two polygons that merely share a boundary edge (the
expected, correct shape for a clean TIGER enclave) will return `ST_Intersects = true` even though they
have ZERO overlapping area. The diagnostic query that actually answers "is this a safe, non-overlapping
enclave?" is `ST_Area(ST_Intersection(a, b))` — if it returns `0`, the two geofences never compete for the
same point, and the app's existing `ST_Covers`-based routing needs no special-case code.
**When to use:** Any phase with a D-03-style BLOCKING enclave-routing requirement. Run this query FIRST,
before attempting any address-level point test — it settles the entire question in one shot.
**Caveat:** A non-zero intersection area (a TRUE overlap, not just a touching edge) would indicate a real
TIGER data-quality problem requiring escalation — this was NOT the case for South Tucson/Tucson this
session, but the planner should re-run this exact query at execute time in case the geofence data changed.

### Anti-Patterns to Avoid
- **Creating a `LOCAL_EXEC` district row for South Tucson's Mayor:** There is no separately-elected Mayor
  office to attach it to — Mayor (and Vice Mayor, and Acting Mayor) are `title` strings on 3 of the 7
  at-large `LOCAL` offices. A `LOCAL_EXEC` row here would be a phantom seat with no electoral basis.
- **Treating "Valenzuela is running for re-election" as equivalent to "Valenzuela will be Mayor next
  term":** These are two separate, sequential events (winning a Council seat, then being chosen Mayor by
  the newly-seated council) — exactly the same trap documented for Sahuarita's Murphy.
- **Assuming `governments.type='Town'` by copying Oro-Valley/Marana/Sahuarita verbatim:** South Tucson is
  legally a City — confirm against the live Tucson (194) `type='City'` row, not the Town precedent.
- **Recording a party affiliation:** South Tucson elections are described as nonpartisan by every source
  this session (AZ Luminaria explicitly: "South Tucson elections are nonpartisan"). `politicians.party`
  must be NULL for all 7.
- **Confusing "Historic Fourth Avenue" (a well-documented Tucson CITY arts/mural district near downtown
  and the University of Arizona) with "South Fourth Avenue" (the Mexican-food/mural corridor INSIDE the
  separate City of South Tucson):** These are two different streets/districts in two different
  municipalities despite the similar name — a real confusion risk surfaced by this session's WebSearch
  results (the "Greetings from Tucson" postcard mural and "Wagon Burner Arts" mural are on Historic 4th
  Ave in Tucson proper, NOT in South Tucson). Any mural sourced for the banner MUST be independently
  confirmed as physically located within South Tucson's city limits (south of ~22nd St / south of the
  Union Pacific rail line), not merely "on 4th Avenue" generically.
- **Using a stale recall-era roster:** This research surfaced a `tucson.com` article headlined "South
  Tucson mayor ousted in recall election" and a separate "South Tucson voters oust mayor, 3 councilmen in
  recall election" article from South Tucson's well-documented history of contentious recalls — these are
  HISTORICAL background, not the current roster. The current roster used in this research (Valenzuela/
  Brown-Dominguez/Robles/Jimenez/Diaz/Flagg/Aguirre) is sourced from the Nov 20, 2024 swearing-in
  (Tucson Spotlight) and the June 22, 2026 voter guide (AZ Luminaria) — always prefer the MOST RECENT
  dated source, and re-verify at execute time regardless (Pitfall 1/2).
- **Trusting a direct `curl`/WebFetch of `southtucsonaz.gov` as authoritative just because a WebSearch
  composite reproduced text that appears to originate there:** The site itself returned a hard Cloudflare
  JS challenge to this session's direct fetch attempts — the WebSearch tool's indexed-snippet reproduction
  is a SECONDARY reflection of that content, not a verified direct read. Re-render the actual pages via
  Playwright at execute time before finalizing the election-method/title-structure facts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Three-way rotational-title modeling (Mayor/Vice Mayor/Acting Mayor, no separately-elected office) | A synthetic `LOCAL_EXEC` seat, or three separate ad-hoc title conventions | Sahuarita's (1354) two-title pattern, extended by literal repetition to a third gate | Battle-tested shape (Sahuarita, Palm Springs, Indio) — extending it to a third title is a mechanical repetition of an already-proven gate, not a new design |
| Enclave/donut-hole routing verification | A custom bounding-box or manual visual check | `ST_Area(ST_Intersection(...))` (Pattern 2) | Directly and definitively answers "does this enclave overlap" in one query — visual/bbox checks can miss a true overlap or falsely flag a clean donut hole |
| Headshot sourcing from a Cloudflare-challenge-blocked site | Custom challenge-solving/cookie-jar/token-replay scripts | `/find-headshots` skill's Playwright flow (already built, JS-capable) | A real browser context is the standard, already-proven mitigation for exactly this vendor's challenge — no custom bypass needed |
| 4:5 headshot cropping + banner crop/resize | Custom PIL scripts | `_tmp-*-headshots.py` pipeline + `scripts/banners/process_banner.py` | Verbatim reuse |
| Roster-currency verification 4 days before a primary where the sitting Mayor is a candidate | A one-time WebSearch snippet trusted at face value | Multiple independently-corroborating sources (Tucson Spotlight Nov-2024 swearing-in + AZ Luminaria Jun-2026 voter guide) PLUS a fresh execute-time re-check that separately confirms BOTH membership AND the post-election title vote | A single-source claim here would risk exactly the trap this milestone has repeatedly flagged (Marana's Jackie Craig, Sahuarita's title-reshuffle) — compounded here by the Mayor herself being on the ballot |

**Key insight:** This phase's core engineering surface is nearly identical to Sahuarita's (one new
district row, no `LOCAL_EXEC` join anywhere) but its ROSTER-CURRENCY risk is the sharpest yet in this
milestone — not just "will the membership change" but "will the sitting MAYOR's own title survive the
post-election council vote," with only 4 days of runway from research to the primary.

## Common Pitfalls

### Pitfall 1: The July 21, 2026 primary is 4 DAYS away from this research date — the sitting Mayor is herself a candidate
**What goes wrong:** Assuming the roster documented here (Valenzuela/Brown-Dominguez/Robles/Jimenez/Diaz/
Flagg/Aguirre) will still be accurate, and that Valenzuela will still hold the Mayor title, at plan/execute
time.
**Why it happens:** 3 of 7 seats (Valenzuela's, Flagg's, Aguirre's) are up July 21, 2026; all three are
running as incumbents against 5 challengers. Even a "no membership change" outcome does NOT resolve
whether the newly-seated council re-selects Valenzuela as Mayor (a separate, sequential vote).
**How to avoid:** The planner MUST schedule a genuinely substantive BLOCKING roster-currency checkpoint at
execute time, structured like Sahuarita's (197) Task 2, explicitly checking BOTH the certified election
result AND the subsequent Mayor/Vice-Mayor/Acting-Mayor council vote before finalizing the seeded titles.
**Warning signs:** Any execute-time date on or after July 21, 2026 without an explicit fresh recheck of
certified results AND the subsequent title-reassignment vote.

### Pitfall 2: The "majority vote" vs. "no runoff this year" election-mechanics tension was not resolved this session
**What goes wrong:** Assuming a specific win-threshold mechanic (outright majority with a possible
November runoff, vs. top-3 plurality with no runoff regardless of vote share) without confirming which
applies.
**Why it happens:** AZ Luminaria's June 2026 voter guide states both "the three candidates who receive the
majority vote are declared to be elected" AND "general elections are not held unless there are other
propositions on the ballot, which there aren't this year" — these read as being in tension (a strict
majority requirement usually implies a possible runoff if no candidate reaches it).
**How to avoid:** The execute-time checkpoint should pull the certified July 21, 2026 result directly
(Pima County Elections / southtucsonaz.gov via Playwright) rather than assuming either reading.
**Warning signs:** A migration finalized before certified results are available, based only on
pre-election polling or candidate-list assumptions.

### Pitfall 3: `essentials.districts` has NO rows yet for the South Tucson boundary (`0468850`/G4110) — but only ONE new row is needed, not two
**What goes wrong:** Copying Oro Valley/Marana/Tucson's "create a LOCAL_EXEC AND a LOCAL row" migration
structure verbatim would create a phantom `LOCAL_EXEC` row with no electoral basis.
**How to avoid:** DB-confirmed this session: `SELECT COUNT(*) FROM essentials.districts WHERE
geo_id='0468850'` returns **0**. This migration must explicitly `INSERT INTO essentials.districts` exactly
ONE new row (`district_type='LOCAL'`), shared by ALL 7 offices including the three titled ones.
**Warning signs:** A migration file containing a `LOCAL_EXEC` INSERT for South Tucson at all.

### Pitfall 4: `southtucsonaz.gov` returns a Cloudflare "Just a moment..." managed challenge, not an Akamai 403 or a CivicPlus soft-empty-body
**What goes wrong:** Assuming (a) the site is entirely unreachable, or (b) treating this like a prior
phase's specific block signature (hard Akamai 403, or Sahuarita's HTTP-200-empty-body soft block).
**Why it happens:** Confirmed live 2026-07-17: `curl` (Chrome UA) returns HTTP 403 for both
`/citycouncil` and `/elections/page/city-council-election-information`, with a response body that is a
genuine Cloudflare managed-JS-challenge page (`cRay`, `cZone: 'www.southtucsonaz.gov'`,
`Enable JavaScript and cookies to continue`).
**How to avoid:** Use the `/find-headshots` skill's Playwright-based flow — a real browser context can
solve/wait out a Cloudflare managed challenge, unlike a plain `curl`. Also try the `/directory` staff page
as an additional headshot source.
**Warning signs:** A "fetched" page whose content is the literal string "Just a moment..." rather than
real council-roster HTML.

### Pitfall 5: Migration numbering — disk MAX, not ledger MAX, is authoritative; re-verify at execute time
**What goes wrong:** Assuming the next structural migration number is ledger-MAX+1.
**Why it happens:** Ledger MAX = **1354** (confirmed via `psql` 2026-07-17 — only structural migrations
register; Sahuarita's headshot + stance migrations, 1355-1362, are audit-only and do NOT register). Disk
MAX = **1362** (confirmed via `ls C:/EV-Accounts/backend/migrations` same session — the newest 5 files are
`1358..1362_sahuarita_council_*_stances.sql`).
**Next structural migration = 1363.** This gap (ledger 1354 vs. disk 1362) is a structural, recurring
project convention — audit-only migrations never register — not a one-off drift.
**How to avoid:** Re-verify BOTH numbers immediately before writing/applying any new migration file at
execute time.
**Warning signs:** `psql -f` apply failing on a duplicate filename.

### Pitfall 6: Confusing "Historic Fourth Avenue" (Tucson city, arts district near downtown/UA) with "South Fourth Avenue" (South Tucson, Mexican-food/mural corridor)
**What goes wrong:** Sourcing a banner photo, or stance-research evidence, from Historic 4th Avenue in
Tucson proper and mislabeling it as South Tucson content.
**Why it happens:** Both streets are colloquially called "4th Avenue" and both have murals; WebSearch
results for "4th Avenue mural Tucson" return a mix of both districts without always disambiguating.
**How to avoid:** Confirm the specific street address / cross-street of any candidate photo or mural is
south of the boundary that separates South Tucson from Tucson proper (roughly south of 22nd St / the
Union Pacific rail corridor) before using it. The three specific South Tucson murals identified this
session (La Tusa/Tattoo Mural at 29th & 4th Ave; Amor Querido at 1802 S. 4th Ave; El Pueblo Viejo Salsa
mural at 2514 S. 4th Ave) ARE confirmed South Tucson addresses.
**Warning signs:** A "South Tucson" banner candidate whose source article is actually about Historic 4th
Avenue, Hotel Congress, or downtown Tucson landmarks.

### Pitfall 7: `coverage.js`'s Arizona block already has 4 entries — do not recreate it
**What goes wrong:** Creating a NEW `{ name: 'Arizona', ... }` block.
**Why it happens:** Phase 194 created the Arizona block (Tucson); Phase 195 appended Oro Valley; Phase
196 appended Marana; Phase 197 appended Sahuarita — confirmed via direct file read this session
(`src/lib/coverage.js`, now 4 `areas` entries under the Arizona block).
**How to avoid:** APPEND a 5th `{ label: 'South Tucson', browseGovernmentList: ['0468850'],
browseStateAbbrev: 'AZ', hasContext: true }` entry to the EXISTING Arizona block's `areas` array.
**Warning signs:** A diff showing two separate `name: 'Arizona'` blocks — a duplicate-block bug.

### Pitfall 8: Judicial compass topics do not apply (re-verified, unchanged from every prior AZ phase)
**What goes wrong:** Stancing against all 44 live `inform.compass_topics` rows would include 8
judicial-scoped topics with no bearing on an at-large Council Member/Mayor/Vice-Mayor/Acting-Mayor.
**Why it happens:** Confirmed live this session: `inform.compass_topics WHERE is_live=true` = 44 rows;
`WHERE is_live=true AND topic_key ILIKE 'judicial%'` = 8 rows → 36 non-judicial topics.
**How to avoid:** Research against the 36 non-judicial live topics, exactly as every prior AZ deep-seed.
**Warning signs:** A verification script asserting "44 topics per official" would incorrectly flag honest,
complete 36/36 coverage as a gap.

## Code Examples

### Confirm the South Tucson government row does not yet exist (greenfield, verified live 2026-07-17)
```sql
SELECT id, name, type, state, geo_id FROM essentials.governments WHERE name ILIKE '%south tucson%';
-- => 0 rows (confirmed greenfield this session)
```

### Confirm the existing G4110 boundary, the districts gap, and Tucson's for comparison (verified live 2026-07-17)
```sql
SELECT geo_id, mtfcc, state, name FROM essentials.geofence_boundaries WHERE name ILIKE '%south tucson%';
-- => 0468850 | G4110 | 04 | South Tucson city   (from Phase 190 — already live)

SELECT geo_id, mtfcc, state, name FROM essentials.geofence_boundaries WHERE geo_id='0477000';
-- => 0477000 | G4110 | 04 | Tucson city   (for enclave comparison)

SELECT COUNT(*) FROM essentials.districts WHERE geo_id='0468850';
-- => 0   (this phase must create exactly ONE new LOCAL row — NOT two; no LOCAL_EXEC needed)
```

### D-03 BLOCKING enclave-routing verification (RESOLVED live 2026-07-17 — re-run this exact query at execute time)
```sql
-- Step 1: confirm the two polygons do NOT overlap in AREA (the diagnostic that actually matters —
-- ST_Intersects alone would misleadingly return true for a clean, non-overlapping donut hole):
SELECT
  ST_Area(ST_Intersection(st.geometry, tuc.geometry)::geography) / 1e6 AS intersection_sqkm,
  ST_Area(st.geometry::geography) / 1e6 AS south_tucson_sqkm,
  ST_Intersects(st.geometry, tuc.geometry) AS touches_or_overlaps
FROM essentials.geofence_boundaries st, essentials.geofence_boundaries tuc
WHERE st.geo_id = '0468850' AND tuc.geo_id = '0477000';
-- => intersection_sqkm = 0 | south_tucson_sqkm = 2.6596826090963 | touches_or_overlaps = t
--    (0 sq km overlap = a TRUE topological donut hole; 'touches_or_overlaps=t' is just shared boundary
--    edges, NOT area overlap — this is the CORRECT, safe signature)

-- Step 2: confirm a point inside South Tucson (centroid, and the approximate City Hall address point)
-- is covered EXCLUSIVELY by the South Tucson geofence, matching the app's own ST_Covers routing predicate:
SELECT
  (SELECT name FROM essentials.geofence_boundaries
   WHERE geo_id='0468850' AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-110.9687, 32.1948), 4326))
  ) AS covers_by_south_tucson,
  (SELECT name FROM essentials.geofence_boundaries
   WHERE geo_id='0477000' AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-110.9687, 32.1948), 4326))
  ) AS covers_by_tucson;
-- => covers_by_south_tucson = 'South Tucson city' | covers_by_tucson = NULL
--    (confirmed exclusive coverage — no double-match, no swallow-by-Tucson risk)
```
Note: South Tucson City Hall's official mailing address (1601 S 6th Ave) uses "Tucson, AZ 85713" as the
postal city (South Tucson has no distinct USPS post office) — do not use the mailing-address city string
as a proxy for jurisdiction; the geofence/geo_id is authoritative (consistent with the codebase's existing
`stateAbbrevFromGeoId` convention of trusting geo_id over any string label).

### Migration ledger + disk MAX + ext_id probes (run these exact queries again at plan/execute time)
```sql
-- Ledger MAX (DB-verified 2026-07-17):
SELECT MAX(CAST(version AS INTEGER)) FROM supabase_migrations.schema_migrations
WHERE version ~ '^[0-9]{1,4}$';
-- => 1354

-- On-disk MAX (authoritative for next-number assignment — confirmed via `ls` 2026-07-17):
-- ls C:/EV-Accounts/backend/migrations/*.sql | sort -n | tail -5 =>
--   1358_sahuarita_council_1_stances.sql ... 1362_sahuarita_council_5_stances.sql
-- (1355-1362 are Sahuarita's audit-only structural+headshots+stances migrations — unregistered, per
-- convention, except 1354 which IS the Sahuarita structural migration and IS registered)
-- Next structural migration = 1363. RE-VERIFY at execute time.

-- external_id collision check for the proposed -4015001..-4015007 block (7 people, DB-verified
-- 2026-07-17; continues the sequential AZ-town numbering after Sahuarita's -4014xxx/Phase 197):
SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4015010 AND -4015000;
-- => 0 rows (confirmed unused)
```

### compass_topics live/judicial scope (verified live 2026-07-17, unchanged from every prior AZ phase)
```sql
SELECT count(*) FROM inform.compass_topics WHERE is_live=true;                                -- => 44
SELECT count(*) FROM inform.compass_topics WHERE is_live=true AND topic_key ILIKE 'judicial%'; -- => 8
-- 36 non-judicial live topics is the research scope for all 7 South Tucson officials.
```

### southtucsonaz.gov Cloudflare-challenge confirmation (verified live 2026-07-17)
```bash
curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" \
  "https://www.southtucsonaz.gov/citycouncil" -w "\nHTTP_CODE:%{http_code}\n"
# => HTTP_CODE:403 -- response body is a Cloudflare "Just a moment..." managed-JS-challenge page
#    (confirmed cZone: 'www.southtucsonaz.gov', "Enable JavaScript and cookies to continue")
# Same result for /elections/page/city-council-election-information. Use Playwright instead.
```

### Tucson government-type precedent (confirmed live 2026-07-17 — for the type='City' recommendation)
```sql
SELECT id, name, type, state, city, geo_id FROM essentials.governments WHERE geo_id='0477000';
-- => 72fca030-...  | City of Tucson, Arizona, US | City | AZ |  | 0477000
--    (South Tucson should mirror type='City', NOT 'Town' — it is legally a City, unlike Oro Valley/
--    Marana/Sahuarita which are legally Towns)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Sahuarita (197) has TWO council-chosen titles (Mayor, Vice Mayor) | South Tucson appears to have THREE (Mayor, Vice Mayor, Acting Mayor) | Confirmed this phase via 3+ independent WebSearch composites | The migration extends Sahuarita's Pattern 1 gate mechanically to a third title — no new design needed, but the post-verify gate must assert 3 titles independently, not 2 |
| Every prior AZ suburb's WAF vendor was Akamai (hard 403) or CivicPlus (soft empty-body) | `southtucsonaz.gov` is Cloudflare-challenge-protected (managed JS challenge, hard 403 to non-JS clients) | Confirmed this phase | Still resolves to the same `/find-headshots` Playwright mitigation, but a genuinely different vendor signature worth documenting for future AZ phases |
| `coverage.js` had 4 Arizona entries after Phase 197 | The Arizona block now has 4 entries (Tucson, Oro Valley, Marana, Sahuarita) — this phase is the 5th append | Since Phase 197 | Confirmed via direct file read this session |
| Enclave-routing was previously untested in this milestone (no prior phase has a wholly-surrounded jurisdiction) | South Tucson is the FIRST enclave phase — routing correctness is now empirically confirmed via direct PostGIS geometry queries, not merely assumed | This phase | Establishes `ST_Area(ST_Intersection(...))` as the standard verification query for any future enclave/wholly-surrounded jurisdiction phase (Pattern 2) |

**Deprecated/outdated:** None specific to this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The current 7-person roster (Valenzuela/Brown-Dominguez/Robles/Jimenez/Diaz/Flagg/Aguirre) and title assignments are accurate as of the 2026-07-17 research date, cross-verified via a Tucson Spotlight article on the Nov 20, 2024 swearing-in and an AZ Luminaria June 22, 2026 voter guide — but the July 21, 2026 primary is 4 days away, the sitting Mayor is herself a candidate, and even a "no membership change" outcome does not resolve the subsequent title vote | Summary / Roster | **VERY HIGH impact if not re-verified** — the tightest research-to-election window of any phase in this milestone to date, compounded by the sitting Mayor's own candidacy |
| A2 | The THREE-title council-chosen mechanism (Mayor + Vice Mayor + Acting Mayor, none separately elected) is correctly characterized, based on 3+ independently-worded WebSearch composites that recur the same substantive claim — but this research could NOT directly render `southtucsonaz.gov` itself (Cloudflare JS-challenge-blocked to a direct `curl`) and instead relied on search-engine-indexed reproductions of that site's content | Summary / Pattern 1 | Medium — 3+ independent composites agreeing reduces risk substantially, but the planner/execute-time checkpoint should attempt a fresh, successful Playwright render of the actual elections/charter page to read the exact language directly, not just a search-engine's reproduction of it |
| A3 | `politicians.party` should be NULL (nonpartisan), based on AZ Luminaria's explicit "South Tucson elections are nonpartisan" statement | Anti-Patterns to Avoid | Low — party is never displayed regardless (antipartisan design), and this claim is more directly stated than in some prior AZ phases |
| A4 | `governments.type` should be `'City'` (not `'Town'`), based on every source this session referring to "City of South Tucson" / never "Town" — cross-verified against the live Tucson (194) `type='City'` DB row | Standard Stack / Code Examples | Low — a naming-convention choice; does not affect routing or the routing map (`G4110→LOCAL` is keyed by geo_id, not by `governments.type`) |
| A5 | The two Wikimedia Commons banner candidates identified this session ("South Tucson city limits from 6th ave." and "South Tucson City Hall," both CC BY-SA 4.0, 2,816×2,112, by Rgper22008, 2009) are licensing-clean and usable, and the "Star motel south tucson" candidate (CC BY 2.0, Dan DeLuca/Flickr 2017, confirmed full resolution 3,840×2,866) is a viable streetscape alternative — but NONE of the three specific, real, documented South Tucson murals (La Tusa, Amor Querido, El Pueblo Viejo Salsa) were confirmed to have an existing Commons-licensed photo this session | Open Questions | Medium — the D-04 front-runner subject (murals) has a real sourcing gap; the execution-phase pass should attempt a dedicated photo search/direct-photograph of one of the three named murals before defaulting to the safe City-Hall/welcome-sign candidates |

**If this table is empty:** N/A — see rows above. A1 (roster currency, 4 days from a primary where the
sitting Mayor is a candidate) is the single highest-risk claim in this research; A2 (the three-title
structural finding) is the single highest-IMPACT claim, since it changes the migration shape from the
CONTEXT.md default expectation and extends even Sahuarita's precedent by one additional title.

## Open Questions (deferred to execution-time checkpoints: Q1 → banner-sourcing pass, Q2 → Plan 01 Task 2, Q3 → informational only)

1. **Is there a licensable, high-resolution photo of a specific South Tucson mural (La Tusa/Tattoo Mural,
   Amor Querido, or El Pueblo Viejo Salsa) that this session did not surface?**
   - What we know: All three murals are real, well-documented (Borderlore, KGUN9, local press), with
     specific confirmed South Tucson street addresses (29th & 4th Ave; 1802 S. 4th Ave; 2514 S. 4th Ave).
     D-04 names "Chicano/community murals" as the front-runner subject.
   - What's unclear: No Wikimedia Commons file for any of these three specific murals was located this
     session. It is unclear whether a licensable photo exists on Flickr (CC-licensed), via direct
     photographer outreach, or whether the mural has since been repainted/removed (murals in this corridor
     "rotate occasionally or get refreshed," per one source).
   - Recommendation: The execution-phase banner-sourcing pass should (a) run a dedicated Flickr CC-license
     search for each of the three named murals/addresses, (b) check Borderlore's own site for a
     reusable-license photo credit, and (c) if none is found, fall back to the two verified, safe Commons
     candidates ("South Tucson city limits from 6th ave." or "South Tucson City Hall," both CC BY-SA 4.0,
     2,816×2,112) or the "Star motel south tucson" streetscape candidate (CC BY 2.0, 3,840×2,866) —
     mirroring how Sahuarita's low-res pecan-orchard gap was handled (attempt the front-runner subject
     first, accept a safe secondary if unavailable at usable resolution/license).

2. **Will the July 21, 2026 primary resolve outright, and will the post-election council re-select the
   same three titleholders (Mayor Valenzuela, Vice Mayor Brown-Dominguez, Acting Mayor Robles)?**
   - What we know: 3 seats are up (Valenzuela, Flagg, Aguirre, all incumbents) against 5 challengers;
     South Tucson's elections are nonpartisan; sources differ slightly on whether an outright majority is
     required per seat or a top-3 plurality wins regardless (see Pitfall 2). Brown-Dominguez's and
     Robles's seats are NOT up this cycle (elected/reelected Nov 2024, terms to 2028), but their TITLES
     could still be reshuffled by a newly-seated council if Valenzuela's, Flagg's, or Aguirre's seat
     changes hands.
   - What's unclear: Given this research is dated 4 days before the primary, the outcome is unknowable at
     research time, and the exact win-threshold mechanic was not resolved to certainty.
   - Recommendation: The execute-time checkpoint (Pitfall 1) must independently confirm BOTH the certified
     membership AND the post-election Mayor/Vice-Mayor/Acting-Mayor vote — a genuinely two-stage
     confirmation, exactly as Sahuarita's research recommended, but with an added urgency given the
     Mayor's own candidacy.

3. **What is the exact nature/history of South Tucson's documented recall pattern, and could it recur
   around this election?**
   - What we know: Multiple `tucson.com` headlines document past recall elections that ousted a sitting
     Mayor and multiple councilmen; South Tucson has a well-documented history of political turmoil.
   - What's unclear: Whether any active recall effort exists against the CURRENT roster as of this
     research date — none was surfaced this session, but it was not exhaustively ruled out either.
   - Recommendation: Immaterial to the CURRENT-roster seeding decision unless the execute-time checkpoint
     surfaces an active recall petition — worth a quick news check at execute time given the pattern, but
     not a blocking concern absent specific evidence.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `psql` | Inline orchestrator DB apply/verify | ✓ | PostgreSQL 18.1 client, confirmed on PATH 2026-07-17 | — |
| Python 3 + Pillow + requests + psycopg2 | Headshot/banner pipeline | ✓ (proven in every prior AZ phase) | — | — |
| Geofence loader (`npx tsx`) | NOT NEEDED this phase | N/A | — | N/A — no sub-jurisdiction geofence to source; enclave routing needs no new code |
| `southtucsonaz.gov` (official headshot + roster source) | Headshot + roster sourcing | ✗ direct fetch — confirmed HTTP 403 Cloudflare "Just a moment..." managed-JS-challenge to both `curl` and WebFetch this session | — | Playwright browser navigation (`/find-headshots` skill) to solve/wait-out the challenge; also try `/directory` staff page; Ballotpedia/news as a secondary fallback |
| `mcp__playwright__browser_navigate` | Headshot sourcing fallback + election-info re-render | ✓ (per `/find-headshots` skill, confirmed present on disk in prior phases) | — | — |
| `mcp__supabase-local` / Supabase MCP | (NOT available to `gsd-executor`) | ✗ for the executor | — | Inline-orchestrator `psql` pattern (this research itself used direct `psql` against `C:/EV-Accounts/backend/.env` `DATABASE_URL` — confirmed working, including live PostGIS enclave-geometry queries) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `southtucsonaz.gov` (Cloudflare-challenge-blocked to non-browser
clients) — Playwright + Ballotpedia/news as documented above. `mcp__supabase-local` unavailable to the
executor — established inline-orchestrator `psql` pattern is the correct workflow, not a workaround.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3 (project-wide `npm run test` → `vitest run`), no dedicated config file |
| Config file | none |
| Quick run command | `npx vitest run src/lib/buildingImages.test.js` |
| Full suite command | `npm run test` |

This phase is overwhelmingly backend data-seeding (SQL migrations only — no geofence loader) with exactly
TWO frontend touches (`coverage.js` append; `buildingImages.js` append). The primary "test" mechanism for
the backend work is the established in-migration `DO $$ ... RAISE EXCEPTION` post-verify gate pattern plus
inline-orchestrator `psql` audit SELECTs — same harness as every prior deep-seed phase. The D-03 enclave
check adds one additional pre-flight/verification query class (`ST_Area(ST_Intersection(...))`), also run
via inline `psql`.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUB-04 (govt/roster) | Standalone-shaped City of South Tucson government, ONE City Council chamber, 7 at-large Council offices ALL sharing ONE LOCAL district (`0468850`/G4110) — NO LOCAL_EXEC row — Mayor/Vice Mayor/Acting Mayor as title annotations on 3 of the 7, `party` NULL for all 7 | integration (SQL DO-block + psql audit) | in-migration `DO $$` gate (row counts, section-split, THREE title-annotation gates each bound to a specific external_id, party-NULL check) + orchestrator `psql -c "SELECT ..."` audits | ✅ pattern exists (Sahuarita 1354 gates (e)/(f) are the directly-reusable two-title template, extended to three) |
| SUB-04 (enclave routing) | A South Tucson address point is covered EXCLUSIVELY by the South Tucson geofence, never double-matched with Tucson's | integration (PostGIS query) | `ST_Area(ST_Intersection(...))` = 0 check (Pattern 2) + `ST_Covers` point test on a known South Tucson address, re-run at execute time | ✅ resolved this session — re-verify unchanged at execute time |
| SUB-04 (headshots) | 7/7 officials have a 600×750 `politician_images` row | smoke (HTTP HEAD/GET + PIL dimension check) | Python pipeline's own dry-run HTTP-200-AND-nonzero-bytes pre-check + post-upload CDN HTTP 200 + PIL `(600,750)` assertion | ✅ pattern exists |
| SUB-04 (stances) | Evidence-only compass stances, 100% cited, no defaults, honest blanks, 36 non-judicial topics per official | manual-only (evidence-based research) | N/A — human/agent research process; automated check is a `psql` row-count + citation-completeness audit | ✅ pattern exists |
| BANR-01 | Licensed South Tucson banner sourced, processed, uploaded, wired into `buildingImages.js`, surfaced via the EXISTING Arizona `coverage.js` block | unit (Vitest) + smoke (CDN HTTP) | `npx vitest run src/lib/buildingImages.test.js` + `curl -I https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/south-tucson.jpg` | ✅ `buildingImages.test.js` exists; no dedicated `coverage.test.js` exists (established non-gap) |

### Sampling Rate
- **Per task commit:** in-migration `DO $$` gate (backend); `node --input-type=module -e "import(...)"` parse-check (coverage.js)
- **Per wave merge:** full `psql` audit suite (row counts, casing, section-split, enclave re-check) + `npx vitest run src/lib/buildingImages.test.js`
- **Phase gate:** All SQL post-verify gates green + operator-approved roster-currency checkpoint (the substantive kind — Pitfall 1/2) + `npm run test` green before `/gsd:verify-work`

### Wave 0 Gaps
None — same established non-gaps as every prior deep-seed phase.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Public read-only data; no auth surface touched |
| V3 Session Management | No | N/A |
| V4 Access Control | No | Public-read RLS policies already in place on all touched tables (matching prior phases) |
| V5 Input Validation | Yes | No new untrusted external data ingestion this phase (no geofence loader) — the structural migration must still parameterize any dynamic values in the same idiom as prior phases |
| V6 Cryptography | No | N/A — no secrets generated or stored by this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Section-split (offices attached under the wrong government) | Tampering | Chamber scoped to `government_id` subquery `WHERE name='City of South Tucson, Arizona, US'`; post-verify `DO` block section-split gate must return 0 rows |
| Wrong-district attach (offices silently matching 0 rows due to a bare geo_id or casing mismatch) | Tampering | Every office↔district join scoped by `district_type='LOCAL'` AND `state='az'` (lowercase) AND `geo_id='0468850'`, never a bare geo_id |
| Phantom `LOCAL_EXEC` row (misrepresenting a non-existent separately-elected Mayor office) | Tampering (data integrity) | This migration creates NO `LOCAL_EXEC` row at all — Pitfall 3 codifies this explicitly |
| Enclave double-match (a South Tucson address silently resolving to Tucson's council instead of, or in addition to, South Tucson's) | Tampering (data integrity) | D-03's BLOCKING enclave check (Pattern 2) — `ST_Area(ST_Intersection(...))` = 0 confirmed this session; re-verify unchanged at execute time before apply |
| Service-role key / `DATABASE_URL` leakage | Information disclosure | Read from gitignored `C:/EV-Accounts/backend/.env`; never hardcoded in the migration or scripts |
| Seeding a roster superseded by an active election, without disclosure, OR seeding a Mayor/Vice-Mayor/Acting-Mayor title that the post-election council vote later changes | Tampering (data integrity) | The roster-currency checkpoint (Pitfall 1/2) is the control here — BOTH the membership question and the separate post-election title-reassignment question must be independently re-verified, with added scrutiny since the sitting Mayor is herself a candidate |

## Sources

### Primary (HIGH confidence — direct live verification in this session)
- `psql` live queries against production Supabase DB (`C:/EV-Accounts/backend/.env` `DATABASE_URL`,
  confirmed reachable 2026-07-17) — ledger MAX (1354) / disk MAX (1362) cross-check, South Tucson
  government-row absence, `geofence_boundaries` G4110 boundary confirmation (`0468850` distinct from
  Tucson's `0477000`), `essentials.districts` zero-row gap, external_id collision check
  (`-4015010..-4015000` = 0 rows), `inform.compass_topics` live/judicial counts (44 live / 8 judicial),
  and — new this session — direct PostGIS enclave-geometry verification (`ST_Area(ST_Intersection(...))`
  = 0 km²; `ST_Covers` point tests on the South Tucson centroid and an approximate City-Hall-area point).
- `curl` live queries against `southtucsonaz.gov` (both `/citycouncil` and
  `/elections/page/city-council-election-information` return HTTP 403 with a genuine Cloudflare
  "Just a moment..." managed-JS-challenge response body, confirmed with a Chrome User-Agent this session).
- `C:/EV-Accounts/backend/migrations/1354_town_of_sahuarita.sql` (read directly this session — the
  directly-reusable two-title hybrid template, extended to a third title for South Tucson's
  Mayor/Vice-Mayor/Acting-Mayor structure).
- `C:/Transparent Motivations/essentials/src/lib/coverage.js` and `src/lib/buildingImages.js` (read
  directly this session — confirmed the Arizona `COVERAGE_STATES` block currently has 4 entries [Tucson,
  Oro Valley, Marana, Sahuarita], and the `CURATED_LOCAL` append pattern).
- `essentials.governments` row for Tucson (geo_id `0477000`, `type='City'`) — read directly this session,
  supporting the `type='City'` recommendation for South Tucson.

### Secondary (MEDIUM confidence — WebFetch/WebSearch, cross-verified against each other)
- Tucson Spotlight, "South Tucson City Council swears in new members, makes leadership changes" (WebFetch,
  dated around the Nov 20, 2024 event) — full 7-person roster, Mayor/Vice-Mayor/Acting-Mayor
  leadership-change details, "Paul Diaz (former Mayor)" context.
- AZ Luminaria, "Your voter guide: Where South Tucson City Council candidates stand on key issues"
  (WebFetch, dated 2026-06-22) — 2026 election details (3 seats up, 8 total candidates, nonpartisan
  election-method description, primary date July 21 2026, no expected November general).
- WebSearch composites (multiple independent queries) reproducing consistent language apparently sourced
  from `southtucsonaz.gov`'s own Elections/City-Council pages — 7 elected officers, 4-year staggered
  terms, "one of whom is designated as mayor, one of whom is designated as vice mayor and one whom is
  designated as Acting-Mayor," and the post-election council-vote mechanism for choosing these titles.
  NOTE: the direct site itself was Cloudflare-blocked this session — this is a secondary/indexed
  reflection of that content, not a directly-rendered primary source (see Assumption A2).
- `tucson.com` — "South Tucson mayor ousted in recall election" and "South Tucson voters oust mayor, 3
  councilmen in recall election" — historical background on South Tucson's recall politics (NOT current
  roster — see Anti-Patterns to Avoid).
- KGUN9, "South Tucson Primary Elections 2024: Four council seats, seven candidates" — 2024 election
  cycle context (superseded by the current roster, useful for corroborating the 4-seats/3-seats staggered
  cycle).
- Ballotpedia candidate pages (`Roxanna_Valenzuela_(South_Tucson_City_Council,_Arizona,_candidate_2026)`,
  `Debbie_Federico_(South_Tucson_City_Council,_Arizona,_candidate_2026)`) — confirmed to exist (HTTP 200
  via direct `curl`) but returned thin/JS-rendered content to both `curl` and WebFetch this session;
  treated as a secondary corroboration signal only, not a primary text source.
- Wikimedia Commons `Category:South Tucson, Arizona` — 6 files identified this session; `Southtucson.JPG`
  ("South Tucson city limits from 6th ave.") and `Southtucson1.JPG` ("South Tucson City Hall"), both CC
  BY-SA 4.0 by Rgper22008 (2009), 2,816×2,112 — confirmed licensing and resolution via direct file-page
  fetch. `Star_motel_south_tucson_(33398061074).jpg`, CC BY 2.0, Dan DeLuca/Flickr (2017), confirmed full
  resolution 3,840×2,866 via direct file-page fetch.
- Borderlore.org — "La Tusa, The Tattoo Mural" article, confirming the mural's real existence, location
  (29th & 4th Ave), and creators (Las Artes program, muralists Alex Garza and Lupe Ruiz) — no Commons
  photo located this session (see Open Question 1).

### Tertiary (LOW confidence — not deeply used, or genuinely unresolved)
- The exact win-threshold mechanic for the July 21, 2026 primary (strict majority with a possible runoff,
  vs. top-3 plurality with no runoff) — not resolved to certainty this session (Pitfall 2 / Open
  Question 2).
- The specific existence/status of any Commons or Flickr CC-licensed photo of the "Amor Querido" or
  "El Pueblo Viejo Salsa" murals — not confirmed either way this session (Open Question 1).
- Whether any active recall effort exists against the current roster as of 2026-07-17 — not surfaced this
  session, but not exhaustively ruled out either (Open Question 3).

## Metadata

**Confidence breakdown:**
- Standard stack / tooling: HIGH — zero new dependencies; mirrors Sahuarita's simpler (no-LOCAL_EXEC)
  shape, directly confirmed via DB queries this session.
- Structural DB shape (government/chamber/districts/offices): HIGH — directly DB-verified this session
  (greenfield status, geofence presence, districts-gap, ext_id range, Tucson's `type='City'` precedent).
- Enclave routing (D-03, BLOCKING): HIGH — directly resolved via live PostGIS queries this session
  (`ST_Area(ST_Intersection(...))` = 0; `ST_Covers` point tests exclusive to South Tucson). Re-verify
  unchanged at execute time per standard convention, but no outstanding risk identified.
- Election-method / three-title structure: MEDIUM — corroborated 3+ ways via WebSearch composites that
  all appear to trace to the same primary source, but that primary source (`southtucsonaz.gov`) could not
  be directly rendered this session (Cloudflare-blocked) — re-confirm via Playwright at execute time.
- Roster currency: **LOW-MEDIUM, VERY HIGH-URGENCY** — the current 7-person roster and title assignments
  are well-corroborated via two independently-dated news sources, but the July 21, 2026 primary is only 4
  days from this research date, THREE seats are up, and — uniquely risky — the sitting MAYOR is herself
  one of the three incumbent candidates. Treat as requiring an execute-time checkpoint that independently
  re-verifies BOTH the membership and the title assignment, with extra scrutiny on the Mayor's own seat.
- Migration numbering / ext_id scheme: HIGH — directly DB-verified this session, including a fresh
  ledger-vs-disk cross-check.
- Stance-topic scope: HIGH — directly DB-verified this session, unchanged from every prior AZ phase.
- Banner mechanism: HIGH (wiring itself, unchanged code) / MEDIUM (2 safe, verified Commons candidates
  found + 1 additional streetscape candidate; the D-04 front-runner mural-photo subject carries a real,
  documented sourcing gap — see Open Question 1).

**Research date:** 2026-07-17
**Valid until:** 30 days for the DB/migration-numbering and structural facts (re-verify ledger/disk MAX
at plan/execute time regardless, per established convention); enclave-routing geometry is stable
indefinitely absent a TIGER re-import. **Effectively 0-4 days for the roster-currency facts** — the July
21, 2026 primary is imminent, and the SUBSEQUENT Mayor/Vice-Mayor/Acting-Mayor council vote (which may
land after this phase's likely execute window) is an independent, unresolved event on top of that. Treat
the roster table in the Summary as provisional pending a genuinely substantive execute-time checkpoint
that checks BOTH events explicitly, with special attention to the Mayor's own seat.

# Phase 195: Oro Valley Deep-Seed - Research

**Researched:** 2026-07-10
**Domain:** Greenfield at-large town government seeding (Mayor + 6 undifferentiated at-large council
seats, NO ward/sub-jurisdiction geofences needed) + evidence-only compass stances + community banner
(Postgres/PostGIS backend in `C:/EV-Accounts`, React frontend in this repo)
**Confidence:** HIGH (structural/technical) / MEDIUM-LOW (roster currency — see Summary, this is the
single most important finding of this research)

<user_constraints>
## User Constraints (from CONTEXT.md)

No `195-CONTEXT.md` exists yet — `/gsd:discuss-phase` has not been run for this phase. This research
was scoped directly from `.planning/REQUIREMENTS.md` (SUB-01, BANR-01), `.planning/ROADMAP.md` §"Phase
195," and the Phase 193 (Pima County)/194 (Tucson) precedent, per the parent orchestrator's
`additional_context`. The planner should treat the findings below as the input a discuss-phase session
would otherwise have locked, and flag any genuinely open calls (see Open Questions) for the user.

### Locked Decisions
None yet formalized — no CONTEXT.md. The milestone-wide deep-seed shape (government + chamber →
roster → 600×750 headshots → evidence-only stances → licensed banner → coverage.js) is already locked
at the REQUIREMENTS.md level (SUB-01, BANR-01) and is not re-litigated here.

### Claude's Discretion
Everything in this document is offered as a strong, evidence-backed recommendation for the planner
(and, if a discuss-phase session runs before planning, for the user) to ratify — modeled tightly on
the Pima (193) / Tucson (194) precedent, adapted for Oro Valley's simpler at-large-only structure.

### Deferred Ideas (OUT OF SCOPE)
- 10 proposed local compass questions / 8 Local Lens topics (deferred milestone-wide).
- School-board stances (deferred milestone-wide, no school-board badge built).
- Marana / Sahuarita / South Tucson deep-seeds (Phases 196–198).
- 2026 Arizona election shells / candidate discovery (Phase 199) — **NOTE:** Oro Valley itself has an
  active, contested 2026 election in progress RIGHT NOW (primary imminent) — this phase seeds the
  CURRENT sitting roster, not the election outcome; Phase 199 is where 2026 race shells belong.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUB-01 | Oro Valley deep-seed — government + roster → 600×750 headshots → evidence-only stances → licensed community banner → surfaced in `src/lib/coverage.js` | GOVERNMENT/GEOFENCE confirmed greenfield (no existing Oro Valley government row; the G4110 town boundary `0451600` already exists from Phase 190, `essentials.districts` has ZERO rows for it — same gap as Tucson's Pitfall 5); ELECTION METHOD confirmed ALL-AT-LARGE, nonpartisan, 7-member council-manager town (Mayor + 6, NO wards — Wikipedia + Ballotpedia candidate pages cross-verified); ROSTER resolved via primary-source cross-verification (2024 election-results article with vote counts + a third-party civic site listing all 7 current members with `@orovalleyaz.gov` emails) AFTER discovering and rejecting a stale WebSearch composite (see Pitfall 1 — directly analogous to Tucson's Vice-Mayor conflict, but higher-stakes here); **CRITICAL TIMING RISK**: an active, contested 2026 election (Mayor + 3 council seats, ALL 3 incumbents apparently not seeking re-election) has an imminent primary (date itself conflicting across sources — either July 21 or Aug 4, 2026) with a Nov 3, 2026 general — this phase's execution window may land during or immediately after this primary; HEADSHOTS confirmed WAF-blocked at the official source (same Akamai signature as Tucson) with a fallback path identified; MIGRATIONS numbering DB-verified (next structural = 1305, ext_id block `-4009001..-4009007` confirmed unused) |
| BANR-01 | Licensed Oro Valley community banner, processed via `scripts/banners/`, wired into `buildingImages.js`, distinct from Tucson (downtown streetscape) / Pima (Catalina Mountains landscape) / AZ-state (Phoenix skyline) | Banner mechanism confirmed identical to the Tucson/Pima `CURATED_LOCAL`/`coverage.js` wiring (append to the now-EXISTING Arizona `COVERAGE_STATES` block — no new state block needed this time, unlike Tucson); 3 real, appropriately-licensed Oro Valley Wikimedia Commons candidates identified with dimensions/license, flagged for a visual-distinctiveness concern the planner should weigh (shortlist only — one-at-a-time execution-phase sourcing pass still required) |
</phase_requirements>

## Summary

**The single most important finding of this research is a live, unresolved roster-currency risk more
severe than any prior phase in this milestone has faced.** Oro Valley is in the middle of an actively
contested 2026 municipal election cycle at the exact moment of this research (2026-07-10): Mayor Joe
Winfield is confirmed NOT seeking re-election, and — per one source (a `voteorovalley.com` "vote for"
slate site implying Winfield/Barrett/Jones-Ivey/Nicolson are running as a re-election ticket) versus
another (a WebSearch-generated summary asserting Jones-Ivey and Nicolson are "not seeking
reelection") — **it is not even clear from open-source research who, if anyone, among the 3 sitting
council members whose seats are up (Vice Mayor Melanie Barrett, Joyce Jones-Ivey, Josh Nicolson) is
running again.** Separately, the primary election date itself is reported inconsistently across
sources as either **July 21, 2026** or **August 4, 2026** (both within roughly 1–4 weeks of this
research date), with a **November 3, 2026 general** consistently confirmed. **This phase's execution
window is genuinely at risk of landing during or immediately after this primary.** The planner MUST
budget a blocking roster-currency human-verify checkpoint at execute time — not a formality, but a
substantive re-check against a live source (Playwright against the WAF-blocked `orovalleyaz.gov`
Town-Clerk election page, or a fresh news search) to confirm (a) the exact primary/general dates, (b)
whether results have been certified, and (c) if certified, whether the seed should reflect the OLD or
NEW officeholders — this decision point did not exist for Tucson or Pima, whose rosters were stable
relative to their research/execution windows.

**Separately, and just as important structurally: a first-pass WebSearch composite for "current Oro
Valley Town Council members" returned a STALE roster** (Tim Bohen and Steve Solomon as sitting
members) that is factually wrong as of any date after November 2024 — both were replaced in the July
30, 2024 election (Bohen lost outright; Solomon did not seek re-election), per a directly-sourced
election-results article with certified vote counts (Robb 10,498, Murphy 10,043, Greene [incumbent,
re-elected] 8,147, Bohen [incumbent, defeated] 7,592). **This is the exact same failure mode
documented in Tucson's Pitfall 2 (AI-blended stale + fresh search snippets)** — the correct, current
7-person roster below was cross-verified via (1) the certified 2024 election-results article, (2) each
official's individual `orovalleyaz.gov` profile-page existence (confirmed via a third-party civic
site, `iloveov.com`, which lists all 7 current members with matching `@orovalleyaz.gov` email
addresses), and (3) independent per-official term-expiration facts (Jones-Ivey: elected 2018,
re-elected 2022, term to Nov 2026; Nicolson: elected 2018, term to Nov 2026; Winfield: re-elected 2022,
term to Nov 2026 — all three up this cycle, consistent with the "Mayor + 3 council seats" election
description found independently).

**Current confirmed sitting roster (2026-07-10, cross-verified 3 ways — see caveat above about
imminent turnover):**
| Seat | Name | Term expires | Notes |
|------|------|--------------|-------|
| Mayor (at-large) | Joseph "Joe" Winfield | Nov 2026 | Re-elected 2022; **confirmed NOT seeking re-election in 2026** |
| Council (at-large) | Melanie Barrett | Nov 2026 | Current Vice Mayor (council-appointed, not separately elected); **running for Mayor in 2026** per multiple sources — her council seat is therefore open regardless |
| Council (at-large) | Joyce Jones-Ivey | Nov 2026 | Elected 2018, re-elected 2022; sources conflict on 2026 re-election intent (see above) |
| Council (at-large) | Josh Nicolson | Nov 2026 | Elected 2018, re-elected 2022; sources conflict on 2026 re-election intent (see above) |
| Council (at-large) | Dr. Harry "Mo" Greene II | Nov 2028 | Incumbent, re-elected July 2024 (8,147 votes) |
| Council (at-large) | Mary Murphy | Nov 2028 | Elected July 2024 (10,043 votes), first term |
| Council (at-large) | Elizabeth Robb | Nov 2028 | Elected July 2024 (10,498 votes, top vote-getter), first term |

All 7 seats are elected **at-large, nonpartisan** — no wards, no council districts, no separately
numbered "positions" (Oro Valley's system is genuine block-voting: whoever runs for the N open seats in
a single combined race, the top-N vote-getters win — confirmed by the actual 2024 result, 4 candidates
racing for 3 seats with the top 3 by raw vote count winning). `politicians.party` should be **left
NULL/blank** for all 7 (Wikipedia confirms nonpartisan elections; the live-verified Beaverton, OR
precedent — another nonpartisan at-large council — stores `party` as NULL for every politician,
confirmed by direct DB query) — this is a meaningful DIVERGENCE from Tucson, which is the one AZ city
confirmed to run partisan elections; Oro Valley follows the normal (non-Tucson) AZ nonpartisan
municipal-election convention.

**Structurally, this phase is significantly SIMPLER than Tucson's flagship and closer to the
Beaverton/Torrance at-large-city shape than to Pima/Tucson's ward-geofence-loader shape.** Oro Valley
has NO wards and NO council districts — the Mayor and all 6 council members are elected on the exact
same town-wide boundary. The Town of Oro Valley's G4110 place boundary (`geo_id='0451600'`) is already
live in `essentials.geofence_boundaries` from Phase 190 (confirmed: `04|G4110|0451600|Oro Valley
town`), but — **exactly the same gap Tucson's Pitfall 5 found** — `essentials.districts` has **ZERO
rows** for it today (Phase 190's place-layer load writes geofences only, never district rows). This
phase needs exactly **TWO new `essentials.districts` rows** (one `LOCAL_EXEC` for the Mayor, one
`LOCAL` for the 6 council members — ALL 6 sharing this SAME single `LOCAL` row, not 6 separate
geofences) — **NO geofence loader script, NO ArcGIS query, NO multi-ring/winding-order handling, NO
new custom `X00xx` mtfcc code is needed at all.** The closest DB-verified precedent for this exact
"7 offices, 2 district rows, one shared LOCAL row for all council seats" shape is **Torrance, CA**
(live-queried: Mayor `LOCAL_EXEC` + 6 undifferentiated `'Council Member'` offices all pointing to ONE
`LOCAL` district row, both on `geo_id='0680000'`) — a closer match than Beaverton's per-numbered-
"Position N" shape, because Oro Valley's actual electoral mechanic (undifferentiated block-voting, not
6 separately-numbered position races) matches Torrance's, not Beaverton's.

Headshots present the same obstacle as Tucson: `orovalleyaz.gov` (the official Mayor/Council bio-page
host) returned HTTP 403 with the identical Akamai `X-Reference-Error` WAF signature to both `curl`
(full modern User-Agent) and `WebFetch`, confirmed live 2026-07-10. A third-party civic site
(`iloveov.com`) that lists the current roster has NO embedded photos. At least one council member
(Elizabeth Robb) has a reachable personal campaign site (`robb4ovcouncil.com`, confirmed HTTP 200) that
may carry a usable photo; the established `/find-headshots` skill's Playwright-based fallback (same as
Tucson's Pitfall 3 resolution) is the recommended sourcing path for the rest.

**Primary recommendation:** Follow the Torrance/Beaverton at-large-with-Mayor shape (NOT Tucson's
ward-geofence-loader shape) almost verbatim: ONE `Town Council` chamber (`official_count=7`) holding 1
`LOCAL_EXEC` Mayor office + 6 undifferentiated `'Council Member'` `LOCAL` offices, ALL 7 offices
resolving to the SAME pre-existing `0451600`/G4110 geofence via 2 new `essentials.districts` rows.
Vice Mayor is a title annotation on Melanie Barrett's seat (mirroring the Tucson/Pima title-suffix
precedent), NOT a separate office. **The single highest-priority planning action is scoping a
substantive, non-perfunctory roster-currency checkpoint that explicitly accounts for the live 2026
election** — the planner should treat this as a genuine BLOCKING decision point, not a
copy-paste-from-Tucson formality.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Town boundary (Mayor + all 6 council, one shared geofence) | Database / Storage (`essentials.geofence_boundaries`, ALREADY LIVE from Phase 190) | — | No new geometry work this phase — reuses the existing `0451600`/G4110 row entirely |
| Government/chamber/office/politician seed | Database (`essentials.governments/chambers/districts/offices/politicians`) | — | Structural migration, same tier as every prior deep-seed; simplest shape yet (2 district rows, not 7) |
| Address → Mayor + at-large council routing | API / Backend (`essentialsService.ts`, unchanged code) | Database (geofence + district join) | The existing `G4110→(LOCAL,LOCAL_EXEC)` mapping already covers this — zero code change, and this phase doesn't even need the `X%` catch-all path Tucson/Pima required |
| 600×750 headshots | Database / Storage (`politician_images`, `politician_photos` bucket) | Playwright (fallback sourcing for WAF-blocked `.gov` source) | Same DB/Storage tier as every prior phase; sourcing tier mirrors Tucson (WAF blocks direct HTTP) |
| Compass stances | Database (`inform.politician_answers`) | — | Evidence-only INSERTs; no frontend change |
| Community banner | Frontend (`src/lib/buildingImages.js` CURATED_LOCAL) + Storage (`politician_photos/cities/`) | Frontend (`src/lib/coverage.js`, EXISTING Arizona `COVERAGE_STATES` block — just append) | The Arizona block already exists (created by Phase 194) — this is a plain append, not a new-block creation like Tucson faced |
| Coverage surfacing (chip) | Frontend (`src/lib/coverage.js`) | — | `hasContext:true` once ≥1 stance row exists |

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PostgreSQL/PostGIS (Supabase) | Live prod (`kxsdzaojfaibhuzmclfq`) | Structural + audit migrations | Same DB as every prior phase |
| `psql` CLI | 18.1 (confirmed on PATH, 2026-07-10) | Inline orchestrator apply + DB-verify | `gsd-executor` has no Supabase MCP — orchestrator applies via `psql` against `C:/EV-Accounts/backend/.env` `DATABASE_URL` |
| Python 3 (`py -3`) + Pillow 12.1.1 + `requests` + `psycopg2` | Confirmed installed and working 2026-07-10 | Headshot crop/resize/upload pipeline | Verbatim reuse from Phases 191/193/194 |
| `mcp__playwright__browser_navigate` (+ snapshot/click/close) | Already available per `/find-headshots` skill | Headshot sourcing **fallback** for the WAF-blocked `orovalleyaz.gov` host | Confirmed necessary (curl/WebFetch both 403, identical Akamai signature to Tucson) |
| `scripts/banners/process_banner.py` + `upload_banner.py` | Already present | Banner crop-to-1700×540 + Storage upload | No new tooling |

**NOT needed this phase (unlike Tucson/Pima):** `npx tsx` / any TypeScript geofence loader script — Oro
Valley has no sub-jurisdiction geofences to source or load. This is a genuine, confirmed simplification,
not an oversight — the Town's ONE existing G4110 boundary already covers the Mayor and all 6 council
seats.

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `iloveov.com` (third-party Oro Valley civic-news site) | live | Roster cross-check (no photos) | Confirms current 7-person roster with `@orovalleyaz.gov` emails matching individual official profile-page URLs |
| `robb4ovcouncil.com` (Elizabeth Robb's personal campaign site) | live, HTTP 200 confirmed | Potential headshot fallback for one official | Confirmed reachable 2026-07-10; license terms not yet reviewed (execution-phase task) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Torrance's "undifferentiated `Council Member`, all 6 share ONE LOCAL district row" shape | Beaverton's "`Council Member (Position N)`, still all 6 share ONE LOCAL district row, but titled per-number" | Beaverton's numbering implies 6 SEPARATE numbered-seat races (each with its own candidate slate), which does NOT match Oro Valley's actual electoral mechanic (a single combined at-large race, top-N vote-getters win, confirmed by the 2024 result). Torrance's plain, undifferentiated title is the more electorally-accurate choice — flag this as an explicit call for the planner (see Open Questions) |

**Installation:** No new packages. All tooling already present and proven in Phases 161/162/175/191/
192/193/194.

**Version verification:** N/A — zero new dependencies introduced.

## Package Legitimacy Audit

**N/A this phase.** No new npm/pip/cargo packages are installed. All tooling (`pg`, Pillow, `requests`,
`psycopg2`, Playwright MCP) is already present and proven across Phases 161, 162, 175, 191, 192, 193,
194. `slopcheck` was not run — nothing to audit (matches every prior deep-seed phase's RESEARCH.md).

## Architecture Patterns

### System Architecture Diagram

```
Town of Oro Valley G4110 boundary (ALREADY LIVE from Phase 190: geo_id='0451600', state='04' FIPS)
        │  (no geofence loader needed — the same boundary serves BOTH the Mayor and all 6 council seats)
        ▼
Structural migration 1305_town_of_oro_valley.sql
   ├─ essentials.governments  ('Town of Oro Valley, Arizona, US', type='Town', state='AZ', geo_id='0451600')
   ├─ essentials.chambers     ('Town Council', official_count=7 — Mayor + 6 at-large council, ONE chamber)
   ├─ essentials.districts    NEW LOCAL_EXEC row (geo_id='0451600', mtfcc='G4110', state='az' — did NOT
   │                          exist before this phase, same gap as Tucson's Pitfall 5)
   │                          + ONE NEW LOCAL row (geo_id='0451600', mtfcc='G4110', state='az' — ALL 6
   │                          council offices share this SAME single row, Torrance-precedent shape)
   └─ essentials.politicians + essentials.offices  (7 people, ext_id -4009001..-4009007, party=NULL — nonpartisan)
        │  office_id back-fill + post-verify DO block (row counts, casing, section-split, VM annotation)
        ▼
Address routing (NO CODE CHANGE — the existing G4110→(LOCAL,LOCAL_EXEC) mapping already covers both
the Mayor's and all 6 council members' district_type/mtfcc combination; no X% catch-all needed)
        │
        ▼
Resident's profile shows their at-large Mayor + all 6 at-large council members (no per-address
differentiation among the 6 — this IS the correct at-large behavior, not a bug)
        │
        ├─ Headshots: orovalleyaz.gov WAF-blocked (confirmed, same Akamai signature as Tucson) →
        │             Playwright fallback (/find-headshots skill) → crop-first 4:5 → 600×750 Lanczos
        │             → politician_images (audit-only)
        ├─ Stances: evidence-only research (Tucson Local Media/Explorer News, iloveov.com,
        │           Tucson Sentinel, tucson.com, AZPM — orovalleyaz.gov meeting agendas ALSO
        │           WAF-blocked) → inform.politician_answers
        └─ Banner: Wikimedia CC Oro Valley photo → process_banner.py (1700×540)
                   → upload_banner.py (cities/oro-valley.jpg)
                   → buildingImages.js CURATED_LOCAL['oro valley'] → coverage.js EXISTING Arizona
                     COVERAGE_STATES block (just append a new `areas` entry — the block itself
                     already exists, created by Phase 194)
```

### Recommended Project Structure (files this phase touches)
```
C:/EV-Accounts/backend/
├── migrations/1305_town_of_oro_valley.sql            # NEW — structural (registered)
├── migrations/1306_town_of_oro_valley_headshots.sql  # NEW — audit-only (unregistered)
└── migrations/1307..1313_oro_valley_*_stances.sql    # NEW — audit-only, one per official (Mayor + 6 council)

C:/Transparent Motivations/essentials/
├── src/lib/coverage.js         # MODIFIED — append 'Oro Valley' to the EXISTING Arizona areas[] array
└── src/lib/buildingImages.js   # MODIFIED — add 'oro valley' to CURATED_LOCAL
```

**No new backend script/loader file is needed** — the single biggest structural difference from the
Tucson (194) and Pima (193) recommended-structure sections.

### Pattern 1: All-at-large council sharing ONE LOCAL district row (Torrance precedent, DB-verified)
**What:** When a council has no wards/districts at all — every seat elected on the exact same
town-wide boundary — model it as ONE `LOCAL` district row shared by every council office (not N
separate rows, and not N separate `LOCAL_EXEC` rows either).
**When to use:** Exactly this phase. **Live-confirmed precedent:** Torrance, CA — `City Council`
chamber, `official_count=7`, 1 `LOCAL_EXEC` Mayor office (`geo_id=0680000`) + 6 `LOCAL` `'Council
Member'` offices ALL pointing to the SAME single `LOCAL` district row at the same `geo_id` — queried
live 2026-07-10.
```sql
-- Verified live pattern (Torrance): 6 offices, titled identically, ONE shared LOCAL district row
SELECT o.title, d.district_type, d.geo_id, COUNT(*)
FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
JOIN essentials.chambers c ON c.id=o.chamber_id
JOIN essentials.governments g ON g.id=c.government_id
WHERE g.name ILIKE '%Torrance%' GROUP BY o.title, d.district_type, d.geo_id;
-- => Council Member | LOCAL | 0680000 | 6    (all 6 share this one row)
-- => Mayor           | LOCAL_EXEC | 0680000 | 1
```
Apply verbatim to Oro Valley: `geo_id='0451600'` for both new district rows.

### Pattern 2: Vice Mayor as a title-suffix annotation on the currently-appointed occupant (LOCKED shape, carried from Pima/Tucson)
**What:** Wikipedia confirms Oro Valley's Vice Mayor is "appointed by the council from amongst its
elected members" (not separately elected) — the same rotating-annotation shape as Pima's Chair and
Tucson's Vice Mayor.
```sql
-- Adapt verbatim from 1296_city_of_tucson.sql's Vice Mayor pattern:
-- title = 'Council Member (Vice Mayor)' for Melanie Barrett's office ONLY.
-- role_canonical stays NULL on all 7 offices — annotation lives in `title` only.
```
**Caveat unique to this phase:** Barrett is simultaneously the sitting Vice Mayor AND a 2026 candidate
for MAYOR (not for re-election to her council seat) — this does not change how her CURRENT office
should be modeled (still `'Council Member (Vice Mayor)'` today), but the roster-currency checkpoint
must re-confirm this remains accurate at execute time given the imminent election.

### Anti-Patterns to Avoid
- **Building a geofence loader script for Oro Valley:** Unlike Tucson/Pima, there is nothing to
  source or load — the Town's one G4110 boundary already exists and covers every seat. Do not copy
  `load-tucson-ward-boundaries.ts` or `load-pima-supervisor-boundaries.ts` as a structural template for
  this phase; use the Torrance/Beaverton migration shape instead.
- **Numbering council seats "Position 1"–"Position 6":** Oro Valley's actual electoral mechanic is
  undifferentiated block-voting (confirmed by the 2024 election: 4 candidates for 3 seats, top-3 by
  raw vote count won) — NOT 6 separately-contested numbered-position races like Beaverton. Use the
  Torrance-style plain `'Council Member'` title for all 6 unless the planner's own research
  independently confirms Oro Valley formally numbers its seats (not found in this research).
- **Recording a party affiliation:** Oro Valley elections are nonpartisan (Wikipedia-confirmed);
  `politicians.party` should be NULL, matching the Beaverton (nonpartisan at-large city) precedent —
  NOT the Tucson precedent (Tucson is the confirmed partisan outlier among AZ cities).
- **Treating the stale WebSearch roster (Bohen, Solomon) as current:** Both were replaced in the July
  2024 election (Bohen defeated outright, Solomon did not seek re-election) — verified via a certified
  election-results article with vote counts. Do not seed these two names.
- **Treating the current roster as stable through execution without re-checking:** An active,
  contested election with an imminent primary (July 21 or Aug 4, 2026 depending on source) is
  underway. A perfunctory "assume nothing changed since Phase 194" checkpoint is NOT sufficient here.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| At-large council district modeling | A per-seat geofence or a "fake ward" scheme to differentiate the 6 council seats | The Torrance-precedent shared-`LOCAL`-row shape (Pattern 1) | Battle-tested, DB-verified, and matches Oro Valley's actual at-large electoral mechanic exactly |
| Headshot sourcing from a WAF-blocked `.gov` host | Custom scraping/proxy/User-Agent-spoofing code | `/find-headshots` skill's Playwright browser-navigation flow (already built, already MCP-available) | Purpose-built for exactly this failure mode (same Akamai WAF signature as Tucson); do not reinvent |
| 4:5 headshot cropping + banner crop/resize | Custom PIL scripts | `_tmp-*-headshots.py` pipeline + `scripts/banners/process_banner.py` (both already proven) | Verbatim reuse |
| Roster-currency verification during an active election | A one-time WebSearch snippet trusted at face value | Multiple independently-corroborating primary sources (certified election-results article + individual official profile-page cross-check + a live re-check at execute time) | A single WebSearch composite was independently proven WRONG in this research session (stale Bohen/Solomon names) |

**Key insight:** This phase's ONLY genuinely new engineering surface is deciding the exact council-seat
title convention (plain `'Council Member'` vs. numbered) and getting the roster-currency checkpoint
right during an active election — everything else (chamber/office/politician seeding shape, headshot
pipeline, banner pipeline, coverage.js append) is established pattern reuse, now simplified relative to
Tucson because no custom geofence work is required at all.

## Common Pitfalls

### Pitfall 1: A first-pass WebSearch roster composite is STALE by roughly 20 months (pre-Nov-2024)
**What goes wrong:** Multiple independent WebSearch queries for "current Oro Valley Town Council
members" all returned the SAME roster listing Tim Bohen and Steve Solomon as sitting members — both
are factually wrong for any date after November 2024.
**Why it happens:** The same AI-blended-stale-and-fresh-snippet failure mode documented in Tucson's
Pitfall 2, but here it recurred across MULTIPLE distinct search queries (not just one), suggesting the
stale composite is deeply cached/reinforced in the search index for this topic.
**How to avoid:** Cross-verify against a primary, dated source with concrete facts (the certified
July 2024 election-results article with vote counts) rather than a generic "who is on the council"
query. This research also found a corroborating third-party site (`iloveov.com`) listing all 7 current
members with `@orovalleyaz.gov` emails matching individual official profile-page URLs — use BOTH
corroboration types, not just one, given how persistently the stale composite recurred.
**Warning signs:** A search result naming Bohen or Solomon as a current member — treat this as an
immediate signal the source is stale, not a fact to seed.

### Pitfall 2: An active, contested 2026 election overlaps this phase's likely execution window
**What goes wrong:** Assuming the current 7-person roster documented in this research will still be
accurate at execute time. Mayor Winfield is confirmed not running; 3 council seats (Barrett — running
for Mayor instead, Jones-Ivey, Nicolson) are up, with **conflicting reports on whether any of the 3
incumbents are running for re-election to their council seats** (one campaign-slate site,
`voteorovalley.com`, implies Jones-Ivey and Nicolson ARE running; a WebSearch composite says they are
NOT). The primary date itself is reported inconsistently (July 21 vs. August 4, 2026), both within
weeks of this research date; the general is Nov 3, 2026.
**Why it happens:** This research was conducted in the middle of an active campaign season with
rapidly-changing news coverage and candidate-committed campaign sites that may themselves be
out-of-date or aspirational.
**How to avoid:** The planner MUST schedule a genuinely substantive (not perfunctory) blocking
roster-currency human-verify checkpoint at execute time. This checkpoint should (a) attempt a fresh
Playwright fetch of the WAF-blocked `orovalleyaz.gov` Town-Clerk elections page for the authoritative
primary/general date and candidate list, (b) check whether primary results have been certified, and (c)
if certified, decide explicitly (with the human) whether to seed the outgoing or incoming officeholder
for any changed seat — do not silently assume "no change since research."
**Warning signs:** Any execute-time date past the (uncertain) July 21/Aug 4, 2026 primary without an
explicit fresh recheck.

### Pitfall 3: Council seats are undifferentiated at-large, NOT separately numbered "positions"
**What goes wrong:** Copying Beaverton's `'Council Member (Position N)'` title convention verbatim
would imply Oro Valley holds 6 separate numbered-seat elections (each with its own distinct candidate
field) — this does NOT match Oro Valley's actual electoral mechanic.
**Why it happens:** Beaverton IS a legitimate, closely analogous "Mayor + at-large council in one
chamber" precedent, but its ballot structure differs: Oregon cities commonly number at-large positions
even without geographic differentiation. Oro Valley's own 2024 election (4 candidates, single combined
race, top 3 by raw vote count win) confirms a genuine block-voting system with no seat numbering.
**How to avoid:** Use the Torrance-precedent plain `'Council Member'` title (Pattern 1) for all 6 seats
unless the planner independently finds Oro Valley's town code or ballot format formally numbers seats
(not found in this research — flagged as an Open Question).
**Warning signs:** A ballot/candidate filing page showing "Position 1," "Position 2," etc. — if found,
switch to the Beaverton numbering convention instead.

### Pitfall 4: `essentials.districts` has NO rows yet for the Oro Valley boundary (`0451600`/G4110)
**What goes wrong:** Assuming "the town boundary already exists" (true for `geofence_boundaries`, per
Phase 190) means offices can attach directly — they cannot. `essentials.districts WHERE
geo_id='0451600'` returns **zero rows** (confirmed live 2026-07-10) — identical gap to Tucson's
Pitfall 5, for the identical reason (Phase 190's place-layer load writes geofences only, never district
rows).
**How to avoid:** This migration must explicitly `INSERT INTO essentials.districts` TWO new rows
(`LOCAL_EXEC` for the Mayor, `LOCAL` shared by all 6 council members) before (or in the same
transaction as) attaching offices to them.
**Warning signs:** An office INSERT's district-lookup subquery silently matching 0 rows.

### Pitfall 5: `orovalleyaz.gov` (headshots AND meeting-agenda source) is Akamai-WAF-blocked
**What goes wrong:** Assuming stance-research agents or the headshot pipeline can fetch
`orovalleyaz.gov` directly.
**Why it happens:** Confirmed live 2026-07-10: `curl` (full Chrome User-Agent) and `WebFetch` both
return HTTP 403 with an `X-Reference-Error` header — the identical Akamai WAF signature documented in
Tucson's Pitfall 3.
**How to avoid:** Use the `/find-headshots` skill's Playwright-based flow for headshots. For stance
research, rely on the same evidence-source list already proven for Tucson/Pima — Tucson Local
Media/Explorer News, Tucson Sentinel, AZPM, tucson.com/Arizona Daily Star, and the third-party
`iloveov.com` civic site (all confirmed reachable via WebSearch/WebFetch this session).
**Warning signs:** A `curl -I` or WebFetch call against any `orovalleyaz.gov` path returning 403 with
an `X-Reference-Error` header.

### Pitfall 6: Migration numbering — disk MAX (1304), not ledger MAX (1296), is authoritative, AND a same-day cross-milestone number collision already occurred once
**What goes wrong:** Assuming the next structural migration number is ledger-MAX+1, or trusting a
single snapshot of disk MAX without re-checking for concurrent collisions.
**Why it happens:** Ledger MAX is **1296** (Phase 194's structural migration registered itself); disk
MAX is **1304** (Tucson's 7 stance files, audit-only, consumed 1298–1304 without registering).
**Additionally — concrete evidence found this session:** migration number **1296 was independently
reused by an UNRELATED, concurrently-authored file** (`1296_senate_2026_deep_seed.sql`, a different
workstream) — proving that disk-number collisions between parallel work genuinely happen in this
project, not just a theoretical risk.
**How to avoid:** DB/disk-verified live 2026-07-10: ledger MAX=1296, disk MAX=1304. **Next structural
migration = 1305.** Re-verify BOTH numbers immediately before writing/applying any new migration file
at execute time — the 1296 collision is direct proof this can change between research and execution
even within the same day.
**Warning signs:** `psql -f` apply failing on a duplicate filename.

### Pitfall 7: Judicial compass topics do not apply (re-verified, unchanged from Phase 193/194)
**What goes wrong:** Stancing against all 44 live `inform.compass_topics` rows would include 8
`judicial-*` keys that have no bearing on a Mayor or at-large council member.
**Why it happens:** `office_scope` remains empty/NULL for all 44 live topics (re-confirmed live
2026-07-10) — manual research convention, not DB-enforced.
**How to avoid:** Research against the 36 non-judicial live topics, exactly as Phases 193/194.
**Warning signs:** A verification script asserting "44 topics per official" would incorrectly flag
honest, complete 36/36 coverage as a gap.

### Pitfall 8: `coverage.js`'s Arizona block already exists — do not recreate it
**What goes wrong:** Copying Tucson's Pitfall 6 verbatim and assuming a NEW `{ name: 'Arizona', ... }`
block must be created.
**Why it happens:** Phase 194 already created the first Arizona `COVERAGE_STATES` block (confirmed
live via grep — it now contains one `areas` entry, `'Tucson'`).
**How to avoid:** APPEND a new `{ label: 'Oro Valley', browseGovernmentList: ['0451600'],
browseStateAbbrev: 'AZ', hasContext: true }` entry to the EXISTING Arizona block's `areas` array —
do not create a second `{ name: 'Arizona', ... }` block.
**Warning signs:** A diff showing two separate `name: 'Arizona'` blocks in `coverage.js` — this would
be a duplicate-block bug, not a Tucson-style "first entry" situation.

## Code Examples

### Confirm the Oro Valley government row does not yet exist (greenfield, verified live 2026-07-10)
```sql
SELECT id, name, type, state, geo_id FROM essentials.governments
WHERE name ILIKE '%oro valley%' OR name ILIKE '%orovalley%';
-- => 0 rows (confirmed greenfield)
```

### Confirm the existing G4110 boundary and the districts gap (verified live 2026-07-10)
```sql
SELECT geo_id, mtfcc, state, name FROM essentials.geofence_boundaries WHERE name ILIKE '%oro valley%';
-- => 0451600 | G4110 | 04 | Oro Valley town   (from Phase 190 — already live)

SELECT COUNT(*) FROM essentials.districts WHERE geo_id='0451600';
-- => 0   (this phase must create the LOCAL_EXEC + LOCAL rows)
```

### Torrance's all-at-large-council precedent (the structural template to copy — verified live 2026-07-10)
```sql
SELECT o.title, d.district_type, d.geo_id, d.state, COUNT(*)
FROM essentials.offices o JOIN essentials.chambers c ON c.id=o.chamber_id
JOIN essentials.governments g ON g.id=c.government_id
LEFT JOIN essentials.districts d ON d.id=o.district_id
WHERE g.name ILIKE '%Torrance%' GROUP BY o.title, d.district_type, d.geo_id, d.state;
--  Mayor          | LOCAL_EXEC | 0680000 | CA | 1
--  Council Member | LOCAL      | 0680000 | CA | 6     <- all 6 share ONE district row
```

### Beaverton's nonpartisan `party` convention (confirms `party` should be NULL for Oro Valley, verified live 2026-07-10)
```sql
SELECT DISTINCT party FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id=p.id
JOIN essentials.chambers c ON c.id=o.chamber_id
JOIN essentials.governments g ON g.id=c.government_id
WHERE g.name ILIKE '%Beaverton%';
-- => (empty result — party is NULL for every Beaverton politician, the nonpartisan-city convention)
```

### orovalleyaz.gov WAF confirmation (verified live 2026-07-10)
```bash
curl -sI -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" \
  "https://www.orovalleyaz.gov/Government/Departments/Mayor-and-Council/Elected-Officials"
# => HTTP/1.1 403 Forbidden; X-Reference-Error header confirms Akamai WAF (identical signature to Tucson)
curl -s -o /dev/null -w "%{http_code}\n" "https://www.robb4ovcouncil.com/"
# => 200 (potential headshot-sourcing fallback for Elizabeth Robb)
```

### Migration ledger + external_id probes (run these exact queries at plan/execute time)
```sql
-- Ledger MAX (DB-verified 2026-07-10):
SELECT MAX(CAST(version AS INTEGER)) FROM supabase_migrations.schema_migrations
WHERE version ~ '^[0-9]{1,4}$';
-- => 1296

-- On-disk MAX (authoritative for next-number assignment — DB-verified 2026-07-10):
-- ls C:/EV-Accounts/backend/migrations/*.sql, sort by number => 1304
-- Next structural migration = 1305.
-- NOTE: 1296 was independently reused by an unrelated concurrent file
-- (1296_senate_2026_deep_seed.sql) — re-verify both numbers again at execute time, do not trust
-- this snapshot blindly (see Pitfall 6).

-- external_id collision check for the proposed -4009001..-4009007 block (7 people):
SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4009010 AND -4009000;
-- => 0 rows (confirmed unused 2026-07-10)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Tucson/Pima required a custom sub-jurisdiction geofence loader (ward/supervisor-district boundaries) | Oro Valley needs NO geofence loader — Mayor and all 6 council share the existing G4110 boundary | This phase (first "pure at-large" AZ jurisdiction in the milestone) | Simpler migration, no ArcGIS/multi-ring work, no new mtfcc code; budget LESS engineering time here than Tucson/Pima, MORE time on the roster-currency checkpoint |
| Tucson recorded partisan `party` (the AZ outlier) | Oro Valley (like Beaverton/most AZ towns) is nonpartisan — `party` NULL | Confirmed this phase | Do not assume every AZ city phase records party the way Tucson did |
| `coverage.js` had no Arizona `COVERAGE_STATES` block before Phase 194 | The Arizona block now exists — this phase only appends | Since Phase 194 | A simpler frontend touch than Tucson's "first AZ city" situation |

**Deprecated/outdated:** None specific to this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The current 7-person roster (Winfield/Barrett/Jones-Ivey/Nicolson/Greene/Murphy/Robb) is accurate as of the 2026-07-10 research date, based on cross-verifying a certified 2024 election-results article + a third-party civic-site roster listing, NOT a direct fetch of the WAF-blocked official source | Summary / Roster | **HIGH impact if not re-verified** — see Pitfall 2. This is the highest-risk assumption in this entire research document; the planner MUST NOT skip a substantive re-check at execute time |
| A2 | Council seats are genuinely undifferentiated at-large (no formal seat numbering), inferred from the 2024 election's single combined-race/top-3-winners format, not from a direct reading of the Oro Valley Town Code's election-method section | Standard Stack / Pattern 1 / Pitfall 3 | Medium — if seats ARE formally numbered (not found in this research), the office titles would need the Beaverton-style `(Position N)` suffix instead; low functional-routing impact either way since all 6 share one district row regardless of title text |
| A3 | `politicians.party` should be NULL (nonpartisan), based on Wikipedia's "elections are nonpartisan" statement and the Beaverton DB precedent, not an independent reading of Arizona's municipal-election statutes for Oro Valley specifically | Summary / Roster | Low — party is never displayed regardless (antipartisan design); even if wrong, no UI impact |
| A4 | The exact 2026 primary date (July 21 vs. August 4) is unresolved — both dates appeared in independent search results with no clear tie-breaker found in this session | Summary / Pitfall 2 | Low-to-medium — doesn't block seeding the CURRENT roster, but the execute-time checkpoint's date-comparison logic depends on knowing the real date; flagged explicitly as unresolved rather than guessed |
| A5 | Banner candidates (Wikimedia Commons Oro Valley photos) are shortlisted by dimension/license/subject-matter only, not independently visually reviewed against Pima's already-shipped Catalina-Mountains banner for a side-by-side similarity check | Standard Stack / Don't Hand-Roll | Low-to-medium — 2 of the 3 shortlisted candidates both feature Pusch Ridge (part of the same Santa Catalina range Pima's banner uses); the execution-phase one-at-a-time sourcing pass should weigh this explicitly (see Open Questions) |

**If this table is empty:** N/A — see rows above. A1 (roster currency during an active election) is
the single highest-risk claim in this research and should be the planner's top priority to re-verify,
not merely acknowledge.

## Open Questions (RESOLVED — deferred to execution-time checkpoints: Q1 → Plan 01 Task 2, Q2 → Plan 04 Task 1, Q3 → Plan 01 Task 2)

All three questions below are time/execution-dependent (they cannot be settled on paper before a live
re-check during an active election) and are each operationalized as a blocking execution-time gate in
the plans — they are RESOLVED-by-deferral, not unresolved design ambiguities.

1. **Are Oro Valley council seats formally numbered ("Position 1"–"6"), or genuinely undifferentiated
   at-large (Torrance-style)?**
   - What we know: The 2024 election ran as a single combined race (4 candidates, top-3 by vote count
     won) — strongly suggesting undifferentiated at-large, matching Torrance.
   - What's unclear: This research did not locate Oro Valley's Town Code election-method section
     directly (the official site is WAF-blocked) to confirm definitively.
   - Recommendation: Default to the Torrance-precedent plain `'Council Member'` title (no numbering).
     If the planner or execute-time checkpoint finds explicit seat-numbering language in candidate
     filing materials, switch to Beaverton's `(Position N)` convention instead — either way, all 6
     offices share the SAME single `LOCAL` district row (this part is not in question).

2. **Should the banner avoid Pusch Ridge/Catalina-range imagery entirely, given Pima's banner already
   uses a Santa Catalina Mountains view?**
   - What we know: Oro Valley's Wikipedia page identifies Pusch Ridge as ITS defining local landmark
     (distinct from the broader Catalina range used generically in Pima's banner); 2 of 3 shortlisted
     Commons candidates feature it; a genuine street-scene candidate (`Oro_Valley_Calle_Concordia.JPG`)
     also happens to include Pusch Ridge in the background (lower resolution, 1095×821).
   - What's unclear: Whether a reviewer would find the two banners (Pima's Catalina-range landscape and
     an Oro-Valley-Pusch-Ridge shot) too visually similar side-by-side on the coverage/browse pages.
   - Recommendation: The execution-phase one-at-a-time banner-sourcing pass should explicitly consider
     this distinctiveness question (per the project's established "visually distinct from sibling
     banners" convention) — potentially searching beyond Wikimedia Commons' 21-file Oro Valley category
     for a genuinely different subject (e.g., Oro Valley Marketplace, Steam Pump Ranch historic site,
     or the Oro Valley Community Center) if a non-mountain option is preferred. Not a blocker — Pima's
     own banner precedent (mountain landscape) was already approved, so a second Catalina-range view is
     not disqualifying, just worth a deliberate look before finalizing.

3. **How should the execute-time roster-currency checkpoint handle a primary result that lands
   mid-phase?**
   - What we know: The primary (July 21 or Aug 4, 2026 — date itself unresolved) could occur before,
     during, or shortly after this phase executes; the general is Nov 3, 2026.
   - What's unclear: Project convention for "seed who represents residents TODAY" is clear when the
     roster is stable (every prior phase), but this is the first AZ deep-seed phase where an election
     could resolve WHILE the phase is being planned/executed.
   - Recommendation: If the checkpoint runs BEFORE the primary (whichever date is correct), seed the
     current 7-person roster documented here (still accurate — nothing changes mid-primary). If the
     checkpoint runs AFTER a certified primary result (a nonpartisan AZ primary can produce an outright
     >50% winner with no need for the Nov general), the human-verify checkpoint should explicitly ask
     whether to seed the newly-certified officeholder(s) instead — this is a genuine judgment call,
     not something this research can pre-resolve, since it depends on the actual execute date.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `psql` | Inline orchestrator DB apply/verify | ✓ | PostgreSQL 18.1 (confirmed on PATH 2026-07-10) | — |
| Python 3 (`py -3`) + Pillow + requests + psycopg2 | Headshot/banner pipeline | ✓ (confirmed working 2026-07-10: Python 3.14.3, Pillow 12.1.1, psycopg2 importable) | 3.14.3 | — |
| `npx tsx` / geofence loader | NOT NEEDED this phase | N/A | — | N/A — no sub-jurisdiction geofence to source |
| `orovalleyaz.gov` (official headshot + agenda source) | Headshot sourcing, stance-research primary citations | ✗ (Akamai WAF, 403 to curl + WebFetch, identical signature to Tucson) | — | Playwright browser navigation (`/find-headshots` skill) for headshots; news-outlet coverage (Tucson Local Media/Explorer News, Tucson Sentinel, AZPM, tucson.com, iloveov.com) for stance citations |
| `mcp__playwright__browser_navigate` (+ snapshot/click/close) | Headshot sourcing fallback | ✓ (MCP-available per `/find-headshots` skill) | — | — |
| `mcp__supabase-local` / Supabase MCP | (NOT available to `gsd-executor`) | ✗ for the executor | — | Inline-orchestrator `psql` pattern (established, no gap) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `orovalleyaz.gov` (WAF-blocked) — Playwright + alternate
sources as documented above. `mcp__supabase-local` unavailable to the executor — established
inline-orchestrator `psql` pattern is the correct workflow itself, not a workaround.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3 (project-wide `npm run test` → `vitest run`), no dedicated config file |
| Config file | none |
| Quick run command | `npx vitest run src/lib/buildingImages.test.js` |
| Full suite command | `npm run test` |

This phase is overwhelmingly backend data-seeding (SQL migrations only — no geofence loader script this
time) with exactly TWO frontend touches (`coverage.js` — an append to the existing Arizona block, not a
new block; `buildingImages.js`). The primary "test" mechanism for the backend work is the established
in-migration `DO $$ ... RAISE EXCEPTION` post-verify gate pattern plus inline-orchestrator `psql` audit
SELECTs — same harness as every prior deep-seed phase.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUB-01 (govt/roster) | Standalone-shaped Town of Oro Valley government, ONE Town Council chamber, Mayor (LOCAL_EXEC, `0451600`/G4110) + 6 at-large council offices (LOCAL, SAME `0451600`/G4110 row), Vice Mayor annotation on Barrett's seat only, `party` NULL for all 7 | integration (SQL DO-block + psql audit) | in-migration `DO $$` gate (row counts, section-split, VM-annotation count+identity, party-NULL check) + orchestrator `psql -c "SELECT ..."` audits | ✅ pattern exists (Torrance/Beaverton precedent) |
| SUB-01 (headshots) | 7/7 officials have a 600×750 `politician_images` row | smoke (HTTP HEAD/GET + PIL dimension check) | Python pipeline script's own dry-run HTTP-200 pre-check + post-upload CDN HTTP 200 + PIL `(600,750)` assertion (established pattern) | ✅ pattern exists |
| SUB-01 (stances) | Evidence-only compass stances, 100% cited, no defaults, honest blanks, 36 non-judicial topics researched per official | manual-only (evidence-based research) | N/A — human/agent research process; automated check is a `psql` row-count + citation-completeness audit | ✅ pattern exists |
| BANR-01 | Licensed Oro Valley banner sourced, processed, uploaded, wired into `buildingImages.js`, surfaced via the EXISTING Arizona `coverage.js` block | unit (Vitest) + smoke (CDN HTTP) | `npx vitest run src/lib/buildingImages.test.js` + `curl -I https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/oro-valley.jpg` | ✅ `buildingImages.test.js` exists; no dedicated `coverage.test.js` exists (established non-gap) |

### Sampling Rate
- **Per task commit:** in-migration `DO $$` gate (backend); `node --input-type=module -e "import(...)"` parse-check (coverage.js)
- **Per wave merge:** full `psql` audit suite (row counts, casing, section-split) + `npx vitest run src/lib/buildingImages.test.js`
- **Phase gate:** All SQL post-verify gates green + operator-approved roster-currency checkpoint (the substantive kind — see Pitfall 2) + `npm run test` green before `/gsd:verify-work`

### Wave 0 Gaps
None — same established non-gaps as every prior deep-seed phase (`coverage.test.js` doesn't exist for
any prior county/city addition, `buildingImages.test.js` already exercises `CURATED_LOCAL` generically).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Public read-only data; no auth surface touched |
| V3 Session Management | No | N/A |
| V4 Access Control | No | Public-read RLS policies already in place on all touched tables (confirmed `politician_images: public read` policy, matching prior phases) |
| V5 Input Validation | Yes | No new untrusted external data ingestion this phase (no geofence loader) — but the structural migration must still parameterize any dynamic values in the same idiom as prior phases |
| V6 Cryptography | No | N/A — no secrets generated or stored by this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Section-split (offices attached under the wrong government) | Tampering | Chamber scoped to `government_id` subquery `WHERE name='Town of Oro Valley, Arizona, US'`; post-verify `DO` block section-split gate must return 0 rows, matching every prior phase |
| Wrong-district attach (offices silently matching 0 rows due to a bare geo_id or casing mismatch) | Tampering | Every office↔district join scoped by `district_type` AND `state='az'` (lowercase) AND `geo_id='0451600'`, never a bare geo_id |
| Service-role key / `DATABASE_URL` leakage | Information disclosure | Read from gitignored `C:/EV-Accounts/backend/.env`; never hardcoded in the migration or scripts; applied only by the inline orchestrator |
| Seeding a roster that is about to be superseded by an active election, without disclosure | Tampering (data integrity) | The roster-currency checkpoint (Pitfall 2) is the control here — this is a data-honesty risk more than a security one, but the project's "seed who represents residents today, document the date" convention is the mitigation |

## Sources

### Primary (HIGH confidence — direct live verification in this session)
- `psql` live queries against production Supabase DB (`C:/EV-Accounts/backend/.env` `DATABASE_URL`) —
  ledger MAX/disk MAX cross-check (incl. the 1296 collision discovery), Oro Valley government-row
  absence, `geofence_boundaries` G4110 boundary confirmation, `essentials.districts` zero-row gap,
  external_id collision check, Torrance/Beaverton precedent queries, `inform.compass_topics`
  live/judicial counts (44/8, unchanged from Phases 193/194).
- `curl` live queries against `orovalleyaz.gov` (WAF 403 confirmation, identical Akamai signature to
  Tucson) and `robb4ovcouncil.com` (HTTP 200 confirmation).
- `C:/EV-Accounts/backend/migrations/1296_city_of_tucson.sql` / `1288_pima_county_board_of_
  supervisors.sql` (referenced via 194/193-RESEARCH.md and PATTERNS.md, not re-read in full this
  session — this session's DB queries directly verified the Torrance/Beaverton precedent instead).
- `C:/Transparent Motivations/essentials/src/lib/coverage.js` (grep-confirmed the Arizona block already
  exists post-Phase-194, containing one `'Tucson'` entry) + `src/lib/buildingImages.js` (grep-confirmed
  `'pima county'` and `tucson` CURATED_LOCAL entries as the append pattern to follow).

### Secondary (MEDIUM confidence — WebFetch/WebSearch, cross-verified against each other or DB facts)
- Wikipedia, "Oro Valley, Arizona" (WebFetch) — council-manager form of government, 7-member council,
  Vice Mayor appointed (not elected), nonpartisan elections, population, geography (Pusch Ridge,
  Cañada del Oro, Tortolita/Santa Catalina Mountains).
- `iloveov.com/oro-valley/mayor-and-council/` (WebFetch) — current 7-person roster with
  `@orovalleyaz.gov` emails, cross-verified against the certified 2024 election-results article.
- `tucsonlocalmedia.com/explorernews/news/oro-valley-results-final-recount-in-marana-race/` and the
  companion "Challengers still leading" article (WebSearch summary of tucson.com) — certified July 2024
  election results with vote counts (Robb 10,498, Murphy 10,043, Greene 8,147, Bohen 7,592 defeated).
- WebSearch results confirming Jones-Ivey (elected 2018, re-elected 2022, term to Nov 2026) and Nicolson
  (elected 2018, term to Nov 2026) term-expiration facts.
- `iloveov.com/2026-election/` (WebFetch) — 2026 candidate lists for Mayor (Napier, Barrett) and Council
  (Dailey, Herrington, DeSimone, Pina, Wood); July 21, 2026 primary date (conflicts with a separate
  WebSearch result citing August 4 — see Pitfall 2/Assumption A4).
- Wikimedia Commons file pages (WebFetch) for `Pusch_Ridge_from_Oro_Valley.jpg` (CC BY-SA 3.0/GFDL,
  2304×1728) and `Oro_Valley_Calle_Concordia.JPG` (CC BY-SA 3.0, 1095×821) — banner candidates.

### Tertiary (LOW confidence — not deeply used, or genuinely conflicting)
- WebSearch composite roster (Bohen/Solomon as "current" members) — CONFIRMED STALE/WRONG, retained in
  this document only as a documented pitfall example, not as a source of fact.
- The July 21 vs. August 4, 2026 primary-date conflict — neither source could be definitively
  tie-broken in this session; flagged as unresolved (Assumption A4), not guessed.
- `voteorovalley.com` (a campaign "vote for" slate site) implying Jones-Ivey/Nicolson ARE running for
  re-election — conflicts with a WebSearch composite saying they are NOT; neither resolved (see
  Pitfall 2).

## Metadata

**Confidence breakdown:**
- Standard stack / tooling: HIGH — zero new dependencies; genuinely simpler than Tucson/Pima (no
  geofence loader needed at all).
- Structural DB shape (government/chamber/districts/offices): HIGH — directly DB-verified against two
  independent live precedents (Torrance, Beaverton), and the greenfield/gap status of Oro Valley itself
  was directly queried, not assumed.
- Roster currency: **MEDIUM-LOW** — the CURRENT (pre-election) 7-person roster is well-corroborated
  (2 independent primary sources), but an active, contested election with genuinely conflicting
  reports on incumbent re-election intent and an unresolved primary date makes this the single
  highest-uncertainty finding in the whole document. Treat as HIGH-URGENCY for the planner's
  checkpoint design, not as a settled fact.
- Migration numbering / ext_id scheme: HIGH — directly DB-verified, including discovery of a real
  same-window numbering collision (reinforces the "always re-verify" discipline rather than undermining
  confidence in the specific numbers reported here).
- Stance-topic scope: HIGH — directly DB-verified, unchanged from Phases 193/194.
- Banner mechanism: HIGH (wiring itself, unchanged code) / MEDIUM (visual-distinctiveness of the
  specific candidates found — see Open Question 2).

**Research date:** 2026-07-10
**Valid until:** 30 days for the DB/migration-numbering and structural facts (re-verify ledger/disk MAX
at plan/execute time regardless, per established convention — reinforced this session by an actual
same-day collision). **7 days OR LESS for the roster-currency facts** — an active election with an
imminent primary (within roughly 1–4 weeks of this research date, exact date itself unresolved) makes
this the shortest-lived finding in any RESEARCH.md this milestone has produced; the planner should
treat the roster table above as provisional pending the blocking checkpoint, not as settled fact.

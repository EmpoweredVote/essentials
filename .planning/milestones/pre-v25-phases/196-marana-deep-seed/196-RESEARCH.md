# Phase 196: Marana Deep-Seed - Research

**Researched:** 2026-07-15
**Domain:** Greenfield at-large town government seeding (Mayor + 6 at-large council seats, an active
interim-mayor + mid-cycle-appointed-member situation, an election 6 DAYS away) + evidence-only compass
stances + community banner (Postgres/PostGIS backend in `C:/EV-Accounts`, React frontend in this repo)
**Confidence:** HIGH (structural/technical, DB-verified this session) / **MEDIUM-LOW (roster currency —
see Summary; this is the single most time-urgent finding in the whole v22.0 milestone)**

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (roster scope):** Seed elected officials only — Mayor + elected Town Council members. No
  appointed staff (Town Manager etc.). Antipartisan: party never displayed; nonpartisan officials
  seeded with `party` NULL. Matches Pima/Tucson/Oro Valley.
- **D-02 (seat structure):** Mirror the Oro Valley (195) pattern, **contingent on researcher
  verification**. Expectation: at-large + nonpartisan. If confirmed → Mayor = new `LOCAL_EXEC` seat +
  ONE shared `LOCAL` district for all council seats (no per-seat districts, no ward geofences). If
  by-ward → fall back to a by-district model. **This research CONFIRMS the at-large/nonpartisan
  expectation — see Research Question 1 below.**
- **D-03 (banner):** Source one licensed real photo at a time (street-scene or skyline; no AI, no
  aerial/drone). Must avoid Catalina-range shots (Marana sits by the Tortolita range; a collision risk
  with Pima 193 / Oro Valley 195). Candidate subjects: Dove Mountain, Marana Main St / downtown,
  Heritage River Park, Tortolita foothills. Present options for review; show the AZ state shot too if a
  conflict risk exists. Process via `docs/banner-asset-pipeline.md` → `cities/marana.jpg` +
  `CURATED_LOCAL` entry + attribution in `buildingImages.js`.
- **D-04 (stances):** Full, per convention — evidence-only across all live compass topics, one research
  agent at a time, 100% citation, no default values, honest blank spokes.

### Claude's Discretion
- Exact headshot sourcing pipeline (direct fetch vs `/find-headshots` Playwright WAF fallback).
- Migration numbering (disk-authoritative), ext_id ranges, geofence source (already-loaded Phase 190
  TIGER place layer, confirmed below — no new geofence work needed).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. School boards, AZ Legislature stances, and appointed staff
remain out of scope per milestone conventions (unchanged from CONTEXT.md).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUB-02 | Marana deep-seed — government + roster → 600×750 headshots → evidence-only stances → licensed community banner → surfaced in `src/lib/coverage.js` | GOVERNMENT/GEOFENCE confirmed greenfield via direct production-DB query (0 rows in `essentials.governments` for '%marana%'; the G4110 town boundary `geo_id='0444270'` already exists from Phase 190, `essentials.districts` has ZERO rows for it — same gap as Oro Valley's Pitfall 4 / Tucson's Pitfall 5); ELECTION METHOD confirmed ALL-AT-LARGE, nonpartisan, 7-member council-manager town (Mayor directly elected + 6 council, Vice Mayor council-appointed) via 4+ cross-verified sources; ROSTER resolved via a January-2026-dated council-agenda primary source + 3 independent news outlets, but is under an EXTREME timing risk — see Summary; HEADSHOTS confirmed WAF-blocked at the official source (identical Akamai signature to every prior AZ phase) with the established `/find-headshots` fallback; MIGRATIONS numbering DB-verified this session (disk MAX=1344, ledger MAX=1338, next structural=1345; ext_id block `-4013001..-4013007` confirmed unused) |
| BANR-01 | Licensed Marana community banner, processed via `scripts/banners/`, wired into `buildingImages.js`, distinct from Tucson (downtown streetscape) / Pima (Catalina Mountains) / Oro Valley (CDO Trail Bridge) / AZ-state (Phoenix skyline) | Banner mechanism confirmed identical to the Tucson/Pima/Oro Valley `CURATED_LOCAL`/`coverage.js` wiring (append to the EXISTING Arizona `COVERAGE_STATES` block — 3rd entry, not a new block); Wikimedia Commons' Marana-specific categories are thin this session (no clean street-scene match found) — one plausible Dove Mountain candidate identified with confirmed license, but flagged as an open question for the execution-phase one-at-a-time sourcing pass (see Open Questions) |

</phase_requirements>

## Summary

**The single most important finding of this research is that Marana's 2026 municipal primary is 6 DAYS
away from this research date (2026-07-15 research; July 21, 2026 primary) — this is the shortest
research-to-election window of any deep-seed phase in this milestone, shorter than Oro Valley's (195)
own uncomfortably tight window.** Compounding the timing risk, Marana is ALSO mid-way through an
unusual leadership-succession situation: longtime Mayor **Ed Honea died November 22, 2024** (age 77,
after 37 years of Town service spanning 3 council terms plus 2 mayoral tenures since 1995/2005), and the
Town Council **unanimously appointed sitting Vice Mayor Jon Post to fill the vacancy as Mayor on January
7, 2025** — Post did not win the office by election. Roxanne Ziegler (a nearly-20-year councilmember)
was then appointed the new Vice Mayor, and **Teri Murphy was appointed to fill the council seat Post
vacated** when he moved up to Mayor. **The July 21, 2026 special election exists specifically to elect
someone to serve the REMAINING 2 years of Honea's unexpired term** — Post (running as the incumbent) or
challenger Greg Johnsen — separate from and in addition to Marana's normal staggered 4-council-seat
cycle, which is ALSO up this same July 21, 2026 date.

**Current confirmed sitting roster (2026-07-15, cross-verified 4 ways: a January 2026-dated Town
Council meeting agenda, KGUN9/Tucson Sentinel's Post-appointment reporting, tucson.com's incumbents
coverage, and AZ Luminaria's June 22, 2026 election guide):**

| Seat | Name | Status | 2026 election involvement |
|------|------|--------|---------------------------|
| Mayor (at-large, directly elected) | Jon Post | Appointed Mayor Jan 7, 2025 (was Vice Mayor since 2013); NOT elected to the office | Running as incumbent vs. challenger Greg Johnsen — special election for the remaining 2 years of Honea's term |
| Council (at-large) — Vice Mayor annotation | Roxanne Ziegler | Council-appointed Vice Mayor (replacing Post); on council ~20 years | NOT up in 2026 (staggered term) |
| Council (at-large) | Patrick Cavanaugh | Sitting member | NOT up in 2026 (staggered term) |
| Council (at-large) | Patti Comerford | Sitting member | Up in 2026 — **confirmed NOT seeking re-election** (open seat) |
| Council (at-large) | Herb Kai | Sitting member | Up in 2026 — running as incumbent |
| Council (at-large) | Teri Murphy | **Appointed** (Jan 2025, to fill Post's vacated seat) — not yet elected to this seat | Up in 2026 — running to be elected to a full term |
| Council (at-large) | John Officer | Sitting member | Up in 2026 — running as incumbent |

**A directly analogous "stale/confusing composite" trap to Oro Valley's Bohen/Solomon Pitfall was
caught this session:** one summarized news source mislabeled write-in candidate **Jackie Craig** as a
current "incumbent." Cross-checking against her own campaign site (`jackieforcouncil.com`) and a
dedicated Ballotpedia candidate page confirms she is a **FORMER** council member (served 2020–2024,
stepped away — i.e., did NOT serve past 2024) running as a **challenger** write-in, NOT a sitting
official. **Do not seed Jackie Craig as a current officeholder.** Challengers also include Jackie
McGuire, Sue Ritz, and Julie Prince (aligned with Johnsen as "Marana for the People").

**Structurally, this phase is a near-exact structural twin of Oro Valley (195), NOT Tucson/Pima's
ward-geofence shape.** Marana is council-manager, **7 total members including the Mayor**, ALL elected
**at-large** with **NO wards, no council districts, and no formal seat numbering** — confirmed via (a)
multiple WebSearch-composite sources independently agreeing on "seven member non-partisan body elected
at large," (b) Wikipedia's council-manager government-info-box classification, and (c) Ballotpedia's own
candidate-page NAMING CONVENTION for Jackie Craig: `"Marana Town Council At-large, Arizona, candidate
2026"` — an authoritative third-party corroboration of the at-large designation, not just a generic
description. The Vice Mayor is **council-appointed from among sitting members** (confirmed directly by
the Post→Mayor / Ziegler→VP succession itself — an appointed body, not a separately-elected seat),
matching the Pima/Tucson/Oro Valley title-annotation precedent exactly.

**Direct production-DB verification this session (2026-07-15) confirms Marana is fully greenfield**,
structurally identical to Oro Valley's gap: `essentials.governments` has 0 rows matching `%marana%`;
`essentials.geofence_boundaries` already has the whole-town G4110 boundary live from Phase 190
(`geo_id='0444270'`, FIPS `04-44270`, matching Wikipedia's cited FIPS code exactly); `essentials.
districts` has **0 rows** for that geo_id — this phase must create exactly TWO new rows (one
`LOCAL_EXEC` for the Mayor, one `LOCAL` shared by all 6 council members), copying the Oro Valley
Pattern 1 (Torrance-precedent) shape verbatim.

Headshots present the same obstacle as every prior AZ phase: `maranaaz.gov` (the official Mayor/Council
bio-page host, `/Council` and `/Council/Council-Bios`) returned **HTTP 403 with the identical Akamai
`X-Reference-Error` WAF signature** confirmed live this session via `curl` with a full Chrome
User-Agent — the established `/find-headshots` Playwright fallback is the recommended sourcing path.
News outlets covering Marana (KGUN9, tucson.com, Tucson Sentinel, AZPM, tucsonlocalmedia.com, AZ
Luminaria) were all directly reachable via WebFetch this session (NOT WAF-blocked) and are the
recommended evidence sources for compass-stance research, mirroring the established Tucson/Pima/Oro
Valley source list.

**Primary recommendation:** Follow the Oro Valley (195) at-large/shared-LOCAL migration shape almost
verbatim: ONE `Town Council` chamber (`official_count=7`) holding 1 `LOCAL_EXEC` Mayor office + 6
undifferentiated `'Council Member'` `LOCAL` offices, ALL 7 resolving to the pre-existing
`0444270`/G4110 geofence via 2 new `essentials.districts` rows. Vice Mayor is a title annotation on
Roxanne Ziegler's seat. **The single highest-priority planning action is scoping a genuinely
substantive, non-perfunctory BLOCKING roster-currency checkpoint at execute time** — more urgent than
any prior phase in this milestone, given the 6-day (as of research date) primary window, the
appointed-not-elected status of both the Mayor and one council member, and Comerford's open seat.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Town boundary (Mayor + all 6 council, one shared geofence) | Database / Storage (`essentials.geofence_boundaries`, ALREADY LIVE from Phase 190, DB-confirmed 2026-07-15) | — | No new geometry work this phase — reuses the existing `0444270`/G4110 row entirely |
| Government/chamber/office/politician seed | Database (`essentials.governments/chambers/districts/offices/politicians`) | — | Structural migration; same shape as Oro Valley (2 new district rows, not N ward rows) |
| Address → Mayor + at-large council routing | API / Backend (`essentialsService.ts`, unchanged code) | Database (geofence + district join) | The existing `G4110→(LOCAL,LOCAL_EXEC)` mapping already covers this — zero code change |
| 600×750 headshots | Database / Storage (`politician_images`, `politician_photos` bucket) | Playwright (fallback sourcing for WAF-blocked `.gov` source) | Same DB/Storage tier as every prior phase; sourcing tier mirrors Tucson/Oro Valley (WAF blocks direct HTTP) |
| Compass stances | Database (`inform.politician_answers`) | — | Evidence-only INSERTs; no frontend change |
| Community banner | Frontend (`src/lib/buildingImages.js` CURATED_LOCAL) + Storage (`politician_photos/cities/`) | Frontend (`src/lib/coverage.js`, EXISTING Arizona `COVERAGE_STATES` block — plain append) | The Arizona block already has 2 entries (Tucson, Oro Valley) — this is the 3rd append, not a new-block creation |
| Coverage surfacing (chip) | Frontend (`src/lib/coverage.js`) | — | `hasContext:true` once ≥1 stance row exists |

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PostgreSQL/PostGIS (Supabase) | Live prod (`kxsdzaojfaibhuzmclfq`) | Structural + audit migrations | Same DB as every prior phase — confirmed reachable this session via `psql` against `C:/EV-Accounts/backend/.env` |
| `psql` CLI | 18.1 (confirmed on PATH 2026-07-15) | Inline orchestrator apply + DB-verify | `gsd-executor` has no Supabase MCP — orchestrator applies via `psql` |
| Python 3 + Pillow + `requests` + `psycopg2` | Proven in Phases 191/193/194/195 | Headshot crop/resize/upload pipeline | Verbatim reuse |
| `mcp__playwright__browser_navigate` (+ snapshot/click/close) | Available per `/find-headshots` skill (`~/.claude/commands/find-headshots.md`, confirmed present on disk) | Headshot sourcing fallback for the WAF-blocked `maranaaz.gov` host | Confirmed necessary this session (curl 403, identical Akamai signature) |
| `scripts/banners/process_banner.py` + `upload_banner.py` | Already present | Banner crop-to-1700×540 + Storage upload | No new tooling |

**NOT needed this phase (same simplification as Oro Valley):** no TypeScript geofence loader — Marana
has no sub-jurisdiction geofences to source or load; the whole-town G4110 boundary already covers the
Mayor and all 6 council seats.

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `tucsonlocalmedia.com/marana/`, `tucson.com`, `AZPM (azpm.org/news.azpm.org)`, `KGUN9`, `Tucson Sentinel`, `AZ Luminaria` | live, confirmed reachable via WebFetch 2026-07-15 | Roster cross-check + stance-research evidence sourcing | Not WAF-blocked (unlike `maranaaz.gov`); all directly fetchable this session |
| Ballotpedia (per-candidate pages, e.g. `Jon_Post_(Mayor_of_Marana,_Arizona,_candidate_2026)`) | live | Roster/candidate cross-check + potential headshot source for the 4 sitting officials who are also 2026 candidates (Post, Kai, Officer, Murphy) | Ballotpedia individual candidate pages often carry a photo — worth checking at execution time before falling back to Playwright |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Torrance/Oro-Valley "undifferentiated `Council Member`, all 6 share ONE LOCAL district row" shape | Beaverton's numbered `Council Member (Position N)` shape | No source found this session indicating Marana formally numbers its seats — every corroborating source describes a single at-large combined field. Use the plain-title convention unless the execute-time checkpoint finds explicit seat-numbering language |

**Installation:** No new packages. All tooling already present and proven across Phases 161/162/175/
191/192/193/194/195.

**Version verification:** N/A — zero new dependencies introduced.

## Package Legitimacy Audit

**N/A this phase.** No new npm/pip/cargo packages are installed. All tooling (`pg`, Pillow, `requests`,
`psycopg2`, Playwright MCP) is already present and proven across every prior AZ deep-seed phase.
`slopcheck` was not run — nothing to audit (matches every prior deep-seed phase's RESEARCH.md).

## Architecture Patterns

### System Architecture Diagram

```
Town of Marana G4110 boundary (ALREADY LIVE from Phase 190: geo_id='0444270', state='04' FIPS —
DB-confirmed 2026-07-15: `SELECT geo_id, mtfcc, state, name FROM essentials.geofence_boundaries
WHERE name ILIKE '%marana%'` => 0444270 | G4110 | 04 | Marana town)
        │  (no geofence loader needed — the same boundary serves BOTH the Mayor and all 6 council seats)
        ▼
Structural migration <disk-MAX+1, provisionally 1345>_town_of_marana.sql
   ├─ essentials.governments  ('Town of Marana, Arizona, US', type='Town', state='AZ', geo_id='0444270')
   ├─ essentials.chambers     ('Town Council', official_count=7 — Mayor + 6 at-large council, ONE chamber)
   ├─ essentials.districts    NEW LOCAL_EXEC row (geo_id='0444270', mtfcc='G4110', state='az' — did NOT
   │                          exist before this phase, DB-confirmed 0 rows this session)
   │                          + ONE NEW LOCAL row (geo_id='0444270', mtfcc='G4110', state='az' — ALL 6
   │                          council offices share this SAME single row, Torrance/Oro-Valley shape)
   └─ essentials.politicians + essentials.offices  (7 people, ext_id -4013001..-4013007, party=NULL)
        │  office_id back-fill + post-verify DO block (row counts, casing, section-split, VM annotation)
        ▼
Address routing (NO CODE CHANGE — the existing G4110→(LOCAL,LOCAL_EXEC) mapping already covers both
the Mayor's and all 6 council members' district_type/mtfcc combination)
        │
        ▼
Resident's profile shows their at-large Mayor + all 6 at-large council members
        │
        ├─ Headshots: maranaaz.gov WAF-blocked (confirmed 2026-07-15, same Akamai signature) →
        │             Playwright fallback (/find-headshots skill) → crop-first 4:5 → 600×750 Lanczos
        │             → politician_images (audit-only). Check Ballotpedia candidate pages first for
        │             Post/Kai/Officer/Murphy (2026 candidates often have a photo already there).
        ├─ Stances: evidence-only research (tucsonlocalmedia.com/marana/, tucson.com, AZPM, KGUN9,
        │           Tucson Sentinel, AZ Luminaria — all confirmed reachable this session;
        │           maranaaz.gov meeting agendas ALSO WAF-blocked) → inform.politician_answers
        └─ Banner: Wikimedia CC Marana/Dove-Mountain photo (candidate identified, see Open Questions)
                   → process_banner.py (1700×540) → upload_banner.py (cities/marana.jpg)
                   → buildingImages.js CURATED_LOCAL['marana'] → coverage.js EXISTING Arizona
                     COVERAGE_STATES block (3rd `areas` entry — the block already exists)
```

### Recommended Project Structure (files this phase touches)
```
C:/EV-Accounts/backend/
├── migrations/<disk-MAX+1>_town_of_marana.sql               # NEW — structural (registered)
├── migrations/<next>_town_of_marana_headshots.sql           # NEW — audit-only (unregistered)
└── migrations/<next..next+6>_marana_*_stances.sql           # NEW — audit-only, one per official

C:/Transparent Motivations/essentials/
├── src/lib/coverage.js         # MODIFIED — append 'Marana' to the EXISTING Arizona areas[] array
└── src/lib/buildingImages.js   # MODIFIED — add 'marana' to CURATED_LOCAL
```

**No new backend script/loader file is needed** — same simplification Oro Valley documented; Marana
has zero sub-jurisdiction geofences to source.

### Pattern 1: All-at-large council sharing ONE LOCAL district row (Torrance/Oro-Valley precedent)
**What:** When a council has no wards/districts at all, model it as ONE `LOCAL` district row shared by
every council office.
**When to use:** Exactly this phase — copy Oro Valley's `1305_town_of_oro_valley.sql` structure
verbatim, substituting Marana's own facts.
```sql
-- Oro Valley's live-applied shape (1305), directly reusable for Marana:
--   1 LOCAL_EXEC row  (Mayor)      geo_id='0451600' -> for Marana: geo_id='0444270'
--   1 LOCAL row       (6 council)  geo_id='0451600' -> for Marana: geo_id='0444270'
-- Both mtfcc='G4110', state='az' (lowercase). Apply verbatim to Marana.
```

### Pattern 2: Vice Mayor as a title-suffix annotation on the currently-appointed occupant
**What:** Marana's Vice Mayor is council-appointed from among sitting members (directly demonstrated by
the Post→Mayor / Ziegler→VP succession itself) — the same rotating-annotation shape as every prior AZ
phase's Chair/Vice-Mayor modeling.
```sql
-- title = 'Council Member (Vice Mayor)' for Roxanne Ziegler's office ONLY.
-- role_canonical stays NULL on all 7 offices — annotation lives in `title` only.
```
**Caveat unique to this phase:** unlike Oro Valley's Barrett (who was VM AND a mayoral candidate,
vacating her own seat regardless), Marana's Mayor seat is ALREADY vacant-by-succession (Post moved up
from VM in Jan 2025) and Ziegler is a NEWLY appointed VM (not up for re-election in 2026) — the
execute-time checkpoint must reconfirm Ziegler is still the sitting VM and that no further council
reshuffling occurred between this research date and execute time.

### Anti-Patterns to Avoid
- **Building a geofence loader script for Marana:** Nothing to source or load — the Town's one G4110
  boundary already exists and covers every seat (DB-confirmed this session).
- **Seeding Jon Post's mayoralty as a normal 4-year elected term:** Post was APPOINTED to the office
  (unanimous council vote, Jan 7, 2025) to fill a vacancy created by Mayor Honea's death — he has never
  been ELECTED Mayor. The July 21, 2026 election is a SPECIAL election for the remaining 2 years of
  Honea's term. This does not change how the CURRENT office is modeled (Post today IS the sitting Mayor,
  seed him as such), but the planner/execute-time checkpoint must not assume Post's status carries the
  same "safely elected, stable for years" confidence as a normally-elected incumbent — see Pitfall 2.
- **Seeding Teri Murphy as a normally-elected councilmember:** She was APPOINTED (Jan 2025) to fill
  Post's vacated council seat, not elected — she is running in the July 21, 2026 election to be elected
  to this seat for the first time. Model her identically to every other sitting council member today
  (is_appointed politician-level flags in this schema are used for STATE_EXEC-tier appointments — confirm
  the schema convention at author time; if the schema's `is_appointed` flag is meant for constitutional
  officers only, per prior-phase precedent it likely stays `false` for Murphy since she IS a normal
  Council Member office, just one whose current occupant reached the seat by council appointment rather
  than election — flag this nuance explicitly in the migration's header comment).
- **Seeding write-in challenger Jackie Craig as a current officeholder:** She served 2020–2024 and is
  NOT currently sitting — one WebFetch-summarized news source mislabeled her "incumbent," a
  directly-analogous trap to Oro Valley's Bohen/Solomon Pitfall. Do not seed her.
- **Recording a party affiliation:** Marana elections are nonpartisan (confirmed via Ballotpedia's own
  "Marana Town Council At-large" candidate-page naming convention + WebSearch composite corroboration).
  `politicians.party` must be NULL for all 7.
- **Treating the current roster as stable through execution without re-checking:** The July 21, 2026
  primary is 6 DAYS from this research date. A perfunctory "assume nothing changed" checkpoint is
  categorically insufficient here — more so than any prior phase in this milestone.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| At-large council district modeling | A per-seat geofence or "fake ward" scheme | The Torrance/Oro-Valley shared-`LOCAL`-row shape (Pattern 1) | Battle-tested, DB-verified twice now (Torrance, Oro Valley), matches Marana's confirmed electoral mechanic |
| Headshot sourcing from a WAF-blocked `.gov` host | Custom scraping/proxy/UA-spoofing code | `/find-headshots` skill's Playwright flow (already built) | Purpose-built for this exact failure mode (same Akamai WAF signature confirmed this session) |
| 4:5 headshot cropping + banner crop/resize | Custom PIL scripts | `_tmp-*-headshots.py` pipeline + `scripts/banners/process_banner.py` | Verbatim reuse |
| Roster-currency verification 6 days before a primary | A one-time WebSearch snippet trusted at face value | Multiple independently-corroborating primary sources (Jan-2026 council agenda + 3 news outlets + Ballotpedia) PLUS a fresh execute-time re-check | A single summarized source was independently proven WRONG this session (Jackie Craig mislabeled "incumbent") |

**Key insight:** This phase's ONLY genuinely new engineering surface — same as Oro Valley — is getting
the roster-currency checkpoint right, made HARDER here by the compound Honea-death/Post-appointment/
Murphy-appointment/Comerford-retirement situation layered on top of the standard "election in progress"
risk. Everything else (chamber/office/politician shape, headshot pipeline, banner pipeline, coverage.js
append) is established pattern reuse.

## Common Pitfalls

### Pitfall 1: The 2026 municipal primary is 6 DAYS away from this research date — the tightest window in the milestone
**What goes wrong:** Assuming the roster documented here will still be accurate at plan/execute time.
**Why it happens:** July 21, 2026 primary (confirmed via AZ Luminaria's June 22, 2026 election guide and
independently via a write-in-candidate campaign site); this research was conducted 2026-07-15 — only 6
days before the primary. AZ nonpartisan primaries can produce outright majority winners with no November
runoff needed (established convention from Oro Valley RESEARCH).
**How to avoid:** The planner MUST schedule a genuinely substantive BLOCKING roster-currency checkpoint
at execute time — MORE urgent than Oro Valley's own checkpoint, since this phase's likely execute window
lands on or after the primary date itself, not merely "sometime before an unresolved date."
**Warning signs:** Any execute-time date on or after July 21, 2026 without an explicit fresh recheck of
certified results.

### Pitfall 2: The Mayor and one Council seat are currently held by APPOINTED (not elected) officials
**What goes wrong:** Treating Jon Post's mayoralty or Teri Murphy's council seat as a normally-elected,
multi-year-stable incumbency.
**Why it happens:** Mayor Ed Honea died Nov 22, 2024; the council unanimously appointed sitting Vice
Mayor Jon Post to the Mayor's office Jan 7, 2025 (he has never been elected Mayor); Teri Murphy was
separately appointed to fill Post's vacated council seat. Both are on the July 21, 2026 ballot for the
first time in their current offices — Post in a SPECIAL election for the REMAINING 2 years of Honea's
term, Murphy for a full council term.
**How to avoid:** Seed both as the CURRENT sitting officials (this is accurate today), but flag this
explicitly in the migration header comment and the execute-time checkpoint — a certified July 21 result
changing either seat is a real, live possibility, not a remote one.
**Warning signs:** Treating Post's or Murphy's tenure length the same way as Cavanaugh's or Kai's.

### Pitfall 3: A WebFetch-summarized source mislabeled a former member as a current "incumbent"
**What goes wrong:** One summarized tucson.com article characterized write-in candidate Jackie Craig as
an "incumbent" running as a write-in.
**Why it happens:** Craig DID serve on the Marana Town Council 2020–2024 but stepped away — she is a
FORMER member and a 2026 CHALLENGER, confirmed via her own campaign site (`jackieforcouncil.com`) and a
dedicated Ballotpedia candidate page. This is the exact same AI-summarization-blending-past-and-present
failure mode documented in Oro Valley's Pitfall 1 (Bohen/Solomon).
**How to avoid:** Cross-verify any "incumbent" claim against a primary, dated source (the Jan-2026
council meeting agenda is the strongest available this session) rather than a single summarized article.
**Warning signs:** A source describing a name not present in the Jan-2026 council-agenda roster as a
current officeholder.

### Pitfall 4: `essentials.districts` has NO rows yet for the Marana boundary (`0444270`/G4110)
**What goes wrong:** Assuming "the town boundary already exists" (true for `geofence_boundaries`, per
Phase 190) means offices can attach directly — they cannot.
**How to avoid:** DB-confirmed this session: `SELECT COUNT(*) FROM essentials.districts WHERE
geo_id='0444270'` returns **0**. This migration must explicitly `INSERT INTO essentials.districts` TWO
new rows (`LOCAL_EXEC` for the Mayor, `LOCAL` shared by all 6 council members).
**Warning signs:** An office INSERT's district-lookup subquery silently matching 0 rows.

### Pitfall 5: `maranaaz.gov` (headshots AND meeting-agenda source) is Akamai-WAF-blocked
**What goes wrong:** Assuming stance-research agents or the headshot pipeline can fetch `maranaaz.gov`
directly.
**Why it happens:** Confirmed live 2026-07-15: `curl` (full Chrome User-Agent) returns HTTP 403 with an
`X-Reference-Error` header — the identical Akamai WAF signature documented in every prior AZ phase.
**How to avoid:** Use the `/find-headshots` skill's Playwright-based flow for headshots (check
Ballotpedia candidate pages first for Post/Kai/Officer/Murphy — often carry a usable photo). For stance
research, use the confirmed-reachable news-outlet list (tucsonlocalmedia.com/marana/, tucson.com, AZPM,
KGUN9, Tucson Sentinel, AZ Luminaria).
**Warning signs:** A `curl -I` or WebFetch call against any `maranaaz.gov` path returning 403 with an
`X-Reference-Error` header.

### Pitfall 6: Migration numbering — disk MAX, not ledger MAX, is authoritative; re-verify at execute time
**What goes wrong:** Assuming the next structural migration number is ledger-MAX+1, or trusting this
session's snapshot without re-checking at execute time.
**Why it happens:** Ledger MAX = **1338** (confirmed via `psql` 2026-07-15); disk MAX = **1344**
(confirmed via `ls C:/EV-Accounts/backend/migrations` same session). **Next structural migration =
1345.** Oro Valley's own research documented a real same-day number collision between unrelated
workstreams — that risk is structural to this project, not a one-off.
**How to avoid:** Re-verify BOTH numbers immediately before writing/applying any new migration file at
execute time.
**Warning signs:** `psql -f` apply failing on a duplicate filename.

### Pitfall 7: Judicial compass topics do not apply (re-verified, unchanged from every prior AZ phase)
**What goes wrong:** Stancing against all 44 live `inform.compass_topics` rows would include 8
judicial-scoped topics with no bearing on a Mayor or at-large council member.
**Why it happens:** Confirmed live this session: `inform.compass_topics WHERE is_live=true` = 44 rows;
`WHERE is_live=true AND topic_key ILIKE 'judicial%'` = 8 rows → 36 non-judicial topics.
**How to avoid:** Research against the 36 non-judicial live topics, exactly as every prior AZ deep-seed.
**Warning signs:** A verification script asserting "44 topics per official" would incorrectly flag
honest, complete 36/36 coverage as a gap.

### Pitfall 8: `coverage.js`'s Arizona block already exists with 2 entries — do not recreate it
**What goes wrong:** Creating a NEW `{ name: 'Arizona', ... }` block.
**Why it happens:** Phase 194 created the Arizona block (Tucson); Phase 195 appended Oro Valley as the
2nd entry — confirmed via direct file read this session (`src/lib/coverage.js` lines 205-213).
**How to avoid:** APPEND a 3rd `{ label: 'Marana', browseGovernmentList: ['0444270'], browseStateAbbrev:
'AZ', hasContext: true }` entry to the EXISTING Arizona block's `areas` array.
**Warning signs:** A diff showing two separate `name: 'Arizona'` blocks — a duplicate-block bug.

## Code Examples

### Confirm the Marana government row does not yet exist (greenfield, verified live 2026-07-15)
```sql
SELECT id, name, type, state, geo_id FROM essentials.governments WHERE name ILIKE '%marana%';
-- => 0 rows (confirmed greenfield this session)
```

### Confirm the existing G4110 boundary and the districts gap (verified live 2026-07-15)
```sql
SELECT geo_id, mtfcc, state, name FROM essentials.geofence_boundaries WHERE name ILIKE '%marana%';
-- => 0444270 | G4110 | 04 | Marana town   (from Phase 190 — already live; matches Wikipedia's
--     cited FIPS place code 04-44270 exactly)

SELECT COUNT(*) FROM essentials.districts d
JOIN essentials.geofence_boundaries g ON g.geo_id = d.geo_id
WHERE g.name ILIKE '%marana%';
-- => 0   (this phase must create the LOCAL_EXEC + LOCAL rows)
```

### Migration ledger + disk MAX + ext_id probes (run these exact queries again at plan/execute time)
```sql
-- Ledger MAX (DB-verified 2026-07-15):
SELECT MAX(CAST(version AS INTEGER)) FROM supabase_migrations.schema_migrations
WHERE version ~ '^[0-9]{1,4}$';
-- => 1338

-- On-disk MAX (authoritative for next-number assignment — confirmed via `ls` 2026-07-15):
-- ls C:/EV-Accounts/backend/migrations/*.sql | grep -oE '^[0-9]+' | sort -n | tail -1 => 1344
-- Next structural migration = 1345. RE-VERIFY at execute time (Oro Valley documented a real
-- same-day collision — this is a structural project risk, not a one-off).

-- external_id collision check for the proposed -4013001..-4013007 block (7 people, DB-verified
-- 2026-07-15; this continues the sequential AZ/CA-town numbering after Indio's -4012xxx/Phase 203):
SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4013010 AND -4013000;
-- => 0 rows (confirmed unused)
```

### compass_topics live/judicial scope (verified live 2026-07-15, unchanged from every prior AZ phase)
```sql
SELECT count(*) FROM inform.compass_topics WHERE is_live=true;                                -- => 44
SELECT count(*) FROM inform.compass_topics WHERE is_live=true AND topic_key ILIKE 'judicial%'; -- => 8
-- 36 non-judicial live topics is the research scope for all 7 Marana officials.
```

### maranaaz.gov WAF confirmation (verified live 2026-07-15)
```bash
curl -sI -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" \
  "https://www.maranaaz.gov/Council"
# => HTTP/1.1 403 Forbidden; X-Reference-Error header confirms Akamai WAF
#    (identical signature to Tucson/Pima/Oro Valley)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Tucson/Pima required a custom sub-jurisdiction geofence loader | Marana (like Oro Valley) needs NO geofence loader — Mayor and all 6 council share the existing G4110 boundary | This phase (2nd "pure at-large" AZ jurisdiction, after Oro Valley) | Simpler migration; budget LESS engineering time here, MORE time on the roster-currency checkpoint |
| `coverage.js` had only 1 Arizona entry after Phase 194 | The Arizona block now has 2 entries (Tucson, Oro Valley) — this phase is the 3rd append | Since Phase 195 | Confirmed via direct file read this session |
| Marana had a stable, normally-elected Mayor for ~20 years (Honea) | Marana now has an APPOINTED interim Mayor (Post) mid-way through a special-election cycle | Nov 2024 – present | The single biggest structural difference from every prior AZ deep-seed phase — flag prominently for the planner and execute-time checkpoint |

**Deprecated/outdated:** None specific to this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The current 7-person roster (Post/Ziegler/Cavanaugh/Comerford/Kai/Murphy/Officer) is accurate as of the 2026-07-15 research date, cross-verified via a Jan-2026-dated council meeting agenda + 3 independent news outlets, NOT a direct fetch of the WAF-blocked official source | Summary / Roster | **VERY HIGH impact if not re-verified** — the primary is 6 days away at research time; this is the single highest-risk claim in this document |
| A2 | Council seats are genuinely undifferentiated at-large (no formal seat numbering), inferred from Ballotpedia's "At-large" candidate-page naming convention and multiple WebSearch composites, not from a direct reading of Marana's Town Code election-method section (official site WAF-blocked) | Standard Stack / Pattern 1 | Medium — if seats ARE formally numbered, titles need the Beaverton-style `(Position N)` suffix; low functional-routing impact regardless (all 6 share one district row either way) |
| A3 | `politicians.party` should be NULL (nonpartisan), based on Ballotpedia's "At-large" naming + WebSearch composite corroboration, not an independent reading of AZ municipal-election statutes for Marana specifically | Summary / Roster | Low — party is never displayed regardless (antipartisan design) |
| A4 | Teri Murphy's `is_appointed`/politician-level flags should follow the same convention as every other Council Member office (not a special "appointed official" flag reserved for STATE_EXEC-tier constitutional officers) — this schema convention was not independently re-verified against the live `essentials.offices`/`politicians` column semantics this session | Anti-Patterns to Avoid | Low-medium — a wrong flag value would not break routing/display but could misrepresent Murphy's tenure in an audit; the planner should confirm the `is_appointed_position`/`is_appointed` column semantics against the Oro Valley precedent (which used it for STATE_EXEC only) before authoring |
| A5 | The single Dove Mountain golf-course banner candidate identified this session (Wikimedia Commons, CC BY-SA 3.0, Bernard Gagnon) is licensing-clean and usable, but was NOT independently cross-checked against a "genuine street-scene" reading of the milestone's banner convention — it is a golf-course fairway photo, not a downtown/Main-Street shot | Open Questions | Low-medium — the execution-phase one-at-a-time sourcing pass should weigh whether a golf-course subject satisfies "street-scene or skyline," or whether a Flickr-sourced Ed Honea Municipal Complex / Downtown Marana / Heritage River Park shot (not locatable via generic WebSearch this session) is a better fit |

**If this table is empty:** N/A — see rows above. A1 (roster currency, 6 days from a primary) is the
single highest-risk claim in this research and must be the planner's top priority, not merely
acknowledged.

## Open Questions

1. **Are Marana council seats formally numbered, or genuinely undifferentiated at-large?**
   - What we know: Ballotpedia's own candidate-page title for Jackie Craig reads "Marana Town Council
     At-large" — an authoritative third-party classification, not a generic description. Multiple
     WebSearch composites independently describe "seven member non-partisan body elected at large."
   - What's unclear: This research did not locate Marana's own Town Code election-method section
     directly (the official site is WAF-blocked) to confirm definitively whether seats carry a formal
     internal numbering scheme used only for ballot/filing purposes.
   - Recommendation: Default to the plain `'Council Member'` title (no numbering), matching Oro Valley's
     Torrance-precedent shape. If the execute-time checkpoint finds explicit seat-numbering language in
     candidate filing materials, switch to the Beaverton `(Position N)` convention instead.

2. **What is the best licensed banner subject for Marana, given the thin Wikimedia Commons coverage found this session?**
   - What we know: The Commons `Category:Marana, Arizona` contains 16 files, mostly generic desert/
     panoramio landscape shots (sunset valley view, wastewater pond, aerobatic contest), a Marana flag/
     logo (not a photo), and ONE ground-level, high-resolution (4233×2956), clearly-licensed (CC BY-SA
     3.0, photographer Bernard Gagnon, a well-established Commons contributor) photo of "The Golf Club at
     Dove Mountain (Saguaro) no 3.jpg" — a fairway/clubhouse-area ground shot, NOT aerial, matching the
     CONTEXT-named "Dove Mountain" candidate subject and avoiding any Catalina/Pusch-Ridge collision
     (Dove Mountain sits in the Tortolita Mountains, a genuinely distinct range from Pima's/Oro Valley's
     Catalina-range subjects).
   - What's unclear: Whether a golf-course fairway photo satisfies the milestone's "street-scene or
     skyline" convention as well as a genuine downtown/Main-Street or civic-building shot would. This
     session could not locate a clearly-licensed Flickr or Commons photo of the "Ed Honea Marana
     Municipal Complex" (the town's own civic-center building, notably renamed in Dec 2024 to honor the
     late Mayor — a strong, distinctive "Marana identity" subject), the new Downtown Marana Main Street
     development, or Marana Heritage River Park — likely because generic WebSearch does not crawl
     Flickr's own CC-license search index well; a direct Flickr API/browse pass (available to the
     execution-phase banner-sourcing tools) may succeed where this research's WebSearch-only approach
     did not.
   - Recommendation: Present the Dove Mountain golf-course photo as a confirmed-licensable fallback, but
     have the execution-phase one-at-a-time sourcing pass first attempt a direct Flickr CC search for the
     Ed Honea Municipal Complex / Downtown Marana / Heritage River Park before finalizing — this mirrors
     Oro Valley's own Open Question 2 disposition (a shortlist, not a final pick).

3. **How should the execute-time roster-currency checkpoint handle a primary result landing mid-phase (or having already landed by execute time)?**
   - What we know: July 21, 2026 primary (6 days from this research date); Nov 4, 2026 general if no
     seat resolves outright. Comerford's seat is guaranteed to change hands (she is not running).
     Post's and Murphy's seats carry compounded appointed-incumbent risk on top of the normal
     challenger risk.
   - What's unclear: Given the extremely short window, this phase's actual execute date may land ON or
     AFTER July 21 — a genuinely higher probability than any prior AZ phase in this milestone.
   - Recommendation: Treat the checkpoint as near-certain to require a "primary already happened" branch,
     not merely a "confirm nothing changed" branch. If results are certified by execute time, explicitly
     decide with the operator (per the Oro Valley precedent) whether to seed the outgoing or incoming
     officeholder for any changed seat — Comerford's seat WILL need a decision regardless of timing.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `psql` | Inline orchestrator DB apply/verify | ✓ | PostgreSQL 18.1 (confirmed on PATH 2026-07-15) | — |
| Python 3 + Pillow + requests + psycopg2 | Headshot/banner pipeline | ✓ (proven in Phases 191/193/194/195) | — | — |
| Geofence loader (`npx tsx`) | NOT NEEDED this phase | N/A | — | N/A — no sub-jurisdiction geofence to source |
| `maranaaz.gov` (official headshot + agenda source) | Headshot sourcing, stance-research primary citations | ✗ (Akamai WAF, 403 confirmed 2026-07-15, identical signature to prior phases) | — | Playwright browser navigation (`/find-headshots` skill); Ballotpedia candidate pages; news-outlet coverage (tucsonlocalmedia.com/marana/, tucson.com, AZPM, KGUN9, Tucson Sentinel, AZ Luminaria) — all confirmed reachable this session |
| `mcp__playwright__browser_navigate` | Headshot sourcing fallback | ✓ (per `/find-headshots` skill, confirmed present on disk) | — | — |
| `mcp__supabase-local` / Supabase MCP | (NOT available to `gsd-executor`) | ✗ for the executor | — | Inline-orchestrator `psql` pattern (this research itself used direct `psql` against `C:/EV-Accounts/backend/.env` `DATABASE_URL` — confirmed working) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `maranaaz.gov` (WAF-blocked) — Playwright + Ballotpedia + news
sources as documented above. `mcp__supabase-local` unavailable to the executor — established
inline-orchestrator `psql` pattern is the correct workflow, not a workaround.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3 (project-wide `npm run test` → `vitest run`), no dedicated config file |
| Config file | none |
| Quick run command | `npx vitest run src/lib/buildingImages.test.js` |
| Full suite command | `npm run test` |

This phase is overwhelmingly backend data-seeding (SQL migrations only — no geofence loader) with
exactly TWO frontend touches (`coverage.js` append; `buildingImages.js` append). The primary "test"
mechanism for the backend work is the established in-migration `DO $$ ... RAISE EXCEPTION` post-verify
gate pattern plus inline-orchestrator `psql` audit SELECTs — same harness as every prior deep-seed phase.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUB-02 (govt/roster) | Standalone-shaped Town of Marana government, ONE Town Council chamber, Mayor (LOCAL_EXEC, `0444270`/G4110) + 6 at-large council offices (LOCAL, SAME `0444270`/G4110 row), Vice Mayor annotation on Ziegler's seat only, `party` NULL for all 7 | integration (SQL DO-block + psql audit) | in-migration `DO $$` gate (row counts, section-split, VM-annotation count+identity, party-NULL check) + orchestrator `psql -c "SELECT ..."` audits | ✅ pattern exists (Oro Valley/Torrance precedent) |
| SUB-02 (headshots) | 7/7 officials have a 600×750 `politician_images` row | smoke (HTTP HEAD/GET + PIL dimension check) | Python pipeline's own dry-run HTTP-200 pre-check + post-upload CDN HTTP 200 + PIL `(600,750)` assertion | ✅ pattern exists |
| SUB-02 (stances) | Evidence-only compass stances, 100% cited, no defaults, honest blanks, 36 non-judicial topics per official | manual-only (evidence-based research) | N/A — human/agent research process; automated check is a `psql` row-count + citation-completeness audit | ✅ pattern exists |
| BANR-01 | Licensed Marana banner sourced, processed, uploaded, wired into `buildingImages.js`, surfaced via the EXISTING Arizona `coverage.js` block | unit (Vitest) + smoke (CDN HTTP) | `npx vitest run src/lib/buildingImages.test.js` + `curl -I https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/marana.jpg` | ✅ `buildingImages.test.js` exists; no dedicated `coverage.test.js` exists (established non-gap) |

### Sampling Rate
- **Per task commit:** in-migration `DO $$` gate (backend); `node --input-type=module -e "import(...)"` parse-check (coverage.js)
- **Per wave merge:** full `psql` audit suite (row counts, casing, section-split) + `npx vitest run src/lib/buildingImages.test.js`
- **Phase gate:** All SQL post-verify gates green + operator-approved roster-currency checkpoint (the substantive kind — Pitfall 1/2/3) + `npm run test` green before `/gsd:verify-work`

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
| Section-split (offices attached under the wrong government) | Tampering | Chamber scoped to `government_id` subquery `WHERE name='Town of Marana, Arizona, US'`; post-verify `DO` block section-split gate must return 0 rows |
| Wrong-district attach (offices silently matching 0 rows due to a bare geo_id or casing mismatch) | Tampering | Every office↔district join scoped by `district_type` AND `state='az'` (lowercase) AND `geo_id='0444270'`, never a bare geo_id |
| Service-role key / `DATABASE_URL` leakage | Information disclosure | Read from gitignored `C:/EV-Accounts/backend/.env`; never hardcoded in the migration or scripts |
| Seeding a roster superseded by an active election, without disclosure | Tampering (data integrity) | The roster-currency checkpoint (Pitfall 1/2/3) is the control here — the shortest research-to-election window in this milestone makes this the highest-priority mitigation of the phase |

## Sources

### Primary (HIGH confidence — direct live verification in this session)
- `psql` live queries against production Supabase DB (`C:/EV-Accounts/backend/.env` `DATABASE_URL`,
  confirmed reachable 2026-07-15) — ledger MAX (1338) / disk MAX (1344) cross-check, Marana
  government-row absence, `geofence_boundaries` G4110 boundary confirmation (`0444270`), `essentials.
  districts` zero-row gap, external_id collision check (`-4013010..-4013000` = 0 rows), full AZ/CA-town
  ext_id range dump (`-4004xxx` through `-4012xxx`, confirming `-4013xxx` is the next unused block),
  `inform.compass_topics` live/judicial counts (44 live / 8 judicial via `topic_key ILIKE 'judicial%'`).
- `curl` live query against `maranaaz.gov/Council` (WAF 403 confirmation, identical Akamai
  `X-Reference-Error` signature to every prior AZ phase).
- `C:/EV-Accounts/backend/migrations/1305_town_of_oro_valley.sql` (read directly this session —
  confirmed the `governments.type='Town'` convention, the `DO $$` pre-flight/post-verify gate shape, and
  the district-row idempotency pattern to reuse verbatim).
- `C:/Transparent Motivations/essentials/src/lib/coverage.js` and `src/lib/buildingImages.js` (read
  directly this session — confirmed the Arizona `COVERAGE_STATES` block currently has 2 entries
  [Tucson, Oro Valley], and the `CURATED_LOCAL` append pattern including the `oro valley` entry as the
  most recent precedent).

### Secondary (MEDIUM confidence — WebFetch/WebSearch, cross-verified against each other)
- KGUN9 / Tucson Sentinel (WebSearch composite) — Jon Post's appointment to Mayor Jan 7, 2025 following
  Ed Honea's Nov 22, 2024 death; Roxanne Ziegler's appointment as new Vice Mayor.
- `azluminaria.org/2026/06/22/marana-2026-election-guide...` (WebFetch, dated June 22, 2026) — full
  2026 candidate list for Mayor + 4 council seats, incumbent/challenger/not-seeking-reelection status
  for each name, July 21, 2026 primary / Nov 4, 2026 general dates.
- `tucson.com` "Marana incumbents face voters" (WebFetch) — corroborates the incumbent slate and the
  Comerford/Murphy/Craig details (with the Craig mislabel caught and corrected via Pitfall 3).
- WebSearch composite citing a January-2026-dated Marana Town Council meeting agenda PDF
  (`public.destinyhosted.com/marandocs/2026/CCREG/20260106_3154/...`) — the strongest primary-source
  corroboration of the current 7-person roster.
- Ballotpedia candidate pages (`Jon_Post_(Mayor_of_Marana,_Arizona,_candidate_2026)`,
  `Jackie_Craig_(Marana_Town_Council_At-large,_Arizona,_candidate_2026)`) — confirms at-large
  designation via Ballotpedia's own naming convention; confirms Craig's former (not current) status.
- Wikipedia, "Marana, Arizona" (WebFetch) — council-manager government infobox, FIPS code 04-44270
  (matches the DB geo_id exactly), GNIS ID 7681, Tortolita Mountains / Dove Mountain geography.
- Wikimedia Commons file pages (WebFetch) for `The_Golf_Club_at_Dove_Mountain_(Saguaro)_no_3.jpg` (CC
  BY-SA 3.0/GFDL, Bernard Gagnon, 4233×2956) and `Marana_AZ.jpg` (CC BY-SA multi/GFDL, John Hunnicutt
  II, 968×648, generic valley/sunset landscape).

### Tertiary (LOW confidence — not deeply used, or genuinely unresolved)
- Generic WebSearch composite mislabeling Jackie Craig as a current "incumbent" — CONFIRMED WRONG,
  retained only as a documented pitfall example (Pitfall 3), not as a source of fact.
- Generic WebSearch/WebFetch attempts for a Flickr-hosted "Ed Honea Marana Municipal Complex" or
  "Downtown Marana Main Street" or "Heritage River Park" photo — none surfaced a clearly-licensed
  candidate this session (Open Question 2); a direct Flickr CC-search pass (not generic web search) is
  recommended at execution time.

## Metadata

**Confidence breakdown:**
- Standard stack / tooling: HIGH — zero new dependencies; genuinely simpler than Tucson/Pima (no
  geofence loader needed), directly confirmed via re-running Oro Valley's own DB queries this session.
- Structural DB shape (government/chamber/districts/offices): HIGH — directly DB-verified this session
  (greenfield status, geofence presence, districts-gap, ext_id range) against the live-applied Oro
  Valley precedent (1305).
- Roster currency: **MEDIUM-LOW, HIGH-URGENCY** — the current 7-person roster is well-corroborated (a
  Jan-2026 primary-source council agenda + 3+ independent news outlets + Ballotpedia), but the July 21,
  2026 primary is only 6 days from this research date, TWO of the 7 seats are held by appointed (not
  elected) officials, and one seat (Comerford's) is guaranteed to change hands regardless of the
  election outcome. This is the single highest-urgency roster-currency finding in the v22.0 milestone —
  treat as requiring an execute-time checkpoint that assumes the primary may have ALREADY happened, not
  merely one that might happen soon.
- Migration numbering / ext_id scheme: HIGH — directly DB-verified this session, including a fresh
  ledger-vs-disk cross-check.
- Stance-topic scope: HIGH — directly DB-verified this session, unchanged from every prior AZ phase.
- Banner mechanism: HIGH (wiring itself, unchanged code) / MEDIUM-LOW (the specific candidate found —
  a golf-course photo — may not be the best fit for the "street-scene or skyline" convention; see Open
  Question 2).

**Research date:** 2026-07-15
**Valid until:** 30 days for the DB/migration-numbering and structural facts (re-verify ledger/disk MAX
at plan/execute time regardless, per established convention). **Effectively 0-6 days for the
roster-currency facts** — the July 21, 2026 primary is imminent; the planner should treat the roster
table above as provisional pending a genuinely substantive execute-time checkpoint, the shortest-fused
finding of any RESEARCH.md in this milestone to date.

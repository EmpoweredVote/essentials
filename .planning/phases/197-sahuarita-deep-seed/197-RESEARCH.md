# Phase 197: Sahuarita Deep-Seed - Research

**Researched:** 2026-07-16
**Domain:** Greenfield council-manager town government seeding where the Mayor/Vice-Mayor are NOT
separately elected offices but COUNCIL-CHOSEN TITLES rotated among 7 at-large-elected Council Members
(a structural shape this milestone has not yet modeled) + evidence-only compass stances + community
banner (Postgres/PostGIS backend in `C:/EV-Accounts`, React frontend in this repo).
**Confidence:** HIGH (structural/technical, DB-verified this session; election-method finding
cross-verified 4 independent ways) / **LOW-MEDIUM (roster currency — the July 21, 2026 primary is 5
DAYS from this research date, with one guaranteed open seat)**

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (roster scope):** Seed elected officials only — Mayor(-titled seat) + all elected Town Council
  members. No appointed staff (Town Manager, etc.). Antipartisan: party never displayed; nonpartisan
  officials seeded with `party` NULL.
- **D-02 (seat structure):** Mirror the Oro Valley (195) / Marana (196) pattern, **contingent on
  researcher verification**. Expectation stated in CONTEXT: at-large + nonpartisan, Mayor = new
  `LOCAL_EXEC` seat + one shared `LOCAL` district. **This research does NOT confirm that exact shape —
  see Research Question 1 / Summary below: Sahuarita's Mayor is a council-chosen TITLE, not a
  separately-elected office.** The at-large/nonpartisan/shared-district PART of the expectation is
  confirmed; the "Mayor = separate LOCAL_EXEC office" part is NOT — this phase needs a third shape (a
  hybrid of the Oro-Valley/Marana shared-LOCAL pattern and the Palm-Springs/Indio rotational-title
  pattern). Full detail in Summary and Pattern 1.
- **D-03 (banner):** Source one licensed real photo at a time (street-scene/skyline; no AI, no
  aerial/drone). Must avoid Catalina-range shots (Pima 193/Oro Valley 195 collision) and Tortolita/Dove
  Mountain (Marana 196 collision). Candidates in priority order: pecan orchards (FICO/Green Valley
  Pecan), Santa Rita Mountains, Sahuarita Lake/Rancho Sahuarita, Titan Missile Museum. Present 2-3
  licensed candidates for review; show the AZ state shot (Phoenix skyline) too if a conflict risk exists
  (none identified this session). Process via `docs/banner-asset-pipeline.md` → `cities/sahuarita.jpg` +
  `CURATED_LOCAL` entry + attribution in `buildingImages.js`.
- **D-04 (stances):** Full, per convention — evidence-only across all live compass topics, one research
  agent at a time, 100% citation, no default values, honest blank spokes.
- **D-05 (headshots):** Direct fetch from sahuaritaaz.gov council pages first; `/find-headshots`
  Playwright WAF fallback if blocked, then Ballotpedia/Wikimedia. 600×750 4:5 Lanczos q90, crop-only,
  eyes ~1/3 from top, `press_use`, `type='default'`.
- **D-06 (roster currency):** BLOCKING roster-currency re-verify before apply — 2026 is an active
  election year; this research CONFIRMS an active, imminent election with one open seat (see Summary).

### Claude's Discretion
- Banner subject selection (D-03 "you decide") — pecan orchards is the front-runner for distinctiveness
  per CONTEXT, but this research flags a real resolution risk with the only Commons pecan-orchard photo
  found (532×800px, portrait) — see Open Question 2.
- Migration numbering (disk-authoritative), ext_id ranges, geofence source — this research resolves both
  concretely (see Research Question 6 / Code Examples).
- Exact headshot fetch mechanics within the D-05 order — this research found the direct-fetch path is
  NOT Akamai-WAF-blocked (unlike every prior AZ phase) but the image endpoint returns an empty body to
  non-browser HTTP clients — see Research Question 2 / Pitfall 5.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. School boards, AZ Legislature stances, and appointed staff
remain out of scope per milestone conventions (unchanged from CONTEXT.md).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUB-03 | Sahuarita deep-seed — government + roster → 600×750 headshots → evidence-only stances → licensed community banner → surfaced in `src/lib/coverage.js` | GOVERNMENT/GEOFENCE confirmed greenfield via direct production-DB query (0 rows in `essentials.governments` for `%sahuarita%`; the G4110 town boundary `geo_id='0462140'` already exists from Phase 190, `essentials.districts` has 0 rows for it); ELECTION METHOD confirmed via 4 independent sources (Town Code Ch. 2.05/2.10 excerpts, Wikipedia, sahuaritaaz.gov's own Election-Information page, a WebSearch composite of tucson.com's 2026 election coverage) to be a 7-member at-large nonpartisan council where the MAYOR AND VICE MAYOR ARE COUNCIL-CHOSEN TITLES, not separately-elected offices — this is a genuinely different structural shape than the CONTEXT's default expectation (Oro Valley/Marana's separate LOCAL_EXEC Mayor); ROSTER resolved current as of 2026-07-16 (7 names, terms, 2026 candidacy status) but under an EXTREME timing risk (July 21, 2026 primary is 5 days away, Vice Mayor Kara Egbert's seat is confirmed NOT seeking re-election — a guaranteed open seat); HEADSHOTS: direct `sahuaritaaz.gov` fetch is NOT Akamai-WAF-blocked (confirmed 200 OK, unlike every prior AZ phase) but the `/ImageRepository/Document?documentID=N` image endpoint returns an empty body to a non-browser `curl` — Playwright fallback recommended; MIGRATIONS numbering DB-verified this session (disk MAX=1353, ledger MAX=1345, next structural=1354; ext_id block `-4014001..-4014007` confirmed unused) |
| BANR-01 | Licensed Sahuarita community banner, processed via `scripts/banners/`, wired into `buildingImages.js`, distinct from Tucson (downtown streetscape)/Pima (Catalina Mountains)/Oro Valley (CDO Trail Bridge)/Marana (Dove Mountain golf course)/AZ-state (Phoenix skyline) | 2 concrete licensed Wikimedia Commons candidates identified this session in `Category:Sahuarita, Arizona` (Sahuarita Lake ground-level winter shot, 3008×1645, CC BY-SA 3.0; FICO pecan-groves shot, 532×800 portrait, CC BY-SA 3.0 — flagged low-res); 6 additional Titan Missile Museum exterior candidates identified in a separate Commons category; banner mechanism confirmed identical to the established `CURATED_LOCAL`/`coverage.js` wiring (append to the EXISTING Arizona `COVERAGE_STATES` block — 4th entry, not a new block) |

</phase_requirements>

## Summary

**The single most important finding of this research is that Sahuarita's Mayor and Vice Mayor are NOT
separately-elected offices at all — they are titles the 7-member Town Council CHOOSES from among its own
already-elected membership, re-selected every two years.** This is confirmed via FOUR independent
sources: (1) the Sahuarita Town Code Chapter 2.05 (Town Council composition) and Chapter 2.10 (Mayor and
Vice Mayor) — "the elected officers of the town shall be seven council members... one of whom shall be
designated as mayor, and one of whom shall be designated as vice mayor," selected by a nomination-and-
roll-call-vote process requiring 4 affirmative votes; (2) Wikipedia's "Sahuarita, Arizona" government
section, which states plainly "the mayor and vice mayor are not directly elected to those positions...
they are chosen among elected council members"; (3) `sahuaritaaz.gov`'s own Election-Information page,
which states "One member is chosen as Mayor. One member is chosen as Vice Mayor"; and (4) a WebSearch
composite of tucson.com's 2026 election coverage, which explicitly describes sitting "Mayor Tom Murphy
(who ran as a councilmember and was appointed to the mayoral spot by his fellow councilmembers)." **This
means the CONTEXT.md D-02 default expectation ("mirror Oro Valley/Marana: Mayor = new LOCAL_EXEC seat")
does NOT hold** — Sahuarita is not a by-district town either, so the D-02 stated fallback ("by-district
model") also does not apply. The actual shape needed is a THIRD pattern this milestone has not yet used
for an AZ jurisdiction, but HAS already used for two California jurisdictions in the same v22.0
milestone's Coachella Valley track: Palm Springs (202) and Indio (203), where a rotational Mayor/Mayor
Pro Tem is modeled as a TITLE ANNOTATION on an ordinary at-large/by-district seat, with NO separate
LOCAL_EXEC office or district row at all (see Pattern 1). For Sahuarita specifically — since the 7 seats
are at-large, not by-district — the correct hybrid is: Oro-Valley/Marana's "all elected members share ONE
LOCAL district row" DB shape, PLUS Palm-Springs/Indio's "Mayor/Vice-Mayor are title strings on 2 of the
otherwise-identical seats, no LOCAL_EXEC row exists" office-modeling shape. `essentialsService.ts`'s
existing `G4110→LOCAL` routing map already covers this with ZERO code change (no `LOCAL_EXEC` join is
needed at all this phase — a genuine SIMPLIFICATION relative to Oro Valley/Marana, which both created a
LOCAL_EXEC row).

**Current confirmed sitting roster (as of 2026-07-16, cross-verified via sahuaritaaz.gov's own Town
Council directory, the Town Code, and 3+ WebSearch-composited news sources — tucson.com, gvnews.com):**

| Seat | Name | Title (chosen by council) | 2026 election involvement |
|------|------|---------------------------|----------------------------|
| Council (at-large) | Tom Murphy | Mayor (chosen by council; elected to Council in 2013, most recently 2022) | Seat up in 2026 — running as incumbent to retain his COUNCIL seat (his Mayor title is re-chosen separately by the council after the election, not on the ballot itself) |
| Council (at-large) | Kara Egbert | Vice Mayor (chosen by council; on council since 2009/2013, VM since 2018) | Seat up in 2026 — **CONFIRMED NOT seeking re-election** (running for a different office, Precinct 7 Justice of the Peace, instead) — an OPEN SEAT, guaranteed to change hands |
| Council (at-large) | Deborah Morales | Council Member (re-elected 2022) | Seat up in 2026 — running as incumbent |
| Council (at-large) | Dr. Steven Gillespie | Council Member (appointed June 2022 to a vacancy, elected in own right 2022, re-elected 2024) | NOT up in 2026 (term to 2028) |
| Council (at-large) | Diane Priolo | Council Member (appointed June 2022 to a vacancy, elected in own right August 2022, re-elected 2024) | NOT up in 2026 (term to 2028) |
| Council (at-large) | Kim Lisk | Council Member (elected July 2024, sworn in Nov 2024) | NOT up in 2026 (term to 2028) |
| Council (at-large) | Edgar Lytle | Council Member (elected July 2024, sworn in Nov 2024) | NOT up in 2026 (term to 2028) |

**A directly analogous timing risk to Marana's (196) Pitfall 1 exists here, and it is EVEN TIGHTER:**
Sahuarita's July 21, 2026 municipal primary (electing 3 Council Members to 4-year terms, AZ nonpartisan
primary can produce an outright majority winner with no November runoff) is **5 DAYS from this research
date** (research conducted 2026-07-16). The 3 seats up are Murphy's, Egbert's, and Morales's. Murphy and
Morales are running as incumbents; Egbert's seat is confirmed OPEN (she is not seeking re-election —
running for Precinct 7 Justice of the Peace instead). Challengers reported across sources include JD
Cubillo, Robin Earl, and Chelsea Hundal (tucson.com reports "6 candidates face off for three seats" —
the 6th name was not resolved this session and does not affect the CURRENT-roster seeding decision).
**Whichever of Murphy/Morales/challengers win the 3 open slots, the Mayor and Vice Mayor titles are
RE-CHOSEN by the newly-seated council AFTER the election** (per Town Code 2.10.010) — so even a
"no change" primary outcome does not guarantee Murphy stays Mayor or that the Vice Mayor title stays
vacant-then-reassigned in any particular way. **This compounds the roster-currency risk beyond a simple
membership question into a title-reassignment question.**

**Direct production-DB verification this session (2026-07-16) confirms Sahuarita is fully greenfield**,
structurally identical to every prior AZ suburb's gap: `essentials.governments` has 0 rows matching
`%sahuarita%`; `essentials.geofence_boundaries` already has the whole-town G4110 boundary live from Phase
190 (`geo_id='0462140'`, matching the Town's FIPS place code); `essentials.districts` has **0 rows** for
that geo_id — this phase must create exactly ONE new `LOCAL` district row (shared by all 7 offices,
including the 2 that carry the Mayor/Vice-Mayor title) — NOT two rows as Oro Valley/Marana required,
because there is no separately-elected Mayor office needing its own `LOCAL_EXEC` row.

Headshots present a GENUINELY DIFFERENT obstacle than every prior AZ phase: `sahuaritaaz.gov` (CivicPlus
platform, unlike the Akamai-fronted `maranaaz.gov`/`orovalleyaz.gov`) returned a clean **HTTP 200** to a
direct `curl` with a Chrome User-Agent for both the Town Council roster page and individual staff bio
pages — confirmed NOT WAF-blocked. The page HTML itself directly exposes the CivicPlus
`/ImageRepository/Document?documentID=N` image-URL pattern with descriptive `alt` text (Tom Murphy's
headshot was located this way: `documentID=6097`, `alt="TOM-MURPHY-TOWN-COUNCIL-2020"`). However, a
direct `curl` fetch of that same image URL returned **HTTP 200 with an empty body (`Content-Length: 0`,
no `Content-Type`)** — a soft block that serves 200-but-empty to non-browser clients rather than a hard
403. The `/find-headshots` Playwright fallback (which renders the page in a real browser context) is the
recommended path per D-05's stated order, exactly as it has been for every WAF-blocked prior AZ phase,
even though the failure signature here is different (soft-empty vs. hard-403).

**Primary recommendation:** Model Sahuarita as ONE `Town Council` chamber (`official_count=7`) holding 7
offices ALL of `district_type='LOCAL'`, ALL joined to a SINGLE NEW `essentials.districts` row
(`geo_id='0462140'`, `mtfcc='G4110'`, `state='az'`) — NO `LOCAL_EXEC` row, NO per-seat districts. Title
the 7 offices: Murphy = `'Mayor'` (or `'Council Member (Mayor)'` — planner's choice, see Pattern 1 note),
Egbert = `'Vice Mayor'` (or `'Council Member (Vice Mayor)'`), the other 5 = `'Council Member'`.
`role_canonical` NULL on all 7 (Mayor/VM distinction lives entirely in `title`, per the Palm Springs/Indio
precedent). **The single highest-priority planning action is scoping a genuinely substantive BLOCKING
roster-currency checkpoint at execute time** — this window is 5 days from research, one seat (Egbert's)
is a confirmed open seat, and even a "nothing changed" primary outcome does not resolve who holds the
Mayor/Vice-Mayor TITLES post-election (those are re-chosen by the new council, a separate event from the
election itself, per Town Code 2.10.010).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Town boundary (all 7 at-large seats share one geofence) | Database / Storage (`essentials.geofence_boundaries`, ALREADY LIVE from Phase 190, DB-confirmed 2026-07-16) | — | No new geometry work this phase — reuses the existing `0462140`/G4110 row entirely |
| Government/chamber/office/politician seed | Database (`essentials.governments/chambers/districts/offices/politicians`) | — | Structural migration; SIMPLER than Oro Valley/Marana — only ONE new district row needed (no LOCAL_EXEC), since there is no separately-elected Mayor office |
| Address → all-7-at-large-Council routing | API / Backend (`essentialsService.ts`, unchanged code) | Database (geofence + district join) | The existing `G4110→LOCAL` mapping already covers this — zero code change; no `LOCAL_EXEC` join needed at all |
| 600×750 headshots | Database / Storage (`politician_images`, `politician_photos` bucket) | Playwright (fallback sourcing for the soft-blocked `sahuaritaaz.gov` image endpoint) | Same DB/Storage tier as every prior phase; sourcing tier differs from prior AZ phases (soft-empty-body block, not hard Akamai 403) |
| Compass stances | Database (`inform.politician_answers`) | — | Evidence-only INSERTs; no frontend change |
| Community banner | Frontend (`src/lib/buildingImages.js` CURATED_LOCAL) + Storage (`politician_photos/cities/`) | Frontend (`src/lib/coverage.js`, EXISTING Arizona `COVERAGE_STATES` block — plain append) | The Arizona block already has 3 entries (Tucson, Oro Valley, Marana) — this is the 4th append, not a new-block creation |
| Coverage surfacing (chip) | Frontend (`src/lib/coverage.js`) | — | `hasContext:true` once ≥1 stance row exists |

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PostgreSQL/PostGIS (Supabase) | Live prod (`kxsdzaojfaibhuzmclfq`) | Structural + audit migrations | Same DB as every prior phase — confirmed reachable this session via `psql` against `C:/EV-Accounts/backend/.env` |
| `psql` CLI | confirmed on PATH 2026-07-16 | Inline orchestrator apply + DB-verify | `gsd-executor` has no Supabase MCP — orchestrator applies via `psql` |
| Python 3 + Pillow + `requests` + `psycopg2` | Proven in every prior AZ phase | Headshot crop/resize/upload pipeline | Verbatim reuse |
| `mcp__playwright__browser_navigate` (+ snapshot/click/close) | Available per `/find-headshots` skill | Headshot sourcing fallback for the soft-blocked `sahuaritaaz.gov` image endpoint | Confirmed necessary this session — direct `curl` of the discovered `/ImageRepository/Document?documentID=N` URL returns HTTP 200 with an EMPTY body (no bytes), not a hard 403; a real browser context is required to retrieve the actual image |
| `scripts/banners/process_banner.py` + `upload_banner.py` | Already present | Banner crop-to-1700×540 + Storage upload | No new tooling |

**NOT needed this phase (SIMPLER than Oro Valley/Marana):** no `LOCAL_EXEC` district row at all — every
office (including the Mayor- and Vice-Mayor-titled ones) attaches to the SAME single new `LOCAL` row.
No TypeScript geofence loader — Sahuarita has no sub-jurisdiction geofences to source; the whole-town
G4110 boundary already covers all 7 seats.

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `tucson.com`, `gvnews.com` (Green Valley News), `tucsonsentinel.com`, `citizenportal.ai` | live, confirmed reachable via WebFetch/WebSearch 2026-07-16 | Roster cross-check + stance-research evidence sourcing | Not WAF-blocked; all directly fetchable this session |
| Ballotpedia (per-candidate pages, e.g. `Tom_Murphy_(Sahuarita_Town_Council_At-large,_Arizona,_candidate_2026)`) | live | Roster/candidate cross-check; Ballotpedia's own naming convention independently confirms the "At-large" election method | Worth checking at execution time for possible headshot sourcing too |
| `sahuaritaaz.gov` (CivicPlus platform) | live, confirmed reachable (HTTP 200, no WAF) | Primary roster + election-info source | Direct `curl`/WebFetch works for HTML; use Playwright for the image bytes themselves (soft-block on the image endpoint) |
| `pub-sahuarita.escribemeetings.com` (Council meeting minutes) | live, confirmed reachable via WebSearch snippets this session | Primary-source roster corroboration (meeting minutes list attendees/appointments) | Same role as Marana's Jan-2026 council-agenda primary source |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Palm-Springs/Indio-style plain titles (`'Mayor'`, `'Vice Mayor'`, `'Council Member'`) | Marana/Oro-Valley-style annotated titles (`'Council Member (Mayor)'`, `'Council Member (Vice Mayor)'`) | Both are established conventions in this codebase. This research recommends the PLAIN style because it is the closer structural analog — Marana/Oro-Valley's annotation pattern exists specifically BECAUSE Mayor is a separate elected office there and Vice-Mayor is the only rotating title; Sahuarita (like Palm Springs/Indio) has NO separately-elected Mayor office at all, so both titles are equally "just a label on an ordinary at-large seat." Planner's final call — either reads correctly in the UI. |

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
Town of Sahuarita G4110 boundary (ALREADY LIVE from Phase 190: geo_id='0462140', state='04' FIPS —
DB-confirmed 2026-07-16: `SELECT geo_id, mtfcc, state, name FROM essentials.geofence_boundaries
WHERE name ILIKE '%sahuarita%'` => 0462140 | G4110 | 04 | Sahuarita town)
        │  (no geofence loader needed — the same boundary serves ALL 7 at-large seats)
        ▼
Structural migration <disk-MAX+1, provisionally 1354>_town_of_sahuarita.sql
   ├─ essentials.governments  ('Town of Sahuarita, Arizona, US', type='Town', state='AZ', geo_id='0462140')
   ├─ essentials.chambers     ('Town Council', official_count=7 — 7 at-large council members, ONE chamber,
   │                          NO separate Mayor chamber/office — Mayor is a TITLE, not a seat)
   ├─ essentials.districts    ONE NEW LOCAL row (geo_id='0462140', mtfcc='G4110', state='az' — did NOT
   │                          exist before this phase, DB-confirmed 0 rows this session). NO LOCAL_EXEC
   │                          row at all — SIMPLER than Oro Valley/Marana, which both needed 2 rows.
   └─ essentials.politicians + essentials.offices  (7 people, ext_id -4014001..-4014007, party=NULL,
                                title: Murphy='Mayor', Egbert='Vice Mayor', other 5='Council Member' —
                                ALL 7 join the SAME single LOCAL row)
        │  office_id back-fill + post-verify DO block (row counts, casing, section-split, title checks)
        ▼
Address routing (NO CODE CHANGE — the existing G4110→LOCAL routing map already covers all 7 seats;
NO LOCAL_EXEC join is exercised at all this phase)
        │
        ▼
Resident's profile shows their at-large Council of 7 (2 of whom carry the Mayor/Vice-Mayor title)
        │
        ├─ Headshots: sahuaritaaz.gov NOT WAF-blocked (HTTP 200 confirmed 2026-07-16) but the
        │             /ImageRepository/Document?documentID=N image endpoint returns an EMPTY BODY to a
        │             non-browser curl → Playwright fallback (/find-headshots skill) → crop-first 4:5 →
        │             600×750 Lanczos → politician_images (audit-only).
        ├─ Stances: evidence-only research (tucson.com, gvnews.com, tucsonsentinel.com, citizenportal.ai
        │           — all confirmed reachable this session) → inform.politician_answers. Salient local
        │           issues to probe: Copper World/Hudbay copper-mine proposal (water, traffic,
        │           environment — very active as of 2026), Colorado River / CAP water allocation,
        │           data-center growth, and general residential/commercial growth pressure.
        └─ Banner: Wikimedia CC Sahuarita-Lake or FICO-pecan-groves photo (candidates identified, see
                   Open Questions) → process_banner.py (1700×540) → upload_banner.py
                   (cities/sahuarita.jpg) → buildingImages.js CURATED_LOCAL['sahuarita'] → coverage.js
                   EXISTING Arizona COVERAGE_STATES block (4th `areas` entry — the block already exists)
```

### Recommended Project Structure (files this phase touches)
```
C:/EV-Accounts/backend/
├── migrations/<disk-MAX+1>_town_of_sahuarita.sql               # NEW — structural (registered)
├── migrations/<next>_town_of_sahuarita_headshots.sql           # NEW — audit-only (unregistered)
└── migrations/<next..next+6>_sahuarita_*_stances.sql           # NEW — audit-only, one per official

C:/Transparent Motivations/essentials/
├── src/lib/coverage.js         # MODIFIED — append 'Sahuarita' to the EXISTING Arizona areas[] array
└── src/lib/buildingImages.js   # MODIFIED — add 'sahuarita' to CURATED_LOCAL
```

**No new backend script/loader file is needed** — Sahuarita has zero sub-jurisdiction geofences to
source, and (unlike every other AZ suburb this milestone) needs zero `LOCAL_EXEC` district work either.

### Pattern 1: Rotational Mayor/Vice-Mayor as a title-on-seat, with ALL seats at-large sharing ONE LOCAL row (hybrid of Oro-Valley/Marana + Palm-Springs/Indio)
**What:** When a council elects ALL its members at-large AND separately chooses its Mayor/Vice-Mayor
from among its own membership (no directly-elected Mayor office exists), model the Mayor/VM distinction
PURELY as a `title` string on 2 of the 7 otherwise-identical `LOCAL`-district offices. Do NOT create a
`LOCAL_EXEC` row — there is no office it would represent.
**When to use:** Exactly this phase. This is a genuinely new hybrid in this milestone: take the
"all-at-large members share ONE shared LOCAL district row" DB shape from Oro Valley (195)/Marana (196),
but DROP their `LOCAL_EXEC` Mayor row entirely, and instead apply the Palm Springs (202)/Indio (203)
"Mayor/Mayor-Pro-Tem are title-only, `role_canonical` stays NULL, gate exactly 1 office per title" office-
modeling pattern.
```sql
-- Oro Valley/Marana's LOCAL_EXEC + LOCAL split does NOT apply here — Sahuarita needs
-- ONLY the LOCAL row (mtfcc='G4110', state='az', geo_id='0462140'), shared by ALL 7 offices.
-- Palm Springs' post-verify gate shape (1329_palm_springs_city_council.sql, gate (f)) is the
-- directly-reusable template for asserting "exactly 1 office titled Mayor" / "exactly 1 titled
-- Vice Mayor" and confirming which external_id holds each — copy that gate verbatim, substituting
-- Sahuarita's facts (7 at-large offices on ONE shared district, not 5 by-district offices each on
-- its own district).
```

### Pattern 2: A 5-days-to-primary roster with one CONFIRMED open seat (Egbert) and a post-election title re-shuffle still pending
**What:** Sahuarita's July 21, 2026 primary is 5 days from this research date; Vice Mayor Kara Egbert is
confirmed NOT running for re-election to Council (she is running for a different office, Precinct 7
Justice of the Peace) — her seat WILL change hands. Separately, per Town Code 2.10.010, the Mayor and
Vice Mayor TITLES are re-chosen by the newly-seated council AFTER the election regardless of which
individuals win — so even if Murphy and Morales both win re-election, there is no guarantee Murphy
remains "Mayor" once the new 7-member council convenes and holds its own nomination/roll-call vote.
**When to use:** The execute-time roster-currency checkpoint (Task 2 analog to Marana's) must treat BOTH
the membership question (who are the 7 people) AND the title question (who holds Mayor/VM) as
independently re-verifiable — a certified primary result does not by itself answer the title question.
**Caveat:** This is a MORE layered risk than Marana's single appointed-Mayor situation — Sahuarita's
title-reassignment is a routine, scheduled, EVERY-election-cycle event (Town Code 2.10.010), not a one-off
succession. The planner should not assume "if Murphy wins re-election, seed him as Mayor" without an
execute-time check of the actual post-election council vote (which may occur days-to-weeks after the
primary itself, per the Code's "first meeting after the canvass" language).

### Anti-Patterns to Avoid
- **Creating a `LOCAL_EXEC` district row for Sahuarita's Mayor:** There is no separately-elected Mayor
  office to attach it to — Mayor is a `title` string on one of the 7 at-large `LOCAL` offices. A
  `LOCAL_EXEC` row here would be a phantom seat with no electoral basis.
- **Treating "Murphy is running for re-election" as equivalent to "Murphy will be Mayor next term":**
  These are two separate events under Town Code 2.10.010 — winning a Council seat and being chosen Mayor
  by the newly-seated council are sequential, not simultaneous.
- **Seeding Kara Egbert as a stable, ongoing Vice Mayor:** She is confirmed NOT seeking re-election to
  Council in 2026 (running for JP instead) — her seat is guaranteed to change hands, and the Vice-Mayor
  title will move to whichever sitting/incoming member the new council chooses.
- **Recording a party affiliation:** Sahuarita council elections are nonpartisan (confirmed via
  Ballotpedia's "Sahuarita Town Council At-large" candidate-page naming convention, matching the
  established AZ-suburb pattern). `politicians.party` must be NULL for all 7.
- **Assuming the `sahuaritaaz.gov` headshot source is fully open just because it returns HTTP 200:** The
  HTML page loads fine via `curl`, but the actual image bytes at `/ImageRepository/Document?documentID=N`
  came back EMPTY to a non-browser client this session — verify with an actual byte-count/dimension check
  before trusting a "direct fetch succeeded" assumption; use Playwright if the direct path returns 0
  bytes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rotational Mayor/VM modeling with no separately-elected Mayor office | A synthetic `LOCAL_EXEC` seat "to be safe" | The Palm Springs (1329)/Indio precedent's title-only pattern (Pattern 1) | Battle-tested twice now (Palm Springs, Indio) for exactly this electoral shape; a phantom `LOCAL_EXEC` row would misrepresent the town's actual government structure |
| At-large council district modeling | A per-seat geofence or "fake ward" scheme | The Torrance/Oro-Valley shared-`LOCAL`-row shape (still applies to the membership question, just without the LOCAL_EXEC half) | Confirmed via Sahuarita's own Town Code — all 7 seats are at-large, no wards |
| Headshot sourcing from a soft-blocked CivicPlus image endpoint | Custom scraping/proxy/cookie-jar tricks to coax bytes out of `/ImageRepository/Document` | `/find-headshots` skill's Playwright flow (already built) | The endpoint returns HTTP 200 with 0 bytes to `curl` even with cookies/referer set (confirmed this session) — only a real browser context reliably retrieves the image |
| 4:5 headshot cropping + banner crop/resize | Custom PIL scripts | `_tmp-*-headshots.py` pipeline + `scripts/banners/process_banner.py` | Verbatim reuse |
| Roster-currency verification 5 days before a primary, with a scheduled post-election title reshuffle | A one-time WebSearch snippet trusted at face value | Multiple independently-corroborating primary sources (Town Code + Wikipedia + sahuaritaaz.gov + WebSearch composite) PLUS a fresh execute-time re-check that separately confirms BOTH membership AND the post-election Mayor/VM vote | A single-source claim here would risk exactly the Marana Jackie-Craig-style trap, compounded by the title-reshuffle timing issue unique to Sahuarita |

**Key insight:** This phase's core engineering surface is SIMPLER than Oro Valley/Marana (one new
district row instead of two, no LOCAL_EXEC join anywhere) but its ROSTER-CURRENCY risk is layered in a
new way — not just "will the membership change" (Marana's risk) but "will the TITLE assignment change
even if the membership doesn't" (a genuinely new risk shape for this milestone, arising from Town Code
2.10.010's scheduled post-election Mayor/VM re-vote).

## Common Pitfalls

### Pitfall 1: The July 21, 2026 primary is 5 DAYS away from this research date — Egbert's seat is a confirmed open seat
**What goes wrong:** Assuming the roster documented here (Murphy/Egbert/Morales/Gillespie/Priolo/
Lisk/Lytle) will still be accurate at plan/execute time.
**Why it happens:** 3 of 7 seats (Murphy's, Egbert's, Morales's) are up July 21, 2026; Egbert is
confirmed NOT seeking re-election (running for JP instead) — her seat WILL change hands regardless of
anything else. AZ nonpartisan primaries can produce outright majority winners with no November runoff.
**How to avoid:** The planner MUST schedule a genuinely substantive BLOCKING roster-currency checkpoint
at execute time, structured like Marana's (196) Task 2 but adapted for Sahuarita's specific open seat and
title-reshuffle risk (Pitfall 2).
**Warning signs:** Any execute-time date on or after July 21, 2026 without an explicit fresh recheck of
certified results AND the subsequent Mayor/VM council vote.

### Pitfall 2: Winning re-election to Council does NOT guarantee retaining the Mayor/Vice-Mayor TITLE
**What goes wrong:** Assuming "Murphy won re-election, so seed him as Mayor" without checking whether the
newly-seated council actually re-chose him.
**Why it happens:** Per Town Code 2.10.010, the Mayor and Vice Mayor are chosen by the COUNCIL (not
voters) at the first meeting after the canvass of the election — a SEPARATE, SEQUENTIAL event from the
election itself, requiring a nomination + roll-call vote with 4 affirmative votes to win. This vote could
plausibly land days-to-weeks after July 21, 2026, likely AFTER this phase's execute date.
**How to avoid:** The execute-time checkpoint must explicitly check meeting minutes / news coverage of
the POST-ELECTION council organizational meeting, not just the primary/general election results
themselves, before finalizing who carries the Mayor/VM title in the seed.
**Warning signs:** Seeding a Mayor/VM title based solely on primary-election results without confirming
the subsequent council vote occurred and its outcome.

### Pitfall 3: `essentials.districts` has NO rows yet for the Sahuarita boundary (`0462140`/G4110) — but only ONE new row is needed, not two
**What goes wrong:** Copying Oro Valley/Marana's "create a LOCAL_EXEC AND a LOCAL row" migration
structure verbatim would create a phantom `LOCAL_EXEC` row with no electoral basis.
**How to avoid:** DB-confirmed this session: `SELECT COUNT(*) FROM essentials.districts WHERE
geo_id='0462140'` returns **0**. This migration must explicitly `INSERT INTO essentials.districts` exactly
ONE new row (`district_type='LOCAL'`), shared by ALL 7 offices including the Mayor- and
Vice-Mayor-titled ones.
**Warning signs:** A migration file containing a `LOCAL_EXEC` INSERT for Sahuarita at all.

### Pitfall 4: `sahuaritaaz.gov` is NOT Akamai-WAF-blocked like every prior AZ phase's official site — but its image endpoint is soft-blocked
**What goes wrong:** Assuming (a) "not WAF-blocked" means headshots can be fetched with a plain `curl`,
or (b) treating this like every prior phase's hard-403 Akamai signature.
**Why it happens:** Confirmed live 2026-07-16: `curl` (Chrome UA) returns HTTP 200 for both the Town
Council roster page AND the individual `/ImageRepository/Document?documentID=N` image URL — but the
image response has `Content-Length: 0` and no `Content-Type` (empty body), even with a session cookie
jar and Referer header set. This is a DIFFERENT failure mode than Akamai's hard 403 — likely a
bot-detection layer that serves a plausible-looking 200 to avoid signaling a block.
**How to avoid:** Use the `/find-headshots` skill's Playwright-based flow (a real browser context
correctly retrieves the image bytes, per the CivicPlus `/ImageRepository/Document` pattern already
proven working for Palmdale in an earlier CA phase). Verify byte-count > 0 before trusting any "direct
fetch succeeded" claim.
**Warning signs:** A downloaded "headshot" file that is 0 bytes or fails to open as a valid image.

### Pitfall 5: Migration numbering — disk MAX, not ledger MAX, is authoritative; re-verify at execute time
**What goes wrong:** Assuming the next structural migration number is ledger-MAX+1.
**Why it happens:** Ledger MAX = **1345** (confirmed via `psql` 2026-07-16 — only structural migrations
register; Marana's Plan 02/03 headshot + 6 stance migrations, 1346-1353, are audit-only and do NOT
register). Disk MAX = **1353** (confirmed via `ls C:/EV-Accounts/backend/migrations` same session).
**Next structural migration = 1354.** This gap (ledger 1345 vs. disk 1353) is a structural, recurring
project convention — audit-only migrations never register — not a one-off drift.
**How to avoid:** Re-verify BOTH numbers immediately before writing/applying any new migration file at
execute time.
**Warning signs:** `psql -f` apply failing on a duplicate filename.

### Pitfall 6: Judicial compass topics do not apply (re-verified, unchanged from every prior AZ phase)
**What goes wrong:** Stancing against all 44 live `inform.compass_topics` rows would include 8
judicial-scoped topics with no bearing on an at-large Council Member/Mayor/Vice-Mayor.
**Why it happens:** Confirmed live this session: `inform.compass_topics WHERE is_live=true` = 44 rows;
`WHERE is_live=true AND topic_key ILIKE 'judicial%'` = 8 rows → 36 non-judicial topics.
**How to avoid:** Research against the 36 non-judicial live topics, exactly as every prior AZ deep-seed.
**Warning signs:** A verification script asserting "44 topics per official" would incorrectly flag
honest, complete 36/36 coverage as a gap.

### Pitfall 7: `coverage.js`'s Arizona block already exists with 3 entries — do not recreate it
**What goes wrong:** Creating a NEW `{ name: 'Arizona', ... }` block.
**Why it happens:** Phase 194 created the Arizona block (Tucson); Phase 195 appended Oro Valley; Phase
196 appended Marana — confirmed via direct file read this session (`src/lib/coverage.js` lines 205-217,
now 3 `areas` entries under the Arizona block).
**How to avoid:** APPEND a 4th `{ label: 'Sahuarita', browseGovernmentList: ['0462140'], browseStateAbbrev:
'AZ', hasContext: true }` entry to the EXISTING Arizona block's `areas` array.
**Warning signs:** A diff showing two separate `name: 'Arizona'` blocks — a duplicate-block bug.

## Code Examples

### Confirm the Sahuarita government row does not yet exist (greenfield, verified live 2026-07-16)
```sql
SELECT id, name, type, state, geo_id FROM essentials.governments WHERE name ILIKE '%sahuarita%';
-- => 0 rows (confirmed greenfield this session)
```

### Confirm the existing G4110 boundary and the districts gap (verified live 2026-07-16)
```sql
SELECT geo_id, mtfcc, state, name FROM essentials.geofence_boundaries WHERE name ILIKE '%sahuarita%';
-- => 0462140 | G4110 | 04 | Sahuarita town   (from Phase 190 — already live)

SELECT COUNT(*) FROM essentials.districts d
JOIN essentials.geofence_boundaries g ON g.geo_id = d.geo_id
WHERE g.name ILIKE '%sahuarita%';
-- => 0   (this phase must create exactly ONE new LOCAL row — NOT two; no LOCAL_EXEC needed)
```

### Migration ledger + disk MAX + ext_id probes (run these exact queries again at plan/execute time)
```sql
-- Ledger MAX (DB-verified 2026-07-16):
SELECT MAX(CAST(version AS INTEGER)) FROM supabase_migrations.schema_migrations
WHERE version ~ '^[0-9]{1,4}$';
-- => 1345

-- On-disk MAX (authoritative for next-number assignment — confirmed via `ls` 2026-07-16):
-- ls C:/EV-Accounts/backend/migrations/*.sql | sed -E 's#.*/##; s#_.*##' | sort -n | tail -1 => 1353
-- (1346-1353 are Marana's audit-only headshots/stances migrations — unregistered, per convention)
-- Next structural migration = 1354. RE-VERIFY at execute time.

-- external_id collision check for the proposed -4014001..-4014007 block (7 people, DB-verified
-- 2026-07-16; continues the sequential AZ/CA-town numbering after Marana's -4013xxx/Phase 196):
SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -4014010 AND -4014000;
-- => 0 rows (confirmed unused)
```

### compass_topics live/judicial scope (verified live 2026-07-16, unchanged from every prior AZ phase)
```sql
SELECT count(*) FROM inform.compass_topics WHERE is_live=true;                                -- => 44
SELECT count(*) FROM inform.compass_topics WHERE is_live=true AND topic_key ILIKE 'judicial%'; -- => 8
-- 36 non-judicial live topics is the research scope for all 7 Sahuarita officials.
```

### sahuaritaaz.gov WAF/soft-block confirmation (verified live 2026-07-16)
```bash
curl -sI -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" \
  "https://www.sahuaritaaz.gov/mayor-and-council"
# => HTTP/1.1 301 Moved Permanently -> http://sahuaritaaz.gov/mayor-and-council (plain redirect, no WAF)

curl -sL -A "...Chrome/126.0..." "https://sahuaritaaz.gov/274/Town-Council" -w "HTTP_CODE:%{http_code}\n"
# => HTTP_CODE:200 (page HTML loads fully; NOT Akamai-blocked, unlike maranaaz.gov/orovalleyaz.gov)

# But the discovered headshot image URL itself:
curl -s -c cookies.txt -b cookies.txt -A "...Chrome/126.0..." -e "https://sahuaritaaz.gov/directory.aspx?EID=146" \
  "https://sahuaritaaz.gov/ImageRepository/Document?documentID=6097" -o murphy.jpg -D headers.txt
# => HTTP/1.1 200 OK, Content-Length: 0, no Content-Type -- EMPTY body (soft block; use Playwright instead)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Every prior AZ suburb (Tucson/Oro Valley/Marana) has a separately-elected Mayor (LOCAL_EXEC) | Sahuarita has NO separately-elected Mayor — Mayor/VM are titles the 7-member council chooses from its own ranks | Confirmed this phase (Town Code Ch. 2.05/2.10) | The migration is SIMPLER (1 new district row, not 2) but the office-modeling pattern must borrow from the Coachella Valley (Palm Springs/Indio) precedent instead of the prior AZ precedent |
| Every prior AZ suburb's official site is Akamai-WAF-blocked (hard 403) | `sahuaritaaz.gov` (CivicPlus) returns clean HTTP 200 for HTML, but a soft-empty-body block on the image endpoint specifically | Confirmed this phase | Different mitigation signature — still resolves to the same `/find-headshots` Playwright fallback, but budget verification time for "is this actually blocked or did I just get 0 bytes" |
| `coverage.js` had 3 Arizona entries after Phase 196 | The Arizona block now has 3 entries (Tucson, Oro Valley, Marana) — this phase is the 4th append | Since Phase 196 | Confirmed via direct file read this session |

**Deprecated/outdated:** None specific to this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The current 7-person roster (Murphy/Egbert/Morales/Gillespie/Priolo/Lisk/Lytle) and their term-expiration years are accurate as of the 2026-07-16 research date, cross-verified via the Town's own Council directory page, Wikipedia, and 3+ WebSearch-composited news sources — but the July 21, 2026 primary is 5 days away and one seat (Egbert's) is a CONFIRMED open seat | Summary / Roster | **VERY HIGH impact if not re-verified** — shortest research-to-election window of any phase in this milestone to date, with a guaranteed personnel change |
| A2 | The Mayor/Vice-Mayor selection mechanism (council-chosen, not directly elected) is correctly characterized, based on 4 independently cross-verified sources (Town Code Ch. 2.05/2.10, Wikipedia, sahuaritaaz.gov's own Election-Information page, and a WebSearch composite of tucson.com's 2026 coverage) — but this research could NOT directly render the Town Code's full Chapter 2.10 text (codepublishing.com served a Cloudflare JS challenge to a direct `curl`) and instead relied on a WebSearch-tool's summarized excerpt of that page | Summary / Pattern 1 | Medium-low — 4 independent sources agreeing reduces risk substantially, but the planner should have the execute-time checkpoint attempt a fresh, successful render of Chapter 2.10 (e.g. via Playwright, which handles JS challenges) to read the exact statutory language directly, not just a search-engine's summary of it |
| A3 | `politicians.party` should be NULL (nonpartisan), based on Ballotpedia's "At-large" naming convention + Town Code characterization, not an independent reading of Sahuarita's own municipal election ordinance text | Anti-Patterns to Avoid | Low — party is never displayed regardless (antipartisan design) |
| A4 | The recommended plain-title convention (`'Mayor'`/`'Vice Mayor'`/`'Council Member'`, Palm-Springs/Indio style) is preferable to the annotated style (`'Council Member (Mayor)'`, Marana/Oro-Valley style) for THIS specific electoral shape — a stylistic judgment, not a hard technical requirement; either renders correctly | Standard Stack / Alternatives Considered | Low — purely cosmetic; does not affect routing, compass stances, or headshots |
| A5 | The two Wikimedia Commons banner candidates identified this session (Sahuarita Lake ground-level winter shot, 3008×1645; FICO pecan-groves shot, 532×800 portrait) are licensing-clean (CC BY-SA 3.0, photographer Brian Basgen, a named/attributable Commons contributor) and usable, but the pecan-groves candidate's LOW RESOLUTION AND PORTRAIT ORIENTATION were not independently tested for actual crop feasibility against the 1700×540 banner spec this session | Open Questions | Low-medium — the execution-phase one-at-a-time sourcing pass should attempt the Sahuarita Lake photo first (adequate resolution, landscape orientation) and treat the pecan-groves photo as a stretch candidate requiring either a higher-res re-source (Flickr/direct FICO photography) or acceptance of visible upscale softness |

**If this table is empty:** N/A — see rows above. A1 (roster currency, 5 days from a primary, with a
confirmed open seat) is the single highest-risk claim in this research; A2 (the structural
Mayor-selection-mechanism finding) is the single highest-IMPACT claim, since it changes the migration
shape from the CONTEXT.md default expectation.

## Open Questions

1. **Will the July 21, 2026 primary outright resolve all 3 open seats, or force a November 3, 2026
   general?**
   - What we know: AZ nonpartisan municipal primaries can produce an outright majority winner (>50% of
     votes cast for Council Member) with no runoff needed; if not, a November 3, 2026 general follows.
   - What's unclear: Given this research is dated 5 days before the primary, the outcome is unknowable
     at research time.
   - Recommendation: The execute-time checkpoint (Pitfall 1/2) must check BOTH possible dates depending
     on when execution actually happens, and separately confirm whichever post-election council meeting
     re-chose the Mayor/Vice-Mayor titles (Pitfall 2) — this is a genuinely two-stage confirmation, not
     a single "did the roster change" check.

2. **Is the FICO pecan-groves Commons photo (532×800px, portrait) usable for a 1700×540 landscape banner
   crop, or does the execution-phase sourcing pass need a higher-resolution alternative?**
   - What we know: This is the ONLY pecan-orchard photo found in Commons' `Category:Sahuarita, Arizona`
     this session; it directly depicts "FICO pecan groves in Sahuarita, AZ, with the Santa Rita Mountains
     hiding behind low clouds" — an excellent thematic match for D-03's top-priority subject, licensed
     CC BY-SA 3.0 by an established Commons contributor (Brian Basgen).
   - What's unclear: At 532px wide (vs. the 1700px target width), a crop would require >3x upscaling —
     likely producing visible softness/artifacting, a quality bar this milestone has not accepted before.
   - Recommendation: The execution-phase banner-sourcing pass should FIRST attempt a direct Flickr/Green-
     Valley-Pecan-company-photography search for a higher-resolution pecan-orchard shot (mirroring
     Marana's Open Question 2 disposition); if none is found, fall back to the same photographer's
     high-resolution Sahuarita Lake photo (3008×1645, ground-level, licensing-clean) as the confirmed
     usable candidate.

3. **What is the 6th candidate name in tucson.com's "6 candidates face off for three seats" headline?**
   - What we know: 2 confirmed incumbents (Murphy, Morales) + 3 confirmed challengers (JD Cubillo, Robin
     Earl, Chelsea Hundal) = 5 named individuals; the headline states 6.
   - What's unclear: The 6th name was not resolved by this session's searches.
   - Recommendation: Immaterial to the CURRENT-roster seeding decision (this phase seeds sitting
     officials, not candidates) — but the execute-time checkpoint should re-pull the full candidate list
     for completeness when confirming the certified primary result.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `psql` | Inline orchestrator DB apply/verify | ✓ | confirmed on PATH 2026-07-16 | — |
| Python 3 + Pillow + requests + psycopg2 | Headshot/banner pipeline | ✓ (proven in every prior AZ phase) | — | — |
| Geofence loader (`npx tsx`) | NOT NEEDED this phase | N/A | — | N/A — no sub-jurisdiction geofence to source |
| `sahuaritaaz.gov` (official headshot + roster source) | Headshot sourcing | Partial — HTML loads (HTTP 200, confirmed NOT Akamai-WAF-blocked), but the discovered `/ImageRepository/Document?documentID=N` image endpoint returns HTTP 200 with an EMPTY body to a non-browser `curl` (confirmed 2026-07-16, even with cookies + Referer set) | — | Playwright browser navigation (`/find-headshots` skill) to retrieve actual image bytes; Ballotpedia candidate pages as a secondary fallback |
| `mcp__playwright__browser_navigate` | Headshot sourcing fallback | ✓ (per `/find-headshots` skill, confirmed present on disk in prior phases) | — | — |
| `mcp__supabase-local` / Supabase MCP | (NOT available to `gsd-executor`) | ✗ for the executor | — | Inline-orchestrator `psql` pattern (this research itself used direct `psql` against `C:/EV-Accounts/backend/.env` `DATABASE_URL` — confirmed working) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `sahuaritaaz.gov`'s image endpoint (soft-blocked to non-browser
clients) — Playwright + Ballotpedia as documented above. `mcp__supabase-local` unavailable to the
executor — established inline-orchestrator `psql` pattern is the correct workflow, not a workaround.

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
| SUB-03 (govt/roster) | Standalone-shaped Town of Sahuarita government, ONE Town Council chamber, 7 at-large Council offices ALL sharing ONE LOCAL district (`0462140`/G4110) — NO LOCAL_EXEC row — Mayor/Vice-Mayor as title annotations on 2 of the 7, `party` NULL for all 7 | integration (SQL DO-block + psql audit) | in-migration `DO $$` gate (row counts, section-split, title-annotation count+identity per Palm-Springs gate (f) shape, party-NULL check) + orchestrator `psql -c "SELECT ..."` audits | ✅ pattern exists (Palm Springs 1329 gate (f) is the directly-reusable template) |
| SUB-03 (headshots) | 7/7 officials have a 600×750 `politician_images` row | smoke (HTTP HEAD/GET + PIL dimension check) | Python pipeline's own dry-run HTTP-200-AND-nonzero-bytes pre-check (NOT just HTTP 200 — this phase's soft-block returns 200 with 0 bytes) + post-upload CDN HTTP 200 + PIL `(600,750)` assertion | ✅ pattern exists, with an added byte-count check specific to this phase's soft-block finding |
| SUB-03 (stances) | Evidence-only compass stances, 100% cited, no defaults, honest blanks, 36 non-judicial topics per official | manual-only (evidence-based research) | N/A — human/agent research process; automated check is a `psql` row-count + citation-completeness audit | ✅ pattern exists |
| BANR-01 | Licensed Sahuarita banner sourced, processed, uploaded, wired into `buildingImages.js`, surfaced via the EXISTING Arizona `coverage.js` block | unit (Vitest) + smoke (CDN HTTP) | `npx vitest run src/lib/buildingImages.test.js` + `curl -I https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/sahuarita.jpg` | ✅ `buildingImages.test.js` exists; no dedicated `coverage.test.js` exists (established non-gap) |

### Sampling Rate
- **Per task commit:** in-migration `DO $$` gate (backend); `node --input-type=module -e "import(...)"` parse-check (coverage.js)
- **Per wave merge:** full `psql` audit suite (row counts, casing, section-split) + `npx vitest run src/lib/buildingImages.test.js`
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
| Section-split (offices attached under the wrong government) | Tampering | Chamber scoped to `government_id` subquery `WHERE name='Town of Sahuarita, Arizona, US'`; post-verify `DO` block section-split gate must return 0 rows |
| Wrong-district attach (offices silently matching 0 rows due to a bare geo_id or casing mismatch) | Tampering | Every office↔district join scoped by `district_type='LOCAL'` AND `state='az'` (lowercase) AND `geo_id='0462140'`, never a bare geo_id |
| Phantom `LOCAL_EXEC` row (misrepresenting a non-existent separately-elected Mayor office) | Tampering (data integrity) | This migration creates NO `LOCAL_EXEC` row at all — Pitfall 3 / Pattern 1 codify this explicitly |
| Service-role key / `DATABASE_URL` leakage | Information disclosure | Read from gitignored `C:/EV-Accounts/backend/.env`; never hardcoded in the migration or scripts |
| Seeding a roster superseded by an active election, without disclosure, OR seeding a Mayor/VM title that the post-election council vote later changes | Tampering (data integrity) | The roster-currency checkpoint (Pitfall 1/2) is the control here — BOTH the membership question and the separate post-election title-reassignment question must be independently re-verified |

## Sources

### Primary (HIGH confidence — direct live verification in this session)
- `psql` live queries against production Supabase DB (`C:/EV-Accounts/backend/.env` `DATABASE_URL`,
  confirmed reachable 2026-07-16) — ledger MAX (1345) / disk MAX (1353) cross-check, Sahuarita
  government-row absence, `geofence_boundaries` G4110 boundary confirmation (`0462140`), `essentials.
  districts` zero-row gap, external_id collision check (`-4014010..-4014000` = 0 rows),
  `inform.compass_topics` live/judicial counts (44 live / 8 judicial).
- `curl` live queries against `sahuaritaaz.gov` (HTML pages return clean HTTP 200, NOT Akamai-blocked;
  the discovered `/ImageRepository/Document?documentID=6097` image URL returns HTTP 200 with an EMPTY
  body — confirmed with and without a session cookie jar / Referer header).
- `C:/EV-Accounts/backend/migrations/1329_palm_springs_city_council.sql` (read directly this session —
  the directly-reusable template for the rotational-title, no-LOCAL_EXEC office-modeling pattern,
  including its post-verify gate (f) shape for asserting exactly-1-Mayor / exactly-1-Mayor-Pro-Tem).
- `C:/EV-Accounts/backend/migrations/1345_town_of_marana.sql` (read directly in the prior phase's
  research, re-confirmed this session — the shared-LOCAL-row-for-at-large-members DB shape, still
  applicable to Sahuarita's membership question even though its LOCAL_EXEC half does not apply).
- `C:/Transparent Motivations/essentials/src/lib/coverage.js` and `src/lib/buildingImages.js` (read
  directly this session — confirmed the Arizona `COVERAGE_STATES` block currently has 3 entries [Tucson,
  Oro Valley, Marana], and the `CURATED_LOCAL` append pattern).

### Secondary (MEDIUM confidence — WebFetch/WebSearch, cross-verified against each other)
- Sahuarita Town Code Chapter 2.05 (Town Council) and Chapter 2.10 (Mayor and Vice Mayor) —
  `codepublishing.com/AZ/Sahuarita/html/Sahuarita02/` (accessed via WebSearch-summarized excerpt; direct
  `curl`/render was blocked by a Cloudflare JS challenge this session — see Assumption A2) — confirms 7
  elected council members, staggered 4-year terms, Mayor/VM chosen by roll-call vote requiring 4
  affirmative votes.
- Wikipedia, "Sahuarita, Arizona" (WebFetch) — council-manager government structure, explicit statement
  that Mayor/VM "are not directly elected... chosen among elected council members," current roster
  (Murphy, Egbert, Lisk, Lytle, Gillespie, Priolo, Morales).
- `sahuaritaaz.gov/265/Election-Information` and `/274/Town-Council` (WebFetch) — current roster with
  term-expiration years, "One member is chosen as Mayor. One member is chosen as Vice Mayor" confirmation,
  3-seats-up-2026/4-seats-up-2028 staggering, July 21 2026 primary / Nov 3 2026 general dates, Proposition
  420 (General Plan ratification) also on the July 21 ballot.
- WebSearch composites of tucson.com's 2026 election coverage — "6 candidates face off for three seats,"
  Murphy/Morales as incumbents, Egbert's confirmed non-candidacy (running for JP instead), challenger
  names (JD Cubillo, Robin Earl, Chelsea Hundal).
- `gvnews.com` (Green Valley News) — Kara Egbert's JP candidacy confirmation; Diane Priolo's correct name
  spelling and 2022-appointment-then-elected-then-reelected history.
- Ballotpedia candidate-page naming convention (`Tom_Murphy_(Sahuarita_Town_Council_At-large,_Arizona,
  _candidate_2026)`) — independently corroborates the "At-large" election method.
- Wikimedia Commons `Category:Sahuarita, Arizona` (22 files) and `Category:Titan Missile Museum` —
  banner-candidate inventory; individual file pages for `Basgen-fico-groves.jpg` and
  `Bbasgen-sahuarita-lake.JPG` confirm CC BY-SA 3.0 licensing, photographer Brian Basgen, resolutions.
- CitizenPortal.ai / tucsonspotlight.org / kgun9.com coverage of the Copper World (Hudbay) mine proposal,
  Colorado River water concerns, and data-center growth pressure — current (2026) salient local issues
  for stance-research scoping.

### Tertiary (LOW confidence — not deeply used, or genuinely unresolved)
- The 6th candidate name in tucson.com's "6 candidates face off for three seats" headline — not resolved
  this session (Open Question 3); immaterial to the current-roster seeding decision.
- Generic WebSearch results for a directly-elected-Mayor characterization of Sahuarita (the FIRST WebFetch
  of `sahuaritaaz.gov/274/Town-Council` in this session summarized the page as saying "Mayor is elected
  directly by voters," which directly CONTRADICTS the Town Code, Wikipedia, the site's own
  Election-Information page, and a WebSearch composite of tucson.com — CONFIRMED WRONG, retained only as
  a documented pitfall example of a fetch-tool summarization error, not as a source of fact).

## Metadata

**Confidence breakdown:**
- Standard stack / tooling: HIGH — zero new dependencies; SIMPLER than Oro Valley/Marana (no LOCAL_EXEC
  work at all), directly confirmed via DB queries this session.
- Structural DB shape (government/chamber/districts/offices): HIGH — directly DB-verified this session
  (greenfield status, geofence presence, districts-gap, ext_id range), and the election-METHOD finding
  (council-chosen Mayor/VM, no separate office) is cross-verified via 4 independent sources.
- Roster currency: **LOW-MEDIUM, HIGH-URGENCY** — the current 7-person roster and term-expiration years
  are well-corroborated, but the July 21, 2026 primary is only 5 days from this research date, ONE seat
  (Egbert's) is a CONFIRMED open seat, and — uniquely to this phase — even a "no membership change"
  outcome does not resolve who holds the Mayor/Vice-Mayor TITLE, since that is a separate, scheduled
  post-election council vote (Town Code 2.10.010). Treat as requiring an execute-time checkpoint that
  independently re-verifies BOTH the membership and the title assignment.
- Migration numbering / ext_id scheme: HIGH — directly DB-verified this session, including a fresh
  ledger-vs-disk cross-check.
- Stance-topic scope: HIGH — directly DB-verified this session, unchanged from every prior AZ phase.
- Banner mechanism: HIGH (wiring itself, unchanged code) / MEDIUM (2 concrete licensed candidates found;
  the higher-priority pecan-orchard candidate carries a real resolution risk — see Open Question 2).

**Research date:** 2026-07-16
**Valid until:** 30 days for the DB/migration-numbering and structural facts (re-verify ledger/disk MAX
at plan/execute time regardless, per established convention). **Effectively 0-5 days for the
roster-currency facts** — the July 21, 2026 primary is imminent, and the SUBSEQUENT Mayor/Vice-Mayor
council vote (which may land after this phase's likely execute window) is an independent, unresolved
event on top of that. Treat the roster table in the Summary as provisional pending a genuinely
substantive execute-time checkpoint that checks BOTH events explicitly.

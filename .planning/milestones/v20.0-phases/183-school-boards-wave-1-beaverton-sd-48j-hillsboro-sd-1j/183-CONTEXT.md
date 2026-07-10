# Phase 183: School Boards Wave 1 — Beaverton SD 48J + Hillsboro SD 1J - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning

> **Note:** The user selected all four gray areas and answered the first zone-routing question
> (who-votes tie-breaker, recommended option) live. The remaining questions were resolved with the
> **recommended option** because the user was AFK when presented (same handling as the Phase 181/182
> header notes). Each follows established milestone or v10.0/CCSD precedent. Amend before planning
> if a different call is wanted.

<domain>
## Phase Boundary

Seed the two largest west-metro **school boards** to full roster depth: Beaverton SD 48J (geo_id
**4101920**) + Hillsboro SD 1J (geo_id **4100023**) — school-district government + board chamber →
verified roster → 600×750 headshots → **0 compass stances by design** (civic compass is not applied
to school boards) → surface as **search-only** `COVERAGE_SCHOOL_DISTRICTS` entries. Satisfies
**WSCH-01 + WSCH-02**. First non-city phase since 175; the school-board analog of the completed
7-city chain (176–182).

**In scope:**
- 2 school-district governments (nested per the v10.0/CCSD school-district government pattern) on
  the Phase-174-verified G5420 geo_ids — **no geo_id phantom risk this phase**: 4101920 (Beaverton
  SD 48J) and 4100023 (Hillsboro SD 1J) were inserted and smoke-tested in-DB by Phase 174
  (source `tiger_unsd_or_2024_westmetro`). Wave-0 still probes both rows before use.
- 2 board chambers (exact body name **verbatim** from each district site) + seated offices at the
  verified seat count (both districts are commonly described as 7-director boards — verified at
  plan time, never assumed).
- District-type `SCHOOL` districts linked to the G5420 geofences (v10.0 pattern).
- Headshots 600×750 for every seated director; genuine gaps documented.
- **Zero stance rows** — by design, not a gap.
- Surfacing: `COVERAGE_SCHOOL_DISTRICTS` entries in `src/lib/coverage.js` (search-only; **no
  landing-grid chip**; **no `hasContext: true`** — plain entry is the honest state; CCSD template).

**Out of scope:**
- Compass stances for any board member (by design — [[feedback_school_districts_search_only]] +
  CCSD Phase 166 precedent).
- Wave 2 boards: Tigard-Tualatin SD 23J / Forest Grove SD 15 / Sherwood SD 88J (Phase 184).
- 2026 elections + discovery (Phase 185); milestone retrospective/close (Phase 186).
- Superintendents, student representatives, and any non-voting/ex-officio dais seats — elected
  officials only (D-13 lineage).
- Community banners for the districts (D-B1 below).

</domain>

<decisions>
## Implementation Decisions

### Zone routing (discussed — first question answered live, second resolved recommended-AFK)
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 183: School Boards Wave 1" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" (v20.0 block) — deep-seed rules; note the
  banner constraint is city-scoped (D-B1) and the stance unit does NOT apply to school boards.
- `.planning/REQUIREMENTS.md` §"School Boards" — WSCH-01 + WSCH-02 (0 stances by design).

### Phase 174 groundwork (the direct dependency)
- `.planning/phases/174-west-metro-school-district-geofences/174-01-SUMMARY.md` — verified geo_ids
  (Beaverton SD 48J = 4101920, Hillsboro SD 1J = 4100023), source tag
  `tiger_unsd_or_2024_westmetro`, smoke-test coordinates that already route correctly.
- `C:/EV-Accounts/backend/scripts/smoke-or-westmetro-school.ts` — reusable routing assertion
  script (city-hall coordinates per district).

### School-board structural precedent (PRIMARY analogs)
- `C:/EV-Accounts/backend/migrations/1107_ccsd_board_of_trustees.sql` — freshest school-board
  structural migration (v18.0-era conventions).
- `C:/EV-Accounts/backend/migrations/1108_ccsd_trustees_headshots.sql` — freshest school-board
  headshot migration.
- `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` — the OR-specific v10.0 analog:
  6 Multnomah boards in ONE migration; district_type='SCHOOL' + G5420 linkage shape.
- `.planning/phases/166-ccsd-board-of-trustees-deep-seed/` — CCSD research/plan/summary artifacts
  (0-stances-by-design precedent, plain coverage entry, Phase 173 hasContext removal lesson).

### City-chain conventions that transfer (hygiene, not structure)
- `.planning/phases/182-city-of-cornelius-deep-seed/182-CONTEXT.md` — D-16 block: bundle-CONTENT
  deploy verification (never hash), CTE hoist in structural migrations, `git -C C:/EV-Accounts
  status` staged-state check before commits, verify-gates grep whole files (keep
  `slug`/`schema_migrations`/`photo_origin_url` strings out of comments).
- `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py` — freshest headshot script
  template (carries WR-01/WR-02 fixes + transparent-PNG composite-onto-white). School-specific
  reference: `_tmp-ccsd-trustees-headshots.py` / `_tmp-or-school-headshots.py`.

### Surfacing
- `src/lib/coverage.js` — `COVERAGE_SCHOOL_DISTRICTS` (line ~253): CCSD entry
  `{ label, browseGeoId, browseMtfcc: 'G5420', browseStateAbbrev }` is the EXACT template; add
  the two OR districts. Search-only — no landing-grid chip, no `hasContext`
  ([[feedback_school_districts_search_only]]).
- `src/lib/groupHierarchy.js` — Rule 3.5 chamber_name fallback already handles school-board card
  subtitles (v10.0 Phase 88 fix); no frontend changes expected.

### Schema (unchanged from city chain)
- `essentials.governments` (WHERE NOT EXISTS — no geo_id unique constraint) /
  `essentials.chambers` (official_count; **slug GENERATED — never INSERT**) /
  `essentials.offices` / `essentials.politician_images` (id, politician_id, url, type,
  photo_license — **NO photo_origin_url column**).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **G5420 geofences already live and smoke-tested** (Phase 174) — this phase links to them; no
  geofence work unless the D-Z1 zone-voted branch fires with an official GIS source.
- CCSD migrations 1107/1108 + Multnomah migration 254 — adaptable school-board templates.
- Headshot pipeline scripts: `_tmp-cornelius-headshots.py` (freshest fixes) +
  `_tmp-ccsd-trustees-headshots.py` (school-specific shape).
- `COVERAGE_SCHOOL_DISTRICTS` + `coverageAreaLink()` already render search-only school-district
  browse entries (`browse_geo_id` + `browse_mtfcc=G5420`) — surfacing is a 2-entry array add.

### Established Patterns
- **Executor/orchestrator split:** gsd-executor writes `.sql`/`.py`; inline orchestrator runs DB
  probes, applies migrations via `psql -f` with `C:/EV-Accounts/backend/.env` DATABASE_URL
  (executor has NO DB), runs headshot scripts, runs audits.
- Structural migrations register in `schema_migrations`; headshot migrations audit-only; on-disk
  counter authoritative (next = **1203**, Wave-0 re-confirms).
- Section-split scan (0 rows) after seeding ([[feedback_section_split_check]]); antipartisan
  (party never displayed).
- Same-session live verification (179–182 pattern): push → Render deploy (verify by bundle
  CONTENT grep, not hash) → Playwright verify → close UAT in-session. Frontend delta this phase
  is coverage.js only.

### Integration Points
- Backend `/representatives/me` PIP resolution: board members resolve via the G5420 geofence →
  district_type='SCHOOL' districts → offices. Confirm `districts.state` casing matches what the
  backend school-tier query expects (v10.0 precedent rows are the ground truth — probe them).
- Browse link shape at completion:
  `essentials.empowered.vote/results?browse_geo_id=4101920&browse_mtfcc=G5420` (Beaverton SD) and
  `...browse_geo_id=4100023&browse_mtfcc=G5420` (Hillsboro SD)
  ([[feedback_provide_city_browse_links]] — G5420 variant).

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Beaverton address returns the correct Beaverton SD 48J board
  member; a Hillsboro address returns the correct Hillsboro SD 1J board member (Phase 174 smoke
  coordinates reusable).
- 0 stance rows is the SUCCESS state — any stance row for a school-board member is a defect.
- Plain coverage entries (no `hasContext`) are the honest state — the Phase 173 CCSD
  chip-reconciliation lesson, applied from the start this time.
- School-board cards must show the board name as subtitle (groupHierarchy Rule 3.5 — verify it
  fires for the two new chambers during live verification).
- Tailwind/Render hygiene: no raw Windows backslash paths in committed files
  ([[feedback_tailwind_scans_planning_md]]).

</specifics>

<deferred>
## Deferred Ideas

- Wave 2 school boards (Tigard-Tualatin/Forest Grove/Sherwood) — Phase 184, same shape as this
  phase; carry any 183 lessons forward.
- 2026 school-board election races + discovery for these districts — Phase 185.
- **District banners** — if school-district browse should ever get licensed banner art (like the
  city banners), that's a new capability for a future phase/backlog; D-B1 ships plain.
- Superintendent/staff/student-rep representation — out of scope by design (not elected).

### Reviewed Todos (not folded)
None — no pending todos matched this phase (todo.match-phase returned 0).

</deferred>

---

*Phase: 183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j*
*Context gathered: 2026-07-03*

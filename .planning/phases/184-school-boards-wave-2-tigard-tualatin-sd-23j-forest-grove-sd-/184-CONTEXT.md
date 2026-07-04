# Phase 184: School Boards Wave 2 — Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning

> **Note:** The user was AFK for this discussion (both the phase-selection and gray-area questions
> timed out). All four gray areas were resolved with the **recommended option**, the same handling
> documented in the Phase 181/182/183 CONTEXT headers. Every recommendation is either a decision
> carried forward verbatim from Phase 183 (the same-shape Wave-1 clone source) or a fix the
> Phase 183 code review explicitly queued for this phase. Amend before planning if a different
> call is wanted. The phase was invoked as `/gsd-discuss-phase 14 --chain` — "14" resolved to
> **184** (School Boards Wave 2), the only pending discussable phase and the explicit next step
> recorded in STATE.md (`stopped_at: Phase 183 complete — ready to discuss Phase 184`).

<domain>
## Phase Boundary

Seed the three remaining west-metro **school boards** to full roster depth: Tigard-Tualatin SD 23J
(geo_id **4112240**) + Forest Grove SD 15 (geo_id **4105160**) + Sherwood SD 88J (geo_id
**4111290**) — school-district government + board chamber → verified roster → 600×750 headshots →
**0 compass stances by design** → surface as **search-only** `COVERAGE_SCHOOL_DISTRICTS` entries.
Satisfies **WSCH-03 + WSCH-04 + WSCH-05**. This is an explicit same-shape clone of completed
Phase 183 (Beaverton SD 48J + Hillsboro SD 1J), extended from 2 districts to 3 and carrying the
three latent template fixes from 183-REVIEW.md.

**In scope:**
- 3 school-district governments (v10.0/CCSD nested school-district government pattern) on the
  Phase-174-verified G5420 geo_ids — **no geo_id phantom risk**: 4112240 (Tigard-Tualatin SD 23J),
  4105160 (Forest Grove SD 15), 4111290 (Sherwood SD 88J) were inserted and smoke-tested in-DB by
  Phase 174 (source `tiger_unsd_or_2024_westmetro`). Wave-0 still probes all three rows before use.
- 3 board chambers (exact body name **verbatim** from each district site — Wave 1 proved these
  differ per district: Beaverton 'School Board' vs Hillsboro 'Board of Directors') + seated offices
  at the verified seat count (Oregon boards are commonly 7-director — verified at plan time, never
  assumed).
- District-type `SCHOOL` districts linked to the G5420 geofences (v10.0 pattern).
- Headshots 600×750 for every seated director; genuine gaps documented.
- **Zero stance rows** — by design, not a gap.
- Surfacing: 3 `COVERAGE_SCHOOL_DISTRICTS` entries in `src/lib/coverage.js` (search-only; **no
  landing-grid chip**; **no `hasContext: true`** — plain entry is the honest state; the CCSD +
  Wave-1 entries at coverage.js:253-257 are the exact template).

**Out of scope:**
- Compass stances for any board member (by design — [[feedback_school_districts_search_only]] +
  CCSD Phase 166 precedent).
- 2026 elections + discovery (Phase 185); milestone retrospective/close (Phase 186).
- Superintendents, student representatives, and any non-voting/ex-officio dais seats — elected
  officials only (D-13 lineage).
- Community banners for the districts (D-B1, carried from 183).

</domain>

<decisions>
## Implementation Decisions

### Wave-1 template fixes (discussed — recommended, AFK; explicitly queued for this phase by 183-REVIEW.md)
- **D-F1: Apply all three 183-REVIEW Warnings in the 184 migration clones — do NOT clone 1203/1205
  verbatim.** These are latent re-run/clone defects "exactly the class that bites the next
  same-shape district seed" (183-REVIEW.md):
  - **WR-01 fix:** resolve the politician id via a `pol AS (SELECT id FROM ins_p UNION SELECT id
    FROM politicians WHERE external_id = …)` CTE and join the office INSERT to `pol`, making the
    office `NOT EXISTS` guard live and each block genuinely idempotent/self-healing.
  - **WR-02 fix:** the structural post-verify DO block additionally asserts `chamber_id IS NOT
    NULL` for all seeded offices (guards against chamber-name string drift between the Step-2
    INSERT and the per-block scalar subquery — the realistic clone failure).
  - **WR-03 fix:** headshot INSERTs use `INSERT … SELECT gen_random_uuid(), p.id, … FROM
    politicians p WHERE p.external_id = … AND NOT EXISTS (…)` so a missing politician skips the
    block instead of degrading to a `politician_id = NULL` attempt.
- **D-F2: Fold in the Info-level template nits** where the artifacts are reused: IN-01 (ETL .env
  parser strips surrounding quotes and optional `export `), IN-02 (dimension comments state actual
  downloaded payload dims from the run log, not CDN filename dims), IN-03 (probe ledger comment
  names the real headshot migration number; ext-id probe ranges get genuine margin on BOTH bounds),
  IN-04 (verify each geo-derived ext-id block stays within its decade — all three 7-seat blocks do;
  probe confirms no collisions).

### Migration granularity (discussed — recommended, AFK)
- **D-P1 (carried from 183): Single shared plan-set covering all three districts** — the v10.0
  shape (migration 254 held 6 Multnomah boards in one file; 1203 held both Wave-1 boards).
  Expected shape: Wave-0 probes → structural (all 3 boards, one migration) → headshots (all 3
  boards) → surfacing + full E2E. No stances plan, no banner plan — a ~4-plan phase mirroring
  183's plan-set. Planner may split the structural migration per district if cleaner; one file is
  equally acceptable.

### Zone routing × 3 (discussed — recommended, AFK; carried verbatim from 183 D-Z1/D-Z2)
- **D-Z1 (carried): WHO VOTES decides routing, not residency.** Verified from each district's
  official election rules at plan time, never assumed:
  - Zone voters alone elect their director → sub-zone geofences required before seeding.
  - Whole district votes for every position (zones/positions = residency requirement only, the
    common Oregon ORS 332.118 shape; both Wave-1 boards landed here) → single G5420 district,
    whole-board modeling, no new geofences.
  - All three districts get the same verification; Wave 1 re-confirmed the at-large branch for
    both its boards (the D-Z1 zone branch did NOT fire), but that is evidence, not proof, for
    Wave 2.
- **D-Z2 (carried): Whole-district fallback if zone-voted with no official GIS** — if a board is
  confirmed zone-VOTED but no official machine-readable zone boundary exists, seed on the single
  G5420 geofence with the zone structure documented as a known modeling caveat (research +
  summary + Phase 186 retrospective). **Never hand-trace boundaries.** Success criteria are
  district-level, so this stays honest.

### Roster + headshots (discussed — recommended, AFK; carried verbatim from 183 D-R1..R5)
- **D-R1 (carried): Ground-truth roster + exact body name verbatim** from each district's
  official site at plan time (researcher confirms live domains — likely ttsdschools.org /
  fgsd.k12.or.us / sherwood.k12.or.us, verified not assumed). No hardcoding names, seat counts,
  or position naming from memory; account for May-2025 Oregon school-board election turnover.
  Researcher notes **WAF status AND photo availability** per district site.
- **D-R2 (carried): Office title per district convention** — verbatim from the district site
  (Wave 1 shipped 'Director, Zone N' for Beaverton and 'Director, Position N' for Hillsboro);
  keep each district's own numbering on the office title. Never assume "Board Member."
- **D-R3 (carried): Chair / Vice Chair = title-on-seat** if the district designates one; no
  separate LOCAL_EXEC-style row, no extra chamber.
- **D-R4 (carried): Non-voting seats EXCLUDED** (superintendents, student reps). Vacancies
  documented (Cornelius TX-23 style), **never a placeholder person**; very recent appointees
  count if confirmed on the official district site.
- **D-R5 (carried + Wave-1 lesson): Headshots** — official district site first, then the standing
  fallback chain. **Finalsite trap:** if a Wave-2 district site is finalsite-hosted (both Wave-1
  sites were), fetch the UNTRANSFORMED original asset URLs — the `t_image_size_6` transform
  variant is an upscale trap ([[project_phase183_complete]]). Crop-to-4:5 FIRST then 600×750
  Lanczos q90; circle-cutout PNGs get the inscribed-crop treatment; transparent PNGs composite
  onto white. Mirror to Storage `politician_photos/{uuid}-headshot.jpg`; `photo_license` by
  actual source. Genuine gaps documented, no fabrication.

### Banner treatment (carried from 183 — not re-asked)
- **D-B1 (carried): No community banner for school districts.** The licensed-banner constraint is
  city-scoped; district browse inherits the default banner behavior. No `buildingImages.js` work.

### Claude's Discretion
- **External_id blocks** — geo_id-derived analogs subject to Wave-0 probe verification:
  -4112241.. (Tigard-Tualatin SD), -4105161.. (Forest Grove SD), -4111291.. (Sherwood SD). All
  three 7-seat blocks stay inside their decade (IN-04 awareness); probe ranges get margin on both
  bounds (IN-03).
- **Next migration number** — memory records on-disk MAX at 1205 after Phase 183 (1204 was taken
  by the AZ workstream — filename collisions are real), so next is expected **1206**. Wave-0
  re-confirms on disk; on-disk counter authoritative; DB ledger MAX is a known trap.
- **Structural migration granularity** — one file for all three vs per-district (D-P1).
- **Government naming** — follow 1203's naming (which followed 1107/254); researcher confirms
  what renders well in browse.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirement + milestone conventions
- `.planning/ROADMAP.md` §"Phase 184: School Boards Wave 2" — goal + 4 success criteria.
- `.planning/ROADMAP.md` §"Milestone-wide conventions" (v20.0 block) — deep-seed rules; banner
  constraint is city-scoped; the stance unit does NOT apply to school boards.
- `.planning/REQUIREMENTS.md` §"School Boards" — WSCH-03 + WSCH-04 + WSCH-05 (0 stances by design).

### Phase 183 — the direct template (PRIMARY analogs; read before anything else)
- `.planning/phases/183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j/183-REVIEW.md` —
  **WR-01/WR-02/WR-03 Warning fixes + IN-01..IN-04 nits that THIS phase must bake into its
  clones** (D-F1/D-F2). The fix SQL is written out verbatim in the review.
- `.planning/phases/183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j/183-CONTEXT.md` —
  the decision lineage this context carries forward (D-Z1/Z2, D-B1, D-P1, D-R1..R5).
- `.planning/phases/183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j/183-PATTERNS.md` —
  file-by-file pattern map with exact analog line refs (migration blocks, ETL script shape,
  probe shape, coverage entry).
- `.planning/phases/183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j/183-0{1,2,3,4}-SUMMARY.md`
  — what actually shipped per wave, incl. the finalsite untransformed-originals sourcing and the
  1204→1205 filename-collision handling.
- `C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql` — freshest
  school-board structural migration (clone WITH the WR-01/WR-02 fixes applied).
- `C:/EV-Accounts/backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql` —
  freshest school-board headshot migration (clone WITH the WR-03 fix applied).
- `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py` — freshest headshot
  ETL (14-official school shape; WR-01/02/C script fixes; SUPABASE_URL-derived CDN base; apply
  the IN-01 .env-parser nit).
- `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-probe.sql` — Wave-0 probe template
  (apply IN-03 comment/margin nits).

### Phase 174 groundwork (the direct dependency)
- `.planning/phases/174-west-metro-school-district-geofences/174-01-SUMMARY.md` — verified geo_ids
  (Tigard-Tualatin SD 23J = 4112240, Forest Grove SD 15 = 4105160, Sherwood SD 88J = 4111290),
  source tag `tiger_unsd_or_2024_westmetro`, smoke-test coordinates that already route correctly.
- `C:/EV-Accounts/backend/scripts/smoke-or-westmetro-school.ts` — reusable routing assertion
  script (already covers all 5 districts' test coordinates).

### Older school-board precedent (secondary)
- `C:/EV-Accounts/backend/migrations/1107_ccsd_board_of_trustees.sql` +
  `1108_ccsd_trustees_headshots.sql` — CCSD conventions.
- `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` — v10.0 OR shape: 6 Multnomah
  boards in ONE migration; district_type='SCHOOL' + G5420 linkage.
- `.planning/phases/166-ccsd-board-of-trustees-deep-seed/` — 0-stances-by-design precedent.

### City-chain hygiene that transfers
- `.planning/phases/182-city-of-cornelius-deep-seed/182-CONTEXT.md` — D-16 block: bundle-CONTENT
  deploy verification (never hash), CTE hoist, `git -C C:/EV-Accounts status` staged-state check
  before commits, verify-gates grep whole files (keep `slug`/`schema_migrations` strings out of
  comments).

### Surfacing
- `src/lib/coverage.js` — `COVERAGE_SCHOOL_DISTRICTS` (line ~253): CCSD + Beaverton SD +
  Hillsboro SD entries are the EXACT template; append the three Wave-2 districts. Search-only —
  no landing-grid chip, no `hasContext` ([[feedback_school_districts_search_only]]).
- `src/lib/groupHierarchy.js` — Rule 3.5 chamber_name fallback handles school-board card
  subtitles; no frontend changes expected beyond coverage.js.

### Schema (unchanged)
- `essentials.governments` (WHERE NOT EXISTS — no geo_id unique constraint) /
  `essentials.chambers` (official_count; **slug GENERATED — never INSERT**) /
  `essentials.offices` / `essentials.politician_images` (id, politician_id, url, type,
  photo_license — **NO photo_origin_url column**).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **All 3 G5420 geofences already live and smoke-tested** (Phase 174) — this phase links to them;
  no geofence work unless the D-Z1 zone-voted branch fires with an official GIS source.
- Migrations 1203/1205 + ETL `_tmp-westmetro-school-wave1-headshots.py` — the freshest same-shape
  templates, one phase old; clone with D-F1/D-F2 fixes.
- `COVERAGE_SCHOOL_DISTRICTS` + `coverageAreaLink()` already render search-only school-district
  browse entries — surfacing is a 3-entry array append.

### Established Patterns
- **Executor/orchestrator split:** gsd-executor writes `.sql`/`.py`; inline orchestrator runs DB
  probes, applies migrations via `psql -f` with `C:/EV-Accounts/backend/.env` DATABASE_URL
  (executor has NO DB), runs headshot scripts, runs audits.
- Structural migrations register in `schema_migrations`; headshot migrations audit-only; on-disk
  counter authoritative (expected next = **1206**; Wave-0 re-confirms and probes for filename
  collisions — 1204 was consumed by another workstream mid-Phase-183).
- Section-split scan (0 rows) after seeding ([[feedback_section_split_check]]); antipartisan
  (party never displayed).
- Same-session live verification (179–183 pattern): push → Render deploy (verify by bundle
  CONTENT grep, not hash) → Playwright live browse of all three G5420 links → close UAT
  in-session. Frontend delta this phase is coverage.js only.

### Integration Points
- Backend `/representatives/me` PIP resolution: board members resolve via G5420 geofence →
  district_type='SCHOOL' districts → offices. `districts.state` casing = lowercase 'or'
  (Wave-1 rows are the ground truth — probe them).
- Browse links at completion ([[feedback_provide_city_browse_links]], G5420 variant):
  `essentials.empowered.vote/results?browse_geo_id=4112240&browse_mtfcc=G5420` (Tigard-Tualatin),
  `...browse_geo_id=4105160&browse_mtfcc=G5420` (Forest Grove),
  `...browse_geo_id=4111290&browse_mtfcc=G5420` (Sherwood).

</code_context>

<specifics>
## Specific Ideas

- Headline correctness check: a Tigard/Tualatin address returns the correct TTSD 23J board member;
  a Forest Grove address the correct FGSD 15 member; a Sherwood address the correct SSD 88J
  member (Phase 174 smoke coordinates reusable).
- 0 stance rows is the SUCCESS state — any stance row for a school-board member is a defect.
- Plain coverage entries (no `hasContext`) are the honest state from the start.
- School-board cards must show the board name as subtitle (groupHierarchy Rule 3.5 — verify it
  fires for the three new chambers during live verification).
- Tailwind/Render hygiene: no raw Windows backslash paths in committed files
  ([[feedback_tailwind_scans_planning_md]]).
- Tigard-Tualatin SD 23J spans TWO of the completed city seeds (Tigard 178 + Tualatin 179) — a
  single district serving both cities; nothing structural changes, but live verification should
  use one address from each city.

</specifics>

<deferred>
## Deferred Ideas

- 2026 school-board election races + discovery for these districts — Phase 185.
- Milestone retrospective / coverage reconciliation / GOTCHAs — Phase 186.
- **District banners** — if school-district browse ever gets licensed banner art, that is a new
  capability for a future phase/backlog; D-B1 ships plain.
- **Ext-id scheme headroom redesign** (e.g., geo_id × 100 offsets so blocks never cross decade
  boundaries — 183-REVIEW IN-04) — only worth doing if a >9-seat roster ever appears; not this
  phase.
- Superintendent/staff/student-rep representation — out of scope by design (not elected).

### Reviewed Todos (not folded)
None — no pending todos matched this phase (todo.match-phase returned 0).

</deferred>

---

*Phase: 184-school-boards-wave-2-tigard-tualatin-sd-23j-forest-grove-sd-*
*Context gathered: 2026-07-04*

---
phase: 182-city-of-cornelius-deep-seed
plan: 01
subsystem: database
tags: [postgres, supabase, migrations, sql, oregon, cornelius]

# Dependency graph
requires:
  - phase: 181-city-of-sherwood-deep-seed
    provides: on-disk migration counter state (MAX 1195), WashCo deep-seed playbook pattern, _tmp-sherwood-wave0-probe.sql structural analog
provides:
  - "_tmp-cornelius-wave0-probe.sql — labeled SELECT probes A-G for the orchestrator to run against production before any structural write"
  - "Wave-0 gate scaffolding for plans 02-05 (geo_id correction, greenfield check, ext_id block, migration counter, topic list, roster, headshot availability, banner)"
affects: [182-02-city-of-cornelius-deep-seed, 182-03-city-of-cornelius-deep-seed, 182-04-city-of-cornelius-deep-seed, 182-05-city-of-cornelius-deep-seed]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "geofence-existence-AND-name-match probe (not existence alone) — required whenever a stated geo_id could silently resolve to a different real city"

key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/_tmp-cornelius-wave0-probe.sql (separate repo, gitignored, NOT committed)"
  modified: []

key-decisions:
  - "Probe A/A2/A3 assert geo_id 4115550 name-matches 'Cornelius city' AND that the ROADMAP/CONTEXT-stated 4115350 resolves to 'Coquille city' (a different real city) — existence-only checks are insufficient for this phase"
  - "Ext_id collision probe widened to margin -4115560..-4115540 around the target block -4115551..-4115555, plus a name-based scan (including both 'López' and 'Lopez' spellings for the accented name)"
  - "Migration counter probe reads the ledger MAX for cross-check only — on-disk `ls` of the migrations directory is authoritative per the milestone's known ledger-trap pattern (research snapshot: on-disk MAX 1195 -> next 1196; ledger MAX 1187)"
  - "Probe G omits a hardcoded 'EXPECT N' topic count (unlike the Sherwood analog) because 182-RESEARCH.md did not capture an explicit live-topic-count snapshot for this phase — the orchestrator records the actual count for plan 04"

patterns-established:
  - "Wave-0 probe file authored by the executor (no DB/web access); orchestrator (main context) executes the probes, re-fetches the roster, re-downloads headshots, and views the banner candidate — checkpoint gate blocks plans 02-05 until all gates pass"

requirements-completed: []  # WASH-08 spans plans 01-05; this plan only authors and stages the Wave-0 gate. Full WASH-08 completion belongs to plan 05 / phase close.

# Metrics
duration: 25min
completed: 2026-07-04
---

# Phase 182 Plan 01: City of Cornelius Wave-0 Verification Probe Summary

**Authored and PASSED the Wave-0 gate for the Cornelius deep-seed: probe file `_tmp-cornelius-wave0-probe.sql` (probes A-G) confirmed geo_id 4115550 name-matches 'Cornelius city' while the ROADMAP-stated 4115350 is the Coquille-city trap; greenfield + free ext_id block + next migration 1196 + 44 live topics (8 judicial skipped) + unchanged 4-filled/1-vacant roster + 4/4 headshots re-downloaded + banner crop viewed — all gates verified by the orchestrator; vacant-seat modeling recorded as option (a) TX-23 NULL-politician office row, official_count=5.**

## Performance

- **Duration:** 25 min (executor authoring + orchestrator Task 2 verification round-trip)
- **Started:** 2026-07-04T01:56:00Z
- **Completed:** 2026-07-04T02:21:00Z
- **Tasks:** 2 of 2 completed (Task 2 checkpoint executed by orchestrator and approved 2026-07-03)
- **Files modified:** 1 (outside this worktree's repo)

## Accomplishments
- Authored `C:/EV-Accounts/backend/scripts/_tmp-cornelius-wave0-probe.sql` with all 7 labeled probe groups (A through G), matching the Task 1 acceptance criteria exactly:
  - **Probe A/A2/A3** — geo_id 4115550 (G4110) name-match to 'Cornelius city'; geo_id 4115350 (G4110) confirmed-as-trap to 'Coquille city'; authoritative name-search fallback.
  - **Probe B** — districts count on geo_id 4115550 (greenfield check, expect 0).
  - **Probe C** — governments by geo_id OR name ILIKE '%cornelius%' (greenfield check, expect 0).
  - **Probe D1/D2** — ext_id range -4115560..-4115540 collision scan + name-based scan for Dalin/Godinez Valencia/Baker/López (both accented and unaccented spellings).
  - **Probe E** — ledger MAX(version::bigint) migration counter (cross-checked by orchestrator against on-disk `ls`).
  - **Probe F** — districts.state casing on Portland (geo_id 4159000), expect lowercase 'or'.
  - **Probe G1/G2/G3** — live compass topic_key list, live topic count, live judicial-* topic count.
- File contains only SELECT/\echo statements — no DDL, no transaction wrapper — per the plan's explicit constraint.
- Verified no forbidden literal strings (`slug`, `schema_migrations` outside Probe E's genuine query, `photo_origin_url`) were introduced per the plan's "VERIFY-GATE HYGIENE" note.

## Task Commits

This plan has no in-worktree code commits for Task 1: the plan's sole artifact (`_tmp-cornelius-wave0-probe.sql`) is authored in a separate git repository (`C:/EV-Accounts`) and is gitignored there under the `_tmp-*` convention (per the plan's explicit "do NOT commit it" instruction). No files inside this worktree were created or modified by Task 1.

**Plan metadata:** SUMMARY.md commit (this file) — see commit hash in final response.

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/_tmp-cornelius-wave0-probe.sql` — Wave-0 verification probe file (separate repo, not committed; gitignored `_tmp-*` helper)

## Decisions Made
- Followed the `_tmp-sherwood-wave0-probe.sql` structural analog exactly (probe labeling shape, \echo conventions, no-transaction constraint), adapting literal values per 182-RESEARCH.md.
- Widened Probe D1's ext_id range to the plan-specified margin (-4115560..-4115540) rather than the tighter target block, matching the plan's explicit acceptance criterion.
- Included both accented ("López") and unaccented ("Lopez") name variants in Probe D2's ILIKE ANY array, anticipating potential encoding/search mismatches for the milestone's first UTF-8 accented officeholder name.
- Did not hardcode an expected live-topic count in Probe G (the Sherwood analog hardcodes "EXPECT 44") because 182-RESEARCH.md contains no explicit topic-count snapshot for this phase; the orchestrator will record the actual observed count when it runs the probe.

## Wave-0 Results

Task 2 checkpoint executed by the orchestrator and approved. Results recorded verbatim below.

WAVE-0 RESULTS (recorded by orchestrator, 2026-07-03):

DB probes (psql -f _tmp-cornelius-wave0-probe.sql against production):
- PROBE A1: geo_id 4115550 + G4110 → exactly 1 row, name='Cornelius city' ✓ (CORRECTED value CONFIRMED)
- PROBE A2: geo_id 4115350 + G4110 → 1 row, name='Coquille city' ✓ (trap value confirmed WRONG — must never be used)
- PROBE A3: name ILIKE cornelius + G4110 → exactly 1 row: Cornelius city @ 4115550 ✓
- PROBE B: districts on 4115550 → 0 ✓ (greenfield)
- PROBE C: City of Cornelius government rows → 0 ✓ (greenfield)
- PROBE D1: ext_id block -4115560..-4115540 → 0 rows ✓ (block -4115551..-4115555 FREE)
- PROBE D2: broad name scan noisy (many unrelated Lopez/campaign-committee rows); precise follow-up query for the 4 roster identities (Dalin, Godinez, Edgar Baker, Edén López) → 0 matching politicians ✓
- PROBE E: DB ledger MAX = 1187 (known trap); on-disk ls migrations MAX = 1195 (1195_standke_stances.sql) → NEXT STRUCTURAL MIGRATION = 1196 ✓
- PROBE F: districts.state on Portland 4159000 → 'or' lowercase ✓
- PROBE G: 44 live compass topics; 8 judicial-prefixed (skipped for city officials) → non-judicial researchable pool = 36 ✓

Roster re-fetch (curl https://www.corneliusor.gov/267/City-Council, HTTP 200, no WAF):
- Mayor Jeffrey Dalin ✓, Angeles Godinez Valencia ✓, City Councilor Edgar Baker ✓, Edén López (HTML-entity encoded Ed&#233;n L&#243;pez) ✓, plus "Vacant Position" with live text "vacant City Council position. The application period" — vacancy still open, roster UNCHANGED from research ✓
- Citlalli Nuñez-Barragán NOT on the page ✓ (pitfall guard holds)

Headshot re-download (all 4 ImageRepository documentIDs):
- 2325 (Dalin): HTTP 200, image/png, 4,971,190 bytes, 1600×2000 RGBA ✓
- 1977 (Godinez Valencia): HTTP 200, image/png, 5,180,513 bytes, 1600×2000 RGBA ✓
- 2324 (Baker): HTTP 200, image/png, 4,876,323 bytes, 1600×2000 RGBA ✓
- 1979 (López): HTTP 200, image/png, 4,431,614 bytes, 1600×2000 RGBA ✓
- All exact 4:5 ratio, RGBA transparent — composite-onto-white then straight resize to 600×750, no crop judgment needed ✓

Banner candidate viewed at 3.15:1 crop:
- "Cornelius Civic Center - Oregon.JPG" (Wikimedia Commons, CC BY-SA 3.0, M.O. Stevens) native 1679×1412; center band 1679×533 → 1700×540 renders acceptably: "Cornelius Civic Center" sign legible, entrance visible. Workable as the leading candidate; final anchor choice + operator presentation happens in plan 182-05 per D-14 (post-hoc swap precedent applies).

VACANT-SEAT MODELING DECISION (recorded, auto-mode recommended option): OPTION (a) — seed the 5th office row per the TX-23 precedent (migrations/105): politician_id=NULL, is_vacant=true, NO politician row, official_count=5 (Charter §7 designed seat count). Plans 02+ proceed on this basis.

## Deviations from Plan

None — plan executed exactly as written. Task 1 authored the probe file per spec; Task 2 (an explicit `checkpoint:human-verify`, `gate="blocking"`) was executed by the inline orchestrator per the plan's stated execution architecture ("The gsd-executor WRITES the `.sql` probe file only... The INLINE ORCHESTRATOR (main context) runs the probes...") and approved with all gates passing.

## Issues Encountered
- 182-PATTERNS.md (referenced in the plan's `<read_first>` list) does not exist on disk in this worktree — only 182-RESEARCH.md, 182-CONTEXT.md, 182-DISCUSSION-LOG.md, and 182-VALIDATION.md are present alongside the 5 plan files. Proceeded using 182-RESEARCH.md's directly-referenced sections (all of which exist and are substantive) plus the `_tmp-sherwood-wave0-probe.sql` / 181-01-PLAN.md analogs, which together fully cover the probe-authoring requirements. No functional impact — all literal values (geo_id 4115550/4115350, ext_id block, migration numbers, roster names) came from 182-RESEARCH.md's own verified sections, not from the missing PATTERNS file.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**ALL WAVE-0 GATES PASSED — plans 02-05 are unblocked.** Confirmed values downstream plans must use:

- **geo_id:** `4115550` ('Cornelius city', G4110). NEVER `4115350` (Coquille city — the trap).
- **Greenfield:** confirmed — 0 districts, 0 government rows, 0 legacy politician rows by name.
- **Ext_id block:** `-4115551..-4115555` FREE (probed with margin). `-4115555` intentionally UNUSED (vacant seat).
- **Next structural migration:** `1196` (on-disk MAX 1195; ledger MAX 1187 confirmed as the trap).
- **districts.state casing:** lowercase `'or'` for LOCAL/LOCAL_EXEC rows.
- **Compass topics (plan 04):** 44 live; 8 judicial-* skipped (council-manager form) → 36 researchable.
- **Roster (plan 02):** Mayor Jeffrey C. Dalin (ELECTED, 2-year term §25), Angeles Godinez Valencia (ELECTED, Council President title-on-seat), Edgar Baker (APPOINTED, is_appointed=true), Edén López (APPOINTED, is_appointed=true; UTF-8 accented name — save migration file UTF-8 no BOM), 5th seat VACANT (window closes 2026-07-22, unchanged). Citlalli Nuñez-Barragán NOT on roster.
- **Vacant-seat modeling (plan 02):** OPTION (a) — TX-23 precedent (migrations/105): office row with politician_id=NULL, is_vacant=true, no politician row, official_count=5.
- **Headshots (plan 03):** 4/4 re-confirmed HTTP 200, 1600×2000 RGBA transparent PNG (documentIDs 2325/1977/2324/1979) — composite onto white FIRST, then straight Lanczos resize to 600×750, NO crop step needed.
- **Banner (plan 05):** "Cornelius Civic Center - Oregon.JPG" (CC BY-SA 3.0, M.O. Stevens) center-band 1679×533 → 1700×540 crop renders acceptably (sign legible, entrance visible); leading candidate, final anchor call + operator presentation in plan 05 per D-14.
- **Structural shape (plan 02):** pure at-large, plain 'Mayor'/'Councilor' titles, LOCAL_EXEC Mayor + LOCAL at-large councilor district on geo_id 4115550, no wards/X00xx geofences.

---
*Phase: 182-city-of-cornelius-deep-seed*
*Completed: 2026-07-04 — all Wave-0 gates passed, orchestrator-approved*

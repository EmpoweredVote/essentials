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
duration: 15min
completed: 2026-07-04
---

# Phase 182 Plan 01: City of Cornelius Wave-0 Verification Probe Summary

**Authored the Wave-0 SQL probe file (`_tmp-cornelius-wave0-probe.sql`, probes A-G) that gates the entire Cornelius deep-seed on a geofence-existence-AND-name-match check — the ROADMAP-stated geo_id 4115350 exists but resolves to a different real city (Coquille), so this probe is the highest-risk gate in the milestone; plan execution now STOPS at the mandatory `checkpoint:human-verify` (Task 2), which requires the orchestrator's own DB, web, and image-viewing access that this worktree executor does not have.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-04T01:56:00Z
- **Completed:** 2026-07-04T02:11:00Z
- **Tasks:** 1 of 2 completed (Task 2 is a blocking checkpoint requiring orchestrator action)
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

## Deviations from Plan

None — plan executed exactly as written for Task 1. Task 2 is an explicit `checkpoint:human-verify` gate (`gate="blocking"`) that the plan's own `<context>` section states is out of scope for the gsd-executor: "The gsd-executor WRITES the `.sql` probe file only. It has NO database access, NO WebSearch, and NO Supabase MCP. The INLINE ORCHESTRATOR (main context) runs the probes..." This executor has no tools to perform the DB query execution, live roster re-fetch, headshot re-download, or banner-image viewing required by Task 2's `<how-to-verify>` steps — so execution correctly stops here rather than fabricating verification results.

## Issues Encountered
- 182-PATTERNS.md (referenced in the plan's `<read_first>` list) does not exist on disk in this worktree — only 182-RESEARCH.md, 182-CONTEXT.md, 182-DISCUSSION-LOG.md, and 182-VALIDATION.md are present alongside the 5 plan files. Proceeded using 182-RESEARCH.md's directly-referenced sections (all of which exist and are substantive) plus the `_tmp-sherwood-wave0-probe.sql` / 181-01-PLAN.md analogs, which together fully cover the probe-authoring requirements. No functional impact — all literal values (geo_id 4115550/4115350, ext_id block, migration numbers, roster names) came from 182-RESEARCH.md's own verified sections, not from the missing PATTERNS file.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**BLOCKED at checkpoint.** Task 2 of this plan requires the orchestrator (main context, with DATABASE_URL/psql access, WebSearch/WebFetch, and image-viewing capability) to:

1. Run `psql "$DATABASE_URL" -f C:/EV-Accounts/backend/scripts/_tmp-cornelius-wave0-probe.sql` and confirm all 7 probe gates (A-G) return their expected results — most critically, that Probe A1 returns `name='Cornelius city'` for geo_id 4115550 and Probe A2 returns `name='Coquille city'` (NOT Cornelius) for the trap value 4115350.
2. Re-fetch the live roster from `corneliusor.gov/267/City-Council` + 4 individual bio pages, with special attention to whether the 5th (vacant) seat has been filled since research (application window closes 2026-07-22) and whether Baker/López still show appointed-only (not elected) bio entries.
3. Re-download the 4 filled-seat headshot ImageRepository URLs (documentIDs 2325/1977/2324/1979) and confirm HTTP 200 / 1600×2000 / transparent RGBA PNG; re-confirm documentID=1975 (vacant seat's leftover image) is blank.
4. Confirm the pure-at-large / directly-elected-2-year-Mayor / plain-title / council-manager-judicial-skip structural decision holds.
5. Record the vacant-seat modeling decision (default option (a): TX-23 NULL-politician office row precedent) before plan 02 is authored.
6. View the "Cornelius Civic Center - Oregon.JPG" banner candidate and record a compositional crop call for plan 05.

Until all of the above pass, plans 02 (structural migration), 03 (headshots), 04 (stances), and 05 (banner/surface) remain blocked per this plan's `<verification>` section: "Any failed gate blocks plans 02-05 until resolved."

The probe file itself is ready and correct; no further executor action is possible on this plan until the checkpoint is resolved by the orchestrator.

---
*Phase: 182-city-of-cornelius-deep-seed*
*Completed: 2026-07-04 (Task 1 only — Task 2 checkpoint pending orchestrator action)*

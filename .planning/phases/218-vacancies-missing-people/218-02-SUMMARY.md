---
phase: 218-vacancies-missing-people
plan: 02
subsystem: database
tags: [postgres, sql-migration, collin-county-tx, municipal-offices, brownfield-seeding]

requires: ["218-01"]
provides:
  - "20 essentials.offices rows across 10 Collin County, TX councils seated with real, cited, nonpartisan incumbents"
  - "6 pre-existing discovery-pipeline candidate rows (Anna Place 3/5, Fairview Seat 2/6, Josephine Place 5, Parker Mayor) upgraded in place to full incumbent records, preserving their race_candidates/photo linkage"
affects: [218-03, 218-04, 218-05]

tech-stack:
  added: []
  patterns:
    - "Idempotent DO $$ ... UPDATE offices SET politician_id pattern, upgraded with an explicit politician_id IS NULL guard"
    - "Candidate-row reuse: check for a pre-existing politicians row (matched on office_id + name) before INSERT, to avoid duplicating discovery-pipeline candidate rows that already exist for the same office"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1389_collin_seat_cited_incumbents.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1389_collin_seat_cited_incumbents.ts (gitignored, kept on disk)
  modified: []

key-decisions:
  - "6 of the 20 target offices (Anna Place 3/5, Fairview Seat 2/6, Josephine Place 5, Parker Mayor) already had a pre-existing essentials.politicians row for the same person, with office_id set but offices.politician_id never back-filled — leftover May-2026 discovery-pipeline candidate rows (5 linked to race_candidates; Josephine's Gary Chappell additionally carries a real headshot in politician_images). The migration UPDATEs these rows in place instead of inserting a duplicate, preserving their id and therefore their photo/race linkage."
  - "RESEARCH's stated geo_ids (Plano 4858016, Princeton 4859576, Van Alstyne 4874924) were double-checked against the live DB and confirmed CORRECT — the original May-2026 migration files (088/090/091/097) contain STALE geo_id values in their SQL text (4863000/4863432/4875960) because those governments' geo_id column was corrected at some point after those migrations ran; foreign-key linkage (chamber_id -> government_id) is unaffected by a later geo_id UPDATE, so the already-seeded office rows remained intact. No fix was needed; this is documented here only because it briefly looked like a RESEARCH error and cost investigation time."
  - "Plano Council Member Place 7 (Shun Thomas) was found ALREADY SEATED by migration 091 (applied 2026-05, pre-dates Phase 218) — confirmed via live DB precheck. Included in the migration as a documented no-op DO block rather than silently dropped, to keep the migration's office list matching the plan's literal 20-office objective."
  - "Gate (c) 'no-duplicate' and gate (e) 'no compass-stance side effects' were both re-scoped from the plan's literal global SQL text: (c) is scoped to this migration's 20 target offices, since a global run surfaces 7 additional duplicate-politician office_ids that are pre-existing, unrelated Indiana/Massachusetts data-quality bugs (Rule scope boundary — logged as deferred, not fixed); (e) is a total-row before/after count comparison rather than a per-politician-id absence check, since several of the 20 target politicians (Plano's Shun Thomas; the 5 reused discovery-pipeline rows) already carry legitimate pre-existing v3.0-era compass stances that this migration correctly leaves untouched."

requirements-completed: [COLLIN-PEOPLE-01]

coverage:
  - id: D1
    description: "20 directly-cited offices seated across Anna, Blue Ridge, Fairview, Josephine, Lowry Crossing, Parker, Plano, Princeton, Van Alstyne, Weston — all nonpartisan, no duplicates, no stance side effects, idempotent"
    requirement: "COLLIN-PEOPLE-01"
    verification:
      - kind: other
        ref: "npx tsx scripts/_apply-migration-1389_collin_seat_cited_incumbents.ts (embedded gates a-f, run twice for idempotency)"
        status: pass
    human_judgment: false

duration: 75min
completed: 2026-07-24
status: complete
---

# Phase 218 Plan 02: Seat 20 Directly-Cited Incumbents (Collin County, TX) Summary

**Idempotent data migration (1389) seating 20 directly-cited, nonpartisan incumbents across 10 Collin County, TX councils — including in-place reuse of 6 pre-existing discovery-pipeline candidate rows to avoid duplicate officeholders, and a corrected split-section/no-duplicate/no-stance-side-effect verification scoped to this migration's actual surface.**

## Performance

- **Duration:** ~75 min (heavier than typical due to a live-DB precheck pass, a geo_id red herring, and discovering + fixing a duplicate-seating bug against pre-existing candidate rows)
- **Completed:** 2026-07-24
- **Tasks:** 2
- **Files modified:** 1 committed (migration SQL, C:/EV-Accounts); apply script gitignored per repo convention (`backend/scripts/_*`), kept on disk

## Accomplishments

- Ran a live-DB precheck across all 20 target offices *before* writing any INSERT statements, which caught two real issues before they became data-quality bugs:
  1. Plano Council Member Place 7 (Shun Thomas) turned out to already be seated (migration 091, pre-dating this phase) — excluded from new-insert logic, included only as a documented no-op guard.
  2. 6 offices (Anna Place 3/5, Fairview Seat 2/6, Josephine Place 5, Parker Mayor) already had a matching-name `essentials.politicians` row from the May-2026 discovery pipeline (candidate rows with `office_id` set but `offices.politician_id` never back-filled) — a naive INSERT would have created a true duplicate officeholder. Rewrote those 6 DO blocks to reuse (`UPDATE ... WHERE id = <existing>`) the pre-existing row instead, preserving its `race_candidates` linkage and, for Gary Chappell, a real headshot already in `politician_images`.
- Seated all 20 offices named in the plan's objective across Anna, Blue Ridge, Fairview, Josephine, Lowry Crossing (5 offices), Parker, Plano, Princeton, Van Alstyne, and Weston — every row nonpartisan (`party = NULL`), sourced from RESEARCH's per-city citations (TML directory, official city sites, Ballotpedia, Princeton Herald, KTEN).
- All 5 embedded apply-script gates passed, including a corrected scope: the no-duplicate check is scoped to this migration's 20 offices (a global, unscoped run surfaces 7 pre-existing, unrelated duplicate-politician bugs in Indiana township/Martin County/MA Lt. Governor data — logged below as a deferred item, not fixed, per the scope-boundary rule) and the no-stance-side-effect check is a total-row before/after comparison (several of the 20 seated politicians legitimately already carry v3.0-era compass stances, which is expected and correct, not a violation).
- Migration verified idempotent: re-running seats 0 additional people and produces an identical politician_id set.
- Pushed to `C:/EV-Accounts` `master` — deployed live via Render.

## Task Commits

1. **Task 1: Write the idempotent seating migration for the 18 (actually 20) cited offices** — folded into the Task 2 commit below (single migration file, iteratively corrected during the same session after the live precheck/apply cycle surfaced the duplicate-seating bug).
2. **Task 2: Apply the migration + run post-seed SQL gates** — `3d9f9dc9` (feat, C:/EV-Accounts repo, pushed to `origin/master`)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1389_collin_seat_cited_incumbents.sql` — 20 idempotent DO $$ blocks (14 plain INSERT, 6 reuse-existing-row UPDATE, 1 no-op guard for Plano)
- `C:/EV-Accounts/backend/scripts/_apply-migration-1389_collin_seat_cited_incumbents.ts` — apply script with 6 embedded gates (all-seated, antipartisan, no-duplicate [scoped], split-section, no-stance-side-effect [before/after], idempotent re-run); gitignored by repo convention (`backend/scripts/_*`), kept on disk for potential re-run

## The 20 Seated Offices (person, office, geo_id, source)

| # | City (geo_id) | Office | Person | Source |
|---|------|--------|--------|--------|
| 1 | Anna (4803300) | Council Member Place 3 | Jessica Walden | directory.tml.org/profile/city/1286; annatexas.gov/319/City-Council |
| 2 | Anna (4803300) | Council Member Place 5 | Elden Baker | directory.tml.org/profile/city/1286 |
| 3 | Blue Ridge (4808872) | Mayor | Rhonda Williams | blueridgecity.com/council (live-fetched Plan 01) |
| 4 | Blue Ridge (4808872) | Council Member Place 1 | David Apple | blueridgecity.com/council |
| 5 | Blue Ridge (4808872) | Council Member Place 5 | Keith Chitwood | blueridgecity.com/council (new office row, Plan 01) |
| 6 | Fairview (4825224) | Council Member Seat 2 | Joe Boggs | directory.tml.org/profile/city/466 |
| 7 | Fairview (4825224) | Council Member Seat 6 | Lakia Works | directory.tml.org/profile/city/466 |
| 8 | Josephine (4838068) | Council Member Place 5 | Gary Chappell | directory.tml.org/profile/city/994 |
| 9 | Lowry Crossing (4844308) | Council Member Place 4 | Muhanad "G" Hijazen | lowrycrossingtexas.org/operations/city_council.php (see assumption note below) |
| 10 | Lowry Crossing (4844308) | Council Member Place 5 | Chris Madrid | lowrycrossingtexas.org/operations/city_council.php |
| 11 | Lowry Crossing (4844308) | Council Member Place 6 | Agur Rios | lowrycrossingtexas.org/operations/city_council.php |
| 12 | Lowry Crossing (4844308) | Council Member Place 7 | Cindy Cash | lowrycrossingtexas.org/operations/city_council.php |
| 13 | Lowry Crossing (4844308) | Council Member Place 8 | Ollie Simpson | lowrycrossingtexas.org/operations/city_council.php (see assumption note below) |
| 14 | Parker (4855152) | Mayor | Lee Pettle | directory.tml.org/profile/city/1765 |
| 15 | Parker (4855152) | Council Member Place 3 | Buddy Pilgrim | directory.tml.org/profile/city/1765 |
| 16 | Parker (4855152) | Council Member Place 5 | Billy Barron | directory.tml.org/profile/city/1765 |
| 17 | Plano (4858016) | Council Member Place 7 | Shun Thomas | plano.gov (already seated by migration 091, pre-dates Phase 218) |
| 18 | Princeton (4859576) | Council Member Place 4 | Jaisen Rutledge | Princeton Herald (2026-05-07, 2026-06-13); princetontx.gov certification newsflash (2026-06-23) |
| 19 | Van Alstyne (4874924) | Mayor | Jim Atchison | KTEN; Ballotpedia (Atchison/Soucie) |
| 20 | Weston (4877740) | Council Member Place 5 | Marla Johnston | westontexas.com/page/Mayor_Aldermen (live-fetched Plan 01, 2026-07-23) |

## Decisions Made

- **Candidate-row reuse over blind INSERT (Rule 1 bug fix — see Deviations):** 6 offices already had a matching-name politician row from the May-2026 discovery pipeline. Rewrote those DO blocks to `UPDATE` the existing row in place rather than `INSERT` a duplicate.
- **Lowry Crossing Ward 4 assumption (documented, low-impact):** the city's own site publishes no first/second distinction between its two Ward 4 seats — Place 4 and Place 8 are our internal DB slugs only. Assigned Muhanad "G" Hijazen -> Place 4 (pre-existing office row) and Ollie Simpson -> Place 8 (new office row from Plan 01) with no strong evidentiary basis for that specific assignment (both are equally well-cited as current Ward 4 members). Flagged for Plan 03/05 re-verify; low real-world impact since both people are correctly seated as current Lowry Crossing council members regardless of which specific row each occupies.
- **Term dates cross-checked against sibling office rows, not just RESEARCH's suggested dates:** e.g. Blue Ridge's 3 new rows use `2026-05-01 -> 2028-05-01` (matching RESEARCH's specific "term through May 2028" citation) rather than the generic 3yr convention seen on Blue Ridge's other 3 seats — Blue Ridge genuinely runs 2yr staggered terms for this cohort. Weston's Marla Johnston uses `2024-11-01 -> 2026-11-01` (Plan 01's live-verified "Term Expires Nov 2026"), not the generic May-anchor placeholder convention used by Weston's other 3 rows (which appear to be approximations, out of scope to correct here).
- **Josephine's Gary Chappell valid_from/valid_to left untouched:** the pre-existing orphan row already had plausible dates (`2024-05-01 -> 2026-11-01`); rather than overwrite with this migration's own best-guess sibling-convention date (`2027-05-01`), only fields this migration can assert with confidence (party, active/incumbent/vacant/appointed flags, data_source) were updated on the reused row.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate-officeholder creation against pre-existing discovery-pipeline candidate rows**
- **Found during:** Task 2, first apply-script run
- **Issue:** A live-DB precheck (before writing INSERTs) correctly found all 20 target offices had `politician_id IS NULL`. However, the first version of the migration blindly `INSERT`ed a new politician row per office. For 6 offices (Anna Place 3/5, Fairview Seat 2/6, Josephine Place 5, Parker Mayor), a pre-existing `essentials.politicians` row for the exact same person already existed (created 2026-05-22, `office_id` set but `offices.politician_id` never back-filled — leftover May-2026 discovery-pipeline candidate rows; 5 of the 6 are linked to `essentials.race_candidates`, and Josephine's Gary Chappell orphan additionally carries a real headshot in `politician_images`). The blind INSERT created a true duplicate active officeholder per office, caught by the no-duplicate gate (13 duplicate office_ids on first run).
- **Fix:** Deleted the 6 duplicate rows I had just inserted, reset the 6 offices back to `politician_id IS NULL`, and rewrote those 6 DO blocks to first check for a pre-existing politician row matching `office_id` + name; if found, `UPDATE` it in place (preserving its `id` and therefore its `race_candidates`/`politician_images` linkage) instead of inserting a new row. Re-ran the full migration + gates from this corrected state — clean pass.
- **Files modified:** `C:/EV-Accounts/backend/migrations/1389_collin_seat_cited_incumbents.sql`
- **Commit:** `3d9f9dc9` (final, corrected version only — the buggy intermediate version was never committed)

**2. [Rule 1 - Bug] No-duplicate and no-stance-side-effect gates re-scoped to this migration's actual surface**
- **Found during:** Task 2, gate design
- **Issue:** The plan's literal verify text specifies a global, unscoped `SELECT office_id, COUNT(*) ... GROUP BY office_id HAVING COUNT(*) > 1` for the no-duplicate gate, and a "0 stance rows for these politician_ids" check for the no-side-effect gate. Run literally: the global no-duplicate query surfaces 7 additional duplicate-politician office_ids entirely unrelated to Collin County (Indiana township boards, Martin County Circuit Clerk, Massachusetts Lieutenant Governor name-variant) — pre-existing data-quality bugs with zero connection to this migration. Separately, several of the 20 target politicians (Plano's pre-existing Shun Thomas; the 5 reused discovery-pipeline rows) already legitimately carry v3.0-era compass stances — a literal "must have 0 stances" check would have failed on expected, correct pre-existing data, not a real D-06 violation.
- **Fix:** Scoped the no-duplicate gate to this migration's 20 target office_ids (0, confirmed clean) while still running the global query for visibility, logging the 7 unrelated duplicates as an out-of-scope deferred item rather than attempting to fix them. Replaced the stance gate with a total-row before/after count comparison across the whole `inform.politician_answers` table — the correct assertion that this migration's SQL (which contains zero writes to `inform.*`) did not create any new stance rows as a side effect, regardless of what pre-existing stances the seated politicians happen to already have.
- **Files modified:** `C:/EV-Accounts/backend/scripts/_apply-migration-1389_collin_seat_cited_incumbents.ts`
- **Commit:** N/A (gitignored apply script, not committed to git per repo convention)

### Out-of-Scope Findings (logged, not fixed)

- **7 pre-existing duplicate-active-politician office_ids, unrelated to Phase 218:** Indiana Monroe/Martin County township boards and circuit clerk offices (multiple `is_active=true` politician rows sharing one `office_id`, likely stale reseating data), and a Massachusetts Lieutenant Governor name-variant duplicate ("Kimberley Driscoll" vs "Kim Driscoll" both active on the same office). Discovered as a side effect of running this phase's no-duplicate gate at global scope. Out of scope for this task (different states, different phases, no connection to Collin County TX vacancies work) — logging here for a future data-quality pass rather than fixing blind.

## Known Stubs

None — all 20 seated politicians have real names, real citations, and `is_vacant=false`. No placeholder/empty values introduced.

## Issues Encountered

- A brief false alarm: Plano/Princeton/Van Alstyne's original May-2026 migration files (088/090/091/097) contain SQL literal geo_id values (4863000/4863432/4875960) that no longer match those governments' live geo_id (4858016/4859576/4874924 respectively). Investigated via a live-DB query before concluding this was NOT a RESEARCH error — the governments' `geo_id` column was corrected at some point after those migrations ran (a later `UPDATE essentials.governments SET geo_id = ...`), which has no effect on already-seeded office/politician foreign-key rows (they join on `government.id`, not `geo_id`, at insert time). RESEARCH's stated geo_ids were confirmed correct against the live DB and used as written.

## User Setup Required

None — no external service configuration required. Migration deployed via `git -C "C:/EV-Accounts" push origin master` (Render auto-deploy from `master`), consistent with `[[backend_architecture]]` / `[[no_git_in_ev_accounts]]`.

## Next Phase Readiness

Plan 03 can proceed with the deeper re-verify pass for the 7 flagged-uncertain seats (Fairview Seat 4, Van Alstyne Place 6, Nevada Mayor/Place 1/Place 2, Lucas Place 1/2) — none of those offices were touched by this plan. Plan 04 (headshots) should note: Gary Chappell (Josephine) already has a real headshot from the discovery pipeline (preserved by the in-place UPDATE, not lost); Blue Ridge (3 people), Lowry Crossing (5 people), and Nevada remain documented zero-photo cities per milestone convention. Plan 05 (verification) should independently re-check the Lowry Crossing Place 4/Place 8 Hijazen/Simpson assignment if a future source clarifies which Ward 4 seat is "first" vs "second," and should be aware of the 7 out-of-scope duplicate-politician office_ids logged above (unrelated to Collin County, no action expected from this milestone).

No blockers. Split-section gate clean; antipartisan clean (0 non-NULL party); no-duplicate clean among the 20 target offices; no compass-stance side effects (before/after row count identical); idempotency proven via a full re-run producing an identical politician_id set.

---
*Phase: 218-vacancies-missing-people*
*Completed: 2026-07-24*

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1389_collin_seat_cited_incumbents.sql`
- FOUND: `C:/EV-Accounts/backend/scripts/_apply-migration-1389_collin_seat_cited_incumbents.ts` (gitignored, on disk)
- FOUND: `.planning/phases/218-vacancies-missing-people/218-02-SUMMARY.md`
- FOUND commit `3d9f9dc9` (C:/EV-Accounts, pushed to origin/master)

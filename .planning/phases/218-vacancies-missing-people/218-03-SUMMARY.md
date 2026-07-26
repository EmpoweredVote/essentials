---
phase: 218-vacancies-missing-people
plan: 03
subsystem: database
tags: [postgres, sql-migration, collin-county-tx, municipal-offices, brownfield-seeding, d04-reverify]

requires: ["218-02"]
provides:
  - "7 previously-flagged-uncertain essentials.offices rows across Fairview, Van Alstyne, Nevada, and Lucas seated with re-confirmed cited incumbents (0 documented vacancies needed this round)"
  - "Upgraded citation tier for all 7: each RESEARCH lead (TML-directory-only, WebSearch synthesis, or inferred positional mapping) was independently re-confirmed via a direct city-site fetch and/or the Collin County official May-2-2026 canvass PDF"
affects: [218-04, 218-05]

tech-stack:
  added: []
  patterns:
    - "Same idempotent DO $$ ... politician_id IS NULL guard pattern as Plan 02, with the same candidate-row-reuse extension (UPDATE existing orphan row in place, preserving id + race_candidates linkage, when a pre-existing discovery-pipeline row matches office_id + name)"
    - "D-04 deeper-verify recipe demonstrated end-to-end: WordPress government-sitemap.xml -> official town/city roster page; CivicPlus membershipware people-API JSON extracted from an embedded JS eId token; Collin County election-results-archive -> per-election summary-report PDF -> pdftotext -layout for race-level vote totals"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1390_collin_reverify_flagged_seats.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1390_collin_reverify_flagged_seats.ts (gitignored, kept on disk)
  modified: []

key-decisions:
  - "All 7 flagged seats resolved as SEAT (not documented vacancy) — the deeper D-04 search found a stronger, independently-confirming citation for every one; RESEARCH's original leads (all named a specific person) were correct in every case, just under-cited at RESEARCH time."
  - "Fairview Seat 4 (John Stanley) and Lucas Place 2 (Rebecca Orr) each already had a pre-existing orphan essentials.politicians row (office_id set, offices.politician_id never back-filled, source='election_results_2026_05_02', each linked to a race_candidates row) discovered via a live-DB precheck before writing the migration — reused those rows in place (UPDATE, not INSERT) to avoid the same duplicate-officeholder bug Plan 02 hit, preserving their existing race_candidates linkage."
  - "Lucas Place<->Seat positional mapping (the A4 RESEARCH inference) is now PROVEN, not just inferred: the Collin County official canvass PDF explicitly labels the two races 'City Council, Seat 1 - City of Lucas' (won by Jonathan Underhill) and 'City Council, Seat 2 - City of Lucas' (won by Rebecca Orr) — confirming the DB's Place 1/Place 2 rows correspond 1:1 to the site's Seat 1/Seat 2 labels in that exact order."
  - "Nevada's Place 1 officeholder is seated as 'Mike Laye' (not 'Michael Laye') — the city's own staff-directory table (cityofnevadatx.org/government/city_council.php) spells the first name 'Mike' verbatim; used as authoritative over RESEARCH's tentative 'Michael \"Mike\"' framing."
  - "Van Alstyne Place 6 (Zach Williams) valid_from uses the May 2, 2026 general-election date (day precision, per the established Van Alstyne term_date_precision='day' convention) rather than a fabricated swearing-in date, since no swearing-in date was found in any source — the city's own roster bio confirms 'elected...in 2026' but does not give an exact day."
  - "Plan text frontmatter/success-criteria use inconsistent counts ('8 flagged seats' in several places) while environment_notes and the enumerated seat list both consistently total 7 offices (Fairview Seat 4; Van Alstyne Place 6; Nevada Mayor, Place 1, Place 2; Lucas Place 1, Place 2). Followed environment_notes (more specific, DB-confirmed) and resolved exactly these 7 — no 8th office was ever identified in RESEARCH.md, VALIDATION.md, or a live-DB scan for any additional ambiguous seat in the 4 target cities."

requirements-completed: [COLLIN-PEOPLE-01, COLLIN-PEOPLE-02]

coverage:
  - id: D1
    description: "7 flagged-uncertain offices across Fairview, Van Alstyne, Nevada, and Lucas re-verified via a second/third independent source (live city-site fetch and/or Collin County official canvass PDF) and seated with cited, nonpartisan incumbents — zero remained ambiguous"
    requirement: "COLLIN-PEOPLE-01"
    verification:
      - kind: other
        ref: "npx tsx scripts/_apply-migration-1390_collin_reverify_flagged_seats.ts (embedded gates a-g, run twice for idempotency)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No genuine vacancies existed among these 7 — all resolved as seated (not is_vacant=true); the documented-vacancy code path (UPDATE offices SET is_vacant=true WHERE politician_id IS NULL) was written into the plan's playbook but not exercised this round since no seat came up empty after exhausting D-04 tiers"
    requirement: "COLLIN-PEOPLE-02"
    verification:
      - kind: other
        ref: "npx tsx scripts/_apply-migration-1390_collin_reverify_flagged_seats.ts gate (a)+(b): 0 ambiguous offices, 0 placeholder-vacancy rows"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-07-24
status: complete
---

# Phase 218 Plan 03: Deeper D-04 Re-Verify of 7 Flagged Collin County, TX Seats Summary

**Idempotent data migration (1390) re-verifying and seating all 7 previously flagged-uncertain offices (Fairview Seat 4, Van Alstyne Place 6, Nevada Mayor/Place 1/Place 2, Lucas Place 1/Place 2) via live city-site fetches and the Collin County official May-2-2026 election canvass — every seat resolved as a cited incumbent, zero documented vacancies needed.**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-07-24
- **Tasks:** 2
- **Files modified:** 1 committed (migration SQL, C:/EV-Accounts repo); apply script gitignored per repo convention (`backend/scripts/_*`), kept on disk

## Accomplishments

- Ran the full D-04 deeper-verify ladder (city site direct fetch -> official election canvass -> second independent source) against all 7 flagged seats and found a stronger citation for every one — no seat came up empty, so no documented vacancy was needed this round.
- **Fairview Seat 4 (John Stanley):** triple-confirmed. TML directory (RESEARCH's original citation) + a live re-fetch of `fairviewtexas.org/government/mayor-town-council/` (found via the site's `government-sitemap.xml` after the RESEARCH-guessed URL 404'd) whose staff-bio HTML directly pairs "John Stanley, Seat Four" + the Collin County official canvass PDF, which lists "Town Council, Seat 4 - Town of Fairview: John Stanley 384 votes (52.10%) def. Ricardo Doi 353 (47.90%)".
- **Van Alstyne Place 6 (Zach Williams):** confirmed via the city's own live council roster. `cityofvanalstyne.us/council` is a CivicPlus/membershipware SPA whose people data loads from an embedded JS API call (`app.membershipware.com/api/public/mwjsPeople?...`); the extracted JSON bio reads verbatim "Zach Williams was elected to City Council Place 6 in 2026" — directly answering A2's open question (election win, not a resignation/appointment swap for Angelica Pena). The API response also carries a headshot photo URL, useful for Plan 04.
- **Nevada Mayor/Place 1/Place 2 (Donald Deering, Mike Laye, Paul Baker):** confirmed via a direct single-page fetch of `cityofnevadatx.org/government/city_council.php` — its staff-directory table lists all three names/titles verbatim, superseding RESEARCH's earlier WebSearch-synthesis citation exactly as A3 requested. Corrected spelling: the city's own listing uses "Mike Laye," not "Michael."
- **Lucas Place 1/Place 2 (Jonathan Underhill, Rebecca Orr):** confirmed via the Collin County official canvass PDF, which explicitly labels the races "City Council, Seat 1 - City of Lucas" (Underhill 505 votes/85.74%) and "City Council, Seat 2 - City of Lucas" (Orr 396 votes/63.56%) — proving A4's inferred Place<->Seat positional mapping was correct, not just plausible.
- A live-DB precheck (same discipline as Plan 02) caught 2 of the 7 offices already having a matching-name orphan `essentials.politicians` row from the May-2026 discovery pipeline (Fairview's John Stanley, Lucas's Rebecca Orr) — both reused in place via `UPDATE` rather than a duplicate `INSERT`, preserving their existing `race_candidates` linkage.
- All 7 embedded apply-script gates passed on both the first run and a full idempotent re-run: (a) all 7 target offices non-ambiguous, (b) 0 placeholder-vacancy rows, (c) Lucas titles unchanged ('Council Member Place 1'/'Place 2', never renamed to 'Seat N'), (d) antipartisan (0 non-NULL party), (e) no-duplicate (scoped to these 7 offices), (f) split-section clean across all 4 governments, (g) idempotent re-run produces an identical politician_id set.
- Pushed to `C:/EV-Accounts` `master` (commit `32f4b2a3`) — deployed live via Render.

## Task Commits

1. **Task 1: Deeper D-04 re-verify of the 7 flagged seats** — no file writes (research/verification only); decisions + citations recorded in this SUMMARY per the plan's own instruction.
2. **Task 2: Write + apply the seat-or-document migration with gates** — `32f4b2a3` (feat, C:/EV-Accounts repo, pushed to `origin/master`)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1390_collin_reverify_flagged_seats.sql` — 7 idempotent DO $$ blocks (5 plain INSERT, 2 reuse-existing-row UPDATE), fully cited with the deeper D-04 sources found this plan
- `C:/EV-Accounts/backend/scripts/_apply-migration-1390_collin_reverify_flagged_seats.ts` — apply script with 7 embedded gates (target-office non-ambiguity, no-placeholder-vacancy, Lucas title-drift guard, antipartisan, no-duplicate [scoped], split-section, idempotent re-run — each gate run twice, once per apply); gitignored by repo convention, kept on disk for potential re-run

## The 7 Seat-or-Document Decisions (all SEAT)

| # | City (geo_id) | Office | Decision | Person | Citation |
|---|------|--------|----------|--------|----------|
| 1 | Fairview (4825224) | Council Member Seat 4 | SEAT | John Stanley | directory.tml.org/profile/city/466; fairviewtexas.org/government/mayor-town-council/ (live-fetched 2026-07-24); Collin County official canvass PDF, May 2 2026 Joint General and Special Election ("Town Council, Seat 4 - Town of Fairview": Stanley 384/52.10% def. Doi 353/47.90%) |
| 2 | Van Alstyne (4874924) | Council Member Place 6 | SEAT | Zach Williams | directory.tml.org/profile/city/524; cityofvanalstyne.us/council (live-fetched 2026-07-24, official membershipware people-API bio: "Zach Williams was elected to City Council Place 6 in 2026") |
| 3 | Nevada (4850760) | Mayor | SEAT | Donald Deering | cityofnevadatx.org/government/city_council.php (live-fetched 2026-07-24, direct staff-directory table) |
| 4 | Nevada (4850760) | Council Member Place 1 | SEAT | Mike Laye | cityofnevadatx.org/government/city_council.php (live-fetched 2026-07-24) |
| 5 | Nevada (4850760) | Council Member Place 2 | SEAT | Paul Baker | cityofnevadatx.org/government/city_council.php (live-fetched 2026-07-24) |
| 6 | Lucas (4845012) | Council Member Place 1 | SEAT | Jonathan Underhill | lucastexas.us/164/City-Council; Collin County official canvass PDF ("City Council, Seat 1 - City of Lucas": Underhill 505/85.74% def. Richard Alan 84/14.26%) |
| 7 | Lucas (4845012) | Council Member Place 2 | SEAT | Rebecca Orr | lucastexas.us/164/City-Council; Collin County official canvass PDF ("City Council, Seat 2 - City of Lucas": Orr 396/63.56% def. John Awezec 227/36.44%) |

Zero DOCUMENTED VACANCY decisions this plan — every flagged seat had a confirmable current incumbent.

## Decisions Made

- **All 7 SEAT, 0 documented vacancy:** the deeper D-04 search exhausted the required tiers (city site direct fetch, official canvass) before falling back to "documented vacancy," and every seat resolved with a confirmed person before that fallback was needed.
- **Candidate-row reuse over blind INSERT (Rule 1 pattern, re-applied from Plan 02):** Fairview Seat 4 (Stanley) and Lucas Place 2 (Orr) each had a pre-existing May-2026 discovery-pipeline orphan row; reused in place to avoid a duplicate-officeholder bug and preserve `race_candidates` linkage.
- **Lucas Place<->Seat mapping upgraded from inference to proof:** the county canvass explicitly names both races by their site "Seat" label, confirming the DB's "Place" rows map 1:1 and in the same order.
- **"Mike Laye" (not "Michael"):** used the exact spelling from the city's own staff directory over RESEARCH's tentative framing.
- **Van Alstyne Place 6 valid_from = election date, not a fabricated swearing-in date:** no source gave an exact swearing-in day; used the May 2, 2026 general-election date at day precision (matching the established Van Alstyne term_date_precision='day' convention) rather than guessing a later date.
- **Plan's "8 flagged seats" language reconciled to 7:** the plan's frontmatter/objective/done-criteria text says "8" in several places, but its own enumerated seat list, environment_notes, and a live-DB scan all total exactly 7 offices across the 4 named cities — no 8th ambiguous office exists in Fairview, Van Alstyne, Nevada, or Lucas. Proceeded with the 7 actually enumerated; documented here as a plan-text inconsistency, not a data gap.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate-officeholder risk against 2 pre-existing discovery-pipeline candidate rows**
- **Found during:** Task 2, live-DB precheck before writing the migration
- **Issue:** A precheck of all 7 target offices (mirroring Plan 02's discipline) found all 7 had `politician_id IS NULL` as expected, but 2 of them (Fairview Seat 4 / John Stanley; Lucas Place 2 / Rebecca Orr) already had a matching-name `essentials.politicians` orphan row (`source='election_results_2026_05_02'`, `office_id` set but `offices.politician_id` never back-filled, each linked to one `essentials.race_candidates` row). A blind `INSERT` would have created a true duplicate officeholder per office, as happened in Plan 02 before its fix.
- **Fix:** Wrote both DO blocks with the same reuse-check-then-update pattern established in Plan 02 (check for a pre-existing politician row matching `office_id` + name; if found, `UPDATE` it in place instead of inserting a new row) — caught before the first apply run, not after a failed gate.
- **Files modified:** `C:/EV-Accounts/backend/migrations/1390_collin_reverify_flagged_seats.sql`
- **Commit:** `32f4b2a3`

### Out-of-Scope Findings (logged, not fixed)

- None this plan — the no-duplicate gate (scoped to these 7 offices) and the split-section gate (scoped to the 4 touched governments) both returned clean with no unrelated findings surfaced.

## Known Stubs

None — all 7 seated politicians have real names, real citations, and `is_vacant=false`. No placeholder/empty values introduced.

## Issues Encountered

- Ballotpedia's guessed URL for Lucas's 2026 election page (`ballotpedia.org/City_elections_in_Lucas,_Texas_(2026)`) returned a Cloudflare 202 challenge on the first attempt and a 404 on retry with a different user-agent — abandoned in favor of the Collin County official canvass PDF, which turned out to be a stronger source anyway (primary election-authority document, not a secondary aggregator).
- RESEARCH's guessed Fairview URL (`fairviewtexas.org/index.php/government/town-council`) 404'd (WordPress site, no `index.php` routing) — found the correct live URL (`fairviewtexas.org/government/mayor-town-council/`) via the site's own `government-sitemap.xml`.
- Van Alstyne's council roster page renders via client-side JS (CivicPlus + membershipware SPA) — a plain `curl` of the HTML page returns no roster text. Found the underlying JSON people-API URL embedded in the page's JS (`app.membershipware.com/api/public/mwjsPeople?et=...&eb=...`) and fetched that directly instead.

## User Setup Required

None — no external service configuration required. Migration deployed via `git -C "C:/EV-Accounts" push origin master` (Render auto-deploy from `master`), consistent with `[[backend_architecture]]` / `[[no_git_in_ev_accounts]]`.

## Next Phase Readiness

Plan 04 (headshots) should note: Van Alstyne's Zach Williams has a real headshot photo URL already available from the `cityofvanalstyne.us` membershipware people-API response (`personPhoto` field, `app.membershipware.com/api/blob/viewBlob?...`) — worth checking directly rather than re-running `/find-headshots` from scratch. Nevada's 3 newly-seated officials (Deering/Laye/Baker) remain in the documented zero-photo-city set (no known online source, per milestone convention) — honest blank expected. Fairview's John Stanley has a real headshot already on `fairviewtexas.org/government/mayor-town-council/` (`JohnStanley-74-cropped-*.jpg` images at up to 2048x1536) — should be straightforward to source. Lucas's Underhill/Orr should be checked against `lucastexas.us/Directory.aspx` (CivicPlus staff directory, RESEARCH flagged as "likely available").

Plan 05 (verification) can now confirm 0 ambiguous offices remain among these 7 — all are seated with `politician_id NOT NULL`, `is_vacant=false`. Combined with Plan 02's 20 offices, the full 27-office target list from RESEARCH is resolved with zero ambiguous empty seats remaining in the reconciled scope.

No blockers. All 7 embedded gates clean on both runs; idempotency proven via a full second apply producing an identical politician_id set.

---
*Phase: 218-vacancies-missing-people*
*Completed: 2026-07-24*

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1390_collin_reverify_flagged_seats.sql`
- FOUND: `C:/EV-Accounts/backend/scripts/_apply-migration-1390_collin_reverify_flagged_seats.ts` (gitignored, on disk)
- FOUND: `.planning/phases/218-vacancies-missing-people/218-03-SUMMARY.md`
- FOUND commit `32f4b2a3` (C:/EV-Accounts, pushed to origin/master)

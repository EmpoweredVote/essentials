---
phase: 221-collin-county-headshots-source-and-attach-photos-for-officia
plan: 01
status: complete
completed: 2026-07-24
---

# 221-01 SUMMARY — Live missing-photo audit + batched worklist

## What was produced
- `221-01-WORKLIST.md` — the live, batched worklist + BEFORE coverage counts. No photo assets, no `politician_images` rows written.

## BEFORE coverage counts (city-scope)
- Total in-scope seated Collin officeholders: **150**
- WITH a `politician_images` row: **102**
- WITHOUT an image (city-scope worklist): **48**
- Full attempt list = **49** (48 city-scope + Brandon Smith, Longview D3).

## Batch membership
- **Batch A (→221-02), 3:** Jessica Walden (Anna), Mark Hill (Frisco Mayor), Brandon Smith (Longview D3).
- **Batch B (→221-03), 46:** Blue Ridge 6, Farmersville 6, Lowry Crossing 9, Nevada 6, Princeton 7, Saint Paul 6, Van Alstyne 6.

## Key findings / deviations
- **Gopal Ponangi is OUT OF SCOPE** (deviation from plan's must-have that he "appear in the worklist"). Live DB: `is_active=false`, `office_id=NULL` — un-seated by mig 1409 (which corrected mig 1404's erroneous Collin-only seating of the Frisco P4 *loser*; Frisco is a 2-county city). He is not a current officeholder, so no headshot is required. His 221-04 disposition = "not seated; no photo needed" (NOT a confirmed-blank-with-search). The plan's own prohibition ("the live DB is the source of truth") mandates dropping him.
- **Batch A collapsed to 3 people.** All other Batch A cities (Plano, Richardson, Allen, McKinney, Prosper, Celina, Murphy, Fairview, Lucas, Parker) already have full headshot coverage — zero imageless officeholders. The gap is almost entirely small-town Batch B rosters, matching the v25.0 roadmap prediction.
- **Brandon Smith present** (c6ec603a…) — sourced via explicit name union (Longview is outside the Collin city filter but is a coverage.js browse city).
- **coverage.js cross-check:** all 23 Collin browse cities are inside the query scope; no government mismatch.
- **BEFORE count reconciles exactly** (48 city-scope) — no duplicate-image inflation.
- **Zero-known-source cities** (Blue Ridge, Farmersville, Lowry Crossing, Nevada, Saint Paul) flagged "attempt anyway, expect blank."

## Handoff
221-02 consumes Batch A (3 people); 221-03 consumes Batch B (46). Both attach via `/find-headshots` (bucket `politician_photos`, `{politician_id}-headshot.jpg`, 600×750 4:5). 221-04 diffs AFTER vs the BEFORE counts above and records Gopal Ponangi's out-of-scope disposition.

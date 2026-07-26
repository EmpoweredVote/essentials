---
phase: 203-indio-deep-seed
plan: 04
status: complete
completed: 2026-07-13
requirements: [CV-03]
---

# 203-04 Summary — Indio Council Evidence-Only Compass Stances

## Outcome
All 5 councilmembers carry an evidence-only, 100%-cited compass with honest blanks. 18 total stances
seeded across the live non-judicial topic set; researched ONE member at a time (quota rule). Operator
calibrated on D1 Miller, then D2–D5 completed the same way.

## What was built
5 audit-only (unregistered) stance migrations, applied via `psql -f`, committed to `C:/EV-Accounts` as
`af1ae919`:
- `1340_indio_councilmember_1_stances.sql` — Glenn Miller (D1)
- `1341_indio_councilmember_2_stances.sql` — Waymond Fermon (D2)
- `1342_indio_councilmember_3_stances.sql` — Elaine Holmes (D3)
- `1343_indio_councilmember_4_stances.sql` — Oscar Ortiz (D4)
- `1344_indio_councilmember_5_stances.sql` — Benjamin Guitron IV (D5)

## Per-member stances (chair values, all cited)
| Member | # seeded | Chairs |
|--------|:--------:|--------|
| D1 Glenn Miller | 5 | housing 4 · homelessness-response 3 · economic-development 4 · growth-and-development 4 · public-safety-approach 4 |
| D2 Waymond Fermon | 3 | housing 3 · economic-development 4 · public-safety-approach 3 |
| D3 Elaine Holmes | 5 | housing 2 · economic-development 4 · growth-and-development 4 · homelessness-response 3 · public-safety-approach 3 |
| D4 Oscar Ortiz | 2 | housing 3 · economic-development 2 |
| D5 Benjamin Guitron IV | 3 | public-safety-approach 4 · economic-development 3 · growth-and-development 3 |

**Total: 18 stances.** Values are discrete compass *chairs* (matched to the documented position), not a
polarity scale. Distinctions are real and evidence-based (e.g. Miller housing-4 build-via-developers vs
Holmes housing-2 affordable-supply vs Ortiz economic-2 local/small-business vs the others' recruitment-4).

## Audit (production)
- **0 uncited** — every `politician_answers` row has a matching `politician_context` row with a non-empty
  `sources` array.
- **0 court-scoped** — no `judicial-*` topic referenced (City Council is a non-court-scoped office).
- **Ledger untouched** — versions 1340–1344 NOT in `schema_migrations` (audit-only).

## Method / honest blanks
- Evidence bar (operator-approved at D1 calibration): on-record campaign-platform statements + cited
  council actions; real source URLs (campaign sites, Uken Report, KESQ, CV Independent, indio.org bios).
- The bulk of the 36-topic set is honest-blank for each member (national/state topics + undocumented
  local topics get NO row — never a neutral default). Municipal officials have thin records on most
  topics; sparse coverage is correct, not a gap.
- GOTCHA honored: the word "judicial" is avoided even in comments (verify-greps scan comments) — used
  "non-court-scoped" per the analog.

## Self-Check: PASSED
- [x] 5 audit-only migrations applied; ledger MAX unchanged
- [x] 18 stances, 0 uncited, 0 court-scoped
- [x] Discrete chairs, evidence-based reasoning, honest blanks, party never stored
- [x] Researched one member at a time; 5 files committed to `C:/EV-Accounts`

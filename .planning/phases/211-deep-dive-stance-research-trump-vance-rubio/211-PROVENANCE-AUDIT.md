# Phase 211 — Provenance Audit (Trump / Vance / Rubio)

**Date:** 2026-07-19
**Scope:** Cross-check every live `inform.politician_answers` row for the three federal officials
against its `bundle.json` citation. Read-only audit — no DB writes.
**Method:** For each official, build the cited-topic map from the bundle (only entries with
`stance.value` + `source_url` + `quote_text`), then confirm every live DB row (a) maps to a cited
bundle entry, (b) has a non-null value, and (c) the live value equals the bundle's assigned chair
(parseInt integrity — no polarity drift). Legacy deltas computed vs the Wave-1 pre-pass snapshot.

## Per-official cross-check

*Numbers below reflect the final state **after the gap re-check** (see addendum). Initial-pass counts were Trump 27 / Vance 20 / Rubio 21.*

| Official | Pre-pass | Live DB | Bundle cited | Uncited (must=0) | Null values (must=0) | Value drift (must=0) | Answered | Honest blanks |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Donald Trump (President) | 21 | **30** | 30 | **0** | **0** | **0** | 30 | 14 |
| J.D. Vance (VP) | 24 | **28** | 28 | **0** | **0** | **0** | 28 | 16 |
| Marco Rubio (Sec. of State) | 0 | **24** | 24 | **0** | **0** | **0** | 24 | 20 |

**Every live row for all three officials maps to a bundle entry carrying a `source_url` + verbatim
`quote_text`, with the DB value equal to the bundle's assigned chair.** Zero uncited rows, zero
defaulted/null values, zero polarity drift.

## Success criteria

- **SC-1 (applicable topics answered):** ✅ National topics answered for all three (Trump 27 / Vance 20 / Rubio 21); hyper-local + `judicial-*` honestly blank.
- **SC-2 (100% cited, nothing uncited — D-05):** ✅ uncited = 0 across all three; Trump's 2 and Vance's 4 legacy topics that came back unsourced were deleted (answers + context in lockstep).
- **SC-3 (no defaults / no fabrication):** ✅ null-value rows = 0; value drift = 0; blanks are absent rows, never chair-3 defaults.
- **SC-4 (renders live):** ⏳ pending operator sign-off (Task 2, blocking human-verify).

## Legacy reconciliation (D-03 / D-04 / D-05)

- **Trump:** 21 legacy uncited answers → 19 overwritten with cited values, 2 deleted as unsourced; +8 newly-researched topics → 27 total. Reversible via `2026-07-19-trump-vance-pre-pass-snapshot.json`.
- **Vance:** 24 legacy → 20 overwritten with cited values, 4 deleted as unsourced → 20 total.
- **Rubio:** 0 legacy → clean insert of 21; reconcile-delete removed 0 (confirmed nothing uncited).

## Honest-blank topics (absent by design, not defaulted)

- **Trump (17):** campaign-finance, same-sex-marriage, city-sanitation, economic-development, growth-and-development, local-environment, rent-regulation, residential-zoning, transportation-priorities + all 8 `judicial-*`.
- **Vance (24):** campaign-finance, housing, redistricting, public-safety-approach, homelessness + 11 hyper-local + all 8 `judicial-*`.
- **Rubio (23):** ai-regulation, housing, redistricting + 11 hyper-local + all 8 `judicial-*`.

## Provenance / interpretation flags (from bundle editor_notes)

- **Rubio D-08/D-09:** 6 attribution flags where a SecState action executes the President's agenda — assigned chair reflects Rubio's own Senate record, not the office (notably tariffs 4, deportation 4, ukraine-support 3 backed by his recorded Senate votes).
- **Cross-official differentiation** (reflects each person, not the administration): ukraine-support Trump 3 / Vance 4 / Rubio 3; voting-rights Trump 5 / Vance 4 / Rubio 4; tariffs Trump 5 / Vance 5 / Rubio 4.
- **Lowest-confidence assignments** (flagged in-bundle): Vance same-sex-marriage 2; Trump/Vance/Rubio social-security & childcare (proxy/by-elimination); medicare/aid 4 for Trump & Vance (chair's "privatize Medicare" half does not fit — flagged).

## Regeneration

`npx tsx scripts/_audit-federal-provenance.ts` (from `C:\EV-Accounts\backend`) — reproduces the table
above from live DB + the three bundles + the snapshot.

## Gap re-check addendum (2026-07-19, post-sign-off)

Operator asked whether the honest-blanks were too aggressive (esp. for Trump). Ran a targeted
additive gap-audit — one agent per official over ONLY that official's blank topics — that either
found chair-matchable cited evidence a prior pass missed, or confirmed a documented reason each stays
blank. New finds were merged into the CSV/bundle and applied via the reconcile script with a keep-set
that is a superset of what was live, so **0 existing rows were deleted** (Trump +3 / Vance +8 /
Rubio +3 upserted, 0 deleted each). Re-audit after merge: 0 uncited / 0 null / 0 drift, all three.

**Newly answered (14 total):**
- **Trump (+3):** judicial-interpretation 5 (originalism), judicial-criminal-justice 5 (EO 14164 death penalty), transportation-priorities 4 (DOT "Freedom to Drive", federal-applied-to-local).
- **Vance (+8):** housing 4, residential-zoning 4 (flagged 3↔4), campaign-finance 4 (named plaintiff NRSC v. FEC), redistricting 5, public-safety-approach 4, local-immigration 5, judicial-government-deference 5, judicial-criminal-justice 5. *(Several were previously mis-blanked as "the President's action" when Vance has his own attributable record.)*
- **Rubio (+3):** ai-regulation 2, public-safety-approach 4, judicial-interpretation 5.

**Notable confirmed blanks (evidence checked, no clean chair match — not gaps):**
- **Trump campaign-finance** — genuinely contradictory (anti-Citizens-United rhetoric vs. 2025 super-PAC reliance; no chair-matchable policy action).
- **Trump same-sex-marriage, residential-zoning** — contradictory records; **judicial-*** (5 of 7) — no on-point jurist evidence.
- **Rubio housing** (mixed 3↔4), **judicial-government-deference** (anti-Chevron doctrinally neutral vs. rhetoric); most hyper-local for all three (community-scale chairs with no convincing federal analog).

This resolves the operator's doubt: the remaining blanks are evidence-checked chair-matching decisions, not un-researched gaps.

# Plan 197-03 Summary — Sahuarita Council Evidence-Only Compass Stances

**Status:** ✅ Complete — applied to production 2026-07-16
**Requirement:** SUB-03 · ROADMAP success criterion #3 (evidence-only stances, 100% cited, no defaults, honest blanks)
**Migrations:** `1356..1362_sahuarita_*_stances.sql` (audit-only, unregistered; committed `fa44c0be` to `C:/EV-Accounts`)

## What was built

14 evidence-only compass-stance rows across the 7 Town of Sahuarita at-large officials, against the **36 non-judicial** live compass topics (44 live − 8 `judicial-*`). Each answer row (`inform.politician_answers`) is paired with a fully-cited context row (`inform.politician_context`); zero neutral defaults; a topic with no documented, chair-mappable position gets **no row** (honest blank), documented per file.

Research was done **one official at a time** (quota rule — no parallel fan-out), completion order **1356 → 1357 → 1358 → 1359 → 1360 → 1361 → 1362** (with a consistency retrofit of `taxes=2` back into the 3 earlier files once the unanimous June-2024 bond vote surfaced).

## Per-official stance counts (informational — honest blanks expected)

| ext_id | Official | Title | Rows | Topics seeded |
|--------|----------|-------|------|---------------|
| -4014001 | Tom Murphy | Mayor | 3 | economic-development=4, growth-and-development=4, taxes=2 |
| -4014002 | Kara Egbert | Vice Mayor | 3 | economic-development=4, growth-and-development=4, taxes=2 |
| -4014003 | Deborah Morales | Council | 2 | growth-and-development=3, taxes=2 |
| -4014004 | Steven Gillespie | Council | 3 | public-safety-approach=4, growth-and-development=3, taxes=2 |
| -4014005 | Diane Priolo | Council | 2 | growth-and-development=3, taxes=2 |
| -4014006 | Kim Lisk | Council | 1 | growth-and-development=3 |
| -4014007 | Edgar Lytle | Council | 0 | (full honest blank — see below) |

**Total: 14 rows (14 answers = 14 context).** Only 4 distinct topics carried citable evidence: `economic-development`, `growth-and-development`, `taxes`, `public-safety-approach` (all verified live + non-judicial before apply).

## Notable honest blanks on the salient issues

- **Copper World / Hudbay mine = honest blank for ALL 7.** The council's consistent on-record posture is a **jurisdictional deferral** ("cannot comment… outside their jurisdiction," "continuing to gather information") — genuine, but not chair-mappable to a policy stance. Morales's and Priolo's documented water/wastewater concern is noted as documented-but-not-mappable in their BLANK sections. (tucson.com Murphy mine-endorsement reporting could NOT be cited — HTTP 429 every attempt; citizenportal 403'd — so it was omitted per the fetched-URL-only rule.)
- **Data centers = blank for all 7** — no Sahuarita data center exists (mentions are neighboring Marana + a procedural legislative-priorities line).
- **Lytle (0 rows):** did not respond to the 2024 GVNews candidate Q&A (the primary positions source); only public self-description is a generic "support growth and prosperity" (not chair-mappable); the June-2024 bond predates his Nov-18-2024 swearing-in.
- **Lisk (1 row):** sworn Nov 2024 → excluded from the bond; one clean managed-growth position from her 2024 campaign Q&A.

## Tenure rule enforced

The June 10, 2024 unanimous $66M GO bond (secondary property-tax levy for rec center / police expansion / parks) → `taxes=2` for the 5 members seated then (Murphy, Egbert, Morales, Gillespie, Priolo). **Explicitly NOT attributed** to Lisk/Lytle (sworn Nov 18, 2024).

## Evidence sources used

gvnews.com (Green Valley News 2024/2026 candidate Q&As), rendered sahuaritaaz.gov pages (official bios / Town Council roster / staff directory), kgun9.com (the $66M bond article). All cited URLs were actually fetched and rendered real content.

## Verification

- BLOCKING combined integrity boolean returned `t`: 0 answer rows without a matching context row; 0 context rows with NULL/empty sources; 0 stance rows on any `judicial-*` topic; all values in [1.0, 5.0].
- All 7 migrations applied cleanly (`ON_ERROR_STOP=1`); none registered in the ledger.
- 7 migrations committed to `C:/EV-Accounts` (`fa44c0be`).

## Note for Plan 04

`hasContext:true` for the Sahuarita coverage chip is now **honest** — ≥1 stance row landed for the town (14 rows).

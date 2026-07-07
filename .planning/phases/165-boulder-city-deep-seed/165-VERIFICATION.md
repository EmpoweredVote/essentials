---
phase: 165
slug: boulder-city-deep-seed
status: passed
verified: 2026-06-29
requirement: CLARK-05
---

# Phase 165 — Boulder City Deep-Seed — Verification

**Status: PASSED** (operator-approved 2026-06-29)

Goal: *A Boulder City resident looks up who represents them and gets the correct Mayor + council member, with evidence-only stances on their profiles.* — **achieved.**

## Success criteria (all TRUE)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Any Boulder City address returns the correct Mayor + council member; form/seat count verified | ✓ At-large PIP routing → Mayor Hardy (LOCAL_EXEC, first) + all 4 at-large Council Members; 1 govt, official_count=5, 2 districts (1 LOCAL_EXEC + 1 shared LOCAL), 1+4 offices, 0 section-split |
| 2 | All seated officials render with 600×750 headshots (gaps documented) | ✓ 5/5 from flybouldercity.com, 0 gaps, correct-person spot-checked, CDN-200 |
| 3 | Evidence-only compass stances render — 100% cited, honest blanks, no defaults | ✓ 19 stances (Hardy 6/Jorgensen 5/Booth 3/Walton 3/Ashurst 2), 0 uncited, 0 defaults, chairs model, honest blanks |
| 4 | Boulder City surfaces with purple hasContext chip in coverage.js | ✓ Nevada block += Boulder City (3206500, hasContext:true) |

## Plans
- 165-01 ✓ structural seed + surfacing (migration 1100, registered)
- 165-02 ✓ headshots (migration 1101, audit-only)
- 165-03 ✓ stances + 8-check E2E (migrations 1102–1106, audit-only)

## Migrations
Structural ledger registered at **1100** (1101–1106 audit-only). Next migration: **1107**.

## UAT cross-cutting fixes (surfaced during this phase, fixed)
Two general display bugs were found during the Clark County portion of UAT (not Boulder City defects) and fixed:
- **District ordering** — `groupHierarchy.sortPoliticians` now sorts letter districts (A–G), not alphabetically by name (essentials `6c85a66`, +2 tests).
- **Title wrap** — `PoliticianCard` title wraps to 3 lines so a trailing parenthetical drops to its own line instead of truncating under the compass overlay (ev-ui **0.9.7** published; essentials bumped `9cd4285`).

## Notes
- gsd-executor has no Supabase MCP; all DB applies (`psql -f`), the headshot script, and stance-research agents (one at a time) were run inline by the orchestrator.
- No gap-closure plan needed — all inline checks passed first time.

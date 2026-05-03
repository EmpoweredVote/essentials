---
phase: 17-headshots
plan: 04
status: complete
tech-stack:
  added: []
key-files:
  - "~/.claude/commands/find-headshots.md"
affects: []
subsystem: essentials-data
---

## Summary

Imported official headshots for all 37 active TX US House representatives (TX-1 through TX-38, TX-23 vacant) plus Keith E. Sonderling (Acting Secretary of Labor). 100% coverage achieved across all 38 subjects processed.

Also applied migration 106: back-filled `politicians.office_id` for all 37 TX House reps (migration 105 had set `offices.politician_id` but not the reverse link), and updated the Secretary of Labor office from Lori Chavez-DeRemer (deactivated) to Keith E. Sonderling (external_id=696805, is_appointed=true).

## Coverage

| subject | count | with_headshot | missing |
|---------|-------|---------------|---------|
| TX US House Representatives (active) | 37 | 37 | 0 |
| Acting Secretary of Labor (Sonderling) | 1 | 1 | 0 |
| **Total** | **38** | **38** | **0** |

## Source

All images sourced from Wikipedia (Wikimedia Commons) infobox portraits. License: `cc_by_sa`.

Thumbnail URL approach used (1000px width) per Wikimedia recommendation — full-size originals triggered 429 rate limiting at batch scale.

## Image Processing

All images processed to 600×750 JPEG q90 (Lanczos resize) before upload to Supabase Storage. Auto-crop applied where headspace exceeded 15% (5 reps: Keith Self, Lloyd Doggett, Randy Weber, Roger Williams, Veronica Escobar). Tight-top warnings flagged and user-approved for 10 reps where head was within 12px of top edge.

## Migration 106

Applied `106_tx_house_office_id_fix_and_labor_secretary_update.sql`:
- Fix 1: `UPDATE essentials.politicians SET office_id = o.id ... WHERE o.representing_state = 'TX'` — UPDATE 37
- Fix 2: Deactivated Lori Chavez-DeRemer (id=95cb342b); inserted Keith E. Sonderling (external_id=696805); updated Secretary of Labor office (id=06d7d298) to point to Sonderling

## Phase 17 Final Roll-up

| tier | cities | politicians | with_headshot | coverage |
|------|--------|-------------|---------------|----------|
| Tier 1 | 4 (Allen, Frisco, McKinney, Plano) | 29 | 29 | 100% |
| Tier 2 | 4 (Celina, Murphy, Prosper, Richardson) | 28 | 28 | 100% |
| Tier 3 | 11 cities | 45 | 27 | 60% |
| Tier 4 | 4 cities | 30 | 14 | 47% |
| TX US House | 38 seats (37 active) | 37 | 37 | 100% |
| Federal Appointees | Secretary of Labor | 1 | 1 | 100% |

Tier 3/4 gaps are confirmed external availability constraints — user personally verified all 34 missing politicians; no photos exist on city sites or Ballotpedia.

## Human Verification

User approved all 38 federal/state headshots individually (or in batches). Migration 106 applied and verified on production DB.

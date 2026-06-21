---
phase: 151
slug: el-monte-deep-seed
status: passed
verified: 2026-06-21
requirement: ELMN-01
---

# Phase 151 — El Monte deep-seed — VERIFICATION

**Status: PASSED** (human-verify checkpoint approved by operator 2026-06-21). ELMN-01 satisfied end-to-end.

## Success criteria (ROADMAP)
1. **gov + chamber(s) + mayor + full council linked to geo_id 0622230** — ✓ gov `f5fe3651` geo_id `0622230`; ONE 'City Council' chamber `5ca38f3a` (duplicate `b41e0065` merged + deleted); 7 offices, all bidirectional links consistent.
2. **Council structure matches real form of government, verified vs official site** — ✓ Research overturned the CONTEXT At-Large default: El Monte is **by-district** (Ord. 3010) — D1–D6 + directly-elected LOCAL_EXEC Mayor; verified against `ci.el-monte.ca.us`. official_count=6 (council seats; Mayor excluded).
3. **Headshots 600×750, genuine gaps documented** — ✓ 7/7 official portraits (Cortez D6 new + 6 re-cropped), `press_use`, canonical `{uuid}-headshot.jpg`; 0 gaps; no fabricated/overlaid photos.
4. **Evidence-only stances, 100% citation, honest blanks** — ✓ 12 stances, 0 uncited, 0 judicial/retired; Ancona 5 / Cortez 4 / Herrera 1 / Ruedas 1 / Galvan 1; **Crippen-Thomas & Longoria honest full blanks** (no findable record, not padded).
5. **Browse renders roster + stances, no duplicate/stale office rows** — ✓ split-section check 0 rows; live at https://essentials.empowered.vote/results?browse_geo_id=0622230&browse_mtfcc=G4110

## Migrations
- Structural (registered): `1000_elmonte_reconcile`, `1001_elmonte_complete` (schema_migrations MAX = 1001).
- Audit-only (NOT registered, ledger stays 1001): `1002` headshots, `1003`–`1009` stances.
- All 10 files committed to the EV-Accounts repo (master).

## Key decisions / deviations
- **By-district overturn** (RESEARCH vs CONTEXT default) — the Downey mayor-verification lesson applied again; correct.
- **3-way shared-district defect** on `ee390480` resolved by creating new D2/D5 rows + repointing (no unused orphan existed, unlike Pasadena/Downey).
- **Marisol Cortez (D6) created fresh** (`-701001`) — was missing from DB; modeled as council incumbent, not the mayoral role she lost in 2024.
- Out-of-scope stray left untouched: `South El Monte Mayor` LOCAL_EXEC row mis-tagged geo_id 0622230 (belongs to South El Monte gov `71d17594`); also a `Lodi Unified School District` G5420 boundary row mis-tagged 0622230 — both flagged for a future cross-geo cleanup pass.

**Next migration: 1010.**

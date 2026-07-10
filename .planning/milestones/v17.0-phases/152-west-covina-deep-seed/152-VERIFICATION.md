---
phase: 152
slug: west-covina-deep-seed
requirement: WCOV-01
status: passed
verified: 2026-06-21
verifier: orchestrator (live DB via Supabase MCP) + operator human-verify checkpoints
---

# Phase 152 — Verification (WCOV-01)

**Verdict: PASSED.** West Covina taken from geofence-only to full Tier-1 depth, verified live.

## ROADMAP success criteria
1. **gov + chamber(s) + roster linked to geo_id 0684200** ✓ — gov `1982a9fa` geo_id=`0684200`; ONE `City Council` chamber `12c9360a`; 5 council offices.
2. **Structure matches real form of government (verified vs official site)** ✓ — RESEARCH-confirmed by-district (CVRA Ord. 2310 / *Sanchez* settlement): 5 districts D1–D5 + rotational council-selected Mayor (title on a seat, NO separate office / NO LOCAL_EXEC). Mayor=Lopez-Viado (D2), Mayor Pro Tem=Cantos (D4). official_count=5. All 5 offices bidirectionally linked, each on a distinct district_id.
3. **Headshots 600×750, gaps documented, no fabrication** ✓ — 5/5 default images. ⚠ Caught + fixed a wrong-person image (D1 "Gutierrez" was the Chicago Fire soccer player). Cantos = operator-supplied (city only had low-res full-body). 4 others = official city portraits (low-res CMS, upscaled, operator-approved). No fabricated photos.
4. **Evidence-only stances, 100% citation, honest blanks** ✓ — 17 stances across 5 members; 0 uncited; 0 judicial/retired topics; rent-regulation blank (no RSO); thin Nov-2024 members (Diaz 1, Gutierrez 3) honestly light; chairs model.
5. **Browse renders roster+photos+stances, no duplicate/stale rows** ✓ — dual-chamber merged to one; orphan "West Covina Mayor" LOCAL_EXEC row removed; split-section check 0 rows.

## Live DB verification (2026-06-21)
geo_id 0684200 ✓ · council_chambers 1 ✓ · official_count 5 ✓ · offices 5 ✓ · bidirectional 5 ✓ · distinct_districts 5 ✓ · LOCAL_EXEC 0 ✓ · default_images 5 ✓ · stances 17 ✓ · uncited 0 ✓

## Migrations
Structural (registered): 1010 reconcile, 1011 complete. Audit-only (not registered; ledger stays 1011): 1012 headshots, 1013–1017 stances. All committed to EV-Accounts.

## Out-of-scope note (operator-raised at checkpoint, investigated)
Browse shows 7 school districts for West Covina — confirmed CORRECT geography (7 distinct unified districts' TIGER boundaries intersect the city; top 3 ≈ 98%, bottom 4 are ≤1.2% slivers). No defect, not touched by this phase. Logged as a browse min-coverage-threshold follow-up (see memory `project_browse_school_district_slivers`).

**Operator approved both blocking human-verify checkpoints (headshots, stances) on 2026-06-21.**

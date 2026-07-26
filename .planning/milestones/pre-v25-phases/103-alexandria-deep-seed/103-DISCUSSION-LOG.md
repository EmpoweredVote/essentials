# Phase 103: Alexandria Deep Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** 103-alexandria-deep-seed
**Areas discussed:** ACPS district model, G5420 loader approach, Migration structure, Accounts v2.10 coordination

---

## ACPS District Model

| Option | Description | Selected |
|--------|-------------|----------|
| 1 SCHOOL district, all 9 share it | Single TIGER UNSD geo_id for Alexandria City SD. All 9 board members link to the same SCHOOL district row. Any Alexandria resident sees all 9 members. Clean, matches OR/CA school pattern. | ✓ |
| 3 SCHOOL districts, 3 members each | 3 separate TIGER geo_ids for the 3 electoral zones. Residents see only their zone's 3 members. Requires TIGER to have 3 UNSD entries for Alexandria. | |

**User's choice:** 1 SCHOOL district, all 9 share it
**Notes:** The "3 school districts" in ROADMAP refers to electoral zones within ACPS, not separate TIGER UNSD entries. TIGER likely has a single UNSD for Alexandria City Public Schools.

---

## G5420 Loader Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Insert directly in the migration | Add the ACPS geo_id row directly to geofence_boundaries in the migration SQL. Self-contained, no loader changes needed. VA G5420 loader coverage can be done later. | ✓ |
| Extend the VA TIGER loader + re-run | Add G5420 to the Phase 100 loader config and re-run it for state='51'. Loads all ~130 VA school districts now. | |

**User's choice:** Insert directly in migration
**Notes:** DB confirmed zero VA G5420 rows. The loader approach is deferred — a future dedicated phase can extend VA school coverage statewide.

---

## Migration Structure

| Option | Description | Selected |
|--------|-------------|----------|
| 3 plans: city (01) + ACPS (02) + headshots (03) | Each migration is focused. City government and ACPS are independently testable. Headshots as a separate pass matches SF/SD/OR patterns. | ✓ |
| 2 plans: city + ACPS together (01) + headshots (02) | Combines city government + ACPS into one migration. More compact but harder to debug. | |
| 2 plans: city (01) + ACPS + headshots together (02) | Separates governments but combines ACPS officials with their headshots. | |

**User's choice:** 3 plans
**Notes:** Migration numbers 312 (city), 313 (ACPS), 314 (headshots). Matches next migration in STATE.md (312).

---

## Accounts v2.10 Coordination

| Option | Description | Selected |
|--------|-------------|----------|
| No — proceed as planned, fully independent | Phase 103 runs as designed. tiger_geoid stays NULL on new Alexandria districts. photo_origin_url is Accounts' concern; Alexandria officials are out of scope for VAIN-03. | ✓ |
| Yes — coordinate on photo_origin_url | Phase 103 headshots plan should populate photo_origin_url once Accounts adds the column. Adds a dependency. | |
| Yes — wait for VAGE-03 before Phase 103 | Block Phase 103 until Accounts completes tiger_geoid backfill. | |

**User's choice:** No — fully independent
**Notes:** User shared Accounts v2.10 requirements (VAIN/VAGE/VAST/VAFI). DB confirmed: tiger_geoid column exists (nullable), geo_districts table exists (zero VA rows), photo_origin_url column does NOT exist on politician_images. VAIN-02 references migration 311 already applied by Phase 102. VAGE-03 targets SLDL/SLDU — LOCAL/SCHOOL districts stay NULL. No ordering dependency.

---

## Claude's Discretion

None — all areas had a user selection.

## Deferred Ideas

- VA statewide G5420 loading (all ~130 VA school divisions) — future phase
- `photo_origin_url` backfill for Alexandria officials — once Accounts team adds the column via VAIN-03

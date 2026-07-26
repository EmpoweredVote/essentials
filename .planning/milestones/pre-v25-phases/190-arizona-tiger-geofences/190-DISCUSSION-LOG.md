# Phase 190: Arizona TIGER Geofences - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-08
**Phase:** 190-arizona-tiger-geofences
**Areas discussed:** Tribal lands (aiannh), Place-layer breadth, Unincorporated communities (cousub), SLDL 2-seat multi-member

---

## Tribal lands (`aiannh`)

| Option | Description | Selected |
|--------|-------------|----------|
| Skip aiannh (NV precedent) | Match NV D-02: no tribal-government representation this milestone; San Xavier / Pascua Yaqui / Navajo route to county/city only; avoids cross-state NAMELSAD-allowlist complexity | ✓ |
| Load aiannh for AZ | Load tribal boundaries because Tohono O'odham + Pascua Yaqui are in-metro; adds complexity, no roster to attach | |

**User's choice:** Skip aiannh (NV precedent)
**Notes:** AZ has Tucson-metro reservations (San Xavier District of Tohono O'odham, Pascua Yaqui) — surfaced specifically because they're closer to the deep-seed core than NV's were. Decision still matches NV D-02; deferred to a future tribal-coverage milestone.

---

## Place-layer breadth

| Option | Description | Selected |
|--------|-------------|----------|
| All AZ places statewide (NV precedent) | Load all ~90+ AZ incorporated places; enables future city coverage with zero re-load; add city-vintage assertions for the 5 in-scope cities | ✓ |
| Tucson-metro cities only | Load just the 5 in-scope cities; future coverage needs a place re-load | |

**User's choice:** All AZ places statewide (NV precedent)
**Notes:** Consistent with every prior state; Phoenix/Maricopa and other future waves need no geofence re-load.

---

## Unincorporated communities (`cousub`)

| Option | Description | Selected |
|--------|-------------|----------|
| Skip cousub, county-only (NV precedent) | Catalina Foothills / Casas Adobes / Tanque Verde / Drexel Heights route to Pima County, no city, no township | ✓ |
| Load cousub subdivisions | Adds township geometry with no attached government | |

**User's choice:** Skip cousub, county-only (NV precedent)
**Notes:** Direct AZ analog of the Las Vegas Strip unincorporated case — a headline correctness check for the smoke test.

---

## SLDL 2-seat multi-member

| Option | Description | Selected |
|--------|-------------|----------|
| Just note it, no discussion needed | Record the 30-SLDL-polygon fact + 2-seat handling as a canonical note for Phase 192 (MD NOT-EXISTS-guard GOTCHA); nothing to decide at the geofence tier | ✓ |
| Discuss it now | Talk through multi-member implications before locking | |

**User's choice:** Just note it, no discussion needed
**Notes:** Geofence tier just loads 30 SLDU + 30 SLDL polygons. The 2-seat/(district_id, politician_id) guard is a Phase 192 seeding concern; captured as D-04 for inheritance.

---

## Claude's Discretion

- Exact `smoke-az-geofences.ts` verification addresses (per tier + one unincorporated Pima County address).
- `--dry-run` first to confirm layer counts + exact NAMELSAD vintage strings.
- Inline DB pre-check for any pre-existing AZ (`state='04'`) geofence rows before load.

## Deferred Ideas

- Arizona tribal/reservation (`aiannh`) geofences — future milestone.
- Unincorporated-community (`cousub`) boundaries — only if AZ advisory bodies become in-scope.
- Phoenix / Maricopa County + statewide AZ city coverage — out of scope for v22.0.

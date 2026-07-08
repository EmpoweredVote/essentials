# Phase 165: Boulder City Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-29
**Phase:** 165-boulder-city-deep-seed
**Areas discussed:** Routing model, Carry-forward template, Office scope, Boulder City specifics

---

## Routing model

| Option | Description | Selected |
|--------|-------------|----------|
| Single-city at-large | All 5 (Mayor + 4 at-large council) on the one G4110 geofence (3206500); no ward loader, no custom MTFCC | ✓ |
| Attempt ward geofences | Try to build ward polygons anyway | |

**User's choice:** Single-city at-large (Recommended)
**Notes:** Confirmed by research — Boulder City special-charter council/manager form elects Mayor + 4 at-large members; no council wards exist. Single-city-district model becomes PRIMARY (not a fallback). Removes the ward-boundary loader + custom MTFCC from the plan entirely.

---

## Carry-forward template

| Option | Description | Selected |
|--------|-------------|----------|
| Carry forward all | Adopt the 163/164 deep-seed template wholesale with Boulder City identifiers (standalone govt 3206500, -3208xxx IDs, structural+audit migration split, conventions) | ✓ |
| Let me adjust specifics | Change something in the template before planning | |

**User's choice:** Carry forward all (Recommended)
**Notes:** Wave-0 verifies live roster/IDs before any write.

---

## Office scope

| Option | Description | Selected |
|--------|-------------|----------|
| Mayor + Council only | Defer the elected Municipal Court judge to a future judicial-compass phase; exclude non-elected offices | ✓ |
| Include Municipal Court judge | Seed the judge now with the 6-spoke judicial compass | |

**User's choice:** Mayor + Council only (Recommended)
**Notes:** Parity with LV/Henderson/NLV — keeps the NV city set consistent, avoids the judicial topic set.

---

## Boulder City specifics

| Option | Description | Selected |
|--------|-------------|----------|
| Flag for emphasis | All-topics + evidence-only, but research leads with controlled-growth ordinance, no-gambling charter, solar-land lease | ✓ |
| Standard approach only | Standard all-live-topics sweep, no special emphasis | |

**User's choice:** Flag for emphasis (Recommended)
**Notes:** These are Boulder City's richest local-evidence areas (growth-and-development, economic-development, taxes, local-environment, data-centers). Every placed stance still requires a cited council statement/vote.

---

## Claude's Discretion

- Exact council-office district structure under the single-city model (recommend 1 shared LOCAL district on 3206500 + 1 LOCAL_EXEC Mayor).
- Chamber name ("Boulder City City Council" vs "Boulder City Council").
- Exact external_id assignment within the confirmed −3208xxx block.
- Migration numbering (next on-disk is 1100; Wave-0 re-verifies on-disk MAX).

## Deferred Ideas

- Boulder City elected Municipal Court judge — future judicial-compass phase.
- Non-elected city offices (City Attorney, City Manager, City Clerk) — out of scope.
- Ward-precise routing / ward geofences — not applicable (at-large city); intentionally not built.

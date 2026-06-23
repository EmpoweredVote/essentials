# Phase 158: Nevada TIGER Geofences - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 158-nevada-tiger-geofences
**Areas discussed:** Tribal lands (aiannh), Unincorporated towns (cousub), Place-layer breadth

---

## Gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Tribal lands (aiannh) | Load NV reservation/tribal boundaries like Utah | ✓ |
| Unincorporated towns (cousub) | Load Paradise/Spring Valley/Enterprise township boundaries vs county-level | ✓ |
| Place-layer breadth | All ~19 NV incorporated cities vs just the 5 metro cities | ✓ |
| None — accept all recs | Lock all three to recommendations | ✓ |

**User's choice:** Selected all four (all three topics + accept-all-recs).
**Notes:** Resolved toward "acknowledged all three — accept the recommendations." User is highly experienced (17 prior state/city deep-seeds); recommendations are Nevada-specific and well-grounded. Each locked decision surfaced explicitly for veto in the confirmation step.

---

## Tribal lands (aiannh)

| Option | Description | Selected |
|--------|-------------|----------|
| Skip aiannh | No tribal-gov scope this milestone; avoids cross-state NAMELSAD complexity | ✓ |
| Load aiannh | Resolve on_reservation for Las Vegas Paiute/Moapa/Fort Mojave addresses | |

**User's choice:** Skip (D-02).
**Notes:** Defer to a future milestone only if tribal-government coverage is added.

## Unincorporated towns (cousub)

| Option | Description | Selected |
|--------|-------------|----------|
| County-level only | Strip → Clark County Commission; towns are advisory-only | ✓ |
| Load cousub | Add Paradise/Spring Valley/etc. township polygons | |

**User's choice:** County-level only (D-03).
**Notes:** Directly satisfies success-criterion #1 (Strip → county, no city, no township).

## Place-layer breadth

| Option | Description | Selected |
|--------|-------------|----------|
| All statewide (~19) | Load full NV G4110 set; enables future city coverage, no re-load | ✓ |
| Metro only (5) | Just the in-scope cities | |

**User's choice:** All statewide (D-04).

---

## Claude's Discretion

- Exact verification addresses for `smoke-nv-geofences.ts`.
- `--dry-run` first to confirm counts + exact NAMELSAD vintage strings.

## Deferred Ideas

- Nevada tribal/reservation (aiannh) geofences — future milestone.
- Unincorporated-town (cousub) boundaries — only if NV town advisory boards become in-scope.
- Washoe County / Reno–Sparks and rural NV deep-seeds — future Nevada waves.

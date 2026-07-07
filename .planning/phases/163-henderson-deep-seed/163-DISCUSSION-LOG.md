# Phase 163: Henderson Deep-Seed — Discussion Log

**Date:** 2026-06-28
**Mode:** discuss (default)

Human-reference record only — not consumed by downstream agents (see 163-CONTEXT.md for the canonical decisions).

## Gray areas presented (user selected all 4)
1. Ward vs at-large routing
2. Office scope (judges?)
3. Mayor / seat-count model
4. Headshot sourcing

Carry-forward decisions from Phase 162 (Las Vegas) were stated up front and not re-asked: standalone government, directly-elected-Mayor-as-distinct-seat, one-agent-at-a-time evidence-only stances, headshot pipeline, executor/orchestrator split, next migration 1084, Wave-0 collision probe, section-split scan.

## Decisions

### Ward routing
- Options: **Ward geofences + fallback (Rec.)** / Single-city only
- Selected: **Ward geofences + fallback** → D-01 / D-01b. Build custom Henderson ward geofences (new MTFCC, mirror LV X0015) for ward-precise routing; single-city fallback if polygons unsourceable or Henderson is pure at-large; never hard-block.

### Office scope
- Options: **Mayor + Council only (Rec.)** / Include elected judges
- Selected: **Mayor + Council only** → D-02. Defer Henderson Municipal Court judges to a future judicial-compass phase (parity with LV).

### Mayor / seat-count model
- Options: **Carry LV D-02 model (Rec.)** / Discuss / differs
- Selected: **Carry LV model** → D-03. Directly-elected at-large Mayor (Romero), distinct seat, sorted first, NOT rotational; Wave-0 verifies roster + official_count (expected Mayor + 4 wards = 5).

### Headshot sourcing
- Options: **Carry D-05 resilient chain (Rec.)** / Discuss sourcing
- Selected: **Carry resilient chain** → D-06. cityofhenderson.gov first → UA/curl workarounds → free alternates → documented gap. 600×750, no overlays/fabrication.

## Deferred ideas
- Henderson elected Municipal Court judges (future judicial phase)
- Permanent single-city fallback (only if ward sourcing fails)
- Non-elected city offices (City Attorney, City Manager)
- Reusing the ward-geofence pipeline for North Las Vegas (Phase 164)

## Claude's discretion items
Ward-polygon data source + loader adaptation, exact new MTFCC, exact −3206xxx external_id block, migration numbering (next 1084, verify on-disk MAX), chamber name, per-ward title labels.

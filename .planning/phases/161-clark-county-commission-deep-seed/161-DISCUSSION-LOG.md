# Phase 161 Discussion Log

**Date:** 2026-06-23
**Mode:** discuss (default)

## Areas selected for discussion
All 4 presented gray areas selected: Commissioner routing granularity, Chair modeling + chamber name, Government modeling + IDs, Stance topic scope.

## Q1 — Commissioner routing granularity
- Options: (A) all 7 on county polygon [Recommended] · (B) per-district A–G geofences
- **Selected: A** — all 7 on the single COUNTY district (geo_id 32003), mirroring Multnomah. No new non-TIGER geofence pipeline.

## Q2 — Chair modeling + chamber name
- Options: (A) title-on-seat, "Board of County Commissioners" [Recommended] · (B) separate Chair office
- **Selected: A** — Chair = title on commissioner seat (Kirkpatrick), Chair sorts first; no phantom 8th seat.

## Q3 — Government modeling + IDs
- Options: (A) standalone "Clark County, Nevada, US" [Recommended] · (B) nested under State of Nevada
- **Selected: A** — standalone county government, offices link to county district geo_id 32003, new external_id block (Wave-0 probe).

## Q4 — Stance topic scope + headshots
- Options: (A) all live topics, evidence-only, clarkcountynv.gov [Recommended] · (B) local-relevant subset
- **Selected: A** — full compass, one-at-a-time, evidence-only, zero defaults; headshots clarkcountynv.gov.

## Deferred
- Per-commission-district geofences; Clark County row officers; Mesquite.

## Claude's discretion
- Exact external_id range; migration split; per-commissioner district label; migration counter (1055, confirm in Wave-0).

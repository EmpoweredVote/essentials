# Phase 164: North Las Vegas Deep-Seed — Discussion Log

**Date:** 2026-06-28
**Mode:** discuss (default)

This log is for human reference (audits, retrospectives). Downstream agents read CONTEXT.md, not this file.

---

## Area: Discussion scope

**Context presented:** Phase 164 (North Las Vegas) is the 4th city deep-seed in a pattern locked across Phases 161 (Clark County), 162 (Las Vegas), and 163 (Henderson). Henderson's CONTEXT.md is effectively the template. Most decisions (standalone government, at-large Mayor sorted first, custom ward geofences + single-city fallback, evidence-only stances, headshot fallback chain, coverage.js surfacing, deferred Municipal Court judges) carry forward automatically.

**Options presented:**
- Carry forward all (recommended)
- Ward routing granularity
- Office scope
- Headshot sourcing

**User selection:** Carry forward all (recommended)

**Notes:** Operator confirmed the Henderson template applies wholesale. The one flagged genuine unknown — NLV's `cityofnorthlasvegas.com` headshot sourcing behavior (clean Azure-blob like LV vs Akamai-403 like Henderson) — is absorbed by the established per-member fallback chain (D-06), so no separate decision was needed. Wave-0 research verifies the live roster, seat count, geo_id (expected FIPS 3251800), ward-polygon source, MTFCC (likely X0017), external_id block (likely −3207xxx), and on-disk migration MAX (expected next = 1091).

---

## Deferred Ideas

- North Las Vegas elected Municipal Court judges → future judicial-compass phase.
- Non-elected city offices (City Attorney, City Manager) → out of scope.
- Generalizing the ward-geofence pipeline to Boulder City (Phase 165) if the NLV loader proves reusable.

## Claude's Discretion (delegated to research/planning)
- Ward-polygon data source + ingestion mechanism.
- Exact new MTFCC, external_id range, chamber name, per-ward display labels.
- Migration numbering (verify on-disk MAX +1).

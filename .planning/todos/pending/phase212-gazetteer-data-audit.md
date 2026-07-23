---
title: Audit Phase 212 gazetteer place data (encoding + invalid records)
type: bug
priority: high
created: 2026-07-21
source: phase-214 human verification (214-06)
domain: backend/data (accounts-api / gazetteer ingestion) — NOT essentials frontend
---

# Audit Phase 212 gazetteer place data

Surfaced while verifying the Phase 214 LocationCombobox against the live
`/essentials/location-search` resolver. The combobox renders faithfully; the
defects are in the ingested place data.

## Problem A — UTF-8 mojibake in labels
Non-ASCII place names come back corrupted. Confirmed live:
- `geo_id 3510470` → label `"CaÃ±ada de los Alamos CDP, NM"` — should be
  `"Cañada de los Alamos"`. `ñ` (UTF-8 `0xC3 0xB1`) was read as Latin-1 `Ã±`.

This is the tab-delimited Census gazetteer ingestion reading bytes with the wrong
encoding (see memory: gazetteer tab-delim gotcha, Phase 212). Likely affects every
place name with accented characters (ñ, á, é, í, ó, ü, etc.).

## Problem B — invalid / inconsistent place records
- `geo_id 4844062` → `"Los Angeles CDP, TX"` with `mtfcc G4110`. G4110 is
  *incorporated place*, but the name is suffixed "CDP" (Census Designated Place).
  Name-type and MTFCC disagree; the record's validity is questionable.

## Action
1. Re-ingest the gazetteer with explicit UTF-8 decoding; verify accented names.
2. Audit MTFCC vs. name-suffix ("CDP" / "city" / "town") consistency; fix or drop
   mismatched/invalid rows.
3. Spot-check a sample of CDP records against the authoritative Census gazetteer.

Scope: data pipeline / accounts-api (C:/EV-Accounts), not this repo.

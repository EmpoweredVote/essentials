# Phase 64: San Jose Deep Seed - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fully seed San Jose city government — structure, all incumbents, and headshots — so any San Jose address returns a complete local officials list. Includes council district geofences, government/chamber/district DB scaffolding, politicians + offices, and 600×750 headshots in Supabase Storage. Elections seeding is Phase 69.

</domain>

<decisions>
## Implementation Decisions

### City structure scope
- Standard pattern: 1 LOCAL_EXEC district (geo_id='0668000') for citywide offices (Mayor + any elected citywide officials)
- 10 LOCAL districts for council districts (sj-council-district-1 through sj-council-district-10)
- Council title format: `Council Member (District N)` — consistent with Berkeley/SD/Fremont
- City Attorney and City Auditor: **Claude's discretion** — research San Jose charter to determine which are popularly elected; include only elected offices (follow is_appointed_position=true pattern for appointed roles)
- RCV flag: Add a TODO comment in the migration noting RCV for Phase 69 reference (same as Berkeley pattern) — no functional change now

### Council geofences
- MTFCC: **X0010** (next available after X0009=Berkeley)
- geo_id format: `sj-council-district-{1-10}`
- Data source type (Socrata vs ArcGIS): **Claude's discretion** — researcher identifies the actual endpoint (data.sanjoseca.gov Socrata or ArcGIS FeatureServer) and applies the correct projection handling (no outSR=4326 for Socrata; outSR=4326 required for ArcGIS)
- District field name in source data: **Claude's discretion** — researcher inspects actual schema (Berkeley used 'district' string; SD used DISTRICT integer)
- state='06' in geofence_boundaries rows (consistent with all CA city loaders)

### External ID scheme
- Mayor: **-640001**
- City Attorney (if elected): **-640002**
- City Auditor (if elected): **-640003**
- Council D1–D10: **-640010 through -640019**
- Pre-flight required: confirm range -640001..-640019 is clear before migration

### Headshots
- Primary source: sanjoseca.gov official portraits
- If 403 blocked: Node.js User-Agent spoof (same workaround as Fremont)
- Final fallback: Wikipedia/Wikimedia Commons CC0 verified
- Headshot migration: **audit-only SQL** (outside numbered migration ledger), consistent with 209_sd_headshots.sql, 212_fremont_headshots.sql, 215_berkeley_headshots.sql pattern
- Sourcing strategy documented in CONTEXT.md; executor decides when to invoke /find-headshots skill

### Claude's Discretion
- Whether City Attorney / City Auditor are elected vs. appointed (research San Jose charter)
- Geofence data source type (Socrata vs ArcGIS) and exact field names
- Smoke test coordinate for routing verification (pick a known SJ council district address)

</decisions>

<specifics>
## Specific Ideas

- Berkeley/Fremont/SD pattern: section-split detector SQL (zero rows = clean) must run after officials seed
- Berkeley's Socrata loader (data.cityofberkeley.info) required NO outSR=4326 — verify if data.sanjoseca.gov behaves the same
- Next applied migration after 214 (Berkeley officials) is **215** — San Jose government structure migration lands at 215

</specifics>

<deferred>
## Deferred Ideas

- San Jose 2026 election rows and discovery_jurisdictions — Phase 69
- RCV election_method functional implementation for SJ chambers — Phase 69

</deferred>

---

*Phase: 64-san-jose-deep-seed*
*Context gathered: 2026-05-22*

# Phase 66: Sacramento Deep Seed - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fully seed Sacramento's city government: council district geofences, government structure, all popularly elected officials as politicians with linked office rows, and headshots — so any Sacramento address returns a complete local officials list. Scope covers all offices a Sacramento voter can cast a ballot for per the city charter.

</domain>

<decisions>
## Implementation Decisions

### Charter scope
- **CORRECTED (research + user confirmed 2026-05-23):** 2 chambers only — Mayor and City Council
- City Attorney, City Auditor, City Treasurer, and City Clerk are ALL **APPOINTED** by City Council — confirmed by appointment records (Ahrary Oct 2024, Martinez Feb 2026)
- **9 politicians total:** Mayor Kevin McCarty + 8 Council Members (D1-D8)
- Original discussion assumed 6 chambers / 13 politicians — this was wrong; corrected before planning

### RCV election method
- **CORRECTED (research + user confirmed 2026-05-23):** Sacramento has NOT adopted RCV
- Sacramento uses a two-round runoff system (June primary + November runoff)
- "Measure L, 2022" in original discussion was the Children's Fund — not an RCV measure
- Better Ballot Sacramento RCV initiative was still collecting signatures as of May 2026
- Migrations note Sacramento uses two-round runoff; conditional comment only if RCV passes in future

### Council geofences
- MTFCC: X0011 (next available; sequential pattern: X0005=LA County, X0006=SF, X0007=SD, X0008=Fremont, X0009=Berkeley, X0010=SJ, X0011=Sacramento)
- geo_id pattern: `sacramento-council-district-{1-8}`
- Boundary source: researcher finds the best source (Sacramento open data portal or ArcGIS REST services — do not assume)
- Note: outSR=4326 likely required if source uses CA State Plane projection

### Headshots
- Primary source: cityofsacramento.gov official bio/council pages
- Fallback: Wikipedia / Wikimedia Commons
- If cityofsacramento.gov returns 403: try Node.js browser User-Agent + Referer header workaround (same technique that worked for Fremont) before abandoning
- Headshots SQL written as audit-only file (not applied as a numbered migration) — matches sf/sd/fremont/sj pattern
- All headshots: 600×750 JPEG, q90, Lanczos resize, type='default' in politician_images

### Claude's Discretion
- Exact LOCAL_EXEC district sharing pattern for all citywide offices (follow established pattern from Berkeley/SJ)
- ArcGIS vs. Socrata loader approach for geofences (researcher picks based on available endpoint)
- Specific boundary field name in the source dataset (researcher identifies DISTRICTINT equivalent for Sacramento)

</decisions>

<specifics>
## Specific Ideas

- "Full charter coverage" — every office a Sacramento voter can vote for should be in this phase
- Sacramento is a strong-Mayor charter city; researcher should confirm whether any positions are appointed (e.g. City Manager) vs. elected before including them

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 66-sacramento-deep-seed*
*Context gathered: 2026-05-23*

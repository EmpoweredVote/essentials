# Phase 54: ME City Officials Tiers 2-4 - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Mayor and City Council incumbents for Maine's 5 Tier 2 cities (Lewiston, Bangor, South Portland, Auburn, Biddeford). Document known gaps for the remaining 18 cities with explicit gap status. Upload headshots for Tier 2 officials where available on official city websites.

All 23 city governments already have skeletal office rows from Phase 53 (migration 177). This phase fills in the 5 Tier 2 cities and formally marks the 18 others as deferred with documented status.

School board, discovery pipeline, and election seeding are separate phases (54.x / 55).

</domain>

<decisions>
## Implementation Decisions

### Office Scope — Tier 2 Cities
- **Council only**: Mayor + City Council seats. No school board for Tier 2.
- Vacant or unresolvable seats: leave `politician_id=NULL` and document in GAPS.md as known gaps
- Partial seeding is fine: seed what we find, null the rest — do not hold a city back until fully complete
- Contact data: **email only** if listed on city website — do not hunt for phone or social

### Tier 2 City Priority Order
If research runs long, prioritize in this order:
1. **Lewiston** (largest ME city after Portland)
2. **Bangor**
3. **South Portland**
4. **Auburn**
5. **Biddeford**

All 5 must be attempted for phase completion; Auburn and Biddeford may have more gaps if web presence is thin.

### Election Method
- Researcher must verify whether any Tier 2 city uses RCV (Lewiston and Bangor are the likely candidates)
- If yes: set `election_method='rcv'` on the city's council chamber — same pattern as Portland in migration 177
- If standard plurality: leave default

### External ID Scheme
- Derive from city geo_id: take the geo_id, abbreviate as prefix, then add a 4-digit seat sequence
- Pattern: `-{geo_id_prefix}{4-digit-seq}` — e.g. Lewiston geo_id=2341070 → prefix `-234`, IDs start at `-2341001`
- Consistent and traceable; same logic as Portland's `-23601001` scheme

### Plan Structure (3 plans — keep roadmap structure)
- **54-01**: Migration — Lewiston + Bangor + South Portland incumbents
- **54-02**: Migration — Auburn + Biddeford incumbents + GAPS.md creation
- **54-03**: Headshots — all 5 Tier 2 cities from official city websites; headshot column in GAPS.md

### Gap Documentation — Remaining 18 Cities
- File: `.planning/phases/54-me-city-officials-tiers-2-4/GAPS.md`
- Granularity: **city-level rows only** (not per-office)
- Status states (two only):
  - `not attempted` — left for a future phase
  - `no web presence` — researcher looked, found no usable data
- All 18 remaining cities are strictly `not attempted` in Phase 54 — no opportunistic seeding

### Headshot Sourcing
- **Official city website only**: council bios page or city-operated directory
- Per-person clicks are fine if no bulk API exists — same pattern as ME House in Phase 52
- Low-res photos (under 200px wide): upscale to 600×750 with Lanczos — approved precedent from Phase 52 thumbnails
- No superimposed text or graphics allowed on any headshot
- If no photo found on official city site: mark as `source not found` in GAPS.md headshot column

### Claude's Discretion
- Migration numbering within the 180+ range (next is 180)
- Exact SQL structure for incumbents (follow Portland migration 178/179 patterns)
- Whether to use a generator script or manual INSERT for Tier 2 (researcher decides based on city count)

</decisions>

<specifics>
## Specific Ideas

- Portland's external ID pattern (-23601001) is the established model — derive Tier 2 IDs the same way from each city's geo_id
- Phase 52 (ME House) set the upscale-low-res precedent; Phase 54-03 follows it without case-by-case approval
- GAPS.md serves double duty: seeding gaps + headshot gaps in one city-level table

</specifics>

<deferred>
## Deferred Ideas

- **School board seeding for Tier 2 cities** — ~25-35 more officials; belongs in a Phase 54.5 or later
- **Remaining 18 cities — prioritized order for a future phase:**
  1. Augusta (state capital — highest political prominence)
  2. Saco
  3. Westbrook
  4. Sanford
  — Then remaining 14 by population descending
- **Discovery pipeline for Tier 2 cities** — Phase 55 scope
- **ME 2026 elections for Tier 2 city races** — Phase 55 scope

</deferred>

---

*Phase: 54-me-city-officials-tiers-2-4*
*Context gathered: 2026-05-19*

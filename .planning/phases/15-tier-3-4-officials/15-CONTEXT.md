# Phase 15: Tier 3-4 Officials — Remaining 16 Cities - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed incumbent officials for all 16 remaining Collin County cities: 8 Tier 3 (Anna, Melissa, Princeton, Lucas, Lavon, Fairview, Van Alstyne, Farmersville) and 8 Tier 4 (Parker, Saint Paul, Nevada, Weston, Lowry Crossing, Josephine, Blue Ridge — Copeville excluded, possibly unincorporated). Every politician row linked to an existing office_id from Phase 12. Finding and seeding headshots, stances, and discovery jurisdiction setup are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Research sources
- Primary source: each city's official website (council page, staff directory, or meeting minutes)
- Fallback: Collin County Elections results + meeting minutes — cap effort at these two sources per city
- Election results: certified results only — do not seed based on unofficial May 3, 2026 returns; if certification is pending, seed pre-election incumbents and flag for update
- Tier 3 gets meaningful research effort; Tier 4 gets a quick pass only (city website alone is sufficient before moving on)

### "Not findable" documentation
- Document unfindable cities with a SQL comment block in the migration: `-- NOT FOUND: [City] — [reason]`
- Tier 3 threshold: city website + one county source must both come up empty before marking as not findable
- Tier 4 threshold: city website alone is sufficient — if no roster there, mark as not findable and move on
- Partial rosters are fine: seed all confirmed incumbents even if only mayor is findable; leave other seats blank rather than skipping the city entirely

### Migration batching
- Migration 097: all 8 Tier 3 cities (Anna, Fairview, Farmersville, Lavon, Lucas, Melissa, Princeton, Van Alstyne — alphabetical order)
- Migration 098: all 8 Tier 4 cities (Blue Ridge, Josephine, Lowry Crossing, Nevada, Parker, Saint Paul, Weston — alphabetical; Copeville excluded)
- Commit both migrations even if Tier 4 is nearly empty — the not-found SQL comments are the audit record
- Within each migration, cities appear alphabetically; within each city, mayor row first then council places in order
- Phase has 2 plans: 15-01 (Tier 3, migration 097) and 15-02 (Tier 4, migration 098)

### Contact info threshold
- No numeric target — best-effort only; NULL is explicitly acceptable and expected for most Tier 3-4 politicians
- Capture email or official URL if it exists on the city's own web presence; do not hunt beyond that
- Official domains only (city .gov / .org / city-owned site) — Facebook pages and social media links are not acceptable even as a fallback
- No email pattern derivation — only confirmed emails from the city website; no guessing firstname.lastname@city-tx.gov patterns
- When no contact info exists, urls[] = NULL / empty array; do not fall back to city homepage as a proxy contact

### Claude's Discretion
- Exact migration comment wording for not-found cities
- How to handle seats where the office exists in DB but no incumbent is identifiable (leave seat empty — no placeholder row)

</decisions>

<specifics>
## Specific Ideas

- Princeton has 8 council seats (Mayor + Place 1-7) — confirmed from prior research; don't assume 7 like other cities
- Fairview is legally a Town — use 'Town of Fairview' and 'Town Council' in any name references
- Copeville (GEOID 4816600) is excluded — possibly unincorporated CDP; do not attempt seeding

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-tier-3-4-officials*
*Context gathered: 2026-05-01*

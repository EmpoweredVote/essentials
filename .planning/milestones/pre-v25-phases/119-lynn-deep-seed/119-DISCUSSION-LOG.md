# Phase 119: Lynn Deep Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 119-lynn-deep-seed
**Areas discussed:** Headshot fallback strategy, Migration scope confirmation, Council structure

---

## Headshot Fallback Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Document all as gaps, move on | Accept the block, document 0/N headshots, move on. Lynn officials are less prominent than state reps; gaps are honest per LYNN-02 best-effort requirement. | ✓ |
| Try common fallback sources | Attempt LinkedIn, Ballotpedia, campaign sites for each councillor. More thorough but adds significant time; may still yield few results for local officials. | |
| Partial: Mayor + 2-3 councillors | Middle ground — put effort into Mayor headshot (high-value), spot-check 2-3 councillors, document the rest as gaps. | |

**User's choice:** Document all as gaps, move on (if lynnma.gov is blocked)
**Notes:** If lynnma.gov is accessible (like Somerville), use standard CMS probing. The "document and move on" decision only applies when the site is blocked like Newton's CivicEngage.

---

## Migration Scope Confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Mayor + City Council only — 2 migrations | Migration 584 city gov + 585 headshots. No school committee. Matches ROADMAP exactly. | |
| Include School Committee too | Adds a 3rd migration. Not in current ROADMAP scope for Phase 119. | |
| Check if Lynn has other elected bodies first | Researcher verifies whether Lynn has elected bodies beyond Mayor + Council. Add if found. | ✓ |

**Follow-up:** If school committee or other elected board found, include in Phase 119 (same approach as Newton).
**User's choice:** Check first; include elected school committee if found (consistent with Newton Phase 117 depth)
**Notes:** This means migration count is flexible (2 or 3 migrations) pending researcher findings on Lynn's government structure.

---

## Council Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Researcher verifies from lynnma.gov | Follows Somerville/Newton pattern — researcher fetches official roster, confirms seat count, ward vs at-large breakdown, councillor names. | ✓ |
| User describes structure now | User has specific knowledge of Lynn's council. | |

**User's choice:** Researcher verifies from lynnma.gov
**Notes:** Researcher should also verify the correct title spelling (City Councilor vs. City Councillor) from the official city site.

---

## Claude's Discretion

- External ID scheme: follow established geo_id prefix pattern (-2537490xxx for city officials)
- School committee geo_id: use NCES LEAID value (if school committee included)
- MA state/district casing conventions: carry forward from Newton/Somerville (governments.state='MA' uppercase, districts.state='ma' lowercase)

## Deferred Ideas

None — discussion stayed within phase scope.

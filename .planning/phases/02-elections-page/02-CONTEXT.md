# Phase 2: Elections Page - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

A standalone `/elections` route that is tier-aware on arrival: Connected users with a stored jurisdiction see their election results immediately (no address input shown). Connected users without a jurisdiction, and unauthenticated (Inform) users, see an address input with two county shortcut buttons. Users who have results displayed can change the location. Candidate order uses the existing seeded-shuffle logic — not broken, just preserved.

Phase 3 handles unopposed and zero-candidate race UX. Phase 4 handles navigation links to this page.

</domain>

<decisions>
## Implementation Decisions

### County Shortcuts (Monroe County, LA County)
- Clicking a shortcut **immediately fetches results** — no pre-fill of the address input
- These are alpha demo buttons for visitors who don't live in those areas
- **No framing label** — just show the buttons, minimal presentation
- Shortcuts are only visible on **initial load (no results yet)**; they disappear once results are showing

### Address Input
- **Input field + search button** — both Enter key and button click submit
- Placeholder text: `"Enter your address"`
- During fetch: **spinner on the search button** only (no full-page loading state)
- Error handling: **inline message below the input** for both "address not recognized" and "no elections found for this address"
- Connected users with a stored jurisdiction skip this input entirely — auto-load on arrival

### Change Location (Connected Users)
- Connected users with auto-loaded results see: **"Showing elections for [location] · Change"** above their results
- Clicking "Change" keeps the current results visible and shows the address input **above** the existing results
- Entering a new address replaces the results — **does not update the user's stored account jurisdiction**; page-only lookup

### Elections Layout
- **Page-level "Elections" heading** appears above everything (address input or results)
- Multiple elections displayed as **named sections**: election name + date as section header (e.g., "2026 Indiana Primary — May 5")
- Election section header always shown — even when only one election returned
- Within each election section, races are **sub-grouped by government level in this order: Local → County → State → Federal**

### Claude's Discretion
- Exact visual styling of shortcut buttons (pill/chip vs. secondary button)
- Exact positioning of shortcut buttons relative to the address input
- Election section header typography and spacing
- Government-level sub-group label styling (if any label is shown)
- Seeded-shuffle implementation — inherit from existing `ElectionsView.jsx` logic

</decisions>

<specifics>
## Specific Ideas

- County shortcuts are for the alpha audience — people who want to experience the Elections page without living in a covered area. Keep them minimal; don't over-explain them.
- Race ordering within each election: Local first — the races closest to the voter surface before state/federal races.
- The "Showing elections for [location] · Change" pattern gives Connected users visibility into what address their results are for.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-elections-page*
*Context gathered: 2026-04-12*

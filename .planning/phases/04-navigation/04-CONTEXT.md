# Phase 4: Navigation - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface the Elections page via two entry points: a card on the landing page and an item in the site header. Both link to `/elections`. No new capabilities — this phase is purely discoverability.

</domain>

<decisions>
## Implementation Decisions

### Landing page placement
- Elections card sits in its own row, centered, below the county cards
- Positioned between the county cards and the "Browse by location →" link
- Does NOT sit alongside Monroe County / LA County — Elections is a destination, not a coverage area shortcut

### Landing entry style
- Card style matching the existing county cards: white background, teal border, rounded corners, shadow
- Full-width (or near full-width), centered
- Two lines of content: label + subline (not a geographic label like the county cards)

### Landing card copy
- Label: **"Upcoming Elections"**
- Subline: **"See what's on your ballot"**

### Header navigation
- Top-level nav item in the main nav bar, visible on all pages
- Implemented by extending `defaultNavItems` from `@empoweredvote/ev-ui` in `Layout.jsx` (same pattern as the Read & Rank URL injection already present)
- Label: **"Elections"**

### Claude's Discretion
- Exact card width relative to county cards (full-width of the container vs matching card widths)
- Whether the landing card arrow/chevron indicator is included
- How `defaultNavItems` is extended (append vs prepend) — place Elections where it reads naturally in the nav order

</decisions>

<specifics>
## Specific Ideas

- County cards have: teal border, white bg, rounded-lg, shadow-sm, hover:shadow-md — Elections card should match this exactly
- Layout.jsx already modifies `defaultNavItems` inline (Read & Rank URL injection) — Elections nav item should follow that same pattern

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-navigation*
*Context gathered: 2026-04-13*

# Phase 34: Mini Compass Tile Component - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Candidate tiles in compass mode display a mini RadarChartCore (no spoke labels) in the tile's right-side space. The mini compass shows both the user's shape and the candidate's overlapping shape, using the same topic selection as the active full compass. Tiles with insufficient bilateral answers show nothing silently. The hover modal (Phase 35) and global controls bar (Phase 36) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Tile Space Allocation
- Mini compass fills the existing empty right-side space in the tile — no text push, no overlay
- Fixed 120×120px base size; scales proportionally on narrow tiles (two-column grid, mobile)
- No skeleton/placeholder during load — compass renders only once politician data is ready
- Silently absent when <3 total bilateral answers exist for the tile's candidate

### Visual Design
- Both user shape and candidate shape rendered — same two-color scheme as existing CompassCard (not the sketch's red/blue, those were for illustration only)
- Low-opacity filled shapes, same treatment as the full CompassCard
- Full polygon grid: 5-ring background + axis lines — same as full compass
- Subtle circular border/container defines the mini compass area within the tile

### Local Lens Icon — Scope Change
- **No per-tile Local Lens icon on mini compass tiles in Phase 34**
- The lens toggle control belongs in the Phase 36 global controls bar, not on individual tiles
- MINI-04 and MINI-05 as written in the roadmap (per-tile icon) do not apply to this phase
- Per-tile icon is appropriate for Phase 35 (hover modal has a large compass) — not Phase 34
- When icon appears elsewhere: greyscale when Lens off, green when Lens on, silent instant toggle, only present when compass data exists

### Spoke Fallback Display
- **Lens OFF:** mini compass shows the user's currently selected topics — same set and ordering as CompassCard
- **Lens ON:** targets all 8 LOCAL_LENS_TOPICS; if a candidate lacks bilateral answers for some of those 8, fills the remaining slots with non-local bilateral spokes from the scoped pool
  - Replacement (non-local) spokes are visually distinct — different color or weight — so users can see where local-lens data is thin
  - The visual distinction of replacement spokes is the indicator; no separate asterisk or faded chart
- Spoke count matches the full compass (same number as selected, not capped at 3)
- Threshold: if <3 total bilateral answers exist (local + non-local combined), no compass is shown

### Claude's Discretion
- Exact pixel size of the circular border/container
- Exact color and weight of replacement (non-local) spokes vs local lens spokes
- Responsive breakpoint below which "scales proportionally" begins

</decisions>

<specifics>
## Specific Ideas

- User sketched the mini compass directly into a screenshot (C:\tmp\Screenshots\compassontile.jpg): user shape and politician shape as overlapping radar polygons filling the right side of the Karen Ruth Bass tile; Traci Park tile correctly shows no compass (no data)
- "My compass would look the same at the end of each tile, but the overlap of that politician would look different, allowing me to see at a glance if we overlap on a lot of my key issues or not"
- "The small version does not have titles and should have the exact same shape as what it would look like 'enlarged'" — the mini must be a true miniature of the full compass, not a simplified version

</specifics>

<deferred>
## Deferred Ideas

- **Per-tile Local Lens icon** — user confirmed this belongs in the Phase 36 global controls bar, not on individual mini compass tiles; MINI-04 and MINI-05 requirements should be revised before planning
- Hover modal interaction (enlarging a mini compass to full view) — Phase 35

</deferred>

---

*Phase: 34-mini-compass-tile-component*
*Context gathered: 2026-05-12*

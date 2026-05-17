# Phase 42: Cambridge Headshots - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Import 600×750 JPEG headshots for all 16 Cambridge officials into Supabase Storage: 9 City Councillors, 6 School Committee members, and City Manager Yi-An Huang. Siddiqui is 1 politician with 1 headshot despite holding two offices. Photo standards (600×750, 4:5 crop first, Lanczos q90, no text/banners over face) are established project-wide and not subject to discussion.

</domain>

<decisions>
## Implementation Decisions

### Source priority
Try sources in this order, escalating only when prior source has no acceptable photo:
1. cambridgema.gov/Departments/citycouncil/members (official city council page)
2. vote.cambridgecivic.com (Cambridge civic engagement site)
3. Individual campaign/personal sites
4. News and press photos (Boston Globe, Cambridge Day, etc.)
5. Wikipedia as last resort

### Quality bar
Accept any clearly cropped head-and-shoulders photo where the face is visible and unobscured, with no superimposed text, banners, or graphics. Professional studio quality is not required — campaign, event, or outdoor photos are acceptable. Same bar as TX Tier 3-4 cities, not the higher standard of MA state/federal officials.

### Missing photo policy
Document each gap by name in the plan's verification section. Mark the plan complete when all findable photos are uploaded. Do not hold the plan open waiting for a hard-to-find photo. Gaps can be backfilled in a future pass.

### Plan batching
One plan (42-01) covers all 16 officials in a single pass: councillors first, then school committee members, then city manager. No reason to split into multiple plans.

### Claude's Discretion
- Order to process officials within each chamber
- How to handle minor image quality issues (slight blur, slight crop imperfection)

</decisions>

<specifics>
## Specific Ideas

- Siddiqui holds both the Mayor and City Councillor offices but is a single politician — one headshot, linked to her politician row. No special treatment needed.
- Cambridge councillors are publicly prominent enough that gaps should be rare; document any gaps clearly if they occur.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 42-cambridge-headshots*
*Context gathered: 2026-05-16*

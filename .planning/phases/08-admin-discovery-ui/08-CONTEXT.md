# Phase 8: Admin Discovery UI + Dashboard - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Give admins a full web UI to trigger discovery runs, watch them execute, and audit coverage health — entirely without terminal access. Covers the jurisdictions panel, run history, and per-jurisdiction coverage stats. Race drill-down, audit tooling, and stance ingestion are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Jurisdiction list layout
- Dense table rows (not cards) — one row per jurisdiction
- Columns: name, election date, last run status badge, last run timestamp, candidates added in last run, total active candidates, Run Discovery button
- Status badge states: Success / Failed / Running / Never run
- Table is sortable by column headers and includes a text search filter (for when list grows with Indiana + future jurisdictions)
- Run Discovery button lives inline as the last column on each row (always visible, not on hover)

### Run Discovery feedback
- While running: button turns into a spinner AND the status badge updates to a pulsing "Running" state simultaneously
- UI auto-polls a status endpoint every few seconds while a run is active — no manual refresh needed
- On success: row updates in place (badge → Success, stats update, button reappears) + brief success toast showing candidates found count
- On failure: badge flips to Failed + error toast with a brief reason; Run button reappears for retry

### Run history display
- Separate section below the jurisdictions panel on the same admin page (one page: jurisdictions → history → coverage)
- Paginated table, 20-25 runs per page
- Each row shows: jurisdiction name, date/time, candidates found / staged / auto-upserted, status badge, trigger type (cron vs manual)
- Filterable by jurisdiction via dropdown

### Coverage health visualization
- Third section on the same admin page, below run history
- Per-jurisdiction table showing: total races, races with candidates, zero-candidate race count
- Zero-candidate count displayed in red when > 0 (color-coded numbers, no progress bars)
- Shows count only — no drill-down to specific race names (that belongs in a future phase)
- Auto-refreshes when a Run Discovery completes (triggered by the existing polling mechanism)

### Claude's Discretion
- Exact polling interval (3-5 seconds is fine)
- Toast styling and duration
- Table column widths and spacing
- Empty state copy for "no runs yet" history
- Page section headers and dividers

</decisions>

<specifics>
## Specific Ideas

- Zero-candidate count in red is the primary signal this panel exists to surface — make it visually pop
- The three-section layout (jurisdictions → history → coverage) should feel like one cohesive admin dashboard, not three unrelated tables

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-admin-discovery-ui*
*Context gathered: 2026-04-26*

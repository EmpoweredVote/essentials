# Phase 6: Admin Review UI + Email + Per-Race Trigger - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can review, approve, and dismiss staged candidates through a browser UI, receives email when items need attention or runs fail, and can trigger discovery for individual races. Creating new races and editing existing candidates are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Queue layout & grouping
- Group staged candidates by race, sorted by election date ascending (soonest races first)
- Within each race group, sort candidates: `uncertain` first, then `matched`, then `official`
- Elections within 30 days are visually flagged urgent via a colored border or badge on the row

### Item information (per row)
- Always shown: candidate name, race name, jurisdiction
- Always shown: color-coded confidence badge (green = official, yellow = matched, red = uncertain)
- Always shown: inline clickable source URL ("View source" or the URL itself, opens new tab)
- Flag reason (e.g. "no longer appears on official source") shown on withdrawal/flagged rows only — omit on normal new-candidate rows

### Approve/dismiss interaction
- Inline approve and dismiss buttons on each row
- Optimistic UI: row removes immediately on action (no waiting for server confirmation)
- Toast notification with Undo option appears briefly after action (covers accidental misclicks)
- No bulk actions — per-item only for v1
- Approval calls the existing `POST /admin/approve-candidate` endpoint from Phase 5, which inserts into `race_candidates`

### Email notifications
- Review notification fires once per discovery run that produces uncertain candidates (no batching across runs)
- Email body: count breakdown by confidence label (X uncertain / Y matched / Z official) + direct link to review page
- Urgency subject line for elections within 30 days: `[URGENT] X candidates need review — [Jurisdiction] election in N days`
- Non-urgent subject: `X candidates need review — [Jurisdiction]`
- Zero-candidate regression alert subject: `Zero candidates returned — [Jurisdiction] (was N)`, where N is the previous non-zero count

### Claude's Discretion
- Exact color values for confidence badges and urgency border
- Exact duration of the Undo toast
- Exact wording of the email body beyond the count breakdown + link
- UnresolvedQueue.jsx extension pattern — how exactly the existing component is adapted

</decisions>

<specifics>
## Specific Ideas

- Extends `UnresolvedQueue.jsx` pattern (existing admin queue component) — researcher should read that file
- Email sent via existing `emailService.ts` / `sendEmail()` function using Resend v6.12.0 (already listed as new package for Phase 6 in STATE.md)
- Per-race trigger endpoint: `POST /admin/discover/race/:id` (SCHED-02 from roadmap)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-admin-review-ui-email-per-race-trigger*
*Context gathered: 2026-04-24*

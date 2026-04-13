# Roadmap: Essentials — Elections Page (v2.0)

**Milestone:** v2.0 — Elections Page
**Defined:** 2026-04-12
**Coverage:** 13/13 requirements mapped

## Overview

This milestone delivers a standalone Elections page at `/elections` — a dedicated, top-level civic destination that works for any user tier. Connected users with a stored location skip the address step entirely. All others get a clean address input with county shortcuts. The backend is fixed first so that races with zero candidates surface alongside contested and unopposed races.

---

## Phases

### Phase 1 — Backend Fix

**Goal:** Races with zero candidates are returned by the backend, not silently dropped.

**Dependencies:** None — backend is independent; can deploy before any frontend work.

**Requirements:** ELEC-11

**Plans:** 1 plan

Plans:
- [ ] 01-01-PLAN.md — Fix LEFT JOIN + null-safe dedup/grouping + shape test

**Success Criteria:**
1. Querying the elections endpoint for a jurisdiction that contains a race with no filed candidates returns that race in the response payload.
2. The race appears with its name and government body intact, with an empty candidates array rather than being absent.
3. Existing races with one or more candidates are unaffected — their candidate lists remain complete and correctly associated.

---

### Phase 2 — Elections Page

**Goal:** Users can reach a dedicated Elections page and see election results appropriate to their account state, without unnecessary address re-entry.

**Dependencies:** Phase 1 (backend must return 0-candidate races so the page renders complete data).

**Requirements:** ELEC-01, ELEC-02, ELEC-03, ELEC-04, ELEC-05, ELEC-06, ELEC-07

**Success Criteria:**
1. Navigating to `/elections` renders a standalone Elections page (not embedded in Results or another view).
2. A Connected user whose account has a stored jurisdiction lands on the page and sees their local election results immediately — no address input is shown and no action is required.
3. An Inform (unauthenticated) user sees an address input field and two county shortcut buttons (Monroe County, LA County) on arrival.
4. A Connected user without a stored jurisdiction sees the same address input and shortcut buttons as an Inform user.
5. A user who already has results displayed can type a different address and fetch elections for that location instead.
6. Candidate order within each race is randomized per session (consistent within a browser session, different across sessions) — the existing seeded shuffle is preserved and not broken by the new page.

---

### Phase 3 — Unopposed and Empty Race UX

**Goal:** Every race surfaces on the page with appropriate treatment — 1-candidate races are labeled unopposed, 0-candidate races show a notice, and nothing is hidden.

**Dependencies:** Phase 2 (Elections page must exist); Phase 1 (0-candidate races must be present in API response).

**Requirements:** ELEC-08, ELEC-09, ELEC-10

**Success Criteria:**
1. A race section containing exactly one candidate displays that candidate's card alongside an "Running Unopposed" badge on the section header.
2. A race section containing zero candidates displays a notice reading "No candidates have filed" in place of a candidate list.
3. Both unopposed and empty races appear in the same results view as contested races — none are hidden, filtered out, or collapsed by default.
4. A results view with a mix of contested, unopposed, and empty races renders all three types in a single pass without requiring any user action to reveal them.

---

### Phase 4 — Navigation

**Goal:** Users can discover the Elections page from the landing page and from the site header without knowing the URL.

**Dependencies:** Phase 2 (the `/elections` route must exist before linking to it).

**Requirements:** ELEC-12, ELEC-13

**Success Criteria:**
1. The landing page includes an Elections card or button that links to `/elections`, visually consistent with the existing county cards.
2. The site header includes an Elections navigation entry that links to `/elections` and is visible on all pages.
3. Clicking either entry navigates the user to the Elections page.

---

## Progress

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 1 — Backend Fix | 0-candidate races returned by API | ELEC-11 | Planned |
| 2 — Elections Page | Dedicated route, tier-aware auto-detect, address input, shortcuts | ELEC-01, ELEC-02, ELEC-03, ELEC-04, ELEC-05, ELEC-06, ELEC-07 | Pending |
| 3 — Unopposed UX | All race types render with correct treatment | ELEC-08, ELEC-09, ELEC-10 | Pending |
| 4 — Navigation | Landing card + header nav entry | ELEC-12, ELEC-13 | Pending |

---

## Coverage

| Requirement | Phase |
|-------------|-------|
| ELEC-01 | Phase 2 |
| ELEC-02 | Phase 2 |
| ELEC-03 | Phase 2 |
| ELEC-04 | Phase 2 |
| ELEC-05 | Phase 2 |
| ELEC-06 | Phase 2 |
| ELEC-07 | Phase 2 |
| ELEC-08 | Phase 3 |
| ELEC-09 | Phase 3 |
| ELEC-10 | Phase 3 |
| ELEC-11 | Phase 1 |
| ELEC-12 | Phase 4 |
| ELEC-13 | Phase 4 |

**v1 requirements:** 13 mapped / 13 total. No orphans.

---

*Roadmap created: 2026-04-12*

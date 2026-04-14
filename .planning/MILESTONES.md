# Milestones

## v2.0 Elections Page (Shipped: 2026-04-13)

**Delivered:** A dedicated `/elections` page that gives any user instant access to their local ballot — Connected users auto-load with no address input, Inform users get address entry with county shortcuts, and all races surface regardless of candidate count.

**Phases completed:** 1-4 (4 plans total)

**Key accomplishments:**

- Fixed backend LEFT JOIN so races with zero filed candidates are returned with `candidates: []` — not silently dropped by INNER JOIN
- Built standalone `/elections` page with tier-aware auto-load: Connected users with stored jurisdiction see their races instantly via `elections/me`; Inform and no-jurisdiction users get address input with Monroe County and LA County shortcuts
- Fixed hardcoded Indiana state labels in ElectionsView — "State Legislature" / "State Executive" now render correctly for all states
- Three-state race rendering: contested (normal), unopposed ("Running Unopposed" photo overlay), empty ("No candidates have filed" coral notice box)
- Branch-priority ordering within government bodies (Executive → Legislative → Judicial) plus civic-priority Local tier ordering (Mayor → City Council → Township → County → Courts)
- Two discoverability entry points: "Upcoming Elections" landing card and "Elections" header nav item on all pages

**Stats:**

- 28 files created/modified
- ~9,769 lines of JSX/JS/TS (frontend)
- 4 phases, 4 plans
- 2 days (2026-04-12 → 2026-04-13)

**Git range:** `3cbf840` → `45e8389`

**What's next:** Data completeness (CA/IN candidate ingestion, headshots) and Elections page enhancements (tier filter, deep links)

---

## v1.9 Compare UX & Search Fixes (Shipped: 2026-03-01)

**Phases completed:** 0 phases, 0 plans, 0 tasks

**Key accomplishments:**
- (none recorded)

---


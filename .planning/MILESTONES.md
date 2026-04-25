# Milestones

## v2.1 Claude Candidate Discovery (Shipped: 2026-04-25)

**Delivered:** A Claude-powered candidate discovery pipeline that finds, scores, and stages candidates from official election authority sources — scaling to any jurisdiction by adding a single config row, with admin review UI, email alerts, and weekly automated discovery.

**Phases completed:** 5-7 (9 plans total)

**Key accomplishments:**

- 3-table DB schema (discovery_jurisdictions, candidate_staging, discovery_runs) with `citation_url NOT NULL` enforcing hallucination prevention at the schema layer
- Claude agent runner with forced `tool_choice=report_candidates` citation output and server-side web_search — every discovered candidate has a verifiable source URL before reaching the service layer
- Discovery orchestrator with Levenshtein fuzzy name matching at 85% threshold, three-tier confidence scoring (official/matched/uncertain), and withdrawal detection diffed against existing race_candidates
- Admin staging queue — JWT-gated React UI with race grouping, confidence badges, 30-day urgency indicators, and optimistic approve/dismiss with Undo toast
- Email notifications — urgency-aware review email, zero-candidate regression alert, and failure alert via Resend
- Weekly cron sweep at Sunday 02:00 UTC with in-process lock, sequential jurisdiction processing, auto-upsert for official/matched candidates, and sweep-summary email

**Stats:**

- ~57 files created/modified across backend + frontend
- ~1,733 LOC TypeScript (6 core discovery-layer files)
- 3 phases, 9 plans
- 3 days (2026-04-23 → 2026-04-25)

**Git range (backend):** `36cb281` chore(05-01) → `0d89b91` fix(stag-04)

**What's next:** Race completeness audit — detect missing races (not just missing candidates) from official ballot data

---

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


# Phase 208: Educators & Judges Tabs - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Add **Educators** and **Judges** tabs to the officials view in `src/pages/Results.jsx`,
beside the existing **Representatives** and **Elections** tabs. Each office-holder is routed
to a tab by `classifyBucket(pol)` (built in Phase 207). School-board and judicial
office-holders **leave** the Representatives list and surface only under their own tab, so
Representatives is decluttered. A new tab **shows only when the location has ≥1 office-holder
of that type** — otherwise it is hidden entirely.

**In scope:**
- Two new tabs (Educators, Judges) wired into the existing `activeView` / `switchView` /
  `?view=` mechanism, ordered **Representatives · Educators · Judges · Elections**.
- Routing office-holders into tabs via `classifyBucket` (single source of truth from Phase 207).
- Removing school-board + judicial office-holders from the Representatives tab (TAB-02).
- Hiding an Educators/Judges tab when its bucket is empty for the location; falling back to
  Representatives when the active tab has no data.
- Reusing the full Representatives rendering pipeline for the new tabs.
- Relocating the Elections summary text/badge off the Elections tab up to the location-header
  row (small, tab-row-fit-driven change).

**Out of scope:**
- Per-tab **default compass lens** shift (Judges→Judicial, Educators→Education) — **Phase 210**.
- The Education **lens** data entry — **Phase 209**.
- Removing the elected/appointed filter box — **deferred** (its own phase).
- Redesigning the Search by Address / Browse by Location toggle — **deferred** (its own phase).
- Any new seeding, DB, or API changes — classification/routing is entirely frontend on data
  already returned.

</domain>

<decisions>
## Implementation Decisions

### Tab order & mobile fit
- **D-01:** Tab order is **Representatives · Educators · Judges · Elections** — the three
  people-tabs grouped, Elections (time-sensitive) last (where it is today, shifted right).
- **D-02:** The **Elections tab label becomes plain "Elections"** — no `- {suffix}` and no
  yellow day-badge. Dropping that long string off the tab is what buys horizontal room for four
  tabs at ~280px.
- **D-03:** The **election summary relocates to the top location-header row** — the persistent
  collapsed location chip at `Results.jsx:1742` (the pin + address row where the Tribal-Land
  badge already sits). Keep the mockup format: `Elections - {suffix} · {date}` as text (e.g.
  "Elections - California General · Nov 3, 2026") **plus** the yellow **`{N} days away`** pill.
  It is location-level, so it renders once and stays visible across all four tabs. Source data:
  existing `electionsLabelSuffix` + `electionsData` election_date + `electionsDaysAway` (see
  `Results.jsx:1302` and `:1953-1967`). Confirmed against user mockup `C:\tmp\central.jpg`.
- **D-04:** Mobile (~280–375px): **short tab labels + horizontal scroll** if still tight —
  follow the existing Elections-tab compact-label responsive pattern. All tabs stay reachable.

### Empty-tab handling (REVISES TAB-03 / SC-4)
- **D-05:** **Hide an Educators/Judges tab entirely when its bucket has 0 office-holders** for
  the current location — **NOT greyed/disabled.** No empty-state panel, no tooltip. Rationale
  (user): most locations won't have school-board or judicial officials seeded yet; a row of dead
  greyed tabs reads as broken. Only populated tabs appear.
- **D-06:** **This supersedes the roadmap wording.** TAB-03 and Phase-208 Success Criterion #4
  currently say "greyed out / disabled ... not an empty tab." The planner MUST treat the spec as
  **"hidden when the location has no office-holders of that type."** Recommend REQUIREMENTS.md
  TAB-03 + ROADMAP.md SC-4 be reworded to match.
- **D-07:** **Representatives always shows** (never-empty catch-all per Phase 207 D-09).
  Elections keeps its existing show/hide logic — unchanged by this phase.

### Active-tab fallback
- **D-08:** If the **active tab has no office-holders for the current location, fall back to
  Representatives.** One rule covering both cases: (a) an in-session location change that empties
  the current tab, and (b) an initial/bookmarked stale `?view=judges` or `?view=educators` URL
  for a location lacking that bucket. Never render a blank/gone tab; reset `?view=` cleanly.

### Rendering parity & filters
- **D-09:** **Full parity.** Educators/Judges reuse the **same rendering pipeline** as
  Representatives — `groupIntoHierarchy(deduped)` → tier banners (Local/State/Federal) →
  `GovernmentBodySection` → `SubGroupSection` → cards — just fed the **bucket-filtered subset**
  (partition `deduped` by `classifyBucket`). Judges naturally span Local/State/Federal (e.g.
  SCOTUS), Educators span Local school boards + State Board of Education — the existing tier
  grouping handles that for free. Least new code; all three tabs look/behave identically.
- **D-10:** The **compass-mode control stays present and working on all three people-tabs.**
  Phase 208 only keeps the control live inside Educators/Judges; the **per-tab default-lens
  shift is Phase 210**, not this phase.
- **D-11:** The **elected/appointed ("All types") filter is kept as-is** for Phase 208 (still on
  the FilterBar, all tabs). Its removal is deferred to its own phase (touches global
  `matchesAppointedFilter` + `filteredHierarchy` logic, not just the new tabs).

### Claude's Discretion
- Exact mobile label strings / where horizontal-scroll kicks in — tune against the real 280px
  render, following the existing Elections-tab pattern.
- Where the bucket partition happens in the pipeline (partition `deduped` into three then build
  three hierarchies, vs. build one hierarchy and filter per tab) — as long as it calls
  `classifyBucket` (D-06 of Phase 207) and never drifts from the list grouping.
- Exact visual placement/spacing of the relocated election summary within the location-header
  row (it has ample horizontal room next to the address).
- Analytics: whether to extend the existing `essentials_tab_switched` event (`Results.jsx:933`)
  to cover the two new tab values — recommended, trivial.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase (requirements & goal)
- `.planning/REQUIREMENTS.md` — TAB-01, TAB-02, TAB-03 (note **D-06 revises TAB-03**:
  hide-when-empty, not greyed). No SPEC.md for this phase.
- `.planning/ROADMAP.md` §"Phase 208: Educators & Judges Tabs" — goal + 4 success criteria
  (note **D-06 revises SC-4**).

### Phase 207 foundation (the classification this phase consumes — do NOT re-implement)
- `.planning/phases/207-officials-classification/207-CONTEXT.md` — the D-01…D-11 bucket rules
  behind `classifyBucket`.
- `src/lib/classify.js` §L306 `classifyBucket(pol) -> 'representative' | 'educator' | 'judge'`
  — **the single source of truth for tab routing.** Also `classifyCategory` (L105),
  `computeVariant` (L394).

### Consumer to modify (the tabs live here)
- `src/pages/Results.jsx` — the officials view. Key anchors:
  - `:373` `activeView = searchParams.get('view') || 'representatives'` and `:932` `switchView`
    — the tab mechanism to extend.
  - `:1931-1982` the tab-row JSX (currently Representatives + Elections buttons + FilterBar).
  - `:1350-1370` `hierarchy` (`groupIntoHierarchy(deduped)`) → `filteredHierarchy` — where the
    bucket partition/filter slots in.
  - `:1984-2137` the Representatives render block to reuse for the new tabs.
  - `:1742` the collapsed location-chip header row — destination for the relocated election
    summary (D-03).
  - `:1302` `electionsDaysAway`, `:1953-1967` current in-tab election label/badge — the source
    to move.
- `src/lib/groupHierarchy.js` — `groupIntoHierarchy`, `getTier`, `isJudicialOfficial`,
  `isAdminOfficer` (the grouping the reused pipeline depends on).
- `src/components/ElectionsView.jsx` — Elections tab body (unchanged, but referenced by the tab).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`classifyBucket` (`src/lib/classify.js:306`)** — Phase 207's per-office-holder bucket
  function; call it to partition `deduped` into the three tabs.
- **`groupIntoHierarchy` + tier banners + `GovernmentBodySection`/`SubGroupSection`** — the
  entire Representatives render pipeline reused verbatim per tab on the bucket subset (D-09).
- **`activeView` / `switchView` / `?view=` param** — existing 2-tab mechanism; extend to 4
  values (`representatives` | `educators` | `judges` | `elections`).
- **`electionsLabelSuffix` + `electionsData` + `electionsDaysAway`** — already-computed election
  summary pieces; move their render target from the tab to the location-header row (D-03).

### Established Patterns
- **`district_type`-driven classification** (Phase 207) is the authoritative routing signal;
  the tabs must route through `classifyBucket`, never a parallel keyword check, so tab
  membership can't drift from the list grouping.
- **Per-office-holder classification (Phase 207 D-10)** — a dual-office person can legitimately
  appear in two tabs; that's expected, not a dedupe bug.
- **`?view=` as the tab source of truth** — fallback (D-08) is implemented by resetting/deriving
  `activeView` when the requested bucket is empty for the location.

### Integration Points
- Frontend-only. No backend/DB/API changes.
- The bucket partition sits between `deduped` (`Results.jsx:1340`) and the per-tab hierarchy
  render; the appointed filter (`filteredHierarchy`, `:1355`) continues to layer on top,
  unchanged (D-11).

</code_context>

<specifics>
## Specific Ideas

- User mockup `C:\tmp\central.jpg` (Beverly Hills results) drove D-02/D-03: the long
  "Elections - California General · Nov 3, 2026 · 109 days away" string is pulled **up** out of
  the tab row to the location-header line; the tab itself becomes plain "Elections."
- Guiding instinct: **hide empty tabs, don't grey them** — the app doesn't have school-board /
  judicial data for every location yet, so absent-when-empty keeps the UI honest and clean.
- The three people-tabs should feel identical (full render parity); Elections stays the odd-one-out
  time-sensitive tab, now visually lighter.

</specifics>

<deferred>
## Deferred Ideas

- **Search by Address / Browse by Location toggle redesign** — user finds the current mode-toggle
  UX clunky. New capability; its own future phase (roadmap backlog).
- **Remove the elected/appointed ("All types") filter box + functionality** — user leans toward
  removing it; global FilterBar + `matchesAppointedFilter` + `filteredHierarchy` cleanup, so its
  own phase (D-11).
- **Per-tab default compass-lens shift** (Judges→Judicial, Educators→Education) — Phase 210.
- **Education lens data entry** — Phase 209.

</deferred>

---

*Phase: 208-educators-judges-tabs*
*Context gathered: 2026-07-18*

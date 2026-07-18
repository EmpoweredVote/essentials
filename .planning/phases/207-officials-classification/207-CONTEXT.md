# Phase 207: Officials Classification - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a reliable engine that buckets **every office-holder returned for a location** into
exactly one of three groups — **Representative / Educator / Judge** — derived from existing
`district_type` / chamber / office data. **No new seeding.** This is the classification
foundation Phase 208's Educators & Judges tabs sit on; it does not build the tabs, the grey-out
affordance, or the per-tab lens shift (those are Phases 208 / 210).

**In scope:**
- A single source-of-truth classification function returning one of three buckets per office-holder.
- The bucket rules (which `district_type` values + which title/chamber overrides map where).
- Verification across ≥2 contrasting real locations (SC-05).

**Out of scope:**
- The tabs UI, tab ordering, grey-out / empty affordance (Phase 208).
- Per-tab default compass-lens shift (Phase 210).
- The Education lens data entry (Phase 209).
- Any new geographic/office seeding or DB writes.
- Re-modeling multi-office people at the person level (classification stays per office-holder row).

</domain>

<decisions>
## Implementation Decisions

### Judge bucket scope
- **D-01:** Judges = **all rows with `district_type` `JUDICIAL` or `NATIONAL_JUDICIAL`**, with
  **no judge-vs-court-staff special-casing** — judges, justices, *and* court
  clerks/administrators (`isJudicialOfficial` in `groupHierarchy.js`) all route to Judges. The
  whole judicial district_type goes to the Judges bucket; their cards already render as
  administrative plates where appropriate (honest, no fabricated compass). Rationale (user): don't
  over-engineer the clerk edge — routing the entire district_type is simpler and keeps the Judges
  tab = "everything about your courts."
- **D-02:** **DAs / prosecutors and public defenders → Judges bucket** via a **title-based
  override** (they are seeded as COUNTY-exec, *not* `JUDICIAL`). Matches the Judicial *lens* scope
  — "8 topics for judges, DAs, and public defenders" (`compass.js:403`) — so the Phase-210 Judicial
  default lens actually fits everyone in the tab.
- **D-03:** Title-detected judges/justices (e.g. `/judge|justice/` where district_type is missing
  or mistyped) also route to Judges (see precedence D-08).

### Educator bucket scope
- **D-04:** Educators = **`district_type` `SCHOOL`** (local K-12 school boards — the "wade through
  every LA school-board district" clutter) **plus `STATE_BOARD`** (State Board of Education).
  All education-governance bodies live together under Educators, consistent with the Education
  lens. Also covered: chamber/title matches "school board" / "board of education".
- **D-05:** **School superintendents / education executives → Educators bucket** via a title-based
  override (a statewide Superintendent of Public Instruction is currently `STATE_EXEC`). **Guard
  the override** so it does not catch non-school "superintendent" titles (e.g. superintendent of
  police, of public works, of streets). Sweep education officials — boards *and* education
  executives — into Educators.

### Signal & precedence
- **D-06:** **One source-of-truth function** — a single new exported
  `classifyBucket(pol) -> 'representative' | 'educator' | 'judge'` in **`src/lib/classify.js`**,
  reusing `district_type` + the targeted overrides. Both today's Results grouping and Phase 208's
  tabs call the *same* function so classification can never drift between the list and the tabs.
- **D-07:** Precedence = **`district_type` base + *additive* overrides.** `district_type` sets the
  bucket for the ~90% clean case; the targeted title/chamber overrides (DA/PD → Judge; school
  superintendent → Educator) only **pull specific mistyped rows *into*** Judge/Educator.
- **D-08:** A clear `JUDICIAL` / `SCHOOL` / `STATE_BOARD` row is **never pulled *out*** of its
  bucket by a keyword. Overrides are add-only, never subtractive — stray keywords can't misfile a
  cleanly-typed row.

### Ambiguous / default handling
- **D-09:** **Representatives is the catch-all.** Anything not positively classified as Educator or
  Judge — including empty/unrecognized `district_type` and today's "Unknown/Uncategorized" rows —
  defaults to Representatives. No office-holder ever disappears from the UI. Educator/Judge require
  a *positive* signal. **No 4th "Unknown/Other" bucket** (rejected — scope creep beyond the 3
  named buckets).
- **D-10:** **Per-office-holder classification.** Each returned row is classified independently, so
  a person holding two offices of different types (e.g. county supervisor *and* a school-board
  seat) legitimately appears in both tabs. Matches the SC-01 "every office-holder resolves to
  exactly one bucket" wording read per office. No person-level cross-government merge (that's how
  the data is modeled today — `deduplicateLocalMultiOffice` only merges same-city LOCAL/LOCAL_EXEC).

### Verification (SC-05 / CLASS-01)
- **D-11:** Verify classification across **≥2 contrasting real locations**: one with
  school-board + judicial officials (**LA**) and one **representatives-only** location. Confirm
  ordinary reps (mayor, council, legislators, federal delegation) never land in Educators/Judges,
  and that school-board + judicial officials never remain in Representatives.

### Claude's Discretion
- Exact function name / export shape (`classifyBucket` vs `classifyOfficialGroup`) and whether it
  returns a string enum or a small object.
- The precise override keyword lists and the guard patterns that exclude non-school
  "superintendent" and other false positives — tune against real data at plan/execute time.
- Whether/how to add unit tests to the existing `classify.test.js` (recommended, given the edge
  cases).
- Whether `classifyBucket` internally reuses `classifyCategory`/`getBranch` helpers or reads
  `district_type` directly — as long as it is the single source of truth.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase (requirements)
- `.planning/REQUIREMENTS.md` — CLASS-01 (the only requirement for Phase 207). No SPEC.md for this phase.
- `.planning/ROADMAP.md` §"Phase 207: Officials Classification" — goal + 5 success criteria (SC-01…SC-05).

### Existing classification code (the substrate to build on — do NOT fork)
- `src/lib/classify.js` — `classifyCategory(pol)` maps `district_type` → tier/fine-grained group
  (already handles `JUDICIAL`/`NATIONAL_JUDICIAL`, `SCHOOL`, `STATE_BOARD`). **`classifyBucket`
  (D-06) lives here.** `computeVariant()` already special-cases judicial/administrative cards.
- `src/lib/groupHierarchy.js` — `getTier()` (has a dedicated `School` tier + judicial→State/Local
  routing), `isJudicialOfficial()` (judge-vs-court-staff detection), `isAdminOfficer()`. The
  data-driven grouping the tabs will consume.
- `src/utils/branchType.js` — `getBranch()` (Executive/Legislative/Judicial) incl. the COUNTY
  `prosecutor` heuristic — reference for the DA/PD override (D-02).
- `src/utils/officeDescriptions.js` §~L84 — existing `district attorney|prosecutor` detection to
  mirror for the DA/PD override.
- `src/lib/compass.js` §L403, L488-493 — Judicial lens definition ("judges, DAs, and public
  defenders"; `autoDistrictTypes: ['JUDICIAL','NATIONAL_JUDICIAL']`) — the reason DAs/PDs belong in
  Judges (D-02).

### Consumers to keep consistent
- `src/pages/Results.jsx` — renders the grouped officials; will host the tab split in Phase 208.
- `src/components/ElectionsView.jsx` — imports `getBranch`; check no regression.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`classify.js` / `classifyCategory`**: already the district_type→category mapper; extend the
  file with the coarser `classifyBucket` rather than starting fresh.
- **`groupHierarchy.js` `getTier` + `isJudicialOfficial` + `isAdminOfficer`**: existing,
  battle-tested `district_type` routing and judge-vs-staff / admin detection — reuse the same
  signals so the bucket engine agrees with the grouping.
- **`branchType.js` `getBranch`** and **`officeDescriptions.js`**: existing prosecutor/DA
  keyword logic to mirror for the D-02 override (don't reinvent the keyword list).

### Established Patterns
- **`district_type` is the authoritative classification signal project-wide** — every existing
  classifier keys off it first; the new engine follows the same convention (D-07).
- **Additive keyword overrides layered on district_type** already exist (e.g. LOCAL council/clerk
  disambiguation in `classifyCategory`); the DA/PD and superintendent overrides follow that shape.
- **Per-row (per office-holder) modeling** — the API returns one row per office; grouping only
  merges same-city LOCAL multi-office (`deduplicateLocalMultiOffice`). D-10 relies on this.

### Integration Points
- `classifyBucket` is a pure function in `src/lib/classify.js`; Phase 208 imports it to route
  office-holders into the Representatives / Educators / Judges tabs.
- No backend / DB / API changes — classification is entirely frontend, from data already returned.

</code_context>

<specifics>
## Specific Ideas

- User's guiding instinct throughout: **don't over-engineer the edges.** Court clerks come along
  with the whole `JUDICIAL` district_type for free (no special-casing); keep the rule set small
  and the function a single source of truth.
- The Judges tab should read as **"everything about your courts"** for a location; the Educators
  tab as **"education governance"** (boards + education executives).
- Representatives is the **never-lose-anyone** default — a positive signal is required to leave it.

</specifics>

<deferred>
## Deferred Ideas

- **Person-level (one-bucket-per-human) classification** — considered and rejected for now (D-10);
  would need cross-government person merge. Revisit only if two-tab appearances confuse users.
- **A 4th "Unknown/Other" bucket** — rejected (D-09) as scope creep beyond the 3 named buckets.
- Authoring the Education-lens topics (Phase 209 / future), the tabs UI (Phase 208), and per-tab
  lens defaults (Phase 210) are downstream phases, not this one.

None of the above are gaps in Phase 207 — all are intentionally out of this phase's boundary.

</deferred>

---

*Phase: 207-officials-classification*
*Context gathered: 2026-07-17*

# Phase 47: v5.0 Tech Debt Cleanup - Research

**Researched:** 2026-05-18
**Domain:** React dead code removal, URL-param shortcuts, planning documentation
**Confidence:** HIGH

## Summary

This phase has four discrete tasks: delete a dead component file, add a shortcut entry to a frontend file, and write two documentation files. All findings come directly from inspecting the live codebase and existing planning artifacts — no external library research needed.

The v5.0 audit identified `Elections.jsx` as dead code (App.jsx already redirects `/elections` to Results.jsx; Elections.jsx has zero importers). The audit also flagged a gap: anonymous users on Results.jsx have no Cambridge/MA shortcut, while the Landing page `COVERAGE_AREAS` already has a working Cambridge entry (`browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA'`). The shortcut pattern in Results.jsx is URL-parameter-based — there is no `SHORTCUTS` constant in Results.jsx; that constant exists only in the now-dead Elections.jsx. The correct fix is adding a shortcut button in Results.jsx's address-mode UI section.

Documentation tasks require writing `39-VERIFICATION.md` (Phase 39 data is fully verified across the three plan summaries and corroborated by Phase 40 VERIFICATION.md) and updating `42-VERIFICATION.md` to reflect that Yi-An Huang's gap was closed in Phase 46 while Luisa de Paula Santos remains a confirmed gap.

**Primary recommendation:** Treat this as four independent edits; none depend on the others and each can be verified in isolation.

## Standard Stack

No new libraries. All work is in the existing codebase and planning file system.

### Core
| Tool | Version | Purpose | Why Used |
|------|---------|---------|----------|
| React JSX | existing | UI component deletion | Already in use |
| Tailwind CSS | existing | Shortcut button styling | Already in use |
| Planning Markdown | N/A | Documentation files | Project convention |

### No Installation Needed

All work uses existing tooling. No `npm install` required.

## Architecture Patterns

### Task 1: Delete Elections.jsx

**What:** `src/pages/Elections.jsx` is a 276-line component that was superseded by Results.jsx elections tab.

**Evidence of deadness:**
- `src/App.jsx` line 60: `<Route path="/elections" element={<Navigate to="/results?prefilled=true&view=elections" replace />} />`
- `Elections.jsx` is NOT imported in App.jsx (no `import Elections` line)
- Grep across all `.jsx`/`.js` confirms zero importers

**Action:** Delete `src/pages/Elections.jsx` only. No other file needs editing for this task — App.jsx already has the redirect and does not import Elections.jsx.

**Verification:** After deletion, `import Elections` must not exist anywhere, and the `/elections` route must still work via the Navigate redirect.

### Task 2: Add Cambridge Shortcut to Results.jsx

**Critical finding — no SHORTCUTS constant in Results.jsx:**

The v5.0 audit document says "Results.jsx SHORTCUTS (lines 12-15)" but this is an error. Lines 12-15 of Results.jsx are code inside `deriveScopedTopics()`. The `SHORTCUTS` constant at lines 12-15 exists in `Elections.jsx` (the dead file). Results.jsx has no `SHORTCUTS` array.

**How Results.jsx handles shortcuts:** Via URL query parameters. The anonymous address input UI (the full search form, visible when no results are loaded) shows a `LocationBrowser` in browse mode. In address mode, shortcuts would be quick-click buttons below the address input, similar to how Elections.jsx rendered them.

**Correct implementation pattern:**

The audit description says the gap is for "anonymous users" reaching Cambridge elections. The right fix is to add Cambridge as a clickable shortcut visible in the address-mode form area (the `div` that is shown when `!editingSearch` and no results are loaded). The button should construct a URL with `browse_government_list=2511000&browse_state=MA&browse_label=Cambridge` and navigate there — exactly the same pattern as Landing.jsx's `handleCountyClick`.

**Existing Cambridge data (from Landing.jsx):**
```jsx
{ county: 'Cambridge', state: 'Massachusetts', browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA' }
```

**Existing Monroe County/LA County shortcuts in Elections.jsx (dead code reference only):**
```jsx
const SHORTCUTS = [
  { label: 'Monroe County', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { label: 'LA County', address: '500 W Temple St, Los Angeles, CA 90012' },
];
```

These were address-based shortcuts (pass address string to `handleSearch`). The Cambridge entry in Landing.jsx uses `browseGovernmentList` which calls `browseByGovernmentList`. In Results.jsx the equivalent navigation is setting `browse_government_list` URL params (see `useEffect` at line 727 in Results.jsx for the handler).

**Where to add in Results.jsx:** Add a `SHORTCUTS` constant near the top of the file (before the component function) and render shortcut buttons inside the address-mode search form, in the same area where the full form is shown (the `div className={... ? 'hidden' : ''}` block), visible only when there is no result yet and not editing. The button's click handler should call `setSearchParams` to set `browse_government_list`, `browse_state`, `browse_label` and also call `setBrowseResults(null)` then trigger the browse flow — OR simply navigate with `navigate('/results?' + params)` like Landing does.

**Simplest correct approach:** Add a static `SHORTCUTS` array and render shortcut buttons below the address input (in address mode), using the same `navigate` call pattern as Landing.jsx's `handleCountyClick`. Clicking a shortcut navigates to `/results?browse_government_list=2511000&browse_state=MA&browse_label=Cambridge` which the existing `useEffect` at line 727 already handles.

**Note on existing page shortcuts in Elections.jsx:** Elections.jsx had Monroe County and LA County as address-based shortcuts. The phase description says "add a Cambridge/MA shortcut" — the scope is Cambridge only. Monroe County and LA County do not need to be re-added to Results.jsx (they are accessible via Landing.jsx or address search).

### Task 3: Write Phase 39 VERIFICATION.md

**File to create:** `.planning/phases/39-ma-government-db/39-VERIFICATION.md`

**All verification data is already confirmed** in the three plan summaries and cross-validated by Phase 40 VERIFICATION.md. The document should summarize:

| Check | Evidence Source |
|-------|----------------|
| Government row: id=85783e20-3031-4d71-89a5-5dd61f4a593f, type=STATE, state=MA | 39-01-SUMMARY.md |
| Massachusetts Senate chamber id=ddc43e0f | 39-01-SUMMARY.md |
| Massachusetts House of Representatives chamber id=5f3d03da | 39-01-SUMMARY.md |
| 40 senator rows (external_ids -210001 to -210040), 40 office rows | 39-02-SUMMARY.md |
| Cambridge senators: DiDomenico (25D26), Jehlen (25D27), Brownsberger (25D28) | 39-02-SUMMARY.md |
| 158 named rep rows + 2 vacant offices = 160 total office rows | 39-03-SUMMARY.md |
| Cambridge reps: Rogers (25082), Decker (25083), Connolly (25084) | 39-03-SUMMARY.md |
| government_id=85783e20 used in Phase 40 executives/chambers | 40-VERIFICATION.md Check 3-4 |
| Cambridge House routing confirmed: Clark MA-05, Pressley MA-07 | 40-VERIFICATION.md Check 11 |

**Format:** Use the same VERIFICATION.md structure as Phase 40 and Phase 42: YAML frontmatter, Observable Truths table, Required Artifacts, Key Link Verification, Live DB Query Results, Anti-Patterns, Summary.

**Status:** PASSED (all data was live-verified during execution in Phase 39; Phase 40 cross-validates).

### Task 4: Update Phase 42 VERIFICATION.md

**File to update:** `.planning/phases/42-cambridge-headshots/42-VERIFICATION.md`

**Current state:** The Phase 42 VERIFICATION.md (verified 2026-05-17) documents Yi-An Huang as a gap (no headshot found). Phase 46 closed this gap by uploading a 600x750 portrait from cambridgema.gov.

**Changes needed:**
1. Update Truth #3 (Yi-An Huang row): Change from "VERIFIED (gap documented)" / "no politician_images row" to "VERIFIED (gap closed in Phase 46)" noting the portrait was sourced from cambridgema.gov.
2. Update the Verification Data table: Change City Council row to show `with_headshot=10, missing_headshot=0` for Yi-An Huang.
3. Update the Gap Documentation Assessment: Remove Huang from "candidates for backfill" (gap is closed); keep Luisa de Paula Santos as still-open confirmed gap.
4. Update the score/status if needed (was 4/4 with gaps; now gaps reduce to 1).
5. Add a note at bottom: `Re-verified: 2026-05-18 — Yi-An Huang gap closed in Phase 46`.

**Anti-pattern to avoid:** Do not change the `verified:` date in frontmatter — add a `re_verified:` field or a note instead. The original verification date should be preserved.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cambridge browse shortcut | Custom fetch inside Results.jsx | Existing `browse_government_list` URL param + existing useEffect handler | The handler at line 727 in Results.jsx already processes this param; just navigate there |
| Phase 39 VERIFICATION.md data | Re-query the database | Inline the already-confirmed numbers from plan summaries | All counts are verified in summaries and cross-validated by Phase 40 |

## Common Pitfalls

### Pitfall 1: Editing App.jsx when deleting Elections.jsx
**What goes wrong:** Someone removes the `<Navigate>` redirect at line 60 of App.jsx when deleting Elections.jsx, breaking the `/elections` URL.
**Why it happens:** The redirect and the component feel related.
**How to avoid:** The redirect stays. App.jsx does NOT need to change — it already has no `import Elections` and the Navigate redirect is correct.
**Warning signs:** If any diff touches App.jsx for this task, it is wrong.

### Pitfall 2: Thinking Results.jsx has a SHORTCUTS constant
**What goes wrong:** Planner looks for a SHORTCUTS array to add Cambridge to, doesn't find it, gets confused.
**Why it happens:** The audit document incorrectly attributes the SHORTCUTS constant to Results.jsx (it's in the dead Elections.jsx at lines 12-15).
**How to avoid:** Results.jsx uses URL param navigation for shortcuts, not a data array. Add a new SHORTCUTS constant and button group, or add Cambridge inline as a single button.

### Pitfall 3: Wrong shortcut mechanism for Cambridge in Results.jsx
**What goes wrong:** Using address string `'100 Cambridge St, Cambridge, MA 02139'` instead of `browseGovernmentList: ['2511000']`.
**Why it happens:** Monroe County and LA County shortcuts in Elections.jsx used address strings.
**How to avoid:** Cambridge is modeled as a `browseGovernmentList` area (geo_id=2511000). Use `?browse_government_list=2511000&browse_state=MA&browse_label=Cambridge`. Address search may not resolve correctly to Cambridge city boundary.

### Pitfall 4: Changing Phase 42 VERIFICATION.md verified date
**What goes wrong:** Overwriting `verified: 2026-05-17` with today's date, losing audit trail.
**How to avoid:** Add a `re_verified:` field or an appended note; preserve original date.

### Pitfall 5: Searching for more Elections.jsx importers after deletion
**What goes wrong:** Unnecessary grep check after deletion fails because the file no longer exists.
**How to avoid:** Verify before deletion with grep, then delete.

## Code Examples

### Shortcut navigation pattern (from Landing.jsx, verified working)
```jsx
// Source: src/pages/Landing.jsx handleCountyClick, line 64-84
const handleCountyClick = (area) => {
  if (area.browseGovernmentList) {
    const params = new URLSearchParams({
      browse_government_list: area.browseGovernmentList.join(','),
      browse_label: area.county,
    });
    if (area.browseStateAbbrev) params.set('browse_state', area.browseStateAbbrev);
    navigate(`/results?${params}`);
  }
};
// Cambridge entry: browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA', county: 'Cambridge'
// → navigates to: /results?browse_government_list=2511000&browse_label=Cambridge&browse_state=MA
```

### Shortcut button styling (from Elections.jsx, verified rendering pattern)
```jsx
// Source: src/pages/Elections.jsx lines 215-224
<button
  key={label}
  onClick={() => handleSearch(address)}
  disabled={fetchLoading}
  className="border border-[var(--ev-teal)] dark:border-ev-teal-light text-[var(--ev-teal)] dark:text-ev-teal-light px-3 py-1.5 rounded text-sm font-medium hover:bg-[var(--ev-bg-light)] dark:hover:bg-gray-800 disabled:opacity-60"
>
  {label}
</button>
```

### Elections.jsx Route in App.jsx (do NOT change)
```jsx
// Source: src/App.jsx line 60 — this stays; Elections.jsx file is deleted but redirect lives on
<Route path="/elections" element={<Navigate to="/results?prefilled=true&view=elections" replace />} />
```

### Phase 42 VERIFICATION.md update — Yi-An Huang truth row
```markdown
// Change from:
| 3 | City Manager Yi-An Huang has a headshot at 600x750 | VERIFIED (gap documented) | ...no politician_images row... |
// Change to:
| 3 | City Manager Yi-An Huang has a headshot at 600x750 | VERIFIED (gap closed Phase 46) | Portrait sourced from cambridgema.gov in Phase 46; confirmed 600x750 at upload |
```

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Elections.jsx standalone page | Results.jsx elections tab | Redirect already in App.jsx; Elections.jsx is dead |
| Address-string shortcuts (Monroe County, LA County) | browse_government_list URL params (Cambridge, LA County, Collin County) | browseGovernmentList is the current pattern |

## Open Questions

1. **Where exactly to add Cambridge shortcut in Results.jsx**
   - What we know: There is no existing SHORTCUTS constant or shortcut UI in Results.jsx
   - What's unclear: Whether to add only Cambridge or also add back Monroe County and LA County (they exist in Landing.jsx but not Results.jsx)
   - Recommendation: Add Cambridge only as specified in the success criteria; do not add Monroe/LA (out of scope)

2. **Visibility condition for Cambridge shortcut**
   - What we know: In Elections.jsx, shortcuts showed when `!connectedAutoLoad && electionsData === null`. In Results.jsx the equivalent would be: show when there are no results and the user hasn't searched yet.
   - What's unclear: Exact conditional in Results.jsx component render
   - Recommendation: Show shortcut when `!activeQuery && !browseResults` (no results loaded, no address searched yet) and `searchMode === 'address'`

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/pages/Elections.jsx` — dead component, SHORTCUTS constant at lines 12-15
- Direct code inspection: `src/App.jsx` — Navigate redirect at line 60, no Elections import
- Direct code inspection: `src/pages/Results.jsx` — no SHORTCUTS constant, URL param browse pattern
- Direct code inspection: `src/pages/Landing.jsx` — COVERAGE_AREAS with Cambridge entry, handleCountyClick pattern
- `.planning/phases/39-ma-government-db/39-01-SUMMARY.md` — government row + chambers counts
- `.planning/phases/39-ma-government-db/39-02-SUMMARY.md` — 40 senators counts
- `.planning/phases/39-ma-government-db/39-03-SUMMARY.md` — 160 reps counts
- `.planning/phases/40-ma-executives-federal-officials/40-VERIFICATION.md` — cross-validates government_id=85783e20 + Cambridge routing
- `.planning/phases/42-cambridge-headshots/42-VERIFICATION.md` — current state, Yi-An Huang documented as gap
- `.planning/v5.0-MILESTONE-AUDIT.md` — tech debt items, SHORTCUTS attribution error clarified

## Metadata

**Confidence breakdown:**
- Dead code deletion (Elections.jsx): HIGH — zero importers confirmed, redirect confirmed
- Cambridge shortcut pattern: HIGH — Landing.jsx pattern confirmed working
- SHORTCUTS location misattribution in audit: HIGH — verified by reading both files
- Phase 39 VERIFICATION.md content: HIGH — all counts come from executed summaries
- Phase 42 VERIFICATION.md update: HIGH — Phase 46 completion documented in git history and memory

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (stable codebase, no external dependencies)

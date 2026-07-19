# Phase 210: Per-Tab Compass Integration - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

The compass button/overlay operates inside the Educators & Judges tabs (parity
with Representatives, carried from Phase 208 D-10), and the compass **lens
default shifts per tab**: Judges → Judicial; Educators and Representatives →
today's Best Match/Custom ("best available"). An explicit lens selection
overrides the per-tab default. This phase changes only lens-selection behavior
across the existing four-tab officials view — it does NOT introduce an Education
lens (deferred — see D-06 / Deferred) and does NOT add new compass capabilities.

</domain>

<decisions>
## Implementation Decisions

### Lens memory model
- **D-01:** Per-tab lens memory. Each people-tab (Representatives, Educators,
  Judges) has its own lens slot. Entering a tab applies that tab's remembered
  lens — its per-tab default on first visit, or the user's last explicit pick
  for that tab thereafter. This supersedes the single global `activeLensKey`
  as the *effective* lens when a people-tab is active (the global switcher
  still drives the actual compass render; per-tab memory decides what value it
  holds on tab entry).

### Reset / persistence scope
- **D-02:** Per-tab lens picks persist across location changes **within the
  session** (in-memory) — browsing a different city keeps each tab's chosen
  lens. They reset to per-tab defaults on a fresh page load / new session.
  **No localStorage persistence** (unlike Local Lens, which does persist).

### Per-tab defaults + override
- **D-03:** Defaults — **Judges → Judicial lens** (the only tab with a special
  default); **Educators → "best available" (Best Match/Custom), same as
  Representatives** — NO Education lens for now (deferred; see D-06);
  Representatives → current Best Match/Custom (UNCHANGED). Only Judges assigns a
  fixed per-tab lens; the other two share today's best-available behavior.
- **D-04:** An explicit user lens selection overrides that tab's default and
  becomes the tab's remembered lens for the lifetime in D-02.

### Fallback (honest blanks)
- **D-05:** "Best available" and any uncalibrated default fall back to Custom /
  Best Match with **honest blanks — never fabricate spokes.** For Educators this
  is the norm today: there is no educator stance data, so the Educators compass
  shows honest blanks (no-stances plate) until stance work exists. For Judges,
  an uncalibrated Judicial lens likewise degrades to Custom.

### Scope (Education lens deferred — Phase 210 is standalone)
- **D-06:** **No Education lens in 210, and NO dependency on Phase 209.** The
  Education lens is on hold: there is no educator stance data yet, the 5-notch
  spectrum values ("chairs") are undefined, and only a few viable education
  topics exist (sourcing more is unresolved). Until that groundwork is done, the
  Educators tab uses "best available" (D-03) with honest blanks (D-05).
  Promoting Educators from best-available to a real Education lens is FUTURE work
  (the deferred Phase 209), not part of 210. This makes 210 shippable on its own.

### Claude's Discretion
- Exact state shape and location of the per-tab lens map (e.g. inside
  `CompassContext` alongside `activeLensKey`, vs. local state in `Results.jsx`
  keyed by `effectiveActiveView`). Planner/researcher to choose based on where
  `setActiveLens` and tab-switch (`switchView`) can cleanly coordinate.
- Precise timing of applying a tab's default on tab entry (effect on
  `effectiveActiveView` change vs. inside `switchView`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Lens switcher (Phase 204 — the mechanism 210 extends)
- `src/contexts/CompassContext.jsx` — source of `activeLensKey`, `setActiveLens`,
  `lenses`, `isLensCalibrated`, `enableCompass`; the global lens state 210 hooks
  per-tab memory into.
- `src/lib/compass.js` — `saveLensPending`, Local Lens localStorage keys/helpers
  (`LOCAL_LENS_ACTIVE_KEY`, snapshot) — precedent for lens persistence and the
  contrast for D-02 (210 is in-memory, not localStorage).
- `.planning/phases/204*/204*-CONTEXT.md` (if present) — Phase 204 lens-switcher
  decisions and live GOTCHAs (opaque chips, dark-text, bar-above-banner, Best
  Match gating).

### Four-tab officials view (Phase 208 — where the compass slot lives)
- `src/pages/Results.jsx` §§ tab row + `renderPeopleTab` + `compassTopSlot` +
  `effectiveActiveView` + `switchView` — the integration surface; per-tab lens
  memory keys off `effectiveActiveView` / `switchView`.
- `.planning/phases/208-educators-judges-tabs/208-CONTEXT.md` — D-10 (compass
  control renders on all people-tabs) and the tab-routing decisions.

### Classification + lens semantics
- `src/lib/classify.js` — `classifyBucket` (tab routing) and `computeVariant`
  (judicial → `'judicial'` plate); note interaction between the Judicial LENS
  (switcher topic set) and the judicial-compass card.
- Phase 209 (Education Lens) is **deferred** and is **NOT a 210 dependency** —
  Educators uses best-available (D-06). Do not build against an Education lens.

### Requirements
- `.planning/REQUIREMENTS.md` — Phase 210 requirement rows (compass/lens).
  (EDU-01/EDU-02 belong to the deferred Phase 209 and are out of scope here.)
- `.planning/ROADMAP.md` § Phase 210 — canonical goal statement (note: the
  roadmap line's "Educators to Education" is superseded by D-03/D-06 —
  Educators uses best-available in 210).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCompass()` context (`activeLensKey`, `setActiveLens`, `lenses`,
  `isLensCalibrated`) — already global; per-tab memory decides the value to feed
  it on tab entry.
- `effectiveActiveView` + `switchView` (Results.jsx, Phase 208) — the exact hook
  points for "on entering tab X, apply tab X's remembered lens".
- `compassTopSlot` — already rendered inside `renderPeopleTab` for all three
  people-tabs (208 D-10); the lens control is present, this phase changes what
  lens it defaults to.

### Established Patterns
- Data-driven lenses: adding/lighting a lens is a data change (Phase 204/209).
  D-06 relies on this — Education lights up with no 210 code change.
- Honest blanks: no fabricated spokes when a lens lacks data (compass variants
  `'no-stances'` / judicial plate). D-05 extends this to unlit/uncalibrated
  per-tab defaults.

### Integration Points
- Tab switch (`switchView` / `effectiveActiveView` change) → set the active lens
  to that tab's remembered value (default or prior explicit pick).
- Explicit lens pick (`setActiveLens` via the switcher) → write into the current
  tab's remembered slot (D-04).

### Research flags (not user decisions — for researcher/planner)
- Confirm the switcher exposes a `'judicial'` lens key and it maps to the
  judicial-compass topics; verify Judges→Judicial actually surfaces judicial
  spokes rather than the no-compass plate.
- Confirm the compass comparison overlay (`CompassCardVertical`) behaves
  identically on Educators/Judges (parity carried from 208 D-10).
- Educators uses best-available (no Education lens) — verify the Educators tab
  compass renders honest blanks (no-stances plate) gracefully given zero
  educator stance data today.

</code_context>

<specifics>
## Specific Ideas

- Mental model the user endorsed: "each tab = its own lens slot." Example flow:
  Reps [Best Match] → Judges [Judicial] → back to Reps [Best Match]; pick Custom
  on Judges, leave and return → Judges [Custom] (remembered); reload → Judges
  back to [Judicial].

</specifics>

<deferred>
- **Education lens (deferred Phase 209)** — on hold, blocked by upstream
  groundwork the user flagged:
  - No stance research exists for educators (school-board officials).
  - The 5-notch spectrum values ("chairs", per the stance model) are not yet
    defined for education topics.
  - Only a few education topics currently make sense; **how to source more is an
    open question.**
  Once educator stance work + spectrum notches + a viable topic set exist, revisit
  Phase 209 (Education lens entry) and then a follow-up to default Educators to
  it. Until then, Educators = best-available (D-06).
- Persisting per-tab lens picks across sessions (localStorage) — explicitly
  rejected for 210 (D-02: in-memory, reset on reload). Revisit only if users ask
  for sticky lens preferences.

None beyond the above — discussion stayed within phase scope.

</deferred>

---

*Phase: 210-per-tab-compass-integration*
*Context gathered: 2026-07-18*

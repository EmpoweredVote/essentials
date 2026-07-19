# Phase 210: Per-Tab Compass Integration - Research

**Researched:** 2026-07-19
**Domain:** React state management (per-tab lens memory) on an existing data-driven compass lens switcher (Phase 204) + four-tab officials view (Phase 208)
**Confidence:** HIGH

## Summary

Phase 210 is a pure frontend state-wiring change confined to `src/pages/Results.jsx` (plus,
optionally, `src/contexts/CompassContext.jsx` if the per-tab map is hoisted into context). No new
components, no backend/API changes, no new dependencies. The mechanism it extends — the global
`activeLensKey` / `setActiveLens` / `lenses` from `CompassContext`, driving every card's `MiniCompass`
via `activeLensTopicIds` — already has the two properties this phase most depends on, confirmed by
reading the actual code and the Phase 204 completion summary: (1) an unresolved/unknown lens key
**already degrades safely to Best Match** (`T-204-01`, a null-guard added specifically for this),
and (2) the **Judicial lens is a real, fully-wired lens** (`key: 'judicial'`, 8 real topic UUIDs)
already driving the grid's `MiniCompass` overlay — it is unrelated to `classify.js`'s
`computeVariant()` "judicial plate," which turns out to be **dead code in `Results.jsx`** (imported,
never called) and only matters on the separate individual-politician Profile page.

The one genuinely new piece of logic this phase must add is a **per-tab lens memory map**
(`{ representatives, educators, judges }`) plus an effect that applies the current tab's remembered
(or default) lens to the existing global `activeLensKey` whenever `effectiveActiveView` changes, and
an interception in the explicit-select handler that writes the pick into the current tab's slot. A
second, more subtle piece of correctness work is required beyond what "just call `setActiveLens`"
gives for free: `isLensCalibrated` gates whether a lens shows as usable in the chip row, and an
uncalibrated/unlit default (Education always today; Judicial for a user who hasn't answered judicial
topics) needs to resolve to `'custom'` for the *chip highlighting to be honest* — the render-level
fallback already works without this, but the switcher would otherwise show no chip lit, which reads
as "broken" per the honest-blanks decision (D-05).

**Primary recommendation:** Add a small pure resolver function (`resolveTabLens(tabKey, tabDefaults,
tabMemory, lenses, userAnswers)` → effective lens key) plus a `Map`/plain-object per-tab memory state
in `Results.jsx` (co-located with `effectiveActiveView`, not inside `CompassContext` — see
Architecture Patterns). Wire it with two effects/handlers: one that runs on `effectiveActiveView`
change (apply that tab's resolved lens), and one that intercepts `handleSelectLens` to also write the
explicit pick into the active tab's memory slot before calling the existing `setActiveLens`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Per-tab lens memory (which lens each tab last showed) | Frontend Server *(SPA client, no SSR — treat as Browser/Client)* | — | Pure client-side React state; no persistence, no server round-trip (D-02: in-memory, resets on reload) |
| Applying a tab's remembered/default lens on tab entry | Browser / Client | — | `useEffect` keyed on `effectiveActiveView`, calls existing `setActiveLens` (Browser/Client, `CompassContext`) |
| Lens topic-set resolution / spoke rendering | Browser / Client | — | Unchanged from Phase 204 — `computeDisplaySpokes` in `src/lib/compass.js`, called by `MiniCompass` |
| Lens registry (`lenses`, calibration flags) | Browser / Client (hydrated from API) | API / Backend | `GET /compass/lenses` (unchanged, out of scope) is the source of truth; client caches + normalizes it |
| Education lens existence | API / Backend (deferred, Phase 209) | Browser / Client (defensive reference) | 210 only *references* the `'education'` key; authoring it is a data-only backend/seed change (Phase 209, not 210) |

**Note:** This is a client-only React SPA feature (no SSR layer in this codebase) — "Frontend Server"
tier does not apply; all rows above resolve to Browser/Client with API/Backend only as an upstream
data source, never a code dependency for 210.

## Standard Stack

No new libraries. This phase uses only what's already in the codebase:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| React (hooks: `useState`, `useEffect`, `useMemo`, `useCallback`) | (existing, see `package.json`) | Per-tab memory state + tab-entry effect | Already the exclusive state mechanism in `Results.jsx` and `CompassContext.jsx`; no new pattern needed |
| Vitest | ^4.1.4 `[VERIFIED: package.json:44]` | Unit-testing the new pure resolver function | Existing test runner (`classify.test.js`, `compass.test.js` already follow this pattern) |

No package installation, so the Package Legitimacy Gate / Package Legitimacy Audit section is
**not applicable** — this phase adds zero external packages.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-tab memory as plain `useState` object in `Results.jsx` | Per-tab memory inside `CompassContext` (new state + setter) | Context placement is "discretion" per 210-CONTEXT.md; recommend `Results.jsx`-local (see Architecture Patterns) — context is unnecessary since only `Results.jsx` consumes tab-scoped lens memory, and adding it to context increases the provider's re-render surface for `Profile.jsx`/`ElectionsView.jsx`, which never need it |
| `useEffect` on `effectiveActiveView` to apply lens | Do it inline inside `switchView()` | `switchView` only fires on an explicit user click; it does NOT fire on the D-08 empty-tab-fallback auto-redirect (`effectiveActiveView` differs from `activeView` when a stale `?view=` points at a now-empty tab) or the initial page load with `?view=judges` in the URL already set. An effect keyed on `effectiveActiveView` covers all three entry paths (click, fallback-redirect, direct URL load) with one code path — `switchView` alone would miss URL-driven and fallback-driven entries. |

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────────────────────────────┐
                     │            Results.jsx (SPA)             │
                     │                                           │
  URL ?view=judges ─▶│  activeView (raw param)                   │
                     │        │                                  │
                     │        ▼                                  │
                     │  effectiveActiveView (useMemo: validates   │
                     │  against hasEducators/hasJudges, falls     │
                     │  back to 'representatives')                │
                     │        │                                  │
                     │        ▼  [NEW: 210]                       │
                     │  useEffect(() => {                         │
                     │    const key = resolveTabLens(              │
                     │      effectiveActiveView, tabMemory,        │
                     │      TAB_DEFAULTS, lenses, rawUserAnswers)   │
                     │    setActiveLens(key)  ───────────────┐    │
                     │  }, [effectiveActiveView])             │    │
                     │                                        │    │
  User clicks a  ───▶│  handleSelectLens(key) [MODIFIED: 210] │    │
  lens chip           │    tabMemory[effectiveActiveView]=key  │    │
  (explicit pick)     │    setActiveLens(key) ─────────────────┤    │
                     │                                        ▼    ▼
                     │                              CompassContext.jsx
                     │                              activeLensKey (global,
                     │                              unchanged mechanism)
                     │                                        │
                     │                                        ▼
                     │                          MiniCompass (per card, via
                     │                          renderPoliticianCard — same
                     │                          function for all 3 people-tabs)
                     │                                        │
                     │                                        ▼
                     │                          computeDisplaySpokes()
                     │                          (src/lib/compass.js — unchanged;
                     │                          unresolved lens key already
                     │                          falls back to Best Match, T-204-01)
                     └─────────────────────────────────────────┘
```

### Recommended Project Structure

No new files required. Modify only:
```
src/
├── pages/
│   └── Results.jsx          # add tabMemory state, resolveTabLens call sites, 2 new effects/handlers
└── lib/
    └── compass.js           # OPTIONAL: extract resolveTabLens() here (pure, testable) if it grows
                              # beyond a few lines; otherwise keep it local to Results.jsx
```

### Pattern 1: Tab-entry lens effect (the core new mechanism)

**What:** A `useEffect` keyed on `effectiveActiveView` that resolves and applies that tab's lens
whenever the effective tab changes — covering click, fallback-redirect, and direct-URL-load entry
paths in one place.

**When to use:** This is the single hook point for D-01 ("entering a tab applies that tab's
remembered lens").

**Example (illustrative, follows existing file conventions):**
```javascript
// Source: pattern derived from src/pages/Results.jsx:1448-1461 (effectiveActiveView useMemo)
// and src/pages/Results.jsx:584-587 (existing handleSelectLens)

const TAB_DEFAULTS = {
  representatives: 'custom',   // Best Match/Custom — UNCHANGED (D-03)
  educators: 'education',      // aspirational default (D-03/D-06) — resolved defensively below
  judges: 'judicial',          // real, live lens today (D-03)
};

const [tabLensMemory, setTabLensMemory] = useState({}); // {} = no explicit pick in any tab yet

// Pure resolver — safe to unit-test in isolation (no React dependency)
function resolveTabLens(tabKey, tabMemory, lenses, userAnswers) {
  const remembered = tabMemory[tabKey];
  const candidate = remembered ?? TAB_DEFAULTS[tabKey] ?? 'custom';
  if (candidate === 'custom') return 'custom';
  const lens = lenses.find((l) => l.key === candidate);
  // Unlit / not-yet-authored (education today) or user-uncalibrated (D-05) → best-available.
  if (!lens || !isLensCalibrated(lens, userAnswers)) return 'custom';
  return candidate;
}

useEffect(() => {
  const key = resolveTabLens(effectiveActiveView, tabLensMemory, lenses, rawUserAnswers);
  setActiveLens(key);
  // Intentionally NOT including setActiveLens's own persistence side effect as a loop
  // trigger — setActiveLens also calls saveLensSelection(key) (localStorage), which is
  // harmless to re-run but does not feed back into this effect's deps.
}, [effectiveActiveView, tabLensMemory, lenses]); // eslint-disable-line react-hooks/exhaustive-deps
```

### Pattern 2: Explicit-pick interception (writes into the current tab's slot)

**What:** Wrap the existing `handleSelectLens` (Results.jsx:584-587) so an explicit user pick
updates `tabLensMemory` for the *currently active* tab before delegating to the unchanged
`setActiveLens`.

**Example:**
```javascript
// Source: extends src/pages/Results.jsx:584-587 (existing handleSelectLens)
const handleSelectLens = (key) => {
  posthog?.capture('essentials_compass_lens_selected', { lens: key, tab: effectiveActiveView });
  setTabLensMemory((prev) => ({ ...prev, [effectiveActiveView]: key })); // D-04
  setActiveLens(key);
};
```

**Note on ordering:** `setTabLensMemory` triggers the Pattern 1 effect on next render (since
`tabLensMemory` is a dep), which will call `resolveTabLens` again and find `remembered = key` —
re-resolving to the same value the user just picked (a no-op `setActiveLens` call). This is safe
(React batches, and `setActiveLens` is idempotent) but worth a comment in the plan so a future
reader doesn't mistake it for a bug.

### Pattern 3: Reset-on-reload (D-02) — already free

**What:** No code needed. `tabLensMemory` is a plain `useState({})` with no `localStorage`/
`sessionStorage` backing — a full page reload re-mounts `Results.jsx`, and the state re-initializes
to `{}`. This is the exact contrast the CONTEXT.md draws with Local Lens (`LOCAL_LENS_ACTIVE_KEY` /
`LOCAL_LENS_SNAPSHOT_KEY` in `src/lib/compass.js:399-400`, which DOES persist to localStorage) — do
not add any storage calls for `tabLensMemory`.

**Cross-location persistence within a session (D-02):** Also free — `Results.jsx` is not
unmounted/remounted on an in-app location search or browse-area change (only `searchParams` /
internal state changes), so `tabLensMemory` (component state) naturally survives across locations
within the same page lifetime. Verify this assumption specifically during planning/execution — if
any future refactor introduces a `key={locationKey}` remount pattern on `Results`, it would silently
break D-02.

### Anti-Patterns to Avoid

- **Do NOT put `tabLensMemory` in `CompassContext`.** The context is shared by `Profile.jsx` and
  `ElectionsView.jsx`, neither of which has "tabs" in this sense — adding tab-scoped state there
  either forces those consumers to ignore an irrelevant field or invites scope creep into those
  pages. Keep it local to `Results.jsx` (component state), consistent with `210-CONTEXT.md`'s
  discretion note framing this as an open choice — the evidence favors local state.
- **Do NOT special-case `'education'` or `'judicial'` string literals deep inside `compass.js` or
  `MiniCompass.jsx`.** All the defensive behavior 210 needs (D-05/D-06's "never fabricate, never
  break") is already achieved generically by `resolveTabLens`'s `!lens || !isLensCalibrated(...)`
  check — the render layer (`computeDisplaySpokes`) never needs to know a lens key is
  tab-associated at all.
- **Do NOT gate the tab's default lens application on `compassMode` inside the new effect** without
  checking existing precedent — `activeLensKey`/`setActiveLens` already work correctly regardless of
  `compassMode` (the switcher/chips are simply hidden when `compassMode` is off, via
  `compassTopSlot`'s `!compassMode ? null : ...` at Results.jsx:1128-1132). Applying a tab default
  even while compass mode is off is harmless (no visible chip, `activeLensKey` just sits ready for
  when the user turns compass mode on) and avoids a stale/wrong lens surprising the user when they
  first enable compass mode on, say, the Judges tab.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Determining whether a lens is "ready to use" | A new calibration/readiness check | `isLensCalibrated(lens, userAnswers)` (`src/lib/compass.js:544-554`, already imported into `CompassContext` and re-exported) | Already implements the exact `min(8, topicIds.length)`-answered threshold used everywhere else (chip row, auto-select-on-calibration-return) — a second readiness definition would drift |
| Falling back when a lens key doesn't resolve | A new try/catch or null-check scattered at each call site | The existing `preferredForPol` null-guard pattern (Results.jsx:1617, `T-204-01`) already resolves any lens key with no matching `lenses` entry to an empty preferred set, which `computeDisplaySpokes` treats as Best Match | Duplicating this logic for the "tab default" case would be redundant — `resolveTabLens` should short-circuit to `'custom'` *before* even calling `setActiveLens`, but if it didn't, the existing guard would still save it |
| Detecting which bucket (Representatives/Educators/Judges) an office-holder belongs to | A parallel keyword/regex check inside the new lens-memory logic | `classifyBucket()` (`src/lib/classify.js:299-321`, already the single source of truth per Phase 207/208) | 210 never needs to re-derive bucket membership — it only needs `effectiveActiveView` (already the tab-routing signal) as the memory-map key |

**Key insight:** Nearly everything this phase needs already exists as a generic, reusable primitive
from Phase 204's lens-switcher work — the *only* genuinely new code is the small per-tab memory map
and its two integration points (tab-entry effect, explicit-pick interception). Resist the urge to
build anything more elaborate.

## Common Pitfalls

### Pitfall 1: Confusing `computeVariant`'s `'judicial'` plate with the Judicial *lens*

**What goes wrong:** A planner reads `src/lib/classify.js:389-405` (`computeVariant`), sees
`dt === 'JUDICIAL' ... return 'judicial'` described as "always show unavailable plate," and
concludes the Judges tab can never show a real compass — then either avoids using the Judicial lens
or tries to "fix" `computeVariant` (out of scope).

**Why it happens:** `computeVariant` and the Judicial *lens* (`key: 'judicial'` in `LENS_FALLBACKS`,
`src/lib/compass.js:487-494`) are two entirely unrelated mechanisms that happen to share the word
"judicial." `computeVariant` is imported into `Results.jsx` (line 5) but **never called there** —
confirmed by project-wide grep, it is dead code in that file. It IS used on the separate
`src/pages/Profile.jsx` (line ~223-235), where a `districtScope === 'judicial'` routes to a
dedicated `JudicialCompassSection` component instead of the standard `CompassCard` — that's a
different page, a different rendering path, and explicitly out of scope for both Phase 204 (see
`204-CONTEXT.md` deferred: "Reworking the standalone `JudicialCompassSection`") and Phase 210.

**How to avoid:** On the Results grid (`compassTopSlot` / `MiniCompass` path that 210 touches), the
Judicial lens already works today via `activeLensKey === 'judicial'` → `activeLensTopicIds =
JUDICIAL_LENS_TOPICS` (8 real topic UUIDs) → `MiniCompass`'s `lensTopicIds` prop → `computeDisplaySpokes`.
No plate, no special-casing needed.

**Warning signs:** Any plan task that proposes modifying `classify.js`'s `computeVariant` or
`Profile.jsx`'s `JudicialCompassSection` routing is almost certainly out of scope for 210.

### Pitfall 2: `computeVariant`/`deriveScopedTopics`/`CompassCardVertical` — three more dead-code traps in the same file

**What goes wrong:** Grepping `Results.jsx` for terms named in `210-CONTEXT.md`'s "research flags"
(e.g. `CompassCardVertical`) turns up an *import* but no call site, leading to wasted investigation
time or an incorrect assumption that a component needs modification.

**Why it happens:** `Results.jsx` imports `computeVariant` (line 5), `CompassCardVertical` (line 4),
and defines a local `deriveScopedTopics()` helper (line 42) — none of the three is ever invoked
anywhere in the file (verified via `grep -n "computeVariant\(" `, `grep -n "CompassCardVertical"`,
`grep -n "deriveScopedTopics\("`, each returning only the import/definition line). The actual
per-card overlay component is `src/components/MiniCompass.jsx` (imported and called at
Results.jsx:1701 and :1723), which internally uses `RadarChartCore` from `ev-ui`, not
`CompassCardVertical`. `ElectionsView.jsx` has its own independent copy of `deriveScopedTopics`
(also apparently unused there) — the scoping-by-district-type logic that's actually live in
`Results.jsx` is the inline `scopedTopicsForPol` ternary at line 1600-1602 (which only special-cases
`'local'`, not `'judicial'`/`'federal'`/`'state'` — the lens's own `topicIds` supplies scoping
instead for named lenses).

**How to avoid:** Trust the actual call graph, not variable/import names that sound relevant. The
"compass comparison overlay (`CompassCardVertical`) parity" research flag in `210-CONTEXT.md` should
be read as "parity of `MiniCompass`," which is trivially true since `renderPoliticianCard` (the
function that renders `MiniCompass`) is the exact same function called for all three people-tabs via
the shared `renderPeopleTab`/`renderSeatGroup` pipeline (Phase 208, D-09) — there is only one card
rendering code path, so "parity" cannot drift by tab.

**Warning signs:** If a plan task references modifying `CompassCardVertical` or `computeVariant`
inside `Results.jsx`, stop and re-verify with a grep — those are very likely unrelated dead imports.

### Pitfall 3: Chip-highlighting mismatch when a tab's default resolves silently

**What goes wrong:** If `resolveTabLens` is skipped and the raw aspirational key (`'education'` or
an uncalibrated `'judicial'`) is passed straight to `setActiveLens`, the render layer still degrades
correctly (Best Match spokes show, per `T-204-01`), but `LensChipRow` (`src/components/
LensChipRow.jsx:109`, `isActive = activeLensKey === lens.key`) will find **no matching chip** for a
key that isn't in the `lenses` array (education) — no chip highlights as active, which reads as "the
switcher is broken/unresponsive" even though the compass itself is rendering honest Best Match
spokes underneath.

**Why it happens:** `activeLensKey` is a single flat string consumed by two different downstream
paths that don't share a resolution step: (1) the render path (`activeLens =
activeLensKey === 'custom' ? null : lenses.find(...)`, already null-safe) and (2) the chip-highlight
path (`LensChipRow`, not null-safe in the sense that no chip lights up for an unknown key — this is
not a crash, just a silent "nothing selected" visual).

**How to avoid:** Resolve to `'custom'` *before* calling `setActiveLens` (as in Pattern 1 above),
so the actual value stored in `CompassContext.activeLensKey` is always a key that exists in
`augmentedLenses` (Results.jsx:568-582, which includes the synthesized `'custom'`/Best Match chip
plus every API lens) — guaranteeing a chip is always lit, matching user expectations under D-05's
"honest blanks" framing (the *label* should say Best Match, not silently point at an invisible
"Education").

**Warning signs:** Live-verify the Educators tab with the switcher visible (`compassMode` on) and
confirm the **Best Match chip visibly highlights** on tab entry, not "no chip highlighted."

### Pitfall 4: Effect-loop risk between `handleSelectLens` and the tab-entry effect

**What goes wrong:** A naive implementation might key the tab-entry effect on `activeLensKey` itself
(in addition to / instead of `effectiveActiveView`), creating a cycle: entering a tab sets
`activeLensKey` → effect re-fires because `activeLensKey` changed → re-resolves and calls
`setActiveLens` again → (if `tabLensMemory` write also happens in this effect) infinite loop or at
minimum unnecessary re-renders and duplicate `posthog?.capture` analytics events.

**Why it happens:** `activeLensKey`/`setActiveLens` and `tabLensMemory` are two separate pieces of
state that both want to react to "the same" trigger (tab change or lens change) but for different
reasons — the effect must fire on tab change only, and the explicit-pick handler must fire on user
click only. Mixing their triggers is the classic effect-loop trap already flagged generically in
this agent's pitfall list ("effect-loop risks when auto-setting the lens on tab switch" from the
phase's own key_questions).

**How to avoid:** Keep the dependency arrays disjoint by intent: the tab-entry effect depends on
`[effectiveActiveView, tabLensMemory, lenses]` (fires on tab change or when memory/lenses data
changes, e.g. lenses finish hydrating from the API) — never on `activeLensKey` itself. The explicit
pick handler (`handleSelectLens`) is an event handler, not an effect, so it has no dependency-array
re-fire risk at all. Do not add a `useEffect` that watches `activeLensKey` and writes back into
`tabLensMemory` — that direction of sync only happens through the explicit `handleSelectLens` path.

**Warning signs:** Any implementation with more than one `useEffect` touching `activeLensKey` should
be reviewed for a cycle; PostHog event counts (`essentials_compass_lens_selected`) firing more than
once per user click during manual testing is a concrete symptom.

## Code Examples

### Existing null-guard this phase relies on (verbatim, unchanged)

```javascript
// Source: src/pages/Results.jsx:595-598 (Phase 204, T-204-01 — confirmed via
// 204-04-SUMMARY.md: "Null-guard added on preferredForPol so an unresolved lens
// key resolves to Best Match rather than throwing")
const activeLens = activeLensKey === 'custom' ? null : lenses.find((l) => l.key === activeLensKey);
const activeLensTopicIds = activeLens ? activeLens.topicIds : null;
// ... later, at line 1617:
const preferredForPol = (activeLensKey === 'custom' ? [] : activeLensTopicIds) || [];
```
This is why setting `activeLensKey` to `'education'` today (before Phase 209 authors the lens)
**does not throw and does not render a broken compass** — it silently produces `preferredForPol =
[]`, which `computeDisplaySpokes` (src/lib/compass.js:650-757) treats as "no preferred set," falling
through to the Best Match / full both-answered-topics branch.

### The real Judicial lens (verbatim, unchanged) — confirms Key Question #2

```javascript
// Source: src/lib/compass.js:406-415 (LENS_FALLBACKS entry, plus the API-hydrated
// equivalent from GET /compass/lenses per Phase 204)
export const JUDICIAL_LENS_TOPICS = [
  '1fab5edf-6151-4da0-9704-a7f2113ba54c', // Bail & Pretrial
  '9d45acaf-1ba4-4cb8-95e1-5ed985223b91', // Court Access
  '9db07b16-1076-4b7d-ad89-ebe7b51f4336', // Criminal Justice
  'e5e48f0e-8f3a-40e1-8080-889fea389603', // Government Deference
  '448b1c9a-b6f3-42b8-8f39-d3bbb5bfa9ee', // Interpretation
  'c267e137-0ff9-4e7d-9d13-e3cea1756cd0', // Jail Capacity
  '6674d87e-999d-433a-aab7-3f626f59fd5f', // Legal Transparency
  'abb99d95-cbb1-4617-8f8b-f220ef6028ca', // Prosecution
];
// ...
{
  key: 'judicial',
  name: 'Judicial Lens',
  description: '8 questions for judicial and DA candidates',
  color: '#C2440A',
  topicIds: JUDICIAL_LENS_TOPICS,
  autoDistrictTypes: ['JUDICIAL', 'NATIONAL_JUDICIAL'],
}
```

### `effectiveActiveView` — the exact hook point (unchanged, read-only for 210)

```javascript
// Source: src/pages/Results.jsx:1448-1461 (Phase 208)
const effectiveActiveView = useMemo(() => {
  switch (activeView) {
    case 'representatives': return 'representatives';
    case 'educators': return hasEducators ? 'educators' : 'representatives';
    case 'judges': return hasJudges ? 'judges' : 'representatives';
    case 'elections': return 'elections';
    default: return 'representatives';
  }
}, [activeView, hasEducators, hasJudges]);
```
210's new tab-entry effect should depend on this value (not the raw `activeView`), since it already
absorbs the D-08 empty-tab fallback — a stale `?view=judges` on a location with no judges resolves
to `'representatives'` here, and 210's effect will correctly apply the Representatives tab's
Best Match/Custom default in that case, never trying to apply a Judicial default to a location with
no judges.

## State of the Art

Not applicable in the traditional sense (no external library API drift to track) — this section
instead documents the phase's own precedent evolution within this codebase:

| Old Approach (pre-204) | Current Approach (204+) | When Changed | Impact on 210 |
|--------------------------|--------------------------|---------------|----------------|
| Per-office auto-lensing (`getEffectiveLensKey(districtScope)`, boolean `lensOverride`) | Single global `activeLensKey` explicitly set via `setActiveLens`, driving every card uniformly | Phase 204 (2026-07-15) | 210 builds a *per-tab* memory layer ON TOP of the still-global `activeLensKey` — it does not resurrect per-office auto-lensing; `getEffectiveLensKey`/`getEffectiveLens`/`toggleLens` are kept only as shims for `Profile.jsx`/`ElectionsView.jsx` (do not touch) |
| Lens persisted via `localStorage['ev:compassLens']`, survives across sessions | Same persistence mechanism, unchanged | Phase 204 | 210's `tabLensMemory` is explicitly NOT this — it's a separate, non-persisted layer that decides *what to feed into* `setActiveLens` on tab entry; the existing `saveLensSelection`/`loadLensSelection` continue to persist the single last-applied lens across page loads independent of which tab was active (acceptable: on reload, `tabLensMemory` resets and the tab-entry effect immediately re-resolves the correct per-tab value, overwriting whatever `loadLensSelection` initialized `activeLensKey` to) |

**Deprecated/outdated:** None — this phase adds to, rather than replaces, the Phase 204 mechanism.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Results.jsx` is never remounted (no `key={...}` reset) on an in-session location/address change, so plain `useState` for `tabLensMemory` satisfies D-02's "persists across location changes within the session." | Architecture Patterns, Pattern 3 | If a remount does occur on location change (not observed in the files read, but not exhaustively traced through every `setSearchMode`/`browseByArea` path), `tabLensMemory` would incorrectly reset per-location instead of per-session, violating D-02. Verify with a manual test during planning/execution: pick a non-default lens on Judges, browse to a different city, confirm the pick survives. |
| A2 | `deriveScopedTopics()` (defined identically in both `Results.jsx:42` and `ElectionsView.jsx:19`) and `computeVariant`/`CompassCardVertical` imports in `Results.jsx` are genuinely dead code (unused at their current call sites), not invoked through some indirection (e.g. a `.map` passing the function reference) this research missed. | Common Pitfalls #2 | Low risk — verified via multiple targeted greps for call-with-parens syntax across the whole file; if wrong, the planner would need to re-verify parity assumptions for `CompassCardVertical` specifically before treating `MiniCompass` as the sole overlay path. |

**If this table is empty:** N/A — two low-risk assumptions logged above; both are cheap to
manually verify during plan execution (a live browser check) rather than requiring upstream
decisions from the user.

## Open Questions

1. **Should `tabLensMemory` be seeded with `TAB_DEFAULTS` on mount, or computed lazily by
   `resolveTabLens` reading `TAB_DEFAULTS` as a fallback when the memory map has no entry yet?**
   - What we know: Both produce identical observable behavior on first render.
   - What's unclear: Whether the planner prefers an explicit `{ representatives: 'custom',
     educators: 'education', judges: 'judicial' }` initial state (more literal/readable) vs. the
     `remembered ?? TAB_DEFAULTS[tabKey] ?? 'custom'` lazy-fallback shown in Pattern 1 (avoids
     ever writing a "default" into memory, keeping D-04's "explicit pick becomes remembered"
     distinction cleaner — an unset entry unambiguously means "never explicitly picked").
   - Recommendation: Use the lazy-fallback form (Pattern 1) — it keeps `tabLensMemory` free of
     any values the user didn't explicitly choose, which simplifies later debugging/telemetry
     ("is this tab on its default, or did the user pick this?" is answerable by checking key
     presence in the memory object).

2. **Does the Education lens key ever appear in the live `GET /compass/lenses` response today
   (e.g. as a not-yet-calibrated placeholder row), or is it entirely absent until Phase 209?**
   - What we know: `LENS_FALLBACKS` (the offline fallback constant) has exactly 3 entries
     (`local`, `federal`, `judicial`) — no `education`. The live API (`compassService.ts` in the
     separate `EV-Accounts` backend repo, per Phase 204's research) was confirmed to return
     `{ key, name, description, color, icon, autoDistrictTypes, topicIds }` per row as of Phase
     204, but this research did not re-query the live `/compass/lenses` endpoint to confirm
     whether a placeholder `education` row exists server-side today.
   - What's unclear: If the backend already has an `education` row with `topicIds: []` (empty),
     `isLensCalibrated` would still correctly return `false` (topicIds.length === 0 check), so
     `resolveTabLens` degrades correctly either way — this only affects whether `LensChipRow`
     would render an always-purple "Education" chip today (if the row exists server-side) vs.
     no chip at all (if absent). Cosmetic only; does not change 210's required behavior.
   - Recommendation: Not blocking for planning — `resolveTabLens`'s `!lens ||
     !isLensCalibrated(...)` check handles both cases identically. Flag for a quick manual
     `curl`/browser-devtools check during execution if the planner wants to know which chip-row
     appearance to expect on the live Educators tab.

## Environment Availability

Not applicable — this phase has no external tool/service/runtime dependencies beyond the existing
frontend build (Vite/React/Vitest, already installed and used by every other frontend phase in this
codebase).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.4 `[VERIFIED: package.json:44]` |
| Config file | `vite.config.js` / `vitest` inline config (existing — no new config needed) |
| Quick run command | `npm run test -- src/lib/compass.test.js` (or the new/extended test file) |
| Full suite command | `npm run test` (`vitest run`, per `package.json:13`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMP-01 | Compass button/overlay works inside Educators and Judges tabs (parity with Representatives) | manual (live browser) — no automated DOM test harness exists for `Results.jsx` today | N/A — visual/interaction verification on the live site, matching how Phase 204/208 were verified (their SUMMARY.md files record live human-verify checkpoints, not automated component tests) | ❌ — no `Results.test.jsx` exists; the codebase's convention (see `classify.test.js`, `compass.test.js`) is to unit-test extracted pure logic, not the page component itself |
| CMP-02 | Switching tabs shifts the default lens (Judges→Judicial, Educators→Education/fallback, Representatives→Best Match); explicit pick overrides | unit | `npm run test -- src/lib/compass.test.js` (if `resolveTabLens` is extracted to `compass.js`) or a new `src/pages/resolveTabLens.test.js`-style co-located file | ❌ Wave 0 — `resolveTabLens` does not exist yet; write it as a pure, exported function specifically so it CAN be unit-tested without mounting `Results.jsx` |

### Sampling Rate
- **Per task commit:** `npm run test -- <new/modified test file>` (fast, targeted)
- **Per wave merge:** `npm run test` (full suite — confirms no regression in `classify.test.js` /
  `compass.test.js`, which exercise adjacent logic this phase reads but does not modify)
- **Phase gate:** Full suite green + a live manual walkthrough of the exact scenario in
  `210-CONTEXT.md`'s Specific Ideas section (Reps[Best Match] → Judges[Judicial] → back to
  Reps[Best Match]; pick Custom on Judges, leave/return → Judges[Custom] remembered; reload →
  Judges back to [Judicial]) before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] Extract `resolveTabLens(tabKey, tabMemory, lenses, userAnswers)` as a pure, exported function
      (recommend adding to `src/lib/compass.js` alongside `isLensCalibrated`, since it directly
      composes that function and the existing lens-lookup pattern) — write unit tests covering:
      unset tab → returns its static default; unlit/missing lens key (simulating `'education'`
      today) → returns `'custom'`; a real lens the user hasn't calibrated → returns `'custom'`; a
      real, calibrated lens → returns that key unchanged; an explicitly-remembered pick → returns
      the remembered value regardless of the tab's static default.
- [ ] No new test framework/config install needed — Vitest is already wired and `classify.test.js`
      / `compass.test.js` are the direct stylistic precedent to follow (plain `describe`/`it`,
      hand-built fixture objects, no mocking framework needed since the target function is pure).

*(Manual/live verification remains the primary gate for the actual tab-switching UI behavior and
chip-highlighting, consistent with how Phases 204 and 208 were verified — there is no existing
component-test harness for `Results.jsx` in this codebase, and building one is out of scope for
this phase.)*

## Sources

### Primary (HIGH confidence — direct code reads, this session)
- `src/contexts/CompassContext.jsx` (full file, 577 lines) — `activeLensKey`, `setActiveLens`,
  `lenses`, `isLensCalibrated`, `enableCompass`, lens-pending auto-select effect (:447-456)
- `src/lib/compass.js` (full file, 785 lines) — `LENS_FALLBACKS`, `JUDICIAL_LENS_TOPICS`,
  `FEDERAL_LENS_TOPICS`, `LOCAL_LENS_TOPICS`, `isLensCalibrated`, `computeDisplaySpokes`,
  `saveLensSelection`/`loadLensSelection`, `LOCAL_LENS_ACTIVE_KEY`/`LOCAL_LENS_SNAPSHOT_KEY`
- `src/pages/Results.jsx` (targeted reads: imports, :365-420, :545-630, :930-1140, :1440-1740,
  :2040-2180) — `effectiveActiveView`, `switchView`, `bucketed`/`hasEducators`/`hasJudges`,
  `activeLens`/`activeLensTopicIds`, `augmentedLenses`, `handleSelectLens`, `compassTopSlot`,
  `renderPeopleTab`, `renderPoliticianCard`, `scopedTopicsForPol`
- `src/lib/classify.js` (full file, 406 lines) — `computeVariant`, `classifyBucket`,
  `classifyCategory`
- `src/pages/Profile.jsx` (:195-262) — the actual `computeVariant`/`districtScope==='judicial'`
  consumer (`JudicialCompassSection` routing), confirmed out of scope for 210
- `src/components/CompassControlsBar.jsx` (full file, 82 lines) — chip row wiring
- `src/components/LensChipRow.jsx` (full file, 191 lines) — `isActive` chip-highlight logic,
  `handleChipClick` calibration gating
- `src/components/MiniCompass.jsx` (full file, 203 lines) — the real per-card overlay component
- `.planning/phases/204-compass-lens-switcher/204-04-SUMMARY.md` — confirms the `T-204-01`
  null-guard and the "Best Match gating" post-checkpoint fix referenced in project memory
- `.planning/phases/204-compass-lens-switcher/204-CONTEXT.md` — Phase 204 decisions/scope,
  `JudicialCompassSection` deferral confirmed
- `.planning/phases/208-educators-judges-tabs/208-PATTERNS.md` and `208-CONTEXT.md` — tab
  mechanism, `classifyBucket` precedent, D-05/D-06/D-10 decisions
- `.planning/phases/210-per-tab-compass-integration/210-CONTEXT.md` — locked D-01..D-06 decisions
- `.planning/REQUIREMENTS.md` — CMP-01, CMP-02 requirement text
- `src/lib/compass.test.js`, `src/lib/classify.test.js` — existing Vitest conventions for this
  codebase's pure-function testing style
- `package.json` (:13, :44) — Vitest version + `test` script confirmation

### Secondary (MEDIUM confidence)
- None required — no WebSearch/Context7 lookups were needed for this phase; it is entirely
  internal-codebase mechanics with no external library API surface.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing stack read directly from `package.json` and
  source files.
- Architecture: HIGH — every claim about `activeLensKey`/`effectiveActiveView`/`switchView`/
  `computeDisplaySpokes`/`isLensCalibrated` is grounded in direct reads of the current file
  contents with cited line numbers, cross-checked against the Phase 204 completion summary.
- Pitfalls: HIGH — the dead-code findings (`computeVariant`, `CompassCardVertical`,
  `deriveScopedTopics` unused in `Results.jsx`) were confirmed via multiple targeted greps
  (call-with-parens vs. bare identifier) rather than a single search, reducing false-negative risk.

**Research date:** 2026-07-19
**Valid until:** 30 days (stable internal codebase mechanics; re-verify line numbers if
`Results.jsx` is substantially refactored before this phase executes, e.g. if Phase 209 lands first
and touches the same file)

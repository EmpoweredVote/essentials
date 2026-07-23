# Phase 204: Compass Lens Switcher — Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 6 (essentials, to modify) + 3 (EV-CompassV2, parity-reference only)
**Analogs found:** 6 / 6 (all analogs are the *current version of the file itself* — this phase evolves existing patterns in place rather than introducing new roles; EV-CompassV2 supplies the only genuinely external analog, for the switcher UI + calibration handoff)

This phase has an unusual pattern-mapping shape: there is no *new* component/service/model role being introduced that lacks a same-repo analog. Every essentials file in scope already contains the pattern it needs to be extended — the "analog" is the file's own existing lens-adjacent code, plus one cross-app reference (EV-CompassV2's shipped switcher) for the pieces essentials has never had (multi-chip row, calibration-state chips, calibration handoff query contract).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/CompassControlsBar.jsx` | component (controls bar) | request-response (user click → context state) | Itself (current binary Lens `stance-btn`, L44-63) + `C:\EV-CompassV2\src\pages\CombinedPage.jsx` switcher UI (L1570-1604) | exact (self) / role-match (cross-app) |
| `src/contexts/CompassContext.jsx` | provider/context (global state) | CRUD (state read/write) + event-driven (persistence) | Itself (`lensOverride`/`toggleLens`/`toggleLocalLens`/`setLocalLens`, L59-102, L428-440; `lenses` state L69-73; hydration L117-120) | exact (self) |
| `src/lib/compass.js` | utility (pure functions + fetch) | transform (spoke selection) + request-response (fetch) | Itself (`computeDisplaySpokes` L486-560; `LOCAL/FEDERAL/JUDICIAL_LENS_TOPICS` L387-431; `GUEST_COMPASS_KEY`/guest cache L115-230) | exact (self) |
| `src/components/CompassCard.jsx` | component (consumer) | request-response | Itself (`getEffectiveLens`/`getEffectiveLensKey` consumption L52-69; `COMPASS_URL`+`ctaHref` handoff L10-11, L117-118; per-card Lens button L290-314) | exact (self) |
| `src/pages/Results.jsx` | page (owns grid state, orchestrates) | CRUD (localStorage-persisted UI state) | Itself (`compassMode`/`lensActive`/`handleToggleLens` L516-556; `CompassControlsBar` render + `compassTopSlot` L1042-1089; `isLocalDistrict`/`getEffectiveLens` per-card use L1477-1500) | exact (self) |
| `src/components/FilterBar.jsx` | component (unchanged trace target) | request-response | Itself (`compassMode` gate button, L126-159) — **not modified**, only traced | exact (self, read-only) |
| *(new, if split out)* `src/components/LensSwitcher.jsx` | component (new) | request-response | `C:\EV-CompassV2\src\pages\CombinedPage.jsx` lens-row block (L1570-1604) — closest shape match anywhere in either repo | role-match (cross-app) |

## Should the switcher be a new file or inlined?

**Recommendation: extract a new component**, e.g. `src/components/LensChipRow.jsx` (or `LensSwitcher.jsx`), rendered from inside `CompassControlsBar.jsx` — do not inline N chips + calibration logic directly into `CompassControlsBar`'s JSX.

Reasoning, grounded in the actual code read:
- `CompassControlsBar.jsx` today is 82 lines total and the Lens toggle is ~20 lines (L41-63) of a 4-control bar (Lens, Stance Min, Stance Max, CompassKey). Replacing that block with an N-lens (data-driven, could be 4-6+ chips), each with hover-prompt state, purple-rim calibration logic, and a click handler that navigates out to `compass.empowered.vote` — that is a materially bigger, stateful sub-tree (each chip needs its own hover/tap-prompt state per D-11). Keeping it inline would roughly triple `CompassControlsBar.jsx`'s size and mix "bar layout" concerns with "per-chip calibration affordance" concerns.
- The closest analog for *this exact shape* — a `.map()` over a lens array rendering pill buttons with active-vs-inactive lens-color styling — is `CombinedPage.jsx` L1576-1593 in EV-CompassV2. That block is itself a self-contained `.map()` render, not woven into a larger control bar; mirroring that separation in essentials means giving it its own file too.
- `CompassControlsBar.jsx` already composes an external component this way (`CompassKey` from `@empoweredvote/ev-ui`, L1 + L78) — the codebase convention is "controls bar = row of composed control widgets," not "controls bar = one flat JSX tree." A new `LensChipRow` component fits that existing composition pattern.
- Practical prop boundary: `LensChipRow` needs `lenses`, the active lens key, a setter, and calibration-check inputs (`userAnswers`) — a clean, narrow prop surface that's easy to also reuse from `CompassCard.jsx` later if per-card controls are ever revisited (currently out of scope, but the separation costs nothing now and avoids re-forking later).

If the planner instead prefers a single-file change for a smaller diff, that is workable too (D-01 through D-12 don't require a separate file) — but the size/composition argument above favors extraction.

## Pattern Assignments

### `src/components/CompassControlsBar.jsx` (component, request-response)

**Analog:** itself, current binary Lens toggle block

**Imports pattern** (line 1):
```jsx
import { CompassKey } from '@empoweredvote/ev-ui';
```
Executor note: add `import LensChipRow from './LensChipRow';` (or whatever the new file is named) alongside this, following the same bare-relative-path convention (no `@/` alias used anywhere in this file).

**Props pattern to extend** (lines 3-10): the component takes flat, individually-named callback props (`onToggleLens`, `onStanceMin`, `onStanceMax`), not a single `compass` object. Follow the same flat-prop convention for the new switcher, e.g. `lenses`, `activeLensKey`, `onSelectLens`, rather than passing the whole `useCompass()` context down.

**Container/layout pattern to reuse** (lines 12-38): the outer `position: isDesktop ? 'absolute' : 'static'` overlay wrapper and the inner `flexWrap: 'wrap'` row are unchanged infrastructure — the switcher renders as a new child inside the existing inner `<div style={{ pointerEvents: 'auto', display: 'flex', flexWrap: 'wrap', ... }}>` (line 38), in the same flow position the Lens `<button>` currently occupies (right before Stance Min/Max, i.e. replacing lines 41-63).

**`stance-btn` pill + coral-active styling to copy** (lines 44-63) — this is the literal visual base for every lens chip (D-01) and for the synthesized "Best Match" chip's coral active-fill (D-07):
```jsx
<button
  className="stance-btn"
  onClick={onToggleLens}
  aria-pressed={lensActive}
  title={lensActive ? 'Lens on — each race focuses on its most relevant issues' : 'Lens off — full compass for every race'}
  style={{
    width: 'auto',
    height: 34,
    padding: '0 12px',
    gap: 6,
    ...(lensActive ? { background: '#FF5740', borderColor: '#FF5740', color: '#fff' } : {}),
  }}
>
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5" />
    <circle cx="12" cy="12" r="3" />
  </svg>
  <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Lens</span>
</button>
```
Key conventions to replicate per-chip:
- Base class `className="stance-btn"` (a shared CSS class — do not reinvent pill styles from scratch; only override `background`/`borderColor`/`color` inline per state, exactly as this block does for the active case).
- Active state uses inline-style override merged via spread (`...(condition ? {...} : {})`), not a separate CSS class or `classnames` helper — this is the established idiom in this file.
- `title` attribute carries the accessible/hover explanation (reuse for D-06 tooltip: `description` from the API lens).
- `aria-pressed` on the active/selected chip (carry over to whichever chip is "selected"; for the purple/needs-calibration chips this should likely be omitted or `false` since they're not selectable yet).
- Icon is inline `<svg>` with `stroke="currentColor"`, `width="15" height="15"` — matches the icon sizing convention to reuse for the new "Best Match" viewfinder icon and the mirrored Federal/Judicial/Local icons from CombinedPage (see below).

**Stance Min/Max buttons stay untouched (lines 64-75)** — no change; only the Lens button (41-63) is replaced. `CompassKey` (line 78) also stays untouched, still last in the row.

---

### `src/contexts/CompassContext.jsx` (provider, CRUD + persistence)

**Analog:** itself — the file already has the shape needed, extend rather than fork.

**Imports pattern** (lines 1-23) — flat named imports from `../lib/compass` and `../lib/auth`; no barrel/index re-exports. Add any new persistence helpers (e.g. a `LENS_SELECTION_KEY`/`saveLensSelection`/`loadLensSelection` pair) to `../lib/compass.js` and import them here the same way `LOCAL_LENS_ACTIVE_KEY`/`saveLocalLensState`/`loadLocalLensState` are imported today (compass.js L399, L438-461) — note these three aren't currently imported into CompassContext.jsx, meaning the existing `LOCAL_LENS_ACTIVE_KEY` persistence helpers in compass.js are *unused dead code* today; Req 11's new persisted `ev:compassLens` key should either resurrect that pattern or add a fresh, analogous one (do not literally reuse `LOCAL_LENS_ACTIVE_KEY`, which is boolean-shaped, not lens-key-shaped).

**`lenses` state + fallback constants — the exact N-lens registry to extend** (lines 67-73):
```jsx
const [lenses, setLenses] = useState(() => [
  { key: 'local',    color: '#5A9A6E', topicIds: LOCAL_LENS_TOPICS,    autoDistrictTypes: ['LOCAL', 'LOCAL_EXEC', 'COUNTY', 'SCHOOL'] },
  { key: 'federal',  color: '#1E3A5F', topicIds: FEDERAL_LENS_TOPICS,  autoDistrictTypes: ['NATIONAL_EXEC', 'NATIONAL_UPPER', 'NATIONAL_LOWER'] },
  { key: 'judicial', color: '#C2440A', topicIds: JUDICIAL_LENS_TOPICS, autoDistrictTypes: ['JUDICIAL', 'NATIONAL_JUDICIAL'] },
]);
```
**Gap to fix (per Req 3 / research flag):** this fallback array — and the hydration in `loadCompassData` — carries only `key/color/topicIds/autoDistrictTypes`, never `name`/`description`/`icon`. The hydration call is:
```jsx
// line 117-120
fetchLenses()
  .then((rows) => { if (Array.isArray(rows) && rows.length > 0) setLenses(rows); })
  .catch(() => { /* keep fallback */ });
```
This already **passes through whatever `fetchLenses()` returns verbatim** (`setLenses(rows)` — it does NOT strip fields), so once `GET /compass/lenses` includes `name`/`description`/`icon` (confirmed live per the resolved research flag — `compassService.ts` already selects them), the live-fetched path already carries them. The only real gap is the **fallback constants array** (lines 69-73) — add `name`/`description` there, mirroring EV-CompassV2's `lenses.js` shape exactly (`LOCAL_LENS`/`FEDERAL_LENS`/`JUDICIAL_LENS` objects, each with `name`/`description`/`color`/`topicIds` — see cross-app excerpt below). Executor should also add a `normalizeApiLens`-style shape-defensive mapper (mirroring `C:\EV-CompassV2\src\lib\lenses.js` L64-74) in `compass.js` if the API response shape needs defensive fallback for a missing `name`/`color`.

**`getEffectiveLens`/`getEffectiveLensKey` — the code to RETIRE** (lines 78-97):
```jsx
const getEffectiveLens = useCallback(
  (districtScope) => (lensOverride != null ? lensOverride : districtScope === 'local'),
  [lensOverride]
);

const getEffectiveLensKey = useCallback(
  (districtScope) => {
    if (lensOverride === false) return null;
    if (districtScope === 'federal') {
      return lenses.some((l) => l.key === 'federal') ? 'federal' : null;
    }
    if (lensOverride === true) return 'local';
    if (districtScope === 'local') return 'local';
    return null;
  },
  [lensOverride, lenses]
);
```
**All call sites that must be traced and migrated when retiring these** (found via search — do not miss any):
- `src/components/CompassCard.jsx` L52-69 (`localLensActive`, `lensKey`, `federalLens`, `lensTopicIds` derivation) and L297 (`toggleLens(localLensActive)` in the per-card Lens button, L290-314) — this per-card toggle is explicitly **out of scope to redesign** (per-card controls rejected), but it reads `getEffectiveLens`/`toggleLens`, so retiring the global auto-lens semantics changes what this button does. Executor must decide: either leave this per-card button wired to the new *global* selected-lens state (so it becomes a "jump to full compass / Best Match" toggle instead of a smart per-office default), or hide it — SPEC doesn't mandate removing it, only retiring the *auto* per-office behavior (Req 8).
- `src/components/ElectionsView.jsx` L293 (destructures `getEffectiveLens`) and L758 (`const raceLensActive = isLocalRace ? getEffectiveLens('local') : false;`), consumed by `MiniCompass` at L839/L870 via `localLensActive` prop. ElectionsView is **not** in the phase's file list per CONTEXT.md, but a literal call-site trace shows it depends on `getEffectiveLens` — flag as a regression risk if `getEffectiveLens` is deleted rather than kept as a deprecated-but-functional shim.
- `src/pages/Results.jsx` L537 (destructures `getEffectiveLens`), L555-556 (`lensActive`/`handleToggleLens`), L1477 (`getEffectiveLens(isLocalDistrict(...) ? 'local' : 'state')`) feeding into the `matchCount`/`showCompassOverlay` pre-check (L1483-1500) — this is the **grid MiniCompass overlay's own "will it render enough spokes" gate**, separate from the CompassControlsBar chip row; it must be re-derived from the new global selected-lens state (or from `computeDisplaySpokes`'s own `hasEnoughSpokes`), not from the retired per-office `getEffectiveLens`.

**`toggleLens`/`toggleLocalLens`/`setLocalLens` — the setter patterns to replace with a persisted single-lens setter** (lines 100-102, 428-440):
```jsx
// Flip relative to the caller's current effective value (per-card usage)
const toggleLens = useCallback((currentEffective) => {
  setLensOverride(!currentEffective);
}, []);

// Grid-level force-on/default toggle
const toggleLocalLens = useCallback(() => {
  setLensOverride((prev) => (prev === true ? null : true));
}, []);

// Explicit tri-state setter: null (auto) | true (force local) | false (full compass)
const setLocalLens = useCallback((value) => {
  setLensOverride(value === null ? null : (value ? true : false));
}, []);
```
Req 11 replaces the tri-state `lensOverride` (`null|true|false`, session-only, line 65's comment explicitly says "intentionally NOT persisted") with a persisted **lens key** (`'custom' | 'local' | 'federal' | 'judicial' | ...`). The new setter should follow the same `useCallback` + `setState` shape but write through to `localStorage` (mirroring the `try { localStorage.setItem(...) } catch {}` idiom used in `Results.jsx` L523 and `compass.js` L440-446's `saveLocalLensState`), e.g.:
```jsx
const setActiveLens = useCallback((lensKey) => {
  setActiveLensKey(lensKey); // 'custom' by default
  try { localStorage.setItem('ev:compassLens', lensKey); } catch {}
}, []);
```
and hydrate on mount the same way `compassMode` is read in `Results.jsx` L517-519 (`useState(() => { try { return localStorage.getItem(...) } catch { return default } })`).

**`refreshData`/hydration note:** there is no function literally named `refreshData` in essentials' `CompassContext.jsx` — the equivalent is `loadCompassData` (lines 105-261). The CONTEXT.md's mention of "`refreshData` hydration that currently DROPS name/description/icon" refers to the `fetchLenses().then((rows) => setLenses(rows))` block (lines 117-120) — confirmed above this does NOT drop fields (it passes API rows through verbatim); the drop only happens in the **fallback constants** (lines 69-73). Executor should not spend time hunting for a `refreshData` function that doesn't exist by that name in this repo.

**`value`/memo export pattern** (lines 460-525): every piece of context state and every callback is added to both the `useMemo(() => ({...}), [...])` return object and its dependency array — the new `activeLensKey`/`setActiveLens`/calibration-check helpers must be added to both lists, following the existing ordering convention (state values first, then derived booleans like `localLensActive: lensOverride === true` at line 487, then callbacks).

---

### `src/lib/compass.js` (utility, transform + fetch)

**Analog:** itself — `computeDisplaySpokes` already implements the "topics both answered, prefer chosen set, cap 8" logic; extend it.

**`fetchLenses` — the live-data fetch to keep unchanged** (lines 14-22):
```jsx
// Compass lenses: [{ key, name, description, color, icon, autoDistrictTypes, topicIds }]
// publicFetch — lenses are public reference data. Returns [] on any failure so
// callers fall back to the bundled *_LENS_TOPICS constants below.
export async function fetchLenses() {
  try {
    const res = await publicFetch('/compass/lenses');
    if (!res || !res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
```
Note the docstring **already documents** `name`/`description`/`icon` in the expected shape — this function needs zero changes; it's the fallback constants + context state shape that lag behind it.

**`GUEST_COMPASS_KEY` + guest cache — the persistence idiom to mirror for the new lens-selection key** (lines 115, 195-230): key constant, `save*`/`load*`/`clear*` triplet, `try/catch` wrapping every localStorage call, JSON.stringify/parse with defensive shape validation on read (`typeof parsed.a !== "object" || ...`). A new `saveLensSelection(lensKey)`/`loadLensSelection()` pair (or reusing/fixing the existing-but-unused `saveLocalLensState`/`loadLocalLensState`, lines 438-461) should follow this exact triplet shape.

**`LOCAL_LENS_TOPICS`/`FEDERAL_LENS_TOPICS`/`JUDICIAL_LENS_TOPICS` (lines 387-431)** — already documented as mirroring `EV-CompassV2/src/lib/lenses.js`; these are the topic-ID arrays consumed by `computeDisplaySpokes`'s `lensTopicIds`/`localLensActive` params. Executor should add `name`/`description` alongside these as new exported constants (e.g. `LOCAL_LENS_META = { name: 'Local Lens', description: '...' }`) or fold them into a richer `LENSES` fallback array analogous to EV-CompassV2's `export const LENSES = [LOCAL_LENS, JUDICIAL_LENS, FEDERAL_LENS];` (lenses.js L61) — essentials currently has no equivalent aggregate export, only three separate topic-ID arrays plus the ad-hoc array literal inside `CompassContext.jsx` (L69-73).

**`computeDisplaySpokes()` — the spoke engine to extend, not fork** (lines 486-560, full function read):
- Signature today: `{ selectedTopics, userAnswers, polAnswers, scopedTopics, maxSpokes = 8, localLensActive = false, lensTopicIds = null }`.
- Preference-order logic (lines 518-527): explicit `lensTopicIds` wins over `localLensActive` wins over `selectedTopics`, each capped `.slice(0, maxSpokes)` — this cap-then-filter-by-both-answered pattern (lines 531-544) is exactly the "compass topics first" half of Req 9's Best Match algorithm; the "then fill remaining slots with biggest-disagreement topics, ties by display order" half is new and must be added as an additional fill pass **after** the existing `chosen`/`displayTopicIds` loop, only when `preferredIds` is the user's own `selectedTopics` (i.e., the Best Match/`custom` case) and `displayTopicIds.length < maxSpokes` while more both-answered candidates remain in `scopedTopics`. "Biggest stance difference" is computable as `Math.abs(userValue - polValue)` per topic from the same `userAnsweredSet`/`polAnsweredSet` Maps already being built (lines 501-502) — extend those from `Set` to value-carrying `Map`s if per-topic values are needed for the disagreement sort, or look up values from `userAnswers`/`polAnswers` arrays directly.
- `hasEnoughSpokes` (line 557: `displayTopicIds.length >= 3`) — this is the existing "not enough shared topics" threshold (Req 10); no change needed, just confirm the narrow-lens path (`lensTopicIds` set, few both-answered) still routes through this same check rather than a new one.
- The **`min(8, size)` calibration-readiness check (Req 4)** is a *new, separate* function — it is not spoke selection, it's "has the user answered enough of this lens's topics to unlock it," e.g. `isLensCalibrated(lens, userAnswers)` computing `userAnswers.filter(a => lens.topicIds.includes(a.topic_id) && a.value > 0).length >= Math.min(8, lens.topicIds.length)`. This belongs in `compass.js` beside `computeDisplaySpokes` (same "pure function, testable, used by multiple components" category) rather than being inlined in the new switcher component, mirroring how `computeStanceSpokes` (lines 572-586) sits alongside `computeDisplaySpokes` as a second pure spoke-adjacent utility in the same file.

**`COMPASS_URL` + return handoff pattern — copy verbatim, extend query params** (also see CompassCard.jsx below for the canonical instance): `compass.js` itself does not define `COMPASS_URL` (it's redefined independently in three files — `CompassCard.jsx` L10, `ElectionsView.jsx` L16, `Results.jsx` L1042 — all identical: `import.meta.env.VITE_COMPASS_URL || 'https://compass.empowered.vote'`). This is a duplicated-constant pattern already in the codebase (not centralized in `compass.js`) — the new calibration-handoff code should follow this existing duplication convention (redefine the constant locally in whichever new file needs it) rather than introducing a new shared export, unless the executor wants to opportunistically centralize it (optional cleanup, not required by SPEC).

---

### `src/components/CompassCard.jsx` (component, request-response) — read for the handoff model only; not modified by this phase's core work (grid-only), but consumers must not break

**Analog:** itself (this IS the canonical "Take the Quiz" handoff pattern the CONTEXT.md points to)

**`COMPASS_URL` + `ctaHref` — the exact pattern to copy for the calibration handoff** (lines 10-11, 117-118):
```jsx
const COMPASS_URL = import.meta.env.VITE_COMPASS_URL || 'https://compass.empowered.vote';
...
const returnUrl = window.location.origin + location.pathname + location.search;
const ctaHref = `${COMPASS_URL}?return=${encodeURIComponent(returnUrl)}`;
```
For the purple-chip calibration handoff (D-10/Req 7), extend this exact pattern by adding the `calibrate=<lensKey>` param the research flag confirmed EV-CompassV2 now consumes:
```jsx
const calibrateHref = `${COMPASS_URL}?calibrate=${lensKey}&return=${encodeURIComponent(returnUrl)}`;
```
`location` here comes from `useLocation()` (react-router-dom, line 3) — the new switcher component (wherever it lives) needs the same hook if it needs its own return URL, or this can be computed once in `Results.jsx` (which already has `window.location.href` available at L1044 in `handleBuildCompass`) and passed down as a prop — follow whichever placement keeps the URL-building logic in one place per component tree, matching how `CompassControlsBar` currently receives callbacks (`onToggleLens` etc.) rather than building hrefs itself.

**Existing per-card Lens button + PostHog convention to mirror for the new switcher's analytics** (lines 290-314, esp. line 297):
```jsx
onClick={() => { posthog?.capture('essentials_compass_local_lens_toggled', { active: !localLensActive }); toggleLens(localLensActive); }}
```
New event naming (per CONTEXT.md's discretion note) should mirror this `essentials_compass_<subject>_<verb>` convention, e.g. `essentials_compass_lens_selected` with a `{ lens: lensKey }` payload, fired from the chip's `onClick` alongside the state-setting call, in the same inline-arrow-function style (no separate handler function extracted for this one-liner).

**Dark-mode conditional-style idiom used throughout this file** (e.g. lines 303-306) — `isDark` from `useTheme()` (line 8, `import { useTheme } from '../hooks/useTheme';`) drives ternaries directly in the `style={{...}}` object; this is the convention to follow for any dark-mode-specific chip accent variants (D-02's discretion item), not a separate CSS module or `dark:` Tailwind class (this file mixes literal `style` objects with Tailwind utility classes on the outer wrapper only, e.g. line 282's `className="mt-8"` — inline style objects are used for anything color/state-driven).

---

### `src/pages/Results.jsx` (page, CRUD/persisted UI state)

**Analog:** itself

**`compassMode` persisted-boolean pattern — the exact idiom the new persisted lens key should mirror** (lines 516-525):
```jsx
const [compassMode, setCompassMode] = useState(() => {
  try { return localStorage.getItem('ev:compassMode') === 'true'; } catch { return false; }
});
const handleCompassModeChange = (val) => {
  posthog?.capture('essentials_compass_mode_toggled', { enabled: val });
  setCompassMode(val);
  try { localStorage.setItem('ev:compassMode', val ? 'true' : 'false'); } catch {}
  if (val) enableCompass();
};
```
This is the template for wherever the new `ev:compassLens` persisted state lives (whether in `Results.jsx` or lifted into `CompassContext.jsx` — CONTEXT.md's Req 11 implies context-level since it must apply globally across pages/cards, so prefer adding this in `CompassContext.jsx` per the pattern already assigned there above; if instead kept page-local, copy this exact `useState(() => try/catch localStorage.getItem)` + `try/catch localStorage.setItem` shape).

**`isLocalDistrict()` — scope-mapping helper to trace, not necessarily modify** (lines 55-60):
```jsx
function isLocalDistrict(districtType) {
  const upper = String(districtType || '').toUpperCase();
  return upper === 'LOCAL' || upper === 'LOCAL_EXEC' || upper === 'COUNTY';
}
```
Used only at line 1477 to feed `getEffectiveLens(isLocalDistrict(...) ? 'local' : 'state')` for the grid's per-card `matchCount`/`showCompassOverlay` pre-check (lines 1476-1500) — this is a **different concern** than lens *display/topic-set selection*; it's purely "will this card's MiniCompass have ≥3 spokes to justify showing the overlay at all." When retiring auto-lensing, this pre-check must be re-derived using the new **global selected lens** (or Best Match) rather than the per-office default, but the ≥3 threshold and the surrounding `matchCount` computation (lines 1486-1499, which itself duplicates `computeDisplaySpokes`'s "both answered + in scope" logic inline) should stay structurally the same — only the source of `preferredForPol` (line 1489: currently `polLensActive ? LOCAL_LENS_TOPICS : (selectedTopics || [])`) changes to read from the new active-lens topic set.

**`CompassControlsBar` render site + `compassTopSlot` gating — where the new switcher's props get wired in** (lines 1053-1089): `compassControlsSlot` wraps `<CompassControlsBar>` in a `position: relative` zero-height anchor; `compassTopSlot` is `null` unless `compassMode` is true (satisfies Req 1's "row renders only when compassMode is on"), and further gates on `compassCalibrated` (≥3 answers) vs. a CTA slot. The new lens-chip props (`lenses`, `activeLensKey`, `onSelectLens`, calibration-check data) should be threaded into this same `<CompassControlsBar ... />` call alongside the existing `userAnswers`/`lensActive`/`onToggleLens`/`onStanceMin`/`onStanceMax`/`isDesktop` props, following the same flat-prop convention already used here.

**`FilterBar.jsx` `compassMode` gate — read-only, do not modify** (lines 126-159, `onCompassModeChange`/`compassMode` prop pair driving the compass on/off logo button) — confirmed unchanged per SPEC boundaries; Results.jsx's `handleCompassModeChange` (above) is the single source of truth this gate calls into, and the new switcher's visibility continues to derive from the same `compassMode` state, no new gate needed.

---

## Cross-App Parity Reference (EV-CompassV2 — read for shape, do not fork blindly into essentials)

### `C:\EV-CompassV2\src\lib\lenses.js` — canonical lens object shape to mirror in essentials' fallback constants

```js
export const LOCAL_LENS = {
  key: 'local',
  name: 'Local Lens',
  description: '8 questions most local candidates have already answered',
  color: '#5A9A6E',
  topicIds: [ /* ... */ ],
};
// ... JUDICIAL_LENS, FEDERAL_LENS analogous
export const LENSES = [LOCAL_LENS, JUDICIAL_LENS, FEDERAL_LENS];

export function normalizeApiLens(l) {
  return {
    key: l.key,
    name: l.name,
    description: l.description,
    color: l.color,
    icon: l.icon,
    topicIds: Array.isArray(l.topicIds) ? l.topicIds : [],
    autoDistrictTypes: Array.isArray(l.autoDistrictTypes) ? l.autoDistrictTypes : [],
  };
}

export function isLensTopicSet(topicIds, lenses = LENSES) {
  if (!Array.isArray(topicIds) || topicIds.length === 0) return false;
  const list = Array.isArray(lenses) && lenses.length > 0 ? lenses : LENSES;
  const everyIn = (lens) => topicIds.every((id) => lens.topicIds.includes(id));
  return list.some(everyIn);
}
```
essentials' `compass.js` should add an equivalent `normalizeApiLens`-style defensive mapper wherever `fetchLenses()`'s rows are consumed, and align its fallback-constants shape (`name`/`description` additions) to this exact object shape.

### `C:\EV-CompassV2\src\pages\CombinedPage.jsx` — the switcher UI + icons + calibration handoff to mirror

**`renderLensIcon` — the icon set to mirror for D-04** (lines 1325-1345):
```jsx
const renderLensIcon = (key) => {
  if (key === 'federal') {
    return (/* Capitol-dome SVG, viewBox 0 0 24 24, w-3.5 h-3.5 */);
  }
  if (key === 'judicial') {
    return (/* gavel/scales SVG, viewBox 0 0 20 20, w-3.5 h-3.5 */);
  }
  return (/* house SVG (local default), viewBox 0 0 20 20, w-3.5 h-3.5 */);
};
```
essentials should add its own `renderLensIcon`/icon-map (SVGs copied verbatim from these paths — see full excerpt already captured above in the read — reusing `stroke="currentColor"` for federal, `fill="currentColor"` for judicial/local, matching the two different icon-drawing conventions in this file) plus a new **viewfinder/target icon** for the synthesized Best Match chip (D-07) — CompassControlsBar's current Lens button (line 58-61 in essentials) already has a viewfinder SVG that can be reused directly for this purpose since it's the same "focus" metaphor D-07 calls for.

**Lens-row `.map()` render — the closest existing "N chips with active-lens-color fill" shape in either repo** (lines 1576-1593):
```jsx
{[FEDERAL_LENS, LOCAL_LENS, JUDICIAL_LENS].map((lens) => {
  const active = activeLens?.key === lens.key;
  const label = lens.key === 'federal' ? 'Federal' : lens.key === 'local' ? 'Local' : 'Judicial';
  return (
    <button
      key={lens.key}
      onClick={() => doStartLens(lens)}
      title={active ? `${lens.name} active — click to restore your compass` : lens.name}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95"
      style={active
        ? { background: lens.color, color: '#fff', borderColor: lens.color }
        : { background: 'transparent', color: lens.color, borderColor: lens.color }}
    >
      {renderLensIcon(lens.key)}
      {label}
    </button>
  );
})}
```
Direct parallel for D-02 (active chip = own lens color, white text): `active ? { background: lens.color, color: '#fff', borderColor: lens.color } : { background: 'transparent', color: lens.color, borderColor: lens.color }`. essentials' version should additionally express D-03's purple-rim greyed state as a third style branch (needs-calibration): grey fill + `border: '1.5px solid <purple>'` + dimmed text — not present in this CompassV2 excerpt (CompassV2 doesn't yet model a not-calibrated visual state the same way; this is genuinely new UI, use D-03's spec language directly).

**`doCalibrateLens`/cross-app handoff consumption — confirms the query contract already resolved in CONTEXT.md's research flags** (lines 1379-1407): `App.jsx` stashes `?calibrate=<key>` into `sessionStorage.start_calibrate_lens`; `CombinedPage` consumes it once lenses+topics load and calls `doCalibrateLens(lensByKey(key))`. Essentials' side of this contract is only to construct the outbound URL correctly (`?calibrate=<lensKey>&return=<url>`, per the `ctaHref` pattern above) — no essentials-side change needed to the consumption logic since it lives entirely in EV-CompassV2 and is already shipped (per the resolved research flag).

## Shared Patterns

### `stance-btn` pill base class
**Source:** `src/components/CompassControlsBar.jsx` line 45 (`className="stance-btn"`)
**Apply to:** every lens chip in the new switcher (D-01) — do not introduce a new CSS class; only vary inline `style` overrides for active/purple-rim states, matching the existing single-button precedent in this same file.

### localStorage persisted-boolean/string idiom
**Source:** `src/pages/Results.jsx` lines 516-525 (`compassMode`) and `src/lib/compass.js` lines 438-461 (`saveLocalLensState`/`loadLocalLensState`, currently unused but structurally correct)
**Apply to:** the new `ev:compassLens` persisted lens-key state (Req 11) — always `useState(() => { try {...} catch { return default } })` on read, always `try { localStorage.setItem(...) } catch {}` on write, never let a storage exception break render.

### `COMPASS_URL` + `return=` query handoff
**Source:** `src/components/CompassCard.jsx` lines 10-11, 117-118 (also duplicated identically in `ElectionsView.jsx` L16/L307 and `Results.jsx` L1042/L1045)
**Apply to:** the new purple-chip calibration handoff — extend with `&calibrate=<lensKey>`, keep the `encodeURIComponent(returnUrl)` pattern and the `import.meta.env.VITE_COMPASS_URL || 'https://...'` fallback-constant convention (redefine locally per file rather than centralizing, matching existing triplication).

### PostHog event naming
**Source:** `src/components/CompassCard.jsx` line 297 (`essentials_compass_local_lens_toggled`), `src/pages/Results.jsx` line 521 (`essentials_compass_mode_toggled`)
**Apply to:** new lens-selection event, e.g. `essentials_compass_lens_selected` with `{ lens: lensKey }` payload — fired inline in the chip's `onClick`, not in a `useEffect`.

### Dark-mode inline-style ternaries via `useTheme()`
**Source:** `src/components/CompassCard.jsx` lines 8, 303-306; `src/components/FilterBar.jsx` lines 74-79
**Apply to:** any chip color variant that needs dark-mode adjustment (D-02 discretion item on federal-navy contrast) — `isDark ? X : Y` inline in the `style` object, not a Tailwind `dark:` class, matching how every other compass-adjacent component in this codebase handles theme.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Purple-rim "needs calibration" chip visual state (grey fill + purple ring + dimmed label) | component sub-state | request-response | Neither essentials nor EV-CompassV2 currently render a not-yet-calibrated lens state visually — CompassV2's lens buttons are binary active/inactive only (see excerpt above). This is genuinely new UI; build from D-03's spec language, reusing the `stance-btn`/pill-override idiom as the base. |
| Mobile tap-to-prompt interaction for purple chips (D-11: first tap reveals prompt, second tap navigates) | component interaction pattern | event-driven | No existing "two-tap confirm" pattern found anywhere in `CompassControlsBar.jsx`, `CompassCard.jsx`, or the EV-CompassV2 switcher (which is desktop-hover-only, no distinct mobile calibration-prompt behavior). Build fresh, likely as local `useState` hover/tapped-chip-key state in the new switcher component. |
| Best-Match biggest-disagreement fill algorithm (Req 9's second half) | utility/transform | transform | `computeDisplaySpokes` (compass.js L486-560) implements the "compass topics first, capped at 8" half exactly; the "fill remaining slots by largest stance-difference, tie-break by topic order" half has no existing implementation anywhere in either repo — must be authored new, as an extension to this function per the plan above. |

## Metadata

**Analog search scope:** `src/components/`, `src/contexts/`, `src/lib/`, `src/pages/` (essentials); `src/lib/lenses.js` + `src/pages/CombinedPage.jsx` (EV-CompassV2, read-only parity reference)
**Files scanned:** `CompassControlsBar.jsx`, `CompassContext.jsx`, `compass.js` (full read across 3 targeted ranges), `CompassCard.jsx` (imports + L1-160 + L270-315), `FilterBar.jsx` (L60-160), `Results.jsx` (L40-70, L510-565, L1030-1125, L1465-1510), `ElectionsView.jsx` (grep only, lens call sites), `MiniCompass.jsx` (grep only, prop consumption), `EV-CompassV2/src/lib/lenses.js` (full), `EV-CompassV2/src/pages/CombinedPage.jsx` (L1200-1610 targeted)
**Pattern extraction date:** 2026-07-14

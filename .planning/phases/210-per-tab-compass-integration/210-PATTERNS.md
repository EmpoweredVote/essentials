# Phase 210: Per-Tab Compass Integration - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 2 (1 modified, 1 modified-optional)
**Analogs found:** 2 / 2 (both patterns exist in the SAME files being modified — this phase extends
existing mechanisms in place rather than introducing a new architectural shape)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/pages/Results.jsx` (add `tabLensMemory` state + tab-entry effect + `handleSelectLens` interception) | controller/page (React component, client-state orchestration) | event-driven (tab switch, explicit user pick) | Same file's existing `augmentedLenses`/`handleSelectLens`/`effectiveActiveView` (Phase 204/208) | exact — this is in-place extension of an existing pattern, not a new one |
| `src/lib/compass.js` (add `resolveTabLens` pure helper, OPTIONAL extraction target) | utility (pure function) | transform | Same file's `isLensCalibrated` (lines 544-554) | exact — same file, same "pure function consuming lens+userAnswers, returning a decision" shape |
| `src/lib/compass.test.js` (add tests for `resolveTabLens`, if extracted) | test | transform | Same file's `describe('isLensCalibrated', ...)` block (lines 213-230) | exact |

No components/services/models/migrations are created. This phase touches zero backend, zero new
files (per RESEARCH.md "Recommended Project Structure" — extension only, `compass.js` extraction is
optional discretion, not required).

## Pattern Assignments

### `src/pages/Results.jsx` — new `tabLensMemory` state + tab-entry effect (event-driven, client state)

**Analog:** the file's own existing lens-switcher wiring from Phase 204 (same file, lines 548-598,
944-955, 1100-1103) — this phase adds a memory layer around calls that already exist; do not invent
a new state-management style.

**Context read (compass destructure from `useCompass()`, verbatim, line 549):**
```javascript
const { isLoggedIn, userId, politicianIdsWithStances, allTopics, userAnswers: rawUserAnswers,
  selectedTopics, userJurisdiction, myRepresentatives, myRepresentativesAddress, compassLoading,
  suggestedSaveAddress, dismissSuggestedSaveAddress, invertedSpokes, batchInvertSpokes,
  activeLensKey, setActiveLens, lenses, isLensCalibrated, enableCompass } = useCompass();
```
`isLensCalibrated` is already imported into scope here via the context — `resolveTabLens` can reuse
it directly without a new import in `Results.jsx` (only needed as a new import if extracted to and
re-exported from `compass.js`).

**`effectiveActiveView` — the exact hook point for the new tab-entry effect (lines 1448-1461, read-only, DO NOT MODIFY):**
```javascript
// D-08 / T-208-01/T-208-02: never trust the raw `?view=` param. Validate
// against the known tab set and fall back to Representatives when the
// active tab is unknown OR empty for this location...
const effectiveActiveView = useMemo(() => {
  switch (activeView) {
    case 'representatives':
      return 'representatives';
    case 'educators':
      return hasEducators ? 'educators' : 'representatives';
    case 'judges':
      return hasJudges ? 'judges' : 'representatives';
    case 'elections':
      return 'elections';
    default:
      return 'representatives';
  }
}, [activeView, hasEducators, hasJudges]);
```
The new tab-entry `useEffect` must depend on `effectiveActiveView` (not raw `activeView`) — this is
confirmed by RESEARCH.md as the single hook point absorbing all three entry paths (click,
fallback-redirect, direct URL load).

**`switchView` — confirmed it does NOT set any lens state (lines 944-955, read-only precedent for "what NOT to add here"):**
```javascript
const switchView = (view) => {
  posthog?.capture('essentials_tab_switched', { from: activeView, to: view });
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    if (view === 'representatives') {
      next.delete('view');
    } else {
      next.set('view', view);
    }
    return next;
  });
};
```
Confirms RESEARCH.md's Alternatives-Considered finding: `switchView` only fires on click, never on
URL-load or fallback-redirect — so the new lens-apply logic belongs in a `useEffect` keyed on
`effectiveActiveView`, NOT inlined into `switchView`.

**Existing `handleSelectLens` to intercept/extend (lines 584-587, MODIFY this exact block):**
```javascript
const handleSelectLens = (key) => {
  posthog?.capture('essentials_compass_lens_selected', { lens: key });
  setActiveLens(key);
};
```
Per RESEARCH.md Pattern 2, extend to:
```javascript
const handleSelectLens = (key) => {
  posthog?.capture('essentials_compass_lens_selected', { lens: key, tab: effectiveActiveView });
  setTabLensMemory((prev) => ({ ...prev, [effectiveActiveView]: key })); // D-04
  setActiveLens(key);
};
```

**`augmentedLenses` — the synthesized 'custom'/Best Match chip (lines 568-582, read-only, `resolveTabLens` must resolve to a key that exists in this set):**
```javascript
const augmentedLenses = useMemo(() => {
  const custom = {
    key: 'custom',
    name: 'Best Match',
    color: '#FF5740',
    calibrated: (rawUserAnswers?.length ?? 0) >= 3,
    topicCount: 0,
  };
  const named = (lenses || []).map((lens) => ({
    ...lens,
    calibrated: isLensCalibrated(lens, rawUserAnswers),
    topicCount: Array.isArray(lens.topicIds) ? lens.topicIds.length : 0,
  }));
  return [custom, ...named];
}, [lenses, rawUserAnswers, isLensCalibrated]);
```

**`activeLens`/`activeLensTopicIds` derivation (lines 597-598, read-only — this is why an unresolved key silently degrades rather than throwing, T-204-01):**
```javascript
const activeLens = activeLensKey === 'custom' ? null : lenses.find((l) => l.key === activeLensKey);
const activeLensTopicIds = activeLens ? activeLens.topicIds : null;
```

**Where `activeLensKey`/`activeLensTopicIds` feed the per-card overlay — `renderPoliticianCard` (lines 1600, 1617, 1701-1712, read-only; confirms there is exactly ONE card-rendering path shared by all three people-tabs, so no per-tab special-casing is needed downstream of `activeLensKey`):**
```javascript
// line 1600-1602
const scopedTopicsForPol = activeLensKey === 'local'
  ? allTopics.filter((t) => t.applies_local !== false)
  : allTopics;
// line 1617
const preferredForPol = (activeLensKey === 'custom' ? [] : activeLensTopicIds) || [];
// lines 1701-1712 (MiniCompass call site — the actual overlay component)
<MiniCompass
  userAnswers={rawUserAnswers}
  polAnswers={polAnswersForMini}
  selectedTopics={selectedTopics}
  scopedTopics={scopedTopicsForPol}
  invertedSpokes={invertedSpokes}
  lensTopicIds={activeLensTopicIds}
  localLensActive={activeLensKey === 'local'}
  isDark={isDark}
  size={190}
/>
```

**`compassTopSlot` — where the switcher renders (lines 1100-1108 wiring, 1128-1132 gating, read-only — do not gate the new tab-entry effect on `compassMode`, per RESEARCH.md Anti-Patterns):**
```javascript
// lines 1100-1107
lenses={augmentedLenses}
activeLensKey={activeLensKey}
onSelectLens={handleSelectLens}
onCalibrate={handleCalibrateLens}
onStanceMin={handleStanceMin}
onStanceMax={handleStanceMax}
isDesktop={isDesktop}
...
// lines 1128-1132
const compassTopSlot = !compassMode
  ? null
  : compassCalibrated
    ? compassControlsSlot
    : (compassLoading ? null : compassCtaSlot);
```

**Tab buttons — confirms `effectiveActiveView`/`switchView` are the only two things the tab row touches (lines 2058-2085, read-only):**
```javascript
<button className={tabButtonClass(effectiveActiveView === 'representatives')} onClick={() => switchView('representatives')}>
  Representatives
</button>
{hasEducators && (
  <button className={tabButtonClass(effectiveActiveView === 'educators')} onClick={() => switchView('educators')}>
    Educators
  </button>
)}
{hasJudges && (
  <button className={tabButtonClass(effectiveActiveView === 'judges')} onClick={() => switchView('judges')}>
    Judges
  </button>
)}
```

---

### `src/lib/compass.js` — `isLensCalibrated` as the analog for the new `resolveTabLens` pure helper

**Analog:** `isLensCalibrated` (lines 544-554) — same "pure function, no React/DOM dependency, takes
a lens + userAnswers, returns a decision" shape that `resolveTabLens` should follow.

**Full analog function (verbatim, read-only — reuse via import, do not duplicate this logic):**
```javascript
/**
 * A lens is "calibrated" (ready/LIT) once the user has answered (value > 0)
 * at least min(8, lens.topicIds.length) of its topics (Req 4).
 * Custom/"Best Match" readiness (>=3 answers) is decided by the caller — this
 * function is only for named lenses that carry a topicIds array.
 */
export function isLensCalibrated(lens, userAnswers) {
  const topicIds = Array.isArray(lens?.topicIds) ? lens.topicIds : [];
  if (topicIds.length === 0) return false;
  const idSet = new Set(topicIds.map(String));
  const answered = Array.isArray(userAnswers) ? userAnswers : [];
  let count = 0;
  for (const a of answered) {
    if (a && a.value > 0 && idSet.has(String(a.topic_id))) count += 1;
  }
  return count >= Math.min(8, topicIds.length);
}
```

**JUDICIAL_LENS_TOPICS — confirms Judges→Judicial is a REAL, live lens today (lines 406-415, read-only — resolves RESEARCH.md's Key Question #2/Pitfall #1):**
```javascript
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
```

**LENS_FALLBACKS — confirms `'education'` does NOT exist as a key here today (lines 470-495, read-only — confirms D-06's premise that the tab must degrade defensively):**
```javascript
export const LENS_FALLBACKS = [
  { key: 'local', name: 'Local Lens', ... , topicIds: LOCAL_LENS_TOPICS, autoDistrictTypes: [...] },
  { key: 'federal', name: 'Federal Lens', ... , topicIds: FEDERAL_LENS_TOPICS, autoDistrictTypes: [...] },
  { key: 'judicial', name: 'Judicial Lens', ... , topicIds: JUDICIAL_LENS_TOPICS, autoDistrictTypes: [...] },
];
```
Exactly 3 entries — no `education` key. `resolveTabLens`'s `!lens || !isLensCalibrated(lens, userAnswers)`
check must treat a missing/absent key identically to an uncalibrated one (both → `'custom'`).

**Contrast precedent for D-02 (in-memory, NOT persisted) — `LOCAL_LENS_ACTIVE_KEY` (lines 399-400, read-only, this is what NOT to imitate for `tabLensMemory`):**
```javascript
export const LOCAL_LENS_ACTIVE_KEY = 'ev:localLensActive';
export const LOCAL_LENS_SNAPSHOT_KEY = 'ev:localLensSnapshot';
```
`saveLocalLensState`/`loadLocalLensState` (lines 438-461) wrap these in `localStorage`. `tabLensMemory`
must NOT follow this pattern — it stays a plain in-memory `useState`, no `localStorage` calls, per D-02.

---

### `src/lib/compass.test.js` — test-style analog for new `resolveTabLens` tests (if extracted)

**Analog:** `describe('isLensCalibrated', ...)` block (lines 213-230) — same fixture style
(`lens8`/`lens6` plain objects, `ans(topic_id, value)` helper already defined at line 36) to reuse
for `resolveTabLens` fixtures.

**Verbatim excerpt:**
```javascript
describe('isLensCalibrated', () => {
  const lens8 = { topicIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] };
  const lens6 = { topicIds: ['a', 'b', 'c', 'd', 'e', 'f'] };

  it('is true for an 8-topic lens only when >=8 topics have value>0', () => {
    const answers8 = lens8.topicIds.map((id) => ans(id, 3));
    expect(isLensCalibrated(lens8, answers8)).toBe(true);

    const answers7 = lens8.topicIds.slice(0, 7).map((id) => ans(id, 3));
    expect(isLensCalibrated(lens8, answers7)).toBe(false);
  });

  it('ignores zero-value answers when counting', () => {
    const answers = [
      ...lens8.topicIds.slice(0, 7).map((id) => ans(id, 3)),
      ans(lens8.topicIds[7], 0), // value 0 does not count
    ];
    ...
```

**Helper functions already in file (lines 35-36, reuse, do not redefine):**
```javascript
const topic = (id, short_title) => ({ id, short_title });
const ans = (topic_id, value = 4) => ({ topic_id, value });
```

**Existing import block to extend if `resolveTabLens` is added to `compass.js` (lines 17-33):**
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeDisplaySpokes,
  LOCAL_LENS_TOPICS,
  FEDERAL_LENS_TOPICS,
  JUDICIAL_LENS_TOPICS,
  LENS_FALLBACKS,
  LENS_SELECTION_KEY,
  sanitizeLensColor,
  normalizeApiLens,
  isLensCalibrated,
  saveLensSelection,
  loadLensSelection,
  saveLensPending,
  loadLensPending,
  clearLensPending,
} from './compass.js';
```
Add `resolveTabLens` to this import list if extracted there (recommended per RESEARCH.md's Wave 0
Gaps — co-locate with `isLensCalibrated` since it directly composes it).

Recommended test cases (from RESEARCH.md's Wave 0 Gaps, mapped onto this file's `describe`/`it` style):
1. unset tab → returns its static default (`TAB_DEFAULTS[tabKey]`)
2. unlit/missing lens key (simulating `'education'` today, absent from `LENS_FALLBACKS`) → returns `'custom'`
3. a real lens (e.g. `judicial`) the user hasn't calibrated → returns `'custom'`
4. a real, calibrated lens → returns that key unchanged
5. an explicitly-remembered pick in `tabMemory` → returns the remembered value regardless of the tab's static default

---

## Shared Patterns

### Pure resolver pattern (compose, don't duplicate, existing readiness checks)
**Source:** `src/lib/compass.js:544-554` (`isLensCalibrated`)
**Apply to:** the new `resolveTabLens(tabKey, tabMemory, lenses, userAnswers)` function
```javascript
// Recommended shape (RESEARCH.md Pattern 1, adjusted to compose isLensCalibrated by import
// rather than re-deriving the readiness threshold):
const TAB_DEFAULTS = {
  representatives: 'custom',
  educators: 'education',
  judges: 'judicial',
};

function resolveTabLens(tabKey, tabMemory, lenses, userAnswers) {
  const remembered = tabMemory[tabKey];
  const candidate = remembered ?? TAB_DEFAULTS[tabKey] ?? 'custom';
  if (candidate === 'custom') return 'custom';
  const lens = lenses.find((l) => l.key === candidate);
  if (!lens || !isLensCalibrated(lens, userAnswers)) return 'custom';
  return candidate;
}
```

### Effect-dependency discipline (avoid the cycle in Pitfall #4)
**Source:** RESEARCH.md Common Pitfalls #4, grounded in the existing separation already visible
between `switchView` (event handler, `Results.jsx:944-955`) and the lens-pending auto-select effect
(`CompassContext.jsx:447-456`, a precedent for "effect fires on a data condition, calls `setActiveLens`
once, and stops via a guard — never listens to its own output").
**Apply to:** the new tab-entry effect — dependency array must be `[effectiveActiveView, tabLensMemory, lenses]`,
never `activeLensKey`. Mirror the existing guard style from `CompassContext.jsx:447-456`:
```javascript
useEffect(() => {
  if (!compassDataLoaded) return;
  const pendingKey = loadLensPending();
  if (!pendingKey) return;
  const pendingLens = lenses.find((l) => l.key === pendingKey);
  if (pendingLens && isLensCalibrated(pendingLens, userAnswers)) {
    setActiveLens(pendingKey);
    clearLensPending();
  }
}, [compassDataLoaded, userAnswers, lenses, setActiveLens]);
```
This is the file's own established idiom for "effect that conditionally calls `setActiveLens` once and
does not re-trigger itself" — the new tab-entry effect should follow the same shape (condition check,
single `setActiveLens` call, no writes to its own dependencies).

### Honest-blanks / chip-highlight integrity (D-05)
**Source:** `src/components/LensChipRow.jsx:109` (`const isActive = activeLensKey === lens.key;`) —
read-only, confirms Pitfall #3: a key absent from `lenses`/`augmentedLenses` never lights any chip.
**Apply to:** `resolveTabLens` must NEVER return a raw `'education'` (or any key absent from `lenses`)
to `setActiveLens` — always resolve to `'custom'` first, so `augmentedLenses`'s synthesized entry
(`key: 'custom'`, `Results.jsx:569-575`) is guaranteed to match and light the Best Match chip.

## No Analog Found

None. Every piece of new logic in this phase (`tabLensMemory` state, tab-entry effect,
`handleSelectLens` interception, `resolveTabLens`) is a direct extension of an existing mechanism
in the same two files (`Results.jsx`, `compass.js`) — there is no new architectural role being
introduced that lacks a same-file precedent.

## Dead-Code Traps (confirmed via grep, do NOT map new work onto these)

Verified directly in this session (not just cited from RESEARCH.md):
- `computeVariant` — imported at `Results.jsx:5`; grep for `computeVariant(` in `Results.jsx` finds
  **zero call sites** (only the import). It IS called in `Profile.jsx` (out of scope, different page).
- `CompassCardVertical` — imported at `Results.jsx:4`; grep finds only a **comment reference**
  (`// Enrich answers with topic objects (CompassCardVertical needs topic.short_title)` at line 696,
  and another comment at line 1028) — never actually rendered in `Results.jsx`. The real per-card
  overlay is `MiniCompass` (imported line 22, called lines 1701 & elsewhere).
- `deriveScopedTopics` — defined at `Results.jsx:42-53`; grep for `deriveScopedTopics(` finds **zero
  call sites** anywhere else in the file. The live scoping logic is the inline `scopedTopicsForPol`
  ternary at line 1600-1602.
- `classifyBucket` — BY CONTRAST, this one IS live: called once at `Results.jsx:1370`
  (`buckets[classifyBucket(pol)].push(pol)`), confirming it (not `computeVariant`) is the real
  tab-routing mechanism `effectiveActiveView`/`hasEducators`/`hasJudges` ultimately depend on.

Do not propose modifying `computeVariant`, `CompassCardVertical`, or `deriveScopedTopics` inside
`Results.jsx` as part of this phase's plan — any such task is almost certainly scope creep or a
misread of an unused import.

## Metadata

**Analog search scope:** `src/pages/Results.jsx`, `src/contexts/CompassContext.jsx`, `src/lib/compass.js`,
`src/lib/compass.test.js`, `src/components/LensChipRow.jsx`, `src/components/CompassControlsBar.jsx`,
`src/components/MiniCompass.jsx`, `src/lib/classify.js` (all targeted, non-overlapping reads this session).
**Files scanned:** 8 (grep-first on 3 of them to locate exact line ranges before reading)
**Pattern extraction date:** 2026-07-19

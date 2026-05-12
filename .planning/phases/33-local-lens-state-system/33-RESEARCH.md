# Phase 33: Local Lens State System - Research

**Researched:** 2026-05-12
**Domain:** React Context state management, localStorage persistence, snapshot/restore pattern
**Confidence:** HIGH — all findings from direct codebase inspection

## Summary

Phase 33 adds a Local Lens toggle to CompassContext. When active, it replaces `selectedTopics` with 8 fixed local-scope topic UUIDs. When deactivated, it restores the prior `selectedTopics` and `invertedSpokes`. Both the active flag and the pre-lens snapshot persist to localStorage.

The codebase uses a single source of truth pattern: `selectedTopics` and `invertedSpokes` live exclusively in `CompassContext`. All consumers (`CompassCard`, `CompassCardVertical` via Results.jsx, `CompassCardVertical` via ElectionsView.jsx) read only from context. There is no duplication of this state. The implementation is entirely additive — new state fields and a new toggle function inside `CompassContext.jsx`, plus two new localStorage helper functions in `lib/compass.js`.

The 8 LOCAL_LENS_TOPICS UUIDs: Housing and Homelessness are verified full UUIDs (from memory). Items 3–8 are partial UUIDs from memory — they must be verified against the live DB (`inform.compass_topics`) before writing the constant.

**Primary recommendation:** Add `localLensActive`, `preLensSnapshot`, and `toggleLocalLens()` to CompassContext. Persist with two new localStorage keys (`ev:localLensActive` and `ev:localLensSnapshot`). Initialize from localStorage on mount, before any API calls resolve.

## Standard Stack

No new dependencies required. Implementation uses only what is already installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.1.1 | `useState`, `useCallback`, `useMemo` | Already used throughout CompassContext |
| localStorage | browser native | Persistence layer | Already used for `guestCompass`, `ev:compassMode`, `ev:color-scheme` |

No npm installs needed.

## Architecture Patterns

### Existing State Architecture in CompassContext

`CompassContext.jsx` manages all compass state as React `useState` hooks at the top of `CompassProvider`. State is exposed via `useMemo` value object.

Current state managed:
- `selectedTopics` — `string[]` of topic UUIDs (the user's selected spokes)
- `invertedSpokes` — `{ [short_title]: boolean }` map
- `allTopics`, `userAnswers`, `verdicts`, etc.

**Key insight:** `selectedTopics` is set in exactly two places:
1. `loadCompassData()` — sets from API (`fetchSelectedTopics()`) or guest cache (`loadGuestCompass()`)
2. Cross-subdomain live-sync `useEffect` — `setSelectedTopics(c.s)` when evContext fires

### How Consumers Use selectedTopics

**CompassCard.jsx** (profile page): Reads `selectedTopics` directly from `useCompass()`. Uses it as the "preferred spokes" list in the spoke-selection algorithm. Does NOT need any changes — it already reads the context value.

**Results.jsx** (representatives grid): Reads `selectedTopics` from `useCompass()`. Uses it to `filter` `userAnswers` down to `filteredAnswers`. Passes `filteredAnswers` (not `selectedTopics`) to `CompassCardVertical`. No changes needed.

**ElectionsView.jsx** (elections grid): Does NOT read `selectedTopics` at all. Passes unfiltered `userAnswers` to `CompassCardVertical`. No changes needed.

**Conclusion:** When `toggleLocalLens()` sets `selectedTopics` to `LOCAL_LENS_TOPICS`, all consumers automatically see the new value via context reactivity. Zero consumer changes required.

### Existing localStorage Keys

| Key | Format | Where written |
|-----|--------|---------------|
| `guestCompass` | `{ a: {short_title: value}, s: [uuid...], i: {short_title: bool} }` | `lib/compass.js` `saveGuestCompass()` |
| `guestVerdicts` | `{ [quote_id]: 'agreed' | 'disagreed' }` | `lib/compass.js` `saveGuestVerdicts()` |
| `ev:compassMode` | `'true'` or `'false'` | `Results.jsx` handleCompassModeChange |
| `ev:color-scheme` | `'dark'` or `'light'` | `hooks/useTheme.js` |

**New keys to add for Phase 33:**
- `ev:localLensActive` — `'true'` or `'false'`
- `ev:localLensSnapshot` — `JSON.stringify({ selectedTopics: [...], invertedSpokes: {...} })`

### Recommended Implementation Pattern

**In `lib/compass.js`** — add two helpers following existing patterns:

```javascript
export const LOCAL_LENS_ACTIVE_KEY = 'ev:localLensActive';
export const LOCAL_LENS_SNAPSHOT_KEY = 'ev:localLensSnapshot';

export const LOCAL_LENS_TOPICS = [
  '669cac97-66a6-4087-b036-936fbe62efb3', // Housing
  '4938766b-b45a-46e3-93bd-b8b30651271a', // Homelessness
  // items 3-8: VERIFY full UUIDs in DB before writing (see Open Questions)
];

export function saveLocalLensState(isActive, snapshot) {
  try {
    localStorage.setItem(LOCAL_LENS_ACTIVE_KEY, isActive ? 'true' : 'false');
    if (snapshot) {
      localStorage.setItem(LOCAL_LENS_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } else {
      localStorage.removeItem(LOCAL_LENS_SNAPSHOT_KEY);
    }
  } catch {}
}

export function loadLocalLensState() {
  try {
    const active = localStorage.getItem(LOCAL_LENS_ACTIVE_KEY) === 'true';
    const raw = localStorage.getItem(LOCAL_LENS_SNAPSHOT_KEY);
    const snapshot = raw ? JSON.parse(raw) : null;
    return { active, snapshot };
  } catch {
    return { active: false, snapshot: null };
  }
}
```

**In `CompassContext.jsx`** — add new state and toggle:

```javascript
// New state
const [localLensActive, setLocalLensActive] = useState(() => {
  try { return localStorage.getItem('ev:localLensActive') === 'true'; } catch { return false; }
});
const [preLensSnapshot, setPreLensSnapshot] = useState(() => {
  try {
    const raw = localStorage.getItem('ev:localLensSnapshot');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
});

// New function
const toggleLocalLens = useCallback(() => {
  setLocalLensActive((prev) => {
    if (!prev) {
      // Activating: snapshot current state, apply lens topics
      const snapshot = { selectedTopics, invertedSpokes };
      setPreLensSnapshot(snapshot);
      setSelectedTopics(LOCAL_LENS_TOPICS);
      saveLocalLensState(true, snapshot);
      return true;
    } else {
      // Deactivating: restore snapshot
      if (preLensSnapshot) {
        setSelectedTopics(preLensSnapshot.selectedTopics);
        setInvertedSpokes(preLensSnapshot.invertedSpokes);
      }
      setPreLensSnapshot(null);
      saveLocalLensState(false, null);
      return false;
    }
  });
}, [selectedTopics, invertedSpokes, preLensSnapshot]);
```

**Expose in context value:**
```javascript
localLensActive,
toggleLocalLens,
```

### Page Refresh Persistence (LENS-05)

The `useState` initializers for `localLensActive` and `preLensSnapshot` read from localStorage synchronously. This happens before `loadCompassData()` runs.

**Critical ordering problem:** On page refresh with lens active, `loadCompassData()` will overwrite `selectedTopics` with the API's stored selection (not the lens topics). This must be handled.

**Solution:** After `loadCompassData()` resolves (after `setSelectedTopics(selected)` is called), check if `localLensActive` is true and re-apply the lens. The best place is inside `loadCompassData`, at the point where `setSelectedTopics` would be called.

```javascript
// At the end of loadCompassData, after all setters are called:
setCompassDataLoaded(true);
// If lens was active before load, re-apply it now that data is loaded
// (Use a ref to read localLensActive without stale closure)
if (localLensActiveRef.current) {
  setSelectedTopics(LOCAL_LENS_TOPICS);
}
```

Use a ref (`localLensActiveRef`) to avoid stale closure issues — same pattern as `authedUserRef` already in use.

### Anti-Patterns to Avoid

- **Don't save the snapshot into `guestCompass`**: The lens snapshot is separate from the user's compass cache. Mixing them would corrupt the compass state on deactivation.
- **Don't apply lens topics in `loadCompassData` before API completes**: API/cache resolution must run first, then lens overrides. Otherwise deactivation has nothing to restore.
- **Don't include `localLensActive` in the `useMemo` deps without also adding `toggleLocalLens`**: Both must be in the value and deps array together.
- **Don't trigger cross-subdomain ev-context sync when lens is active**: The live-sync `useEffect` calls `setSelectedTopics(c.s)` — if it fires while lens is active, it will overwrite the lens topics. Guard with `if (localLensActiveRef.current) return;` inside the subscriber.

## Don't Hand-Roll

No problems here that need external libraries. The existing `useState`/`useCallback`/`useRef` + `localStorage` pattern already used in this codebase is the correct approach.

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State persistence | Custom serialization | Plain `JSON.stringify` + `localStorage.setItem` | Already used for `guestCompass` |
| Snapshot/restore | External state library | useState + useRef pattern | Already established in CompassContext |

## Common Pitfalls

### Pitfall 1: Stale Closure in toggleLocalLens

**What goes wrong:** `toggleLocalLens` captures `selectedTopics` and `invertedSpokes` at the time it's created. If the user's topics change after the function is memoized but before they activate the lens, the snapshot captures stale values.

**Why it happens:** `useCallback` with `[selectedTopics, invertedSpokes, preLensSnapshot]` deps will re-create the function, but the function body still reads these as closure values.

**How to avoid:** Use the functional form of `setLocalLensActive` (shown above) so state reads happen at call time, not creation time. OR read `selectedTopics` from a ref inside the callback.

**Warning signs:** Toggling lens off restores wrong topics.

### Pitfall 2: loadCompassData Overwrites Lens on Refresh

**What goes wrong:** `loadCompassData()` calls `setSelectedTopics(selected)` at the end with the API/cache topics. If lens is active on refresh, this overwrites `LOCAL_LENS_TOPICS` with the pre-lens topics.

**Why it happens:** `loadCompassData` runs after mount and doesn't know about lens state.

**How to avoid:** After `setSelectedTopics(selected)` inside `loadCompassData`, immediately re-apply lens if active: `if (localLensActiveRef.current) setSelectedTopics(LOCAL_LENS_TOPICS)`. Use a ref to read lens state from inside the callback without stale closure.

**Warning signs:** LENS-05 (refresh with lens active) fails — lens topics disappear after data loads.

### Pitfall 3: Cross-Subdomain Sync Overwrites Lens

**What goes wrong:** The `evContext.subscribe` live-sync useEffect sets `setSelectedTopics(c.s)` whenever another subdomain writes to ev-context. This can fire while lens is active and overwrite the lens topics.

**Why it happens:** The live-sync code at lines 301–317 of `CompassContext.jsx` has no lens guard.

**How to avoid:** Add `if (localLensActiveRef.current) return;` as the first check inside the subscriber callback, before any `setSelectedTopics` calls.

**Warning signs:** Lens topics disappear after switching tabs or navigating.

### Pitfall 4: Partial UUID in LOCAL_LENS_TOPICS

**What goes wrong:** The memory note records 6 of 8 UUIDs as partial (only the first 8 hex chars). Using partial IDs means no topic matches → lens shows no spokes.

**Why it happens:** The original memory note was created when only Housing and Homelessness had been confirmed.

**How to avoid:** Query `inform.compass_topics WHERE id LIKE 'd4f18138%'` etc. for each partial UUID before writing the constant. This MUST be done before coding `LOCAL_LENS_TOPICS`.

**Warning signs:** With lens active, compass shows "Not enough shared topics" instead of local topics.

### Pitfall 5: Snapshot Contains Lens Topics on Double-Activate

**What goes wrong:** If `toggleLocalLens` activates the lens, and somehow activates again without deactivating first, the snapshot would contain `LOCAL_LENS_TOPICS` instead of the true pre-lens state.

**Why it happens:** Edge case if the UI allows re-activating without a deactivate step.

**How to avoid:** Guard activation with `if (localLensActive) return;` — don't snapshot if already active. The functional updater pattern `setLocalLensActive((prev) => { if (prev) { ... restore } else { ... snapshot + activate } })` handles this naturally.

## Code Examples

### Pattern: Existing Snapshot-Like Pattern in CompassContext

There is no existing snapshot/restore in the codebase. The closest analogue is the `compassLoadStartedRef` guard pattern used to prevent double-loading. The ref-based technique used there is directly applicable to the lens activation guard.

```javascript
// Source: CompassContext.jsx line 49-53 — ref pattern for guards
const authedUserRef = useRef(null);
const compassLoadStartedRef = useRef(false);
// Pattern: use refs inside callbacks to read state without stale closure
```

### Pattern: Functional useState Updater (prevents stale closure)

```javascript
// Source: CompassContext.jsx lines 319-325 — toggleInversion uses functional update
const toggleInversion = useCallback((shortTitle) => {
  setInvertedSpokes((prev) => ({ ...prev, [shortTitle]: !prev[shortTitle] }));
}, []);
// Note: no deps on invertedSpokes — reads prev directly
```

### Pattern: localStorage Init from useState Initializer

```javascript
// Source: Results.jsx line 436-438 — compassMode reads localStorage at init
const [compassMode, setCompassMode] = useState(() => {
  try { return localStorage.getItem('ev:compassMode') === 'true'; } catch { return false; }
});
```

### Pattern: Existing context value exposure

```javascript
// Source: CompassContext.jsx lines 345-390 — useMemo value + deps array
const value = useMemo(
  () => ({
    // ... existing fields
    toggleInversion,
    batchInvertSpokes,
    logout,
  }),
  [
    // ... existing deps
    toggleInversion,
    batchInvertSpokes,
  ]
);
// Add localLensActive, toggleLocalLens to both the value object and deps array
```

## Open Questions

1. **Full UUIDs for LOCAL_LENS_TOPICS items 3–8**
   - What we know: Partial UUIDs (first 8 chars): `d4f18138`, `0bc588c6`, `e9ebefcd`, `b9ccee94`, `eb3d1247`, `ba59337e`
   - What's unclear: Full 36-char UUIDs
   - Recommendation: First task in Phase 33 plan must query `SELECT id, short_title FROM inform.compass_topics WHERE id::text LIKE 'd4f18138%' OR id::text LIKE '0bc588c6%' OR ...` against live DB. The memory note `project_local_lens_topics.md` explicitly flags this as required before coding.

2. **Snapshot behavior when user has no selectedTopics**
   - What we know: `selectedTopics` can be `[]` (empty array) for users who haven't calibrated
   - What's unclear: Should activating lens when `selectedTopics = []` store an empty snapshot?
   - Recommendation: Yes — store `{ selectedTopics: [], invertedSpokes: {} }`. On deactivate, restore to `[]`. This is safe and consistent.

3. **Interaction with evContext live-sync for authed users**
   - What we know: Authed users get `selectedTopics` from API, and the live-sync is disabled for them (`if (!compassDataLoaded || isLoggedIn) return;`)
   - What's unclear: If an authed user activates the lens, can ev-context sync overwrite it?
   - Recommendation: No risk for authed users — the live-sync subscriber is guarded by `if (!compassDataLoaded || isLoggedIn) return;`. Only guest users need the lens guard in the subscriber.

## Sources

### Primary (HIGH confidence)
- Direct read of `src/contexts/CompassContext.jsx` — full state inventory, all useState hooks, loadCompassData logic, live-sync effect
- Direct read of `src/lib/compass.js` — all localStorage keys, serialization format, helper function signatures
- Direct read of `src/components/CompassCard.jsx` — how selectedTopics is consumed
- Direct read of `src/pages/Results.jsx` — how selectedTopics filters answers before CompassCardVertical
- Direct read of `src/components/ElectionsView.jsx` — confirms it does NOT use selectedTopics
- Direct read of `src/App.jsx` — confirms `ev:compassMode` key pattern for localStorage
- Direct read of `src/hooks/useTheme.js` — confirms `ev:` prefix convention for localStorage keys
- Direct read of `package.json` — React 19.1.1, no new dependencies needed

### Secondary (MEDIUM confidence)
- Memory note `project_local_lens_topics.md` — 8 topic UUIDs with explicit flag that items 3-8 are partial and need DB verification

### Tertiary (LOW confidence — requires DB verification)
- Partial UUIDs for topics 3-8: `d4f18138`, `0bc588c6`, `e9ebefcd`, `b9ccee94`, `eb3d1247`, `ba59337e` — from memory note, not yet verified against live DB

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package.json confirms React 19, no new deps needed
- Architecture (context changes): HIGH — direct code inspection of all relevant files
- localStorage patterns: HIGH — direct inspection of existing keys and format
- Consumer impact: HIGH — confirmed zero consumer changes needed via code inspection
- Topic UUIDs (partial): LOW — must verify items 3-8 against live DB before coding

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (stable internal codebase; only risk is CompassContext changes in parallel work)

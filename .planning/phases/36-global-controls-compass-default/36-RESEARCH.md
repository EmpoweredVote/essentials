# Phase 36: Global Controls Bar + Compass-Default Mode - Research

**Researched:** 2026-05-14
**Domain:** React state management, UI controls layout, cross-page feature parity
**Confidence:** HIGH

## Summary

Phase 36 has two distinct goals: (1) consolidate compass controls (Min/Max + Local Lens + Judicial Lens) into a proper "global controls bar" above the elections/reps list, and (2) make calibrated users default to compass mode without requiring a checkbox interaction.

The code for both goals is largely already in place. The primary work is (a) changing when `compassMode` becomes true on the Elections page — currently it derives from `userAnswers.length >= 3` with no localStorage check — and (b) bringing the Results page Elections tab and Representatives tab into full feature parity with the Elections page for compass controls.

The sticky `CompassKey + stance buttons` block already exists in both Elections.jsx and Results.jsx with nearly identical markup. Phase 36 is primarily a refactoring + parity + default-behavior task, not a net-new feature.

**Primary recommendation:** Extract the sticky controls bar into a shared `CompassControlsBar` component, unify the `compassMode` derivation logic across both pages using the same localStorage pattern Results.jsx already has, and ensure ElectionsView receives a `compassMode` prop on the Results page Elections tab (it already does).

## Standard Stack

No new libraries needed. Everything required already exists in the project.

### Core (already in use)
| Component/API | Location | Purpose |
|---|---|---|
| `useCompass()` | `src/contexts/CompassContext.jsx` | Provides `localLensActive`, `toggleLocalLens`, `judicialLensActive`, `toggleJudicialLens`, `userAnswers`, `invertedSpokes`, `batchInvertSpokes`, `allTopics` |
| `CompassKey` | `@empoweredvote/ev-ui` | Legend pill — already imported in both pages |
| `computeStanceSpokes` | `src/lib/compass.js` | Used by Stance Min/Max buttons |
| `localStorage 'ev:compassMode'` | Results.jsx pattern | The already-established key for compassMode persistence |
| `useMediaQuery` | `@empoweredvote/ev-ui` | Desktop breakpoint detection for compact CompassKey |

### Proposed new component
| Component | Location | Purpose |
|---|---|---|
| `CompassControlsBar` | `src/components/CompassControlsBar.jsx` | Shared controls bar: Local Lens, Judicial Lens, Stance Min, Stance Max, CompassKey |

## Architecture Patterns

### Current compassMode behavior — two different patterns

**Elections.jsx (line 21):**
```javascript
const compassMode = (userAnswers?.length ?? 0) >= 3;
```
This is a pure derivation — no localStorage, no checkbox. Any user with ≥1 answer... wait, the threshold is 3. So calibrated users (≥3 answers) always see compass mode on Elections. There is no way to turn it off. This means Elections already auto-enables compass for calibrated users.

**BUT the phase description says "≥1 answer" as the calibration threshold.** The current code uses `>= 3`. The requirements say "calibrated users (≥1 answer)". This is a scope question for the planner: the threshold may need to change from 3 to 1.

**Results.jsx (lines 450-481):**
```javascript
const [compassMode, setCompassMode] = useState(() => {
  try { return localStorage.getItem('ev:compassMode') === 'true'; } catch { return false; }
});
// Auto-enable for calibrated users who haven't set explicit preference:
useEffect(() => {
  if (!rawUserAnswers || rawUserAnswers.length < 3) return;
  try {
    if (localStorage.getItem('ev:compassMode') === null) {
      setCompassMode(true);
      localStorage.setItem('ev:compassMode', 'true');
    }
  } catch {}
}, [rawUserAnswers]);
```
Results.jsx has the `localStorage` null-check pattern for auto-enable (first visit → true, explicit user choice → respected). It also has a Compass checkbox in FilterBar that lets users toggle it off.

### What Phase 36 requires

**Elections.jsx needs:**
- Switch from `const compassMode = (userAnswers?.length ?? 0) >= 3` (always-on for calibrated)
- To the localStorage null-check pattern: auto-enable on first visit, respect explicit off preference
- This means Elections.jsx needs local state + a null-check useEffect, same as Results.jsx

**Results.jsx Elections tab:**
- Already passes `compassMode` to `<ElectionsView>` (line 1722-1723) — parity exists for rendering
- Does NOT have compass controls (Local Lens, Judicial Lens, Min/Max buttons) appearing when Elections tab is active
- The sticky CompassKey block in Results.jsx (line 1526-1575) renders when `compassMode && (activeQuery || browseResults)` — it currently shows for BOTH tabs since it's outside the tab content. So controls actually DO appear for Elections tab already. This needs verification during implementation.

**Results.jsx Representatives tab:**
- Has the sticky CompassKey + controls already (same block)
- Has compass overlays on politician cards (MiniCompass rendered via `renderPoliticianCard`)
- Appears to already be in compass mode parity with Elections page

### Recommended Project Structure

No structural changes to files/folders needed. The only new file is a shared component:

```
src/
├── components/
│   ├── CompassControlsBar.jsx   ← NEW: extracted shared controls bar
│   ├── ElectionsView.jsx        ← unchanged
│   ├── FilterBar.jsx            ← may need minor addition (checkbox for Elections page)
│   └── MiniCompass.jsx          ← unchanged
├── pages/
│   ├── Elections.jsx            ← compassMode logic change + use CompassControlsBar
│   └── Results.jsx              ← use CompassControlsBar (replace duplicated inline block)
```

### Pattern: CompassControlsBar Component

The sticky `pointerEvents: none` wrapper + buttons + CompassKey block is duplicated verbatim in Elections.jsx (lines 226-271) and Results.jsx (lines 1526-1575). They are nearly identical. Extract to:

```jsx
// src/components/CompassControlsBar.jsx
export default function CompassControlsBar({
  userAnswers,       // to gate the buttons on answer count
  localLensActive,
  toggleLocalLens,
  judicialLensActive,
  toggleJudicialLens,
  onStanceMin,
  onStanceMax,
  isDesktop,
  isDark,
}) {
  const showButtons = (userAnswers?.length ?? 0) >= 3;
  return (
    <div style={{
      position: 'sticky', top: 8, zIndex: 30,
      display: 'flex', justifyContent: 'flex-end',
      paddingRight: isDesktop ? 48 : 12,
      paddingTop: 8,
      marginBottom: -70,
      pointerEvents: 'none',
    }}>
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {showButtons && (
          <div style={{ display: 'flex', gap: 4 }}>
            {/* Local Lens button */}
            {/* Judicial Lens button */}
            {/* Stance Min button */}
            {/* Stance Max button */}
          </div>
        )}
        <CompassKey compact={!isDesktop} />
      </div>
    </div>
  );
}
```

### Pattern: Auto-enable compassMode (localStorage null-check)

This is the correct pattern — already proven in Results.jsx — to use in Elections.jsx:

```javascript
// In Elections.jsx, replace the pure derivation with state + effect:
const [compassMode, setCompassMode] = useState(() => {
  try { return localStorage.getItem('ev:compassMode') === 'true'; } catch { return false; }
});

useEffect(() => {
  const count = userAnswers?.length ?? 0;
  if (count < 1) return; // threshold: ≥1 answer (per requirements, or keep 3 — planner to decide)
  try {
    if (localStorage.getItem('ev:compassMode') === null) {
      setCompassMode(true);
      localStorage.setItem('ev:compassMode', 'true');
    }
  } catch {}
}, [userAnswers]);
```

### Anti-Patterns to Avoid

- **Duplicating the controls bar a third time**: Extract the shared component. Two identical blocks already exist — don't create a third.
- **Changing the threshold inconsistently**: If the threshold changes from 3 to 1, change it consistently in all places: Elections.jsx auto-enable, Results.jsx auto-enable, and any place that gates the stance buttons.
- **Forgetting to pass `onCompassModeChange` to FilterBar in Elections.jsx**: Currently Elections.jsx does NOT have a compass checkbox because `compassMode` is always derived. Once it becomes stateful, the user needs a way to toggle it off. The FilterBar already has this capability via the `onCompassModeChange` prop — Elections.jsx just needs to use it.
- **Breaking the Elections.jsx "no FilterBar" layout**: Elections.jsx has a simpler layout than Results.jsx (no tab bar, no FilterBar row). Adding a compass toggle needs to fit the existing layout. Consider putting it in the filter controls div (line 211-223) alongside "Hide withdrawn candidates."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Sticky positioned controls | Custom position tracking | CSS `position: sticky` (already used) | Already works in both pages |
| Compass legend | Custom legend | `CompassKey` from ev-ui | Already imported and working |
| Answer count check | Custom calibration check | `(userAnswers?.length ?? 0) >= N` | Established pattern throughout |
| Local/Judicial Lens toggle | New toggle mechanism | `toggleLocalLens`, `toggleJudicialLens` from CompassContext | Phase 33 already built this |

## Common Pitfalls

### Pitfall 1: Elections.jsx compassMode always-on vs Results.jsx toggle

**What goes wrong:** Elections.jsx currently treats `compassMode` as a derived value (always true if ≥3 answers). Results.jsx treats it as user-controlled state with auto-enable. If Phase 36 only adds the controls bar without changing Elections.jsx's derivation, there's no way for a calibrated user to turn compass mode off on /elections.

**How to avoid:** Change Elections.jsx to use state + localStorage pattern, and add a compass toggle (checkbox in the filter row, or button in the controls bar).

**Warning signs:** If Elections.jsx still has `const compassMode = (userAnswers?.length ?? 0) >= 3` after the phase, it's incomplete.

### Pitfall 2: The answer count threshold

**What goes wrong:** Requirements say "calibrated users (≥1 answer)" but current code uses `>= 3` everywhere. If Phase 36 changes the threshold to 1 in one place but not others, behavior becomes inconsistent.

**How to avoid:** Define the threshold as a named constant. Example: `const CALIBRATION_THRESHOLD = 1;` or keep it at 3 if that's the product decision.

**Warning signs:** `>= 3` appears in Elections.jsx auto-enable, `>= 1` appears in Results.jsx auto-enable, or vice versa.

### Pitfall 3: marginBottom: -70 is load-bearing

**What goes wrong:** The sticky controls bar uses `marginBottom: -70` to pull the content up so the controls visually overlap the first card. If this value changes or is dropped, a large gap appears between the controls and the cards.

**How to avoid:** Keep the existing `marginBottom: -70, pointerEvents: 'none'` pattern exactly as-is in the extracted component.

### Pitfall 4: Results.jsx sticky controls already show for Elections tab

**What goes wrong:** The sticky CompassKey block in Results.jsx is outside the tab content `activeView === 'representatives'` check, so it currently renders for BOTH tabs when `compassMode` is true. This means the controls bar might already appear on the Elections tab — making the "add controls to Elections tab" part of the phase potentially already done.

**How to avoid:** Verify by testing Results.jsx with Elections tab active + compassMode true. If controls already show, that part of the phase is done. Only the Elections.jsx auto-enable behavior change is needed.

### Pitfall 5: `enableCompass()` call on checkbox toggle

**What goes wrong:** In Results.jsx, `handleCompassModeChange` calls `enableCompass()` when turning compass on. This triggers `loadCompassData()` if not already loaded. Elections.jsx must do the same if it gains a toggle.

**How to avoid:** Copy the pattern from Results.jsx:
```javascript
const handleCompassModeChange = (val) => {
  setCompassMode(val);
  try { localStorage.setItem('ev:compassMode', val ? 'true' : 'false'); } catch {}
  if (val) enableCompass();
};
```

### Pitfall 6: Stance buttons gated on answer count

**What goes wrong:** In Results.jsx (line 1541), the stance buttons (Local/Judicial Lens, Min/Max) are wrapped with `{(rawUserAnswers?.length ?? 0) >= 3 && ...}`. In Elections.jsx, they have no such guard (because `compassMode` itself is already gated). If the extracted component puts these at the same level, it needs to replicate the guard for Results.jsx's case where `compassMode` could be true but user might have <3 answers (unlikely but theoretically possible).

**How to avoid:** Always wrap stance buttons in the count check inside `CompassControlsBar`.

## Code Examples

### Current Elections.jsx compassMode derivation (to be changed)
```javascript
// src/pages/Elections.jsx line 21 — current
const compassMode = (userAnswers?.length ?? 0) >= 3;
```

### Results.jsx auto-enable pattern (to copy to Elections.jsx)
```javascript
// src/pages/Results.jsx lines 450-481 — proven pattern
const [compassMode, setCompassMode] = useState(() => {
  try { return localStorage.getItem('ev:compassMode') === 'true'; } catch { return false; }
});
useEffect(() => {
  if (!rawUserAnswers || rawUserAnswers.length < 3) return;
  try {
    if (localStorage.getItem('ev:compassMode') === null) {
      setCompassMode(true);
      localStorage.setItem('ev:compassMode', 'true');
    }
  } catch {}
}, [rawUserAnswers]);
```

### Current sticky controls bar (duplicated in both pages — to extract)
```javascript
// Elections.jsx lines 226-271 / Results.jsx lines 1526-1575
{compassMode && (
  <div style={{
    position: 'sticky', top: 8, zIndex: 30,
    display: 'flex', justifyContent: 'flex-end',
    paddingRight: isDesktop ? 48 : 12,
    paddingTop: 8, marginBottom: -70,
    pointerEvents: 'none',
  }}>
    <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {/* Local Lens button — green magnifier */}
        {/* Judicial Lens button — burnt orange gavel */}
        {/* Stance Min ⊟ */}
        {/* Stance Max ⊞ */}
      </div>
      <CompassKey compact={!isDesktop} />
    </div>
  </div>
)}
```

### FilterBar compass checkbox (already exists in Results.jsx, not in Elections.jsx)
```javascript
// FilterBar.jsx lines 142-162 — only rendered when onCompassModeChange is provided
{onCompassModeChange !== undefined && (
  <label style={{ ... }}>
    <input type="checkbox" checked={!!compassMode}
      onChange={(e) => onCompassModeChange(e.target.checked)} />
    Compass
  </label>
)}
```

## State of the Art

| Old Pattern | Current Pattern | Notes |
|---|---|---|
| compassMode as checkbox only | compassMode auto-enabled via localStorage null-check | Phase 34 established this for Results.jsx |
| Controls bar inline duplicated | Controls bar inline duplicated (both pages) | Phase 36 should extract to shared component |
| Elections.jsx always-on compassMode | Elections.jsx stateful compassMode | Phase 36 change |

## Open Questions

1. **Calibration threshold: 1 or 3?**
   - What we know: Requirements say "≥1 answer" but current code says `>= 3` everywhere
   - What's unclear: Is this a requirements doc shorthand ("calibrated" = any answer) or a real product decision to lower the bar?
   - Recommendation: Keep `>= 3` unless explicitly confirmed to change. The existing Results.jsx pattern uses 3. Changing to 1 is a product decision, not a technical one.

2. **Does Elections.jsx need a compass toggle UI?**
   - What we know: Currently compassMode on Elections is always-on for calibrated users — no way to turn off
   - What's unclear: Requirements say "no checkbox interaction" for the default. But once it's stateful, users need a way to turn it off.
   - Recommendation: Add a toggle. Smallest option: add compass checkbox to the existing filter controls row (line 211 in Elections.jsx). Larger option: add it to the controls bar itself.

3. **Are Results.jsx controls already showing on Elections tab?**
   - What we know: The sticky controls block in Results.jsx is outside the `activeView === 'representatives'` conditional (line 1577). It renders whenever `compassMode && (activeQuery || browseResults)`.
   - What's unclear: Whether this satisfies CTRL-01 requirement ("renders above elections/reps list when compass mode is active") for the Elections tab.
   - Recommendation: Verify during implementation. If controls show, Elections tab parity may already be met and only Elections.jsx page changes remain.

## Sources

### Primary (HIGH confidence)
- Direct codebase reading: `src/pages/Elections.jsx` — compassMode derivation and controls layout
- Direct codebase reading: `src/pages/Results.jsx` — localStorage auto-enable pattern, controls layout, Elections tab
- Direct codebase reading: `src/components/ElectionsView.jsx` — compassMode prop consumption
- Direct codebase reading: `src/contexts/CompassContext.jsx` — available state/actions
- Direct codebase reading: `src/components/FilterBar.jsx` — existing compass checkbox pattern
- Direct codebase reading: `src/components/MiniCompass.jsx` — prop contract
- Direct codebase reading: `src/lib/compass.js` — LOCAL_LENS_TOPICS, computeDisplaySpokes, computeStanceSpokes

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all code is in the repo, reading the actual source
- Architecture: HIGH — patterns are clearly established in existing code
- Pitfalls: HIGH — identified from direct reading of divergences between the two pages

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (stable local codebase, no external dependencies)

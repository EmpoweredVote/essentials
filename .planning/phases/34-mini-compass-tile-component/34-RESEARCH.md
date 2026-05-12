# Phase 34: Mini Compass Tile Component - Research

**Researched:** 2026-05-12
**Domain:** RadarChartCore label suppression, CompassCardVertical layout, bilateral spoke algorithm
**Confidence:** HIGH (all findings from direct codebase inspection)

## Summary

Phase 34 adds a mini radar chart into each CompassCardVertical tile in compass mode on the elections page. The key insight is that `RadarChartCore` renders spoke labels purely because of the `labelFontSize` and `labelOffset` props — there is no dedicated "hide labels" prop. To suppress labels, set `labelFontSize={0}` (or a near-zero value). The component is an SVG and uses `viewBox` with padding calculated from label widths; setting `labelFontSize=0` collapses all label width estimates to zero and the viewBox tightens around the chart polygon.

The tile structure in `CompassCardVertical` is a vertical flex column: a fixed header area (avatar 88×110px + name/title text), then a `flex:1` content slot that holds the full-size radar (RADAR_SIZE=400). Phase 34 needs to modify how ElectionsView passes data to CompassCardVertical OR create a new MiniCompassTile component that renders alongside PoliticianCard in non-compass mode.

The spoke selection algorithm lives entirely in `CompassCard.jsx` (lines 97-173). ElectionsView already fetches politician stances into `stancesByPolId` when `compassMode=true` and passes them as `{ [short_title]: value }` map to `CompassCardVertical`. The elections page (Elections.jsx) currently does NOT pass `compassMode` to ElectionsView at all — it always renders in normal (PoliticianCard) mode. Compass mode on Elections page is not yet wired.

**Primary recommendation:** Create a `MiniCompassTile` component in `src/components/` that wraps PoliticianCard with an appended mini chart zone, or adds the mini radar directly into the right side of the horizontal tile. Extract the spoke algorithm from `CompassCard.jsx` into `src/lib/compass.js` as `computeDisplaySpokes()` so it can be reused by both `CompassCard` and `MiniCompassTile`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@empoweredvote/ev-ui` RadarChartCore | installed | SVG radar chart rendering | All compass charts use this |
| React | 18.x | Component model | Project standard |
| CompassContext | local | userAnswers, selectedTopics, allTopics, localLensActive, invertedSpokes | All compass data flows here |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@empoweredvote/ev-ui` PoliticianCard | installed | Horizontal tile in non-compass mode | Still used when compassMode=false |
| `@empoweredvote/ev-ui` CompassCardVertical | installed | Full tile with compass slot | Currently used in compass mode; may need augmentation |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── MiniCompassTile.jsx      # new — wraps horizontal tile + mini radar slot
├── lib/
│   └── compass.js               # extract computeDisplaySpokes() here
└── components/
    └── ElectionsView.jsx        # add compassMode prop pass-through in Elections.jsx
```

### Pattern 1: Label Suppression via labelFontSize=0
**What:** RadarChartCore does not have a `showLabels` boolean prop. Labels are rendered unconditionally. The only way to suppress them is to pass `labelFontSize={0}`, which causes `wrapLabel()` to produce zero-width estimates, which collapses `sidePadding` to `minPadding=40`, effectively hiding text while keeping the chart geometry intact.
**When to use:** Any mini compass with no labels
**Example:**
```jsx
// Source: node_modules/@empoweredvote/ev-ui/dist/index.js line 193-204
// labelFontSize drives estimated label widths; 0 collapses them
<RadarChartCore
  topics={topicsFiltered}
  data={userData}
  compareData={polData}
  size={120}
  labelFontSize={0}
  padding={10}
  labelOffset={0}
  tightFit={true}
  darkMode={isDark}
  onToggleInversion={() => {}}
  onReplaceTopic={() => {}}
/>
```
**Warning:** At `size=120` the dot/hitbox elements are r=7–14px in a 120px svg — they will be proportionally very large. Consider using `size=200` with CSS scaling via `width:120px; height:120px` on the container so the SVG internal geometry is less cramped.

### Pattern 2: Spoke Selection Algorithm (bilateral fallback)
**What:** Exact algorithm from `CompassCard.jsx` lines 97-173. Must be replicated or extracted.
**Source:** `src/components/CompassCard.jsx`

The algorithm steps:
1. Build `polAnsweredSet` — topic IDs where polAnswers has value > 0
2. Build `userAnsweredSet` — topic IDs from userAnswers
3. Take `preferredIds = selectedTopics.slice(0, MAX_SPOKES=8)`
4. Build `replacementPool` — scopedTopics NOT in preferredSet where BOTH user and pol answered
5. For each preferred ID: if both have answered → include; if either missing → sub from replacementPool
6. `hasEnoughSpokes = displayTopicIds.length >= 3`
7. If `hasEnoughSpokes`, call `buildAnswerMapByShortTitle()` to build `topicsFiltered`, `userData`, `polData`

**Local Lens variant (Lens ON):**
- `preferredIds = LOCAL_LENS_TOPICS` (8 UUIDs from `compass.js` line 375-384)
- Replacement pool = ALL scoped bilateral topics NOT in LOCAL_LENS_TOPICS
- Replacement spokes are "non-local" — must be visually distinct (different color/weight per CONTEXT.md)
- The existing `replacedSpokes` prop on RadarChartCore is meant for this: marks substitute spoke labels differently. Since labels are hidden in mini mode, a different approach is needed — pass a custom `lineColor` or use a custom ring color for non-local spokes. The cleanest approach: pass a different `lineColor` for the mini chart when replacement spokes exist, OR create a custom SVG overlay. The `replacedSpokes` prop only affects label appearance, not spoke line appearance.

**Lens OFF behavior:**
- Use `selectedTopics` from CompassContext (the user's calibrated selection)
- Same algorithm as CompassCard.jsx

### Pattern 3: Stances Data Already Available in ElectionsView
**What:** ElectionsView already fetches and caches politician answers in `stancesByPolId` when `compassMode=true`. Data format: `{ [short_title]: value }` — a flat map of short titles to numeric values (1-5).
**Source:** `src/components/ElectionsView.jsx` lines 255-301

The stances are keyed by `politician_id` (not candidate_id). The relevant candidate property is `candidate.politician_id`. If `politician_id` is null (challengers without a politician record), stances are unavailable and the mini compass is absent.

### Pattern 4: compassMode Activation in Elections Page
**What:** Elections.jsx currently does NOT wire `compassMode` into ElectionsView. The `compassMode` flag is only wired in Results.jsx (stored in localStorage `ev:compassMode`, line 436-443). ElectionsView has the `compassMode` prop defined (default `false`) but Elections.jsx never passes it.
**Impact for Phase 34:** Phase 34 must either:
- Add `compassMode` state to Elections.jsx (mirroring Results.jsx pattern)
- OR render mini compasses unconditionally on all tiles when the user has compass data (simpler approach, no toggle needed per CONTEXT.md decisions)

Per CONTEXT.md: "Candidate tiles in compass mode display a mini RadarChartCore..." — this implies compass mode must be active. The phase decision doesn't address how compassMode is toggled in Elections; that may be Phase 36's concern (global controls bar). For Phase 34, the safest scope: add `compassMode` state to Elections.jsx that activates when the user has `userAnswers.length >= 3`.

### Pattern 5: PoliticianCard Horizontal Layout (non-compass mode)
**What:** The ev-ui `PoliticianCard` with `variant="horizontal"` is a `flexDirection:row` card. Structure:
- Left: imageWrapper `width:90px`, `height:100%`, `maxHeight:200px`
- Middle: content `flex:1`, name + title + subtitle + footer
- Right: optional compassButton (28×28px circle) — only when `onCompassClick` is provided

**For mini compass placement:** The tile needs a right-side zone of ~120×120px. In the horizontal card, the right side currently has no permanent reserved space. The mini compass must be injected as an additional element at the right. The cleanest approach is to render it OUTSIDE the PoliticianCard (as a sibling in a wrapper div), or use a custom replacement tile that has the compass zone built in.

**Recommended approach:** Wrap `PoliticianCard` + mini compass in a flex-row container:
```jsx
<div style={{ display: 'flex', alignItems: 'stretch' }}>
  <div style={{ flex: 1, minWidth: 0 }}>
    <PoliticianCard ... />
  </div>
  {showMiniCompass && (
    <div style={{ width: 120, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <MiniCompassChart ... />
    </div>
  )}
</div>
```
This avoids touching ev-ui PoliticianCard internals.

### Pattern 6: Color Scheme from CompassCard.jsx
**What:** The existing full compass uses these exact colors:
- User polygon: `fill: rgba(124, 107, 158, 0.4)`, `stroke: #7C6B9E` (purple)
- Candidate polygon: `fill: rgba(90, 154, 110, 0.45)`, `stroke: #5A9A6E` (green)
- Dark mode candidate: `fill: rgba(110, 210, 140, 0.55)`, `stroke: #6DD28C`
- User dots: `#7C6B9E` (purple) or `#fed12e` (yellow) when match
- Candidate dots: `#5A9A6E` (green) or `#fed12e` (yellow) when match

These colors are hardcoded in the compiled ev-ui bundle — they cannot be overridden via props. The mini compass will naturally use the same colors as the full compass.

### Pattern 7: scopedTopics for districtScope
**What:** CompassCard.jsx uses `districtScope` to filter `allTopics` to only topics with `applies_local`, `applies_state`, `applies_federal`, or `applies_judicial` !== false. For ElectionsView tiles, the correct scope comes from `race.districtType`.

Mapping from districtType to districtScope key:
- `NATIONAL_*` → `applies_federal`
- `STATE_*` → `applies_state`  
- `LOCAL`, `LOCAL_EXEC`, `COUNTY`, `SCHOOL` → `applies_local`
- `JUDICIAL` → `applies_judicial`

This scoping must be applied in the spoke selection algorithm for mini compass tiles.

### Anti-Patterns to Avoid
- **Don't pass `size=120` to RadarChartCore directly:** The SVG internal coordinate system at size=120 makes circles (r=7–14) take up 12-23% of the chart radius — they dominate. Use `size=200` (or larger) and constrain the container to 120×120px so the SVG scales down via `width/height:100%`.
- **Don't attempt to hide labels by setting `padding=0`:** Padding affects ring radius and vertex positions, not labels. Only `labelFontSize=0` + `labelOffset=0` suppresses label rendering.
- **Don't use `tightFit=false` for mini compass:** Without tightFit, there's significant vertical whitespace above/below the polygon when spokes cluster near horizontal. Always pass `tightFit={true}` for the mini.
- **Don't build a custom SVG radar:** RadarChartCore is the correct component. The mini is "a true miniature of the full compass" per spec.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spoke selection logic | Custom filtering | Extract from CompassCard.jsx into `computeDisplaySpokes()` in compass.js | Logic already battle-tested with MAX_SPOKES cap, replacement pool, hasEnoughSpokes gate |
| Radar chart SVG | Custom SVG | RadarChartCore from ev-ui | Animated springs, guide polygons, correct dot rendering, inversion logic all built in |
| Answer map building | Custom reduce | `buildAnswerMapByShortTitle()` from compass.js | Already exported, handles allowedShorts ordering |

**Key insight:** The hardest part is NOT the rendering — it's extracting and adapting the spoke algorithm cleanly. The algorithm in CompassCard.jsx is 75 lines of mixed state+logic. Extracting it as a pure function `computeDisplaySpokes(selectedTopics, userAnswers, polAnswers, scopedTopics, maxSpokes, localLensActive)` that returns `{ displayTopicIds, replacedSpokes, hasEnoughSpokes }` is the critical architectural move.

## Common Pitfalls

### Pitfall 1: Election Page Has No compassMode State
**What goes wrong:** Developer adds MiniCompassTile logic to ElectionsView but forgets Elections.jsx doesn't pass `compassMode` — all tiles always render in PoliticianCard mode.
**Why it happens:** ElectionsView accepts `compassMode` as a prop (default false), but Elections.jsx never passes it.
**How to avoid:** Phase 34 must add `compassMode` state to Elections.jsx. Simple approach: automatically activate when `userAnswers.length >= 3`. Alternatively, add a toggle — but the global controls bar (Phase 36) may own that.
**Warning signs:** Mini compass never appears in Elections page despite data being available.

### Pitfall 2: Stances Keyed by politician_id, Not candidate_id
**What goes wrong:** Looking up `stancesByPolId[candidate.candidate_id]` returns undefined even when stances exist.
**Why it happens:** ElectionsView fetches stances using `politician_id` (line 261: `c.politician_id`). The stances cache key is politician_id. But the tile is rendered with `candidate.candidate_id` as the key.
**How to avoid:** Always use `candidate.politician_id` to look up stancesByPolId, then gate on `polIdKey !== null`.

### Pitfall 3: RadarChartCore SVG Geometry at Small Sizes
**What goes wrong:** At `size=120`, the tooltip foreignObject (tipW=190) is wider than the entire chart. Hover dots (r=14) are enormous relative to the chart. The overall appearance looks broken.
**Why it happens:** RadarChartCore uses fixed pixel sizes for dots, tooltips, and hitboxes — they don't scale with the `size` prop.
**How to avoid:** Pass `size=240` (or 200+) to RadarChartCore and use CSS to constrain the container to 120×120px. The SVG has `className="w-full h-auto max-h-full"` so it will scale down. Alternatively, disable tooltips on mini mode by not passing onToggleInversion (already disabled when passing `() => {}`).

### Pitfall 4: Local Lens Replacement Spoke Visual Distinction
**What goes wrong:** When Lens is ON and replacement (non-local) spokes fill gaps, there's no visual signal to the user — all spokes look identical.
**Why it happens:** The `replacedSpokes` prop on RadarChartCore only affects label appearance (color/weight), which is moot when labels are suppressed at fontSize=0.
**How to avoid:** The replacement spoke distinction needs a different approach for the mini compass. Options:
1. Render the mini chart at a slightly reduced opacity when replacement spokes are present
2. Use a different border color on the circular container (e.g. dashed border vs solid)
3. Use a lighter stroke color on the full chart overlay (pass a custom `lineColor` to distinguish)
CONTEXT.md says "visual distinction of replacement spokes is the indicator" — since the mini has no labels, a lighter overall ring or container color makes sense.

### Pitfall 5: scopedTopics Must Match the Tile's Office Tier
**What goes wrong:** All mini compasses use the same full `allTopics` list without scoping — topics irrelevant to a Local race appear as spokes.
**Why it happens:** `allTopics` from CompassContext is unfiltered. CompassCard.jsx does scope filtering via `districtScope` prop.
**How to avoid:** In `computeDisplaySpokes()`, pass `districtScope` derived from `race.districtType`. Apply the same filter logic as CompassCard.jsx lines 41-48.

### Pitfall 6: selectedTopics May Have More Than 8 Entries (MAX_SPOKES Guard)
**What goes wrong:** When all quiz topics are selected (post-calibration Compass bug), `selectedTopics` can contain all 36 topics. Using the full array empties the replacement pool and shows a broken chart.
**Why it happens:** CompassV2 has a known bug that sets all topics as selected after calibration.
**How to avoid:** Always cap `preferredIds = selectedTopics.slice(0, MAX_SPOKES)` before building the replacement pool. This guard already exists in CompassCard.jsx line 109.

## Code Examples

### Verified: computeDisplaySpokes pure function signature
```typescript
// Source: CompassCard.jsx lines 97-173 (adapted as extractable pure function)
function computeDisplaySpokes({
  selectedTopics,   // string[] of topic UUIDs from CompassContext
  userAnswers,      // [{ topic_id, value }] from CompassContext
  polAnswers,       // [{ topic_id, value }] fetched for this politician
  scopedTopics,     // allTopics filtered by districtScope
  maxSpokes = 8,
  localLensActive,  // boolean from CompassContext
}) {
  // Returns: { displayTopicIds: string[], replacedSpokes: {[short_title]: true}, hasEnoughSpokes: boolean }
}
```

### Verified: RadarChartCore prop signature (from ev-ui dist/index.js lines 95-119)
```jsx
<RadarChartCore
  topics={topicsFiltered}        // topic objects with short_title, stances
  data={userData}                // { [short_title]: number } — user polygon
  compareData={polData}          // { [short_title]: number } — politician polygon
  invertedSpokes={invertedSpokes}// { [short_title]: bool }
  replacedSpokes={replacedSpokes}// { [short_title]: bool } — affects label style only
  boldOriginalSpokes={false}
  onToggleInversion={() => {}}   // no-op for mini compass (read-only)
  onReplaceTopic={() => {}}
  size={200}                     // use 200+ then scale via CSS
  labelFontSize={0}              // SUPPRESSES LABELS
  padding={10}                   // minimal padding for mini
  labelOffset={0}
  tightFit={true}
  darkMode={isDark}
/>
```

### Verified: stancesByPolId data format in ElectionsView
```javascript
// Source: ElectionsView.jsx lines 283-295
// Format: { [politician_id]: { [short_title]: number } }
// e.g., { "abc-123": { "Housing": 4, "Civil Rights": 2, ... } }
stances: (polIdKey && stancesByPolId[polIdKey]) || {}
```

### Verified: Colors matching full CompassCard
```javascript
// Source: ev-ui/dist/index.js lines 324, 330, 358-365
// User shape: rgba(124, 107, 158, 0.4) fill, #7C6B9E stroke
// Candidate shape: rgba(90, 154, 110, 0.45) fill, #5A9A6E stroke (light)
// Candidate shape dark: rgba(110, 210, 140, 0.55) fill, #6DD28C stroke
```

### Verified: Elections.jsx compassMode pattern (from Results.jsx)
```javascript
// Source: Results.jsx lines 436-443
const [compassMode, setCompassMode] = useState(() => {
  try { return localStorage.getItem('ev:compassMode') === 'true'; } catch { return false; }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Elections had no compass mode | ElectionsView has compassMode prop but Elections.jsx never passes it | Phase 33 wired localLens; compassMode still unwired in Elections | Phase 34 must wire it |
| CompassCard does scope filtering inline | Same pattern needed for mini compass | Always was this way | Must extract or replicate districtScope logic |
| MAX_SPOKES bug guard | `selectedTopics.slice(0, 8)` added in Phase ~32 | Recent | Must keep this guard in any new spoke algorithm |

## Open Questions

1. **Who owns compassMode activation in Elections?**
   - What we know: Elections.jsx currently shows `compassMode=false` to ElectionsView always
   - What's unclear: Phase 36 is the "global controls bar" — does that toggle compassMode? Or should Phase 34 auto-activate compass mode when user has answers >= 3?
   - Recommendation: Phase 34 should add simple auto-activation: `const compassMode = userAnswers.length >= 3` (no toggle, just show mini compass when data is ready). Phase 36 can add the explicit toggle control.

2. **Replacement spoke visual distinction without labels**
   - What we know: `replacedSpokes` prop affects label text style only; labels are suppressed in mini
   - What's unclear: What visual treatment distinguishes "non-local replacement" spokes in a label-free chart?
   - Recommendation: Use a reduced container opacity (0.7) on the mini chart when any replacement spokes exist. Or use a dashed border on the circular container frame. The planner should prescribe one approach.

3. **stancesByPolId fetch timing in Elections**
   - What we know: ElectionsView triggers stance fetches when `compassMode=true` AND `allTopics.length > 0` AND `visibleCandidateIds.size > 0`
   - What's unclear: If compassMode auto-activates on Elections page load (when user already has answers), will the fetch fire correctly?
   - Recommendation: No issue — the useEffect already handles this. The dependency on `compassMode` means it fires as soon as `compassMode` becomes true.

## Sources

### Primary (HIGH confidence)
- `src/components/CompassCard.jsx` — bilateral spoke algorithm (lines 97-173), color definitions, full prop usage of RadarChartCore
- `src/contexts/CompassContext.jsx` — localLensActive state (lines 54-68), selectedTopics, toggleLocalLens implementation (lines 350-373), CompassContext value shape (lines 393-442)
- `src/lib/compass.js` — LOCAL_LENS_TOPICS (lines 375-384), buildAnswerMapByShortTitle (lines 65-98)
- `src/components/ElectionsView.jsx` — stancesByPolId fetch pattern (lines 255-301), compassMode prop default (line 236), CompassCardVertical usage (lines 658-686)
- `node_modules/@empoweredvote/ev-ui/dist/index.js` — RadarChartCore prop signature (lines 95-119), PoliticianCard horizontal layout (lines 1917-2044), CompassCardVertical structure (lines 2760-3107), label rendering code (lines 189-317)
- `src/pages/Elections.jsx` — compassMode NOT currently passed to ElectionsView (line 193-198)
- `src/lib/classify.js` — computeVariant (lines 311-327), districtType values

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — direct code inspection
- Architecture (spoke algorithm): HIGH — read full source
- Architecture (tile layout): HIGH — read ev-ui bundle
- Pitfalls: HIGH — from code analysis; pitfall 3 (SVG scaling) is informed by geometry math from bundle
- Code examples: HIGH — direct from source

**Research date:** 2026-05-12
**Valid until:** 60 days — ev-ui bundle only changes on publish; app code is stable

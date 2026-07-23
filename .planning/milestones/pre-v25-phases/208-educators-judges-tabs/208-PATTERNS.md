# Phase 208: Educators & Judges Tabs - Pattern Map

**Mapped:** 2026-07-18
**Files analyzed:** 1 (single-file change: `src/pages/Results.jsx`)
**Analogs found:** 1 / 1 — all patterns come from the file being modified (Results.jsx already
contains the exact 2-tab mechanism, tab-row JSX, and render pipeline to extend to 4 tabs; there
is no separate "donor" file elsewhere in the codebase).

**Line-number verification:** All anchors cited in `208-CONTEXT.md` were checked against the
current file (2180 lines total) and are accurate as-is — no drift. Exact line map below.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/pages/Results.jsx` (tab-row JSX ~:1931-1982) | component (tab nav) | request-response (client-side view switch) | itself — existing Representatives + Elections `<button>` pair (:1935-1968) | exact (self-analog, extend from 2→4 buttons) |
| `src/pages/Results.jsx` (bucket partition, new `useMemo`s near :1340-1370) | transform (data partition) | CRUD-adjacent / transform | itself — existing `deduped` (:1340) → `hierarchy` (:1350) → `filteredHierarchy` (:1355) chain | exact (insert one more `useMemo` stage in the same chain) |
| `src/pages/Results.jsx` (Educators/Judges render blocks, new) | component (list render) | request-response | itself — existing Representatives render block (:1984-2137) | exact (near-verbatim duplicate/parameterize per D-09) |
| `src/pages/Results.jsx` (relocated election summary, new JSX in header) | component (label/badge) | transform | itself — existing in-tab election label + badge (:1953-1967) | exact (move, don't rewrite) |
| `src/pages/Results.jsx` (`activeView` fallback logic, new) | utility (guard/effect) | event-driven | itself — existing `activeView`/`switchView` derivation (:373, :932-943) | role-match (extend existing param-parsing convention) |

No files outside `Results.jsx` need modification. `src/lib/classify.js` (`classifyBucket`) and
`src/lib/groupHierarchy.js` (`groupIntoHierarchy`) are consumed read-only, unchanged.

---

## Pattern Assignments

### 1. Tab mechanism — `activeView` / `switchView` / `?view=` param

**Analog:** `src/pages/Results.jsx:373` and `:932-943` (current file, verified accurate)

**Current state read** (line 373):
```javascript
const activeView = searchParams.get('view') || 'representatives';
```

**Current switch function** (lines 932-943):
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

**How to extend (D-01, D-08, discretion item on analytics):**
- `switchView` already generalizes to any string value — no signature change needed to add
  `'educators'` / `'judges'`. The `if (view === 'representatives') next.delete('view')` branch
  keeps `representatives` as the paramless default; `educators`/`judges`/`elections` all set
  `?view=`.
- `posthog?.capture('essentials_tab_switched', ...)` already fires generically with whatever
  `view` string is passed — the discretion note ("extend the existing event... trivial") requires
  **no code change**, just calling `switchView('educators')` / `switchView('judges')` from the
  new buttons.
- **D-08 fallback** (active tab empty for location → fall back to Representatives): add a
  derivation/effect near `activeView` that checks bucket population (see partition below) and
  resets `?view=` when `activeView` is `'educators'`/`'judges'` but that bucket is empty for the
  current `deduped` list. Since `deduped`/bucket counts are computed later in the file (after
  data loads), this fallback should be an effect (or a derived `effectiveActiveView` used for
  rendering) placed **after** the bucket-partition `useMemo`s, not colocated with the raw
  `activeView` line 373 read.

---

### 2. Bucket partition — where it slots into the `deduped` → `hierarchy` chain

**Analog:** `src/pages/Results.jsx:1340-1370` (current file, verified accurate)

**Existing chain** (lines 1340-1370):
```javascript
const deduped = useMemo(() => {
  const seen = new Set();
  return federalFiltered.filter((pol) => {
    const key = `${pol.first_name}-${pol.last_name}-${pol.office_title}-${pol.government_body_name || ''}-${pol.is_vacant || false}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}, [federalFiltered]);

const hierarchy = useMemo(
  () => groupIntoHierarchy(deduped),
  [deduped]
);

const filteredHierarchy = useMemo(() => {
  if (appointedFilter === 'All') return hierarchy;

  return hierarchy
    .map(({ tier, bodies }) => ({
      tier,
      bodies: bodies.map((body) => ({
        ...body,
        subgroups: body.subgroups.map((sg) => ({
          ...sg,
          pols: sg.pols.filter((pol) => matchesAppointedFilter(pol, appointedFilter)),
        })).filter((sg) => sg.pols.length > 0),
      })).filter((body) => body.subgroups.length > 0),
    }))
    .filter(({ bodies }) => bodies.length > 0);
}, [hierarchy, appointedFilter]);
```

**Where the partition slots in (D-09, discretion item on partition-vs-filter-per-tab):**
Insert immediately after `deduped` (line 1348) and before `hierarchy` (line 1350):

```javascript
import { classifyBucket } from '../lib/classify'; // already imports { computeVariant } from same module at line 5 — extend that import

// New: partition deduped by bucket (D-09/D-06). Reuses classifyBucket from Phase 207 —
// never a parallel keyword check, so tab membership can't drift from list grouping.
const bucketed = useMemo(() => {
  const buckets = { representative: [], educator: [], judge: [] };
  for (const pol of deduped) {
    buckets[classifyBucket(pol)].push(pol);
  }
  return buckets;
}, [deduped]);
```

Then build three hierarchies (recommended shape — "partition then build three hierarchies" per
the discretion note, since D-09 requires the *same* tier-grouping pipeline per bucket):

```javascript
const hierarchy = useMemo(() => groupIntoHierarchy(bucketed.representative), [bucketed]);
const educatorsHierarchy = useMemo(() => groupIntoHierarchy(bucketed.educator), [bucketed]);
const judgesHierarchy = useMemo(() => groupIntoHierarchy(bucketed.judge), [bucketed]);
```

`filteredHierarchy` (the `appointedFilter` layer, D-11 unchanged) must be re-derived per bucket
the same way — either generalize it into a small helper `applyAppointedFilter(hierarchy, appointedFilter)`
called three times, or keep three separate `useMemo`s mirroring the existing one at :1355-1370.
The **`matchesAppointedFilter` function itself (defined at :1000) is reused unchanged** — it
takes `(pol, filter)` and has no bucket awareness, so it composes cleanly per-tab.

**Import note:** `classify.js` is already imported at line 5 (`import { computeVariant } from
'../lib/classify';`) — extend this single import line to `import { computeVariant, classifyBucket }
from '../lib/classify';` rather than adding a second import statement.

**Empty-bucket detection for tab visibility (D-05) and fallback (D-08):** derive booleans from
the same `bucketed` object, e.g. `const hasEducators = bucketed.educator.length > 0;` /
`const hasJudges = bucketed.judge.length > 0;` — computed pre-appointed-filter (D-05 says "0
office-holders for the location," not "0 after the appointed-type filter is also applied") so a
tab isn't hidden just because the user has an active appointed/elected filter narrowing it to
zero.

---

### 3. Tab-row JSX — the two-button pattern to extend to four

**Analog:** `src/pages/Results.jsx:1931-1982` (current file, verified accurate — CONTEXT.md's
cited range matches exactly)

**Current structure** (lines 1931-1982, condensed to the button pair at 1934-1968):
```jsx
{(activeQuery || browseResults) && (
  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-2 border-b border-[#E2EBEF] dark:border-gray-800 px-4 sm:px-12">
    <div className="flex">
      <button
        className={`px-2 sm:px-4 py-3 text-sm min-h-[44px] transition-colors ${
          activeView === 'representatives'
            ? 'text-[#00657C] dark:text-ev-teal-light font-semibold border-b-2 border-[#00657C] dark:border-ev-teal-light'
            : 'text-[#718096] dark:text-[#8b949e] font-normal hover:text-[#4A5568] dark:hover:text-gray-300'
        }`}
        onClick={() => switchView('representatives')}
      >
        Representatives
      </button>
      <button
        className={`px-2 sm:px-4 py-3 text-sm min-h-[44px] transition-colors flex items-center gap-1 ${
          activeView === 'elections'
            ? 'text-[#00657C] dark:text-ev-teal-light font-semibold border-b-2 border-[#00657C] dark:border-ev-teal-light'
            : 'text-[#718096] dark:text-[#8b949e] font-normal hover:text-[#4A5568] dark:hover:text-gray-300'
        }`}
        onClick={() => switchView('elections')}
      >
        {/* label content — see pattern #4 below for the piece that moves out */}
      </button>
    </div>
    <div className="min-w-0 py-2 w-full sm:flex sm:flex-1 sm:justify-end sm:pl-4 sm:w-auto">
      <FilterBar ... />
    </div>
  </div>
)}
```

**How to extend (D-01, D-04, D-05):**
- Both active/inactive className ternaries are **identical boilerplate** across the two existing
  buttons — copy verbatim for Educators/Judges, only changing the `activeView === '...'` string
  and the label text/onClick target. Recommend factoring the repeated className ternary into a
  small local helper (e.g. `tabButtonClass(isActive)`) since it will now repeat 4x — not
  required, but reduces copy-paste drift.
- **D-01 order:** Representatives · Educators · Judges · Elections — insert the two new
  `<button>`s between the existing Representatives button (ends :1944) and the Elections button
  (starts :1945).
- **D-05 hide-when-empty:** wrap each new button in `{hasEducators && (<button>...</button>)}` /
  `{hasJudges && (<button>...</button>)}` — conditional render, not a `disabled` prop (this
  supersedes any grey-out affordance per D-06).
- **D-02:** the Elections button's label JSX changes from the conditional
  `{electionsLabelSuffix ? \`Elections - ${electionsLabelSuffix}\` : 'Elections'}` to a plain
  `'Elections'` string (both the `sm:hidden` and `hidden sm:inline` spans collapse to identical
  plain text — the `sm:hidden`/`hidden sm:inline` split may no longer be needed for this button
  once both breakpoints just say "Elections", but keep the day-badge removal distinct from the
  label simplification per D-02).
- **D-04 mobile fit:** the existing Elections button already demonstrates the compact-label
  responsive convention (`<span className="sm:hidden">Elections</span>` vs.
  `<span className="hidden sm:inline">...</span>`, lines 1953-1956) — mirror this exact
  two-span pattern for Educators/Judges tab labels if short labels are needed at ≤375px, and add
  horizontal scroll (`overflow-x-auto` on the tab-row flex container) if 4 tabs still don't fit
  at 280px.

---

### 4. Election summary relocation — label + badge move to location-header row

**Analog A (source, to move):** `src/pages/Results.jsx:1953-1967` (current file, verified
accurate)
```jsx
<span className="sm:hidden">Elections</span>
<span className="hidden sm:inline">
  {electionsLabelSuffix ? `Elections - ${electionsLabelSuffix}` : 'Elections'}
</span>
{electionsDaysAway && (
  <span
    className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
    style={{ backgroundColor: '#FED12E', color: '#1a1a1a' }}
  >
    <span className="sm:hidden">{electionsDaysAway.replace(/ days? (away|ago)$/, 'd').replace(/^Yesterday$/, '1d')}</span>
    <span className="hidden sm:inline">{electionsDaysAway}</span>
  </span>
)}
```

**Analog B (destination, existing sibling pattern to follow):**
`src/pages/Results.jsx:1742-1778` — the collapsed location-chip row, which already has a
precedent for "badge next to the address" via the Tribal Land badge (lines 1751-1762):
```jsx
{(formattedAddress || (searchMode === 'browse' && browseResults)) && !editingSearch && (
  <div className="flex items-center gap-2">
    <svg ...>{/* pin icon */}</svg>
    <span className="text-sm text-gray-700 dark:text-gray-300 truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {formattedAddress ? toAddressTitleCase(formattedAddress) : addressInput}
    </span>
    {tribalLand?.on_reservation && (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
        style={{ backgroundColor: '#ff5740', color: '#fff', fontFamily: "'Manrope', sans-serif" }}
        title={`On tribal land: ${tribalLand.name || 'Reservation'}`}
      >
        Tribal Land — {tribalLand.name || 'Reservation'}
      </span>
    )}
    <button onClick={() => setEditingSearch(true)} ...>{/* edit pencil icon */}</button>
  </div>
)}
```

**How to relocate (D-03):**
- Insert a new `<span>`/fragment between the address `<span>` (ends :1750) and the Tribal Land
  badge (starts :1754) — or after the Tribal Land badge, before the edit button (:1763) — showing
  `Elections - {electionsLabelSuffix} · {date portion is already baked into electionsLabelSuffix}`
  text plus the yellow `{electionsDaysAway}` pill, copied verbatim from the `sm:hidden`/`hidden
  sm:inline` badge markup above (same `#FED12E`/`#1a1a1a` colors, same `Nd` mobile-compaction
  regex).
  - Note: `electionsLabelSuffix` (defined :1253-1279) **already produces** `"{stateName}
    {typeCap} · {dateStr}"` (e.g. `"California General · Nov 3, 2026"`) — the mockup's `Elections
    - {suffix}` string is `\`Elections - ${electionsLabelSuffix}\``, identical concatenation to
    what the tab button did.
  - Guard the whole relocated block the same way the Tribal Land badge is guarded (only rendered
    when the underlying data exists) — condition on `electionsLabelSuffix` truthy, matching the
    existing tab-button conditional.
- Both `electionsLabelSuffix` (:1253) and `electionsDaysAway` (:1302) are plain `useMemo` values
  already computed above the location-header JSX (:1740-1778 comes after both at line-order), so
  no reordering of hooks is needed — just reference them in the new JSX location.
- Remove the label/badge JSX from inside the Elections `<button>` (lines 1953-1967) once moved,
  per D-02 (button becomes plain "Elections" text only).

---

### 5. Representatives render block — the pipeline to reuse verbatim (D-09)

**Analog:** `src/pages/Results.jsx:1984-2137` (current file, verified accurate — CONTEXT.md's
cited range matches exactly; block runs from `{activeView === 'representatives' ? (` at :1984 to
the closing `</>` at :2138, followed by the Elections `) : (` branch at :2139)

**Structure** (full block is ~154 lines; core render loop at lines 2043-2121):
```jsx
{filteredHierarchy.map(({ tier, bodies }) => {
  const tierKey = tier.toLowerCase();
  const tierStyle = tierColors[tierKey] ?? tierColors['local'];
  if (!tierStyle) return null;

  const tierBanner = tier === 'Local'
    ? <SectionBanner {...buildBannerProps('city', bannerCtx)} />
    : tier === 'State'
    ? <SectionBanner {...buildBannerProps('state', bannerCtx)} />
    : tier === 'Federal'
    ? <SectionBanner {...buildBannerProps('federal', bannerCtx)} />
    : null;

  return (
    <Fragment key={tier}>
      {tierBanner}
      <div data-tier={tier} className="-mx-6 md:-mx-12 px-6 md:px-12 py-3" style={...}>
        {bodies.map((body) => {
          // ... treasuryMatch lookup, GovernmentBodySection, SubGroupSection, renderSeatGroup(pol)
        })}
      </div>
    </Fragment>
  );
})}
```

Plus the surrounding scaffolding also inside this block that must be considered per new tab:
- Error message (:1988-1994) — `error && activeQuery` — probably representatives-only, likely
  skip for Educators/Judges tabs (errors are location-level, already shown once).
- Locality precision banner (:1997-2001) — likewise location-level, not bucket-specific.
- `compassTopSlot` (:2004) — **D-10 requires this stays present on all three people-tabs** — must
  be re-rendered (or kept as a single shared slot above the tab-conditional block) in each new
  tab's render.
- Loading skeletons (:2007-2013) — reusable as-is, keyed on `phase === 'loading'`, not
  bucket-specific.
- Empty-tier messages (:2018-2034), iterating `['Local', 'School', 'State']` — this loop checks
  `filteredHierarchy.some(h => h.tier === tier)`; if the render is parameterized per bucket, this
  needs to run against the **bucket-specific** `filteredHierarchy` (i.e.
  `educatorsFilteredHierarchy`, `judgesFilteredHierarchy`), not the shared one.
- Zero-results fallback (:2123-2127) checks `federalFiltered.length === 0` — this is the
  **pre-bucket-partition** list; for Educators/Judges this should instead check the bucket's own
  `.length === 0` (though D-05 already hides the tab entirely when empty, so this fallback may
  rarely fire — still needed for the appointed-filter-narrows-to-zero case per :2130-2135).
- Filter-aware empty state (:2129-2135) checks `appointedFilter !== 'All'` — reusable verbatim,
  just needs the bucket-specific `filteredHierarchy` variable substituted in.

**Recommended reuse approach (D-09 "least new code"):** extract the render-loop body
(`filteredHierarchy.map(...)` at :2043-2121, and the surrounding scaffolding :1987-2136) into a
small internal helper component/function parameterized on `(hierarchy, fallbackListLength,
viewNameForAnalytics)`, then call it three times:
```jsx
{effectiveActiveView === 'representatives' && renderPeopleTab(filteredHierarchy, federalFiltered.length, 'representatives')}
{effectiveActiveView === 'educators' && renderPeopleTab(educatorsFilteredHierarchy, bucketed.educator.length, 'educators')}
{effectiveActiveView === 'judges' && renderPeopleTab(judgesFilteredHierarchy, bucketed.judge.length, 'judges')}
```
This keeps `GovernmentBodySection`/`SubGroupSection`/`renderSeatGroup`/`SectionBanner`/tier-color
usage byte-identical across all three tabs (D-09's "look/behave identically" requirement) while
avoiding a 3x literal copy-paste of ~150 lines.

---

## Shared Patterns

### Bucket routing — single source of truth
**Source:** `src/lib/classify.js:306-326` (`classifyBucket`)
**Apply to:** the new partition `useMemo` (pattern #2) — the ONLY place `classifyBucket` should
be called in this phase. Never re-derive bucket membership via a parallel keyword check anywhere
else in `Results.jsx` (CONTEXT.md explicitly warns against drift between list grouping and tabs).
```javascript
export function classifyBucket(pol) {
  const dt = pol?.district_type || "";
  const title = pol?.office_title || "";
  const chamber = pol?.chamber_name_formal || pol?.chamber_name || "";
  if (JUDGE_DISTRICT_TYPES.has(dt)) return "judge";
  if (EDUCATOR_DISTRICT_TYPES.has(dt)) return "educator";
  if (PROSECUTOR_DEFENDER_TITLE_RE.test(title)) return "judge";
  if (JUDGE_TITLE_RE.test(title)) return "judge";
  if (SCHOOL_SUPERINTENDENT_TITLE_RE.test(title)) return "educator";
  if (SCHOOL_BOARD_TEXT_RE.test(title) || SCHOOL_BOARD_TEXT_RE.test(chamber)) return "educator";
  return "representative"; // catch-all
}
```
Null-safe (returns `'representative'` for null/missing `pol`), so it's safe to call inside a
`.filter`/`for` loop without extra guards.

### Grouping pipeline — reused unchanged per bucket
**Source:** `src/lib/groupHierarchy.js:628` (`groupIntoHierarchy`)
**Apply to:** each of the three per-bucket `useMemo`s (pattern #2). Signature:
`groupIntoHierarchy(politicians: Array) -> Array<{ tier, bodies: Array<{ key, title, url,
subgroups: Array<{ key, label, url, pols }> }> }>`. Internally calls
`deduplicateLocalMultiOffice` first (own dedup step, separate from the file's `deduped` useMemo
— safe to call on any subset). `TIER_ORDER = ['Local', 'School', 'State', 'Federal']`
(`groupHierarchy.js:357`) — note `'School'` tier exists here for `SCHOOL` district_type rows,
but since Educators/Judges tabs will only ever receive their own bucket subset, `getTier`'s
internal `SCHOOL → 'School'` and `JUDICIAL → 'State'/'Local'` routing continues to work exactly
as today per-bucket (D-09's "the existing tier grouping handles that for free").

### Appointed-filter layer — unchanged, reused per tab
**Source:** `src/pages/Results.jsx:1000` (`matchesAppointedFilter(pol, filter)`) and
`:1355-1370` (`filteredHierarchy` derivation pattern)
**Apply to:** each bucket's own filtered-hierarchy `useMemo`, per D-11 (kept as-is, still layers
on all tabs). Do not modify `matchesAppointedFilter` itself.

### Analytics event — generalizes for free
**Source:** `src/pages/Results.jsx:933` (`posthog?.capture('essentials_tab_switched', { from:
activeView, to: view })`)
**Apply to:** no code change required — calling `switchView('educators')` / `switchView('judges')`
from the new buttons automatically emits the event with those string values (discretion item,
"recommended, trivial").

### Responsive compact-label convention
**Source:** `src/pages/Results.jsx:1953-1956` and `:1962-1965` (two-span `sm:hidden` /
`hidden sm:inline` pattern; day-badge `Nd` compaction regex
`.replace(/ days? (away|ago)$/, 'd').replace(/^Yesterday$/, '1d')`)
**Apply to:** any new short-label needs for Educators/Judges tab buttons and the relocated
election-summary badge (D-04, D-03).

## No Analog Found

None — this is a single-file, additive change to `Results.jsx` that extends four existing
patterns already present in that file (tab buttons, bucket-like filtering via
`matchesAppointedFilter`, the grouping pipeline, and the location-header badge convention). No
external component or file needs a first-of-its-kind pattern.

## Metadata

**Analog search scope:** `src/pages/Results.jsx` (2180 lines, read via targeted offset/limit
reads covering lines 1-60, 350-410, 900-970, 1110-1140, 1227-1420, 1649-1653 area (grep-located),
1700-1980, 1920-2180), `src/lib/classify.js` (411 lines, read whole), `src/lib/groupHierarchy.js`
(702 lines, read lines 1-70 and 600-702; TIER_ORDER/isAdminOfficer/isJudicialOfficial locations
grepped).
**Files scanned:** 3 (all files named in `<files_to_read>`)
**Pattern extraction date:** 2026-07-18
**Line-drift check:** All CONTEXT.md-cited anchors (:373, :932, :1302, :1340-1370, :1742,
:1931-1982, :1953-1967, :1984-2137) verified against current file contents — zero drift, all
exact.

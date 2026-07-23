# Phase 214: Unified Location Combobox & Google Places Removal - Pattern Map

**Mapped:** 2026-07-21
**Files analyzed:** 10 (3 new, 5 modified, 2 deleted)
**Analogs found:** 10 / 10

## File Classification

| New/Modified/Deleted File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/LocationCombobox.jsx` (NEW) | component | request-response + client-side transform | `src/components/CampaignFinance/InfoTooltip.jsx` (floating-ui idiom) + `src/components/LocalityMatches.jsx` (listbox row markup) | role-match (composite: positioning from InfoTooltip, row markup from LocalityMatches) |
| `src/lib/inputClassifier.js` (NEW) | utility (pure classifier) | transform | `src/lib/classify.js` (pure classification function, tested by `classify.test.js`) | exact (same role: pure input→bucket classifier) |
| `src/lib/inputClassifier.test.js` (NEW) | test | transform | `src/lib/classify.test.js` | exact |
| `src/lib/api.jsx` (MODIFIED — add `searchLocationsByName`, `lookupCoordinate`) | service (API client) | request-response | `browseByArea`/`fetchBrowseAreas` (same file, lines 318-345) | exact |
| `src/lib/api.test.js` (NEW) | test | request-response | none existing for `api.jsx` — no direct analog; use `classify.test.js`'s vitest structure + mock `global.fetch` | no analog (new test-file pattern for this file) |
| `src/pages/Results.jsx` (MODIFIED — remove toggle/LocationBrowser/Google wiring, add `<LocationCombobox>`) | controller/page | request-response | itself (existing `handleAddressSearch`/`browseResults` wiring, unchanged) | exact (in-place edit) |
| `src/pages/Landing.jsx` (MODIFIED — remove Google wiring, adopt `<LocationCombobox>`) | controller/page | request-response | itself (existing `handleSearch`/`handleAreaClick`, unchanged) | exact (in-place edit) |
| `src/lib/localitySearch.js` (MODIFIED — drop `classifyQuery`, keep/adapt `resolveLocalityRoute`) | utility (routing) | request-response | itself | exact (in-place edit) |
| `src/index.css` (MODIFIED — delete `.pac-container`/`.pac-item*` block) | config/style | — | itself, lines 60-102 + 120-123 | exact |
| `package.json` (MODIFIED — uninstall `@googlemaps/js-api-loader`) | config | — | itself, line 21 | exact |
| `src/hooks/useGooglePlacesAutocomplete.js` (DELETE) | hook | event-driven | — | n/a (deletion) |
| `src/components/LocationBrowser.jsx` (DELETE, only consumer is Results.jsx) | component | CRUD (cascading selects → fetch) | — | n/a (deletion) |

---

## Pattern Assignments

### `src/components/LocationCombobox.jsx` (NEW component, request-response + client transform)

**Analog 1 — positioning/interaction primitive:** `src/components/CampaignFinance/InfoTooltip.jsx` (full file, 63 lines)

**Imports pattern** (lines 1-5):
```jsx
import { useState } from 'react';
import {
  useFloating, useHover, useFocus, useClick, useDismiss, useRole, useInteractions,
  FloatingPortal, offset, flip, shift, autoUpdate,
} from '@floating-ui/react';
```
For the combobox, swap `useHover`/`useFocus`/`useClick` + `useRole({role:'dialog'})` for `useListNavigation({virtual:true})` + `useRole({role:'listbox'})` (per RESEARCH.md's blueprint) — same `useFloating`/`useInteractions`/`FloatingPortal` skeleton.

**Core floating-ui wiring pattern** (lines 15-29):
```jsx
export default function InfoTooltip({ content, label = 'More information' }) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [offset(8), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });
  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, click, dismiss, role]);
```

**Portal render pattern** (lines 42-60) — reference `ref={refs.setReference}` on the trigger, `ref={refs.setFloating}` + `style={floatingStyles}` inside `<FloatingPortal>` on the popup. Directly reusable for the combobox's `<input ref={refs.setReference}>` + `<ul ref={refs.setFloating}>` pair. RESEARCH.md's own blueprint (214-RESEARCH.md lines 225-313) already adapts this exact skeleton with `useListNavigation({ virtual: true })` — use that blueprint verbatim as the starting point, cross-checked here against the real, currently-shipping `InfoTooltip.jsx` idiom (confirmed identical `useFloating`/middleware/`useInteractions` shape — no drift between the blueprint and the live file).

**Analog 2 — listbox row markup + candidate-list state shape:** `src/components/LocalityMatches.jsx` (full file, 99 lines)

**Row markup to lift verbatim (adapt data keys)** (lines 64-96):
```jsx
<ul role="listbox" className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
  {matches.map((area, i) => (
    <li key={`${area.kind}-${area.stateAbbrev || area.browseState}-${area.label}`} role="option" aria-selected={i === active}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={() => setActive(i)}
        onClick={() => onSelect(area)}
        className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
          i === active ? 'bg-[var(--ev-bg-light)] dark:bg-gray-800' : 'hover:bg-[var(--ev-bg-light)] dark:hover:bg-gray-800'
        }`}
      >
        <span className="min-w-0 truncate">
          <span className="font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light">{area.label}</span>
          {area.stateAbbrev && <span className="text-sm text-gray-500 dark:text-gray-400">, {area.stateAbbrev}</span>}
        </span>
        <span className="shrink-0 flex items-center gap-2">
          {area.kind && area.kind !== 'city' && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
              {area.kind}
            </span>
          )}
          {area.hasContext && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ev-teal)] dark:text-ev-teal-light bg-[var(--ev-bg-light)] dark:bg-gray-800 rounded-full px-2 py-0.5">
              Stances
            </span>
          )}
        </span>
      </button>
    </li>
  ))}
</ul>
```
**Field mapping for the new `/location-search` candidate shape** (`{geo_id, mtfcc, label, state, has_local_data}` per 212-CONTEXT.md, vs. the old static-catalog `area` shape `{label, stateAbbrev, kind, hasContext}` this markup was written for): `area.stateAbbrev` → `candidate.state`; `area.hasContext` → `candidate.has_local_data`; `area.kind` → derive from `candidate.mtfcc` (city/county/state area-type tag — UI-SPEC line 89 says keep the existing `city`/`county`/`state` casing/style). Onward navigation replaces `onSelect(area)` with the D-08-mandated dispatch: build `/results?browse_geo_id=...&browse_mtfcc=...&browse_label=...` directly from `{geo_id, mtfcc, label}` (see `browseAreaRoute()` pattern below) rather than routing through `coverageAreaToPath`, which expects the OLD catalog shape and does not understand `geo_id`/`mtfcc` alone.

**Anti-pattern explicitly to DROP (do not carry forward):** the document-level capture-phase keydown listener (lines 33-54) and the `.pac-container { display:none }` inline `<style>` (line 63) — both existed only to beat Google's own listener (see file's own docstring, lines 4-21). Replace with `useListNavigation({ virtual: true })` per RESEARCH.md's blueprint (214-RESEARCH.md lines 214-329).

---

### `src/lib/inputClassifier.js` (NEW utility, pure transform)

**Analog:** `src/lib/classify.js` — the project's existing pure-function classifier (`computeVariant`, `classifyCategory`, `classifyBucket`), tested by `src/lib/classify.test.js` with zero DOM/component dependency. Follow the same shape: plain exported functions, no side effects, description in a header comment stating the constants/thresholds (`STATE-01`/`STATE-02`/`STATE-03` style requirement-ID tags — for this phase, tag with `SRCH-03`/`D-02`).

**Core pattern to follow (test file structure)** — `src/lib/classify.test.js` (lines 1-33):
```js
import { describe, it, expect, test } from 'vitest';
import { computeVariant, classifyCategory, classifyBucket } from './classify.js';

function makePol(overrides) {
  return { district_type: 'LOCAL', office_title: 'Council Member', ...overrides };
}

describe('computeVariant — empty detection (STATE-01)', () => {
  it('returns "empty" when userAnswers is null', () => {
    expect(computeVariant(makePol({}), null)).toBe('empty');
  });
  // ...
});
```
Mirror this exactly for `inputClassifier.test.js`: `describe('classifyInput — coordinate detection (D-02)', ...)` etc., one `describe` block per input kind (`coordinate`/`address`/`name`/`empty`), `it.each` for table-style regex edge cases (see the `it.each` pattern at `classify.test.js` lines 37-44 for keyword-list style tests — reusable for the address-leading-digit edge cases documented in RESEARCH.md's Open Questions).

**Concrete implementation already drafted in RESEARCH.md** (214-RESEARCH.md lines 373-394) — use as the starting point, including the documented edge cases (leading-digit "5 Points" misclassification, space-separated-coordinate gap) as explicit test cases, not just prose caveats.

---

### `src/lib/api.jsx` (MODIFIED — add `searchLocationsByName`, `lookupCoordinate`)

**Analog:** `browseByArea`/`fetchBrowseAreas` in the same file (lines 318-345) — every function in `api.jsx` follows this exact shape: `try/catch`, `publicFetch` for anonymous endpoints, defensive `Array.isArray(data) ? data : ...` unwrapping, `{ data, error }` return shape, `console.error` on catch.

**Core pattern to copy verbatim (structure)** (lines 318-345):
```js
export async function browseByArea(geoId, mtfcc) {
  try {
    const res = await publicFetch('/essentials/browse/by-area', {
      method: 'POST',
      body: JSON.stringify({ geo_id: geoId, mtfcc }),
    });
    if (!res || !res.ok) return { data: [], error: `${res?.status ?? 'unknown'}` };
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    console.error('browseByArea error:', err);
    return { data: [], error: err.message };
  }
}

export async function fetchBrowseAreas(stateAbbrev) {
  try {
    const res = await publicFetch(`/essentials/browse/states/${encodeURIComponent(stateAbbrev)}/areas`);
    if (!res || !res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('fetchBrowseAreas error:', err);
    return [];
  }
}
```

**Error-code threading pattern to copy** (for `lookupCoordinate`'s 422 taxonomy) — `searchPoliticians` (lines 78-123), specifically its JSON-error-body parsing on non-ok responses:
```js
if (!res.ok) {
  let errorMessage = `${res.status} ${res.statusText}`;
  try {
    const errJson = await res.json();
    if (errJson.code === "ADDRESS_NOT_FOUND") {
      errorMessage = "address_not_found";
    } else if (errJson.message) {
      errorMessage = errJson.message;
    }
  } catch { /* fall through to generic message */ }
  console.error(`Search API error: ${res.status}`, errorMessage);
  return { status: "error", data: [], error: errorMessage, formattedAddress: "" };
}
```
Adapt this for `lookupCoordinate`'s 3-code 422 taxonomy (`OUTSIDE_US_BOUNDS`/`SWAPPED_COORDINATES`/`INVALID_COORDINATES`) exactly as RESEARCH.md's drafted implementation does (214-RESEARCH.md lines 455-481) — use `publicFetch` (NOT `apiFetch`; both 212/213 endpoints are anonymous, and `apiFetch` would wrongly redirect-to-login on an unrelated 401 path — see `auth.js` line 47-51 below).

**publicFetch/apiFetch source** — `src/lib/auth.js` (lines 36-66, full functions):
```js
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (res.status === 401) { clearToken(); redirectToLogin(); return null; }
  return res;
}

export async function publicFetch(path, options = {}) {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
}
```
`publicFetch` never redirects on 401/never short-circuits on non-2xx — the caller must handle all status codes itself, exactly as the recommended `lookupCoordinate`/`searchLocationsByName` do.

---

### `src/pages/Results.jsx` (MODIFIED — remove Address/Browse toggle + `LocationBrowser` + Google wiring, wire `<LocationCombobox>`)

**Exact removal targets, verified against live source (line numbers as of this research; re-verify at execute time since edits above shift them):**
- Line 23: `import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';` — DELETE
- Line 24: `import { resolveLocalityRoute } from '../lib/localitySearch';` — KEEP (still used by `handleAddressSearch`, unless refactored)
- Line 27: `import LocationBrowser from '../components/LocationBrowser';` — DELETE (only consumer, confirmed by RESEARCH.md's grep)
- Lines 393, 490-495, 1047, 1153, 1185: `searchMode` state and every branch keyed on `'browse'` vs `'address'` — the combobox replaces the manual toggle UI (lines 1958-1980) but RESEARCH.md recommends KEEPING an internal `searchMode`-equivalent (possibly adding a third `'coordinate'` value) to drive `list`/`phase` derivation (lines 490-495) and the `representingCity` banner guard (lines 1153-1156) — do not delete this state wholesale, just stop exposing it as a user-facing toggle.
- Lines 969-1004 (`handleAddressSearch`): KEEP the core body (URL param wiring, `resolveLocalityRoute` call at line 982) — this becomes the combobox's `address`-classified submit handler, called directly, no longer gated by a DOM ref.
- Lines 1006-1013 (`useGooglePlacesAutocomplete` wiring incl. `addressInputRef`): DELETE — replaced by the combobox's own controlled `value`/`onChange` (per RESEARCH.md Pitfall 2 — do NOT carry forward the `addressInputRef.current?.value ?? addressInput` ref-reading workaround at line 975; it was purely a Google-direct-DOM-write workaround).
- Lines 1957-2103 (full JSX block: mode-toggle buttons 1959-1980, address `<input>` 1984-1996, `<LocalityMatches>` 2025-2035, `<LocationBrowser>` 2060-2102): REPLACE with a single `<LocationCombobox>` invocation.

**Reusable label-derivation pattern** — `toAddressTitleCase` (lines 114-138, full function) — reuse UNCHANGED for D-07's address resting-label:
```js
function toAddressTitleCase(address) {
  if (!address) return address;
  return address
    .split(', ')
    .map((part, partIdx) => {
      const upper = part.toUpperCase();
      if (partIdx > 0 && (STATE_ABBREVS.has(upper) || /^\d{5}(-\d{4})?$/.test(part))) {
        return upper;
      }
      return part.split(' ').map((word) => {
        const up = word.toUpperCase();
        if (STATE_ABBREVS.has(up)) return up;
        if (STREET_ABBREVS.has(up)) return up.charAt(0) + up.slice(1).toLowerCase();
        if (!word) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    })
    .join(', ');
}
```

**`representingCity` banner-hijack guard to extend for the new dispatch paths** (lines 1148-1185, full `useMemo`):
```js
const representingCity = useMemo(() => {
  if (searchMode === 'browse') {
    const label = searchParams.get('browse_label');
    if (label && label.trim()) return label.trim();
  }
  const src = Array.isArray(list) ? list : [];
  for (const p of src) {
    const dt = p?.district_type || '';
    if (dt.startsWith('NATIONAL') || dt.startsWith('STATE')) continue;
    if (p.representing_city) return p.representing_city;
  }
  for (const p of src) {
    const dt = p?.district_type || '';
    if (dt === 'LOCAL' && p.chamber_name) {
      const beforeCity = p.chamber_name.match(/^(\w[\w\s]+?)\s+City\b/);
      if (beforeCity) return beforeCity[1];
      const cityOf = p.chamber_name.match(/^City of\s+(.+)$/i);
      if (cityOf) return cityOf[1].trim();
    }
  }
  const fromAddress = parseCityFromAddress(addressInput);
  if (fromAddress) return fromAddress;
  return null;
}, [list, addressInput, searchMode, searchParams]);
```
Per RESEARCH.md's Pitfall 3 (218-RESEARCH.md lines 655-672 area): if a new `searchMode === 'coordinate'` value is introduced, this `useMemo` MUST be extended with an explicit branch for it (mirroring the `searchMode === 'browse'` branch) rather than falling through to the "derive from politician records" path, which can surface a neighboring jurisdiction's stray `representing_city`.

**Direct-injection state to reuse for the coordinate result path** — `browseResults`/`browseLoading` (lines 396-397, 490-495) — RESEARCH.md's recommended approach (Dispatch/Navigation Wiring → Coordinate path) is to reuse this same "list injected directly, not derived from `usePoliticianData`" mechanism for coordinate results rather than inventing a third fetch-hook.

---

### `src/pages/Landing.jsx` (MODIFIED — remove Google wiring, adopt `<LocationCombobox>`, KEEP coverage list)

**Exact removal targets:**
- Line 7: `import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';` — DELETE
- Line 9: `import { resolveLocalityRoute } from '../lib/localitySearch';` — KEEP if `localitySearch.js` is refactored-not-deleted (per D-09 discretion); otherwise replace call site with the new classifier + resolver.
- Line 10: `import LocalityMatches from '../components/LocalityMatches';` — DELETE (superseded by the combobox's own listbox, which lifts this component's row markup — see LocationCombobox section above).
- Lines 50-56 (`useGooglePlacesAutocomplete` call): DELETE.
- Lines 83-102 (`handleSearch`): the `resolveLocalityRoute(q)` call (line 97) is replaced per RESEARCH.md's Dispatch Wiring section — an `address`-classified value now navigates directly to `/results?q=...`, skipping the resolver detour entirely (D-02); a `name`-classified value is handled by the new combobox's own candidate-select flow, not `handleSearch`.
- Lines 279-314 (address `<input>` + `<LocalityMatches>` JSX): REPLACE with `<LocationCombobox>`.

**UNCHANGED — do not touch (D-04 explicitly preserves this):**
- Lines 112-139 (`handleAreaClick`) — the coverage-list click-to-browse routing.
- Lines 165-235 (`nameQuery`/`nameSearchResults`) — the SEPARATE "search candidates by name" feature; not a location search, out of scope (RESEARCH.md explicitly flags this as a different feature not to conflate).
- Coverage list rendering (COVERAGE_STATES map, lines ~385+).

**Debounce pattern to reuse for the combobox's name-search branch** — existing `nameQuery` debounce effect (lines 170-185, full effect):
```js
const debounceRef = useRef(null);
useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  const q = nameQuery.trim();
  if (q.length < 2) {
    setNameResults([]);
    setNameStatus('idle');
    return;
  }
  setNameStatus('loading');
  debounceRef.current = setTimeout(async () => {
    const { status, data } = await searchPoliticiansByName(q);
    setNameResults(Array.isArray(data) ? data : []);
    setNameStatus(status === 'fresh' ? 'fresh' : 'error');
  }, 300);
  return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
}, [nameQuery]);
```
This is the local precedent RESEARCH.md points to (its own drafted debounce snippet, 214-RESEARCH.md lines 718-736, is a direct adaptation of this exact block gated additionally by `classifyInput(value).kind === 'name'`).

---

### `src/lib/localitySearch.js` (MODIFIED — drop Google `classifyQuery`, keep/adapt `resolveLocalityRoute`)

**To DELETE** (lines 1-71): the header ADR-0001 comment can stay/be updated, but the Google import (line 13) and `classifyQuery()` (lines 35-71) must go:
```js
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
...
export async function classifyQuery(query) {
  if (!API_KEY) throw new Error('no maps key');
  ensureConfigured();
  const { Geocoder } = await importLibrary('geocoding');
  ...
}
```

**To KEEP/ADAPT** — `browseAreaRoute` (lines 79-88, full function) is the EXACT pattern for building a browse URL from `{geo_id, mtfcc, label/name}` — this is the recommended mechanism (per RESEARCH.md Dispatch Wiring) for turning a `/location-search` candidate into a navigation target, since `coverageAreaToPath` (in `coverage.js`) expects the OLD static-catalog shape instead:
```js
function browseAreaRoute(area) {
  const params = new URLSearchParams({
    browse_geo_id: area.geo_id,
    browse_mtfcc: area.mtfcc,
    browse_label: cleanAreaName(area.name),
    from_locality: '1',
  });
  return `/results?${params.toString()}`;
}
```
Adapt: the new `/location-search` candidate shape uses `label` not `name` (per 212-CONTEXT.md: `{geo_id, mtfcc, label, state, has_local_data}`) — drop the `cleanAreaName()` TIGER-suffix-stripping call (line 84) since `label` is already the clean, pre-formatted display string per 212's own D-05/D-07 contract, unlike the old TIGER `name` field this helper was written against.

**`resolveLocalityRoute`'s outer shape to preserve** (lines 100-132) — the `{kind: 'address'} | {kind: 'browse', to} | {kind: 'coverage', to}` return contract is still useful for Landing's `handleSearch`/coverage-fallback flow; only its FIRST step (`classifyQuery` → Google) needs replacing with the new client heuristic + `/location-search` call. The `fetchBrowseAreas`-based state-coverage-check (lines 110-116) and city/county exact-match logic (lines 118-128) can stay as post-classification steps if `localitySearch.js` is refactored-in-place rather than deleted (D-09 explicitly leaves this choice to the planner).

---

### `src/index.css` (MODIFIED — delete Google Places CSS block)

**Exact block to delete, verified live** (lines 60-102, plus the separate trailing rule at 120-123 — note lines 104-118 are an UNRELATED `.ev-candidate-enter` animation block sandwiched in between and must NOT be deleted):
```css
/* Google Places Autocomplete dropdown */
.pac-container { ... }      /* lines 60-68 */
.pac-item { ... }            /* lines 70-81 */
.pac-item:first-child { ... }/* lines 83-85 */
.pac-item:hover { ... }      /* lines 87-89 */
.pac-item-selected { ... }   /* lines 91-93 */
.pac-matched { ... }         /* lines 95-98 */
.pac-icon { ... }            /* lines 100-102 */
/* --- KEEP: lines 104-118, .ev-candidate-enter keyframes + class, unrelated --- */
.pac-item-query { ... }      /* lines 120-123 */
```
**Gotcha for the executor:** the `.pac-item-query` rule is NOT contiguous with the rest of the block — a naive single-range delete of lines 60-123 would also remove the candidate-card entrance animation, which is unrelated and must survive. Delete in two non-contiguous edits (60-102, then 120-123), or delete individually rule-by-rule.

---

### `package.json` (MODIFIED — uninstall `@googlemaps/js-api-loader`)

**Exact line, verified live** (line 21):
```json
"@googlemaps/js-api-loader": "^2.0.2",
```
Run `npm uninstall @googlemaps/js-api-loader` (not a manual edit) so `package-lock.json` is regenerated consistently.

---

## Shared Patterns

### Anonymous public API calls
**Source:** `src/lib/auth.js` lines 56-66 (`publicFetch`)
**Apply to:** Both new `api.jsx` functions (`searchLocationsByName`, `lookupCoordinate`) — never `apiFetch`, since both backend endpoints (Phase 212/213) are explicitly anonymous and `apiFetch`'s 401→login-redirect behavior is wrong for a typeahead that fires while the user may not be logged in.

### `{ data, error }` / status-tagged return shape for every `api.jsx` function
**Source:** `src/lib/api.jsx`, every exported function (`browseByArea`, `fetchBrowseAreas`, `searchPoliticians`, etc.)
**Apply to:** `searchLocationsByName` (`{ data: [], error }`), `lookupCoordinate` (`{ data, error, code, formattedAddress }` per RESEARCH.md's drafted signature) — defensive `Array.isArray(data) ? data : (data.candidates || [])` unwrapping for response-shape uncertainty (Assumption A2 in RESEARCH.md).

### Floating-UI positioning primitive
**Source:** `src/components/CampaignFinance/InfoTooltip.jsx` (full file) — the project's one existing idiomatic use of `useFloating` + `useInteractions` + a manual middleware array (`offset`/`flip`/`shift`/`autoUpdate`).
**Apply to:** `LocationCombobox.jsx` — swap the dialog-specific hooks (`useHover`/`useFocus`/`useClick`/`useRole({role:'dialog'})`) for listbox-specific ones (`useListNavigation({virtual:true})`/`useRole({role:'listbox'})`/`useDismiss`), keep the `useFloating`/`FloatingPortal`/`autoUpdate` skeleton identical.

### Debounced network call gated by a classifier/length check
**Source:** `src/pages/Landing.jsx` lines 170-185 (`nameQuery` debounce effect)
**Apply to:** `LocationCombobox`'s name-search branch — same `setTimeout`/`clearTimeout` ref pattern, additionally gated on `classifyInput(value).kind === 'name'` (per RESEARCH.md's Pitfall 4 — gate the NETWORK CALL, not just the UI rendering, so address/coordinate-shaped typing never fires `/location-search` requests).

### `representing_city` banner-hijack guard
**Source:** `src/pages/Results.jsx` lines 1148-1185 (`representingCity` useMemo) — see `project_representing_city_banner_hijack.md` memory.
**Apply to:** Any new `searchMode`/dispatch value this phase introduces (e.g. a coordinate render path) MUST extend this guard with an explicit label-of-record branch, exactly like the existing `searchMode === 'browse'` branch — otherwise a coordinate lookup near a jurisdiction boundary can show the wrong city's banner.

### Pure-function classifier + colocated vitest test, zero DOM
**Source:** `src/lib/classify.js` + `src/lib/classify.test.js`
**Apply to:** `src/lib/inputClassifier.js` + `src/lib/inputClassifier.test.js` — same style: `describe` block per requirement/behavior, `it.each` for regex edge-case tables, no `jsdom`/`@testing-library` dependency needed.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/lib/api.test.js` (NEW, per RESEARCH.md Wave 0 gap) | test | request-response | No existing test file targets `api.jsx`'s network functions with a mocked `fetch` — this is a genuinely new test-file pattern for this codebase. Use `classify.test.js`'s vitest `describe`/`it` structure as the stylistic template, and mock `global.fetch` per the standard Vitest convention (no existing local precedent to copy the mock-fetch mechanics from specifically). |

---

## Metadata

**Analog search scope:** `src/pages/`, `src/components/`, `src/components/CampaignFinance/`, `src/lib/`, `src/hooks/`, `src/index.css`, `package.json` — all read directly (no whole-repo scan needed; RESEARCH.md had already enumerated the exact touched-file set with high confidence).
**Files scanned:** 12 direct reads (`LocalityMatches.jsx`, `LocationBrowser.jsx`, `localitySearch.js`, `useGooglePlacesAutocomplete.js`, `Results.jsx` [4 ranges], `Landing.jsx` [2 ranges], `api.jsx` [3 ranges], `auth.js`, `coverage.js` [2 ranges], `InfoTooltip.jsx`, `classify.test.js`, `index.css`, `package.json`).
**Pattern extraction date:** 2026-07-21

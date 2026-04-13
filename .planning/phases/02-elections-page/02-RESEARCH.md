# Phase 2: Elections Page - Research

**Researched:** 2026-04-12
**Domain:** React 19 / React Router 7 / Tailwind CSS 4 — standalone page with tier-aware auto-load
**Confidence:** HIGH

## Summary

This phase adds a `/elections` route to the existing React+Vite frontend. The codebase is well-understood: routes are declared in `App.jsx`, pages live in `src/pages/`, and the `Layout` component wraps all pages with the site header. The `useCompass()` hook from `CompassContext` provides auth state, `userJurisdiction`, and loading state. `ElectionsView.jsx` already handles all rendering, grouping, and seeded shuffle — it is imported directly and not duplicated.

The one significant backend gap is that there is no `elections/me` endpoint analogous to `representatives/me`. The `representatives/me` route decrypts stored coordinates server-side and returns results without exposing raw lat/lng. No equivalent endpoint exists for elections. The elections page for Connected users must use a different strategy: call `fetchElectionsByAddress` with the jurisdiction city+state string derived from `userJurisdiction` (e.g. "Bloomington, IN"), which is already available from `useCompass()`. This is confirmed by reading the account `/me` response: `jurisdiction.city` and `jurisdiction.state` are always present when jurisdiction is non-null.

The county shortcuts (Monroe County, LA County) use the same `fetchElectionsByAddress` function — just with a hard-coded representative address string, identical to the pattern in `Landing.jsx`'s `COVERAGE_AREAS`.

**Primary recommendation:** Build `Elections.jsx` as a new page in `src/pages/`. Import `ElectionsView` unchanged. For Connected auto-load, call `fetchElectionsByAddress` with `${userJurisdiction.city}, ${userJurisdiction.state}`. Add the `/elections` route to `App.jsx`.

## Standard Stack

No new dependencies required. All tools are already installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.1.1 | Component framework | Project standard |
| react-router-dom | ^7.8.2 | `useNavigate` for candidate navigation | Already used in all pages |
| tailwindcss | ^4.1.12 | Styling | Project standard |

### Existing Internal Modules (reuse directly)
| Module | Location | Purpose |
|--------|----------|---------|
| `ElectionsView` | `src/components/ElectionsView.jsx` | All election rendering, grouping, seeded shuffle |
| `fetchElectionsByAddress` | `src/lib/api.jsx` | Public elections fetch by address string |
| `useCompass` | `src/contexts/CompassContext.jsx` | `userJurisdiction`, `isLoggedIn`, `compassLoading` |
| `Layout` | `src/components/Layout.jsx` | Header wrapper — use on all pages |

**Installation:** None required.

## Architecture Patterns

### Recommended File Structure
```
src/
├── pages/
│   └── Elections.jsx        # NEW — standalone /elections page
├── components/
│   └── ElectionsView.jsx    # UNCHANGED — already handles all display logic
├── lib/
│   └── api.jsx              # UNCHANGED — fetchElectionsByAddress already exists
App.jsx                      # ADD: <Route path="/elections" element={<Elections />} />
```

### Pattern 1: Tier-Aware Auto-Load on Mount

**What:** On mount, check `compassLoading` → then check `isLoggedIn && userJurisdiction != null`. If true, auto-fetch elections and display results directly with no address input visible. Otherwise show address input + shortcut buttons.

**When to use:** This is the sole page entry pattern for `/elections`.

**Example:**
```jsx
// Source: CompassContext.jsx — userJurisdiction shape
// jurisdiction: { city: "Bloomington", state: "IN", county_name: "Monroe County", ... }

useEffect(() => {
  if (compassLoading) return;
  if (!isLoggedIn || !userJurisdiction) return;
  // Auto-fetch using stored jurisdiction
  const address = [userJurisdiction.city, userJurisdiction.state].filter(Boolean).join(', ');
  if (!address) return;
  setFetchLoading(true);
  fetchElectionsByAddress(address).then(({ elections, error }) => {
    setElectionsData(elections ?? []);
    setFetchError(error);
    setLocationLabel(address);
    setFetchLoading(false);
  });
}, [compassLoading, isLoggedIn, userJurisdiction]);
```

**Key guard:** The `compassLoading` check is mandatory. `userJurisdiction` is `null` during the async load; triggering a fetch before `compassLoading` is false will always show the address input first and then flash to results, which violates ELEC-02.

### Pattern 2: Address Input Submit

**What:** Plain `<input>` + search button. Enter key and button click both call the same handler. Spinner on the button during fetch (not full-page). Inline error below the input.

**Example (from Results.jsx, adapted):**
```jsx
// Spinner pattern from CandidateProfile.jsx — animate-spin with ev-teal
<button
  onClick={handleSearch}
  disabled={fetching || !address.trim()}
  className="px-6 py-2 font-bold text-white bg-[var(--ev-teal)] rounded-lg
             hover:bg-[var(--ev-teal-dark)] disabled:opacity-50 transition-colors"
>
  {fetching
    ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mx-auto" />
    : 'Search'
  }
</button>
```

**Inline error (below input):**
```jsx
{fetchError && (
  <p className="mt-2 text-sm text-red-600">
    {fetchError === 'address_not_found' || fetchError === 'geocoder_unavailable'
      ? 'Address not recognized. Please enter a full street address.'
      : electionsData?.length === 0
        ? 'No elections found for this address.'
        : fetchError}
  </p>
)}
```

### Pattern 3: County Shortcuts

**What:** Two buttons that immediately call `fetchElectionsByAddress` with a hard-coded representative address. Same hard-coded address values already exist in `Landing.jsx`:
- Monroe County: `'100 W Kirkwood Ave, Bloomington, IN 47404'`
- LA County: `'500 W Temple St, Los Angeles, CA 90012'`

**Visibility:** Only shown when `electionsData === null` (no results yet loaded). Once results are showing, shortcuts disappear.

**Example:**
```jsx
// Source: Landing.jsx COVERAGE_AREAS pattern
const COUNTY_SHORTCUTS = [
  { label: 'Monroe County', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { label: 'LA County', address: '500 W Temple St, Los Angeles, CA 90012' },
];
```

### Pattern 4: Change Location for Connected Users

**What:** When auto-loaded results are showing, display `"Showing elections for [location] · Change"` above the results. Clicking "Change" reveals an address input above the results — results remain visible. Submitting a new address replaces results but does NOT call `saveMyLocation`.

**State shape:**
```jsx
// electionsData: array | null (null = not yet fetched)
// locationLabel: string | null (what was used for the last fetch)
// showChangeInput: boolean
```

The "Showing elections for..." label reuses the exact visual pattern from Results.jsx:
```jsx
<p className="text-sm text-gray-500" style={{ fontFamily: "'Manrope', sans-serif" }}>
  Showing elections for <span className="font-semibold text-gray-700">{locationLabel}</span>
  {' · '}
  <button onClick={() => setShowChangeInput(true)} className="text-[var(--ev-teal)] hover:underline">
    Change
  </button>
</p>
```

### Pattern 5: Election Section Headers

**What:** Named section per election, format: `"[election_name] — [formatted date]"` (e.g. "2026 Indiana Primary — May 5").

**Note:** `ElectionsView` already renders its own election-level header (`election.election_name` + date). The CONTEXT decision says the page-level heading "Elections" appears above everything. The election section headers inside `ElectionsView` are already implemented — they do NOT need to be added to the wrapper.

Review `ElectionsView` lines 308–322 to confirm: it renders `election.election_name` as an `h2` and the date as a `p`. These are the section headers the CONTEXT refers to. No change needed to `ElectionsView`.

### Pattern 6: Government-Level Sub-Grouping Order

**What:** ElectionsView already handles tier ordering as Local → State → Federal via `TIER_ORDER = ['Local', 'State', 'Federal', 'Other']` (line 206). This is already correct per CONTEXT decisions. No change needed.

### Anti-Patterns to Avoid

- **Showing address input before compassLoading resolves:** Will flash the input then immediately hide it for Connected users. Always gate on `!compassLoading`.
- **Calling `saveMyLocation` on the Elections page:** This is an explicit constraint from CONTEXT. Address lookups on this page are view-only and must NOT update the user's stored jurisdiction.
- **Duplicating ElectionsView logic:** The component already has seeded shuffle, grouping, tier ordering, election headers, and loading skeleton. Do not re-implement any of it in the Elections page.
- **Removing or modifying `tierFilter` prop on ElectionsView:** The Results page passes a tier filter. For the Elections page, pass `tierFilter="All"` (no filter controls needed per CONTEXT).
- **Fetching before compassLoading is false:** `userJurisdiction` is initially null and resolves async. A check of `userJurisdiction != null` before `compassLoading` resolves will always be false.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Elections display/grouping/shuffle | Custom rendering | `ElectionsView` | Already battle-tested; seeded shuffle lives there |
| Elections fetch by address | Custom fetch | `fetchElectionsByAddress` from `src/lib/api.jsx` | Already handles 503, empty, error cases |
| Auth/jurisdiction state | Custom hooks | `useCompass()` | Single source of truth; jurisdiction, isLoggedIn, compassLoading all here |
| Page header/navigation | Custom header | `Layout` component | Consistent with all other pages |
| Candidate navigation | Custom routing | `useNavigate` to `/candidate/:id` | Same pattern as Results.jsx lines 984–993 |
| Loading spinner | Custom component | Tailwind `animate-spin` pattern from CandidateProfile.jsx | Consistent with existing loading states |

**Key insight:** Nearly all the hard work is already done. The Elections page is primarily orchestration: detect user state → decide what to show → call `fetchElectionsByAddress` → pass data to `ElectionsView`.

## Common Pitfalls

### Pitfall 1: compassLoading Race Condition
**What goes wrong:** Connected user with jurisdiction sees the address input briefly before auto-load fires.
**Why it happens:** `compassLoading` starts as `true`; if the component renders immediately based on `isLoggedIn` (which also starts as false), the user sees the wrong view.
**How to avoid:** Render a neutral loading state (e.g. just the page heading, no input or results) until `compassLoading` is false. Only then decide which view to show.
**Warning signs:** Address input flashes then disappears on page load for logged-in users.

### Pitfall 2: Jurisdiction Address String Fails Geocoding
**What goes wrong:** `"Bloomington, IN"` might not geocode to a point inside Monroe County's geofence, returning zero elections even though the user is in Monroe County.
**Why it happens:** The `elections-by-address` endpoint calls the Census Geocoder which expects a street-level address. City+state strings may return a low-confidence match or fail PostGIS containment.
**How to avoid:** Test the auto-load path with actual Connected test accounts. If city+state is unreliable, the fallback is to use a centroid address from `COUNTY_SHORTCUTS` matching the user's county, or to request a backend `elections/me` endpoint (see Open Questions).
**Warning signs:** Auto-loaded results return empty array for a user with a valid Monroe County jurisdiction.

### Pitfall 3: Showing Empty Elections as "No elections found" on Auto-Load
**What goes wrong:** Auto-load returns `elections: []`. Page shows "no elections found" error even though the user has a valid location — just no elections in the database for that area.
**Why it happens:** The `ElectionsView` already handles `elections.length === 0` with a friendly message ("We're expanding coverage"). But if the page also shows an inline error, the user sees a confusing double-message.
**How to avoid:** Let `ElectionsView` handle the empty state. Only show the inline error for actual error codes (address_not_found, geocoder_unavailable). An empty array with `error: null` is not an error.

### Pitfall 4: Shortcut Buttons Visible After Results Load
**What goes wrong:** County shortcuts remain visible after results are shown, cluttering the interface.
**Why it happens:** Forgetting to gate shortcut visibility on `electionsData === null`.
**How to avoid:** Condition shortcut display: `{electionsData === null && <shortcuts />}`. Once any fetch completes (even empty), `electionsData` is set to `[]` not `null`, so shortcuts disappear.

### Pitfall 5: `useCompass` Not Available — Missing CompassProvider
**What goes wrong:** Elections page crashes with "cannot read context" if it's somehow rendered outside `CompassProvider`.
**Why it happens:** Won't happen — `CompassProvider` wraps all `<Routes>` in App.jsx. But if the route is added outside the provider, it will fail.
**How to avoid:** Add the `/elections` route inside the existing `<CompassProvider>` block in `App.jsx` (same level as all other routes). It already wraps everything.

### Pitfall 6: Calling fetchElectionsByAddress During Shortcut Click While Another Fetch is In Progress
**What goes wrong:** User clicks Monroe County shortcut while a previous fetch is in-flight. Results race.
**Why it happens:** No abort/cancel handling.
**How to avoid:** Use a simple cancelled flag pattern (same as Results.jsx lines 334–346), or disable shortcut buttons and search button while `fetching === true`.

## Code Examples

### Complete State Variables for Elections.jsx
```jsx
// Source: derived from Results.jsx patterns and CONTEXT decisions
const [electionsData, setElectionsData] = useState(null); // null = not yet fetched
const [fetchLoading, setFetchLoading] = useState(false);
const [fetchError, setFetchError] = useState(null);
const [locationLabel, setLocationLabel] = useState(null);
const [addressInput, setAddressInput] = useState('');
const [showChangeInput, setShowChangeInput] = useState(false);
```

### Auto-Load Connected User on Mount
```jsx
// Source: Results.jsx prefilled pattern (lines 268-280) + CompassContext jurisdiction
const { isLoggedIn, userJurisdiction, compassLoading } = useCompass();

useEffect(() => {
  if (compassLoading) return;
  if (!isLoggedIn || !userJurisdiction) return;

  const city = userJurisdiction.city;
  const state = userJurisdiction.state;
  if (!city && !state) return;

  const address = [city, state].filter(Boolean).join(', ');
  let cancelled = false;
  setFetchLoading(true);

  fetchElectionsByAddress(address).then(({ elections, error }) => {
    if (cancelled) return;
    setElectionsData(elections ?? []);
    setFetchError(error);
    setLocationLabel(address);
    setFetchLoading(false);
  });

  return () => { cancelled = true; };
}, [compassLoading, isLoggedIn, userJurisdiction]); // eslint-disable-line react-hooks/exhaustive-deps
```

### Address Search Handler (also used for shortcuts)
```jsx
// Source: Results.jsx handleAddressSearch pattern (lines 372-383) + fetchElectionsByAddress
const handleSearch = async (overrideAddress) => {
  const addr = (typeof overrideAddress === 'string' ? overrideAddress : addressInput).trim();
  if (!addr) return;

  let cancelled = false;
  setFetchLoading(true);
  setFetchError(null);

  const { elections, error } = await fetchElectionsByAddress(addr);
  if (cancelled) return;

  setElectionsData(elections ?? []);
  setFetchError(error);
  setLocationLabel(addr);
  setFetchLoading(false);
  setShowChangeInput(false);

  return () => { cancelled = true; };
};
```

### Route Registration in App.jsx
```jsx
// Source: App.jsx existing pattern
import Elections from "./pages/Elections";

// Inside <CompassProvider><Routes>:
<Route path="/elections" element={<Elections />} />
```

### Tier-Aware Render Decision
```jsx
// Source: CompassContext — compassLoading starts true, resolves after /account/me
const showAddressInput = !compassLoading && !(isLoggedIn && userJurisdiction);
const showAutoLoaded = !compassLoading && isLoggedIn && userJurisdiction != null;

// While compassLoading: render just the heading + neutral skeleton
// After compassLoading: show either address input or auto-loaded results
```

### fetchElectionsByAddress Error Handling Reference
```jsx
// Source: src/lib/api.jsx lines 286-299
// Returns: { elections: Election[], error: string | null }
// error values: null (success), 'geocoder_unavailable', '<status_code>', error.message
// elections is always an array (never null) on success
// ADDRESS_NOT_FOUND → elections: [], error: null (the backend normalizes this to 200)
```

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Elections embedded in Results tab | Standalone `/elections` route (this phase) | Phase 2 extracts it |
| Address input required for all users | Tier-aware: Connected users auto-load | New behavior |
| No backend `elections/me` endpoint | Still no endpoint; address string workaround | See Open Questions |

**Deprecated/outdated:**
- None — the codebase is current. The existing ElectionsView in Results is not deprecated; it remains there. The new page is additive.

## Open Questions

1. **Will `"city, state"` reliably geocode to the correct jurisdiction for elections?**
   - What we know: `fetchElectionsByAddress` calls the Census Geocoder, which can handle city+state. The backend's `elections-by-address` endpoint uses PostGIS `ST_Covers` to match geofences. A centroid geocode of "Bloomington, IN" should land inside Monroe County.
   - What's unclear: Whether Census Geocoder returns a point that reliably falls inside the PostGIS geofence for all supported counties. Not tested.
   - Recommendation: Test during implementation with a real Connected test account. If city+state geocoding is unreliable, the next best option is to add an `elections/me` endpoint on the backend that decrypts stored coordinates (same pattern as `representatives/me`). This would be a small backend change.

2. **What location string to show in "Showing elections for [location]"?**
   - What we know: The auto-load fetch uses `"city, state"` as the address. The `userJurisdiction` object also has `county_name`. The CONTEXT specifies `"Showing elections for [location]"`.
   - What's unclear: Whether `userJurisdiction.city` is always populated (it's derived from `jurisdiction_city` column which is set during `set-location`).
   - Recommendation: Use `locationLabel` (the address string passed to `fetchElectionsByAddress`) for consistency. If `city` is null, fall back to `county_name || state`.

## Sources

### Primary (HIGH confidence)
- Direct code reading: `src/components/ElectionsView.jsx` — seeded shuffle, grouping, tier ordering, election headers all confirmed present and working
- Direct code reading: `src/lib/api.jsx` — `fetchElectionsByAddress` function, return shape, error handling confirmed
- Direct code reading: `src/contexts/CompassContext.jsx` — `userJurisdiction`, `compassLoading`, `isLoggedIn` API confirmed; jurisdiction shape (`city`, `state`, `county_name`) confirmed from `account.ts`
- Direct code reading: `src/App.jsx` — routing pattern (BrowserRouter, CompassProvider wrapping all routes) confirmed
- Direct code reading: `src/components/Layout.jsx` — Layout component API confirmed
- Direct code reading: `C:/EV-Accounts/backend/src/routes/essentials.ts` — confirmed no `elections/me` endpoint exists; only `elections-by-address` and `elections?lat&lng`
- Direct code reading: `C:/EV-Accounts/backend/src/routes/account.ts` — jurisdiction response shape (`city`, `state`) confirmed from `/api/account/me`
- Direct code reading: `src/pages/Landing.jsx` — county shortcut addresses (`100 W Kirkwood Ave, Bloomington, IN 47404` and `500 W Temple St, Los Angeles, CA 90012`) confirmed

### Secondary (MEDIUM confidence)
- Direct code reading: `src/pages/CandidateProfile.jsx` — `animate-spin` spinner pattern confirmed for button-level loading indicator

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all from direct codebase inspection
- Architecture patterns: HIGH — derived from existing working code in Results.jsx and Landing.jsx
- Pitfalls: HIGH for race condition and geocoding concerns (confirmed from code); MEDIUM for geocoding reliability (requires runtime testing)
- Backend gap: HIGH — confirmed by absence of `elections/me` route in essentials.ts

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable codebase; invalidated if backend adds `elections/me` endpoint)

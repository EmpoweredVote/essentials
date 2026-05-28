---
phase: 69-landing-elections-discovery
reviewed: 2026-05-28T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/pages/Landing.jsx
  - supabase/migrations/221_ca_statewide_elections.sql
  - supabase/migrations/222_ca_us_house_races.sql
  - supabase/migrations/223_ca_discovery_jurisdictions.sql
findings:
  critical: 3
  warning: 3
  info: 2
  total: 8
status: issues_found
---

# Phase 69: Code Review Report

**Reviewed:** 2026-05-28
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files reviewed: one React page (`Landing.jsx`) and three SQL migration scripts covering CA statewide elections, US House races, and discovery jurisdiction seeding. The SQL migrations contain silent data-integrity failures that will produce orphaned or missing rows without raising errors. The React page imports a hook for Google Places autocomplete despite the project rule explicitly prohibiting Google Places autocomplete — and exposes a secondary bug where the hook fires `setLoadError(true)` on any missing API key, which on this project (no key configured) silently disables address input without user feedback. The migrations also rely on `gen_random_uuid()` rows created in the same transaction chain without ID fixation, which makes the UPDATE in migration 221 and the CTE in migration 222 depend on exact name-match correctness across runs.

---

## Critical Issues

### CR-01: Google Places Autocomplete Hook Imported Despite Project Ban

**File:** `src/pages/Landing.jsx:5`
**Issue:** `useGooglePlacesAutocomplete` is imported and wired to the address input. The project memory explicitly records "No Google Places autocomplete; address inputs are plain text submitting directly to backend" (`feedback_no_google_places.md`). When `VITE_GOOGLE_MAPS_API_KEY` is absent (the normal state on this project), the hook calls `setLoadError(true)` but `loadError` is never consumed by `Landing.jsx` — the address input renders normally, the autocomplete silently does nothing, and the hook import still pulls in `@googlemaps/js-api-loader` into the bundle. If the API key is ever accidentally set, autocomplete will activate and bypass the plain-text backend contract.

**Fix:** Remove the import and the `useGooglePlacesAutocomplete` call entirely. The address input on lines 237–253 already works correctly as a plain text field with `handleSearch` wiring — no hook is needed.

```jsx
// Remove line 5:
// import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';

// Remove lines 35–40:
// useGooglePlacesAutocomplete(addressInputRef, {
//   onPlaceSelected: (addr) => {
//     setAddressInput(addr);
//     navigate(`/results?q=${encodeURIComponent(addr)}`);
//   },
// });

// Also remove addressInputRef (line 30) if nothing else uses it,
// and replace ref={addressInputRef} on the input with nothing.
```

---

### CR-02: Migration 221 UPDATE Silently No-Ops if Election Row Was Not Inserted

**File:** `supabase/migrations/221_ca_statewide_elections.sql:22–25`
**Issue:** Task 1b inserts the `CA 2026 Statewide General` election row with `ON CONFLICT DO NOTHING`. If a conflict fires (i.e., a row with that name already exists from a prior partial run or manual seed), the INSERT is skipped. Task 2 then runs an `UPDATE ... SET election_id = (SELECT id FROM essentials.elections WHERE name = 'CA 2026 Statewide General')`. If the subquery returns zero rows (because the name doesn't match exactly — whitespace, case difference, or the row was never inserted), the subquery returns `NULL` and the UPDATE sets `election_id = NULL` on the Governor race row `bc936a36`, corrupting it silently. PostgreSQL does not error on `UPDATE ... SET col = NULL` when col is nullable.

**Fix:** Use `RETURNING id` into a CTE or variable, or assert the row exists before the UPDATE:

```sql
-- Replace Task 2 with a safer pattern:
DO $$
DECLARE v_gen_id uuid;
BEGIN
  SELECT id INTO STRICT v_gen_id
    FROM essentials.elections
   WHERE name = 'CA 2026 Statewide General';

  UPDATE essentials.races
     SET election_id = v_gen_id,
         office_id   = '08454462-a1f0-4d11-9f61-aba7a173a3de'
   WHERE id = 'bc936a36-287c-4ffd-abd8-5e4fd798bae5';
END $$;
```

`SELECT INTO STRICT` raises `NO_DATA_FOUND` if the election row is missing, surfacing the problem instead of silently nulling the Governor race.

---

### CR-03: Migration 222 CTE Silently Inserts Zero Rows if Election Name Mismatches

**File:** `supabase/migrations/222_ca_us_house_races.sql:6–9`
**Issue:** The CTE `gen_elec` selects `id FROM essentials.elections WHERE name = 'CA 2026 Statewide General'`. This is the same fragile name lookup described in CR-02. If the row is absent or the name differs even by a single character, `gen_elec` returns zero rows, the `CROSS JOIN` in the main `SELECT` produces zero rows, and the `INSERT ... ON CONFLICT DO NOTHING` inserts nothing — all 52 US House race rows are silently skipped. There is no error, no warning, and no row count check. The migration appears to succeed.

**Fix:** Add an assertion before the INSERT:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM essentials.elections WHERE name = 'CA 2026 Statewide General'
  ) THEN
    RAISE EXCEPTION 'CA 2026 Statewide General election row not found — run migration 221 first';
  END IF;
END $$;

WITH gen_elec AS ( ... )
INSERT INTO essentials.races ...
```

---

## Warnings

### WR-01: Name Search Error State Silently Collapses to 'error' for Any Non-'fresh' Status

**File:** `src/pages/Landing.jsx:112`
**Issue:** The debounce callback sets `setNameStatus(status === 'fresh' ? 'fresh' : 'error')`. The `searchPoliticiansByName` function can return `status: 'idle'` (when query is too short) and `status: 'error'` with distinct error messages. The Landing component collapses both non-fresh states into `'error'`. In practice the `idle` path cannot be reached here (the `q.length < 2` guard fires before the timeout), but the pattern is fragile — any future addition of a new status value from the API layer (e.g. `'stale'`, `'partial'`) will silently display "Search failed. Try again." to the user.

**Fix:** Map the status more explicitly:

```jsx
setNameStatus(['fresh', 'loading'].includes(status) ? status : 'error');
// or simply pass through the status directly:
setNameStatus(status);
```

---

### WR-02: `window.location.reload()` on Visibility Change Re-fires Indefinitely

**File:** `src/pages/Landing.jsx:52–57`
**Issue:** The visibility change handler calls `window.location.reload()` whenever `myLocationNotSet` is truthy and the tab becomes visible. If the user returns to the tab and their location is still not set (e.g. they dismissed the settings page without saving), the page reloads again. On the next render `myLocationNotSet` is still true, the effect re-registers, and the cycle repeats on every subsequent tab focus. This is an infinite-reload loop for users who do not complete the location flow.

**Fix:** Add a one-shot guard using a ref, or remove the listener after the first reload:

```jsx
useEffect(() => {
  if (!myLocationNotSet) return;
  let fired = false;
  const handleVisible = () => {
    if (!fired && document.visibilityState === 'visible') {
      fired = true;
      window.location.reload();
    }
  };
  document.addEventListener('visibilitychange', handleVisible);
  return () => document.removeEventListener('visibilitychange', handleVisible);
}, [myLocationNotSet]);
```

---

### WR-03: Migration 223 Source URL for CA Statewide Row Points to June Primary Page, Not General

**File:** `supabase/migrations/223_ca_discovery_jurisdictions.sql:29–30`
**Issue:** The CA Statewide discovery jurisdiction row is inserted with `election_date = '2026-11-03'` (November general) but `source_url = 'https://www.sos.ca.gov/elections/upcoming-elections/primary-election-june-2-2026'`. The URL explicitly names the June 2 primary. If the discovery cron uses `source_url` to scrape candidates for the general election, it will hit a page scoped to the wrong election cycle and either return no results or return primary-only candidates.

**Fix:** Use the SOS general election page URL:

```sql
'https://www.sos.ca.gov/elections/upcoming-elections/2026-general-election'
-- or the statewide candidates list:
'https://www.sos.ca.gov/elections/candidate-filing/cal-access'
```

---

## Info

### IN-01: Unused `addressInputRef` After Hook Removal (Anticipated)

**File:** `src/pages/Landing.jsx:30`
**Issue:** `addressInputRef` is created with `useRef(null)` and passed both to `useGooglePlacesAutocomplete` (line 35) and as `ref={addressInputRef}` on the address input (line 238). Once the hook is removed per CR-01, the ref serves no purpose (nothing reads it after the hook is gone). Leaving an unused ref is not harmful but is dead code.

**Fix:** Remove `const addressInputRef = useRef(null);` on line 30 and `ref={addressInputRef}` on line 238 after removing the hook.

---

### IN-02: `photo_origin_url` Used as Image `src` in Name-Search Results

**File:** `src/pages/Landing.jsx:306–313`
**Issue:** The name-search result list renders `pol.photo_origin_url` as the `<img src>`. The project memory records that `politician_images` has NO `photo_origin_url` column (see `project_ca_state_legislature.md`). The API endpoint `/essentials/candidates/search-by-name` would need to return this field explicitly for it to work. If the backend does not include it, the field is always `undefined`, the `pol.photo_origin_url &&` guard keeps the `<img>` from rendering, and every result shows without a photo. This is consistent behavior but confirms the field name should be verified against the actual API response shape (which may use `headshot_url` or a Supabase Storage URL instead).

**Fix:** Verify the field name returned by `GET /essentials/candidates/search-by-name` in the accounts-api and align the JSX field reference accordingly.

---

_Reviewed: 2026-05-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

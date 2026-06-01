---
phase: 79-or-landing-elections-discovery
reviewed: 2026-05-30T18:56:30Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/pages/Landing.jsx
  - supabase/migrations/237_or_2026_elections.sql
  - supabase/migrations/238_or_statewide_races.sql
  - supabase/migrations/239_or_legislative_races.sql
  - supabase/migrations/240_portland_city_races.sql
  - supabase/migrations/generate_or_legislative_races.ps1
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 79: Code Review Report

**Reviewed:** 2026-05-30T18:56:30Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Phase 79 adds Portland, Oregon to Landing.jsx, seeds two OR 2026 election rows, creates 98 legislative/statewide race rows, and creates 7 Portland city race rows. The SQL migrations are structurally sound — idempotency guards are present and correct, the district_type disambiguation is in place, and the BOM-safe PowerShell emission is correct.

Three areas require attention. The most significant is a silent data-integrity risk in migration 240 (Portland): the office_id subquery uses `ORDER BY o.id` against UUID primary keys, which is a non-deterministic sort. On re-creation or refresh of the same office rows with new UUIDs (migration rollback/replay scenario), the Seat A/B/C assignment would silently shuffle, breaking any downstream linking that depends on stable seat-to-office_id mapping. Two warnings cover the OR primary date (already past as of today) and the stale Google Places hook in Landing.jsx. Two info items cover a duplicate React `key` prop and a minor generator output-path discrepancy.

## Critical Issues

### CR-01: Portland Council `ORDER BY o.id` — Non-Deterministic UUID Sort Makes Seat Assignment Fragile

**File:** `supabase/migrations/240_portland_city_races.sql:15-37` (repeated at lines 22-37, 41-65)

**Issue:** The subqueries that pick which of the three identical council offices maps to Seat A, Seat B, or Seat C use `ORDER BY o.id LIMIT 1 OFFSET 0/1/2`. The `o.id` column is a UUID (`gen_random_uuid()`). UUID v4 sort order is random and has no semantic relationship to "first/second/third office." While this is stable for a single migration run against a fixed dataset, it is not reproducible if the office rows are ever re-inserted with new UUIDs (e.g., full DB rebuild, rollback+replay, or fixture reset). If that happens, the Seat A/B/C race rows will silently point to different offices than before, breaking any election result or candidate link established under the original assignment.

More critically: if the discovery agent or a future migration populates `race_candidates` for "District 3 Seat A" using the office_id resolved today, and the offices are ever replaced, the `races.office_id` FK would reference a different office. The `ON CONFLICT (election_id, position_name) DO NOTHING` guard would not re-run, leaving the stale office_id in place permanently.

The three offices per district are truly identical (same title, same district_id) — the research doc confirms this. But since they are identical, the migration should either (a) hardcode the three office_ids per district (verified from the live DB, same as the Auditor office_id approach used on line 71) or (b) add a stable secondary sort key such as `ORDER BY o.created_at, o.id` — though `created_at` may also vary.

**Fix:** Hardcode the three office_ids per district, exactly as was done for the City Auditor. The research doc verified all council office_ids from the live DB. Add a verification comment citing the source query.

```sql
-- District 3 office_ids (verified 2026-05-30 from live DB):
-- SELECT o.id FROM essentials.offices o
-- JOIN essentials.districts d ON d.id = o.district_id
-- WHERE d.geo_id = 'portland-or-council-district-3' ORDER BY o.id;
-- Results: <id-A>, <id-B>, <id-C>  (hardcode these)

INSERT INTO essentials.races (id, election_id, office_id, position_name, primary_party, seats)
VALUES (gen_random_uuid(), v_general_id,
  '<verified-office-id-for-d3-a>'::uuid,
  'Portland City Council District 3 Seat A', NULL, 1)
ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
```

Note: Since the migration has already been applied to production (confirmed in 79-04-SUMMARY), this issue is latent rather than immediately broken. It matters most if the migration is ever replayed.

---

## Warnings

### WR-01: OR Primary Date Is Already Past — Primary Row Is Inaccurate as Seeded

**File:** `supabase/migrations/237_or_2026_elections.sql:6-8`

**Issue:** The OR 2026 Primary row uses `election_date = '2026-05-19'`. Today's date is 2026-05-30. The primary is 11 days in the past. As seeded, the primary row has `election_date` in the past with no race rows linked to it (D-03: "primary row is bare"). This is low-risk for discovery (the cron uses `election_date > now()` so this row will never be swept), but the row is factually stale the moment it was applied. If the UI ever renders OR election rows for informational purposes, it will show a primary date that has already passed with no useful data.

More importantly: the research doc confirms the primary has already occurred (Kotek won May 19, Merkley won 93.2%). The primary row serves only as a placeholder. Since there are no race rows or candidates linked to it, this is a data quality concern rather than an application bug — but it is worth flagging because the empty primary row with a past date could confuse the discovery cron's "horizon check" logic if it is ever changed to include past elections.

**Fix:** Either (a) leave the primary row as-is and document the accepted limitation (bare placeholder, never swept by cron), or (b) remove the primary row entirely since it adds no value and the research doc explicitly states no races link to it. Option (b) is cleaner.

---

### WR-02: `useGooglePlacesAutocomplete` Hook Is Dead Code with a Known Deprecation Warning

**File:** `src/pages/Landing.jsx:5-6, 36-41`

**Issue:** The hook `useGooglePlacesAutocomplete` is imported and called (lines 5 and 36-41). Per project memory (`feedback_no_google_places.md`), this hook was flagged on 2026-04-12 as dead code that should be removed: no `VITE_GOOGLE_MAPS_API_KEY` is configured, the hook enters the `loadError=true` path immediately, and Google is retiring the legacy Places API. The address input works as plain text regardless.

This is a confirmed pre-existing issue that this phase did not introduce, but the phase modified `Landing.jsx` and did not clean it up. The hook import and call block add noise to the component and will produce a console deprecation warning in browsers where the Google Maps script does load partially.

**Fix:** Remove the import on line 5 and the `useGooglePlacesAutocomplete` call block on lines 36-41. The `addressInputRef` passed to the hook is still needed for the `<input ref={addressInputRef}>` on line 239, so retain that ref declaration. No other changes required.

```jsx
// Remove line 5:
// import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';

// Remove lines 36-41:
// useGooglePlacesAutocomplete(addressInputRef, {
//   onPlaceSelected: (addr) => {
//     setAddressInput(addr);
//     navigate(`/results?q=${encodeURIComponent(addr)}`);
//   },
// });
```

---

### WR-03: generator `WriteAllLines` Uses Relative Path — Breaks When Run from Any Directory Other Than `supabase/migrations`

**File:** `supabase/migrations/generate_or_legislative_races.ps1:67-71`

**Issue:** The `[System.IO.File]::WriteAllLines` call on line 67 uses `Join-Path $PSScriptRoot '239_or_legislative_races.sql'`. `$PSScriptRoot` resolves to the directory containing the script, which is correct when the script is invoked via `-File` flag. However, if the script is dot-sourced (`. .\generate_or_legislative_races.ps1`) or invoked via `Invoke-Expression`, `$PSScriptRoot` is empty and the output path becomes just `239_or_legislative_races.sql` relative to the current working directory — which may differ from the script directory. In that case the generated SQL lands in the wrong location and the migration file is silently misplaced.

The PATTERNS.md comment in line 206 of that document shows the prior Phase 55 generator used a plain relative filename `"239_or_legislative_races.sql"` without `$PSScriptRoot`, which is the simpler pattern and has the same risk. The current implementation is actually better than that, but the risk is not zero.

**Fix:** Add a guard comment clarifying that the script must be invoked with `-File` and not dot-sourced, or use an absolute path derived at runtime:

```powershell
# Run with: powershell -ExecutionPolicy Bypass -File generate_or_legislative_races.ps1
# Do NOT dot-source — $PSScriptRoot will be empty.
$outPath = Join-Path $PSScriptRoot '239_or_legislative_races.sql'
if (-not $PSScriptRoot) {
    Write-Error "PSScriptRoot is empty. Invoke with -File flag, not dot-source."
    exit 1
}
[System.IO.File]::WriteAllLines($outPath, $output, [System.Text.UTF8Encoding]::new($false))
```

---

## Info

### IN-01: Duplicate React `key` Prop — Both Portland Entries Share `key="Portland"`

**File:** `src/pages/Landing.jsx:195-204` (COVERAGE_AREAS map at line 197)

**Issue:** The `COVERAGE_AREAS.map()` on line 195 uses `key={area.county}` for each button. After adding Portland, Oregon, there are now two entries with `county: 'Portland'` (lines 19 and 20) — one for Maine, one for Oregon. React will log a warning about duplicate keys and may produce subtly incorrect rendering (e.g., not re-rendering one of the Portland buttons on state change because it reuses the cached element from the other).

**Fix:** Use a composite key that includes the state:

```jsx
key={`${area.county}-${area.state}`}
```

---

### IN-02: Generator `Write-Host` Line Count Reports Array Length, Not SQL Line Count

**File:** `supabase/migrations/generate_or_legislative_races.ps1:72`

**Issue:** The final `Write-Host` on line 72 prints `"Generated 239_or_legislative_races.sql with $($output.Count) lines"`. The `$output` array contains string elements including blank strings and multi-line heredoc blocks. `$output.Count` counts array elements, not lines in the output file. The actual file has 1534 lines (confirmed in 79-03-SUMMARY) but the array element count will be lower (approximately 91 header strings + 90 heredoc blocks = ~181 elements). The message is misleading as documentation.

**Fix:** Either remove the misleading count or use `(Get-Content $outPath).Count` after writing:

```powershell
Write-Host "Generated 239_or_legislative_races.sql ($((Get-Content $outPath).Count) lines)"
```

---

_Reviewed: 2026-05-30T18:56:30Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

---
phase: 193-pima-county-board-of-supervisors-deep-seed
reviewed: 2026-07-09T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts
  - C:/EV-Accounts/backend/migrations/1288_pima_county_board_of_supervisors.sql
  - C:/EV-Accounts/backend/migrations/1289_pima_county_headshots.sql
  - C:/EV-Accounts/backend/migrations/1290_pima_supervisor_1_stances.sql
  - C:/EV-Accounts/backend/migrations/1291_pima_supervisor_2_stances.sql
  - C:/EV-Accounts/backend/migrations/1292_pima_supervisor_3_stances.sql
  - C:/EV-Accounts/backend/migrations/1293_pima_supervisor_4_stances.sql
  - C:/EV-Accounts/backend/migrations/1294_pima_supervisor_5_stances.sql
  - C:/EV-Accounts/backend/scripts/_tmp-pima-supervisors-headshots.py
  - C:/Transparent Motivations/essentials/src/lib/buildingImages.js
  - C:/Transparent Motivations/essentials/src/lib/coverage.js
findings:
  critical: 0
  warning: 1
  info: 5
  total: 6
status: issues_found
---

# Phase 193: Code Review Report

**Reviewed:** 2026-07-09
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 193 seeds Pima County (AZ) Board of Supervisors: a PostGIS geofence loader, one
structural migration (government/chamber/5 districts/5 offices/5 politicians), an
audit-only headshots migration, five evidence-cited stance migrations, a gitignored
headshot pipeline, and two frontend coverage/banner additions.

Overall the work is disciplined against the phase STRIDE registers. The stated
mitigations are genuinely present and verified:

- **T-193-SQLI** — all GIS response data (geo_id, name, GeoJSON, source) is passed as
  bind params (`$1..$4`); the resolver in the Python script uses `external_id=%s`
  parameterization; no remote data is string-concatenated into SQL.
- **T-193-PROJ** — `outSR=4326` is present and asserted in the loader URL.
- **T-193-IMG** — PIL `convert('RGB')` + JPEG re-encode with `optimize=True` strips
  EXIF/embedded payloads from untrusted remote bytes.
- **T-193-KEY** — no DATABASE_URL / service-role key is hardcoded; both are read from
  the gitignored `.env`. The only literals are the public Supabase project ref and
  public CDN URLs (not secrets).
- **T-193-COLL** — every office↔district join is correctly scoped
  `district_type='LOCAL' AND mtfcc='X0019' AND state='az'`; the bare `04019` COUNTY row
  is never joined to an office. Post-verify gates (a)–(f) enforce this in-transaction.
- **T-193-CITE** — stances are evidence-only with real cited source URLs and honest
  blanks; no party inference or neutral defaults.
- **T-193-JUD** — no judicial-compass rows are emitted.

One Warning (a latent geometry-encoding defect in the loader) and five Info items
follow. No Critical issues. The migrations were already applied to production and passed
their in-transaction gates; findings below concern latent defects, robustness, and
documentation drift rather than the already-verified data.

## Warnings

### WR-01: ArcGIS rings passed directly as GeoJSON Polygon coordinates — silently wrong for multi-part / holed districts

**File:** `C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts:104-106` (and INSERT at `175-184`)
**Issue:** `arcgisRingsToGeoJson()` wraps the raw ArcGIS `rings` array as a GeoJSON
`Polygon` `coordinates` field. ArcGIS and GeoJSON rings are *not* interchangeable when a
feature has more than one ring: ArcGIS distinguishes exterior rings from holes by winding
order and can pack several disjoint exterior rings (a multipolygon) into one `rings`
array, whereas a GeoJSON `Polygon` interprets the first ring as the exterior and **every
subsequent ring as a hole of that exterior**. So a district that is discontiguous (an
island / detached parcel) would be encoded with the second body as a hole, and a district
with an actual hole could be mis-oriented — producing a geometry that stores cleanly but
mis-routes addresses.

The inline comments assume this is safe because "the 5 features are all single-ring" and
because "ST_Multi (in the INSERT) wraps multi-body cases." That reasoning is mistaken:
`ST_Multi` only promotes a geometry to a MULTI type — it does not reinterpret extra
GeoJSON polygon rings as separate polygons, so it cannot repair the misencoding. The code
also accepts `rings.length === 0 ? skip : proceed` (line 141) with **no runtime guard that
`rings.length === 1`**, so if Pima ever republishes a multi-part district the loader
silently stores corrupted geometry (guarded only by `ON CONFLICT DO NOTHING`, which will
not overwrite the current good rows but would apply to a fresh re-seed under a new geo_id).

**Fix:** Either convert ArcGIS rings to GeoJSON properly (group by ring orientation into
exterior + holes, emit a `MultiPolygon` when >1 exterior ring), or add an explicit guard
that hard-fails on multi-ring input so the mis-encoding can never happen silently:
```ts
if (rings.length !== 1) {
  console.error(`ERROR: district ${dist} has ${rings.length} rings — ArcGIS→GeoJSON single-Polygon path is only valid for a single exterior ring. Aborting (needs proper multipolygon conversion).`);
  process.exit(1);
}
```

## Info

### IN-01: SQL string-interpolates the `MTFCC` / `STATE_CODE` constants instead of binding them

**File:** `C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts:178`, `203`, `208`
**Issue:** The INSERT/UPDATE/recheck queries bind all remote GIS data (good), but splice
the module constants via template literals: `'${MTFCC}'`, `'${STATE_CODE}'`. These are
compile-time constants (`'X0019'`, `'az'`), so there is **no injection risk**, but the
mixed style is easy to misread as safe-by-convention and invites a future maintainer to
interpolate a non-constant the same way.
**Fix:** Bind them too (`$5`, `$6`) or add a short comment noting they are trusted
constants. Cosmetic — no behavior change.

### IN-02: Stale/contradictory "MISSING SOURCE DATA" docstring block in the headshot script

**File:** `C:/EV-Accounts/backend/scripts/_tmp-pima-supervisors-headshots.py:43-51` (vs `95-107`)
**Issue:** The module docstring loudly warns that only Rex Scott's asset URL was
documented and that the other four supervisors "carry the sentinel `TODO_CIVICPLUS_ASSET_URL`
… and MUST be replaced … before this script is run." But the actual `ROSTER` (lines
95-107) already has all five real per-supervisor URLs filled in, each annotated
"scraped + verified 200." The docstring now contradicts the code and would mislead an
operator into thinking the script cannot run. The `unfilled` guard in `main()` correctly
finds zero sentinels, so behavior is fine — only the docs are wrong.
**Fix:** Replace the "MISSING SOURCE DATA — MUST BE SUPPLIED" block with a note that all
five URLs were sourced/verified, keeping the sentinel-guard description for future reuse.

### IN-03: DB connection disables TLS certificate verification

**File:** `C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts:74`
**Issue:** `ssl: { rejectUnauthorized: false }` disables server-certificate validation on
the Postgres connection, permitting a MITM to impersonate the DB. This matches the
established Supabase-pooler convention used by prior loaders (and the Python analog uses
`sslmode=require`, which is stronger), so it is consistent, not novel — noted for
awareness only.
**Fix:** If the pooler CA is available, prefer `sslmode=verify-full` with the CA bundle;
otherwise leave as-is to match existing loaders.

### IN-04: `fetchJson` follows redirects with no max-hops guard and no relative-Location handling

**File:** `C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts:82-96`
**Issue:** On a 3xx the helper recurses on `res.headers.location` with no redirect-count
cap (a redirect loop would recurse until stack exhaustion) and does not resolve a
relative `Location` against the base URL (a relative redirect would be passed straight to
`lib.get` and fail). The original response body is also not drained before recursing. The
target endpoint returns 200 directly, so this is defensive-path only.
**Fix:** Add a `maxRedirects` counter, resolve `Location` with `new URL(location, url)`,
and `res.resume()` the abandoned response.

### IN-05: New "Pima County" chip inherits the county `browse_skip_overlap` routing gap

**File:** `C:/Transparent Motivations/essentials/src/lib/coverage.js:248` (see `313-329`)
**Issue:** `coverageAreaToPath()` only sets `browse_skip_overlap=1` when
`area.kind === 'county'` (line 327), but `COVERAGE_COUNTIES` entries — including the new
Pima County row — carry no `kind` field, and counties are excluded from `ALL_COVERAGE_AREAS`.
So when a county entry is routed through `coverageAreaToPath`, the overlap-skip flag is
not applied, contradicting the comment that "a county browse shows only the county
government's own officials." For a county the size of Pima this could surface every
overlapping official once Tucson-area governments are seeded. This is **pre-existing and
identical for all 17 counties** (LA, Clark, the UT set, etc.), not introduced by Phase
193 — the new chip merely inherits it. Confirm the routing that reaches county browse
tags `kind:'county'` (or sets `browse_skip_overlap`) somewhere upstream; if it does not,
the county-scoping behavior is silently not happening.
**Fix:** Tag `COVERAGE_COUNTIES` entries with `kind: 'county'` at definition, or set
`browse_skip_overlap` directly on county entries, so the flag no longer depends on a
`kind` that these objects never carry.

---

_Reviewed: 2026-07-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

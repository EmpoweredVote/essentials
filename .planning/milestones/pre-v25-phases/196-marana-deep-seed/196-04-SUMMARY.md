---
phase: 196-marana-deep-seed
plan: 04
status: complete
completed: 2026-07-16
requirements: [BANR-01, SUB-02]
commit: 453fef0a
---

# Plan 196-04 Summary — Marana banner + coverage chip + end-to-end routing

**Outcome:** Marana has its licensed community banner (BANR-01) live at `cities/marana.jpg`, wired into
`buildingImages.js` CURATED_LOCAL, and is surfaced in `coverage.js` with a DB-honest chip appended to the
EXISTING Arizona `COVERAGE_STATES` block. A real Marana address resolves end-to-end to the seeded Mayor +
6 at-large Council Members on the live search API.

## Task 1 — Banner (operator-approved)
- **Subject | author | license:** *Hole #3 at The Golf Club at Dove Mountain (Saguaro), Marana, AZ* |
  **Bernard Gagnon** | **CC BY-SA 3.0** (Wikimedia Commons, 4233×2956).
- Processed via `process_banner.py --vertical-anchor 0.45` → 1700×540 @ 3.148:1; uploaded via
  `upload_banner.py --dest cities/marana.jpg`. `curl -sI` → HTTP 200, `image/jpeg`, 1700×540.
- **D-03 distinctiveness (operator-approved):** real daylight ground-level photo, NO AI, NO aerial, and
  crucially **no Catalina-range imagery** — the horizon is the LOW distant Tortolita/Tucson ranges.
  Verified visually distinct (5-banner montage) from the Pima County Catalina/Pusch-Ridge landscape, the
  Oro Valley CDO Trail Bridge, the Tucson downtown streetscape, and the AZ-state Phoenix skyline.
- Flickr-first civic subject (Municipal Complex / Downtown Marana / Heritage River Park) was not needed:
  the confirmed Dove Mountain shot reads as Marana identity, is high-res, and is licensing-clean. The only
  Commons civic-ish alternative (`Marana_AZ.jpg`, a saguaro sunset) was 968×648 (too small) and generic.

## Task 2 — Frontend wiring (committed 453fef0a, essentials repo)
- `buildingImages.js`: single-word unquoted `marana: { state: 'AZ', src: '…/cities/marana.jpg' }` with a
  subject|author|license attribution comment. `getBuildingImages()` unchanged.
- `coverage.js`: appended `{ label: 'Marana', browseGovernmentList: ['0444270'], browseStateAbbrev: 'AZ',
  hasContext: true }` to the EXISTING Arizona block (now Tucson + Oro Valley + Marana). Exactly ONE
  `name: 'Arizona'` block (Pitfall 8 avoided); COVERAGE_COUNTIES (Pima) untouched. `hasContext: true` is
  honest — Plan 03 seeded 21 stance rows.
- Gates green: all greps pass, both files parse via `node import()`, `buildingImages.test.js` 11/11 green.

## Task 3 — End-to-end resident-facing routing (BLOCKING gate, PASSED)
- POST `11555 W Civic Center Dr, Marana, AZ 85653` → `/api/essentials/candidates/search` on
  accounts-api.empowered.vote. HTTP 200, `x-data-status: fresh`, geocoded to the Marana complex.
- Response returned exactly the 7 seeded officials under `Town Council` / `Marana Town Council`:
  - Jon Post → `office_title: Mayor` (district `Town of Marana (Mayor)`, LOCAL_EXEC)
  - Roxanne Ziegler → `Council Member (Vice Mayor)` (LOCAL)
  - Kai, Comerford, Cavanaugh, Officer, Murphy → `Council Member` (LOCAL)
- No wrong-jurisdiction or duplicate Marana office. The at-large geofence→district→office routing from
  migration 1345 is confirmed live end-to-end (no code change needed — existing G4110→(LOCAL,LOCAL_EXEC)
  map covered it).

## Deviations
None material. Banner sourced from Wikimedia Commons (not Flickr) — the confirmed CC BY-SA 3.0 Dove
Mountain shot satisfied all criteria on the first candidate. Frontend committed to `essentials` but not
yet deployed to Render (deploy on push, at operator's discretion); the routing check is backend-only and
already live.

## Live browse link
https://essentials.empowered.vote/results?browse_geo_id=0444270

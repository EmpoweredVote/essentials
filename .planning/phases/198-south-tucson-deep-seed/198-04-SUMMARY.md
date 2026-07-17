# Phase 198 · Plan 04 — Summary

**Plan:** 198-04 — City of South Tucson community banner (BANR-01) + coverage chip
**Requirements:** BANR-01, SUB-04
**Status:** ✅ Complete — banner live + frontend committed 2026-07-17 (both human-verify gates approved)
**Autonomous:** false (2 blocking human-verify gates)

## What was built

1. **Community banner (BANR-01)** — the **South Tucson Municipal Complex / City Hall** (arched
   "Administration" building + blue "SOUTH TUCSON MUNICIPAL COMPLEX 1601" monument sign with the city
   seal). Processed to the banner spec (**1700×540 @ 3.15:1**, `--vertical-anchor 0.45`) and uploaded to
   Storage at **`cities/south-tucson.jpg`** — live at HTTP 200.
   - Source: `Southtucson1.JPG` | **Rgper22008** (Wikimedia Commons) | **Public Domain**.
   - **Operator-selected** over a Star Motel roadside-signage alternative (the plan's #2 option, which I
     sourced/processed/uploaded first) — operator chose City Hall for **unambiguous civic identity**.
   - The milestone's **one non-landscape banner** (D-04): civic/urban, NOT landscape. Deliberately
     distinct from the Pima Catalinas, Oro Valley CDO bridge, Marana Dove Mountain, Tucson downtown,
     Sahuarita Lake, and the AZ-state Phoenix skyline. No mural photo exists on Commons (front-runner gap).

2. **Frontend wiring (`essentials` repo, commit 0b3bde08):**
   - `src/lib/buildingImages.js` — new **quoted** `'south tucson': { state: 'AZ', src: <cities/south-tucson.jpg> }`
     entry in CURATED_LOCAL, with a subject|author|license attribution comment + distinctiveness note.
   - `src/lib/coverage.js` — appended `{ label: 'South Tucson', browseGovernmentList: ['0468850'],
     browseStateAbbrev: 'AZ', hasContext: true }` to the **EXISTING** Arizona COVERAGE_STATES block (after
     Sahuarita). Exactly **one** `name: 'Arizona'` block; COVERAGE_COUNTIES (Pima) untouched (Pitfall 7).
   - `hasContext:true` is honest — Plan 03 seeded 14 stance rows.

## Banner subject | author | license (for the record)

`South Tucson City Hall / Municipal Complex (Southtucson1.JPG) | Rgper22008 (Wikimedia Commons) | Public Domain`

## Task 1 (banner) — human-verify gate: APPROVED

- `curl -sI cities/south-tucson.jpg` → HTTP 200; PIL dims = **1700×540** (3.15:1) ✓.
- Operator approved the **City Hall** image (re-sourced from the initial Star Motel candidate).

## Task 2 (wiring) — automated verification: PASSED

- Quoted `'south tucson':` key ✓; `cities/south-tucson.jpg` src ✓; `'South Tucson'` + `'0468850'` in coverage.js ✓.
- Exactly **1** `name: 'Arizona'` block ✓; COVERAGE_COUNTIES unmodified ✓.
- Both modules parse via `node import()` ✓; `npx vitest run src/lib/buildingImages.test.js` = **11/11 green** ✓.
- Both files committed to `essentials` (0b3bde08). **Not yet deployed** (Render deploy on push, as needed).

## Task 3 (end-to-end routing) — human-verify gate: CONFIRMED

POSTed **1601 S 6th Ave, Tucson AZ 85713** (South Tucson City Hall, inside geofence 0468850) to the live
candidates-search API (`accounts-api.empowered.vote/api/essentials/candidates/search`):

- Returned **all 7** at-large Council Members — Valenzuela (Mayor), Brown-Dominguez (Vice Mayor), Robles
  (Acting Mayor), Jimenez, Diaz, Flagg, Aguirre — party **blank** (antipartisan) ✓.
- **0 Tucson-city double-matches** — the enclave donut-hole routes the address to South Tucson
  **exclusively**, not Tucson ✓. (Broader jurisdictions correctly present: federal, AZ state, Pima County
  Supervisor District 2.)
- No phantom LOCAL_EXEC office; no wrong-jurisdiction/duplicate office.
- Operator confirmed the resident-facing goal is met end-to-end.

## Milestone note

This **CLOSES the Tucson-metro local-deep-seed track (Phases 193–198)**. AZ elections (Phase 199) is next.

## Self-Check: PASSED

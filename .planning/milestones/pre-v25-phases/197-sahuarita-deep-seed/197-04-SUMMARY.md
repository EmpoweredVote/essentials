# Plan 197-04 Summary — Sahuarita Banner + Coverage Chip + E2E Verify

**Status:** ✅ Complete — banner live + frontend wired 2026-07-16
**Requirements:** BANR-01, SUB-03 · ROADMAP success criteria #4 (licensed banner) + #5 (DB-honest chip)
**Commit:** `729c935f` (essentials repo — buildingImages.js + coverage.js)

## Banner (Task 1 — approved at the blocking visual-QA gate)

- **Subject:** View from the northern edge of **Sahuarita Lake** (Rancho Sahuarita community lake), winter 2007, with the **Santa Rita Mountains** (Mount Wrightson, due south) on the horizon and lakeshore homes/trees on the left.
- **Author | License:** Brian Basgen (Wikimedia Commons user *Musides*) | **CC BY-SA 3.0**
- **Source:** `https://upload.wikimedia.org/wikipedia/commons/b/b1/Bbasgen-sahuarita-lake.JPG` (original 3008×1645)
- **Processing:** `process_banner.py --vertical-anchor 0.4` → **1700×540 @ 3.15:1**, uploaded via `upload_banner.py --dest cities/sahuarita.jpg`.
- **CDN:** `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/sahuarita.jpg` — **HTTP 200**, `image/jpeg`, `no-cache`, 256547 bytes.
- **Distinctiveness (D-03):** real ground-level photo, no AI, no aerial. The peaks are the **Santa Ritas (SOUTH)**, deliberately NOT the Catalinas — so no collision with the Pima County Catalina banner or the Oro Valley CDO Trail Bridge; also distinct from the Marana Tortolita/Dove-Mountain shot, the Tucson downtown streetscape, and the AZ-state Phoenix skyline. Southern/Santa-Cruz-Valley identity.
- **Sourcing note:** the D-03 front-runner (pecan orchards, FICO/Green Valley Pecan) had no fresh higher-resolution CC-licensed photo available (only the known low-res Commons portrait), so the pre-vetted Sahuarita Lake ready fallback was used and operator-approved.

## Frontend wiring (Task 2)

- `src/lib/buildingImages.js` — added single-word unquoted `sahuarita: { state: 'AZ', src: <CDN URL> }` to `CURATED_LOCAL` (mirrors the `marana:`/`tucson:` style), with an attribution comment (subject | author | license) noting distinctiveness from the 5 sibling AZ banners. `getBuildingImages()` unchanged.
- `src/lib/coverage.js` — appended `{ label: 'Sahuarita', browseGovernmentList: ['0462140'], browseStateAbbrev: 'AZ', hasContext: true }` to the **EXISTING** Arizona `COVERAGE_STATES` block (now 4 areas: Tucson, Oro Valley, Marana, Sahuarita). `hasContext:true` is DB-honest — Plan 03 seeded 14 stance rows. **Exactly one** `name: 'Arizona'` block; `COVERAGE_COUNTIES` (Pima) untouched.
- Verify: greps pass, both files parse via `node import()`, `buildingImages.test.js` green (11/11).

## End-to-end resident-facing outcome (Task 3 — approved at the blocking gate)

- **Address:** `375 W Sahuarita Center Way, Sahuarita, AZ 85629` → POST `/api/essentials/candidates/search` on `api.empowered.vote` (correct path; the memory `project_search_api_contract` `/candidates/search` is 404 — actual is `/api/essentials/candidates/search`). Resolved to `375 W SAHUARITA CENTER, SAHUARITA, AZ, 85629`, `x-data-status: fresh`, HTTP 200.
- **Result:** all **7** at-large council members returned, all on the one **Town of Sahuarita, Arizona, US** government:
  Mayor Tom Murphy (-4014001), Vice Mayor Kara Egbert (-4014002), and Council Members Morales/Gillespie/Priolo/Lisk/Lytle (-4014003…-4014007).
- No phantom LOCAL_EXEC Mayor, no duplicate/wrong-jurisdiction office, no section split. Section-split check passes.

## Live browse link

`https://essentials.empowered.vote/results?browse_geo_id=0462140`

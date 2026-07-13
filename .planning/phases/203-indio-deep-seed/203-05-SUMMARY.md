---
phase: 203-indio-deep-seed
plan: 05
status: complete
completed: 2026-07-13
requirements: [BANR-01, CV-03]
---

# 203-05 Summary — Indio Community Banner + Coverage Chip

## Outcome
Indio carries a licensed, real community banner and surfaces in browse with a DB-honest chip that
resolves the new banner. Build + coverage generator green.

## Banner (operator-selected: option B of 3)
- **Subject:** "Welcome to Indio" — the palm-lined city boulevard with the script "Indio" sign and civic
  medallions, desert mountains behind (a real, ground-level entering-the-city streetscape).
- **Source:** Wikimedia Commons, "Welcome to Indio, California" by **Northwalker**.
- **License:** **CC0** (public domain) — the cleanest of the three candidates reviewed.
- **Constraints met:** real photo ✓ · no AI ✓ · no aerial/satellite ✓ · NOT the reused CV/Mission Inn
  banner (D-01) ✓ · reads as Indio ✓.
- **Processing:** `scripts/banners/process_banner.py --vertical-anchor 0.0` (crop 2894×1807 → 2894×919 →
  1700×540, no distortion), then `scripts/banners/upload_banner.py --dest cities/indio.jpg`. Anchor
  reframed 0.30 → 0.16 → **0.0** across two review rounds. KEY REASON: `SectionBanner.jsx` renders the
  1700×540 image in a short full-bleed strip (`h-[120px] md:h-[180px]`, `objectFit:cover`, default
  center object-position), so the live banner shows only the **vertical-center ~30–44%** of the image on
  desktop. The focal subject (the "Indio" script sign) must therefore sit at the image's VERTICAL CENTER,
  not the top — earlier anchors left it in the upper third, so the live center-crop clipped it to its
  bottom half. Anchor 0.0 places the sign (high in the source) as close to center as possible (~0.46);
  simulated center-44% and center-30% crops both show the full word. Storage no-cache overwrite = instant
  refresh (no redeploy needed).
- **Storage:** `politician_photos/cities/indio.jpg` — `curl -sI` → **HTTP 200**, image/jpeg, 162 KB
  (no-cache overwrite; instant refresh).
- Two other candidates were reviewed and declined by the operator: A = Old Town Miles/Oasis street signs
  (CC BY-SA 4.0), C = Shields Date Garden landmark (CC BY-SA 3.0). All three surfaced in a review artifact.

## Frontend wiring (essentials repo, committed 00bed939)
- `src/lib/buildingImages.js` — NEW `'indio'` CURATED_LOCAL key → `cities/indio.jpg`, inserted after
  `'palm springs'` with a credit comment. (Indio had no prior key — genuine new work, unlike Ph202's no-op.)
- `src/lib/coverage.js` — NEW `{ label: 'Indio', browseGovernmentList: ['0636448'], browseStateAbbrev:
  'CA', hasContext: true }` chip, alphabetically between Hawthorne and Inglewood. `hasContext: true` is
  DB-honest (Plan 04 landed 18 stance rows). NOT added to COVERAGE_COUNTIES.
- `node scripts/gen-coverage.mjs` → 140 cities (Indio included); `npm run build` → ✓ built in 9.53s.

## Self-Check: PASSED
- [x] Licensed real non-AI/non-aerial Indio banner at cities/indio.jpg (HTTP 200)
- [x] NEW 'indio' buildingImages key; DB-honest Indio coverage chip (0636448, hasContext:true)
- [x] Indio NOT in COVERAGE_COUNTIES; no other coverage entry modified
- [x] gen-coverage + build green; subject/credit/license recorded

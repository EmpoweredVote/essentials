---
phase: 203-indio-deep-seed
plan: 06
status: complete
completed: 2026-07-13
requirements: [CV-03, BANR-01]
---

# 203-06 Summary — Phase 203 Final Verification Record

## Outcome
Full production audit is all-green; per-district routing proven; operator signed off on the live roster.
CV-03 + BANR-01 verified TRUE end-to-end (banner display pending frontend deploy — see note).

## Task 1 — Production audit (ORCHESTRATOR-RUN, all green)
Combined boolean audit SELECT → **`t`**. Detail:
- (a) 5 geofences `mtfcc='X0023'` `state='ca'`, geo_id `indio-ca-council-district-1..5`, all `ST_IsValid`.
- (b) exactly 1 government `City of Indio, California, US` (geo_id `0636448`, type City).
- (c) 5 offices under City Council, each X0023 LOCAL district holds exactly 1 office; no LOCAL_EXEC row.
- (d) exactly 1 `Mayor` (Holmes, -4012003) + 1 `Mayor Pro Tem` (Fermon, -4012002) + 3 `Councilmember`; appointed=0.
- (e) 5/5 `politician_images` (type='default'); all 5 headshot CDN URLs + banner → **HTTP 200**; sampled Holmes headshot = **600×750**.
- (f) stances: **0 uncited**, **0 judicial**, all values in [1.0,5.0] (18 rows; honest blanks expected).
- (g) **section-split = 0** offices under any non-Indio government; G4110 `0636448` city row carries no council office.
- (h) coverage.js `Indio` chip (hasContext:true, 0636448) + buildingImages.js NEW `indio` → `cities/indio.jpg`; banner `curl -sI` → 200.

### Per-district routing proof (point-in-polygon, centroid → containing X0023 → member)
| District | Routes to | Title |
|----------|-----------|-------|
| indio-ca-council-district-1 | Glenn Miller | Councilmember |
| indio-ca-council-district-2 | Waymond Fermon | **Mayor Pro Tem** |
| indio-ca-council-district-3 | Elaine Holmes | **Mayor** |
| indio-ca-council-district-4 | Oscar Ortiz | Councilmember |
| indio-ca-council-district-5 | Benjamin Guitron IV | Councilmember |

Each district resolves to exactly one correct member.

## Task 2 — Operator sign-off (live browse)
- **Live browse link:** `https://essentials.empowered.vote/results?browse_government_list=0636448&browse_label=Indio&browse_state=CA`
  (NOTE: city chips browse via `browse_government_list`, not `browse_geo_id` — the initial link used the wrong param.)
- **Operator APPROVED** the roster: 5 members render with correct headshots + evidence-only compass;
  Holmes shown as Mayor (D3), Fermon as Mayor Pro Tem (D2); no party displayed (antipartisan).

## Known follow-up (not a defect) — banner display pending deploy
The Indio banner image is live in Storage (`cities/indio.jpg`, HTTP 200) and the `'indio'` buildingImages
key + coverage chip are committed and build-green on branch `feat/federal-lens`. They are **not yet
deployed to `main`→Render**, so the currently-live site shows a fallback banner. **The Indio banner (and
the browse-grid chip) will render once the frontend is deployed.** No data-side action remains.

## Self-Check: PASSED
- [x] Full production audit all-green (geofences, gov/roster/titles, headshots, stances, section-split=0, coverage, banner CDN 200)
- [x] 5 per-district routes each resolve to exactly 1 correct member
- [x] Operator sign-off on live roster recorded; browse link provided
- [x] Banner display noted as deploy-pending (asset + wiring ready)

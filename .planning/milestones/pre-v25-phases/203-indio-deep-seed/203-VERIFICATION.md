---
phase: 203-indio-deep-seed
status: passed
verified: 2026-07-13
requirements: [CV-03, BANR-01]
plans_verified: 6
---

# Phase 203 — Indio Deep-Seed — VERIFICATION

**Status: PASSED** (goal-backward; operator-signed-off live roster).

## Goal
Indio deep-seeded — 5-member by-district City Council with a rotational mayor — so any Indio address
routes to the correct district councilmember and the city surfaces with an evidence-only compass.

## Success criteria (ROADMAP) — all met
1. **`City of Indio` government (geo_id 0636448) + City Council chamber** — seeded (migration 1338); audit (b)/(c) green.
2. **5 council-district X-geofences (X0023) + per-district routing** — 5 valid geofences from the adopted
   NDC "Map 108" FeatureServer (gis.indio.org was NXDOMAIN — deviation recorded in 203-01); PIP routing
   proof: each district resolves to exactly one correct member.
3. **5 councilmembers with rotational Mayor/MPT as seat titles + 600×750 headshots** — Miller(D1),
   Fermon(D2, Mayor Pro Tem), Holmes(D3, Mayor), Ortiz(D4), Guitron IV(D5); Gate (f) identity asserts
   green; 5/5 headshots HTTP 200, operator-approved (rev 2 crops), sourced from indio.org StaffDirectory.
4. **Evidence-only compass stances** — 18 cited stances (mig 1340–1344), one member at a time; 0 uncited,
   0 judicial, honest blanks; audit (f) green.
5. **Licensed community banner + DB-honest coverage chip** — "Welcome to Indio" (CC0), `cities/indio.jpg`
   HTTP 200; `'indio'` buildingImages key + Indio coverage chip (0636448, hasContext:true) committed, build green.

## Requirements
- **CV-03** — Indio deep-seed: satisfied (criteria 1–4 + surfacing).
- **BANR-01** — licensed community banner: satisfied (asset live + wired).

## Deviations (recorded in plan summaries)
- **203-01:** `gis.indio.org` (CONTEXT D-07) is a non-existent domain; adopted source = NDC-hosted
  "Indio Approved Map 108" (`services8.arcgis.com/.../Indio_Plan_108`), the officially adopted 2022 map.
- **203-03:** CivicWeb portal (D-10) only had 165×215 thumbnails; used the D-11 fallback (indio.org
  CivicPlus StaffDirectory full-res, fetched via Playwright past the WAF); `us_government_work` license.
- **203-05:** operator selected banner option B ("Welcome to Indio", CC0) from 3 reviewed candidates.

## Known follow-up (not blocking; not a defect)
Banner + coverage-grid chip render **after** the frontend (`buildingImages.js`, `coverage.js` on
`feat/federal-lens`) deploys to `main`→Render. The banner asset and wiring are both in place; DB content
is fully live.

## Evidence
Full audit block + per-district routing proof + operator sign-off recorded in `203-06-SUMMARY.md`.
Backend commits in `C:/EV-Accounts` (b99c6577, 92854c51, 5aff626c, af1ae919); frontend in this repo
(00bed939).

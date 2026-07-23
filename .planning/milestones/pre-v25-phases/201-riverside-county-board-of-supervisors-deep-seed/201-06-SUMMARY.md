---
phase: 201-riverside-county-board-of-supervisors-deep-seed
plan: 06
subsystem: verification
tags: [verification, audit, live-uat, riverside-county, board-of-supervisors]

# Dependency graph
requires:
  - phase: 201-01
    provides: "5 X0021 supervisor-district geofences"
  - phase: 201-02
    provides: "standalone county govt + Board chamber + 5 offices"
  - phase: 201-03
    provides: "5/5 headshots"
  - phase: 201-04
    provides: "25 evidence-only stances"
  - phase: 201-05
    provides: "Mission Inn banner + coverage chip"
provides:
  - "Phase verification record: full production audit (all-green) + operator live-browse sign-off"
affects: []

key-files:
  created: []
  modified: []

requirements-worked: [CV-01, BANR-01]

# Metrics
duration: 90min
completed: 2026-07-12
---

# Plan 201-06 Summary: Riverside County Deep-Seed — Phase Verification

## Task 1 — Full production audit (ORCHESTRATOR-RUN): ALL-GREEN

Combined boolean SELECT = **`t`**. Individual checks (live `psql`/`curl`):

| # | Check | Result |
|---|-------|--------|
| a | 5 × X0021 supervisor-district geofences, `state='ca'`, geo_ids `riverside-ca-supervisor-district-1..5`, all `ST_IsValid` | ✅ |
| b | 1 standalone `Riverside County, California, US` govt (geo_id `06065`, type County), not parented to State of CA | ✅ |
| c | 5 offices under Board of Supervisors, exactly 1 per X0021 LOCAL district; board-only (no constitutional officer) | ✅ |
| d | Appointed among the 5 = 0 (all elected) | ✅ |
| e | 5/5 `politician_images` rows; all 5 CDN URLs HTTP 200; sample = 600×750 | ✅ |
| f | 25 stances, values 2.0–4.0, **0 judicial-***, **0 uncited** (every answer has a context row with non-empty sources) | ✅ |
| g | Section-split = 0 (no office reachable from the 5 X0021 districts under a non-Riverside govt) | ✅ |
| h | Exactly 1 `(Chair)` annotation → D2 Karen Spiegel | ✅ |
| i | coverage.js chip `hasContext:true` + buildingImages.js `'riverside county'` entry + banner `cities/riverside-county.jpg` HTTP 200 (1700×540) | ✅ |

Roster in production: **D1 Medina · D2 Spiegel (Chair) · D3 Washington · D4 Perez · D5 Gutierrez.**
Per-supervisor stance counts: 4 / 5 / 6 / 6 / 4 (honest blanks, no defaults).

## Task 2 — Live-browse verification (blocking human-verify): APPROVED

Operator confirmed on essentials.empowered.vote (2026-07-12): per-district address routing returns
the correct single supervisor, correct-person headshots, populated evidence-only compasses, the D2
"(Chair)" annotation, no constitutional-officer profiles (board-only), and the Mission Inn banner
rendering via the coverage chip. **Sign-off: "Approved on the riverside county folks."**

## UAT-surfaced fixes (applied + pushed during sign-off)

1. **Inglewood banner bug (pre-existing, all CA addresses).** Alex Padilla's U.S. Senate office
   carried a stray `representing_city='Inglewood'` (bled from his old Inglewood City Council record).
   Because it sits on the statewide `06` geofence, it hijacked the local city banner for every CA
   address whose real local officials had none (a Riverside County / Corona address rendered under an
   Inglewood banner). Nulled the field (EV-Accounts mig `1321`), and **hardened** `Results.jsx` so
   `NATIONAL_*`/`STATE_*` offices can never set the local city banner (essentials).
2. **Medina headshot re-crop.** The 201-03 rivcodistrict1.org source was a circular-cutout PNG that
   framed his face too small with white margins. Re-sourced from the PD 2025 county portrait
   (Wikimedia Commons), re-cropped head-and-shoulders 600×750; license `us_government_work` →
   `public_domain` (EV-Accounts mig `1322`).
3. **Frontend deployed.** All essentials commits pushed to `origin/main` (Render deploy) — the
   Riverside County coverage chip + banner wiring + the representingCity hardening are live.

## Result

All 5 ROADMAP success criteria are TRUE end-to-end in production and operator-confirmed live.
**CV-01** (Riverside County deep-seed) and **BANR-01** (licensed community banner) satisfied.

## Self-Check: PASSED

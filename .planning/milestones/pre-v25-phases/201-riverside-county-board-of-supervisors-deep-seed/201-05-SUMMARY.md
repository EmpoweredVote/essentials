---
phase: 201-riverside-county-board-of-supervisors-deep-seed
plan: 05
subsystem: frontend-coverage
tags: [banner, coverage, buildingImages, riverside-county, BANR-01, essentials-repo]

# Dependency graph
requires:
  - phase: 201-04
    provides: ">=1 stance row per supervisor -> honest hasContext:true chip"
provides:
  - "Licensed Riverside County community banner (Mission Inn facade) at Storage cities/riverside-county.jpg (1700x540)"
  - "buildingImages.js CURATED_LOCAL 'riverside county' entry (2nd county-tier key) -> banner CDN URL"
  - "coverage.js COVERAGE_COUNTIES 'Riverside County' chip (browse 06065, hasContext:true)"
affects: [201-06-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Banner sourcing ORCHESTRATOR-RUN (executor has no network/Storage). Sourced licensed Wikimedia Commons candidates one at a time, processed 4 to the 1700x540 spec via scripts/banners/process_banner.py, uploaded to temp cities/_preview-riverside-{A..D}.jpg, presented for operator visual selection, then promoted the chosen file to cities/riverside-county.jpg and deleted the 4 previews."
    - "getBuildingImages() needs NO code change for a county label — its substring match + state-scoping already resolve the space-form quoted key 'riverside county'. coverage.js browse_label 'Riverside County' -> representingCity -> substring match."

key-files:
  created: []
  modified:
    - src/lib/buildingImages.js
    - src/lib/coverage.js

key-decisions:
  - "Operator selected candidate D: the daytime Mission Inn facade with pink bougainvillea (bright, colorful, legible year-round, works in light+dark mode) over B (street-lamp street view), A (Festival-of-Lights night courtyard — seasonal/interior), and C (foliage-obscured). D-03 subject = downtown Riverside / Mission Inn civic scene; kept distinct from the future Palm Springs (202) + Indio (203) city banners."
  - "hasContext:true is DB-honest — Plan 04 seeded >=1 stance row for all 5 supervisors."
  - "Banner destination is cities/ tier (keyed by banner TYPE, not government type) — same as Pima's cities/pima-county.jpg."

# Banner attribution
banner:
  title: "Mission Inn Hotel in Riverside, California"
  author: "Maliagould"
  license: "CC BY-SA 4.0"
  source: "https://commons.wikimedia.org/wiki/File:Mission_Inn_Hotel_in_Riverside,_California.jpg"
  cdn: "https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/riverside-county.jpg"
  dimensions: "1700x540"

requirements-worked: [BANR-01, CV-01]

# Metrics
duration: 25min
completed: 2026-07-12
---

# Plan 201-05 Summary: Riverside County Banner + Coverage Chip

## What was built

Riverside County's licensed community banner (BANR-01) and its DB-honest coverage chip.

- **Banner:** a real, licensed, non-aerial photo of the historic **Mission Inn** facade in
  downtown Riverside (the county-seat civic landmark) — "Mission Inn Hotel in Riverside,
  California" by Maliagould, CC BY-SA 4.0 — processed to the 1700×540 banner spec and uploaded to
  Storage at `cities/riverside-county.jpg` (HTTP 200, verified 1700×540). Operator visually approved
  it from a set of 4 processed candidates.
- **buildingImages.js:** appended the `'riverside county'` CURATED_LOCAL entry (`state: 'CA'`,
  src = the banner CDN URL) with a title | author | license attribution comment — the second
  county-tier key, after Pima County. `getBuildingImages()` unchanged.
- **coverage.js:** appended `{ label: 'Riverside County', browseGovernmentList: ['06065'], browseStateAbbrev: 'CA', hasContext: true }` to COVERAGE_COUNTIES. `parseCityFromAddress` unchanged.

## Verification

- `curl -sI cities/riverside-county.jpg` → HTTP 200; PIL dims = 1700×540.
- grep gate PASS (riverside county + cities/riverside-county.jpg in buildingImages.js; Riverside County + '06065' in coverage.js).
- Both files parse via `node --input-type=module -e "import(...)"` (coverage-ok, bi-ok).
- 4 temp preview objects (`cities/_preview-riverside-{A,B,C,D}.jpg`) deleted from Storage.

## Notes

Browsing renders the banner via the COVERAGE_COUNTIES chip (browse_label 'Riverside County' →
representingCity); an arbitrary Riverside-County street address parses to its city (e.g. Riverside,
Indio), NOT "Riverside County" — expected behavior identical to Pima/Clark/Washington County, not a
defect. No pre-existing 'riverside' key collision in either file.

## Self-Check: PASSED

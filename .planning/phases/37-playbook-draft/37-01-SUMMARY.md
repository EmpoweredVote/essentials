---
plan: 37-01
phase: 37-playbook-draft
status: complete
completed: 2026-05-16
subsystem: documentation
tags: [playbook, onboarding, cambridge, templates, cold-start]

dependency-graph:
  requires: []
  provides:
    - LOCATION-ONBOARDING.md cold-start checklist (8 steps, Cambridge annotations)
    - Five phase templates in .planning/templates/
  affects:
    - Phase 38 (MA Geofences) — Step 3 + db-foundation template
    - Phase 39+ (Cambridge DB phases) — Steps 5-6 + db-foundation/officials-seed templates
    - All future city onboarding phases

tech-stack:
  added: []
  patterns:
    - Playbook-driven city onboarding (Steps 1-8 pre-execution checklist)
    - Template-per-phase-type reusable documentation pattern

key-files:
  created:
    - LOCATION-ONBOARDING.md
    - .planning/templates/db-foundation.md
    - .planning/templates/officials-seed.md
    - .planning/templates/headshots.md
    - .planning/templates/discovery-setup.md
    - .planning/templates/compass-stances.md
  modified: []

decisions:
  - LOCATION-ONBOARDING.md is the single source of truth for all v5.0 city onboarding phases
  - Templates cross-reference LOCATION-ONBOARDING.md step numbers for traceability
  - Cambridge annotations are examples, not defaults — explicitly framed to prevent Cambridge-specific bias in future cities

metrics:
  duration: 15m
  completed: 2026-05-16
---

# Phase 37 Plan 01: Playbook Draft Summary

LOCATION-ONBOARDING.md master cold-start checklist (8 steps, Cambridge annotations) plus five reusable phase templates in .planning/templates/.

## What Was Built

**LOCATION-ONBOARDING.md** — master cold-start checklist for onboarding any US city (286 lines, 8 steps, Cambridge example annotations throughout, pitfall table, template links)

**Five phase templates in .planning/templates/:**
- `db-foundation.md` — government row + chambers + offices migration template with pre-migration checklist and verification queries
- `officials-seed.md` — incumbent seeding with dual-office pattern (Cambridge Mayor-as-Councillor example)
- `headshots.md` — 600x750 Lanczos crop+resize spec with source priority and no-banners rule
- `discovery-setup.md` — inactive-by-default discovery configuration with activation protocol
- `compass-stances.md` — one-at-a-time rate limit rule + citation requirement + apply script pattern

## Deliverables

- `LOCATION-ONBOARDING.md` at project root — Steps 1–8, Cambridge examples inline, pitfall table, template links
- `.planning/templates/db-foundation.md` — government row + chambers + offices migration template
- `.planning/templates/officials-seed.md` — incumbent seeding with dual-office pattern
- `.planning/templates/headshots.md` — 600x750 Lanczos crop+resize spec
- `.planning/templates/discovery-setup.md` — inactive-by-default discovery configuration
- `.planning/templates/compass-stances.md` — one-at-a-time rate limit rule + citation requirement

## Key Decisions

- LOCATION-ONBOARDING.md is the single source of truth for all v5.0 city onboarding phases
- Templates cross-reference LOCATION-ONBOARDING.md step numbers for traceability
- Cambridge annotations are examples, not defaults — explicitly framed to prevent Cambridge-specific bias in future cities
- All v5.0 Cambridge execution phases (38–46) are built against this playbook in real time

## Deviations from Plan

None — plan executed exactly as written.

## Issues

None.

## Next Phase Readiness

Phase 38 (MA Geofences) is ready to start. Prerequisites satisfied:
- Step 3 of LOCATION-ONBOARDING.md documents the Cambridge geofence research (geo_id 2511000, TIGER allowlist addition for MA, district counts)
- db-foundation.md template ready for Phase 39 use

---

Project state key: Phase 37-01 complete; PLAY-01 and PLAY-02 satisfied; Phase 38 (MA Geofences) is next

---
phase: 121-fall-river-medford-waltham-deep-seeds
plan: "05"
subsystem: headshots
tags: [python, sql, migration, fall-river, medford, waltham, massachusetts, headshots, ma-tier3]

requires:
  - phase: 121-01
    provides: Fall River external_ids -2523000001..-2523000010 (migration 590)
  - phase: 121-02
    provides: Medford city external_ids -2540115001..-2540115008 (migration 591)
  - phase: 121-03
    provides: Waltham external_ids -2572600001..-2572600016 (migration 592)
  - phase: 121-04
    provides: Medford SC external_ids -2506600001..-2506600006 (migration 593)

provides:
  - "3 Python upload scripts: Fall River / Medford / Waltham (all gap-documented)"
  - "Migration 594: Fall River headshots — 0 uploaded, 10 gaps; type=default verified"
  - "Migration 595: Medford headshots — 1 uploaded (Mayor Lungo-Koehn), 13 gaps; type=default verified"
  - "Migration 596: Waltham headshots — 0 uploaded, 16 gaps; type=default verified"
  - "All gaps documented with specific HTTP error codes or block reasons"
  - "FALLRIV-02, MEDFORD-02, WALTHAM-02 satisfied"
  - "Phase 121 complete: FALLRIV-01/02, MEDFORD-01/02, WALTHAM-01/02 all closed"

affects: [122-ma-tier3-stances-wave1, 124-ma-tier3-stances-wave3]

tech-stack:
  added: []
  patterns:
    - "Revize CMS detection: fallriverma.org group-photo-only council page (HTTP 200 but no individual headshot images); treat as gap immediately"
    - "Cloudflare JS challenge detection: city.waltham.ma.us returns HTML JS challenge to curl/requests (HTTP 200 but body='Just a moment...'); treat as gap immediately"
    - "finalsite.net CDN: accessible with browser UA for Medford mayor page; f_auto,q_auto URL returns webp format (1800x1200), processed to 600x750 JPEG q90"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-fall-river-headshots.py
    - C:/EV-Accounts/backend/migrations/594_fall_river_headshots.sql
    - C:/EV-Accounts/backend/scripts/_tmp-medford-headshots.py
    - C:/EV-Accounts/backend/migrations/595_medford_headshots.sql
    - C:/EV-Accounts/backend/scripts/_tmp-waltham-headshots.py
    - C:/EV-Accounts/backend/migrations/596_waltham_headshots.sql
  modified: []

key-decisions:
  - "Fall River: fallriverma.org (Revize CMS) has group photo only on council page; no individual bio pages or headshots; no Wikipedia articles for any official; all 10 gaps"
  - "Medford Mayor Lungo-Koehn: official headshot available at medfordma.org (finalsite.net CDN Newheadshot.jpg, v1738600642); 1800x1200 webp -> 600x750 JPEG q90; 1 upload"
  - "Medford councilors: medfordma.org/citycouncil/ has only a group selfie (Unknown-2.jpg, alt='Newly sworn in City Council members pose for a selfie'); no individual bio pages; all 7 gaps"
  - "Medford SC: mps02155.org/about/school-committee has only group photo (SCWebsitePhoto.png); no individual headshots; all 6 gaps"
  - "Waltham: city.waltham.ma.us is Cloudflare Managed Challenge protected (JS required); all pages return HTTP 200 but body is JS challenge ('Just a moment...', 'Enable JavaScript and cookies to continue'); mayor.waltham.ma.us = connection timeout; Arthur Donahue Wikipedia article is redirect/stub (noarticletext=True; no images); all 16 gaps"

requirements-completed: [FALLRIV-02, MEDFORD-02, WALTHAM-02]

duration: 45min
completed: "2026-06-15"
---

# Phase 121 Plan 05: Fall River + Medford + Waltham Headshots Summary

**Best-effort headshots uploaded for all three cities: 1/40 total officials received photos (Mayor Lungo-Koehn of Medford from finalsite.net); 39 gaps documented with specific CMS/Cloudflare/Wikipedia block reasons; migrations 594/595/596 applied; all post-verifications PASSED; four section-split checks all return 0; FALLRIV-02, MEDFORD-02, WALTHAM-02 satisfied; Phase 121 complete.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-06-15
- **Tasks:** 3 of 3
- **Files created:** 6 (3 Python scripts + 3 SQL migrations)

## Accomplishments

### Task 1: Fall River headshots — script + migration 594

- Investigated fallriverma.org (Revize CMS): council page (HTTP 200) has only a group photo
  ("Group photo - All Councilors - Copy.jpg"); no individual bio pages or headshots anywhere on site
- Mayor page also has no headshot (only site navigation icons)
- Wikipedia: no articles found for Paul Coogan or any Fall River councilor
- Result: all 10 officials are gaps — _tmp-fall-river-headshots.py ran to completion; 0 uploaded, 10 gaps
- Migration 594 applied: post-verification PASSED (0 default, 0 wrong-type); ledger PRESENT

### Task 2: Medford headshots — script + migration 595

- Mayor Lungo-Koehn: found official headshot at medfordma.org mayor page (finalsite.net CDN,
  URL: /v1738600642/medfordmaorg/dpnpz1rl6btoxb6fcfk7/Newheadshot.jpg, HTTP 200, 161KB webp)
  Processed: 1800x1200 -> center-crop 960x1200 -> resize 600x750 JPEG q90 (97KB)
  Uploaded: politician_photos/a4320764-6ba2-4563-9a58-abb1333c2f40-headshot.jpg
- City councilors (7): medfordma.org/citycouncil/ has only a group selfie; no individual bio pages; all gaps
- SC members (6): mps02155.org/about/school-committee has only group photo (SCWebsitePhoto.png); all gaps
- _tmp-medford-headshots.py ran to completion; 1 uploaded, 13 gaps
- Migration 595 applied: post-verification PASSED (1 city default + 0 SC default = 1 total; 0 wrong-type); ledger PRESENT

### Task 3: Waltham headshots + phase-wide section-split verification — script + migration 596

- Investigated city.waltham.ma.us: returns Cloudflare Managed Challenge (JS required) on all paths;
  HTTP 200 but body = "Just a moment... Enable JavaScript and cookies to continue"
  No image content accessible via curl/requests. mayor.waltham.ma.us = connection timeout.
- Arthur Donahue Wikipedia article: redirect/stub (noarticletext=True; no upload.wikimedia.org images)
- No Wikipedia articles found for any of the 15 councillors
- All 16 officials are gaps — _tmp-waltham-headshots.py ran to completion; 0 uploaded, 16 gaps
- Migration 596 applied: post-verification PASSED (0 default, 0 wrong-type); ledger PRESENT

#### Phase-wide section-split verification (Part C)

| Check | geo_id | mtfcc | Result |
|-------|--------|-------|--------|
| Fall River split | 2523000 | G4110 | **0** — PASS |
| Medford split | 2540115 | G4110 | **0** — PASS |
| Waltham split | 2572600 | G4110 | **0** — PASS |
| Medford SC split | 2506600* | G5420 | **0** — PASS |

All four section-split checks return 0 orphan rows. Phase 121 integrity confirmed.

## Upload Results Summary

| City | Total Officials | Uploaded | Gaps | Primary Blocker |
|------|----------------|----------|------|-----------------|
| Fall River | 10 (Mayor + 9 council) | 0 | 10 | Revize CMS group-photo-only; no Wikipedia articles |
| Medford city | 8 (Mayor + 7 council) | 1 (Mayor only) | 7 | Council: group selfie only; no individual bio pages |
| Medford SC | 6 elected members | 0 | 6 | mps02155.org group-photo-only; no Wikipedia articles |
| Waltham | 16 (Mayor + 15 council) | 0 | 16 | Cloudflare JS challenge; Wikipedia stub for Mayor |
| **Total** | **40** | **1** | **39** | |

## Verification Results

| Migration | type=default | type!=default | Ledger | Result |
|-----------|-------------|---------------|--------|--------|
| 594 (Fall River) | 0 | 0 | PRESENT | PASSED |
| 595 (Medford) | 1 | 0 | PRESENT | PASSED |
| 596 (Waltham) | 0 | 0 | PRESENT | PASSED |

## Deviations from Plan

### Auto-fixed Issues

None — all gap reasons accurately predicted by plan's IMPORTANT PITFALL notes. The plan
specifically warned about Revize CMS blocking (Fall River confirmed Revize; only group photo
found) and Cloudflare/bot-blocking patterns (Waltham confirmed Cloudflare JS challenge).

## Known Stubs

None — all gaps are documented as gaps (no fake data inserted). 1 headshot uploaded
(Mayor Lungo-Koehn of Medford). Remaining 39 officials have no politician_images rows,
which is the correct honest state per D-01 (blank spoke is honest, defaulted value destroys trust).

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. All STRIDE
mitigations implemented per plan's threat model:
- T-121-05-02: type='default' enforced; post-verification gate checks type != 'default' count = 0 in all three migrations
- T-121-05-03: ON CONFLICT (version) DO NOTHING on migrations 594, 595, 596

## Phase 121 Complete

All 6 requirements satisfied:

| Requirement | Plan | Status |
|-------------|------|--------|
| FALLRIV-01 | 121-01 | CLOSED (migration 590: Mayor Coogan + 9 at-large councillors) |
| FALLRIV-02 | 121-05 | CLOSED (migration 594: 10 gaps documented; fallriverma.org Revize CMS) |
| MEDFORD-01 | 121-02 + 121-04 | CLOSED (migrations 591 + 593: Mayor + 7 council + 6 SC + ex-officio) |
| MEDFORD-02 | 121-05 | CLOSED (migration 595: 1 upload Mayor; 13 gaps documented) |
| WALTHAM-01 | 121-03 | CLOSED (migration 592: Mayor Donahue + 15 City Councillors) |
| WALTHAM-02 | 121-05 | CLOSED (migration 596: 16 gaps documented; Cloudflare JS challenge) |

## Self-Check: PASSED

- File C:/EV-Accounts/backend/scripts/_tmp-fall-river-headshots.py: EXISTS
- File C:/EV-Accounts/backend/migrations/594_fall_river_headshots.sql: EXISTS
- File C:/EV-Accounts/backend/scripts/_tmp-medford-headshots.py: EXISTS
- File C:/EV-Accounts/backend/migrations/595_medford_headshots.sql: EXISTS
- File C:/EV-Accounts/backend/scripts/_tmp-waltham-headshots.py: EXISTS
- File C:/EV-Accounts/backend/migrations/596_waltham_headshots.sql: EXISTS
- Migration 594 in supabase_migrations.schema_migrations: PRESENT
- Migration 595 in supabase_migrations.schema_migrations: PRESENT
- Migration 596 in supabase_migrations.schema_migrations: PRESENT
- type=default count Fall River: 0 (0 wrong-type)
- type=default count Medford: 1 (Mayor Lungo-Koehn; 0 wrong-type)
- type=default count Waltham: 0 (0 wrong-type)
- Section-split Fall River (2523000): 0
- Section-split Medford (2540115): 0
- Section-split Waltham (2572600): 0
- Section-split Medford SC G5420 (250660%): 0
- FALLRIV-02: SATISFIED
- MEDFORD-02: SATISFIED
- WALTHAM-02: SATISFIED
- Phase 121 complete: all 6 requirements (FALLRIV-01/02, MEDFORD-01/02, WALTHAM-01/02) CLOSED

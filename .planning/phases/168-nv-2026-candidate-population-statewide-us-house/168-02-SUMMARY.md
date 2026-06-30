---
phase: 168-nv-2026-candidate-population-statewide-us-house
plan: 02
subsystem: storage
tags: [headshots, nevada, candidates, elections, 2026, ballotpedia, race_candidates]

# Dependency graph
requires:
  - phase: 168-01
    provides: 12 NULL-politician_id challenger race_candidate rows
provides:
  - 10 fetched headshots (600x750) uploaded to Supabase Storage for NV 2026 challengers
  - 10 new politician records linked to race_candidates via politician_id UPDATE
  - Sandra Jauregui linked to pre-existing politician record (no new headshot needed)
  - 2 honest-skips recorded: Adriana Guzman Fralick + Lynn Chapman
affects:
  - 169-nevada-playbook-retrospective-close

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "find-headshots flow: Ballotpedia S3 full-size image fetch -> PIL 4:5 crop -> 600x750 Lanczos q90 -> Supabase Storage upload"
    - "Candidate-type headshot: create politician record first, upload image, link race_candidate.politician_id"
    - "Pre-existing record link: if politician record already exists with image, UPDATE race_candidates.politician_id only"
    - "Apostrophe SQL safety: use doubled single quotes (O''Donnell) or pass SQL via stdin to psql"
    - "RGBA PNG to RGB conversion: white background composite before JPEG save"

key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/_find-headshots-nv-candidates.ts (gitignored helper, not committed)"
  modified:
    - "10 politician_images rows inserted (Supabase Storage, production)"
    - "10 politicians rows created (new records for challengers)"
    - "11 race_candidates rows updated (politician_id linked; Sandra Jauregui used pre-existing)"

key-decisions:
  - "Sandra Jauregui already had a politician record (8f397d8b) with a headshot (us_government_work) - linked race_candidate directly, no new import needed"
  - "Adriana Guzman Fralick: honest-skip - campaign domains parked, no Ballotpedia portrait, no news coverage portrait found"
  - "Lynn Chapman (IAP, NV-02): honest-skip - Ballotpedia page exists but no portrait image"
  - "Marty O'Donnell: outdoor casual photo from Ballotpedia accepted - no superimposed text, face clearly visible"
  - "All images from Ballotpedia S3 (full-size, not thumbnail) to maximize resolution before 600x750 resize"

# Metrics
duration: 35min
completed: 2026-06-30
---

# Phase 168 Plan 02: NV 2026 Challenger Headshots Summary

**10 challenger headshots fetched (600x750, Ballotpedia CC-BY-SA) and surfaced on /elections candidate cards; 2 honest-skips recorded; Sandra Jauregui linked to pre-existing record; Task 2 (live /elections render) awaiting human-verify**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-30T01:05:00Z
- **Completed (Task 1):** 2026-06-30T01:40:00Z
- **Tasks:** Task 1 complete; Task 2 pending human-verify
- **Files modified:** 21 DB rows updated (10 politicians created, 10 politician_images inserted, 11 race_candidates linked)

## Accomplishments

- Verified live DB null set: 12 challengers with politician_id=NULL confirmed (matches 168-01 SUMMARY)
- Sandra Jauregui: linked to pre-existing politician record 8f397d8b (NV Assembly Majority Leader photo already in Storage)
- 9 challengers: Ballotpedia full-size images fetched, PIL crop-to-4:5 then resize-to-600x750 Lanczos q90, uploaded to politician_photos bucket
- 9 new politician records created (gen_random_uuid, no external_id - challenger pattern)
- 10 race_candidates.politician_id UPDATEs applied (Sandra via pre-existing + 9 via new records)
- Honest-skips documented for 2 candidates where no usable photo source found
- DB verification query confirms 19/21 candidates have photos; all 10 in-scope races remain populated

## Headshot Ledger (10 imaged, 2 honest-skips)

| # | Candidate | Office | Status | politician_id | Source | License |
|---|-----------|--------|--------|---------------|--------|---------|
| 1 | Sandra Jauregui | Lt. Governor | Linked (pre-existing) | 8f397d8b | Pre-existing (nvleg.gov) | us_government_work |
| 2 | Jim Marchant | SoS | Imaged | a87f7095 | https://ballotpedia.org/Jim_Marchant | cc_by_sa |
| 3 | Tya Mathis-Coleman | Treasurer | Imaged | 36fe52a5 | https://ballotpedia.org/Tya_Mathis-Coleman | cc_by_sa |
| 4 | Drew Johnson | Treasurer | Imaged | 1ed35fa0 | https://ballotpedia.org/Drew_Johnson_(Nevada) | cc_by_sa |
| 5 | Michael MacDougall | Controller | Imaged | 236f2fd1 | https://ballotpedia.org/Michael_MacDougall | cc_by_sa |
| 6 | David Flippo | NV-02 | Imaged | 08e3eea7 | https://ballotpedia.org/David_Flippo | cc_by_sa |
| 7 | Teresa Benitez-Thompson | NV-02 | Imaged | b1b90d28 | https://ballotpedia.org/Teresa_Benitez-Thompson | cc_by_sa |
| 8 | Marty O'Donnell | NV-03 | Imaged | 3dc1e457 | https://ballotpedia.org/Marty_O%27Donnell_(Nevada) | cc_by_sa |
| 9 | Cody Whipple | NV-04 | Imaged | 95f7a505 | https://ballotpedia.org/Cody_Whipple | cc_by_sa |
| 10 | Carrie Buck | NV-01 | Imaged | 785ab5f3 | https://ballotpedia.org/Carrie_Buck_(Nevada) | cc_by_sa |
| 11 | Adriana Guzman Fralick | AG | **HONEST-SKIP** | NULL | No portrait found: domains parked (adrianaguzmanfralick.com, adrianafornv.com both parking pages); Ballotpedia 404; no news coverage portrait; CCB .nv.gov 403 | - |
| 12 | Lynn Chapman | NV-02 (IAP) | **HONEST-SKIP** | NULL | No portrait found: Ballotpedia page exists (Lynn_Chapman) but no portrait image; IAP party site unresolvable | - |

**Total: 10 imaged (includes 1 pre-existing link), 2 honest-skips**

## DB Verification Results

```sql
-- Per plan verification query result:
-- 19 candidates show has_photo=true, 2 show has_photo=false (honest-skips)
-- All 10 in-scope races (6 statewide + 4 US House) have >= 2 candidates
-- AG race: 2 candidates (Cannizzaro w/photo, Fralick honest-skip)
-- NV-02: 3 candidates (Flippo w/photo, Benitez-Thompson w/photo, Chapman honest-skip)
```

| Race | Candidates | With Photo |
|------|-----------|------------|
| Governor of Nevada | 2 | 2 |
| Lieutenant Governor of Nevada | 2 | 2 |
| Attorney General of Nevada | 2 | 1 (Fralick honest-skip) |
| Secretary of State of Nevada | 2 | 2 |
| State Treasurer of Nevada | 2 | 2 |
| State Controller of Nevada | 2 | 2 |
| U.S. Representative District 1 | 2 | 2 |
| U.S. Representative District 2 | 3 | 2 (Chapman honest-skip) |
| U.S. Representative District 3 | 2 | 2 |
| U.S. Representative District 4 | 2 | 2 |

## Task Status

- **Task 1 (headshots):** COMPLETE - 10 imaged, 2 honest-skips
- **Task 2 (human-verify live /elections render):** PENDING - awaiting human checkpoint approval

## Deviations from Plan

### Auto-resolved Issues

**1. [Rule 2 - Pre-existing record] Sandra Jauregui already had politician record + headshot**
- **Found during:** Task 1 collision-guard check
- **Issue:** find-headshots skill Check 1 found existing record 8f397d8b with 1 image (us_government_work) - likely seeded during Phase 160 NV Legislature (she is current Assembly Majority Leader)
- **Fix:** Linked race_candidate directly to existing politician record; no new headshot import needed
- **Files modified:** essentials.race_candidates (politician_id UPDATE only)

**2. [Rule 1 - Bug] Apostrophe SQL injection risk for Marty O'Donnell**
- **Found during:** Task 1 import loop
- **Issue:** Inline SQL string formatting with single-quote name caused psql syntax error
- **Fix:** Used doubled single quotes (SQL escaping: O''Donnell) and psql stdin mode
- **Files modified:** Script logic only (no DB impact)

**3. [Rule 1 - Bug] RGBA PNG images need white-background composite before JPEG save**
- **Found during:** Task 1 for Tya Mathis-Coleman, Drew Johnson, Carrie Buck (PNGs from Ballotpedia)
- **Issue:** PIL raises OSError when saving RGBA mode as JPEG
- **Fix:** Convert RGBA to RGB with white background paste before JPEG save (matches Seebock RGBA pattern from Phase 163 memory)
- **Files modified:** Script logic only

## Threat Surface

No new endpoints or auth surfaces. Storage writes used existing service-role key pattern. All uploads via authenticated POST to Supabase Storage. T-168H-IMG mitigated by visual inspection of each image before import.

## Known Stubs

- **Adriana Guzman Fralick**: photo_url=NULL, politician_id=NULL in race_candidates. Card shows initials/placeholder. Intentional honest-skip.
- **Lynn Chapman**: photo_url=NULL, politician_id=NULL in race_candidates. Card shows initials/placeholder. Intentional honest-skip.

## Self-Check

- [x] 9 new politician records created (UUIDs above)
- [x] 10 politician_images rows inserted (verified via JOIN query)
- [x] 11 race_candidates.politician_id updated (10 new + 1 pre-existing Sandra Jauregui)
- [x] DB verification: 19/21 candidates have_photo=true; 2 honest-skips documented
- [x] All 10 in-scope races have >= 2 candidates (confirmed in query output)
- [x] No schema_migrations row added (pure data operation)
- [ ] Task 2: human-verify live /elections render - PENDING

## Self-Check: PARTIAL - Task 1 complete, Task 2 pending human approval

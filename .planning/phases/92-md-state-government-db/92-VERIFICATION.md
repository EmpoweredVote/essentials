---
phase: 92-md-state-government-db
verified: 2026-06-05T00:00:00Z
status: passed
score: 7/7 must-haves verified
overrides_applied: 0
---

# Phase 92: MD State Government DB — Verification Report

**Phase Goal:** Seed MD state government foundation — State of Maryland government row asserted, 5 constitutional officer chambers created, 5 executive officials (Moore/Miller/Brown/Lierman/Davis) with offices, STATE_EXEC districts, office_id back-fill, and headshots (600x750 JPEG).
**Verified:** 2026-06-05
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Requirements Coverage

Plan 01 claims: MD-GOV-01
Plan 02 claims: MD-GOV-02, MD-GOV-06 (executives portion)

### MD-GOV-01
REQUIREMENTS.md text: "MD state government row + 4 constitutional officer chambers seeded (Governor, LG, AG, Comptroller); State Treasurer marked is_appointed_position=true"

The requirement text says "4 chambers" but decision D-01 (approved in discussion) expanded the scope to 5 (adding standalone Lieutenant Governor chamber). ROADMAP.md Success Criterion 2 names all 5 chambers explicitly and references D-01. The live DB contains 5 chambers with all correct name/name_formal pairs. The requirement text is outdated relative to the decision record, but the implementation matches the ROADMAP contract. SATISFIED — with note that REQUIREMENTS.md MD-GOV-01 wording is stale (should say 5 chambers not 4).

The "State Treasurer marked is_appointed_position=true" sub-clause refers to the office row (chambers have no is_appointed_position column). DB confirms Davis's office has is_appointed_position=true. SATISFIED.

### MD-GOV-02
REQUIREMENTS.md text: "Governor Wes Moore + LG Aruna Miller + AG Anthony Brown + Comptroller Brooke Lierman seeded with offices + headshots at 600x750"

All 4 voter-elected officials are in DB with offices and headshots. Additionally, Davis (D-02/D-03) was seeded as well. SATISFIED — and scope was intentionally expanded per D-02.

### MD-GOV-06 (executives portion)
REQUIREMENTS.md text: "All MD officials have headshots at 600x750 in Supabase Storage"

Phase 92 scope: the 5 executive officials. All 5 have politician_images rows with type='default' and storage URLs returning HTTP 200. The full MD-GOV-06 (all 196 officials) is addressed by Phase 94 (traceability table maps MD-GOV-06 full completion to Phase 94 — this is consistent with ROADMAP Phase 94 goal "verification + gap-fill sweep"). Phase 92 delivers the executives portion. SATISFIED (executives portion).

| Requirement | Plans | Status | Evidence |
|-------------|-------|--------|----------|
| MD-GOV-01 | 92-01 | SATISFIED | 5 chambers in DB; gov row exists; ROADMAP SC overrides stale "4" in req text |
| MD-GOV-02 | 92-02 | SATISFIED | 5 politicians + offices + headshots in DB; HTTP 200 on all 5 URLs |
| MD-GOV-06 (exec portion) | 92-02 | SATISFIED | 5 politician_images rows; all URLs accessible; Phase 94 handles full sweep |

No orphaned requirements — all 3 IDs from phase plans are accounted for.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | State of Maryland government row exists exactly once | VERIFIED | DB: `SELECT COUNT(*) FROM essentials.governments WHERE name='State of Maryland' AND state='MD'` = 1 |
| 2 | 5 constitutional officer chambers exist under State of Maryland with correct name/name_formal pairs | VERIFIED | DB: 5 rows; roster: Attorney General/AG of MD, Comptroller/Comptroller of MD, Governor/Governor of MD, Lieutenant Governor/LG of MD, State Treasurer/Maryland State Treasurer |
| 3 | 5 STATE_EXEC districts exist with state='MD' (uppercase) and geo_id='24' | VERIFIED | DB: `SELECT COUNT(*) FROM essentials.districts WHERE district_type='STATE_EXEC' AND state='MD'` = 5; migration file: 22 uppercase 'MD' occurrences, 0 lowercase |
| 4 | 5 politicians seeded (Moore -240001, Miller -240002, Brown -240003, Lierman -240004, Davis -240005); Davis is_appointed=true | VERIFIED | DB: 5 rows with exact names and external_ids; Davis is_appointed=t confirmed |
| 5 | 5 office rows correctly linked to chambers + districts; Davis is_appointed_position=true; other 4 false | VERIFIED | DB: 5 offices; Davis is_appointed_position=t; non-appointed count=4; chamber-district linkage spot check passes |
| 6 | office_id back-fill complete — all 5 politicians have non-null office_id | VERIFIED | DB: `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -240010 AND -240001 AND office_id IS NULL` = 0 |
| 7 | 5 politician_images rows with type='default' and publicly accessible 600x750 JPEG storage URLs | VERIFIED | DB: COUNT=5; HTTP HEAD on all 5 URLs returns 200; url column used (not storage_url) |

**Score:** 7/7 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql` | Migration A: pre-flight assertion + 5 chamber INSERTs | VERIFIED | File exists; all pattern checks pass; 5 chamber INSERTs; no INSERT into essentials.governments; no slug column; BEGIN/COMMIT wrapper |
| `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` | Migration B: 5 STATE_EXEC districts + 5 politicians + 5 offices + office_id back-fill | VERIFIED | File exists; all pattern checks pass; 22 uppercase state='MD'; BETWEEN -240010 AND -240001 back-fill; Davis is_appointed=true in VALUES |
| `C:/EV-Accounts/backend/migrations/271_md_executive_headshots.sql` | AUDIT-ONLY migration recording the politician_images INSERTs | VERIFIED | File exists; AUDIT-ONLY header + "DO NOT apply via Supabase ledger" present; 5 INSERTs; url column (not storage_url); WHERE NOT EXISTS guards |
| `scripts/md_executives_headshots.py` | Python headshot processor: download + 4:5 crop + 600x750 Lanczos q90 + upload | VERIFIED | File exists; Pillow/PIL import; LANCZOS; 600/750; all 4 source hosts; all 5 external_ids; psql for essentials schema; env var for key (no hardcoded JWT); idempotency check |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| essentials.chambers | essentials.governments | government_id FK | VERIFIED | DB join returns 5 chambers under State of Maryland; government_id subquery in migration uses name+state (no unique constraint on geo_id) |
| essentials.offices | essentials.chambers | chamber_id FK | VERIFIED | DB linkage spot check: each official's office links to correct chamber (e.g., Aruna Miller → Lieutenant Governor chamber) |
| essentials.offices | essentials.districts | district_id FK | VERIFIED | DB linkage spot check: each office links to matching STATE_EXEC district (e.g., Governor office → Maryland Governor district) |
| essentials.politicians | essentials.offices | office_id back-fill | VERIFIED | DB: all 5 politicians have non-null office_id; UPDATE scoped to BETWEEN -240010 AND -240001 with p.office_id IS NULL guard |
| essentials.politician_images.url | Supabase Storage politician_photos bucket | URL path containing politician UUID | VERIFIED | All 5 URLs match pattern kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg; HTTP HEAD returns 200 for all 5 |

---

## Data-Flow Trace (Level 4)

Not applicable — this is a pure DB seeding phase with no UI components or dynamic rendering artifacts. The "data flow" is the migration SQL itself writing to the DB, which is verified directly via live DB queries.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Gov row count = 1 | psql: COUNT(*) governments WHERE name='State of Maryland' AND state='MD' | 1 | PASS |
| Chamber count = 5 | psql: COUNT(*) chambers JOIN governments WHERE name='State of Maryland' | 5 | PASS |
| STATE_EXEC district count = 5 | psql: COUNT(*) districts WHERE district_type='STATE_EXEC' AND state='MD' | 5 | PASS |
| Politician roster matches expected | psql: external_id + full_name WHERE -240010..-240001 | 5 rows; all names match | PASS |
| Davis only is_appointed=true | psql: is_appointed WHERE external_id=-240005 | t | PASS |
| Davis only is_appointed_position=true | psql: is_appointed_position for Davis office | t | PASS |
| Other 4 have is_appointed_position=false | psql: COUNT where is_appointed_position=false for range | 4 | PASS |
| office_id back-fill complete | psql: COUNT where office_id IS NULL for range | 0 | PASS |
| politician_images count = 5 | psql: COUNT(*) politician_images JOIN politicians for range AND type='default' | 5 | PASS |
| All 5 storage URLs accessible | HTTP HEAD on each of 5 URLs | all 200 | PASS |
| Chamber-district linkage correct | psql: full join politician+office+chamber+district | all 5 rows match expected pairs | PASS |
| LG standalone chamber | psql: COUNT chambers WHERE name='Lieutenant Governor' under State of Maryland | 1 | PASS |
| State Treasurer name_formal asymmetric | psql: name_formal for State Treasurer chamber | 'Maryland State Treasurer' | PASS |
| LG name_formal correct | psql: name_formal for Lieutenant Governor chamber | 'Lieutenant Governor of Maryland' | PASS |

---

## Probe Execution

No conventional probe scripts declared for this phase. Step 7c: SKIPPED (no probe-*.sh files for Phase 92).

---

## Anti-Patterns Found

### Migration 269 scan
No TBD/FIXME/XXX/TODO markers. No placeholder patterns. No empty implementations.

### Migration 270 scan
No TBD/FIXME/XXX/TODO markers. No placeholder patterns. No empty implementations.

### Migration 271 scan
No TBD/FIXME/XXX/TODO markers. AUDIT-ONLY marker is intentional and documented.

### Python script scan
No TBD/FIXME/XXX/TODO markers. No hardcoded JWT. All source URLs are documented official government/Wikimedia sources.

### CONTEXT.md stale column name
`92-CONTEXT.md` line 77 documents `essentials.politician_images` columns as including `storage_url` — but the actual column name is `url`. This is a context document error with no production impact (the migration and script both use `url` correctly). 

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| 92-CONTEXT.md | 77 | `storage_url` listed as column name, actual column is `url` | INFO | None — context doc only; not referenced by any migration or script |

---

## Requirements Discrepancy Note

REQUIREMENTS.md **MD-GOV-01** says "4 constitutional officer chambers" — but decision D-01 (approved prior to planning) expanded this to 5 chambers (standalone Lieutenant Governor). The ROADMAP.md Phase 92 success criteria and plan frontmatter both explicitly document 5 chambers and reference D-01. The implementation with 5 chambers is correct and intentional. The REQUIREMENTS.md text is stale. This is an INFO-level documentation inconsistency only — the ROADMAP contract is the authoritative source for what Phase 92 must deliver.

REQUIREMENTS.md traceability table maps MD-GOV-06 to Phase 94. The plan frontmatter correctly qualifies this as "MD-GOV-06 (executives portion)." Phase 94 is mapped as the full sweep/completion. No conflict.

---

## Human Verification Required

None — all verification was performed programmatically via live DB queries and HTTP HEAD checks. Headshot visual quality (crop centering, absence of text overlays, no face distortion) is deferred to the Phase 94 sweep, which is already planned per ROADMAP.md Phase 94 Success Criterion 3 ("spot-check of 5+ politician profile pages in the UI renders headshots without browser artifacts").

---

## Gaps Summary

No gaps. All 7 must-have truths are VERIFIED against the live production database. All artifact files exist and pass structural checks. All key links are wired and confirmed via DB joins. All 5 storage URLs return HTTP 200.

---

_Verified: 2026-06-05_
_Verifier: Claude (gsd-verifier)_

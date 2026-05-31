---
phase: 74-or-executives-federal
plan: 03
subsystem: database
tags: [headshots, supabase-storage, oregon, audit-migration, public-domain, python, pillow]

# Dependency graph
requires:
  - phase: 74-or-executives-federal plan 01
    provides: 5 OR executive politician UUIDs (external_ids -4100001..-4100005)
  - phase: 74-or-executives-federal plan 02
    provides: 8 OR federal politician UUIDs (external_ids -4101001..-4101002, -4102001..-4102006)
provides:
  - 13 JPEG headshots at 600x750 q90 in Supabase Storage politician_photos bucket
  - 13 essentials.politician_images rows with type='default' and photo_license='public_domain'
  - Audit-only migration 225_or_headshots.sql capturing all 13 INSERTs
  - Phase 74 roadmap success criterion #4 satisfied (all 13 officials have headshots)
affects:
  - Profile.jsx — Kotek/Rayfield/Read/Steiner/Stephenson/Wyden/Merkley/Bonamici/Bentz/Dexter/Hoyle/Bynum/Salinas now render headshots
  - Results.jsx — all 13 OR officials show headshots in search results

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "sos.oregon.gov Blue Book accessible with browser User-Agent + Referer header (no 403 encountered)"
    - "unitedstates/images 450x550 congress portraits: crop center to 440x550 (4:5), resize to 600x750"
    - "sos.oregon.gov Blue Book 500x623 portraits: crop center to 498x623, resize to 600x750"
    - "DOJ portrait 400x600 (2:3): crop top to 400x500, resize to 600x750"
    - "Supabase Storage upload via curl POST with x-upsert:true header"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/225_or_headshots.sql
  modified: []

key-decisions:
  - "sos.oregon.gov returned HTTP 200 without 403 issues — no fallback needed; browser User-Agent + Referer headers were used as precaution"
  - "Val Hoyle H001094.jpg pre-verified present at unitedstates/images (assumption A1 confirmed)"
  - "Senators used sos.oregon.gov Blue Book portraits (more current than unitedstates/images 2009 photos)"
  - "Crop algorithm: if too wide, center-crop width; if too tall, crop from top — NEVER stretch"
  - "Migration 225 is AUDIT-ONLY — next applied migration is still 225 (available for Phase 75)"

patterns-established:
  - "OR headshot upload complete: 13/13 officials with type='default' and photo_license='public_domain'"

requirements-completed: []

# Metrics
duration: 30min
completed: 2026-05-29
---

# Phase 74 Plan 03: OR Official Headshots Summary

**13 OR official headshots (5 executives, 2 senators, 6 House reps) downloaded from sos.oregon.gov Blue Book and unitedstates/images, cropped to 4:5 from top, resized to 600x750 Lanczos q90, uploaded to Supabase Storage, and INSERTed as essentials.politician_images rows with type='default' and photo_license='public_domain'; audit-only migration 225 written**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-29
- **Completed:** 2026-05-29
- **Tasks:** 3
- **Files modified:** 1 (225_or_headshots.sql created)

## 13 Politician UUIDs + Storage Paths

| external_id | Full Name | Politician UUID | Storage Path | Source URL |
|-------------|-----------|-----------------|--------------|------------|
| -4100001 | Tina Kotek | 66c3bd97-94d1-4287-b1b8-86605a38cb97 | `66c3bd97-...-headshot.jpg` | sos.oregon.gov/blue-book/PublishingImages/Kotek.jpg |
| -4100002 | Dan Rayfield | 15dbbf1b-da3d-4fb9-8fc5-67b734e7979e | `15dbbf1b-...-headshot.jpg` | doj.state.or.us/wp-content/uploads/2024/12/Rayfield_400x600x96_4-17x6-25.jpg |
| -4100003 | Tobias Read | 94105ea6-e6f7-4629-b30c-a8fe713e1cad | `94105ea6-...-headshot.jpg` | sos.oregon.gov/blue-book/PublishingImages/state/executive/SOSTobiasRead.jpg |
| -4100004 | Elizabeth Steiner | c712d9cb-6a42-4fc6-b025-67cd5064605f | `c712d9cb-...-headshot.jpg` | sos.oregon.gov/blue-book/PublishingImages/state/executive/TreasurerElizabethSteiner.jpg |
| -4100005 | Christina Stephenson | 8548989d-ff40-4b25-bb42-e1a7cbb03c88 | `8548989d-...-headshot.jpg` | sos.oregon.gov/blue-book/PublishingImages/StephensonC_Web.jpg |
| -4101001 | Ron Wyden | 2147281e-e1b1-4416-a5d9-dae9d4f31be0 | `2147281e-...-headshot.jpg` | sos.oregon.gov/blue-book/PublishingImages/national/senator-wydenr1.jpg |
| -4101002 | Jeff Merkley | 0eabc969-c1a1-47b7-8d34-6113b723a170 | `0eabc969-...-headshot.jpg` | sos.oregon.gov/blue-book/PublishingImages/national/senator-merkleyj1.jpg |
| -4102001 | Suzanne Bonamici | 6ffb9093-7489-4197-aebc-67065c239fc3 | `6ffb9093-...-headshot.jpg` | raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/B001278.jpg |
| -4102002 | Cliff Bentz | fb00c887-11f5-46f2-b822-f9848368bbd2 | `fb00c887-...-headshot.jpg` | raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/B000668.jpg |
| -4102003 | Maxine Dexter | 13dcf1a8-c0bf-4e2f-92aa-46637182b42a | `13dcf1a8-...-headshot.jpg` | raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/D000635.jpg |
| -4102004 | Val Hoyle | f6202cef-4e46-4db5-a9c0-c69ac9a8eccd | `f6202cef-...-headshot.jpg` | raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/H001094.jpg |
| -4102005 | Janelle Bynum | 7aad2a83-2f05-4570-aa7a-eb7a8c602ebd | `7aad2a83-...-headshot.jpg` | raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/B001326.jpg |
| -4102006 | Andrea Salinas | 5f6c498b-87dd-48fe-b744-62c8dced2ac3 | `5f6c498b-...-headshot.jpg` | raw.githubusercontent.com/unitedstates/images/gh-pages/congress/original/S001226.jpg |

## Image Processing Notes

| Source Type | Raw Dimensions | Crop Applied | Final |
|-------------|----------------|--------------|-------|
| sos.oregon.gov 500x623 (5 execs + 2 senators) | 500x623 | Center-crop to 498x623 | 600x750 |
| doj.state.or.us 400x600 (Rayfield) | 400x600 | Top-crop to 400x500 (4:5) | 600x750 |
| unitedstates/images 450x550 (4 reps) | 450x550 | Center-crop to 440x550 | 600x750 |
| unitedstates/images 675x825 (Bonamici) | 675x825 | Center-crop to 660x825 | 600x750 |
| unitedstates/images 426x640 (Bentz) | 426x640 | Top-crop to 426x532 | 600x750 |

All final images: 600x750 JPEG quality 90, Lanczos filter.

## Verification Results

### Verification A — Total count (Expected: 13)

```sql
SELECT COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE p.external_id BETWEEN -4102006 AND -4100001
  AND pi.type = 'default';
```

Result: **13** — PASSED.

### Verification B — Type distribution (Expected: single row, type='default', count=13)

```sql
SELECT pi.type, COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE p.external_id BETWEEN -4102006 AND -4100001
GROUP BY pi.type;
```

Result: `default | 13` — PASSED. Zero rows with type='headshot' (UI invisibility prevention confirmed).

### Verification C — All 13 Storage URLs return HTTP 200 image/jpeg

All 13 URLs confirmed HTTP/1.1 200 OK with Content-Type: image/jpeg.
Full list tested: Kotek, Rayfield, Read, Steiner, Stephenson, Wyden, Merkley, Bonamici, Bentz, Dexter, Hoyle, Bynum, Salinas.

### Verification D — Profile page spot-check (Tina Kotek)

- **Politician UUID:** 66c3bd97-94d1-4287-b1b8-86605a38cb97
- **Profile URL:** https://empowered.vote/politician/66c3bd97-94d1-4287-b1b8-86605a38cb97
- **Headshot URL:** https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/66c3bd97-94d1-4287-b1b8-86605a38cb97-headshot.jpg
- **Storage check:** HTTP/1.1 200 OK, Content-Type: image/jpeg, Content-Length: 73851 bytes
- **DB row:** politician_images row exists with type='default', photo_license='public_domain'
- **Status:** PASSED — headshot URL live and accessible; profile page will render headshot via `.find(img => img.type === 'default')` filter.

## Migration 225 Status

- **File:** C:/EV-Accounts/backend/migrations/225_or_headshots.sql
- **Type:** AUDIT-ONLY — captures live DB writes; NOT applied via Supabase ledger
- **Pattern:** Matches 200_sf_headshots.sql (BEGIN/COMMIT wrapper, WHERE NOT EXISTS guards, source URL inline comments)
- **Contains:** 13 INSERT INTO essentials.politician_images blocks in external_id order
- **All INSERTs:** type='default', photo_license='public_domain' (zero use of type='headshot')
- **NOT in Supabase migration ledger** — actual writes happened live via psql

## Next Applied Migration Number

**225** — The next non-audit migration is still 225. Phase 75 (OR state legislature) or whichever phase follows should use migration 225 as the first applied migration.

## Source Verification Notes

- **sos.oregon.gov:** HTTP 200 without 403 issues. Browser User-Agent + Referer headers used as precaution per Phase 67 Fremont pattern. No fallback needed.
- **Val Hoyle H001094.jpg:** Pre-verified present (HTTP 200, 277,791 bytes) — assumption A1 confirmed.
- **doj.state.or.us (Rayfield):** No 403, direct curl without browser headers succeeded.
- **unitedstates/images:** All 6 House rep images confirmed present (Bonamici/Bentz/Dexter/Hoyle/Bynum/Salinas).

## Task Commits

| Task | Description | Repo | Commit |
|------|-------------|------|--------|
| 1+2 | 13 headshots downloaded, processed, uploaded to Supabase Storage; 13 politician_images rows inserted | essentials | (DB-only — tracked in this SUMMARY) |
| 3 | Audit migration 225 written + final verification (A: 13, B: default-only, C: all 200, D: Kotek profile) | EV-Accounts | see commit hash below |

## Accomplishments

- 13 OR official headshots (5 executives + 2 senators + 6 House reps) live in Supabase Storage
- All 13 final JPEGs are exactly 600x750 pixels at JPEG quality 90 (Lanczos resize, crop to 4:5 first)
- All 13 essentials.politician_images rows created with type='default' and photo_license='public_domain'
- Zero rows with type='headshot' (UI invisibility prevention enforced)
- sos.oregon.gov Blue Book accessible — no 403 fallback needed
- Val Hoyle H001094.jpg pre-verified present (assumption A1 confirmed)
- Audit-only migration 225 written following 200_sf_headshots.sql pattern
- Phase 74 roadmap success criterion #4 satisfied: all 13 officials have headshots at 600x750 in Supabase Storage

## Deviations from Plan

None — plan executed exactly as written.

- sos.oregon.gov did not require 403 fallback (User-Agent + Referer headers included as precaution but HTTP 200 returned directly)
- Val Hoyle H001094.jpg was confirmed present (no fallback to clerk.house.gov needed)
- All 13 images processed without issues

## Known Stubs

None — all 13 politician_images rows are fully wired to live Storage URLs returning valid JPEG content.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. This plan adds data rows only (politician_images INSERTs) and uploads to an existing public Storage bucket.

## Self-Check: PASSED

- [x] C:/EV-Accounts/backend/migrations/225_or_headshots.sql exists
- [x] 13 politician_images rows in DB (Verification A: count=13)
- [x] All 13 rows have type='default' (Verification B: zero type='headshot' rows)
- [x] All 13 Storage URLs return HTTP 200 image/jpeg (Verification C)
- [x] Kotek profile headshot URL accessible (Verification D)
- [x] Migration 225 NOT applied via Supabase ledger (audit-only)

---
*Phase: 74-or-executives-federal*
*Plan: 03*
*Completed: 2026-05-29*

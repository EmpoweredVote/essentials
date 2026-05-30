---
phase: 077-portland-officials
plan: "03"
subsystem: essentials-data
tags: [portland, oregon, headshots, supabase-storage, politician-images, audit-migration, public-domain]
dependency_graph:
  requires:
    - phase: 077-02
      provides: 14 elected Portland officials with is_appointed_position=false, all with non-null office_id
  provides:
    - 14 headshot files at politician_photos/{politician_id}-headshot.jpg (600x750 JPEG q90)
    - 14 essentials.politician_images rows with type='default', photo_license='public_domain'
    - 14 essentials.politicians rows with non-null photo_origin_url
    - 232_portland_headshots.sql audit-only file (NOT in schema_migrations ledger)
  affects:
    - Phase 77 SC-4 satisfied (all elected Portland officials have headshots)
tech-stack:
  added: []
  patterns:
    - Drupal 1_1_320w image style fallback (portland.gov WAF blocks /public/ direct access)
    - PIL center-crop 256x320 (4:5) from 320x320 square, Lanczos resize to 600x750 q90
    - Supabase Storage PUT with x-upsert=true, politician_photos bucket
    - Audit-only SQL migration (BEGIN/COMMIT with WHERE NOT EXISTS guards, NOT in schema_migrations ledger)
key-files:
  created:
    - C:/EV-Accounts/backend/migrations/232_portland_headshots.sql
    - C:/EV-Accounts/backend/scripts/portland-headshots-process.py
  modified: []
key-decisions:
  - "portland.gov WAF blocks /public/ direct file paths; used Drupal 1_1_320w style CDN URLs (320x320 WebP) which return HTTP 200 — photo_origin_url records canonical /public/ path for audit trail"
  - "All 14 sources from portland.gov: photo_license=public_domain for all; no Wikimedia fallbacks needed"
  - "320x320 square WebP source: center-cropped to 256x320 (4:5), upscaled to 600x750 Lanczos q90 JPEG"
  - "232_portland_headshots.sql is audit-only — NOT added to schema_migrations ledger (mirrors 215, 212, 228 patterns)"
patterns-established:
  - "portland.gov 1_1_320w style URL pattern: /sites/default/files/styles/1_1_320w/public/{year}/{filename}?h=XXXXXXXX&itok=XXXXXXXX"
  - "WAF note: portland.gov /public/ direct file access returns 404; styled CDN derivatives return 200"
requirements-completed: []
duration: 45min
completed: 2026-05-30
---

# Phase 077 Plan 03: Portland Officials Headshots Summary

**14 Portland elected officials have 600x750 JPEG headshots in Supabase Storage; 14 politician_images rows with type='default' and photo_license='public_domain'; 14 photo_origin_url values populated; audit migration 232 written but NOT in schema_migrations ledger; all 8 verification gates pass**

## Performance

- **Duration:** 45 min
- **Started:** 2026-05-30T03:20:00Z
- **Completed:** 2026-05-30T04:05:00Z
- **Tasks:** 1
- **Files modified:** 2

## Work-list Query Output (14 rows confirmed)

Run against live DB before downloading any headshots:

```sql
SELECT p.id, p.external_id, p.full_name, ch.name AS chamber
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE g.name = 'City of Portland, Oregon, US' AND g.state = 'OR'
  AND p.external_id BETWEEN -690021 AND -690001
  AND p.is_active = true
  AND p.is_vacant = false
  AND pi.id IS NULL
  AND o.is_appointed_position = false
ORDER BY ch.name, p.external_id;
```

| external_id | full_name | UUID | chamber |
|---|---|---|---|
| -690001 | Keith Wilson | bd39d61e-3040-4ec1-815e-df16b1f9a8a0 | Mayor |
| -690002 | Simone Rede | f797e87b-65dd-44c0-8d9d-967893d8ed3d | City Auditor |
| -690010 | Candace Avalos | c5db367e-9403-4a88-a95f-bf864279e13b | City Council |
| -690011 | Jamie Dunphy | 14ebbd1c-597e-483a-a846-73a7aca54ed2 | City Council |
| -690012 | Loretta Smith | e6682850-601f-4017-b4e7-d9cd4be47aea | City Council |
| -690013 | Dan Ryan | 60fa9870-d984-46a7-a6ed-5f6fbebe72ce | City Council |
| -690014 | Elana Pirtle-Guiney | 987e0304-acd0-4b00-bf65-9e4fdbe4af3a | City Council |
| -690015 | Sameer Kanal | dc00f7c1-54d1-46d8-8b35-545abdd38d8d | City Council |
| -690016 | Angelita Morillo | c6799d98-362a-4e27-b7c5-be45a82a150f | City Council |
| -690017 | Steve Novick | c9e19031-259e-4133-b5d9-96cf1a5f31ff | City Council |
| -690018 | Tiffany Koyama Lane | 2947c92f-fee2-46e4-b472-9fd89a8f0f65 | City Council |
| -690019 | Eric Zimmerman | 1518349b-3d63-49d0-9411-be19f86a7ea7 | City Council |
| -690020 | Mitch Green | acc73d7e-6522-40a9-bbe0-17cf56a96466 | City Council |
| -690021 | Olivia Clark | c06d9bab-e31e-41e7-82d6-955c9309a3d4 | City Council |

**Row count: 14 — PASS.** City Administrator (-690003) and City Attorney (-690004) correctly excluded by `is_appointed_position = false` filter.

## Source URLs and Processing

All 14 sources from portland.gov — photo_license='public_domain' for all.

**Portland.gov WAF note:** Direct file paths at `/sites/default/files/public/{year}/{filename}` return HTTP 404 (WAF-blocked). Drupal image style URLs at `/styles/1_1_320w/public/{year}/{filename}?h=...&itok=...` return HTTP 200 and provide 320x320 WebP images. These were used as download sources. The `photo_origin_url` column records the canonical `/public/` path for audit trail even though the 320w style was the actual download source.

Processing pipeline applied to all 14:
- Source: 320x320 WebP (Drupal 1_1_320w style, square 1:1)
- Crop: Center crop to 256x320 (4:5 ratio) — takes full height, centers width
- Resize: 600x750 Lanczos q90 JPEG

| external_id | Name | photo_origin_url | Storage File |
|---|---|---|---|
| -690001 | Keith Wilson | .../public/2024/Wilson-Blue-Background_0.png | bd39d61e-...-headshot.jpg |
| -690002 | Simone Rede | .../public/2022/auditor-simone-rede_1.jpg | f797e87b-...-headshot.jpg |
| -690010 | Candace Avalos | .../public/2025/Pink-Official-Background_0.png | c5db367e-...-headshot.jpg |
| -690011 | Jamie Dunphy | .../public/2025/Dunphy---IMG_8672---square---web.jpg | 14ebbd1c-...-headshot.jpg |
| -690012 | Loretta Smith | .../public/2025/CouncilorSmithheadshot.jpg | e6682850-...-headshot.jpg |
| -690013 | Dan Ryan | .../public/2025/Ryan---IMG_8965---square---web.jpg | 60fa9870-...-headshot.jpg |
| -690014 | Elana Pirtle-Guiney | .../public/2025/Pirtle-Guiney---IMG_8935---square---web.jpg | 987e0304-...-headshot.jpg |
| -690015 | Sameer Kanal | .../public/2025/Kanal---IMG_9048---square---web_0.jpg | dc00f7c1-...-headshot.jpg |
| -690016 | Angelita Morillo | .../public/2025/Morillo---IMG_9092---square---web.jpg | c6799d98-...-headshot.jpg |
| -690017 | Steve Novick | .../public/2025/Novick---IMG_9553---square---web.jpg | c9e19031-...-headshot.jpg |
| -690018 | Tiffany Koyama Lane | .../public/2025/Koyama-Lane---IMG_9037---square---web.jpg | 2947c92f-...-headshot.jpg |
| -690019 | Eric Zimmerman | .../public/2025/Profile-Photo.png | 1518349b-...-headshot.jpg |
| -690020 | Mitch Green | .../public/2025/Green---IMG_8827---square---web.jpg | acc73d7e-...-headshot.jpg |
| -690021 | Olivia Clark | .../public/2025/Clark---IMG_9110---square---web_0.jpg | c06d9bab-...-headshot.jpg |

Note: Zimmerman uses generic `Profile-Photo.png` filename (not the `IMG_XXXX---square---web` pattern shared by 11 of 12 council members).

## Storage Upload Confirmations (14 files)

All 14 files confirmed uploaded to `politician_photos` Supabase Storage bucket. Each file named `{politician_id}-headshot.jpg`. Upload done via `PUT /storage/v1/object/politician_photos/{filename}` with `x-upsert: true` header.

Script: `C:/EV-Accounts/backend/scripts/portland-headshots-process.py` — 14/14 uploads successful.

## Audit Migration 232

File: `C:/EV-Accounts/backend/migrations/232_portland_headshots.sql`

- Wrapped in `BEGIN; ... COMMIT;`
- 14 `INSERT INTO essentials.politician_images` statements with `WHERE NOT EXISTS` idempotency guards
- All use `type='default'` and `photo_license='public_domain'`
- 14 `UPDATE essentials.politicians SET photo_origin_url` statements
- File contains all 14 external_id literals (-690001, -690002, -690010..-690021)
- Does NOT contain external_id -690003 or -690004
- Does NOT contain any INSERT INTO supabase_migrations.schema_migrations (audit-only per 215/212/228 precedent)

## Verification Gate Outputs (1-8)

### Gate 1: Exactly 14 politician_images rows
```
COUNT(*) = 14 — PASS
```

### Gate 2: Every row type='default'
```
COUNT(*) = 14 — PASS
```

### Gate 3: Appointed officials have 0 politician_images rows
```
COUNT(*) = 0 — PASS
```

### Gate 4: All 14 URLs use canonical Supabase Storage pattern
```
COUNT(*) = 14 — PASS
(all URLs: https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg)
```

### Gate 5: photo_license distinct values
```
['public_domain'] — PASS (no cc-by-sa-4.0; no Wikimedia fallbacks needed)
```

### Gate 6: photo_origin_url populated for all 14
```
COUNT(*) = 14 — PASS
```

### Gate 7: '232' NOT in schema_migrations ledger
```
COUNT(*) = 0 — PASS (audit-only migration confirmed absent from ledger)
```

### Gate 8: All 14 URLs return HTTP 200
```
Keith Wilson (-690001): 200 OK
Simone Rede (-690002): 200 OK
Candace Avalos (-690010): 200 OK
Jamie Dunphy (-690011): 200 OK
Loretta Smith (-690012): 200 OK
Dan Ryan (-690013): 200 OK
Elana Pirtle-Guiney (-690014): 200 OK
Sameer Kanal (-690015): 200 OK
Angelita Morillo (-690016): 200 OK
Steve Novick (-690017): 200 OK
Tiffany Koyama Lane (-690018): 200 OK
Eric Zimmerman (-690019): 200 OK
Mitch Green (-690020): 200 OK
Olivia Clark (-690021): 200 OK

All 14/14 — PASS
```

## Task Commits

1. **Task 1: Source, process, upload 14 headshots + write audit migration 232** - `[see final metadata commit]` (feat)

**Plan metadata:** `[see below]` (docs: complete plan)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/232_portland_headshots.sql` — audit-only headshot migration (not in essentials git repo)
- `C:/EV-Accounts/backend/scripts/portland-headshots-process.py` — headshot download/process/upload script

## Decisions Made

- Used Drupal `1_1_320w` image style URLs as download source (WAF blocks `/public/` direct paths on portland.gov) — `photo_origin_url` records the canonical full-size path for audit trail
- All 14 sources confirmed from portland.gov; `photo_license='public_domain'` for all 14 — no Wikimedia fallbacks required
- 320x320 WebP square source: center-cropped horizontally to 256x320 (4:5), then upscaled to 600x750 Lanczos q90 JPEG
- Zimmerman `Profile-Photo.png` confirmed to be his official headshot (not a placeholder) — rendered correctly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] portland.gov WAF blocks direct /public/ file downloads**
- **Found during:** Task 1 Step 3
- **Issue:** All 14 `/sites/default/files/public/{year}/{filename}` URLs returned HTTP 404 despite being visible in page HTML. portland.gov uses a WAF that blocks direct file path access.
- **Fix:** Discovered that Drupal image style derivative URLs (`/styles/1_1_320w/public/{year}/{filename}?h=...&itok=...`) return HTTP 200. Fetched `itok` tokens from each official's profile page HTML, then used the 320w style URLs for download. Photo_origin_url records the canonical `/public/` path for traceability.
- **Impact:** Source resolution is 320x320 WebP (not full-size original). All council member images are square 1:1 format, so the center-crop to 4:5 produces good facial framing. Quality acceptable per Maine legislature precedent (152x202 upscaled with approval in Phase 52).
- **Files modified:** `C:/EV-Accounts/backend/scripts/portland-headshots-process.py`
- **Commit:** embedded in task commit

## Photo License Deviations

None — all 14 sources from portland.gov (public_domain). No Wikimedia fallbacks used.

## Phase 77 Completion

All 3 plans complete:
- 077-01: Portland government structure (governments + 5 chambers + LOCAL_EXEC district) — DONE
- 077-02: 16 Portland officials seeded (14 elected + 2 appointed) with office_id back-fill — DONE
- 077-03: 14 headshots uploaded, 14 politician_images rows, 14 photo_origin_url values — DONE

Phase 77 SC-4 satisfied. Profile.jsx `.find(img => img.type === 'default')` will return a headshot for all 14 elected Portland official profiles.

## Known Stubs

None — all 14 politician_images rows are wired to live Storage URLs that return HTTP 200. No placeholder or stub data.

## Threat Flags

None — this plan creates only Storage objects and DB data rows (politician_images + photo_origin_url). No new network endpoints, auth paths, schema changes at trust boundaries, or application code changes.

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/migrations/232_portland_headshots.sql` — EXISTS
- [x] File contains `BEGIN;` and `COMMIT;` wrapper — CONFIRMED
- [x] File contains exactly 14 INSERT INTO essentials.politician_images statements — CONFIRMED
- [x] File contains exactly 14 UPDATE essentials.politicians SET photo_origin_url statements — CONFIRMED
- [x] File contains all 14 external_id literals (-690001, -690002, -690010..-690021) — CONFIRMED
- [x] File does NOT contain -690003 or -690004 — CONFIRMED
- [x] All type values are 'default' — CONFIRMED (no 'headshot' literal)
- [x] All photo_license values are 'public_domain' — CONFIRMED
- [x] All URLs contain kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/ — CONFIRMED
- [x] All URLs contain -headshot.jpg — CONFIRMED
- [x] Gate 1: COUNT=14 — CONFIRMED
- [x] Gate 2: COUNT=14 type=default — CONFIRMED
- [x] Gate 3: COUNT=0 appointed excluded — CONFIRMED
- [x] Gate 4: COUNT=14 canonical URL — CONFIRMED
- [x] Gate 5: only 'public_domain' — CONFIRMED
- [x] Gate 6: COUNT=14 photo_origin_url populated — CONFIRMED
- [x] Gate 7: COUNT=0 '232' not in ledger — CONFIRMED
- [x] Gate 8: all 14 URLs return HTTP 200 — CONFIRMED

---
*Phase: 077-portland-officials*
*Completed: 2026-05-30*

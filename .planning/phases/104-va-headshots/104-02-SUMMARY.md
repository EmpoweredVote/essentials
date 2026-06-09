---
phase: 104-va-headshots
plan: "02"
subsystem: headshots
tags: [va, senators, headshots, supabase-storage, python-script]
dependency_graph:
  requires: [104-01]
  provides: [40 VA senator headshots in politician_photos Storage bucket]
  affects: [migration-315, plan-05-audit-migration]
tech_stack:
  added: []
  patterns: [PIL crop-then-resize, Supabase Storage PUT upsert, psycopg2 runtime UUID resolution]
key_files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-va-senators-headshots.py
  modified: []
decisions:
  - "Runtime UUID resolution via SELECT id FROM essentials.politicians WHERE external_id = N (no hardcoded UUIDs)"
  - "SENATE_KEY_MAP copied verbatim from 104-RESEARCH.md — all 40 keys confirmed HTTP 200"
  - "Special-case names preserved exactly: Mulchi9, Craig19, Williams Graves21, Carroll Foy33, Bennett-Parker39, VanValkenburg16, DeSteph20, McDougle26, McPike29"
metrics:
  duration: "~5 minutes"
  completed: "2026-06-08"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  storage_objects: 40
---

# Phase 104 Plan 02: VA State Senators Headshots Summary

40 VA state senator headshots downloaded from apps.senate.virginia.gov, cropped 4:5, resized 600x750 Lanczos q90, and uploaded to Supabase Storage `politician_photos` bucket — all 40 succeeded with zero failures.

## What Was Built

- `_tmp-va-senators-headshots.py`: Standalone Python script for 40 VA state senators (SD-1 through SD-40). Resolves politician UUIDs at runtime via DB query on `external_id`. Uses verified SENATE_KEY_MAP with all special-case names preserved verbatim. Produces deterministic manifest for Plan 05 (migration 315) input.
- 40 JPEG files uploaded to Supabase Storage at `politician_photos/{uuid}-headshot.jpg`, each 600x750 at JPEG q90.

## Manifest (Plan 05 Input)

```
=== VA SENATORS HEADSHOT MANIFEST ===

SUCCESS: -5110001 Timmy French cc91c3d5-18fa-478f-bb04-32d1d30dbcaf -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cc91c3d5-18fa-478f-bb04-32d1d30dbcaf-headshot.jpg
SUCCESS: -5110002 Mark D. Obenshain b7e9d159-b766-445c-b95f-9797b57247d9 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/b7e9d159-b766-445c-b95f-9797b57247d9-headshot.jpg
SUCCESS: -5110003 Christopher T. Head 7eba070e-c4ed-404b-8a74-01794b2bd9ed -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/7eba070e-c4ed-404b-8a74-01794b2bd9ed-headshot.jpg
SUCCESS: -5110004 David R. Suetterlein 8ed24df0-2a89-45d2-a236-1fe339b2a11c -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/8ed24df0-2a89-45d2-a236-1fe339b2a11c-headshot.jpg
SUCCESS: -5110005 T. Travis Hackworth cd200e06-d726-4a12-b2e8-0295700d185e -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cd200e06-d726-4a12-b2e8-0295700d185e-headshot.jpg
SUCCESS: -5110006 Todd E. Pillion eb7293ae-8a9d-4ae4-8deb-a32aa43e2c99 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/eb7293ae-8a9d-4ae4-8deb-a32aa43e2c99-headshot.jpg
SUCCESS: -5110007 William M. Stanley Jr. 1722c95b-7aed-430e-81a3-488cdf610afc -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/1722c95b-7aed-430e-81a3-488cdf610afc-headshot.jpg
SUCCESS: -5110008 Mark J. Peake ed60a0c7-252c-443f-98ff-5926bf9a58a3 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/ed60a0c7-252c-443f-98ff-5926bf9a58a3-headshot.jpg
SUCCESS: -5110009 Tammy Brankley Mulchi dcb3db81-0b8c-46ea-acdb-1d83d5c82c72 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/dcb3db81-0b8c-46ea-acdb-1d83d5c82c72-headshot.jpg
SUCCESS: -5110010 Luther H. Cifers III 19c4b37d-4552-495c-a18b-d339585e684b -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/19c4b37d-4552-495c-a18b-d339585e684b-headshot.jpg
SUCCESS: -5110011 R. Creigh Deeds 66fe0d73-731e-45b9-8db4-21e3ce9eb9fd -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/66fe0d73-731e-45b9-8db4-21e3ce9eb9fd-headshot.jpg
SUCCESS: -5110012 Glen H. Sturtevant Jr. 405de162-8de9-4aef-af9a-c323c04da698 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/405de162-8de9-4aef-af9a-c323c04da698-headshot.jpg
SUCCESS: -5110013 Lashrecse D. Aird 731049dd-0a5b-44fb-a778-b637dded0a5b -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/731049dd-0a5b-44fb-a778-b637dded0a5b-headshot.jpg
SUCCESS: -5110014 Lamont Bagby 52daeb4d-205d-426a-80a4-40e00b7ee9c0 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/52daeb4d-205d-426a-80a4-40e00b7ee9c0-headshot.jpg
SUCCESS: -5110015 Michael J. Jones e529eee5-ecec-4719-8b50-47ab9d31bc4d -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/e529eee5-ecec-4719-8b50-47ab9d31bc4d-headshot.jpg
SUCCESS: -5110016 Schuyler T. VanValkenburg 38b9461f-2f5b-45d8-ae99-626c75ae305d -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/38b9461f-2f5b-45d8-ae99-626c75ae305d-headshot.jpg
SUCCESS: -5110017 Emily M. Jordan a6774628-e5fd-423e-822a-32c2d59f09af -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/a6774628-e5fd-423e-822a-32c2d59f09af-headshot.jpg
SUCCESS: -5110018 L. Louise Lucas 0efec835-12f2-472b-b7a0-7a166ed937a1 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/0efec835-12f2-472b-b7a0-7a166ed937a1-headshot.jpg
SUCCESS: -5110019 Christie New Craig 7b7540c8-f62f-4edd-a49a-19a3f883ebd8 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/7b7540c8-f62f-4edd-a49a-19a3f883ebd8-headshot.jpg
SUCCESS: -5110020 Bill DeSteph ec4a7239-4681-4284-b77d-9c2d5c5473dd -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/ec4a7239-4681-4284-b77d-9c2d5c5473dd-headshot.jpg
SUCCESS: -5110021 Angelia Williams Graves b65454d1-6707-4d4e-be3e-27121afc8388 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/b65454d1-6707-4d4e-be3e-27121afc8388-headshot.jpg
SUCCESS: -5110022 Aaron R. Rouse 51547ab6-fee3-42c6-8418-f6fe7b67ee93 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/51547ab6-fee3-42c6-8418-f6fe7b67ee93-headshot.jpg
SUCCESS: -5110023 Mamie E. Locke 090feb66-a051-4624-8174-bf8b6272994d -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/090feb66-a051-4624-8174-bf8b6272994d-headshot.jpg
SUCCESS: -5110024 J.D. Diggs f890829a-87e9-4f2e-ae33-ce8b98bf5105 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/f890829a-87e9-4f2e-ae33-ce8b98bf5105-headshot.jpg
SUCCESS: -5110025 Richard H. Stuart 7377cc55-0db6-4b15-8c4c-b1ad79137d25 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/7377cc55-0db6-4b15-8c4c-b1ad79137d25-headshot.jpg
SUCCESS: -5110026 Ryan T. McDougle ceba2c53-8da5-4ef9-9e1b-57fdfba98f50 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/ceba2c53-8da5-4ef9-9e1b-57fdfba98f50-headshot.jpg
SUCCESS: -5110027 Tara A. Durant 70d45f9c-aef9-4cd7-be4c-5ae568e94f94 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/70d45f9c-aef9-4cd7-be4c-5ae568e94f94-headshot.jpg
SUCCESS: -5110028 Bryce E. Reeves eedc8e98-44ea-4dd0-9fc1-c83492e0d379 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/eedc8e98-44ea-4dd0-9fc1-c83492e0d379-headshot.jpg
SUCCESS: -5110029 Jeremy S. McPike 230412ca-7207-41f8-9eb0-99486f54826d -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/230412ca-7207-41f8-9eb0-99486f54826d-headshot.jpg
SUCCESS: -5110030 Danica A. Roem 2d726661-e210-42f3-8454-3cf2d3ecf811 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/2d726661-e210-42f3-8454-3cf2d3ecf811-headshot.jpg
SUCCESS: -5110031 Russet W. Perry 20a863f3-f3ca-4af8-9927-9e0d1dc14ce1 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/20a863f3-f3ca-4af8-9927-9e0d1dc14ce1-headshot.jpg
SUCCESS: -5110032 Kannan Srinivasan fabb0172-fe30-488b-b391-262499beb9ce -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/fabb0172-fe30-488b-b391-262499beb9ce-headshot.jpg
SUCCESS: -5110033 Jennifer D. Carroll Foy b3c03be3-ae7a-4393-a99b-80b63fea74d0 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/b3c03be3-ae7a-4393-a99b-80b63fea74d0-headshot.jpg
SUCCESS: -5110034 Scott A. Surovell f3ffde61-ca65-4028-8552-2d4e9a9c6055 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/f3ffde61-ca65-4028-8552-2d4e9a9c6055-headshot.jpg
SUCCESS: -5110035 David W. Marsden 8db8b2e3-9160-4c14-9b47-707a7a27e4ab -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/8db8b2e3-9160-4c14-9b47-707a7a27e4ab-headshot.jpg
SUCCESS: -5110036 Stella G. Pekarsky 522d03a0-6fe8-4f48-b68a-cc4e12eba21b -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/522d03a0-6fe8-4f48-b68a-cc4e12eba21b-headshot.jpg
SUCCESS: -5110037 Saddam Azlan Salim 74ea1eb3-d4db-4dbe-882a-88ccecade1e5 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/74ea1eb3-d4db-4dbe-882a-88ccecade1e5-headshot.jpg
SUCCESS: -5110038 Jennifer B. Boysko b4f19462-f23f-4061-831d-ec4544b5678f -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/b4f19462-f23f-4061-831d-ec4544b5678f-headshot.jpg
SUCCESS: -5110039 Elizabeth B. Bennett-Parker 612b8663-46c6-4f34-887d-0dadd06dd194 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/612b8663-46c6-4f34-887d-0dadd06dd194-headshot.jpg
SUCCESS: -5110040 Barbara A. Favola 3efead48-af98-401f-b01e-00ca9590cc3f -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/3efead48-af98-401f-b01e-00ca9590cc3f-headshot.jpg

TOTALS: VA Senators 40/40 succeeded
=== END MANIFEST ===
```

## Per-Senator Source URL + Dimensions (D-10 documentation for migration 315)

| District | Name | Source URL | Original | Crop | Resize |
|----------|------|-----------|----------|------|--------|
| SD-1 | Timmy French | apps.senate.virginia.gov/…/French1.jpg | 262x269 | 215x269 | 600x750 |
| SD-2 | Mark D. Obenshain | apps.senate.virginia.gov/…/Obenshain2.jpg | 635x710 | 568x710 | 600x750 |
| SD-3 | Christopher T. Head | apps.senate.virginia.gov/…/Head3.jpg | 262x269 | 215x269 | 600x750 |
| SD-4 | David R. Suetterlein | apps.senate.virginia.gov/…/Suetterlein4.jpg | 262x269 | 215x269 | 600x750 |
| SD-5 | T. Travis Hackworth | apps.senate.virginia.gov/…/Hackworth5.jpg | 262x269 | 215x269 | 600x750 |
| SD-6 | Todd E. Pillion | apps.senate.virginia.gov/…/Pillion6.jpg | 262x269 | 215x269 | 600x750 |
| SD-7 | William M. Stanley Jr. | apps.senate.virginia.gov/…/Stanley7.jpg | 262x269 | 215x269 | 600x750 |
| SD-8 | Mark J. Peake | apps.senate.virginia.gov/…/Peake8.jpg | 262x269 | 215x269 | 600x750 |
| SD-9 | Tammy Brankley Mulchi | apps.senate.virginia.gov/…/Mulchi9.jpg | 262x269 | 215x269 | 600x750 |
| SD-10 | Luther H. Cifers III | apps.senate.virginia.gov/…/Cifers10.jpg | 262x269 | 215x269 | 600x750 |
| SD-11 | R. Creigh Deeds | apps.senate.virginia.gov/…/Deeds11.jpg | 271x269 | 215x269 | 600x750 |
| SD-12 | Glen H. Sturtevant Jr. | apps.senate.virginia.gov/…/Sturtevant12.jpg | 262x269 | 215x269 | 600x750 |
| SD-13 | Lashrecse D. Aird | apps.senate.virginia.gov/…/Aird13.jpg | 262x269 | 215x269 | 600x750 |
| SD-14 | Lamont Bagby | apps.senate.virginia.gov/…/Bagby14.jpg | 262x269 | 215x269 | 600x750 |
| SD-15 | Michael J. Jones | apps.senate.virginia.gov/…/Jones15.jpg | 262x269 | 215x269 | 600x750 |
| SD-16 | Schuyler T. VanValkenburg | apps.senate.virginia.gov/…/VanValkenburg16.jpg | 262x269 | 215x269 | 600x750 |
| SD-17 | Emily M. Jordan | apps.senate.virginia.gov/…/Jordan17.jpg | 262x269 | 215x269 | 600x750 |
| SD-18 | L. Louise Lucas | apps.senate.virginia.gov/…/Lucas18.jpg | 262x269 | 215x269 | 600x750 |
| SD-19 | Christie New Craig | apps.senate.virginia.gov/…/Craig19.jpg | 262x269 | 215x269 | 600x750 |
| SD-20 | Bill DeSteph | apps.senate.virginia.gov/…/DeSteph20.jpg | 262x269 | 215x269 | 600x750 |
| SD-21 | Angelia Williams Graves | apps.senate.virginia.gov/…/Williams Graves21.jpg | 262x269 | 215x269 | 600x750 |
| SD-22 | Aaron R. Rouse | apps.senate.virginia.gov/…/Rouse22.jpg | 262x269 | 215x269 | 600x750 |
| SD-23 | Mamie E. Locke | apps.senate.virginia.gov/…/Locke23.jpg | 262x269 | 215x269 | 600x750 |
| SD-24 | J.D. Diggs | apps.senate.virginia.gov/…/Diggs24.jpg | 262x269 | 215x269 | 600x750 |
| SD-25 | Richard H. Stuart | apps.senate.virginia.gov/…/Stuart25.jpg | 262x269 | 215x269 | 600x750 |
| SD-26 | Ryan T. McDougle | apps.senate.virginia.gov/…/McDougle26.jpg | 262x269 | 215x269 | 600x750 |
| SD-27 | Tara A. Durant | apps.senate.virginia.gov/…/Durant27.jpg | 262x269 | 215x269 | 600x750 |
| SD-28 | Bryce E. Reeves | apps.senate.virginia.gov/…/Reeves28.jpg | 262x269 | 215x269 | 600x750 |
| SD-29 | Jeremy S. McPike | apps.senate.virginia.gov/…/McPike29.jpg | 262x269 | 215x269 | 600x750 |
| SD-30 | Danica A. Roem | apps.senate.virginia.gov/…/Roem30.jpg | 262x269 | 215x269 | 600x750 |
| SD-31 | Russet W. Perry | apps.senate.virginia.gov/…/Perry31.jpg | 262x269 | 215x269 | 600x750 |
| SD-32 | Kannan Srinivasan | apps.senate.virginia.gov/…/Srinivasan32.jpg | 262x269 | 215x269 | 600x750 |
| SD-33 | Jennifer D. Carroll Foy | apps.senate.virginia.gov/…/Carroll Foy33.jpg | 474x535 | 428x535 | 600x750 |
| SD-34 | Scott A. Surovell | apps.senate.virginia.gov/…/Surovell34.jpg | 262x269 | 215x269 | 600x750 |
| SD-35 | David W. Marsden | apps.senate.virginia.gov/…/Marsden35.jpg | 262x269 | 215x269 | 600x750 |
| SD-36 | Stella G. Pekarsky | apps.senate.virginia.gov/…/Pekarsky36.jpg | 262x269 | 215x269 | 600x750 |
| SD-37 | Saddam Azlan Salim | apps.senate.virginia.gov/…/Salim37.jpg | 262x269 | 215x269 | 600x750 |
| SD-38 | Jennifer B. Boysko | apps.senate.virginia.gov/…/Boysko38.jpg | 269x269 | 215x269 | 600x750 |
| SD-39 | Elizabeth B. Bennett-Parker | apps.senate.virginia.gov/…/Bennett-Parker39.jpg | 262x269 | 215x269 | 600x750 |
| SD-40 | Barbara A. Favola | apps.senate.virginia.gov/…/Favola40.jpg | 269x269 | 215x269 | 600x750 |

**Dimension notes:**
- Most senators: 262x269 (standard senate website thumbnail)
- SD-2 Obenshain: 635x710 (higher resolution source — excellent quality)
- SD-11 Deeds: 271x269 (slightly wider than standard)
- SD-33 Carroll Foy: 474x535 (larger source image — good quality)
- SD-38 Boysko, SD-40 Favola: 269x269 (square source; crop applied)
- All others: ~262x269, upscaled via Lanczos; quality consistent with CA/MD senate precedent

## Anomalous Name Senators — All Succeeded

| Senator | District | Key Used | Result |
|---------|----------|----------|--------|
| Tammy Brankley Mulchi | SD-9 | `Mulchi9` | SUCCESS |
| Christie New Craig | SD-19 | `Craig19` | SUCCESS |
| Angelia Williams Graves | SD-21 | `Williams Graves21` (space) | SUCCESS |
| Schuyler T. VanValkenburg | SD-16 | `VanValkenburg16` | SUCCESS |
| Jennifer D. Carroll Foy | SD-33 | `Carroll Foy33` (space) | SUCCESS |
| Elizabeth B. Bennett-Parker | SD-39 | `Bennett-Parker39` (hyphen) | SUCCESS |

## Quality Notes

Most senators have small ~262x269px source images (standard VA senate website thumbnail size). These are upscaled approximately 2.8x to reach 600x750. Quality is acceptable per the v7.0 California precedent established in prior phases. Three senators (Obenshain SD-2, Carroll Foy SD-33) had larger source images with noticeably better quality.

None of the 40 required quality follow-up or fallback to D-06 sources.

## Gaps for Plan 05

None — all 40 senators succeeded. No fallback URLs needed.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- Script file exists: C:/EV-Accounts/backend/scripts/_tmp-va-senators-headshots.py — FOUND
- Script ran to completion with exit code 0 — CONFIRMED
- Manifest contains exactly 40 SUCCESS lines — CONFIRMED
- 0 FAILED lines — CONFIRMED
- "TOTALS: VA Senators 40/40 succeeded" in output — CONFIRMED
- 5 CDN spot-checks (SD-1, SD-9, SD-21, SD-33, SD-39) all HTTP 200 — CONFIRMED
- SUMMARY.md created at .planning/phases/104-va-headshots/104-02-SUMMARY.md — FOUND

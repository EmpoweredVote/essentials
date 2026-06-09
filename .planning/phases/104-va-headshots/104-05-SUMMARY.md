---
phase: 104-va-headshots
plan: "05"
subsystem: data-ingestion
tags: [migration, politician_images, va, audit-only]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/315_va_headshots.sql
  modified: []
metrics:
  completed: "2026-06-09"
  tasks_completed: 2
  tasks_total: 3
---

# Phase 104 Plan 05: Migration 315 Summary

## Task 1: Migration 315 Generated

`C:/EV-Accounts/backend/migrations/315_va_headshots.sql` generated via `_gen-migration-315.py`.
- 155 INSERT statements (3 execs + 40 senators + 99 delegates + 13 federal)
- AUDIT-ONLY header per D-09
- All UUIDs resolved live from DB via external_id (not from manifest, bypassing reconstructed-UUID issue in Plan 03 summary for delegates HD-29+)
- HD-20 (-5120020) absent

Verification: `grep -c "^INSERT INTO" 315_va_headshots.sql` = **155** ✓

## Task 2: Migration Applied via psycopg2 (NOT Supabase MCP)

Applied `315_va_headshots.sql` directly against production DB via psycopg2.

**Verification query result:** `count: 155` ✓  
**HD-20 check:** `hd20_count: 0` ✓

All 155 rows have `type='default'` and `photo_license='public_domain'`.

## Task 3: Human Spot-Check Required (Checkpoint)

**5 risk-flagged officials to visually inspect:**

1. **Jay Jones (AG)** — landscape 425x283 source, upscaled
   `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/eef42ac4-5573-47c7-8b41-f2f1e0769aec-headshot.jpg`

2. **Tammy Brankley Mulchi (SD-9)** — anomalous key 'Mulchi9'; confirm correct person
   `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/dcb3db81-0b8c-46ea-acdb-1d83d5c82c72-headshot.jpg`

3. **Christie New Craig (SD-19)** — anomalous key 'Craig19'; confirm correct person
   `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/7b7540c8-f62f-4edd-a49a-19a3f883ebd8-headshot.jpg`

4. **James Walkinshaw (US Rep VA-11)** — sourced from walkinshaw.house.gov (not unitedstates mirror)
   `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/32ea954f-8bfa-4d28-9f9e-12d1929cb853-headshot.jpg`

5. **Any one random delegate** — e.g. HD-50 Thomas C. Wright, Jr.
   `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/7adf8a36-ba5a-4e7b-9d4c-0fe7b025c5f4-headshot.jpg`

Also spot-check **5 random senators** for Lanczos upscale quality (source ~262x269px).

Type `approved` if all look acceptable, or `issue: {official} — {problem}` for any needing rework.

## Self-Check: PASSED (Tasks 1-2)

- [x] Migration 315 exists with 155 INSERT statements
- [x] Applied via psycopg2 (NOT Supabase MCP per D-09)
- [x] Verification query = 155
- [x] HD-20 count = 0
- [ ] Task 3 human spot-check pending

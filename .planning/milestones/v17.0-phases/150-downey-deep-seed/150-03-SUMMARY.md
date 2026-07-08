---
phase: 150-downey-deep-seed
plan: 03
type: execute
status: awaiting-checkpoint
completed: pending-human-verify
migration: 993_downey_headshots.sql (AUDIT-ONLY — not registered; ledger stays 992)
checkpoint: human-verify PENDING
tags: [headshots, downey, wave-3, audit-only, operator-download, waf-403]
subsystem: politician_images / Storage
requires: ["150-02"]
provides: ["headshots for all 5 current Downey council members"]
affects: ["essentials.politician_images", "essentials.politicians.photo_origin_url", "Supabase Storage politician_photos"]
tech-stack:
  added: []
  patterns: ["operator-download (WAF-403 bypass)", "4:5 crop FIRST -> 600x750 Lanczos q90", "audit-only migration"]
key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/993_downey_headshots.sql"
  modified:
    - "essentials.politician_images (5 rows inserted)"
    - "essentials.politicians.photo_origin_url (5 rows updated)"
decisions:
  - "migration numbered 993 not 987 — plan was authored before Plans 01/02 used 990-992; on-disk MAX at apply time was 992"
  - "schema_migrations MAX = 992 post-migration (headshot file is audit-only, did not register)"
  - "Trujillo source was 151x189 (low-res small thumbnail) — only available official source; upscaled Lanczos"
  - "photo_license='press_use' for all 5 — government-produced official council portraits from downeyca.org"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-06-20"
  tasks_completed: 2
  files_created: 1
---

# Phase 150 Plan 03: Downey Headshots Summary

## One-liner

Operator-downloaded official downeyca.org portraits for all 5 Downey council members, processed 4:5→600×750 Lanczos q90, uploaded to Supabase Storage, inserted via audit-only migration 993.

## What was done

**Task 1 — Pre-flight + image processing + upload:**

Pre-flight confirmed all 5 current Downey members (Ortiz D1, Sosa D2, Pemberton D3, Frometa D4/Mayor, Trujillo D5) had 0 `type='default'` images — full greenfield confirmed. schema_migrations MAX = 992 (Plans 01 and 02 used migrations 990/991 structural + 992 mayor-correction structural).

All 5 portraits sourced from operator in-browser downloads staged at `C:\tmp\govheadshots\Downey\` as `.jfif` (JPEG format). downeyca.org is WAF-403 to all curl (CivicPlus/CivicEngage behind Cloudflare WAF), so operator in-browser was the correct path for all 5 (no SCAG fallback needed — the operator already staged all portraits including Frometa).

Processing pipeline per image:
- Opened JFIF as JPEG via Pillow
- Calculated 4:5 crop (crop height from top where image is too tall; crop width centered where too wide)
- Resized to 600×750 Lanczos, quality 90
- Uploaded to `politician_photos/{uuid}-headshot.jpg` via service-role key, x-upsert:true
- All 5 returned HTTP 200 on upload; verified HTTP 200 on public CDN HEAD check

**Task 2 — Migration 993 applied (audit-only):**

Wrote and applied `993_downey_headshots.sql` via raw SQL (psycopg2 direct Postgres connection). Migration inserts 5 `politician_images` rows (one per member, guarded `WHERE NOT EXISTS`) and updates `photo_origin_url` on all 5 politicians. Did NOT register in `schema_migrations` — ledger stays 992.

Post-migration verification confirmed each of the 5 members has `n_default=1` and schema_migrations MAX = 992 (unchanged).

## Headshot inventory

| Seat | Member | ext_id | UUID (prefix) | src res | result |
|------|--------|--------|---------------|---------|--------|
| D1 / Mayor Pro Tem | Horacio Ortiz | -700991 | 13dc32dd | 900x1146 | good |
| D2 / Councilmember | Hector Sosa | 675353 | 92d68971 | 1920x2443 | excellent |
| D3 | Dorothy Pemberton | 675360 | 71c35909 | 900x1146 | good |
| D4 / Mayor | Claudia Frometa | 675361 | 4967617f | 900x1145 | good |
| D5 | Mario Trujillo | -201200 | 06b1dae6 | 151x189 | low-res (only source) |

Source: all 5 from official downeyca.org council pages, operator-downloaded (WAF-403 bypass). License: `press_use` for all (government-produced official portraits).

## Honest gaps

- **Mario Trujillo (D5):** Source image is 151×189 pixels — the smallest of the 5. Upscaled to 600×750 via Lanczos; portrait renders acceptably but will appear soft compared to others. No higher-resolution source was available at this time. Accepted per honest-gap rule (this is the official portrait, not a wrong-person image).

## Identity verification

- **Horacio Ortiz (D1):** Confirmed the portrait is a young man in a blue suit — clearly NOT the prior D1 occupant Timothy Horn (stale downeyca.org slug 'timonthy-horn-district-1'). Operator labeled the file "Horacio Ortiz.jfif" from the official page. Image shows a young Hispanic man consistent with publicly available references.
- **Dorothy Pemberton (D3):** Confirmed the portrait is a woman — clearly NOT a placeholder despite the downeyca.org slug 'vacant-district-3'. Operator-labeled from the official page.
- All 5 portraits: no superimposed text or graphics; professional studio headshots; eyes approximately 1/3 from top; full head + shoulders visible; not distorted.

## Deviations from Plan

### Migration number change (auto-tracked)

The original plan (150-03-PLAN.md) specified migration `987_downey_headshots.sql` — it was authored before Plans 01 and 02 executed and consumed migrations 990 (reconcile, structural), 991 (complete, structural), and 992 (mayor correction, structural). The actual on-disk MAX at apply time was 992, so this headshot migration was correctly numbered **993**.

### Mayor correction context (mig 992, applied before this wave)

Migration 992 (`992_downey_mayor_correction.sql`, STRUCTURAL, registered in schema_migrations) corrected the rotational Mayor assignment:

- **Research originally had Hector Sosa (D2) as Mayor.** The operator confirmed against the official downeyca.org city site that **Claudia Frometa (D4)** is the current rotational Mayor, not Sosa.
- Sosa (D2) is Councilmember; Ortiz (D1) is Mayor Pro Tem.
- This structural correction was applied as mig 992 (registered) before this headshot wave.
- The headshot identities are per-person and are unaffected by the title correction — files were labeled by name, not by title.

### All 5 from operator in-browser (no SCAG curl needed)

The original plan specified sourcing Frometa via direct SCAG curl and the other 4 via operator in-browser. The operator staged ALL 5 portraits (including Frometa) from the downeyca.org city council pages directly. The SCAG fallback was not needed since the operator had the official portrait available.

### schema_migrations MAX

At apply time, schema_migrations MAX = 992 (not 986 as the plan context stated — the context was written before Plans 01/02 ran). The headshot migration is audit-only and did not change this. Post-migration MAX = 992 confirmed.

## Verification

- Pre-flight: all 5 members confirmed at 0 default images before apply
- Post-migration: all 5 members have exactly 1 `type='default'` image at canonical `{uuid}-headshot.jpg`
- schema_migrations MAX = 992 (audit-only confirmed — unchanged by migration 993)
- All 5 Storage objects: HTTP 200 on public CDN HEAD check
- Image dimensions: all processed to exactly 600×750 (verified by Pillow `img.size`)
- Identity traps resolved: Ortiz confirmed NOT Timothy Horn; Pemberton confirmed NOT a placeholder
- photo_origin_url set to official downeyca.org council page for all 5

## Self-Check: PASSED

- Migration file exists: `C:/EV-Accounts/backend/migrations/993_downey_headshots.sql` — FOUND
- SUMMARY.md: `.planning/phases/150-downey-deep-seed/150-03-SUMMARY.md` — FOUND
- All 5 Storage objects accessible (HTTP 200 verified above)
- schema_migrations MAX = 992, unchanged (audit-only confirmed)
- All 5 members: n_default = 1 (post-apply DB query confirmed)
- Awaiting: human-verify checkpoint (Task 3)

---
phase: 104
slug: va-headshots
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-08
---

# Phase 104 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | N/A — data ingestion phase; no unit tests |
| **Config file** | none |
| **Quick run command** | SQL verification query (see below) |
| **Full suite command** | SQL verification query + spot-check Storage URLs |
| **Estimated runtime** | ~2 minutes (SQL + manual spot-check) |

---

## Sampling Rate

- **After each script run:** Run the per-group SQL count query
- **After all 4 scripts:** Run the full VA headshot count query
- **Before `/gsd-verify-work`:** Full count query must return 155 rows (HD-20 vacant = skip)
- **Max feedback latency:** 2 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| execs | 01 | 1 | VA-GOV-06 | 3 exec headshots uploaded | SQL | `SELECT COUNT(*) FROM politician_images WHERE politician_id IN (SELECT id FROM politicians WHERE external_id IN (-510001,-510002,-510003))` | ⬜ pending |
| senators | 02 | 1 | VA-GOV-06 | 40 senator headshots uploaded | SQL | `SELECT COUNT(*) FROM politician_images WHERE politician_id IN (SELECT id FROM politicians WHERE external_id BETWEEN -5110001 AND -5110040)` | ⬜ pending |
| delegates | 03 | 1 | VA-GOV-06 | 99 delegate headshots uploaded (HD-20 skipped) | SQL | `SELECT COUNT(*) FROM politician_images WHERE politician_id IN (SELECT id FROM politicians WHERE external_id BETWEEN -5120001 AND -5120100 AND external_id != -5120020)` | ⬜ pending |
| federal | 04 | 1 | VA-GOV-06 | 13 federal headshots uploaded | SQL | `SELECT COUNT(*) FROM politician_images WHERE politician_id IN (SELECT id FROM politicians WHERE external_id IN (-510079,-510080,-5102001,-5102002,-5102003,-5102004,-5102005,-5102006,-5102007,-5102008,-5102009,-5102010,-5102011))` | ⬜ pending |
| migration | 05 | 2 | VA-GOV-06 | 315_va_headshots.sql has 155 WHERE NOT EXISTS INSERTs | SQL | `SELECT COUNT(*) FROM politician_images pi JOIN politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -5120100 AND -400079` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — existing infrastructure covers all phase requirements. No test framework installation needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 155 Storage URLs resolve HTTP 200 | VA-GOV-06 | Storage URL validation requires HTTP calls | Spot-check 5-10 URLs from politician_images.url |
| Jay Jones headshot quality (landscape source 425×283px) | VA-GOV-06 | Visual quality check needed for upscaled result | Open the uploaded Jay Jones headshot; confirm it doesn't look blurry |
| Senate anomalous names render correctly | VA-GOV-06 | Special characters in filenames | Verify Brankley Mulchi, Williams Graves, Carroll Foy, VanValkenburg uploaded |

---

## Full Post-Run Verification Query

```sql
-- Expected: 155 rows (156 officials minus HD-20 vacant)
SELECT COUNT(*) as va_headshot_count
FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE p.external_id IN (
  -- 3 execs
  -510001, -510002, -510003,
  -- 40 senators
  -5110001, -5110002, -5110003, -5110004, -5110005,
  -5110006, -5110007, -5110008, -5110009, -5110010,
  -5110011, -5110012, -5110013, -5110014, -5110015,
  -5110016, -5110017, -5110018, -5110019, -5110020,
  -5110021, -5110022, -5110023, -5110024, -5110025,
  -5110026, -5110027, -5110028, -5110029, -5110030,
  -5110031, -5110032, -5110033, -5110034, -5110035,
  -5110036, -5110037, -5110038, -5110039, -5110040,
  -- 99 delegates (HD-20 = -5120020 excluded, is_vacant=true)
  -5120001, -5120002, -5120003, -5120004, -5120005,
  -5120006, -5120007, -5120008, -5120009, -5120010,
  -5120011, -5120012, -5120013, -5120014, -5120015,
  -5120016, -5120017, -5120018, -5120019,
  -5120021, -5120022, -5120023, -5120024, -5120025,
  -5120026, -5120027, -5120028, -5120029, -5120030,
  -5120031, -5120032, -5120033, -5120034, -5120035,
  -5120036, -5120037, -5120038, -5120039, -5120040,
  -5120041, -5120042, -5120043, -5120044, -5120045,
  -5120046, -5120047, -5120048, -5120049, -5120050,
  -5120051, -5120052, -5120053, -5120054, -5120055,
  -5120056, -5120057, -5120058, -5120059, -5120060,
  -5120061, -5120062, -5120063, -5120064, -5120065,
  -5120066, -5120067, -5120068, -5120069, -5120070,
  -5120071, -5120072, -5120073, -5120074, -5120075,
  -5120076, -5120077, -5120078, -5120079, -5120080,
  -5120081, -5120082, -5120083, -5120084, -5120085,
  -5120086, -5120087, -5120088, -5120089, -5120090,
  -5120091, -5120092, -5120093, -5120094, -5120095,
  -5120096, -5120097, -5120098, -5120099, -5120100,
  -- 13 federal (Warner=-400080, Kaine=-400079, 11 reps)
  -400079, -400080,
  -5102001, -5102002, -5102003, -5102004, -5102005,
  -5102006, -5102007, -5102008, -5102009, -5102010,
  -5102011
)
AND pi.type = 'default';
```

---

## Validation Sign-Off

- [ ] All tasks have SQL verify or manual spot-check protocol
- [ ] Sampling continuity: each script run followed immediately by count query
- [ ] No automated test framework needed (data ingestion phase)
- [ ] Full count query returns 155 before migration is marked complete
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

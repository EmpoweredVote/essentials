# 151-02 SUMMARY — El Monte roster complete (migration 1001)

**Status:** COMPLETE ✓ (applied live + verified idempotent + committed to EV-Accounts)
**Migration:** `1001_elmonte_complete.sql` (STRUCTURAL, registered `schema_migrations.version='1001'`); EV-Accounts commit `caeb06dd`.
**Date:** 2026-06-21

## What was done
1. **Created Marisol Cortez** — politician `external_id=-701001` (resolved free at apply time; only `-700991` Downey/Ortiz was taken in range), `first_name='Marisol'`, `last_name='Cortez'`, `is_active=true`, `is_incumbent=true`, `source='ci.el-monte.ca.us'`. She is the **D6 council incumbent** (elected Nov 2022, term Nov 2026) — she LOST the 2024 mayor race to Ancona but kept her D6 seat. NOT modeled as a Mayor.
2. **Seated Cortez** into a NEW District 6 office in survivor chamber `5ca38f3a` on the Plan-01 District 6 row `0e2b4e3b`, title `'Councilmember'`; both pointers set.
3. **Repaired 4 NULL back-pointers** (Crippen-Thomas, Herrera, Galvan, Ancona); Longoria + Ruedas guarded (already correct).
4. **official_count = 6** on the survivor chamber — the 6 council district seats; the directly-elected Mayor (Ancona) is the 7th office but EXCLUDED (Pasadena/Pomona precedent, RESEARCH §Pitfall 3; supersedes the VALIDATION.md=7 note).
5. **No unlink** — no departed/stale member surfaced (Cortez was net-new). No politician/stance/image rows deleted.

## Final roster (7 seats, all is_active, bidirectional links consistent)
| Seat | Politician | ext_id | Office | District UUID |
|------|-----------|--------|--------|---------------|
| D1 | Crippen-Thomas | -201202 | 211af77a | ee390480 |
| D2 | Herrera | -201204 | 7e9eac5e | ed9d15d1 |
| D3 | Ruedas | 657390 | 06d458fe | 717a7d6d |
| D4 | Longoria | 657386 | 3040818a | 12026291 |
| D5 | Galvan | -201203 | 3ffcb893 | 7c450725 |
| **D6** | **Cortez (NEW)** | **-701001** | (new office) | 0e2b4e3b |
| Mayor | Ancona | -200669 | 57d646fc | 2c00ef36 (LOCAL_EXEC) |

## Verification (all green)
- 7 active members with consistent bidirectional links (`pol_ptr_ok` + `off_ptr_ok` true for all 7); 7 occupied offices.
- Cortez created (1 row), seated on District 6, title 'Councilmember' (not Mayor).
- Ancona LOCAL_EXEC 'El Monte Mayor' untouched; exactly 1 LOCAL_EXEC office under the gov.
- official_count=6; split-section check 0 rows; migration 1001 registered.
- Idempotent: re-apply changed 0 rows, no duplicate Cortez/office.

## For Plan 03 (headshots)
- All 7 current members need headshot verification. **Cortez (-701001) is brand-new → no image yet** (greenfield for her; source documentId 7435 per RESEARCH). The other 6 each have 1 pre-existing image of unverified dimensions.
- Cortez politician UUID: query `SELECT id FROM essentials.politicians WHERE external_id=-701001` at apply time (gen_random_uuid — not hardcoded here).
- No-WAF direct curl: `ci.el-monte.ca.us/ImageRepository/Document?documentId=NNNN` — 7434 Ancona, 7431 Crippen-Thomas (D1), 7432 Herrera (D2), 7433 Ruedas (D3), 7430 Longoria (D4), 7429 Galvan (D5), 7435 Cortez (D6).

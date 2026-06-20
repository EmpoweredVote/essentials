---
phase: 147
slug: pomona-deep-seed
status: passed
verified: 2026-06-20
requirements: [POMO-01]
---

# Phase 147 — Pomona Deep-Seed — VERIFICATION

**Verdict: PASSED.** All 5 success criteria independently verified against the live Supabase DB (2026-06-20).
POMO-01 satisfied end-to-end: government structure + roster + headshots + evidence-only stances. Both human-verify
checkpoints (headshots, stances) approved by the user.

## Success Criteria

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| 1 | governments row + chamber + current Mayor + full council linked to geo_id 0658072 | gov `3c2c2a4b` geo_id=`0658072`; exactly 1 `City Council` chamber (`ddabfccc`); official_count=7; 7 offices seated | ✅ |
| 2 | structure matches Pomona's real form (district vs at-large, seat count, mayor type) | 6 LOCAL single-member districts (D1–D6) + 1 directly-elected Mayor office on the `Pomona Mayor` LOCAL_EXEC district — matches Pomona's verified directly-elected-mayor + 6-district form (Lancaster model, not rotational) | ✅ |
| 3 | headshots 600×750 for all with available portrait; honest gaps | 7/7 members have exactly one `type='default'` 600×750 image at the canonical `{uuid}-headshot.jpg` path; 0 wrong-person/stale (`/2025/02/638723568`) URLs; no gaps needed | ✅ |
| 4 | evidence-only stances; 100% citation; honest blanks | 32 stances across 7 members (10/6/7/2/4/2/1); 0 uncited; 0 judicial/retired/non-live topics; 0 defaulted values; extensive honest blanks | ✅ |
| 5 | browse view renders roster (photos) + stances; no duplicate/stale rows | split-section check 0 rows; 7 consistent bidirectional office links; no duplicate chamber/orphan district rows; data correct for render | ✅ |

## Migration footprint
- **Structural (registered in schema_migrations):** 926 (reconcile), 927 (roster). Ledger MAX now **927**.
- **Audit-only (NOT registered):** 928 (headshots), 929–935 (stances). On-disk file counter authoritative; next number = **936**.

## Roster (final)
Mayor Tim Sandoval (-200916) · D1 Debra Martin (675752) · D2 Victor Preciado (675753) · D3 Nora Garcia (-201350) ·
D4 Elizabeth Ontiveros-Cole (-700658, created) · D5 Steve Lustro (-201352) · D6 Lorraine Canales (675765).

## Notes
- Pomona-specific deviations from the Palmdale template handled cleanly: 3-office chamber move, shared-district UUID `35d17606` split (Garcia D3 / new D5 Lustro), directly-elected Mayor reused (no rotational flag), WAF-403 headshot sourcing via PCE-2020/campaign/existing-DB photos.
- Canales rent-regulation left an honest blank (NO vote without documented reasoning); Ontiveros-Cole rent-regulation=5 and Martin economic-development=5 flagged at checkpoint and approved.

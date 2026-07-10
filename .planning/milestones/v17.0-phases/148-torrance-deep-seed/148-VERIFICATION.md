---
phase: 148
slug: torrance-deep-seed
status: passed
verified: 2026-06-20
requirements: [TORR-01]
---

# Phase 148 — Torrance Deep-Seed — VERIFICATION

**Verdict: PASSED.** All success criteria independently verified against the live Supabase DB (2026-06-20).
TORR-01 satisfied end-to-end: government structure + roster + headshots + evidence-only stances. Both
human-verify checkpoints (headshots, stances) approved by the user. This was a RECONCILE (not greenfield)
under two user overrides (current-seated roster; AT-LARGE form), both honored.

## Success Criteria

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| 1 | gov row + single chamber + current Mayor + full 7-member council linked to geo_id 0680000 | gov `b3e97e65` geo_id=`0680000`; exactly 1 `City Council` chamber (`f6fcb0ba`, doomed `2583b565` deleted); official_count=7; 7 offices, all bidirectionally linked | ✅ |
| 2 | structure matches Torrance's real form (AT-LARGE, not by-district; directly-elected Mayor) | 6 `At-Large` LOCAL district rows (each office on a distinct row; Sheikh repointed to new `f0344be1`, Mattucci keeps `84e45ab7`) + 1 directly-elected Mayor office on the `Torrance Mayor` LOCAL_EXEC district `a99b86b0`; NO `District N` relabels, NO `District 5` (AT-LARGE override honored) | ✅ |
| 3 | duplicate-person + duplicate-chamber defects removed | Brigitte-Lewis typo duplicate (-201101 / `7f74014f` + office `bf157ee7` + 1 contact row) deleted; real Bridgett Lewis (683366) kept; duplicate chamber merged via move-3-then-delete; split-section check 0 rows | ✅ |
| 4 | headshots 600×750 for all 7; honest gaps; correct person | 7/7 members have exactly one `type='default'` press_use 600×750 image at canonical `{uuid}-headshot.jpg`; identity-verified + human-approved; 0 gaps. (6 from operator-supplied official torranceca.gov portraits, upscaled from 150² thumbnails — WAF blocked direct fetch; Sheikh high-res from SCAG) | ✅ |
| 5 | evidence-only stances; 100% citation; honest blanks; no judicial | 19 stances across 7 members (Kalani/Sheikh/Kaji 4, Chen 3, Mattucci 2, Lewis/Gerson 1); 0 uncited; 0 judicial-* / retired / non-live topics; 0 rent-regulation; 0 defaulted values; extensive honest blanks; chairs model | ✅ |
| 6 | roster + stances render correctly; no duplicate/stale/orphan rows | single chamber, 7 consistent bidirectional office links, distinct At-Large rows, LOCAL_EXEC Mayor preserved; split-section check 0 rows | ✅ |

## Roster (final, current-seated — ROSTER OVERRIDE honored)
Mayor George Chen (-201036) · Jeremy Gerson (683376) · Jon Kaji (683364) · Sharon Kalani (683370, councilmember — NOT Mayor) · Bridgett Lewis (683366) · Aurelio Mattucci (-201103) · Asam Sheikh (-201102). Chen + Mattucci seated (NOT retired); no Betty Lieu; no Kalani-as-Mayor.

## Migration footprint
- **Structural (registered in schema_migrations):** 936 (reconcile), 937 (roster). Ledger MAX now **937**.
- **Audit-only (NOT registered):** 938 (headshots), 939–945 (stances). On-disk file counter authoritative; next number = **946**.

## Gates
- **Code review:** no-op — no application source changed (only `.planning/` docs + non-git SQL in `C:/EV-Accounts`).
- **Regression / schema-drift:** no-op — data-seeding phase; no repo schema files changed (DB mutated directly via service-role); no relevant automated test suite.
- **Security:** DB-seeding via trusted operator; no new external attack surface (threat models in plans; all Tampering threats mitigated by UUID-scoped writes, idempotent guards, STOP-on-drift pre-flight).

## Deviations from RESEARCH (documented)
- RESEARCH §7 "torranceca.gov NO WAF" was WRONG — Akamai WAF-403 blocks curl/WebFetch/PowerShell. Headshots sourced via operator in-browser download (150² official thumbnails upscaled) + SCAG for Sheikh.
- WebSearch was DOWN during Waves 3–4; stance research done via WebFetch on torrancewatch.org race pages (authoritative per-member votes), cross-validated against RESEARCH §8.
- "Mattucci military-style camp" proposal unverifiable → not asserted (honest omission).

## Follow-ups (non-blocking)
- Swap 6 upscaled headshots for full-res `/files/assets/` torranceca.gov versions when accessible.
- Deepen thin records (Lewis/Gerson) + revisit Mattucci public-safety / Kaji Pride when WebSearch/primegov accessible.

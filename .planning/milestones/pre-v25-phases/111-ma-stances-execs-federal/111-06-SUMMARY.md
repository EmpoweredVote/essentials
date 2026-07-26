---
plan: 111-06
phase: 111-ma-stances-execs-federal
status: complete
completed: 2026-06-11
migrations_applied: [372, 373, 374, 375]
requirements_addressed: [MA-STANCES-02]
---

## Summary

Applied stance migrations 372–375 for MA House reps MA-06 through MA-09 (Seth Moulton, Ayanna Pressley, Stephen Lynch, Bill Keating). All 4 processed sequentially per D-08. MA-STANCES-02 fully closed — all 11 MA federal officials seeded.

## Per-Rep Results

| Rep | District | external_id | Migration | Stances | Unpaired | Uncited | Gate |
|-----|----------|-------------|-----------|---------|----------|---------|------|
| Seth Moulton | MA-06 | -200206 | 372 | 35 | 0 | 0 | PASS |
| Ayanna Pressley | MA-07 | -200207 | 373 | 41 | 0 | 0 | PASS |
| Stephen Lynch | MA-08 | -200208 | 374 | 27 | 0 | 0 | PASS |
| Bill Keating | MA-09 | -200209 | 375 | 19 | 0 | 0 | PASS |

All ≥8 stances required. All pass 100% citation rate. Zero unpaired rows.

## Quality Gates

- D-08 sequential: ✓ Moulton → Pressley → Lynch → Keating (one at a time)
- D-06 immediate apply: ✓ each migration applied immediately after research
- D-10 100% citation: ✓ uncited = 0 across all 4
- D-01 evidence-only: ✓ no neutral defaults inserted

## Migration Files

- `372_moulton_stances.sql` — Armed Services record; ukraine-support, national security, economic-development
- `373_pressley_stances.sql` — Progressive Caucus; civil-rights, housing, healthcare, abortion, voting-rights, deportation
- `374_lynch_stances.sql` — Financial Services; economic-development, taxes, social-security; more centrist positions on several topics
- `375_keating_stances.sql` — Foreign Affairs; ukraine-support, immigration, climate-change, coastal MA economy

## MA-STANCES-02 Closure

All 11 MA federal officials now seeded: Warren (43) + Markey (43) + Neal (43) + McGovern (43) + Trahan (43) + Auchincloss (43) + Clark (43) + Moulton (35) + Pressley (41) + Lynch (27) + Keating (19).

## Self-Check: PASSED

- All 4 reps verified in production: answer_count ≥ 8, unpaired = 0, uncited = 0
- Temp files deleted
- Migration 375 file reconstructed from DB and written to EV-Accounts

# 152-04 SUMMARY — West Covina Stances (Wave 4)

**Status:** ✅ Complete (pending blocking human-verify checkpoint)
**Requirement:** WCOV-01
**Migrations:** 1013–1017 (AUDIT-ONLY — NOT registered; ledger stays 1011; all committed to EV-Accounts)
**Date:** 2026-06-21

## Outcome — 17 evidence-only stances across all 5 members; 100% citation; 0 judicial; honest blanks preserved
| Member | Seat | Stances | Topics |
|---|---|---|---|
| Tony Wu | D5 | 6 | public-safety(4), economic-dev(4), growth-and-dev(4), homelessness-response(3), housing(3), taxes(3) |
| Ollie Cantos | D4 (MPT) | 3 | public-safety(4), homelessness-response(3), economic-dev(4) |
| Letty Lopez-Viado | D2 (Mayor) | 4 | public-safety(4), homelessness/criminalization(4), economic-dev(4), taxes(4) |
| Rosario Diaz | D3 | 1 | public-safety(4) |
| Brian Gutierrez | D1 | 3 | public-safety(4), homelessness-response(3), economic-dev(4) |

## Method / discipline
- **ONE research agent at a time** (sequential; no parallel — rate-limit discipline). Each agent mined the official's own public record (westcovina.gov/Granicus, SGV Tribune, Ballotpedia, BallotReady, campaign material, RespectAbility/ABA for Cantos) and matched evidence to compass **chairs** (value = the chair the evidence matches, not a polarity axis).
- **Evidence-only / 100% citation:** all 17 answers have a paired `inform.politician_context` with reasoning + ≥1 real source URL (verified: 0 uncited).
- **No judicial topics** (West Covina = council-manager, appointed City Attorney): 0 judicial/retired-topic rows.
- **Honest blanks preserved (not padded):** the thin Nov-2024 members came back light — Diaz 1 stance, Gutierrez 3. All federal/state-only topics left blank for every member.
- **rent-regulation:** left blank for all 5 (no known active West Covina RSO — no manufactured stance).
- **Pre-tenure discipline:** Diaz/Gutierrez scored only from their own 2024 campaign + post-Nov-2024 record.
- **Wrong-person guard:** the Gutierrez agent was explicitly disambiguated from the Chicago Fire soccer player.

## Items to scrutinize at the human-verify checkpoint
- **Lopez-Viado `taxes`=4** is the softest mapping — her cited evidence ("controlling spending," "not too hard on businesses") leans 4 but sits between chairs 3 and 4. Flagged for your review.
- All other placements rest on direct, quoted, individually-attributed evidence.

## Verification (all green)
- total stances = 17 · uncited = 0 (100% citation) · judicial/retired-topic rows = 0
- migrations 1013–1017 applied via raw SQL, NOT registered (ledger stays 1011) ✓ · all committed to EV-Accounts ✓
- idempotent (ON CONFLICT DO UPDATE)

## WCOV-01 — satisfied end-to-end
Government structure (reconcile, by-district D1–D5) + roster (Mayor/MPT titles, official_count=5) + headshots (5/5, wrong-person fixed) + evidence-only stances (17, 100% cited, honest blanks). Phase 152 complete.

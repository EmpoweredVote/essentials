# Phase 135: South Gate Stances - Research

**Researched:** 2026-06-16 · **Confidence:** MEDIUM-HIGH (thin public records)

## Summary
Evidence-only stances for 5 South Gate Council members. South Gate (~95k, southeast LA County; heavily Latino, working-class). **Rotational mayor** — all "Council Member" (LOCAL). Public records are thin for several members (small-city, low online footprint). Per the evidence-only rule, members with no findable directional positions get fewer stances or a zero-INSERT ledger file (no defaulting). Wave 0: no excluded officials, 0 pre-existing, 44 active topics. Migrations **759–763**.

## Roster (Wave 0, 2026-06-16)
| ext_id | member | UUID | migration | stances |
|--------|--------|------|-----------|---------|
| -700200 | Maria Davila | cbc8c88e-492d-4e7b-8e8d-cfd573a1afc5 | 759 | 1 |
| -700201 | Joshua Barron (Mayor) | e109a1be-eff6-4982-af5a-ac1923f43f10 | 760 | 0 (ledger) |
| -700202 | Maria del Pilar Avalos | 006ecd0d-526a-49b6-b253-709b76c5965f | 761 | 2 |
| -700203 | Gil Hurtado | 75f11f44-9760-49bf-ab8c-f7aa1f53255f | 762 | 3 |
| -700204 | Al Rios | 8247e088-2ac8-4ae1-bac9-ff537dd27fec | 763 | 2 |

## Topic UUIDs used
housing=669cac97-66a6-4087-b036-936fbe62efb3 · healthcare=e8dad4a8-eb93-4931-91f5-d8fb5d7dd529 · economic-development=eb3d1247-0de1-4b7f-baec-7259861efd53 · public-safety-approach=e9ebefcd-c496-45e8-b816-a79f8442ba85 · local-environment=1935979c-b290-42e4-baa5-8cb0138b4ffa · transportation-priorities=ba59337e-30e2-4aba-a39a-426b3366eb27

## Per-member evidence
- **Davila:** Chairperson of the South Gate Housing Authority (leads affordable-housing/rental-assistance programs) → housing 2.0. (Long-tenured since 2003; otherwise limited public policy detail.)
- **Barron (Mayor):** No findable directional policy positions (elected 2022; AML-specialist background, youth-org involvement) → zero-INSERT ledger file per evidence-only rule.
- **Avalos:** collaborated with Community Development to increase housing programs → housing 2.0; first to advocate/allocate Mental Health funding for children, families, seniors → healthcare 2.0.
- **Hurtado:** priorities jobs + sales-tax revenue → economic-development 2.0; South Gate Police Officers Association endorsement (police support) → public-safety-approach 4.0; longtime graffiti-removal/trash-cleanup volunteer → local-environment 2.0.
- **Rios:** "strengthening the local economy" his most important priority → economic-development 2.0; excited to bring light rail to South Gate → transportation-priorities 2.0.

Hard rules: float values; `::text[]::text[]`; `BEGIN;..COMMIT;`; `$$..$$`; no-evidence=no-row (Barron zero-INSERT); "Council Member X" (rotational mayor); no offices/districts/chambers inserts.

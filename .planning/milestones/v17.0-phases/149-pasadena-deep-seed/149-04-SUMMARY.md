---
phase: 149-pasadena-deep-seed
plan: 04
type: execute
status: complete
completed: 2026-06-20
migrations: 949-956 (AUDIT-ONLY — not registered; ledger stays 947)
checkpoint: human-verify APPROVED (2026-06-20)
---

# 149-04 SUMMARY — Pasadena stances (0 → full coverage)

## What was done

Evidence-only compass stances for all 8 current Pasadena members, researched **one agent at a time**
(rate-limit rule), CHAIRS model, 100% citation, no defaults, honest blanks. Applied via raw SQL
(migrations 949–956, audit-only — **ledger MAX unchanged at 947**). NO judicial-* topics (appointed City
Attorney). Live non-judicial topics queried at apply time (never hardcoded).

**54 stances total**, all cited (0 uncited):

| Member | ext_id | mig | stances | rent-reg |
|---|---|---|---|---|
| Victor Gordo (Mayor) | -200901 | 949 | 10 | 4 (urged No on Measure H) |
| Tyron Hampton (D1) | -201094 | 950 | 4 | 3 |
| Gene Masuda (D4) | 657579 | 951 | 9 | 3 |
| Steve Madison (D6) | 657581 | 952 | 4 | 2 |
| Justin Jones (D3) | 657578 | 953 | 8 | 3 |
| Jason Lyon (D7) | 657582 | 954 | 5 | 2 |
| Jess Rivas (D5) | -700150 | 955 | 6 | 2 |
| Rick Cole (D2) | 657577 | 956 | 8 | 3 |

## Pasadena-specific rules honored

- **rent-regulation APPLIES (Pitfall 1):** populated and cited for **all 8** members (active Measure H RSO) —
  NOT auto-blanked. Range 2–4 captures real differences: Gordo opposed Measure H (4); Madison/Lyon/Rivas
  pro-stabilization (2); Hampton/Masuda/Jones/Cole maintain existing protections (3).
- **NO judicial topics:** 0 judicial-*/judge/DA rows (verified). Council-manager with appointed City Attorney.
- **Chairs model**, transportation-priorities scored 1=transit…5=highways (Gordo 1 / Madison 2 / Lyon 2 /
  Jones 2 / Masuda 4 reflect their records).
- **SB 79 recusals handled as non-stances:** Rivas recused (lives in affected zone) → transportation/zoning
  left blank, not editorialized. Cole's SB 79 *motion* (partial 18-month delay; transit zones develop by
  right) scored as residential-zoning 3 (pro-transit-density with calibrated local control), not anti-density.
- **No padding:** thinner members (Hampton 4, Madison 4) left honest blanks rather than manufactured stances;
  Madison's vague "Green City" climate line was dropped as too thin to map to a chair.

## Honest blanks (expected, documented)

State/federal topics (abortion, trans-athletes, vouchers, social-security, tariffs, ukraine-support,
same-sex-marriage, religious-freedom, healthcare, medicare/aid, redistricting, deportation, fossil-fuels,
childcare, ai-regulation, misinformation, voting-rights, immigration, civil-rights, jail-capacity,
data-centers, city-sanitation) are largely blank for city councilmembers — no fabricated stances. Lyon's
housing and Hampton's housing/zoning left blank where only aspirational language existed without a mechanism.

## Verification (all green)
- 8/8 members have ≥1 evidence-only stance; 54 total; **0 uncited** (100% citation)
- rent-regulation populated + cited for all 8 (incl. long-tenured Gordo/Hampton/Masuda/Madison)
- 0 judicial/retired/non-live topics; chairs model; no defaulted values
- schema_migrations MAX unchanged (947) — audit-only confirmed
- blocking human-verify checkpoint: **APPROVED**

## PASA-01 satisfied end-to-end: government (geo_id + single chamber) + districted roster (D1–D7 + Mayor) +
headshots (8/8) + evidence-only stances (54). 

## Self-Check: PASSED

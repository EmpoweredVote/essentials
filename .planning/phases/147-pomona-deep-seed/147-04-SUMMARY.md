---
phase: 147-pomona-deep-seed
plan: 04
wave: 4
status: complete
requirements: [POMO-01]
migrations: [929_tim_sandoval_stances.sql, 930_nora_garcia_stances.sql, 931_victor_preciado_stances.sql, 932_steve_lustro_stances.sql, 933_elizabeth_ontiveros_cole_stances.sql, 934_debra_martin_stances.sql, 935_lorraine_canales_stances.sql]
note: AUDIT-ONLY (none registered in schema_migrations; ledger stays 927). Human-verify checkpoint APPROVED by user 2026-06-20.
---

# Phase 147 Wave 4 — Pomona Stances — SUMMARY

**Outcome:** Pomona goes 0 → **32 evidence-only compass stances** across all 7 current councilmembers.
**100% citation, 0 judicial topics, 0 retired/non-live topics, 0 defaulted values.** Chairs model; one research
agent at a time; honest blanks preserved (extensive on state/federal topics + the thin Nov-2024 records).
Stance migrations 929–935 are audit-only; `schema_migrations` ledger unchanged at 927. **User approved at the blocking checkpoint.**

## Method
- **One research agent at a time** (`feedback_stance_research_one_at_a_time`), best-evidence order: Sandoval → Garcia → Preciado → Lustro → Ontiveros-Cole → Martin → Canales.
- **Chairs model** (`feedback_compass_chairs_not_polarity`): each 1–5 is the discrete position statement the evidence matched.
- **Evidence-only / no defaults** (`feedback_stance_no_default_value`): a value only with a documented public-record position + reasoning + ≥1 real source URL; honest blanks everywhere else.
- **No judicial topics** (`topic_key NOT LIKE 'judicial-%'`; Pomona has an appointed City Attorney, council-manager form). Live topics queried at apply time.
- Applied via raw SQL (paired `inform.politician_answers` + `inform.politician_context`, `$$`-quoted reasoning, `ON CONFLICT DO UPDATE`); **audit-only**, not registered.

## Stances applied (32)
| Member | ext_id | # | Topics (value) |
|--------|--------|---|----------------|
| Tim Sandoval (Mayor) | -200916 | 10 | rent-reg 2, housing 2, residential-zoning 3, growth 3, homeless-response 2, local-immigration 1, immigration 2, transportation 1, local-environment 1, climate 2 |
| Nora Garcia (D3) | -201350 | 6 | rent-reg 2, growth 1, local-environment 1, local-immigration 1, immigration 1, residential-zoning 1 |
| Victor Preciado (D2) | 675753 | 7 | rent-reg 2, housing 2, immigration 2, local-immigration 1, local-environment 1, econ-dev 3, transportation 2 |
| Steve Lustro (D5) | -201352 | 2 | rent-reg 3, public-safety 3 |
| Elizabeth Ontiveros-Cole (D4) | -700658 | 4 | local-immigration 1, housing 3, econ-dev 3, rent-reg 5 |
| Debra Martin (D1) | 675752 | 2 | rent-reg 5, econ-dev 5 |
| Lorraine Canales (D6) | 675765 | 1 | public-safety 3 |

## Key evidence anchor
The **Nov 17 2025 permanent Rent Stabilization Ordinance (5% cap, passed 5-1)** roll call (Streetsblog) anchored rent-regulation: YES = Garcia/Preciado/Sandoval/Lustro; NO = Martin/Canales; abstain = Ontiveros-Cole. Canales's NO was left **blank** (no documented reasoning); Ontiveros-Cole scored from her separate Oct 21 NO vote + small-landlord framing.

## Honest blanks (documented, not defaulted)
- All state/federal topics (abortion, trans-athletes, ukraine, tariffs, social-security, same-sex-marriage, medicare, etc.) — blank for all 7 (no first-party record).
- Lustro: only 2 stances (planner background is biography, not stance; declined to infer housing/zoning).
- Martin (2) and Canales (1): thin Nov-2024 records preserved as honest blanks, not padded.

## Post-verification — ALL GREEN
| Check | Result |
|-------|--------|
| stances applied across 7 members | 32 (10/6/7/2/4/2/1) ✓ |
| uncited answers | 0 (100% citation) ✓ |
| judicial / retired / non-live topic rows | 0 ✓ |
| defaulted values | 0 (every value an evidence-matched chair) ✓ |
| stance migrations 929–935 registered in schema_migrations | 0 (audit-only ✓; ledger stays 927) |
| human-verify checkpoint | APPROVED ✓ |

## key-files.created
- `C:/EV-Accounts/backend/migrations/929_tim_sandoval_stances.sql` … `935_lorraine_canales_stances.sql` (audit-only; applied to live Supabase, not in this git repo)

POMO-01 satisfied end-to-end (government + roster + headshots + stances).

## Self-Check: PASSED

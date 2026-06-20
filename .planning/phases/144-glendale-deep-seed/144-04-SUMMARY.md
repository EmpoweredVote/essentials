# Plan 144-04 Summary — Glendale Evidence-Only Stances

**Status:** ✅ Complete
**Wave:** 4
**Migrations:** 905–909 (`C:/EV-Accounts/backend/migrations/`) — AUDIT-ONLY (raw SQL, NOT registered; ledger stays 903)
**Date:** 2026-06-19

## What was done

Glendale went 0 → **38 evidence-only compass stances** across the 5 going-forward councilmembers. Research run strictly **one agent at a time** (rate-limit rule, `feedback_stance_research_one_at_a_time`). Human-verify checkpoint (Task 3) **approved** by user.

| File | Member | external_id | Stances | Notes |
|------|--------|-------------|---------|-------|
| 905 | Daniel Brotman | 686340 | 7 | climate, local-env, transport(1), housing, zoning, homelessness-response, public-safety |
| 906 | Ardy Kassakhian (Mayor) | 686339 | 9 | climate, fossil-fuels, local-env, transport(1), housing, growth, econ-dev, public-safety, rent-reg |
| 907 | Elen Asatryan | 686337 | 10 | transport(1), local-env, climate, homelessness-response, public-safety, rent-reg, housing, econ-dev, growth, civil-rights |
| 908 | Vartan Gharpetian | 686336 | 5 | local-env, growth, homelessness-response, housing, econ-dev (thinner record) |
| 909 | Alek Bartrosouf | -700101 | 7 | transport(2), climate, growth, housing, zoning, econ-dev, local-env (platform/commission — no votes yet) |
| — | Ara Najarian | -700100 | 0 | RETIRED — correctly excluded (orchestrator decision #3) |

## Protocol adherence (all verified)

- **One agent at a time** — five sequential research agents; never parallel.
- **100% citation** — all 38 answers have paired `inform.politician_context` (reasoning + ≥1 real source URL); verification `uncited=0` for every member with answers.
- **Chairs model** — each value is the discrete chair the documented record matches, not a polarity axis (`feedback_compass_chairs_not_polarity`).
- **No defaults / honest blanks** — national topics blank; Gharpetian's contradictory rent-regulation/residential-zoning evidence (SB 79 dissent reasoning undocumented; pro-tenant vs pro-landlord) left blank; Bartrosouf's explicit "no opinion yet" on rent registry and ambiguous public-safety/taxes left blank (`feedback_stance_no_default_value`).
- **No judicial topics** — `bad_topics=0` for all; Glendale's City Attorney is appointed (D-13).
- **No retired/non-live topics** — live topics queried at apply time (`is_live=true AND judicial_role NOT IN ('judge','city_attorney_da')`); never hardcoded retired IDs.
- **Armenian/Artsakh as EXTRA** (D-14) — found for Kassakhian (Artsakh-blockade condemnation), Asatryan (ANCA-WR/diaspora background), Gharpetian (ANCA-Glendale ties); **none mapped to any chair** (not ukraine-support, immigration, or civil-rights).
- **transportation-priorities** scored 1=transit … 5=highways per STATE.md (Brotman/Kassakhian/Asatryan=1 transit-first; Bartrosouf=2 balanced-multimodal, reflecting his "no lane removal solely for bike lanes" position).

## Evidence sources used

glendaleca.gov, outlooknewspapers.com (Glendale News-Press), gec.eco (GEC endorsements), crescentavalleyweekly.com, candidate sites (ardykassakhian.com, electelen.com, danforglendale.com/danbrotmanforglendale.com, alekforglendale.com via Good Party), Bike The Vote LA, Glendale Historical Society "Ask the Candidates", gaor.org candidate questionnaires, Ballotpedia, Wikipedia, LAist/Metro.

## Verification (all green)

| Check | Result |
|-------|--------|
| Stances applied (5 going-forward members) | 38 (7/9/10/5/7) |
| Najarian (-700100) stances | 0 (retired, correctly excluded) |
| Uncited answers (any member) | 0 (100% citation) |
| Judicial / retired / non-live topic rows | 0 |
| Armenian/Artsakh forced onto a chair | 0 (left EXTRA) |
| schema_migrations MAX (901–909) | 903 (905–909 NOT registered — audit-only ✓) |

## Deviations / notes

- Migrations applied via `mcp__supabase-local` (= production); on-disk files 905–909 authoritative, not in the ledger.
- Coverage skews to the local cluster (environment/energy/transportation/housing/growth) — correct for city councilmembers; national topics honestly blank.

## key-files
- created: `905_daniel_brotman_stances.sql`, `906_ardy_kassakhian_stances.sql`, `907_elen_asatryan_stances.sql`, `908_vartan_gharpetian_stances.sql`, `909_alek_bartrosouf_stances.sql` (all in `C:/EV-Accounts/backend/migrations/`)

## Self-Check: PASSED

38 evidence-only stances, 100% citation, chairs model, honest blanks, no judicial/retired topics, Armenian/Artsakh left as EXTRA, Najarian excluded, ledger preserved at 903; human checkpoint approved. GLEN-01 satisfied end-to-end (government + roster + headshots + stances).

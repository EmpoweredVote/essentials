---
phase: 130-culver-city-stances
plan: 01
type: execute
status: complete
requirements: [CULVERCITY-01]
completed: 2026-06-16
---

# Phase 130 — Culver City Stances: Summary

Evidence-only compass stances applied for all 5 Culver City Council members. Executed in one continuous sequential flow (one member at a time per the rate-limit rule). **CULVERCITY-01 fully closed.**

## Wave 0 (verified 2026-06-16)
- **Next migration = 729** (on-disk file counter authoritative; schema_migrations MAX stays 718 by design — stance migrations apply via raw SQL).
- **Rotational mayor** — no separate Mayor office; all 5 hold title "Council Member" (Alhambra pattern). No Mayor/district/chamber inserts.
- **NO excluded officials.** Pre-existing Culver stance rows = 0. Active topics = 44.

## Roster + results

| ext_id | member | UUID | migration | stances |
|--------|--------|------|-----------|---------|
| -700550 | Freddy Puza (2026 Mayor) | 1bb7df04-db6e-447f-b358-3f12526eb32e | 729 | 6 |
| -700551 | Bryan "Bubba" Fish (Vice Mayor) | 6ed5080f-e7cf-493b-9424-80dcbc8d54d0 | 730 | 6 |
| -700552 | Yasmine-Imani McMorrin | 1408cd55-dccb-40fa-9296-049af125ec6f | 731 | 6 |
| -700553 | Dan O'Brien | a2e727ea-2115-455c-a623-5b69a7336224 | 732 | 6 |
| -700554 | Albert Vera | 435a4b18-6db9-451f-9379-a62898337825 | 733 | 5 |

**Total: 29 stance rows across migrations 729–733.**

## Per-member highlights (full ideological spread captured)

- **Puza (6):** rent-regulation 2.0 (pro-RC, fiscally cautious on Right-to-Counsel), housing 2.0 (funded 93-unit affordable project), homelessness-response 2.0, civil-rights 1.0 (first openly LGBTQ+ member/mayor, DEI), transportation-priorities 1.0 (defended MOVE lanes), climate-change 2.0.
- **Fish (6):** housing 1.0 (housing-for-all-incomes, Housing & Homelessness Vice Chair), homelessness-response 2.0, rent-regulation 2.0 (eviction protections), transportation-priorities 1.0 (transport professional, Streets For All), climate-change 2.0, public-safety-approach 2.0 ("budget rooted in services and care").
- **McMorrin (6):** rent-regulation 1.0 (RC champion), housing 1.0 (upzoning), public-safety-approach 1.0 (PD-defunding advocate), transportation-priorities 1.0 (defended MOVE, "climate justice"), climate-change 2.0, civil-rights 1.0 (first Black woman on council, equity champion, reparations).
- **O'Brien (6) — moderate:** transportation-priorities 3.0 (scaled back MOVE, "middle ground"), public-safety-approach 4.0 (maintain PD staffing), residential-zoning 4.0 (preserve R1), housing 3.0 (affordable via large developments, not broad upzoning), homelessness-response 3.0 ("balanced"), local-environment 2.0 (greener Ballona Creek).
- **Vera (5) — conservative anchor:** rent-regulation 5.0 (opposed RC, backed Measure B repeal), public-safety-approach 4.0 (well-resourced PD), residential-zoning 4.0 (ended Incremental Infill), housing 3.0 (attainable housing + neighborhood preservation), transportation-priorities 3.0 (scaled back MOVE for business/traffic, kept combined bus/bike lane + extension).

## Verification (phase-wide)
- Stance rows: 6/6/6/6/5 = **29**
- **Unpaired: 0; Uncited: 0** (100% citation, path-bearing URLs)
- **Rows on inactive topics: 0**
- No defaulting; values span 1.0→5.0 with evidence. Strong compass contrast (progressive bloc Puza/Fish/McMorrin vs moderate O'Brien vs conservative Vera) — e.g. rent-regulation McMorrin 1.0 vs Vera 5.0; public-safety McMorrin 1.0 vs O'Brien/Vera 4.0.

## Notes
- Apply + verify via Supabase MCP `execute_sql` (production); `.sql` artifacts written to `C:/EV-Accounts/backend/migrations/` (729–733).
- "Bubba Fish" is Bryan Fish's public name (used in reasoning sourcing).
- MOVE Culver City (2023 bus/bike-lane rollback, 3-2) is the defining local vote distinguishing the bloc.
- **Next migration = 734.**

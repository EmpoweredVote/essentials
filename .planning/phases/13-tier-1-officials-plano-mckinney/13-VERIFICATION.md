---
status: passed
phase: 13-tier-1-officials-plano-mckinney
checked: 2026-05-01
---

# Phase 13 Verification

## Summary

All four must-haves verified via direct psql queries against the production database.
15 incumbent politician rows exist across Plano (8) and McKinney (7), every row has
`is_active=true` and `is_incumbent=true`, every row carries a valid `office_id` FK
with a matching back-link on the `offices` row, and contact coverage is 100% (15/15).

## Must-Haves Check

| # | Criteria | Status | Evidence |
|---|----------|--------|----------|
| 1 | Plano incumbents: 8 rows is_active=true, is_incumbent=true | ✓ | COUNT=8 (Mayor + Places 1-5, 7-8) |
| 2 | McKinney incumbents: 7 rows is_active=true, is_incumbent=true | ✓ | COUNT=7 (Mayor + At-Large 1/2 + Districts 1-4) |
| 3 | All politicians linked via office_id to valid offices | ✓ | 15/15 has_office_id=t, has_back_link=t |
| 4 | >=80% contact coverage (email or URL) | ✓ | 15/15 = 100.0% |

## Score

4/4 must-haves verified

## Details

### Plano (geo_id 4863000) — 8 rows

```
Council Member Place 1  Maria Tu            has_contact=yes
Council Member Place 2  Bob Kehr            has_contact=yes
Council Member Place 3  Rick Horne          has_contact=yes
Council Member Place 4  Chris Krupa Downs   has_contact=yes
Council Member Place 5  Steve Lavine        has_contact=yes
Council Member Place 7  Shun Thomas         has_contact=yes
Council Member Place 8  Vidal Quintanilla   has_contact=yes
Mayor                   John B. Muns        has_contact=yes
```

Place 6 is intentionally absent (vacant seat — office row has politician_id = NULL, no politician row expected).

### McKinney (geo_id 4845744) — 7 rows

```
Council Member At-Large Place 1  Ernest Lynch      has_contact=yes
Council Member At-Large Place 2  Michael Jones     has_contact=yes
Council Member District 1        Justin Beller     has_contact=yes
Council Member District 2        Patrick Cloutier  has_contact=yes
Council Member District 3        Geré Feltus       has_contact=yes
Council Member District 4        Rick Franklin     has_contact=yes
Mayor                            Bill Cox          has_contact=yes
```

Note: McKinney emails were NULL in migration 092 due to CloudFlare protection; bio URLs
are present for all 7, satisfying the contact requirement (url OR email).

### Contact Coverage

```
total=15  has_contact=15  pct=100.0%
```

Exceeds the 80% threshold.

---
plan: 176-01
status: complete
completed: 2026-06-30
---

# 176-01 Summary — Wave-0 Verification Probes

All 6 Wave-0 gates ran against production via `psql` and passed.

| Gate | Result |
|------|--------|
| A — existing Beaverton gov | 0 (clean) |
| B — ext_id block -4105357..-4105351 | 0 rows (free) |
| C1 — city geofence 4105350/G4110 | 1 (present) |
| C2 — existing districts for 4105350 | 0 (none) |
| D — migration ledger | ledger uses timestamp versions; on-disk MAX authoritative |
| E — Portland district casing | `or` (lowercase confirmed) |
| F — live compass topics | 44 captured |

## Confirmed for downstream plans

- **ext_id block:** `-4105351 .. -4105357` (no shift needed).
- **Next structural migration:** `1131` (on-disk MAX = 1130; on-disk counter is authoritative — the Supabase ledger uses timestamp version strings, so the int-cast probe D is not comparable and is expected to error).
- **District casing:** `state='or'` lowercase for LOCAL/LOCAL_EXEC.
- **Position 1:** Ashley Hartmeier-Prigg seated (per RESEARCH, holds seat until Jan 2027 despite Nov-2026 runoff for the open seat).
- **Live topic_keys (44)** — applicable civic topics for city-council stance research (plan 04); exclude the `judicial-*` set (10 topics: judicial-access-to-justice, judicial-bail-pretrial, judicial-criminal-justice, judicial-government-deference, judicial-interpretation, judicial-police-accountability, judicial-prosecution-priorities, judicial-transparency) which apply to judges, not council. Full list:
  abortion, ai-regulation, campaign-finance, childcare, city-sanitation, civil-rights, climate-change, data-centers, deportation, economic-development, fossil-fuels, growth-and-development, healthcare, homelessness, homelessness-response, housing, immigration, jail-capacity, local-environment, local-immigration, medicare/aid, misinformation, public-safety-approach, redistricting, religious-freedom, rent-regulation, residential-zoning, same-sex-marriage, school-vouchers, social-security, tariffs, taxes, trans-athletes, transportation-priorities, ukraine-support, voting-rights (+ the judicial-* set).

## Artifact
- `C:/EV-Accounts/backend/scripts/_tmp-beaverton-wave0-probe.sql` (gitignored helper — not committed).

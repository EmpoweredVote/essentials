---
phase: 203-indio-deep-seed
plan: 02
status: complete
completed: 2026-07-13
requirements: [CV-03]
---

# 203-02 Summary — Indio City Council Structural Migration (1338)

## Outcome
Greenfield City of Indio government + City Council (official_count=5) + 5 LOCAL X0023 districts + 5
by-district members seeded to production, with Holmes (D3)=Mayor / Fermon (D2)=Mayor Pro Tem
titles-on-seat. All pre/post-verify gates green.

## What was built
- `C:/EV-Accounts/backend/migrations/1338_indio_city_council.sql` — applied via `psql -f`; committed to
  `C:/EV-Accounts` as `92854c51`. Migration number **1338** (disk MAX 1337 + 1; ledger-verified free).
- Post-verification NOTICE: `gov=1, offices=5, appointed=0, split=0, mayor_on=-4012003, mpt_on=-4012002`.
- Ledger `supabase_migrations.schema_migrations` version `1338` registered (count=1).
- Combined Task-2 assertion → `t`.

## Roster reconfirm (D-04/D-05/D-06) — live 2026-07-13
All 5 confirmed current via `indio.civicweb.net/portal/members.aspx?id=10`. Mayor/MPT confirmed via KESQ /
The Indio Post / City of Indio: **Elaine Holmes sworn in as Mayor 2025-12-03**; **Waymond Fermon = Mayor
Pro Tem** (rotational, current for 2026). **D5 full name confirmed "Benjamin Guitron IV"** (nickname
"Ben", elected 2024) — D-06 resolved.

## Politician UUID Manifest (for Plans 03 headshots + 04 stances)
| District | geo_id | ext_id | title | full_name | politician_id | office_id |
|----------|--------|--------|-------|-----------|---------------|-----------|
| D1 | indio-ca-council-district-1 | -4012001 | Councilmember | Glenn Miller | `13bc36a0-3984-4ba1-9a2f-d4791bfa2ca2` | `9f370ee6-26df-4b89-8147-2080739488eb` |
| D2 | indio-ca-council-district-2 | -4012002 | Mayor Pro Tem | Waymond Fermon | `86fe2b91-d1fa-4c65-8d75-90f181624fe4` | `b90e27c9-9094-424d-b358-5c4c8934fb89` |
| D3 | indio-ca-council-district-3 | -4012003 | Mayor | Elaine Holmes | `dea49bf0-12b4-40b7-a48c-a3eda018ef04` | `bfac3399-9d7e-4696-863b-57debc3d7b4c` |
| D4 | indio-ca-council-district-4 | -4012004 | Councilmember | Oscar Ortiz | `4bbba476-c442-42d5-8b5d-07e8fac1481c` | `5342169e-dd41-4354-8f05-248b16e6ff5d` |
| D5 | indio-ca-council-district-5 | -4012005 | Councilmember | Benjamin Guitron IV | `f13b83e3-e086-479a-b6e4-9ad63f89f308` | `a49b3d1e-7eb4-4689-822f-5ae7c097a401` |

## Headshot source paths captured (bonus for Plan 03, from CivicWeb)
`indio.civicweb.net/FileStorage/content/UserImages/`: Miller=`user-19.jpg`, Fermon=`user-17.jpg`,
Holmes=`user-16.jpg`, Ortiz=`user-18.jpg`, Guitron=`user-1220.jpg`.

## Self-Check: PASSED
- [x] 1 government, 1 City Council (official_count=5), 5 LOCAL X0023 districts (1 office each)
- [x] Exactly 1 Mayor (on -4012003/Holmes) + 1 Mayor Pro Tem (on -4012002/Fermon); appointed=0; section-split=0
- [x] Migration applied, committed, ledger-registered; ext_id block -4012001..-4012005 used (was free)
- [x] No forbidden tokens (LOCAL_EXEC/X0022/palm-springs/0655254); no bare-0636448 office join

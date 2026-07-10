---
plan: 176-02
status: complete
completed: 2026-06-30
---

# 176-02 Summary — Beaverton Structural Seed (migration 1131)

Migration `1131_beaverton_city_council.sql` authored, applied to production, and committed
in `C:/EV-Accounts` (commit e8716697; not pushed — migration already applied via psql).

In-migration post-verify DO block passed; independent audit confirmed:
- 1 government `City of Beaverton, Oregon, US` (geo_id 4105350)
- 1 chamber `City Council` (name_formal `Beaverton City Council`, official_count=7)
- 2 districts, both `state='or'`: LOCAL_EXEC (Mayor, citywide) + LOCAL (at-large)
- 7 offices; Mayor on LOCAL_EXEC, 6 councilors on LOCAL
- section-split = 0; ledger MAX now 1131

## Minted politician UUIDs (needed by plans 03 headshots + 04 stances)

| ext_id | UUID | Name | Title |
|--------|------|------|-------|
| -4105351 | 6f4e9c86-1c23-4569-ad1a-7614463420f1 | Lacey Beaty | Mayor |
| -4105352 | d7756d33-4c53-4c68-9c36-cf2f9817a17b | Ashley Hartmeier-Prigg | Council Member (Position 1) |
| -4105353 | 6d019025-985f-4410-aa82-75de91eb4203 | Kevin Teater | Council Member (Position 2) |
| -4105354 | b3cadd4c-3e7b-46b5-b5a5-3b062493184b | Edward Kimmi | Council Member (Position 3) |
| -4105355 | f9a8fdd0-c685-4692-a161-a7d8f8e01cc7 | Allison Tivnon | Council Member (Position 4) |
| -4105356 | 11427932-a17e-4898-8258-ec8c8bf7709f | John Dugger | Council Member (Position 5) |
| -4105357 | f5867b19-d040-4a95-b558-475e5469a945 | Nadia Hasan | Council Member (Position 6) |

Note: Edward Kimmi (Position 3) holds the rotational Council President title — modeled as one office row (title stays `Council Member (Position 3)`), no separate seat.

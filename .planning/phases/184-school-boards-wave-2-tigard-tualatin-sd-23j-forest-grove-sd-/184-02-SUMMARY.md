# Phase 184 — Plan 02 (structural migration) SUMMARY

**Executed inline (no subagents):** 2026-07-04
**Migration applied:** `1208_or_westmetro_school_boards_wave2.sql` (renumbered from planned 1206 — MO 2026-House workstream claimed 1206/1207; on-disk MAX was 1207).
**Status:** APPLIED CLEANLY to production. Post-verify PASSED. All independent gates green.

## Post-verify NOTICE (in-migration DO block)
```
Post-verification PASSED: TTSD gov=1/off=5, FGSD gov=1/off=5, SSD gov=1/off=5,
null_chamber=0, split_orphans=0, office_id_nulls=0
```
- 24 INSERTs (3 govs + 3 chambers + 3 SCHOOL districts + 15 offices) + UPDATE 15 (office_id back-fill) + ledger INSERT 1 + COMMIT.

## Independent SQL gates
| Gate | Expected | Actual |
|------|----------|--------|
| Office counts (4112240 / 4105160 / 4111290) | 5 / 5 / 5 | 5 / 5 / 5 ✓ |
| districts.state casing | `or` only | `or` ✓ |
| Chamber names | School Board / School Board / Board of Directors, official_count=5 | exact match ✓ |
| Ledger row '1208' | 1 | 1 ✓ |

## Fixes applied (D-F1)
- **WR-01** — every office block resolves the politician id via `pol AS (SELECT id FROM ins_p UNION SELECT id FROM politicians WHERE external_id=-N)`, CROSS JOIN `pol` (self-healing office guard).
- **WR-02** — post-verify DO block asserts `chamber_id IS NOT NULL` for all 15 offices (`null_chamber=0`).
- All counts 5-seat/15-total; `official_count=5`; lowercase `or`; version-only ledger before COMMIT.

## 15 minted politician UUIDs (ext_id → id) — FOR PLAN 03 HEADSHOT MIGRATION

**TTSD (School Board):**
| ext_id | Name | UUID |
|--------|------|------|
| -4112241 | David Jaimes | 38449e1d-d7b6-42ba-a276-23f8eb7577c9 |
| -4112242 | Kristen Miles | cf4a4d49-6c3c-4301-854c-5ca675bc7637 |
| -4112243 | Tristan Irvin | 641306e7-77fe-4b51-be95-a2523c89838f |
| -4112244 | Jill Zurschmeide | c9a660c1-7056-4986-92dd-05e8dae75ffb |
| -4112245 | Crystal Weston | 8a480326-0f2d-4b19-b32b-566f5415152e |

**FGSD (School Board):**
| ext_id | Name | UUID |
|--------|------|------|
| -4105161 | Brisa Franco | 9b4ff67f-41d4-489f-8425-4c3373bc1bdd |
| -4105162 | Pete Truax | 7f1e8356-75a4-4ce5-8410-efefa0277f2f |
| -4105163 | Alma Lozano | 6e7c4b85-7aec-45f1-9c3f-8994e0d29738 |
| -4105164 | Linda Harrington | 6bbf6639-99f1-4684-a54b-4f92c0ec3439 |
| -4105165 | Kristy Kottkey | 81000b71-a70a-421c-a957-b4abf3459ec5 |

**SSD (Board of Directors):**
| ext_id | Name | UUID |
|--------|------|------|
| -4111291 | Harmony Carson | b890e3ea-5c9c-46bc-9de2-162a4bba682f |
| -4111292 | Matt Kaufman | 80d8161b-176a-417c-894b-9ce87e0ee469 |
| -4111293 | Abby Hawkins | db661550-a3ce-454d-a2ca-7f48fcd5c635 |
| -4111294 | Hans Moller | 7da7aada-692c-4a8f-8b12-7ca10806aa65 |
| -4111295 | Matt Thornton | 18bb831c-13b2-4b8a-978f-53593539a772 |

## Outstanding
- The migration `.sql` file is applied to the DB but **not yet committed to the C:/EV-Accounts git repo** (held pending operator confirmation; EV-Accounts is shared with the Accounts session).
- Address-routing smoke test (`smoke-or-westmetro-school.ts`) not yet re-run — deferred to plan 04's E2E suite (covers all 3 geo_ids).

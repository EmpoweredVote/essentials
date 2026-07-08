---
phase: 160-nevada-legislature-seed-headshots
plan: 01
status: complete
completed: 2026-06-23
requirements: [NV-LEG-01, NV-LEG-02]
migration: 1053
---

# Plan 160-01 Summary — NV Legislature structural seed

**Goal achieved:** Two legislature chambers + all 63 sitting legislators (21 Senate / 42 Assembly) seeded under State of Nevada (geo_id='32'), each linked to its pre-existing SLDU/SLDL district at state='nv', office_id back-filled, zero section-split. Migration 1053 applied and registered.

## Wave-0 probe results (inline orchestrator)
- **P1 — district counts/keying:** 21 STATE_UPPER (geo_id `32001`–`32021`, label "State Senate District N") + 42 STATE_LOWER (geo_id `32001`–`32042`, label "Assembly District N"), all at state='nv'. **Both district types share the geo_id space**, so `district_type` is mandatory in every WHERE — with it, the simple geo_id key is unambiguous.
- **Senate keying choice:** simple geo_id form `d.geo_id='320NN' AND d.district_type=... AND d.state='nv'` (NOT name_formal — that column does not exist on `essentials.districts`; the label column is `label`).
- **P2 — external_id collisions:** 0 rows in range −3204042..−3203001 (ranges unused).
- **P3 — migration counter:** structural ledger literal MAX = 1050 (1051/1052 were audit-only headshot migs, unregistered); on-disk files run through 1052 → next file = **1053**. Confirmed.
- Government geo_id='32' = State of Nevada (`9bb67edf-1081-4941-8f7d-2e791a5d28a1`); legislature chambers did not pre-exist (greenfield).

## Checkpoint
Operator approved the 63-member roster as-is (no corrections), geo_id keying, and `photo_license='us_government_work'` default for Plan 02. SD-11 Rogich and SD-18 Steinbeck seeded is_appointed=false like peers (A3). No vacancies.

## Task-3 apply + audit (inline orchestrator, via psql + supabase MCP)
Applied `1053_nv_legislature.sql` via psql (ON_ERROR_STOP). Back-fills: UPDATE 21 (Senate) + UPDATE 42 (Assembly).

| Audit | Expected | Actual |
|-------|----------|--------|
| Senate offices (Nevada State Senate @ geo_id='32') | 21 | **21** ✓ |
| Assembly offices (Nevada Assembly @ geo_id='32') | 42 | **42** ✓ |
| SLDU linkage (state='nv', STATE_UPPER) | 21 | **21** ✓ |
| SLDL linkage (state='nv', STATE_LOWER) | 42 | **42** ✓ |
| office_id back-filled (all 63) | 63 | **63** ✓ |
| Section-split (>1 government) | 0 rows | **0** ✓ |
| Ledger MAX (literal) | 1053 | **1053** ✓ |

## Deviations
- **Plan/research assumed `districts.name_formal`** — that column does not exist (columns are `label`, `district_id`, `geo_id`). Keying used `geo_id` (the simple form was available), so no impact. Noted for Plan 03 (uses `label` if referencing district names).
- Apostrophe surnames (D'Silva AD-28, O'Neill AD-40) SQL-escaped as doubled quotes — no content change.

## Handoff to Plan 02 — external_id → politician UUID map (63)
Plan 02's script resolves UUIDs at runtime by external_id, but the captured map:

### Senate (STATE_UPPER, -3203001..-3203021)
| ext_id | UUID | name |
|--------|------|------|
| -3203001 | fa2f4a8c-2dba-4985-84c5-e0efda8a314a | Michelee "Shelly" Cruz-Crawford |
| -3203002 | b89ab6fe-ec36-4c03-a8ff-f1ef1afe1f8a | Edgar Flores |
| -3203003 | 3885166f-532a-4bf2-a04c-9c846768f5eb | Rochelle T. Nguyen |
| -3203004 | 2cd0491f-c9f3-4841-86a8-0c1076b0d81a | Dina Neal |
| -3203005 | a7679d83-5a48-470e-9df2-4d1d7c18a391 | Carrie Ann Buck |
| -3203006 | 94b171c0-e3b1-4c15-bc6c-27035a0dc831 | Nicole J. Cannizzaro |
| -3203007 | 40367549-65f3-449e-add5-ce67abc516b5 | Roberta Lange |
| -3203008 | 44c59b6c-de01-4c1b-b696-a57ad3947dba | Marilyn Dondero Loop |
| -3203009 | 8d28af6f-1007-48f6-beb9-f81e33d6fd81 | Melanie Scheible |
| -3203010 | 7b4022ca-9722-4947-a369-ee0e528b1af9 | Fabian Doñate |
| -3203011 | 3df50c30-f39c-4cd9-a188-c9082a67daa9 | Lori Rogich |
| -3203012 | 0e6e4089-78fe-4090-a5d9-0541c3ec45c8 | Julie Pazina |
| -3203013 | 0e80946b-8f57-43b7-af44-3c1c8469a51c | Skip Daly |
| -3203014 | d7d372d1-e08e-4760-97bd-9edce9ffda05 | Ira Hansen |
| -3203015 | 49ac6935-2444-4ce9-8e84-545c6f6209f0 | Angela D. Taylor |
| -3203016 | c68dd099-1804-45bf-a1da-2cffba356e78 | Lisa Krasner |
| -3203017 | c177ae7c-9da4-4ae4-9704-3fc9004427f2 | Robin L. Titus |
| -3203018 | 129ebeb5-0bb7-489d-998c-53bea72fb1ba | John C. Steinbeck |
| -3203019 | 778791c2-f947-42db-81e9-ba3bc1ff931f | John Ellison |
| -3203020 | 4255a155-7197-40b7-918a-b32ed4d489c4 | Jeff Stone |
| -3203021 | 3a17cd52-2112-453f-9fbe-0799235072a6 | James Ohrenschall |

### Assembly (STATE_LOWER, -3204001..-3204042)
| ext_id | UUID | name |
|--------|------|------|
| -3204001 | 690253bf-2c57-443b-a6b2-8c769e0885a3 | Daniele Monroe-Moreno |
| -3204002 | 49dc6a5b-4275-48e6-8f11-5e4156b8199e | Heidi Kasama |
| -3204003 | 0f31ccad-c79c-43cb-bb06-9392b9b2c908 | Selena Torres-Fossett |
| -3204004 | b9f1ab35-5fb3-4177-80c2-29fd388b77a9 | Lisa K. Cole |
| -3204005 | bc0a9215-e2dc-46a2-b325-80d90281847d | Brittney M. Miller |
| -3204006 | b61f2aa3-62c2-41fb-a8e9-a0589a8ee005 | Jovan A. Jackson |
| -3204007 | 16be39b7-c646-4656-b20c-7f6e038e97ac | Tanya P. Flanagan |
| -3204008 | d2c7f3e5-d0c9-40d1-8527-49f2e41e015b | Duy Nguyen |
| -3204009 | e8f4c5c0-d18a-408d-9fff-ee2620a0d23d | Steve Yeager |
| -3204010 | aa172507-de77-4525-a765-220237c1a9be | Venise Karris |
| -3204011 | 1a9f683e-4ead-49fe-b6b3-30d6379738d4 | Cinthia Zermeño Moore |
| -3204012 | 32278145-a538-4cb7-8a2e-d0a571e2b0b5 | Max E. Carter II |
| -3204013 | 55370ca6-5c1a-4ab4-9a75-3ee266ec3d53 | Brian Hibbetts |
| -3204014 | 80bf7387-2917-464f-a9e1-58d136fa2b0b | Erica Mosca |
| -3204015 | efadbe7a-0b07-42bb-912d-c2a3021e06d6 | Howard Watts III |
| -3204016 | 4e31c709-96b4-4938-b01f-d8ba4ff474c8 | Cecelia González |
| -3204017 | f59700c8-d453-425a-b3f9-f1189d87a976 | Linda F. Hunt |
| -3204018 | c7fe9357-446f-4998-816a-dbfdd8b319ef | Venicia Considine |
| -3204019 | 11602abe-4866-483f-bcf6-1473de7d4e7d | Jason Patchett |
| -3204020 | 90572ea8-acf1-4896-8b3d-8efdbd26ad58 | David Orentlicher |
| -3204021 | 10957d22-c1ca-4a44-bddb-5bd606b12b76 | Elaine H. Marzola |
| -3204022 | 02fa5b8b-2be7-4c5c-ae0b-ae01963625d1 | Melissa R. Hardy |
| -3204023 | 6cffc86c-7d40-4fd9-8690-51d6d33ff1e4 | Danielle Gallant |
| -3204024 | 0181ed7a-410b-4dfe-b0ea-411ffd0f5720 | Erica P. Roth |
| -3204025 | 086ad172-94bb-4460-8984-4f5b7fa4d2a5 | Selena La Rue Hatch |
| -3204026 | b1499860-79d4-43b3-878c-def5f28037d8 | Rich DeLong |
| -3204027 | 74f07f06-747c-4e6a-adf3-68133bd2ccbc | Heather Goulding |
| -3204028 | 3af59cfd-8cd6-4fc3-8c8c-82b07a10af69 | Reuben D'Silva |
| -3204029 | 0b6f16de-e072-415a-837f-bf3c75caccbd | Joe Dalia |
| -3204030 | 4e6d26a0-747c-4ccd-8f83-384732c0f34a | Natha C. Anderson |
| -3204031 | 7c364920-62ba-4ae8-b982-739656b58f51 | Jill Dickman |
| -3204032 | ed5a5666-f5de-4b3e-aac9-34dca26eeb38 | Alexis M. Hansen |
| -3204033 | 9dc6edd9-7406-476c-82b7-bee3f2865bcc | Bert K. Gurr |
| -3204034 | 55db18bd-c4ed-487a-a5cf-6b672e5376b5 | Hanadi Nadeem |
| -3204035 | 6a42f3ff-5ac8-40ff-a0ea-9b18e626c9aa | Rebecca Edgeworth |
| -3204036 | 1172767a-6b61-44e7-a372-8455711046bc | Gregory T. Hafen II |
| -3204037 | 06693066-c852-424f-b3f5-925edee51743 | Shea M. Backus |
| -3204038 | 36cba838-66a0-497c-a0c9-56f6f917f6c7 | Gregory S. Koenig |
| -3204039 | 5d544706-96b9-4eb6-8a45-1294d909f113 | Blayne Osborn |
| -3204040 | ab67908f-6a01-4c39-a3b6-cfdd9d6a6af2 | P. K. O'Neill |
| -3204041 | 8f397d8b-57a2-4055-88a2-78db14f45b20 | Sandra Jauregui |
| -3204042 | 190de314-e976-4df7-bad9-b3cdc0f2d887 | Tracy Brown-May |

## Artifacts
- `C:/EV-Accounts/backend/migrations/1053_nv_legislature.sql` (structural, registered '1053', idempotent)

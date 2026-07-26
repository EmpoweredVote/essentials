# Phase 129: Compton Stances - Research

**Researched:** 2026-06-16
**Domain:** Evidence-only compass stance ingestion for Compton Mayor + City Council (5 officials)
**Confidence:** HIGH

---

## Summary

Phase 129 applies evidence-only compass stances for Compton Mayor Emma Sharif and 4 City Council members: Deidre Duhart (D1), Andre Spicer (D2), Jonathan Bowers (D3), and Lillie P. Darden (D4). All 5 Compton officials were seeded in v7.0. Wave 0 (2026-06-16) confirmed there is NO separately-seeded City Clerk or City Treasurer for Compton in the DB — so unlike Carson/Beverly Hills, there are **no excluded officials** for this phase. The stance pattern is fully established from Phases 106, 111–115, 122–128.

Compton (~95,000 pop.) is a working-class, majority Black and Latino city in the Gateway Cities region of southern LA County, incorporated 1888. Compton has a directly elected Mayor (Emma Sharif) — not a rotational system — plus four district council seats. Local coverage: LA Times, Daily Breeze (South Bay/Gateway), Compton Herald (comptonherald.com), Patch (compton.patch.com), 2UrbanGirls (local watchdog blog with heavy Compton council coverage), and city council minutes at comptoncity.org. Expected evidence yield per official is moderate — 3–9 stances per person is realistic; Mayor Sharif likely has the richest record.

**Compton Mayor note:** Emma Sharif holds the Mayor title as a distinct LOCAL_EXEC office (external_id -700250, UUID 174f3f47-e4ee-4775-ab6f-f1039d608098). She is directly elected — NOT a rotational council-selected Mayor. Reasoning text should use "Mayor Sharif" with no "rotational" qualifier. Identical to the Beverly Hills (Friedman) / Carson (Davis-Holmes) pattern, not the Alhambra rotational-Mayor pattern.

**Migration numbering.** Wave 0 confirmed: max migration file on disk = 723 (723_rojas_stances.sql, Carson). `supabase_migrations.schema_migrations` MAX = 718 — this is EXPECTED and not a conflict: stance migrations are applied via raw `psql -f` / MCP `execute_sql` and do not register in that ledger. The authoritative counter is the on-disk file number. **Next migration = 724.**

**Schema note:** `inform.compass_topics` uses `topic_key` column (NOT `slug`). Verification queries must use `topic_key`.

**Primary recommendation:** Follow the exact migration pattern from 723_rojas_stances.sql / 718_wells_stances.sql. Research officials in order: Sharif → Duhart → Spicer → Bowers → Darden; apply each migration immediately and verify before moving to the next (one at a time — never parallel; rate-limit rule).

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMPTON-01 | Compass shows evidence-only stance data for Compton Mayor + City Council (5 officials: Sharif, Duhart, Spicer, Bowers, Darden); no clerk/treasurer seeded so none excluded; sequential research, 100% citation rate | Fully supported by established stance pattern (282, 574, 703–723 canonical analogs); external_ids confirmed from Wave 0 DB query; Compton Mayor is directly elected (no rotational pitfall) |
</phase_requirements>

---

## Compton Official Roster (Confirmed from DB — Wave 0, 2026-06-16)

| external_id | full_name | UUID | title | district_type | migration |
|-------------|-----------|------|-------|---------------|-----------|
| -700250 | Emma Sharif | 174f3f47-e4ee-4775-ab6f-f1039d608098 | Mayor | LOCAL_EXEC | 724 [Plan 01] |
| -700251 | Deidre Duhart | a5db6e7d-2146-4dde-a778-05fa40566ac0 | Council Member (District 1) | LOCAL | 725 [Plan 01] |
| -700252 | Andre Spicer | f63d8129-c569-4ea5-bd77-5cda877b2185 | Council Member (District 2) | LOCAL | 726 [Plan 02] |
| -700253 | Jonathan Bowers | 9a37b6e4-13bc-48c0-97b3-22aaa253c054 | Council Member (District 3) | LOCAL | 727 [Plan 02] |
| -700254 | Lillie P. Darden | 10429226-b00b-4b96-b306-753c2094d719 | Council Member (District 4) | LOCAL | 728 [Plan 02] |

**5 target officials. NO excluded officials** (no City Clerk / City Treasurer seeded for Compton — Wave 0 confirmed).
**Pre-existing Compton stance rows:** 0 (Wave 0 confirmed).
**Active compass topics:** 44 (Wave 0 confirmed).

---

## Per-Official Research Notes

### Emma Sharif (Mayor, -700250)
Sharif is Compton's directly elected Mayor (former Compton Unified school board member; elected Mayor 2021, re-elected). Expected yield: 5–9 stances.
High-probability topics: `public-safety-approach` (Compton contracts with LA County Sheriff; gang-violence reduction), `homelessness-response`, `housing`/`residential-zoning` (RHNA, affordable projects), `economic-development` (downtown revitalization, retail attraction, cannabis business policy), `local-environment` (Compton Creek, industrial pollution, lead/groundwater), `growth-and-development`, `taxes` (Measure P / utility users tax history). Sources: comptoncity.org, latimes.com, dailybreeze.com, compton.patch.com, comptonherald.com, ballotpedia.org/Emma_Sharif, 2urbangirls.com.

### Deidre Duhart (D1, -700251)
Expected yield: 3–6 stances. High-probability: `housing`, `homelessness-response`, `public-safety-approach`, `economic-development`, `local-environment`. Sources: comptoncity.org/council, compton.patch.com, comptonherald.com, 2urbangirls.com.

### Andre Spicer (D2, -700252)
Expected yield: 3–6 stances. High-probability: `public-safety-approach`, `housing`, `economic-development`, `homelessness-response`, `local-environment`. Sources: same as above.

### Jonathan Bowers (D3, -700253)
Expected yield: 3–6 stances. High-probability: `public-safety-approach`, `housing`, `economic-development`, `homelessness-response`. Sources: same as above.

### Lillie P. Darden (D4, -700254)
Expected yield: 3–6 stances. High-probability: `housing`, `homelessness-response`, `public-safety-approach`, `local-environment`, `economic-development`. Sources: same as above.

---

## Migration File Pattern (canonical — copy from 723_rojas_stances.sql / 282_md_exec_stances.sql)

```sql
-- Migration NNN: [Full Name] Stances
BEGIN;
-- 44-topic UUID reference block
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{uuid}', '{topic_uuid}', {N}.0)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{uuid}', '{topic_uuid}', $$reasoning$$,
        ARRAY['https://host/path']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
COMMIT;
```

Hard rules:
- value is float literal (4.0), NEVER bare integer (4) or string ('4')
- sources double-cast `::text[]::text[]`
- wrap whole file in BEGIN; ... COMMIT;
- reasoning uses plain `$$...$$` dollar-quoting (never named)
- at least 1 path-bearing source URL (no bare domains)
- NO row for a topic with no evidence — blank spoke is correct, never default 3.0
- zero-evidence official still gets a header + BEGIN;/COMMIT; + zero INSERTs (ledger consistency)
- "Mayor Sharif" — directly elected, NO "rotational" qualifier
- No INSERT INTO essentials.offices / districts / chambers (all seeded)

---

## Topic UUID Reference Block (44 active topics — confirmed 2026-06-16)

```
-- abortion                        = af2fdfd6-02c4-49df-b09c-cf8536f4773f
-- ai-regulation                   = 666bf03d-81fc-4138-ab15-69ae734c9023
-- campaign-finance                = 92730f69-ae57-401c-8ad1-2d07834a895d
-- childcare                       = c1ac1330-47f7-44ec-baf3-c913d926b97c
-- city-sanitation                 = 7687de4f-4d0b-462a-b803-bdfb23b16b42
-- civil-rights                    = 0bc588c6-39e1-4084-b5de-cac909b8b762
-- climate-change                  = f1e44d66-5d27-4b51-b54f-b7ace86f6a3c
-- data-centers                    = 4559b513-0fd8-4ed1-babd-f3b554162f40
-- deportation                     = 44905f3b-e105-4f6c-afc7-5d223813dbac
-- economic-development            = eb3d1247-0de1-4b7f-baec-7259861efd53
-- fossil-fuels                    = a22215c3-6693-4bc2-b248-01aebba14570
-- growth-and-development          = fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4
-- healthcare                      = e8dad4a8-eb93-4931-91f5-d8fb5d7dd529
-- homelessness                    = 4938766b-b45a-46e3-93bd-b8b30651271a
-- homelessness-response           = 6fbf39ae-6b19-4182-b4c2-6a8d25c86c0f
-- housing                         = 669cac97-66a6-4087-b036-936fbe62efb3
-- immigration                     = 4e2c69ce-591e-4197-9cd5-7aceff79d390
-- jail-capacity                   = c267e137-0ff9-4e7d-9d13-e3cea1756cd0
-- judicial-access-to-justice      = 9d45acaf-1ba4-4cb8-95e1-5ed985223b91
-- judicial-bail-pretrial          = 1fab5edf-6151-4da0-9704-a7f2113ba54c
-- judicial-criminal-justice       = 9db07b16-1076-4b7d-ad89-ebe7b51f4336
-- judicial-government-deference   = e5e48f0e-8f3a-40e1-8080-889fea389603
-- judicial-interpretation         = 448b1c9a-b6f3-42b8-8f39-d3bbb5bfa9ee
-- judicial-police-accountability  = 7bad33eb-e93e-4d94-8822-97212d49bde5
-- judicial-prosecution-priorities = abb99d95-cbb1-4617-8f8b-f220ef6028ca
-- judicial-transparency           = 6674d87e-999d-433a-aab7-3f626f59fd5f
-- local-environment               = 1935979c-b290-42e4-baa5-8cb0138b4ffa
-- local-immigration               = b9ccee94-ad96-4f10-b655-889d8e5abe92
-- medicare/aid                    = cab61e8a-64fe-4bbd-bc08-fe9914d0091b
-- misinformation                  = ddd65d64-9dc7-4208-a30f-59f4b9c0653d
-- public-safety-approach          = e9ebefcd-c496-45e8-b816-a79f8442ba85
-- redistricting                   = 48cc9585-ec22-4f53-8d42-6839828dd36f
-- religious-freedom               = 6b9ba6d9-1001-43f5-b073-4d37130696fd
-- rent-regulation                 = c308e8e8-caac-44f5-ab04-dbfecf40bbe2
-- residential-zoning              = d4f18138-a2e0-4110-b925-7387d9d0d16d
-- same-sex-marriage               = c5ab4eab-702f-49b8-9277-8ea53f3835c6
-- school-vouchers                 = 00b95a6a-75db-4521-b523-3326bba938de
-- social-security                 = 87d20824-a6e9-407b-983c-65440084a0ab
-- tariffs                         = 683c8084-2281-4920-a07c-18439b2dd413
-- taxes                           = f7e5678d-dadd-4556-a2fc-446e24642ceb
-- trans-athletes                  = d1618b9c-0b9e-45af-b986-bb33d270b8e4
-- transportation-priorities       = ba59337e-30e2-4aba-a39a-426b3366eb27
-- ukraine-support                 = 24e9212c-b011-422a-865c-093e35050901
-- voting-rights                   = d1792200-1d3b-4955-a0b7-0e6980d7a7b2
```

---

## Pitfalls (carried from Phase 128)

1. Migration MAX filter: stance migrations are applied raw and do NOT register in schema_migrations; trust the on-disk file counter (next = 724).
2. Float literals required: `4.0` not `4`/`'4'`.
3. Double-cast sources: `::text[]::text[]`.
4. Plain `$$...$$` dollar-quoting.
5. No evidence = no INSERT; never default 3.0; zero-evidence official still gets a ledger file.
6. `topic_key`, not `slug`.
7. Sharif is directly elected — "Mayor Sharif", no "rotational" qualifier.
8. NO excluded officials for Compton (no clerk/treasurer seeded) — distinct from Carson/BH.
9. Do NOT create offices/districts/chambers — all seeded.
10. Compton external_ids are -700250..-700254 (contiguous; IN list fine).

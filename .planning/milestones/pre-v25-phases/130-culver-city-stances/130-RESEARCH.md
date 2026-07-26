# Phase 130: Culver City Stances - Research

**Researched:** 2026-06-16
**Domain:** Evidence-only compass stance ingestion for Culver City Council (5 members)
**Confidence:** HIGH

---

## Summary

Phase 130 applies evidence-only compass stances for the 5 Culver City Council members: Freddy Puza, Bryan Fish, Yasmine-Imani McMorrin, Dan O'Brien, and Albert Vera. All were seeded in v7.0. Culver City uses a **rotational mayor** (council selects mayor/vice-mayor annually) — there is NO separately elected Mayor office; all 5 hold the title "Council Member" (LOCAL). This is the **Alhambra pattern** (Pitfall: never create a Mayor office; use "Council Member X", and only add a "then-serving as rotational Mayor" qualifier where evidence ties a statement/action to that member's mayoral term).

Culver City (~40,000 pop.) is an affluent, politically progressive Westside LA city, home to Sony Pictures, Amazon Studios, and Apple offices. It has an unusually rich local-policy record for its size: **rent control + tenant protections** (enacted 2020, made permanent), the **MOVE Culver City** bus/bike/transit lane pilot on Washington/Culver (installed 2021, partially removed 2023 after a contentious 3–2 vote), a **2020 police-budget reduction** debate, a declared **climate emergency**, the **Inglewood Oil Field** drilling phase-out, and aggressive **TOD/upzoning** under the General Plan update. Council members here have substantial, well-documented positions — expect higher yield (6–15 stances for the most active members). Coverage: Culver City Crossroads (culvercitycrossroads.com), Culver City Observer, LA Times, Westside Current, Urbanize LA, The Real Deal, council minutes at culvercity.org.

**Migration numbering.** On-disk file counter is authoritative (stance migrations apply via raw SQL and do not register in `supabase_migrations.schema_migrations`). After Phase 129 (728_darden), **next migration = 729.** Wave 0 confirmed pre-existing Culver stance rows = 0; 44 active topics (confirmed Phase 129).

**Schema note:** `inform.compass_topics` uses `topic_key` (NOT `slug`).

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CULVERCITY-01 | Compass shows evidence-only stance data for all 5 Culver City Council members (Puza, Fish, McMorrin, O'Brien, Vera); rotational mayor (no separate office); sequential research, 100% citation rate | Supported by established stance pattern (282, 574, 703–728); external_ids from Wave 0; rich local-policy record (rent control, MOVE CC, police budget, climate) |
</phase_requirements>

---

## Culver City Roster (Confirmed from DB — Wave 0, 2026-06-16)

| external_id | full_name | UUID | title | district_type | migration |
|-------------|-----------|------|-------|---------------|-----------|
| -700550 | Freddy Puza | 1bb7df04-db6e-447f-b358-3f12526eb32e | Council Member | LOCAL | 729 |
| -700551 | Bryan Fish | 6ed5080f-e7cf-493b-9424-80dcbc8d54d0 | Council Member | LOCAL | 730 |
| -700552 | Yasmine-Imani McMorrin | 1408cd55-dccb-40fa-9296-049af125ec6f | Council Member | LOCAL | 731 |
| -700553 | Dan O'Brien | a2e727ea-2115-455c-a623-5b69a7336224 | Council Member | LOCAL | 732 |
| -700554 | Albert Vera | 435a4b18-6db9-451f-9379-a62898337825 | Council Member | LOCAL | 733 |

**5 target officials. NO excluded officials. NO separate Mayor office (rotational). Pre-existing stances: 0. Active topics: 44.**

## Likely axis anchors (verify per-member with evidence)
- **McMorrin:** most progressive — first Black CC council member; rent-control/tenant-protection champion; supported police-budget reduction; pro-MOVE transit lanes; pro-tenant. Expect many 1.0–2.0 stances.
- **Puza:** progressive — pro-housing/TOD, pro-MOVE, LGBTQ+ advocate, climate.
- **O'Brien:** more moderate/business-aligned — voted to scale back MOVE Culver City lanes; fiscal pragmatism.
- **Vera (Albert Vera Jr.):** moderate/business-friendly — small-business owner (Sorrento Italian Market family); skeptical of MOVE lanes; public-safety supportive.
- **Fish:** newer member (elected 2024) — verify positions individually.

(These are starting hypotheses ONLY — every value must rest on a cited, direct source. No defaulting.)

---

## Migration File Pattern (canonical — copy from 728_darden_stances.sql / 282_md_exec_stances.sql)

Hard rules: float literal values (`2.0`); `ARRAY[...]::text[]::text[]` double-cast sources (path-bearing URLs); whole file in `BEGIN; ... COMMIT;`; plain `$$...$$` dollar-quoting; NO row for a topic with no evidence (blank spoke; never default 3.0); zero-evidence member still gets a header + BEGIN;/COMMIT; ledger file; no INSERT INTO essentials.offices/districts/chambers; "Council Member X" (rotational-Mayor qualifier only where evidence ties to mayoral term).

## Topic UUID Reference Block (44 active — confirmed 2026-06-16)

```
abortion=af2fdfd6-02c4-49df-b09c-cf8536f4773f  ai-regulation=666bf03d-81fc-4138-ab15-69ae734c9023
campaign-finance=92730f69-ae57-401c-8ad1-2d07834a895d  childcare=c1ac1330-47f7-44ec-baf3-c913d926b97c
city-sanitation=7687de4f-4d0b-462a-b803-bdfb23b16b42  civil-rights=0bc588c6-39e1-4084-b5de-cac909b8b762
climate-change=f1e44d66-5d27-4b51-b54f-b7ace86f6a3c  data-centers=4559b513-0fd8-4ed1-babd-f3b554162f40
deportation=44905f3b-e105-4f6c-afc7-5d223813dbac  economic-development=eb3d1247-0de1-4b7f-baec-7259861efd53
fossil-fuels=a22215c3-6693-4bc2-b248-01aebba14570  growth-and-development=fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4
healthcare=e8dad4a8-eb93-4931-91f5-d8fb5d7dd529  homelessness=4938766b-b45a-46e3-93bd-b8b30651271a
homelessness-response=6fbf39ae-6b19-4182-b4c2-6a8d25c86c0f  housing=669cac97-66a6-4087-b036-936fbe62efb3
immigration=4e2c69ce-591e-4197-9cd5-7aceff79d390  jail-capacity=c267e137-0ff9-4e7d-9d13-e3cea1756cd0
judicial-access-to-justice=9d45acaf-1ba4-4cb8-95e1-5ed985223b91  judicial-bail-pretrial=1fab5edf-6151-4da0-9704-a7f2113ba54c
judicial-criminal-justice=9db07b16-1076-4b7d-ad89-ebe7b51f4336  judicial-government-deference=e5e48f0e-8f3a-40e1-8080-889fea389603
judicial-interpretation=448b1c9a-b6f3-42b8-8f39-d3bbb5bfa9ee  judicial-police-accountability=7bad33eb-e93e-4d94-8822-97212d49bde5
judicial-prosecution-priorities=abb99d95-cbb1-4617-8f8b-f220ef6028ca  judicial-transparency=6674d87e-999d-433a-aab7-3f626f59fd5f
local-environment=1935979c-b290-42e4-baa5-8cb0138b4ffa  local-immigration=b9ccee94-ad96-4f10-b655-889d8e5abe92
medicare/aid=cab61e8a-64fe-4bbd-bc08-fe9914d0091b  misinformation=ddd65d64-9dc7-4208-a30f-59f4b9c0653d
public-safety-approach=e9ebefcd-c496-45e8-b816-a79f8442ba85  redistricting=48cc9585-ec22-4f53-8d42-6839828dd36f
religious-freedom=6b9ba6d9-1001-43f5-b073-4d37130696fd  rent-regulation=c308e8e8-caac-44f5-ab04-dbfecf40bbe2
residential-zoning=d4f18138-a2e0-4110-b925-7387d9d0d16d  same-sex-marriage=c5ab4eab-702f-49b8-9277-8ea53f3835c6
school-vouchers=00b95a6a-75db-4521-b523-3326bba938de  social-security=87d20824-a6e9-407b-983c-65440084a0ab
tariffs=683c8084-2281-4920-a07c-18439b2dd413  taxes=f7e5678d-dadd-4556-a2fc-446e24642ceb
trans-athletes=d1618b9c-0b9e-45af-b986-bb33d270b8e4  transportation-priorities=ba59337e-30e2-4aba-a39a-426b3366eb27
ukraine-support=24e9212c-b011-422a-865c-093e35050901  voting-rights=d1792200-1d3b-4955-a0b7-0e6980d7a7b2
```

# Phase 115: Boston Stances - Research

**Researched:** 2026-06-13
**Domain:** Boston city officials — compass stance ingestion (inform.politician_answers + inform.politician_context)
**Confidence:** HIGH (all structure facts verified from Phase 108 migration artifacts and established project patterns)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MA-STANCES-05 | Compass shows stance data for Mayor Wu + all 13 Boston City Councillors — evidence-only, sequential research, 100% citation rate; Boston School Committee best-effort | Per-individual migrations 577-598 covering 14 council officials + 7 SC members, following identical pattern to Phase 111/112/113/114 |

</phase_requirements>

---

## Summary

Phase 115 ingests evidence-only compass stances for Mayor Michelle Wu and all 13 Boston City Councillors, with a best-effort pass at the 7 appointed Boston School Committee members. All 21 politicians are already seeded in production from Phase 108 (migrations 347, 348). This is a pure data-ingestion phase — no schema changes, no geofence work, no new scripts.

The pattern is identical to Phases 111–114. One politician at a time, one SQL migration per politician, applied immediately after research. The project has now executed this pattern for 217+ officials across MA state/federal government. The tooling is mature.

Mayor Wu has the richest record: nearly 13 years in public office (City Councillor 2014–2021, At-Large; Mayor since November 2021). The 13 City Councillors range from well-known progressives (Louijeune, Mejia, Pepén) to newer members with thinner records (Santana, Weber, Culpepper). The 7 School Committee members are mayor-appointed and typically have minimal public policy records on compass topics — treat as deliberate best-effort with a 5-minute cap.

**Primary recommendation:** Start with Mayor Wu (richest record, closes MA-STANCES-05 as anchor), then At-Large councillors (citywide public records), then District councillors (shorter records), then School Committee (best-effort, 5-min cap each). Structure plans to match the Phase 106/111 VA/MA stances pattern: one or a few politicians per plan file, phase-wide verification plan as the final plan.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stance research (evidence finding) | API / Backend | — | Web research by agent, no UI layer involved |
| SQL migration write + apply | Database / Storage | — | inform.politician_answers + inform.politician_context via Supabase MCP |
| UUID resolution (external_id → UUID) | Database / Storage | — | SELECT id FROM essentials.politicians WHERE external_id = N |
| Compass rendering (reads stances) | Browser / Client | Frontend Server (SSR) | computeDisplaySpokes() reads inform.politician_answers |
| Citation enforcement | Database / Storage | — | sources array non-empty verified per migration |

---

## Standard Stack

No new packages. This phase uses only the established migration stack.

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Supabase MCP (mcp__supabase-local__execute_sql) | N/A | Apply SQL migrations to production DB | Project standard since v1.0; mcp__supabase-local IS remote production |
| PostgreSQL 15.x (Supabase) | 15.x | inform.politician_answers + inform.politician_context writes | Project standard |

### No New Packages Required

All tooling already installed. No npm installs, no Python scripts, no new TypeScript files needed.

---

## Package Legitimacy Audit

> No new packages required for this phase. Skipped.

---

## Architecture Patterns

### System Architecture Diagram

```
[Web Research — 1 politician at a time]
  (boston.gov, wbur.org, bostonherald.com, malegislature.gov,
   ballotpedia.org, VoteSmart, councilmember official sites)
           |
           v
[Research Agent: find evidence per active compass topic]
  (21 politicians sequential; never parallel)
           |
           v
[Write SQL migration file]
  C:/EV-Accounts/backend/migrations/{N}_{firstname}_{lastname}_stances.sql
  (BEGIN; ... COMMIT; with ON CONFLICT upserts)
           |
           v
[Apply via mcp__supabase-local__execute_sql]
           |
           v
[inform.politician_answers]  +  [inform.politician_context]
  (politician_id, topic_id, value)    (politician_id, topic_id, reasoning, sources[])
           |
           v
[Verification: unpaired=0, uncited=0 per politician]
           |
           v
[Phase-wide Q1/Q2/Q3 + compass render human checkpoint]
```

### Recommended Project Structure (new files)

```
C:/EV-Accounts/backend/migrations/
  577_{firstname}_{lastname}_stances.sql   # Mayor Wu — Plan 01
  578_{firstname}_{lastname}_stances.sql   # Councillor 1
  ...
  597_{firstname}_{lastname}_stances.sql   # SC member 7
  (or fewer if some officials produce blank migrations)
```

### Pattern 1: UUID Resolution (Task 1 of each plan)

UUIDs are assigned at INSERT time via `gen_random_uuid()` in the seeding migrations — they are NOT in the migration file text. Resolve at execution time:

```sql
-- Source: 113-01-PLAN.md Task 1 pattern + 111-PATTERNS.md
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id IN (
  -2507000001, -2507000002, -2507000003, -2507000004, -2507000005,
  -2507000006, -2507000007, -2507000008, -2507000009, -2507000010,
  -2507000011, -2507000012, -2507000013, -2507000014
)
ORDER BY external_id;
-- Expected: 14 rows (city council + Mayor)

SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id IN (
  -2502790001, -2502790002, -2502790003, -2502790004,
  -2502790005, -2502790006, -2502790007
)
ORDER BY external_id;
-- Expected: 7 rows (School Committee)
```

### Pattern 2: Migration File Structure

Follows `416_christopher_flanagan_stances.sql` exactly (the Phase 113 HD-01 file, which is the most recent example):

```sql
-- ============================================================================
-- Migration {N}: {Full Name} Stances
-- ============================================================================
-- Purpose: Insert/upsert stance data for {Full Name} ({title}, Boston {role}).
--
-- Topic scope: All active compass topics attempted; evidence-only -- topics with
--   no evidence are omitted entirely (no neutral defaults per D-01).
--
-- Idempotency: ON CONFLICT (politician_id, topic_id) DO UPDATE on both tables.
-- Apply to remote Supabase via Supabase MCP (mcp__supabase-local is remote production).
-- ============================================================================

-- Topic UUID reference (inform.compass_topics, active as of 2026-06-11):
-- [PASTE FULL TOPIC BLOCK FROM 111-PATTERNS.md + data-centers addition]

-- Politician UUID: {uuid} (external_id: {N})

BEGIN;

-- ----- {Full Name} / {topic-slug} -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{uuid}', '{topic_uuid}', {value}.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{uuid}', '{topic_uuid}',
        $${reasoning — 2-5 sentences, specific votes/statements/actions}$$,
        ARRAY['{url1}', '{url2}']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

-- [repeat for each evidenced topic]

COMMIT;
```

### Pattern 3: Per-Politician Verification (after each apply)

```sql
-- Stance count:
SELECT COUNT(*) AS n FROM inform.politician_answers
WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = {N});
-- 0 acceptable if no evidence found; document as intentional blank

-- Pairing check (must be 0):
SELECT COUNT(*) AS unpaired FROM inform.politician_answers pa
LEFT JOIN inform.politician_context pc
  ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
WHERE pa.politician_id = (SELECT id FROM essentials.politicians WHERE external_id = {N})
  AND pc.politician_id IS NULL;

-- Citation check (must be 0):
SELECT COUNT(*) AS uncited FROM inform.politician_context
WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = {N})
  AND (sources IS NULL OR array_length(sources,1) IS NULL OR array_length(sources,1) = 0);
```

### Pattern 4: Phase-Wide Verification (final plan)

```sql
-- Q1: Per-official stance count (all 21):
SELECT p.external_id, p.full_name, COUNT(pa.*) AS stance_count
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id IN (
  -2507000001,-2507000002,-2507000003,-2507000004,-2507000005,
  -2507000006,-2507000007,-2507000008,-2507000009,-2507000010,
  -2507000011,-2507000012,-2507000013,-2507000014,
  -2502790001,-2502790002,-2502790003,-2502790004,
  -2502790005,-2502790006,-2502790007
)
GROUP BY p.external_id, p.full_name
ORDER BY p.external_id;
-- Expected: 21 rows; COUNT=0 acceptable for SC members with no public record

-- Q2: Phase-wide citation rate (must be 0):
SELECT COUNT(*) AS uncited_total
FROM inform.politician_context pc
JOIN essentials.politicians p ON p.id = pc.politician_id
WHERE p.external_id IN (
  -2507000001,-2507000002,-2507000003,-2507000004,-2507000005,
  -2507000006,-2507000007,-2507000008,-2507000009,-2507000010,
  -2507000011,-2507000012,-2507000013,-2507000014,
  -2502790001,-2502790002,-2502790003,-2502790004,
  -2502790005,-2502790006,-2502790007
)
AND (pc.sources IS NULL OR array_length(pc.sources,1) IS NULL OR array_length(pc.sources,1) = 0);

-- Q3: Phase-wide pairing (must be 0):
SELECT COUNT(*) AS unpaired_total
FROM inform.politician_answers pa
JOIN essentials.politicians p ON p.id = pa.politician_id
LEFT JOIN inform.politician_context pc
  ON pc.politician_id=pa.politician_id AND pc.topic_id=pa.topic_id
WHERE p.external_id IN (
  -2507000001,-2507000002,-2507000003,-2507000004,-2507000005,
  -2507000006,-2507000007,-2507000008,-2507000009,-2507000010,
  -2507000011,-2507000012,-2507000013,-2507000014,
  -2502790001,-2502790002,-2502790003,-2502790004,
  -2502790005,-2502790006,-2502790007
) AND pc.politician_id IS NULL;
```

### Anti-Patterns to Avoid

- **Parallel research agents:** Never run two politicians at once. Burns rate limit with no usable output (D-08, project feedback rule).
- **Defaulted neutral values:** No INSERT at all for topics without evidence. A 3.0 neutral guess destroys trust. Blank spoke is the correct outcome.
- **Omitting city-sanitation for Boston officials:** `city-sanitation` (UUID `7687de4f-4d0b-462a-b803-bdfb23b16b42`) IS a relevant topic for city officials — include it in research for Mayor Wu and councillors. (Contrast: omitted for state/federal reps who have no city-level record.)
- **Omitting local-environment, homelessness, housing, rent-regulation, public-safety-approach:** These are the CORE local government topics. Boston officials have documented positions on all of these. Prioritize them.
- **Missing data-centers topic:** UUID `4559b513-0fd8-4ed1-babd-f3b554162f40` was discovered during Phase 111 as active in DB but missing from earlier pattern files. The full list in 416_christopher_flanagan_stances.sql (Phase 113) IS correct and includes it.
- **Using 111-PATTERNS.md topic list without the data-centers addition:** The 111-PATTERNS.md topic block does NOT include data-centers (it was discovered mid-phase). Use the 416_christopher_flanagan_stances.sql header as the authoritative topic list.
- **Batching migrations (not applying immediately):** Each migration applied immediately after research completes. Never accumulate.

---

## Boston Official Roster

### Mayor Wu — External ID: -2507000001

**Name:** Michelle Wu
**Role:** Mayor, City of Boston (LOCAL_EXEC)
**Public record depth:** VERY RICH
**Key sources:** boston.gov/mayor, WBUR, Boston Globe, Boston Herald, Boston.com, ballotpedia.org/Michelle_Wu
**Expected stance topics:** housing, rent-regulation, residential-zoning, climate-change, local-environment, public-safety-approach, homelessness, homelessness-response, healthcare, immigration, local-immigration, city-sanitation, transportation-priorities, economic-development, growth-and-development, taxes
**Notes:**
- At-Large City Councillor 2014–2021; Mayor since November 2021 (re-elected November 2025)
- Strong progressive record: rent control advocacy, Green New Deal for Boston, fare-free MBTA pilot
- Notable positions: rent stabilization supporter, opposed casino development, championed climate resilience
- Minimum target: 10+ stances (ROADMAP success criterion)

### At-Large Councillors (geo_id='2507000')

| Name | External ID | Notes |
|------|-------------|-------|
| Ruthzee Louijeune | -2507000002 | Progressive; immigration, civil-rights, housing focus |
| Julia M. Mejia | -2507000003 | Progressive; education, civil-rights, immigration |
| Erin J. Murphy | -2507000004 | More moderate; community-safety, education |
| Henry Santana | -2507000005 | Newer member (first term 2023); thinner record |

### District Councillors (geo_id='boston-ma-council-district-{N}')

| Name | External ID | District | Neighborhood | Notes |
|------|-------------|---------|-------------|-------|
| Gabriela Coletta Zapata | -2507000006 | D1 | Charlestown, East Boston, North End | Progressive; immigration, housing |
| Edward M. Flynn | -2507000007 | D2 | Chinatown, Downtown, South Boston, South End | More moderate; public safety, veteran affairs |
| John FitzGerald | -2507000008 | D3 | Dorchester (north) | Moderate; public safety, economic development |
| Brian Worrell | -2507000009 | D4 | Dorchester (south) | Progressive; housing, racial equity |
| Enrique J. Pepén | -2507000010 | D5 | East Boston | Progressive; immigration, local-immigration |
| Benjamin J. Weber | -2507000011 | D6 | Jamaica Plain, Mission Hill | Newer progressive; housing, transit |
| Miniard Culpepper | -2507000012 | D7 | Roxbury | Newer; public safety, economic development |
| Sharon Durkan | -2507000013 | D8 | Back Bay, Beacon Hill, Fenway, Allston-Brighton | Moderate; development, transit |
| Liz Breadon (President) | -2507000014 | D9 | Allston-Brighton | Progressive; transportation, housing |

**Name note:** Enrique J. Pepén — the é accent must be preserved in all references. In SQL use the UTF-8 literal `'Enrique J. Pepén'`.

### Boston School Committee — 7 APPOINTED Members (geo_id='2502790')

**CRITICAL CORRECTION (from Phase 108 research):** ROADMAP.md Phase 115 description still says "13 elected November 2024" — this is outdated. Phase 108 research verified and executed against the correct facts:
- **7 members, not 13**
- **Mayor-appointed, not elected** (appointed model since 1991; a Home Rule petition passed City Council May 2025 but requires MA legislature + voter referendum — NOT yet law as of 2026-06-13)
- Plan accordingly: 7 members, is_appointed=true in DB (already set from migration 348)

| Name | External ID | Title | Expected Record Depth |
|------|-------------|-------|----------------------|
| Jeri Robinson | -2502790001 | School Committee Chair | Thin — education-focused only |
| Rachel Skerritt | -2502790002 | School Committee Vice Chair | Thin — appointed Aug 2025 |
| Dr. Stephen Alkins | -2502790003 | School Committee Member | Thin — reappointed Jan 2026 |
| Rafaela Polanco Garcia | -2502790004 | School Committee Member | Very thin |
| Franklin Peralta | -2502790005 | School Committee Member | Very thin — appointed Jan 2026 |
| Lydia Torres | -2502790006 | School Committee Member | Very thin — appointed Jan 2026 |
| Quoc Tran | -2502790007 | School Committee Member | Thin |

**School Committee stance approach:** 5-minute cap per member (D-04 equivalent from Phase 106 VA council). Blank spokes are the expected outcome for most. Do not fabricate stances; do not default to neutral. If no evidence found, write an empty migration (BEGIN; COMMIT; with a comment).

---

## Compass Topic Reference

The authoritative topic list is in `416_christopher_flanagan_stances.sql` (the most recent Phase 113 migration). It includes `data-centers` which was NOT in 111-PATTERNS.md.

**44 active topics as of 2026-06-12 (from 416_christopher_flanagan_stances.sql header):**

```sql
-- abortion                         af2fdfd6-02c4-49df-b09c-cf8536f4773f
-- ai-regulation                    666bf03d-81fc-4138-ab15-69ae734c9023
-- campaign-finance                 92730f69-ae57-401c-8ad1-2d07834a895d
-- childcare                        c1ac1330-47f7-44ec-baf3-c913d926b97c
-- city-sanitation                  7687de4f-4d0b-462a-b803-bdfb23b16b42
-- civil-rights                     0bc588c6-39e1-4084-b5de-cac909b8b762
-- climate-change                   f1e44d66-5d27-4b51-b54f-b7ace86f6a3c
-- data-centers                     4559b513-0fd8-4ed1-babd-f3b554162f40
-- deportation                      44905f3b-e105-4f6c-afc7-5d223813dbac
-- economic-development             eb3d1247-0de1-4b7f-baec-7259861efd53
-- fossil-fuels                     a22215c3-6693-4bc2-b248-01aebba14570
-- growth-and-development           fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4
-- healthcare                       e8dad4a8-eb93-4931-91f5-d8fb5d7dd529
-- homelessness                     4938766b-b45a-46e3-93bd-b8b30651271a
-- homelessness-response            6fbf39ae-6b19-4182-b4c2-6a8d25c86c0f
-- housing                          669cac97-66a6-4087-b036-936fbe62efb3
-- immigration                      4e2c69ce-591e-4197-9cd5-7aceff79d390
-- jail-capacity                    c267e137-0ff9-4e7d-9d13-e3cea1756cd0
-- judicial-access-to-justice       9d45acaf-1ba4-4cb8-95e1-5ed985223b91
-- judicial-bail-pretrial           1fab5edf-6151-4da0-9704-a7f2113ba54c
-- judicial-criminal-justice        9db07b16-1076-4b7d-ad89-ebe7b51f4336
-- judicial-government-deference    e5e48f0e-8f3a-40e1-8080-889fea389603
-- judicial-interpretation          448b1c9a-b6f3-42b8-8f39-d3bbb5bfa9ee
-- judicial-police-accountability   7bad33eb-e93e-4d94-8822-97212d49bde5
-- judicial-prosecution-priorities  abb99d95-cbb1-4617-8f8b-f220ef6028ca
-- judicial-transparency            6674d87e-999d-433a-aab7-3f626f59fd5f
-- local-environment                1935979c-b290-42e4-baa5-8cb0138b4ffa
-- local-immigration                b9ccee94-ad96-4f10-b655-889d8e5abe92
-- medicare/aid                     cab61e8a-64fe-4bbd-bc08-fe9914d0091b
-- misinformation                   ddd65d64-9dc7-4208-a30f-59f4b9c0653d
-- public-safety-approach           e9ebefcd-c496-45e8-b816-a79f8442ba85
-- redistricting                    48cc9585-ec22-4f53-8d42-6839828dd36f
-- religious-freedom                6b9ba6d9-1001-43f5-b073-4d37130696fd
-- rent-regulation                  c308e8e8-caac-44f5-ab04-dbfecf40bbe2
-- residential-zoning               d4f18138-a2e0-4110-b925-7387d9d0d16d
-- same-sex-marriage                c5ab4eab-702f-49b8-9277-8ea53f3835c6
-- school-vouchers                  00b95a6a-75db-4521-b523-3326bba938de
-- social-security                  87d20824-a6e9-407b-983c-65440084a0ab
-- tariffs                          683c8084-2281-4920-a07c-18439b2dd413
-- taxes                            f7e5678d-dadd-4556-a2fc-446e24642ceb
-- trans-athletes                   d1618b9c-0b9e-45af-b986-bb33d270b8e4
-- transportation-priorities        ba59337e-30e2-4aba-a39a-426b3366eb27
-- ukraine-support                  24e9212c-b011-422a-865c-093e35050901
-- voting-rights                    d1792200-1d3b-4955-a0b7-0e6980d7a7b2
```

**IMPORTANT:** Task 1 of Plan 01 MUST run a live query to verify active topic count and detect any new topics added since 2026-06-12:
```sql
SELECT slug, id FROM inform.compass_topics WHERE is_active = true ORDER BY slug;
```
If the count differs from 44, append newly discovered topics to every migration's header block.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID lookup | Hard-code UUIDs | SELECT id FROM essentials.politicians WHERE external_id = N | UUIDs are runtime-generated; must be resolved from DB |
| Stance values without evidence | Default 3.0 for unknown | No INSERT at all | Trust is destroyed by fabricated centrism; blank spoke is honest |
| Parallel research | Multiple simultaneous agents | One at a time, sequential | Burns Anthropic API rate limit with no usable output (project feedback rule) |
| Custom stance tables | New schema | inform.politician_answers + inform.politician_context | Existing schema; computeDisplaySpokes() reads from it |

---

## Plan Structure Recommendation

**Total politicians:** 21 (14 council + Mayor + 7 SC)

**Recommended plan count: 5 plans** (following Phase 106 VA stances pattern for a similar-size batch):

| Plan | Content | Migrations | Rationale |
|------|---------|-----------|-----------|
| 115-01-PLAN.md | Mayor Wu (1 official) | 577 | Rich record; needs focused research; anchor for MA-STANCES-05 |
| 115-02-PLAN.md | 4 At-Large Councillors (Louijeune, Mejia, Murphy, Santana) | 578–581 | Citywide record; similar research approach |
| 115-03-PLAN.md | District Councillors D1–D5 (Coletta Zapata, Flynn, FitzGerald, Worrell, Pepén) | 582–586 | District-level records; mixed public profiles |
| 115-04-PLAN.md | District Councillors D6–D9 (Weber, Culpepper, Durkan, Breadon) | 587–590 | District-level; some newer members |
| 115-05-PLAN.md | School Committee 7 members (5-min cap each) + phase-wide verification + compass render checkpoint | 591–597 + no-migration for empties | Best-effort; close MA-STANCES-05 |

**Alternative (fewer plans):** Could combine At-Large + D1–D5 into one plan (9 officials) for ~20-rep batch size matching Phase 113/114. Either approach is valid; 5-plan structure gives cleaner checkpoints.

**Migration numbering:** Starts at 577 (per STATE.md "Next migration: 577"). Last Phase 114 was 573; STATE.md notes 574 Boston stances and 575–576 Cambridge items that were applied after 573. So 577 is confirmed.

---

## Common Pitfalls

### Pitfall 1: Using stale topic list from 111-PATTERNS.md
**What goes wrong:** 111-PATTERNS.md omits `data-centers` (UUID 4559b513). If the executor copies from that file, all 21 politicians miss that topic.
**Why it happens:** data-centers was discovered mid-Phase 111 and was not retroactively added to the pattern file.
**How to avoid:** Copy the topic block from `416_christopher_flanagan_stances.sql` (Phase 113 HD-01), which is correct and includes data-centers. Also run the live Q2 topic count query to catch any topics added since 2026-06-12.
**Warning signs:** Topic count in migration headers is 43 instead of 44.

### Pitfall 2: Treating School Committee as 13 elected members
**What goes wrong:** ROADMAP.md Phase 115 description contains outdated language ("13 members elected November 2024"). Phase 108 corrected this: 7 appointed members, not 13 elected.
**Why it happens:** ROADMAP.md was not updated after Phase 108 corrected the pre-existing error.
**How to avoid:** Use the Phase 108-verified count of 7 appointed members in external_id range -2502790001 through -2502790007. Migrations 348 already seeded exactly these 7.
**Warning signs:** Attempting to look up external_ids -2502790008 or higher — those politicians do not exist.

### Pitfall 3: Including judicial topics for city officials
**What goes wrong:** Judicial topics (judicial-access-to-justice, judicial-bail-pretrial, judicial-criminal-justice, judicial-government-deference, judicial-interpretation, judicial-police-accountability, judicial-prosecution-priorities, judicial-transparency) are typically for judges or officials with judicial/prosecutorial records.
**Why it happens:** Topic list is exhaustive; naive research attempts all topics.
**How to avoid:** Research all 44 topics per D-01 (the project rule is to attempt all topics), but expect zero evidence for most judicial topics for city councillors. Only Wu (as former AG candidate context) or Flynn (law enforcement family background) might have any relevant judicial statements. Blank spokes for judicial topics on city councillors are the expected and correct outcome.
**Warning signs:** Inserting judicial topic rows for councillors citing city council agendas — those are not evidence of judicial philosophy.

### Pitfall 4: Omitting city-sanitation for Boston city officials
**What goes wrong:** For state/federal representatives, city-sanitation (UUID 7687de4f) is typically omitted because state/federal officials rarely have documented local sanitation positions. For Boston CITY officials this is different — they control DPW, trash collection, street cleaning. Mayor Wu has documented positions on zero-waste, composting, and refuse collection reform.
**Why it happens:** Prior phases (111–114) trained the executor to omit city-sanitation for most politicians.
**How to avoid:** city-sanitation is a FIRST-TIER topic for Mayor Wu and ALL Boston City Councillors. Research it actively.
**Warning signs:** Mayor Wu migration has no city-sanitation row despite her documented composting and zero-waste initiatives.

### Pitfall 5: Applying migration with placeholder UUID
**What goes wrong:** If an executor copies a UUID from a prior politician's migration without running the UUID resolution query, the wrong politician gets the stances.
**Why it happens:** Copy-paste from a prior migration file.
**How to avoid:** Always resolve UUIDs via `SELECT id FROM essentials.politicians WHERE external_id = N` before writing the migration. Paste the resolved UUID into the migration header as a verification comment (established project pattern).
**Warning signs:** Verification query for external_id N returns 0 rows after apply (stances landed on a different politician_id).

### Pitfall 6: Forgetting the pairing rule (answers before context)
**What goes wrong:** `inform.politician_answers` INSERT must come before `inform.politician_context` INSERT for each topic. The pairing check catches if answers exist without context, not the reverse.
**Why it happens:** Accidentally writing context INSERT first.
**How to avoid:** Always: answers INSERT first, then context INSERT. Both ON CONFLICT DO UPDATE.
**Warning signs:** unpaired > 0 in the post-apply verification.

---

## Research Source Guidance for Boston Officials

### Mayor Wu
- `https://boston.gov/mayor` — official statements, policy announcements
- `https://www.wbur.org/tag/michelle-wu` — WBUR coverage (most comprehensive)
- `https://www.bostonglobe.com/tags/michelle-wu/` — Globe coverage
- `https://ballotpedia.org/Michelle_Wu` — voting record, positions
- `https://www.bostonherald.com/tag/michelle-wu/` — additional coverage
- Boston City Council voting records (pre-Mayor): `https://boston.legistar.com/`

### City Councillors (all 13)
- Boston City Council Legistar: `https://boston.legistar.com/` — voting records, sponsored ordinances
- `https://boston.gov/departments/city-council/{name}` — official pages
- Individual councillor websites (most have .boston.gov subdomains or personal sites)
- WBUR Boston: `https://www.wbur.org/news/boston`
- Boston Globe, Boston Herald for notable votes
- Ballotpedia individual pages where available

### School Committee (7 members — best-effort, 5-min cap)
- `https://www.bostonpublicschools.org/school-committee/about/{name}` — BPS official pages
- Boston.gov appointment press releases for newer members (Skerritt, Alkins, Torres, Peralta — all Jan 2026)
- WBUR education coverage
- **Expected outcome:** Most will have blank spokes. Do not fabricate positions.

---

## Migration Naming Convention

Following Phase 113/114 pattern exactly:

```
{N}_{firstname}_{lastname}_stances.sql
```

Examples:
- `577_michelle_wu_stances.sql`
- `578_ruthzee_louijeune_stances.sql`
- `579_julia_mejia_stances.sql`
- `580_erin_murphy_stances.sql`
- `581_henry_santana_stances.sql`
- `582_gabriela_coletta_zapata_stances.sql`
- `583_edward_flynn_stances.sql`
- `584_john_fitzgerald_stances.sql`
- `585_brian_worrell_stances.sql`
- `586_enrique_pepen_stances.sql`  (accent stripped in filename — UTF-8 name in SQL)
- `587_benjamin_weber_stances.sql`
- `588_miniard_culpepper_stances.sql`
- `589_sharon_durkan_stances.sql`
- `590_liz_breadon_stances.sql`
- `591_jeri_robinson_stances.sql`
- `592_rachel_skerritt_stances.sql`
- `593_stephen_alkins_stances.sql`
- `594_rafaela_polanco_garcia_stances.sql`
- `595_franklin_peralta_stances.sql`
- `596_lydia_torres_stances.sql`
- `597_quoc_tran_stances.sql`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Boston School Committee: 13 elected (ROADMAP claim) | 7 appointed (Phase 108 verified) | Phase 108 research 2026-06-10 | Seed 7 politicians, not 13; best-effort cap still applies |
| topic list: 43 topics (111-PATTERNS.md) | 44 topics including data-centers (Phase 111 mid-phase discovery) | Phase 111 Plan 05 2026-06-11 | Copy topic block from 416_flanagan file, not PATTERNS.md |
| Phase 115 "not started" (ROADMAP) | Ready to execute (STATE.md, next migration: 577) | 2026-06-13 | Next migration confirmed: 577 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Active topic count remains 44 as of execution time | Compass Topic Reference | Low — executor runs live Q2 to verify; any new topics appended |
| A2 | Migration 577 is the next available number | Migration Numbering | Low — STATE.md confirms 577; executor should assert before writing |
| A3 | Councillor public records accessible via boston.legistar.com voting records | Research Source Guidance | Low — Legistar is the official public record; alternative: WBUR/Globe/Ballotpedia |
| A4 | Enrique J. Pepén — é accent can be written as UTF-8 literal in SQL file | Boston Official Roster | Low — established precedent from migration 347 (same character, same pattern as Peña-Melnyk MD) |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. The 4 assumptions above are LOW risk and have fallbacks built into the execution pattern.

---

## Open Questions

1. **Active topic count at execution time**
   - What we know: 44 topics active as of 2026-06-12 (verified from 416_flanagan migration header)
   - What's unclear: Whether any topics were added between 2026-06-12 and execution of Phase 115
   - Recommendation: Always run `SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true` as Task 1 of Plan 01; diff against 44

2. **Pre-existing stance rows for Boston officials**
   - What we know: Boston officials were seeded in Phase 108 (2026-06-10); no stances were seeded then
   - What's unclear: Whether any ad-hoc stances were inserted during other phases (unlikely but possible — Phase 114 SESSION context mentions "pre-existing rows" for some MA House reps from prior sessions)
   - Recommendation: Task 1 of Plan 01 should run a quick pre-flight: `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON p.id = pa.politician_id WHERE p.external_id BETWEEN -2507000014 AND -2507000001`. If any rows exist, note them — ON CONFLICT DO UPDATE will handle them correctly (upsert), but knowing the baseline count is useful for verification.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase MCP (mcp__supabase-local) | Migration apply | ✓ | production | — |
| inform.politician_answers table | Stance storage | ✓ (used by 500+ prior migrations) | — | — |
| inform.politician_context table | Citation storage | ✓ (used by 500+ prior migrations) | — | — |
| essentials.politicians (Boston rows) | UUID resolution | ✓ (migration 347, 348 applied 2026-06-10) | 21 rows confirmed | — |
| Web research (boston.gov, legistar, WBUR, Globe) | Evidence finding | ✓ | Current | ballotpedia, Boston Herald, official councillor sites |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL post-verification queries (project pattern — no separate test runner) |
| Config file | None — inline queries in plan tasks |
| Quick run command | mcp__supabase-local__execute_sql (per-politician unpaired/uncited checks) |
| Full suite command | Phase-wide Q1/Q2/Q3 queries in final plan (Plan 05) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MA-STANCES-05 | 14 council officials + 7 SC members attempted; 100% citation rate | smoke | Q1/Q2/Q3 queries in final plan | ❌ Plan 05 defines them |
| MA-STANCES-05 | Compass renders on Mayor Wu profile | manual | Visit https://essentials.empowered.vote/politician/{wu-slug} | ❌ Human checkpoint in final plan |

### Sampling Rate

- **Per politician (after each apply):** unpaired=0, uncited=0 checks via mcp__supabase-local
- **Per plan wave:** Stance count table for the batch
- **Phase gate:** Full Q1/Q2/Q3 + compass render before MA-STANCES-05 closed

### Wave 0 Gaps

None — no new test infrastructure needed. The SQL verification pattern is well-established across 500+ prior stance migrations in Phases 111–114.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Yes (SQL dollar-quoting) | PostgreSQL `$$...$$` dollar-quoting prevents injection in reasoning text |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via scraped reasoning text | Tampering | Dollar-quoting (`$$...$$`) for all reasoning strings — never single-quote concatenation |
| Fabricated source URLs in sources array | Spoofing | Executor judgment: only real URLs from actual pages; never fabricate |

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/migrations/347_boston_government.sql` — Boston official external_id scheme, name literals, full roster (all 14 council officials confirmed with external_ids)
- `C:/EV-Accounts/backend/migrations/348_boston_school_committee.sql` — School Committee 7-member roster, external_ids -2502790001 through -2502790007, is_appointed=true
- `C:/EV-Accounts/backend/migrations/416_christopher_flanagan_stances.sql` — Authoritative 44-topic list including data-centers; canonical migration format
- `.planning/phases/111-ma-stances-execs-federal/111-PATTERNS.md` — Per-stance INSERT pattern, verification comment block, shared rules
- `.planning/phases/111-ma-stances-execs-federal/111-CONTEXT.md` — D-01 through D-10 project-wide stances decisions
- `.planning/phases/108-boston-deep-seed/108-RESEARCH.md` — School Committee correction (7 appointed, not 13 elected); Phase 108 VERIFICATION.md confirms all 21 politicians in production DB
- `.planning/STATE.md` — Next migration: 577 confirmed

### Secondary (MEDIUM confidence)
- Phase 108 VERIFICATION.md — Confirms migration 347 + 348 applied and all 21 politicians seeded in production
- Phase 114 plans and STATE.md — Confirm Phase 114 complete; migration 573 was last Phase 114 migration; 577 is correct next number
- `.planning/phases/113-ma-stances-house-wave-1/113-01-PLAN.md` — Current plan format reference (task structure, 4-step pattern: research → write SQL → apply → verify)

---

## Metadata

**Confidence breakdown:**
- Roster and external_ids: HIGH — extracted from production migration files
- Topic UUIDs: HIGH — from production migration files (execution must still verify live count)
- Migration numbering: HIGH — STATE.md confirms 577
- Plan structure: HIGH — follows established Phase 106/111/112/113/114 pattern
- Evidence availability for Boston officials: MEDIUM — Wu is HIGH confidence; councillors MEDIUM; SC members LOW

**Research date:** 2026-06-13
**Valid until:** 2026-09-01 (council roster stable until November 2027 elections; SC appointments change with Mayor Wu's discretion)

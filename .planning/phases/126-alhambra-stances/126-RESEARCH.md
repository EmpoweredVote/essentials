# Phase 126: Alhambra Stances - Research

**Researched:** 2026-06-15
**Domain:** Evidence-only compass stance ingestion for Alhambra City Council (5 officials)
**Confidence:** HIGH

---

## Summary

Phase 126 applies evidence-only compass stances for all 5 Alhambra City Council members: Katherine Lee (D1), Ross J. Maza (D2), Jeff Maloney (D3), Noya Wang (D4), and Adele Andrade-Stadler (D5). These officials were seeded in v7.0 migration 307 with external_ids -700450 through -700454. The pattern is fully established from Phases 106, 111–115, 122–124 — no new SQL patterns, tables, or schema are introduced.

Alhambra is a mid-size suburban city in the San Gabriel Valley (pop. ~86,000), predominantly Asian-American and Latino. It has no separately elected Mayor — the "Mayor" title rotates among council members on a 9-month cycle (Pitfall: see CRITICAL WARNING below). Noya Wang currently holds the rotational Mayor title as of 2025–2026, but her formal seeded office is Council Member (District 4). All 5 officials are seeded as "Council Member" only. The compass stances cover all 44 active topics; evidence is expected to be thin for most members given Alhambra's smaller local press footprint compared to LA City or Santa Monica.

The migration format is identical to the canonical pattern from 282_md_exec_stances.sql / 574_boston_stances.sql: one migration file per politician, paired `INSERT INTO inform.politician_answers` + `INSERT INTO inform.politician_context` blocks with `ON CONFLICT DO UPDATE`, float literals, dollar-quoting for reasoning, and `ARRAY[...]::text[]::text[]` for sources.

**CRITICAL WARNING — migration numbering:** STATE.md says "next migration: 699" but migrations 699–702 already exist on disk (699=Newton tiger geo_id backfill, 700=Mullane stances, 701=Fall River gaps, 702=New Bedford gaps). The actual next available migration for Phase 126 must be determined by Wave 0 pre-flight via `SELECT MAX(version::int) FROM supabase_migrations.schema_migrations` + disk listing. Expected next migration is 703 if all 699–702 are applied, but **this MUST be verified**.

**Primary recommendation:** Follow the exact migration pattern from 282_md_exec_stances.sql (float values `2.0` not bare `2`; BEGIN/COMMIT wrapper; dollar-quoted reasoning; double-cast sources array). Research officials in external_id order; apply each migration immediately. Run Wave 0 pre-flight first to confirm actual next migration number, verify all 5 UUIDs, and confirm active topic count is still 44.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stance data storage | Database (Supabase) | — | `inform.politician_answers` + `inform.politician_context` tables |
| Stance evidence research | Research agent (Claude) | Web sources | Agent reads public records, produces SQL output |
| Migration application | Supabase MCP (`mcp__supabase-local`) | — | `mcp__supabase-local` IS remote production |
| Compass rendering | Frontend (ev-ui) | — | `computeDisplaySpokes()` in src/lib/compass.js reads from DB |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ALHAMBRA-01 | Compass shows evidence-only stance data for Alhambra City Council (5 members: Lee, Maza, Maloney, Wang, Andrade-Stadler); sequential research, 100% citation rate, no blank-default values | Fully supported by established stance pattern (282, 574 canonical analogs); external_ids confirmed from migration 307; rotational Mayor pitfall documented below |
</phase_requirements>

---

## Standard Stack

### Core

No new packages. This phase uses only:

| Tool | Version | Purpose |
|------|---------|---------|
| Supabase MCP (`mcp__supabase-local`) | live | Apply SQL migrations to remote production DB |
| PostgreSQL SQL | — | Migration files: paired INSERT + upsert pattern |
| inform.politician_answers | — | Stores stance value (1.0–5.0 float) |
| inform.politician_context | — | Stores reasoning text + sources array |

### No Installation Needed

All tools in use. No `npm install`, `pip install`, or external package installs required for this phase.

---

## Package Legitimacy Audit

No external packages are installed in this phase. Section not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
Research agent (Claude)
     |
     | reads public web sources
     v
Evidence (city council meeting minutes, votes, statements, press coverage)
     |
     | produces value (1.0-5.0) + reasoning + URL(s)
     v
SQL migration file (NNN_lastname_stances.sql)
     |
     | mcp__supabase-local__execute_sql
     v
inform.politician_answers  (politician_id, topic_id, value)
inform.politician_context  (politician_id, topic_id, reasoning, sources[])
     |
     | computeDisplaySpokes() in ev-ui reads these rows
     v
Compass spoke chart on politician profile page
```

### Recommended Project Structure

```
C:/EV-Accounts/backend/migrations/
├── NNN_lee_stances.sql              # Katherine Lee (D1) — migration NNN
├── NNN+1_maza_stances.sql           # Ross J. Maza (D2)
├── NNN+2_maloney_stances.sql        # Jeff Maloney (D3)
├── NNN+3_wang_stances.sql           # Noya Wang (D4)
└── NNN+4_andrade_stadler_stances.sql  # Adele Andrade-Stadler (D5)
```

Note: NNN = actual next migration confirmed at Wave 0 pre-flight. Based on disk state (702 is highest), next is likely 703, but verify.

### Pattern 1: Per-Individual Stance Migration (canonical)

[VERIFIED: 282_md_exec_stances.sql, 574_boston_stances.sql, 106-PATTERNS.md, 111-PATTERNS.md, 122-PATTERNS.md]

```sql
-- ============================================================================
-- Migration NNN: {FirstName LastName} Stances
-- ============================================================================
-- Purpose: Insert/upsert stance data for {FirstName LastName} ({title}).
--
-- Topic scope: All active compass topics attempted; evidence-only — topics with
--   no evidence are omitted entirely (no neutral defaults per D-01).
--
-- Idempotency: ON CONFLICT (politician_id, topic_id) DO UPDATE on both tables.
-- Apply to remote Supabase via Supabase MCP (mcp__supabase-local is remote production).
-- ============================================================================

-- Topic UUID reference (inform.compass_topics):
-- [paste full active topic block from Section below]

BEGIN;

-- ============================================================
-- {FirstName LastName}
-- ============================================================

-- ----- {FirstName LastName} / {topic-slug} -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{politician_uuid}',
        '{topic_uuid}',
        {N}.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{politician_uuid}',
        '{topic_uuid}',
        $$[2-5 sentences of evidence-anchored reasoning with specific votes/statements/actions]$$,
        ARRAY['https://url1/path', 'https://url2/path']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

-- [repeat for each topic with evidence]

COMMIT;

-- ============================================================================
-- Verification queries (run after applying):
-- ============================================================================
-- SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id = '{uuid}';
-- SELECT COUNT(*) FROM inform.politician_answers pa
-- LEFT JOIN inform.politician_context pc
--   ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
-- WHERE pa.politician_id = '{uuid}' AND pc.politician_id IS NULL;
-- SELECT COUNT(*) FROM inform.politician_context
-- WHERE politician_id = '{uuid}'
--   AND (sources IS NULL OR array_length(sources, 1) IS NULL OR array_length(sources, 1) = 0);
```

### Anti-Patterns to Avoid

- **Bare integer values:** Using `4` instead of `4.0` — files 589/597 deviate; use 282/574 format
- **Parallel research:** Never launch two research sub-agents simultaneously — burns rate limit quota
- **Default neutral values:** Inserting `3.0` for topics with no evidence — blank spoke is honest
- **Missing BEGIN/COMMIT:** Files 589/597 omit this; every file must be wrapped
- **Citing domain-only URLs:** sources must include path, not just domain
- **"Mayor" in title or reasoning:** Do NOT refer to any Alhambra council member as "Mayor" in the reasoning text — the DB title is "Council Member (District N)"; the rotational Mayor title is ceremonial and not seeded

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Compass position scale | Custom scoring algorithm | Research agent places on 1–5 scale per topic axis definition | Scale semantics defined in topic; must be consistent |
| Citation storage | Custom citation table | `inform.politician_context.sources` array (already exists) | Schema is fixed |
| Politician UUID resolution | Hard-coded guesses | `SELECT id FROM essentials.politicians WHERE external_id = {N}` | UUIDs are random at insert time |
| Topic UUID lookup | Hard-coded topic names | Topic UUID reference block below | Topics have UUID primary keys, not text keys |

---

## Politician Roster and External IDs

All external IDs are [VERIFIED: migration 307_la_wave3_whittier_alhambra.sql, read directly from migration file].

| external_id | Name (as seeded) | Title | District |
|-------------|------------------|-------|----------|
| -700450 | Katherine Lee | Council Member (District 1) | D1 |
| -700451 | Ross J. Maza | Council Member (District 2) | D2 |
| -700452 | Jeff Maloney | Council Member (District 3) | D3 |
| -700453 | Noya Wang | Council Member (District 4) | D4 — rotational Mayor 2025-26 (ceremonial only) |
| -700454 | Adele Andrade-Stadler | Council Member (District 5) | D5 |

**IMPORTANT — Rotational Mayor (Pitfall 7 inherited from v7.0):** Alhambra does NOT have a separately elected Mayor. The "Mayor" title rotates among the 5 council members every ~9 months. As of 2025–2026, Noya Wang holds the rotational title. Her seeded office is `Council Member (District 4)` — she has no LOCAL_EXEC district and no separate chamber. When researching Wang, search for "Noya Wang Alhambra Mayor" but write migration with her District 4 council context. Do NOT add a new Mayor office row.

**UUID resolution query (run at Wave 0 pre-flight):**
```sql
-- Resolve all 5 Alhambra officials at once:
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id BETWEEN -700454 AND -700450
ORDER BY external_id DESC;
```

Expected order by external_id DESC:
- -700450: Katherine Lee
- -700451: Ross J. Maza
- -700452: Jeff Maloney
- -700453: Noya Wang
- -700454: Adele Andrade-Stadler

---

## Migration Numbering

[NEEDS VERIFICATION at Wave 0 pre-flight — see Critical Warning in Summary]

STATE.md says "next migration: 699" but this is the value from Phase 124-05 closure. Subsequent sessions created migrations 699–702:
- 699: Newton tiger geo_id backfill [VERIFIED: file exists on disk]
- 700: Liz Mullane (Medford) stances [VERIFIED: file exists on disk]
- 701: Fall River gap-fill stances [VERIFIED: file exists on disk]
- 702: New Bedford gap-fill stances [VERIFIED: file exists on disk]

If 699–702 are all applied to the DB (most likely), then **Phase 126 starts at migration 703**.
5 officials → migrations 703–707 (one per official).

**Wave 0 MUST verify:**
```sql
-- Confirm highest applied migration:
SELECT MAX(version::int) AS max_applied
FROM supabase_migrations.schema_migrations;

-- Also confirm 699-702 specifically applied:
SELECT version FROM supabase_migrations.schema_migrations
WHERE version IN ('699', '700', '701', '702')
ORDER BY version;
```

---

## Topic UUID Reference Block

[VERIFIED: 122-PATTERNS.md, 111-PATTERNS.md — confirmed against live DB pattern; planner must verify active count at Wave 0 via `SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true`]

Expected count: 44 active topics.

```sql
-- Topic UUID reference (inform.compass_topics):
-- abortion                         af2fdfd6-02c4-49df-b09c-cf8536f4773f
-- ai-regulation                    666bf03d-81fc-4138-ab15-69ae734c9023
-- campaign-finance                 92730f69-ae57-401c-8ad1-2d07834a895d
-- childcare                        c1ac1330-47f7-44ec-baf3-c913d926b97c
-- city-sanitation                  7687de4f-4d0b-462a-b803-bdfb23b16b42
-- civil-rights                     0bc588c6-39e1-4084-b5de-cac909b8b762
-- climate-change                   f1e44d66-5d27-4b51-b54f-b7ace86f6a3c
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

---

## Expected Evidence Quality by Official

[ASSUMED — based on city size (~86k pop), suburban SGV context, local press footprint, and known council tenures]

Alhambra is a mid-size suburban city with limited local press. The primary evidence source will be Alhambra City Council meeting minutes and agenda items (alhambraca.gov), supplemented by San Gabriel Valley Tribune / SGV Tribune, Alhambra Source (hyperlocal digital outlet), and Patch (alhambra.patch.com). State-level and national topics (immigration, deportation, climate) will have thin evidence for all 5 members; local-scope topics (housing, zoning, homelessness-response, local-environment, public-safety-approach) are more likely to have council votes on record.

### Katherine Lee (D1) — external_id -700450

[ASSUMED] Longest-serving council member in Alhambra based on public record patterns (multiple terms). Most likely to have the richest individual record. Alhambraca.gov lists her as having served since approximately 2010. Expected yield: 4–8 stances. Key likely topics: housing, residential-zoning, growth-and-development, public-safety-approach, local-immigration (Alhambra is ~50% Asian-American — immigration policy has local salience).

### Ross J. Maza (D2) — external_id -700451

[ASSUMED] Council member since approximately 2020. Moderate public record. Expected yield: 2–6 stances. Focus on local-scope topics from council agenda votes (zoning, homelessness, development).

### Jeff Maloney (D3) — external_id -700452

[ASSUMED] Has served multiple terms. May have taken public positions on local development and public safety. Expected yield: 2–6 stances. Check for San Gabriel Valley Tribune coverage and any SGV city coalition positions.

### Noya Wang (D4) — external_id -700453

[ASSUMED] Current rotational Mayor (2025–2026 rotation). Higher press visibility than other members due to Mayor title. Expected yield: 4–9 stances. As rotational Mayor she may have more public statements; also serves as a key vote on city policy. Search as "Noya Wang Alhambra" and "Mayor Wang Alhambra." Note: her DB office is Council Member D4 — do not create a Mayor office row.

### Adele Andrade-Stadler (D5) — external_id -700454

[ASSUMED] Has served multiple terms. May have community advocacy background based on compound Spanish-English surname pattern. Expected yield: 2–5 stances. Focus on council meeting votes; check SGV Tribune.

### Overall Phase Yield Estimate

[ASSUMED] Total expected: 15–35 stance rows across all 5 officials. This is thinner than larger progressive cities (e.g., WeHo, Santa Monica) but comparable to the Waltham/Fall River tier (19 and 17 rows respectively). Blank spokes are expected and honest for thin-record members on national-scope topics.

---

## Local Press Sources for Research

Primary sources (in order of expected evidence density):

1. **Alhambra City Council meeting records** — alhambraca.gov/agendas-minutes (agenda packets + approved minutes; council votes on record for housing, zoning, public safety)

2. **San Gabriel Valley Tribune / SGV Tribune** — sgvtribune.com — covers Alhambra city government; search "{member name} Alhambra"

3. **Alhambra Source** — alhambraource.com — hyperlocal digital outlet specifically covering Alhambra city government and council actions

4. **Patch (Alhambra)** — patch.com/california/alhambra — local-issues coverage; useful for council debates and member statements

5. **Los Angeles Times (SGV section)** — latimes.com — covers major Alhambra issues (housing, immigration enforcement) when they break into regional coverage

6. **Alhambra School District (AUSD) adjacent coverage** — sometimes council members comment on school-related ballot measures or taxes

7. **Ballotpedia** — ballotpedia.org — candidate profiles, election coverage; limited for city council members but useful for platform statements

8. **Official Alhambra city council member bio pages** — alhambraca.gov/297/City-Council — may contain bios and stated positions; confirm URL works (was valid at v7.0 seeding)

**Topics with highest evidence probability for Alhambra:**
- `housing` — active SGV housing discussions; RHNA compliance votes likely
- `residential-zoning` — growth vs. preservation debates common in SGV cities
- `homelessness-response` — SGV cities have active responses to unhoused populations
- `growth-and-development` — commercial development in San Gabriel Valley
- `public-safety-approach` — law enforcement positions frequently documented in local press
- `local-immigration` — Alhambra's ~50% Asian-American + ~45% Latino demographics make immigration/local enforcement votes locally significant
- `local-environment` — air quality (near 10 Freeway), parks, urban tree canopy

**Topics with lowest evidence probability for Alhambra:**
- `ukraine-support` — no local angle; city council resolutions on this rare for SGV cities
- `judicial-*` (6 topics) — only applicable if a member made public statement about courts; very unlikely for city council
- `tariffs` — national trade policy rarely voted on at city level
- `redistricting` — applies only to state legislature topics unless they commented on CA redistricting
- `same-sex-marriage` — legally settled; no likely recent council position

---

## Common Pitfalls

### Pitfall 1 (Inherited): Float vs. Integer Value

**What goes wrong:** Writing `value = 4` instead of `value = 4.0`
**Why it happens:** Files 589/597 use bare integers; executor may follow that pattern
**How to avoid:** Use float literals always: `1.0`, `2.0`, `3.0`, `4.0`, `5.0`
**Warning signs:** `VALUES ('uuid', 'topic_uuid', 4)` without `.0`

### Pitfall 2 (Inherited): Parallel Research Sessions

**What goes wrong:** Research agent for official N+1 starts before official N's migration is applied
**Why it happens:** Impatience; planner may queue multiple agents
**How to avoid:** Sequential: research → write SQL → apply migration → verify → next person
**Warning signs:** Two active Claude research sub-tasks in the same session

### Pitfall 3 (Inherited): Fabricating Evidence for Sparse Records

**What goes wrong:** Writing `3.0` (neutral) for a council member with no public record
**Why it happens:** Pressure to "fill in" the compass
**How to avoid:** No INSERT if no direct statement, vote, or action found. Blank spoke is correct.
**Warning signs:** Sources array contains only generic city website links with no specific statements

### Pitfall 4 (Inherited): Missing BEGIN/COMMIT

**What goes wrong:** Migration runs but partial data written on failure
**Why it happens:** Copying format from 597/589 which lack transaction wrappers
**How to avoid:** Every file uses `BEGIN; ... COMMIT;` wrapping all INSERT blocks
**Warning signs:** File jumps from header to first INSERT with no `BEGIN;`

### Pitfall 5 (Inherited): Sources Array Single-Cast

**What goes wrong:** Writing `ARRAY['url']::text[]` instead of `ARRAY['url']::text[]::text[]`
**Why it happens:** The double-cast looks redundant
**How to avoid:** Always double-cast — project standard from 282_md_exec_stances.sql
**Warning signs:** Only one `::text[]` in sources array

### Pitfall 6 (NEW — Alhambra-specific): Rotational Mayor Confusion

**What goes wrong:** Creating a new Mayor office row for Noya Wang, or setting her title to "Mayor" in the migration, or adding a LOCAL_EXEC district for Alhambra
**Why it happens:** Noya Wang is publicly called "Mayor Wang" in 2025–2026 coverage; executor may create a Mayor office
**How to avoid:** Alhambra has NO separately elected Mayor (Pitfall 7 from migration 307). Wang's seeded office is `Council Member (District 4)`. The rotation is ceremonial. Her politician_id links to the District 4 office only. Do NOT create any new offices or districts.
**Warning signs:** Migration contains `INSERT INTO essentials.offices` or `INSERT INTO essentials.districts`

### Pitfall 7 (NEW — Alhambra-specific): Stale Migration Number

**What goes wrong:** Using migration 699 (already occupied by Newton tiger geo_id backfill)
**Why it happens:** STATE.md says "next migration: 699" but that is stale — 699–702 now exist on disk
**How to avoid:** Wave 0 pre-flight MUST run `SELECT MAX(version::int) FROM supabase_migrations.schema_migrations` before any migration is written; use MAX+1 as starting number
**Warning signs:** Planner uses 699 without running Wave 0 pre-flight first

### Pitfall 8 (NEW — Alhambra-specific): "Mayor" in Reasoning Text

**What goes wrong:** Migration reasoning text refers to "Mayor Katherine Lee" or "Mayor Wang said..."
**Why it happens:** Local press calls the rotational holder "Mayor"; executor copies this language
**How to avoid:** Use "Council Member Lee" or "Alhambra Council Member Wang" in reasoning text; note the rotational title context if needed ("as rotational Mayor in 2025, Wang stated...")
**Warning signs:** Reasoning text contains "Mayor [Surname]" without the "rotational" qualifier

---

## Verification Queries

### Wave 0 Pre-Flight (run before writing any migration)

```sql
-- 1. Confirm highest applied migration (determines starting number):
SELECT MAX(version::int) AS max_applied
FROM supabase_migrations.schema_migrations;

-- 2. Confirm 699-702 are applied:
SELECT version FROM supabase_migrations.schema_migrations
WHERE version IN ('699', '700', '701', '702')
ORDER BY version;

-- 3. Confirm active topic count (must be 44):
SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true;

-- 4. Resolve all 5 Alhambra UUIDs:
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id BETWEEN -700454 AND -700450
ORDER BY external_id DESC;

-- 5. Check for pre-existing stance rows (upsert handles them; informational only):
SELECT COUNT(*) FROM inform.politician_answers
WHERE politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id BETWEEN -700454 AND -700450
);

-- 6. Confirm NO Mayor chamber or LOCAL_EXEC district for Alhambra:
SELECT c.name FROM essentials.chambers c
JOIN essentials.governments g ON g.id = c.government_id
WHERE g.geo_id = '0600884';
-- Expected: exactly 1 row — "City Council" only; no "Mayor" chamber
```

### Per-Person Verification (after each migration)

```sql
-- Row count (must be >= 1 if evidence found, or 0 if blank-spoke):
SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id = '{uuid}';

-- Unpaired check (must return 0):
SELECT COUNT(*) FROM inform.politician_answers pa
LEFT JOIN inform.politician_context pc
  ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
WHERE pa.politician_id = '{uuid}' AND pc.politician_id IS NULL;

-- Citation check (must return 0):
SELECT COUNT(*) FROM inform.politician_context
WHERE politician_id = '{uuid}'
  AND (sources IS NULL OR array_length(sources, 1) IS NULL OR array_length(sources, 1) = 0);
```

### Phase-Wide Closure Verification (run at phase close)

```sql
-- Q1: Stance count per official (all 5 Alhambra members):
SELECT p.full_name, p.external_id, COUNT(pa.topic_id) AS stances
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id BETWEEN -700454 AND -700450
GROUP BY p.full_name, p.external_id
ORDER BY p.external_id DESC;

-- Q2: Uncited rows — must return 0:
SELECT COUNT(*) FROM inform.politician_context pc
WHERE pc.politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id BETWEEN -700454 AND -700450
)
AND (sources IS NULL
     OR array_length(sources, 1) IS NULL
     OR array_length(sources, 1) = 0);

-- Q3: Unpaired answers — must return 0:
SELECT COUNT(*) FROM inform.politician_answers pa
LEFT JOIN inform.politician_context pc
  ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
WHERE pa.politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id BETWEEN -700454 AND -700450
)
AND pc.politician_id IS NULL;

-- Q4: Dead topic check — must return 0 (no stances on retired topics):
SELECT pa.topic_id, ct.slug, ct.is_active, COUNT(*) as rows
FROM inform.politician_answers pa
JOIN inform.compass_topics ct ON ct.id = pa.topic_id
WHERE pa.politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id BETWEEN -700454 AND -700450
)
AND ct.is_active = false
GROUP BY pa.topic_id, ct.slug, ct.is_active;
-- Expected: 0 rows
```

---

## Runtime State Inventory

Step 2.5: SKIPPED — this is a stance ingestion phase, not a rename/refactor/migration of existing data. No stored keys, collection names, or OS-registered state are being renamed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `mcp__supabase-local` | All migrations | Yes (confirmed live per project memory) | — | None — required |
| `inform.politician_answers` table | Stance storage | Yes (pre-existing) | — | None — required |
| `inform.politician_context` table | Citation storage | Yes (pre-existing) | — | None — required |
| `essentials.politicians` (Alhambra -700454..-700450) | UUID resolution | Yes (migration 307 applied in v7.0) | — | None — required |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

`workflow.nyquist_validation` not set (absent = enabled), but this phase has no automated test framework — stance migrations are verified through SQL verification queries run inline in each plan task, not via a test suite. Phase-wide closure verification (Q1/Q2/Q3/Q4 queries) is the testing mechanism.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| ALHAMBRA-01 | All 5 officials attempted; 100% citation; no defaults | SQL verification | Per-person queries (row count + unpaired + uncited) + phase-wide Q1/Q2/Q3/Q4 |

### Sampling Rate

- **Per migration applied:** Run per-person Q1 (row count), Q2 (unpaired), Q3 (uncited) — three queries
- **Per wave merge:** Run full phase-wide Q1/Q2/Q3/Q4 across all 5 politicians
- **Phase gate:** Full suite green + compass render checkpoint on at least one Alhambra official profile before marking ALHAMBRA-01 closed

### Wave 0 Gaps

None — no new test infrastructure needed; SQL verification queries are inline in plan tasks.

---

## Security Domain

This phase writes only to `inform.politician_answers` and `inform.politician_context` — existing tables with established RLS. No new auth paths, endpoints, storage buckets, or external integrations. ASVS categories V2/V3/V4 do not apply. V5 (input validation) is satisfied by the evidence-only rule.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| Batch multiple politicians in one migration | One migration per politician | Phase 106 onwards | Rollback is per-person; easier to debug |
| No transaction wrapper (589, 597 anomaly) | BEGIN/COMMIT per migration | Phase 574 canonical | Partial writes prevented |
| Bare integer values (589, 597) | Float literals `N.0` | Phase 282 canonical | Schema consistency |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Migrations 699–702 are all applied to the DB | Migration Numbering | HIGH — if any are not applied, starting number differs; Wave 0 pre-flight resolves this |
| A2 | Active compass topic count is still 44 | Topic UUID Reference | MEDIUM — if a topic was added/retired between phases, the count changes; Wave 0 pre-flight resolves |
| A3 | Katherine Lee has 4–8 stances available | Expected Evidence Quality | LOW — blank spokes acceptable; doesn't affect correctness |
| A4 | Noya Wang (D4) holds the rotational Mayor title in 2025–2026 | Pitfall 6 | LOW risk for migration format (no Mayor office regardless); note only affects search strategy |
| A5 | Alhambra city council member bios at alhambraca.gov/297/City-Council are still live | Local Press Sources | LOW — URL confirmed at v7.0 seeding in 307; may have changed; check at execution time |
| A6 | Ross J. Maza full_name in DB is "Ross J. Maza" (with middle initial) | Politician Roster | MEDIUM — executor must verify full_name from UUID resolution query; if DB has "Ross Maza", use that |

**If this table is empty of HIGH-risk items after Wave 0 runs:** All claims are verified.

---

## Open Questions

1. **Actual next migration number**
   - What we know: STATE.md says 699; disk shows 699–702 already exist
   - What's unclear: Whether 699–702 are applied to the DB or only on disk
   - Recommendation: Wave 0 pre-flight resolves this with `SELECT MAX(version::int) FROM supabase_migrations.schema_migrations`

2. **Noya Wang rotational Mayor — is the rotation still current?**
   - What we know: Migration 307 (2026-06-08) documents Wang as current rotational Mayor for 2025–2026
   - What's unclear: Whether a new rotation has started (rotations are ~9 months)
   - Recommendation: Low priority — her seeded office is always Council Member D4 regardless; the question only affects search keywords

---

## Sources

### Primary (HIGH confidence)

- `C:/EV-Accounts/backend/migrations/307_la_wave3_whittier_alhambra.sql` — Alhambra external_ids (-700450 to -700454), names, title format, geo_id=0600884, rotational Mayor pitfall; read directly from file
- `C:/EV-Accounts/backend/migrations/310_la_wave4_geo_id_audit.sql` — Confirms Alhambra 5 politicians, 5 offices, range -700450..-700454, NO Mayor office per Pitfall 7
- `C:/EV-Accounts/backend/migrations/282_md_exec_stances.sql` — Canonical stance migration format (BEGIN/COMMIT, float literals, double-cast sources)
- `C:/EV-Accounts/backend/migrations/574_boston_stances.sql` — Canonical per-local-official format
- `122-RESEARCH.md` + `122-PATTERNS.md` — Full stance phase pattern documentation, topic UUID reference block, verification queries
- STATE.md — Migration counter, v15.0 scope, key decisions
- ROADMAP.md Phase 126 section — Confirmed roster (Lee/Maza/Maloney/Wang/Andrade-Stadler), geo_id=0600884

### Secondary (MEDIUM confidence)

- Migration files 700–702 on disk — Confirm migration 699–702 exist on disk; content verified
- REQUIREMENTS.md ALHAMBRA-01 — Requirement text confirmed

### Tertiary (LOW confidence)

- [ASSUMED] Evidence yield estimates for each official — based on city size and known press patterns; not verified against live sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — fully established pattern, confirmed from multiple prior phases
- Architecture: HIGH — identical to prior city council stance phases (106, 122, 123, 124)
- Politician rosters and external IDs: HIGH — read directly from migration 307 SQL file
- Migration numbering: MEDIUM — 699 stale per STATE.md; Wave 0 pre-flight required
- Expected evidence yield by official: LOW — based on training knowledge of Alhambra city politics

**Research date:** 2026-06-15
**Valid until:** 2026-07-15 (migration format stable; topic UUIDs rarely change; verify active count at Wave 0)

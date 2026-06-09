# Phase 106: VA Compass Stances - Pattern Map

**Mapped:** 2026-06-09
**Files analyzed:** 21 (migration files 326–346 covering Spanberger, Hashmi, Jones, Warner, Kaine, 7 Alexandria council, 9 ACPS board)
**Analogs found:** 21 / 21 (all exact-match — stance migration is a well-established pattern)

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `326_spanberger_stances.sql` | migration | CRUD upsert | `282_md_exec_stances.sql` (Wes Moore section) | exact |
| `327_hashmi_stances.sql` | migration | CRUD upsert | `282_md_exec_stances.sql` (Aruna Miller section) | exact |
| `328_jones_stances.sql` | migration | CRUD upsert | `282_md_exec_stances.sql` (Anthony Brown section) | exact |
| `329_warner_stances.sql` | migration | CRUD upsert | `282_md_exec_stances.sql` (Wes Moore section) | exact |
| `330_kaine_stances.sql` | migration | CRUD upsert | `282_md_exec_stances.sql` (Wes Moore section) | exact |
| `331_gaskins_stances.sql` | migration | CRUD upsert | `216_sf_officials_stances.sql` (local official) | exact |
| `332_bagley_stances.sql` — `337_marks_stances.sql` | migration | CRUD upsert | `216_sf_officials_stances.sql` | exact |
| `338_rief_stances.sql` — `346_simpson_baird_stances.sql` | migration | CRUD upsert | `216_sf_officials_stances.sql` | exact |

---

## Pattern Assignments

### All stance migration files (326–346+) — single canonical pattern

**Primary analog:** `C:/EV-Accounts/backend/migrations/282_md_exec_stances.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/216_sf_officials_stances.sql`

Both analogs use identical SQL structure. The pattern is the same for all 21 files. Apply it without variation.

---

### File Header Pattern

**Source:** `282_md_exec_stances.sql` lines 1–12

```sql
-- ============================================================================
-- Migration {N}: {FirstName LastName} Stances
-- ============================================================================
-- Purpose: Insert/upsert stance data for {FirstName LastName} ({title}).
--
-- Topic scope: All 44 compass topics attempted; only topics with evidence inserted.
--
-- Idempotency: ON CONFLICT (politician_id, topic_id) DO UPDATE on both tables.
-- Apply to remote Supabase via Supabase MCP (mcp__supabase-local is remote production).
-- ============================================================================
```

---

### Topic UUID Reference Block

**Source:** `282_md_exec_stances.sql` lines 14–57 / `216_sf_officials_stances.sql` lines 14–57

Copy this block verbatim into EVERY stance migration file header. All 44 topic UUIDs:

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

Note: `282_md_exec_stances.sql` line 57 ends at `voting-rights`. The topic list in 282 has 43 entries; `216_sf_officials_stances.sql` has the same 43. The CONTEXT.md refers to "44 compass topics" — the planner should verify the current live count via `SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true` before the first migration and include all active topics in the reference block.

---

### BEGIN/COMMIT Wrapper Pattern

**Source:** `282_md_exec_stances.sql` lines 59 and 1233

```sql
BEGIN;

-- ... all INSERT blocks ...

COMMIT;
```

Every stance migration is wrapped in a single `BEGIN; ... COMMIT;` transaction. No savepoints, no nested transactions.

---

### Politician Section Header Pattern

**Source:** `282_md_exec_stances.sql` lines 61–63

```sql
-- ============================================================
-- {FirstName LastName}
-- ============================================================
```

One section per politician. Since these are per-individual files (D-05), the file has exactly one such section.

---

### Per-Stance INSERT Pattern (core — copy exactly)

**Source:** `282_md_exec_stances.sql` lines 65–79 (Anthony Brown / abortion)

```sql
-- ----- {FirstName LastName} / {topic-slug} -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{politician_uuid}',
        '{topic_uuid}',
        {value}.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{politician_uuid}',
        '{topic_uuid}',
        $${reasoning text — no quotes needed, dollar-quoting handles apostrophes}$$,
        ARRAY['{url1}', '{url2}', '{url3}']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

Key rules visible in the pattern:
- `politician_answers` INSERT comes first, `politician_context` INSERT second — always paired, never one without the other.
- `value` is cast as a float literal: `1.0`, `2.0`, `3.0`, `4.0`, or `5.0` (never `1`, never `'1'`).
- Both INSERTs use `ON CONFLICT ... DO UPDATE SET` — full upsert, idempotent.
- `politician_answers` ON CONFLICT updates only `value`. `politician_context` ON CONFLICT updates `reasoning` and `sources`.
- `reasoning` uses PostgreSQL dollar-quoting (`$$...$$`). This handles apostrophes and any embedded single quotes without escaping.
- `sources` is typed `ARRAY['url1', 'url2']::text[]::text[]` — the double `::text[]` cast is the exact pattern from the analog; copy it verbatim.
- At least 1 URL is required in `sources` per D-10 (100% citation rate). No uncited stances.

---

### Politician UUID Resolution

**Critical:** Migration 282 uses hardcoded UUIDs (e.g., `'21e534c8-c0c0-42f5-b52b-5eb2f246d632'` for Wes Moore). The VA politicians were seeded with `gen_random_uuid()` so their UUIDs are not known until queried.

**The planner must resolve UUIDs from `essentials.politicians.external_id` before writing each migration.**

Resolution query pattern (run once per politician at planning time):

```sql
SELECT id FROM essentials.politicians WHERE external_id = {external_id};
```

| Politician | external_id | Migration |
|-----------|-------------|-----------|
| Abigail Spanberger (Governor) | -510001 | 326 |
| Ghazala Hashmi (Lt. Governor) | -510002 | 327 |
| Jay Jones (Attorney General) | -510003 | 328 |
| Mark Warner (US Senator) | -400080 | 329 |
| Tim Kaine (US Senator) | -400079 | 330 |
| Alyia Gaskins (Mayor) | -5101000001 | 331 |
| Canek Aguirre (Council Member) | -5101000002 | 332 |
| Sarah Bagley (Council Member) | -5101000003 | 333 |
| John Chapman (Council Member) | -5101000004 | 334 |
| Abdel-Rahman Elnoubi (Council Member) | -5101000005 | 335 |
| Jacinta E. Greene (Council Member) | -5101000006 | 336 |
| Sandy Marks (Council Member) | -5101000007 | 337 |
| Michelle Rief (ACPS Chair) | -5100090001 | 338 |
| Christopher Harris (ACPS Vice Chair) | -5100090002 | 339 |
| Abdulahi Abdalla (ACPS Member) | -5100090003 | 340 |
| Tim Beaty (ACPS Member) | -5100090004 | 341 |
| Kelly Carmichael Booz (ACPS Member) | -5100090005 | 342 |
| Donna Kenley (ACPS Member) | -5100090006 | 343 |
| Ryan Reyna (ACPS Member) | -5100090007 | 344 |
| Alexander Crider Scioscia (ACPS Member) | -5100090008 | 345 |
| Ashley Simpson Baird (ACPS Member) | -5100090009 | 346 |

Source for external_ids: migration 317 (state execs), migration 311 (federal — Warner/Kaine confirmed at lines 77–79 as `-400080`/`-400079`), migration 312 (Alexandria council), migration 313 (ACPS board).

---

### Dollar-Quoting Reasoning Pattern

**Source:** `282_md_exec_stances.sql` lines 76–77 (Anthony Brown / abortion reasoning)

```sql
$$AG Brown has been a longtime supporter of abortion rights. As a US Representative and former Lt. Governor,
he voted against the Pain-Capable Unborn Child Protection Act and consistently rated 100% by NARAL
Pro-Choice America.$$
```

- No single-quote escaping needed — use `$$` delimiters.
- Apostrophes (e.g., "he's", "governor's") are safe inside `$$...$$`.
- Do NOT use `$body$` or any other named dollar-quote tag — plain `$$` is the project standard.
- Reasoning should be 2–5 sentences. Cite specific bills, votes, statements, or actions. Do not use vague language like "has supported" without a concrete anchor.

---

### Sources Array Pattern

**Source:** `282_md_exec_stances.sql` line 77 (Anthony Brown / abortion context)

```sql
ARRAY['https://ballotpedia.org/Anthony_Brown_(Maryland)',
      'https://ontheissues.org/House/Anthony_Brown.htm',
      'https://marylandattorneygeneral.gov/Pages/Press/2024/20240101.aspx']::text[]::text[]
```

- Minimum 1 URL. 2–4 is typical. No bare-domain URLs; must include path.
- `::text[]::text[]` double-cast — copy exactly, do not simplify to `::text[]`.
- All URLs on one line or broken across lines inside the `ARRAY[...]` — both are acceptable.

---

### Verification Comment Block (end of file)

**Source:** `282_md_exec_stances.sql` lines 1235–1251

```sql
-- ============================================================================
-- Verification queries (run after applying):
-- ============================================================================
--
-- Row count for this politician (must be >= {N} topics):
-- SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id = '{uuid}';
--
-- Context pairing (must return 0 — every answer must have a context row):
-- SELECT COUNT(*) FROM inform.politician_answers pa
-- LEFT JOIN inform.politician_context pc
--   ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
-- WHERE pa.politician_id = '{uuid}'
--   AND pc.politician_id IS NULL;
```

Include this at the end of every per-individual migration file with the specific politician's UUID and expected minimum count.

---

## Shared Patterns

### Evidence-Only Rule (applies to all 21 files)
No INSERT is written for a topic where the research agent found no evidence. The `inform.politician_answers` row is omitted entirely — not inserted with a neutral/center value. A blank spoke on the compass is the correct outcome for no evidence.

**Source:** CONTEXT.md §Code Context ("Chair philosophy: No stance row is better than a fabricated neutral.")

### Value Scale (applies to all 21 files)
Values are compass position on the topic's defined axis: `1.0`, `2.0`, `3.0`, `4.0`, `5.0`. Research agents output the numeric position directly. `parseInt(r.value)` in apply scripts — no conversion step.

**Source:** CONTEXT.md D-02

### 100% Citation Rate (applies to all 21 files)
Every `inform.politician_context` row must have at least 1 URL in `sources`. No uncited stances are permitted.

**Source:** CONTEXT.md D-10

### Sequential Application (not a SQL pattern — process constraint)
Each migration is applied immediately when that politician's research completes. No batching. Order: Spanberger (326) → Hashmi (327) → Jones (328) → Warner (329) → Kaine (330) → Alexandria council (331–337) → ACPS board (338–346).

---

## Full Example: Minimal Valid Per-Individual Stance Migration

This is the template the planner should reference for every file. Substitute `{...}` fields.

```sql
-- ============================================================================
-- Migration 326: Abigail Spanberger Stances
-- ============================================================================
-- Purpose: Insert/upsert stance data for Abigail Spanberger (Governor of Virginia).
--
-- Topic scope: All 44 compass topics attempted; evidence-only — topics with no
--   evidence are omitted entirely (no neutral defaults).
--
-- Idempotency: ON CONFLICT (politician_id, topic_id) DO UPDATE on both tables.
-- Apply to remote Supabase via Supabase MCP (mcp__supabase-local is remote production).
-- ============================================================================

-- Topic UUID reference (inform.compass_topics):
-- [paste full 44-topic block here]

BEGIN;

-- ============================================================
-- Abigail Spanberger
-- ============================================================

-- ----- Abigail Spanberger / {topic-slug} -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{spanberger_uuid_from_db}',
        '{topic_uuid}',
        {N}.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{spanberger_uuid_from_db}',
        '{topic_uuid}',
        $$[2-5 sentences of evidence-anchored reasoning with specific bills/votes/statements]$$,
        ARRAY['https://...', 'https://...']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

-- [repeat for each topic with evidence]

COMMIT;

-- ============================================================================
-- Verification queries (run after applying):
-- ============================================================================
-- SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id = '{spanberger_uuid}';
-- SELECT COUNT(*) FROM inform.politician_answers pa
-- LEFT JOIN inform.politician_context pc
--   ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
-- WHERE pa.politician_id = '{spanberger_uuid}' AND pc.politician_id IS NULL;
```

---

## No Analog Found

None — the stance migration pattern is fully established. All 21 files follow `282_md_exec_stances.sql` exactly.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/`
**Files scanned:** 5 (282, 216, 311, 312, 313) + file listing of all stance migrations
**Pattern extraction date:** 2026-06-09

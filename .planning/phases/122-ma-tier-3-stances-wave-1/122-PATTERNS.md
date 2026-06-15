# Phase 122: MA Tier 3 Stances Wave 1 - Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 37 migration files (598–634, one per official)
**Analogs found:** 37 / 37 (all exact-match — per-individual stance migration is a fully-established pattern)

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `598_laredo_stances.sql` | migration | CRUD upsert | `574_boston_stances.sql` (Mayor Wu section) | exact |
| `599_albright_stances.sql` — `622_micley_stances.sql` | migration | CRUD upsert | `574_boston_stances.sql` (district councillors) | exact |
| `623_wilson_stances.sql` | migration | CRUD upsert | `574_boston_stances.sql` (Mayor Wu section) | exact |
| `624_link_stances.sql` — `634_hardt_stances.sql` | migration | CRUD upsert | `574_boston_stances.sql` (at-large councillors) | exact |

All 37 files follow a single canonical pattern. No file in this phase introduces any new SQL pattern, table, or schema.

---

## Pattern Assignments

### All stance migration files (598–634) — single canonical pattern

**Primary analog:** `C:/EV-Accounts/backend/migrations/282_md_exec_stances.sql`
(canonical for: BEGIN/COMMIT, float literals, double-cast `::text[]::text[]`)

**Secondary analog:** `C:/EV-Accounts/backend/migrations/574_boston_stances.sql`
(canonical for: Boston local-official format, politician UUID reference block style, per-person verification comments)

Both analogs share the same INSERT structure. 282 is authoritative on three specific syntax rules where 574 deviates (see Deviation Notes below).

---

### File Header Pattern

**Source:** `282_md_exec_stances.sql` lines 1–12 / `574_boston_stances.sql` lines 1–18

```sql
-- ============================================================================
-- Migration {NNN}: {FirstName LastName} Stances
-- ============================================================================
-- Purpose: Insert/upsert stance data for {FirstName LastName} ({title}).
--
-- Topic scope: All active compass topics attempted; evidence-only — topics with
--   no evidence are omitted entirely (no neutral defaults).
--
-- Idempotency: ON CONFLICT (politician_id, topic_id) DO UPDATE on both tables.
-- Apply to remote Supabase via Supabase MCP (mcp__supabase-local is remote production).
-- ============================================================================
```

---

### Topic UUID Reference Block

**Source:** `282_md_exec_stances.sql` lines 14–57 (confirmed in 111-PATTERNS.md as 44 topics)

Copy verbatim into every migration file header. Verify active count first via:
```sql
SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true;
SELECT slug, id FROM inform.compass_topics WHERE is_active = true ORDER BY slug;
```

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

### BEGIN/COMMIT Wrapper Pattern

**Source:** `282_md_exec_stances.sql` lines 59 and ~1233; `574_boston_stances.sql` lines 36 and 2630

```sql
BEGIN;

-- ... all INSERT blocks for this politician ...

COMMIT;
```

Every migration file is wrapped in one `BEGIN; ... COMMIT;`. No savepoints, no nested transactions. Files 589 and 597 omit this — do NOT follow their format.

---

### Politician Section Header Pattern

**Source:** `574_boston_stances.sql` lines 37–38 (one header per politician within the transaction)

```sql
-- ============================================================
-- {FirstName LastName}
-- ============================================================
```

Since these are per-individual files (one official per file), each file contains exactly one such header block.

---

### Per-Stance INSERT Pattern (core — copy exactly)

**Source:** `282_md_exec_stances.sql` lines 65–79; `574_boston_stances.sql` lines 38–51

```sql
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
        $$[2-5 sentences of evidence-anchored reasoning with specific bills/votes/statements]$$,
        ARRAY['https://source1.org/path/to/article', 'https://source2.org/path']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

Critical rules (all verified against `282_md_exec_stances.sql`):

1. `politician_answers` INSERT comes first, `politician_context` INSERT second — always paired, never one without the other.
2. `value` is a float literal: `1.0`, `2.0`, `3.0`, `4.0`, or `5.0`. NEVER bare integer (`4`), NEVER quoted string (`'4'`). Files 589/597 deviate; use 282/574 format.
3. Both INSERTs use `ON CONFLICT ... DO UPDATE SET` — full upsert, idempotent.
4. `reasoning` uses PostgreSQL dollar-quoting (`$$...$$`). Handles apostrophes and quotes without escaping. Do NOT use named dollar-quote tags (`$body$`) — plain `$$` only.
5. `sources` typed as `ARRAY['url1', 'url2']::text[]::text[]` — the double `::text[]` cast is the project standard from `282_md_exec_stances.sql` line 77. Copy verbatim; do not simplify to single `::text[]`.
6. At least 1 URL required in `sources` per 100%-citation rule. No bare-domain URLs; must include path (e.g., `/news/article-slug`, not just `wgbh.org`).

---

### Deviation Notes: 574 vs. 282

| Rule | 282_md_exec_stances.sql | 574_boston_stances.sql | 589/597 | Phase 122 canonical |
|------|------------------------|----------------------|---------|---------------------|
| `BEGIN;`/`COMMIT;` | YES (lines 59, 1233) | YES (lines 36, 2630) | NO | **Required — use** |
| Float literals | YES (`2.0`) | YES (`2.0`) | NO (bare `4`) | **Required — use** |
| `::text[]::text[]` | YES (all instances) | NO (single `::text[]`) | NO | **Use double-cast from 282** |

When 574 and 282 conflict: follow **282** on the sources array cast. Follow **574** for everything else (it matches 282 on BEGIN/COMMIT and floats).

---

### Politician UUID Resolution

**Pattern:** `282_md_exec_stances.sql` inline; `574_boston_stances.sql` lines 21–34

UUIDs are generated at seeding time via `gen_random_uuid()`. Resolve at execution time before writing each migration:

```sql
-- Single politician:
SELECT id FROM essentials.politicians WHERE external_id = -2545560001;

-- All Newton officials at once:
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id BETWEEN -2545560025 AND -2545560001
ORDER BY external_id DESC;

-- All Somerville officials at once:
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id BETWEEN -2562535012 AND -2562535001
ORDER BY external_id DESC;
```

Newton roster (from migration 578 — VERIFIED):

| external_id | Name | Migration |
|-------------|------|-----------|
| -2545560001 | Marc C. Laredo (Mayor) | 598 |
| -2545560002 | Susan Albright | 599 |
| -2545560003 | Brittany Hume Charm | 600 |
| -2545560004 | Cyrus Dahmubed | 601 |
| -2545560005 | Rena Getz | 602 |
| -2545560006 | Brian Golden | 603 |
| -2545560007 | Lisa Gordon | 604 |
| -2545560008 | Becky Grossman | 605 |
| -2545560009 | David Kalis | 606 |
| -2545560010 | Andrea Kelley | 607 |
| -2545560011 | Josh Krintzman | 608 |
| -2545560012 | Allison Leary | 609 |
| -2545560013 | Tarik Lucas | 610 |
| -2545560014 | John Oliver | 611 |
| -2545560015 | Sean Roche | 612 |
| -2545560016 | Jacob Silber | 613 |
| -2545560017 | Pamela Wright | 614 |
| -2545560018 | R. Lisle Baker | 615 |
| -2545560019 | Martha Bixby | 616 |
| -2545560020 | Randy Block | 617 |
| -2545560021 | Stephen Farrell | 618 |
| -2545560022 | Maria S. Greenberg | 619 |
| -2545560023 | Julie Irish | 620 |
| -2545560024 | Julia Malakie | 621 |
| -2545560025 | David Micley | 622 |

Somerville roster (from migration 581 — VERIFIED):

| external_id | Name | Migration |
|-------------|------|-----------|
| -2562535001 | Jake Wilson (Mayor) | 623 |
| -2562535002 | Jon Link | 624 |
| -2562535003 | Wilfred N. Mbah | 625 |
| -2562535004 | Kristen E. Strezo | 626 |
| -2562535005 | Ben Wheeler | 627 |
| -2562535006 | Matthew McLaughlin | 628 |
| -2562535007 | Jefferson Thomas Scott | 629 |
| -2562535008 | Ben Ewen-Campen | 630 |
| -2562535009 | Jesse Clingan | 631 |
| -2562535010 | Naima Sait | 632 |
| -2562535011 | Lance L. Davis | 633 |
| -2562535012 | Emily Hardt | 634 |

**IMPORTANT:** Verify Somerville councillor UUID-to-name mapping via DB query before writing any migration — A3 in RESEARCH.md flags this as HIGH-risk assumption.

---

### Verification Comment Block (end of file)

**Source:** `282_md_exec_stances.sql` lines 1235–1251; `574_boston_stances.sql` lines 2631–2646

Include at the bottom of every per-individual migration:

```sql
-- ============================================================================
-- Verification queries (run after applying):
-- ============================================================================
-- Row count (must be >= 1):
-- SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id = '{uuid}';
--
-- Unpaired check (must return 0 — every answer must have a context row):
-- SELECT COUNT(*) FROM inform.politician_answers pa
-- LEFT JOIN inform.politician_context pc
--   ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
-- WHERE pa.politician_id = '{uuid}' AND pc.politician_id IS NULL;
--
-- Citation check (must return 0 — every context must have sources):
-- SELECT COUNT(*) FROM inform.politician_context
-- WHERE politician_id = '{uuid}'
--   AND (sources IS NULL OR array_length(sources, 1) IS NULL OR array_length(sources, 1) = 0);
```

---

### Full Minimal Valid Migration Template

This is the complete template for every file in this phase. Substitute `{...}` placeholders.

```sql
-- ============================================================================
-- Migration {NNN}: {FirstName LastName} Stances
-- ============================================================================
-- Purpose: Insert/upsert stance data for {FirstName LastName} ({title, city}).
--
-- Topic scope: All active compass topics attempted; evidence-only — topics with
--   no evidence are omitted entirely (no neutral defaults).
--
-- Idempotency: ON CONFLICT (politician_id, topic_id) DO UPDATE on both tables.
-- Apply to remote Supabase via Supabase MCP (mcp__supabase-local is remote production).
-- ============================================================================

-- Topic UUID reference (inform.compass_topics):
-- [paste full active topic block — verify count via SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true]
-- abortion                         af2fdfd6-02c4-49df-b09c-cf8536f4773f
-- [... all remaining topics ...]
-- voting-rights                    d1792200-1d3b-4955-a0b7-0e6980d7a7b2

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
        $$[2-5 sentences evidence-anchored reasoning citing specific bills, votes, or statements]$$,
        ARRAY['https://source1.org/path/article', 'https://source2.org/path']::text[]::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

-- [repeat paired INSERT blocks for each topic with evidence]

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

---

## Shared Patterns

### Evidence-Only Rule (applies to all 37 files)

No INSERT is written for a topic where no evidence was found. `inform.politician_answers` row is omitted entirely — not inserted with a neutral/center value. A blank spoke is the correct and honest outcome for zero evidence.

**Source:** Project constraint, documented in CONTEXT.md and all prior stance PATTERNS.md files; hardcoded `3.0` neutral default destroys trust.

### Sequential Research Constraint (process rule — not SQL)

One politician at a time: research → write SQL → apply migration → run verification queries → next politician. Two active research sub-agents in one session is a rate-limit violation and produces unusable output.

**Source:** Multiple prior violations logged; see project memory `feedback_stance_research_one_at_a_time.md`.

### 100% Citation Rate (applies to all 37 files)

Every `inform.politician_context` row must have at least 1 URL in `sources`. No uncited stances permitted. Bare domain URLs not acceptable — must include path.

**Source:** Project rule; verified in `282_md_exec_stances.sql` and `574_boston_stances.sql` throughout.

### Scope Guard: School Committee Exclusion

External IDs in the `-2508610xxx` range (Newton SC) and `-2510890xxx` range (Somerville SC) are out of scope. No migration file for Phase 122 should contain these IDs. City council and Mayor only.

**Source:** NEWTON-03 and SOMERVILLE-03 requirements; RESEARCH.md Pitfalls 5 and 6.

---

## Wave 0 Pre-Flight Queries (run before first migration)

The planner's Wave 0 task must execute all four of these before any migration is written:

```sql
-- 1. Confirm last applied migration (determines starting number):
SELECT version FROM supabase_migrations.schema_migrations
WHERE version IN ('596', '597')
ORDER BY version;

-- 2. Confirm active topic count (must still be 44 for topic block to be valid):
SELECT COUNT(*) FROM inform.compass_topics WHERE is_active = true;

-- 3. Check for pre-existing stance rows (upsert handles them; informational only):
SELECT COUNT(*) FROM inform.politician_answers
WHERE politician_id IN (
  SELECT id FROM essentials.politicians
  WHERE external_id BETWEEN -2545560025 AND -2545560001
     OR external_id BETWEEN -2562535012 AND -2562535001
);

-- 4. Resolve and verify Somerville councillor name-to-UUID mapping:
SELECT external_id, full_name, id
FROM essentials.politicians
WHERE external_id BETWEEN -2562535012 AND -2562535001
ORDER BY external_id DESC;
```

---

## No Analog Found

None. The per-individual stance migration pattern is fully established across phases 106, 111, 112, 113, 114, 115. All 37 files follow the canonical pattern from `282_md_exec_stances.sql` and `574_boston_stances.sql`.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (files 282, 574, 589, 597 read directly)
**Planning files read:** `106-PATTERNS.md`, `111-PATTERNS.md` (prior stance phases)
**Files scanned:** 4 migration analogs + 2 prior PATTERNS.md files
**Pattern extraction date:** 2026-06-14

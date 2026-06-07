# Phase 98: MD Compass Stances — House Delegates (Wave 2) - Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 9 (1 modified Python script + 7 generated SQL migrations + N CSV files)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` | utility / batch-generator | transform | self (in-place modification) | exact — add 7 new batch sections |
| `C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-delegate-dNN-[lastname].csv` (×140) | data / handoff artifact | batch | `C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d01-mckay.csv` | exact |
| `C:/EV-Accounts/backend/migrations/286_md_delegates_batch_a.sql` | migration | CRUD / batch | `C:/EV-Accounts/backend/migrations/283_md_senators_batch_a.sql` | exact |
| `C:/EV-Accounts/backend/migrations/287_md_delegates_batch_b.sql` | migration | CRUD / batch | `C:/EV-Accounts/backend/migrations/284_md_senators_batch_b.sql` | exact |
| `C:/EV-Accounts/backend/migrations/288_md_delegates_batch_c.sql` | migration | CRUD / batch | `C:/EV-Accounts/backend/migrations/283_md_senators_batch_a.sql` | exact |
| `C:/EV-Accounts/backend/migrations/289_md_delegates_batch_d.sql` | migration | CRUD / batch | `C:/EV-Accounts/backend/migrations/284_md_senators_batch_b.sql` | exact |
| `C:/EV-Accounts/backend/migrations/290_md_delegates_batch_e.sql` | migration | CRUD / batch | `C:/EV-Accounts/backend/migrations/285_md_senators_batch_c.sql` | exact |
| `C:/EV-Accounts/backend/migrations/291_md_delegates_batch_f.sql` | migration | CRUD / batch | `C:/EV-Accounts/backend/migrations/285_md_senators_batch_c.sql` | exact |
| `C:/EV-Accounts/backend/migrations/292_md_delegates_batch_g.sql` | migration | CRUD / batch | `C:/EV-Accounts/backend/migrations/285_md_senators_batch_c.sql` | exact |

---

## Pattern Assignments

### `gen_migration.py` — modification (add 7 delegate batch sections)

**Analog:** `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` (the file itself, lines 362–595)

**Where to add new constants** — place at the bottom of the constants area, after the existing `MD_SENATORS_C_CSVS` list (after line 502) and before the `if __name__ == '__main__':` block (line 504):

```python
# ============================================================================
# MD DELEGATES BATCH A: HD-1 through HD-7, migration 286
# ============================================================================

MD_DELEGATES_A_CANDIDATES = [
    ("Jim Hinebaugh, Jr.",       "3817ad52-3f43-4bd3-8525-e7dcd0816153"),  # HD-1A
    ("Jason C. Buckel",          "5260bd6f-e70a-46f1-aa7d-49eaf22192cf"),  # HD-1B
    ("Terry L. Baker",           "d049cf3e-6577-4f8d-ba7e-768ac2b78d66"),  # HD-1C
    # ... full list from RESEARCH.md Batch A table
]

MD_DELEGATES_A_CSVS = [
    r"C:\EV-Accounts\backend\data\stance-research\2026-06-07-md-delegate-d01a-hinebaugh.csv",
    r"C:\EV-Accounts\backend\data\stance-research\2026-06-07-md-delegate-d01b-buckel.csv",
    # ... one path per delegate in district order
]
```

**Repeat this pattern for BATCH B through G** (MD_DELEGATES_B through MD_DELEGATES_G), following the section header comment style at lines 222, 258, 298, 312, 362, 381, 421, 463.

**Where to add `generate_migration()` calls** — append at the END of the `if __name__ == '__main__':` block (after line 595), following the existing call pattern:

```python
    print()
    print("Generating migration 286 (MD delegates batch A: HD-1 through HD-7)...")
    generate_migration(
        migration_num=286,
        batch_label="MD Delegates Batch A — Districts 1-7",
        candidate_inventory=MD_DELEGATES_A_CANDIDATES,
        csv_files=MD_DELEGATES_A_CSVS,
        excluded_topics=EXCLUDED_TOPICS_FEDERAL,
        header_scope_note="Federal/state topics only; data-centers, local-immigration, transportation-priorities excluded.",
        outpath=os.path.join(base, "286_md_delegates_batch_a.sql"),
    )
```

**Key constraint:** Never modify or remove existing batch sections (BATCH2, BATCH3, GAPFILL, SF, MD_EXEC, MD_SENATORS_A/B/C). Only append. This matches the pattern of all prior batch additions in the file.

---

### CSV files — `2026-06-07-md-delegate-dNN[sub]-[lastname].csv` (×140)

**Analog:** `C:/EV-Accounts/backend/data/stance-research/2026-06-07-md-senator-d01-mckay.csv`

**Header row** (line 1):
```
full_name,topic_key,value,reasoning,source_url_1,source_url_2,source_url_3
```

**Data row pattern** (lines 2–11 of mckay.csv — representative):
```csv
Mike McKay,abortion,5,McKay states that life begins at conception and the government has an obligation to protect the unborn — a strongly anti-abortion position.,https://mikemckaymd.com/,https://ballotpedia.org/Mike_McKay,
Mike McKay,fossil-fuels,5,McKay has consistently supported legalizing fracking in Maryland citing energy prices and introduced legislation to repeal the state fracking ban in 2025.,https://mikemckaymd.com/state-senators-propose-bill-to-legalize-fracking/,https://en.wikipedia.org/wiki/Mike_McKay_(politician),
```

**Rules extracted from analog:**
- `full_name` must exactly match the string in `candidate_inventory` — character-for-character including accents (e.g., `Joseline Peña-Melnyk`, not `Joseline Pena-Melnyk`)
- Names containing commas (e.g., `Marvin E. Holmes, Jr.`) must be wrapped in double-quotes: `"Marvin E. Holmes, Jr.",topic_key,...`
- `value` is an integer 1–5 written as a bare number (no quotes); gen_migration.py casts to float internally
- `reasoning` is free text — dollar-quoting handled by gen_migration.py; researcher does not need to escape anything
- `source_url_1` is mandatory (at least one non-empty URL per row); `source_url_2` and `source_url_3` are optional (leave column blank, not absent)
- `topic_key` must exactly match a key in `TOPIC_UUIDS` (lines 10–55 of gen_migration.py); unknown keys produce a WARNING and are skipped
- EXCLUDED_TOPICS_FEDERAL keys (`data-centers`, `local-immigration`, `transportation-priorities`) must not appear in delegate CSVs

**Naming convention** (from RESEARCH.md recommended pattern):
```
2026-06-07-md-delegate-d[NN][sub]-[lastname].csv
```
Examples: `d01a-hinebaugh.csv`, `d01b-buckel.csv`, `d01c-baker.csv`, `d02a-valentine.csv`, `d02a-wivell.csv`, `d02b-schindler.csv`

For whole districts (3 delegates, no subdistrict letter): `d03-fair.csv`, `d03-kerr.csv`, `d03-simpson.csv`

---

### SQL migration files — `286_md_delegates_batch_a.sql` through `292_md_delegates_batch_g.sql`

**Analog:** `C:/EV-Accounts/backend/migrations/283_md_senators_batch_a.sql` (lines 1–80 shown)

These files are **entirely generated by gen_migration.py** — the researcher does not hand-write them. The output pattern is:

**Migration header** (lines 1–12):
```sql
-- ============================================================================
-- Migration 286: MD Delegates Batch A — Districts 1-7
-- ============================================================================
-- Purpose: Insert/upsert stance data for 21 politicians.
--
-- Topic scope: Federal/state topics only; data-centers, local-immigration, transportation-priorities excluded.
--
-- Post-state: ~NNN rows expected
--
-- Idempotency: ON CONFLICT (politician_id, topic_id) DO UPDATE on both tables.
-- Apply to remote Supabase via psql.
-- ============================================================================
```

**Per-candidate block — stances present** (from migration 283, lines 63–79):
```sql
-- ============================================================
-- Benjamin Brooks
-- ============================================================

-- ----- Benjamin Brooks / abortion -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('a16b94b0-dd22-40a9-af91-03295ea27986',
        'af2fdfd6-02c4-49df-b09c-cf8536f4773f',
        4.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('a16b94b0-dd22-40a9-af91-03295ea27986',
        'af2fdfd6-02c4-49df-b09c-cf8536f4773f',
        $$Brooks voted NO on SB 798 in 2023$$,
        ARRAY['https://example.com/source1']::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

**Per-candidate block — no stances found** (from gen_migration.py lines 158–161):
```sql
-- ============================================================
-- Vacant
-- ============================================================

-- NOTE: No stances found in CSV for Vacant (67acad60-5839-4a8a-95ac-c881c3ca39a9)
```

**Migration footer — verification queries** (from gen_migration.py lines 193–209):
```sql
COMMIT;

-- ============================================================================
-- Verification queries (run after applying):
-- ============================================================================
--
-- Per-candidate row count (every candidate must have >= 10 topics):
-- SELECT p.full_name, COUNT(pa.topic_id) AS topic_count
-- FROM essentials.politicians p
-- LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
-- WHERE p.id IN ('uuid1', 'uuid2', ...)
-- GROUP BY p.id, p.full_name ORDER BY topic_count;
--
-- Context pairing (must return 0):
-- SELECT COUNT(*) FROM inform.politician_answers pa
-- LEFT JOIN inform.politician_context pc
--   ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
-- WHERE pa.politician_id IN ('uuid1', 'uuid2', ...)
--   AND pc.politician_id IS NULL;
```

---

## Shared Patterns

### EXCLUDED_TOPICS_FEDERAL
**Source:** `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` (line 58)
**Apply to:** All 7 delegate batch calls to `generate_migration()`

```python
EXCLUDED_TOPICS_FEDERAL = {'data-centers', 'local-immigration', 'transportation-priorities'}
```

Pass as `excluded_topics=EXCLUDED_TOPICS_FEDERAL` in every `generate_migration()` call. The scope note string to pass as `header_scope_note` (matching all Phase 97 calls, lines 568–594):
```
"Federal/state topics only; data-centers, local-immigration, transportation-priorities excluded."
```

### ON CONFLICT idempotency
**Source:** `C:/EV-Accounts/backend/migrations/283_md_senators_batch_a.sql` (lines 70–79)
**Apply to:** All 7 generated migration files (auto-produced by gen_migration.py)

Both tables use the same upsert pattern:
```sql
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;
-- and for context:
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

### Dollar-quoting for reasoning text
**Source:** `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` (lines 64–69)
**Apply to:** All reasoning fields in generated SQL

```python
def dollar_quote(text):
    """Wrap text in dollar quotes, using tagged variant if text contains $$."""
    text = text.strip()
    if '$$' in text:
        return f'$REASON${text}$REASON$'
    return f'$${text}$$'
```

Researcher does not manually escape reasoning text — gen_migration.py handles this.

### Sources ARRAY construction
**Source:** `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` (lines 72–83)
**Apply to:** All source URL fields in generated SQL

```python
def build_sources_array(row):
    sources = []
    for col in ['source_url_1', 'source_url_2', 'source_url_3']:
        url = (row.get(col) or '').strip()
        if url:
            url = url.replace("'", "''")
            sources.append(f"'{url}'")
    if not sources:
        return "ARRAY[]::text[]"
    return f"ARRAY[{', '.join(sources)}]::text[]"
```

### candidate_inventory sort order
**Source:** `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` (line 150)
**Apply to:** All 7 delegate `candidate_inventory` lists

```python
for name, pid in sorted(candidate_inventory, key=lambda x: x[0].split()[-1]):
```

gen_migration.py sorts by last token of name (last word). The researcher-defined order in `candidate_inventory` does NOT determine output order. Candidates are always emitted alphabetically by last name in the SQL output.

### Not-found comment for Vacant seat
**Source:** `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` (lines 158–161)
**Apply to:** Batch G (migration 292) for HD-42A

HD-42A Vacant (`67acad60-5839-4a8a-95ac-c881c3ca39a9`) must appear in `MD_DELEGATES_G_CANDIDATES` but no CSV file is created for it. gen_migration.py auto-inserts:
```sql
-- NOTE: No stances found in CSV for Vacant (67acad60-5839-4a8a-95ac-c881c3ca39a9)
```

### CSV naming for subdistrict delegates
**Source:** `C:/EV-Accounts/backend/data/stance-research/` directory listing (Phase 97 senator pattern)
**Apply to:** All 140 delegate CSV filenames

Senator pattern (single senator per district): `2026-06-07-md-senator-d01-mckay.csv`
Delegate adaptation (subdistrict suffix + multiple per district):
- Lettered subdistricts: `2026-06-07-md-delegate-d01a-hinebaugh.csv`, `2026-06-07-md-delegate-d01b-buckel.csv`
- Whole districts (3 delegates): `2026-06-07-md-delegate-d03-fair.csv`, `d03-kerr.csv`, `d03-simpson.csv`
- Two delegates in same subdistrict: `d02a-valentine.csv`, `d02a-wivell.csv` (both use `d02a` prefix, differentiated by lastname)

---

## No Analog Found

None — all files in this phase have exact analogs from Phase 97.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/data/stance-research/`, `C:/EV-Accounts/backend/migrations/`
**Files scanned:** gen_migration.py (full, 596 lines), 283_md_senators_batch_a.sql (lines 1–80), 2026-06-07-md-senator-d01-mckay.csv (full)
**Pattern extraction date:** 2026-06-07

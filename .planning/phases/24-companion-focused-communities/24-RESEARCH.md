# Phase 24: Companion Focused Communities - Research

**Researched:** 2026-05-04
**Domain:** connect.communities INSERT + inform.compass_topics fc_community_slug UPDATE
**Confidence:** HIGH — all findings from direct migration file inspection and source code

---

## Summary

Phase 24 is a pure data-authoring and migration phase. It creates 10 new `connect.communities` rows for the LOCAL compass topics from Phase 23, and back-fills `fc_community_slug` on each of the 10 `inform.compass_topics` rows. No frontend code changes. No schema changes.

All schema structures, INSERT patterns, and UPDATE patterns are verified directly from existing migration files. The `get_stances_for_community` RPC is confirmed present with full signature. The `fc_community_slug` column is confirmed `TEXT NULL` on `inform.compass_topics`, selected by `compassService.ts` and returned to the frontend.

The only unresolved item is the exact topic UUIDs for the 10 Phase 23 topics — they were inserted with `gen_random_uuid()` so their IDs are only known from the live DB. Phase 24 migrations must reference them by `topic_key` join (not hardcoded UUIDs), which is exactly the pattern already used in `community_expansion` migrations via UPDATE + subselect.

**Primary recommendation:** Write the migration as two logical blocks in one transaction: (1) INSERT into `connect.communities` using a subselect to resolve `topic_id` from `topic_key`; (2) UPDATE `inform.compass_topics` SET `fc_community_slug` using a correlated subselect on `connect.communities.slug`.

---

## connect.communities Schema (exact columns)

Source: `C:/Focused Communities/supabase/migrations/20260415214142_connect_schema_tables.sql`
Additional columns from `20260416074245_phase3_schema_gaps.sql`

```
connect.communities
├── id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── topic_id     UUID NOT NULL  (no FK constraint — inform schema cross-schema)
├── slug         TEXT NOT NULL UNIQUE
├── name         TEXT NOT NULL
├── description  TEXT  (nullable)
├── member_count INT NOT NULL DEFAULT 0
├── thread_count INT NOT NULL DEFAULT 0
├── created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
├── updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
└── slice_label  TEXT  (nullable, added in phase3_schema_gaps migration)
```

### Required fields for INSERT

Minimum viable INSERT (all other columns have defaults or are nullable):
- `topic_id` — UUID, NOT NULL — must resolve from `inform.compass_topics` by `topic_key`
- `slug` — TEXT, NOT NULL UNIQUE — the community URL slug
- `name` — TEXT, NOT NULL — display name

Optional but SHOULD include:
- `description` — TEXT nullable — community description (Phase 24 must author all 10)

Do NOT include: `id`, `member_count`, `thread_count`, `created_at`, `updated_at`, `slice_label` — all have correct defaults.

### INSERT pattern (verified from community_expansion migration)

```sql
INSERT INTO connect.communities (slug, name, description, topic_id) VALUES
  ('slug-here',
   'Community Display Name',
   'Description text here.',
   (SELECT id FROM inform.compass_topics WHERE topic_key = 'topic-key-here' AND is_live = true));
```

NOTE: The existing `community_expansion` migration hardcodes UUIDs, but since Phase 23 used `gen_random_uuid()`, the Phase 24 migration must resolve topic_id by subselect on `topic_key`. Using subselects is safe and is the correct pattern when UUIDs are not known at authoring time.

---

## fc_community_slug Column

Source: `C:/EV-Accounts/backend/src/types/database.types.ts` (line 944), `C:/EV-Accounts/backend/src/lib/compassService.ts` (line 111)

- **Table:** `inform.compass_topics`
- **Type:** `TEXT | null` (confirmed from database.types.ts)
- **Selected by:** `compassService.ts` `getCompassTopics()` via `.select('...fc_community_slug')`
- **Returned to frontend:** Yes — included in the topics API response

**UPDATE pattern** (no prior migration example exists — this is Phase 24's first use):

```sql
UPDATE inform.compass_topics
SET fc_community_slug = 'slug-here'
WHERE topic_key = 'topic-key-here' AND is_live = true;
```

**Confirmed existing value:** The "Criminalization of Homelessness" topic has `fc_community_slug = 'criminalization-of-homelessness'` (verified from STATE.md Phase 22 Notes). This confirms the pattern: fc_community_slug matches the connect.communities slug exactly.

---

## 10 Phase 23 Topic Keys and Slugs

Source: Phase 23 migration + CONTEXT.md slug decisions

Topic UUIDs are NOT known at research time (inserted with `gen_random_uuid()`). The migration must resolve by `topic_key`.

| topic_key | community slug | community name |
|-----------|---------------|----------------|
| `residential-zoning` | `residential-zoning` | Residential Zoning |
| `growth-and-development` | `growth-and-development` | Growth and Development |
| `public-safety-approach` | `public-safety-approach` | Public Safety Approach |
| `homelessness-response` | `homelessness-response` | Homelessness Response |
| `economic-development` | `economic-development` | Economic Development |
| `transportation-priorities` | `transportation-priorities` | Transportation Priorities |
| `local-environment` | `local-environment` | Local Environment |
| `rent-regulation` | `rent-regulation` | Rent Regulation |
| `local-immigration` | **`immigration-policy`** | Immigration Policy |
| `city-sanitation` | `city-sanitation` | City Sanitation |

**Exception:** `local-immigration` topic_key → `immigration-policy` slug (drops "local-" prefix per CONTEXT.md locked decision).

---

## Existing Community Description Examples (tone calibration)

Source: `C:/Focused Communities/supabase/migrations/20260417000002_community_expansion.sql`

All examples below: neutral, educational, topic-framing only — no compass scale references.

**Example 1 — "Affordable Housing" (~22 words):**
> "Explore five perspectives on housing affordability, rent control, zoning, and the proper role of government in ensuring access to stable housing."

**Example 2 — "Campaign Finance Reform" (~24 words):**
> "Discuss how elections are funded, the influence of money in politics, and what reforms — if any — would best protect democratic representation."

**Example 3 — "Climate Change and Environmental Protection" (~27 words):**
> "Discuss climate science, environmental policy, the energy transition, and how to balance economic concerns with long-term environmental stewardship."

**Example 4 — "Deportation Priorities" (~25 words):**
> "Discuss who should be prioritized for deportation, how enforcement should be conducted, and how to weigh public safety against humanitarian considerations."

**Pattern observations:**
- Length: 20–30 words, single sentence
- Voice: second-person invitation ("Explore…", "Discuss…", "Engage with…")
- Content: names the key sub-debates within the topic without taking sides
- Never references "position 1 through 5" or any scale
- Never says "local government" explicitly
- Some use "five perspectives" as an opener — this is optional

**Word count target:** 20–30 words per description.

---

## RPC: get_stances_for_community

Source: `C:/Focused Communities/supabase/migrations/20260416232741_phase4_5_stance_schema.sql`

This is the **current (final) signature** after the Phase 4.5 DROP + RECREATE:

```sql
CREATE FUNCTION connect.get_stances_for_community(p_community_id UUID)
RETURNS TABLE (
  "position"            INT,
  text                  TEXT,
  supporting_points     TEXT[],
  description           TEXT,
  example_perspectives  TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.value AS "position",
    s.text,
    COALESCE(s.supporting_points, '{}')    AS supporting_points,
    s.description,
    COALESCE(s.example_perspectives, '{}') AS example_perspectives
  FROM connect.communities c
  JOIN inform.compass_stances s ON s.topic_id = c.topic_id
  WHERE c.id = p_community_id
  ORDER BY s.value ASC;
$$;
```

**What it returns per community:** Exactly 5 rows (one per compass stance value 1–5) with position, text, supporting_points, description, and example_perspectives.

**How to call for verification:**
```sql
-- Get community id first
SELECT id FROM connect.communities WHERE slug = 'residential-zoning';

-- Then call RPC
SELECT * FROM connect.get_stances_for_community('<community-uuid-here>');
-- Expected: 5 rows, all description fields non-null
```

**Alternative verification (no separate RPC call needed):**
```sql
SELECT COUNT(*) FROM connect.communities c
JOIN inform.compass_stances s ON s.topic_id = c.topic_id
WHERE c.slug IN (
  'residential-zoning', 'growth-and-development', ...
)
AND s.description IS NOT NULL;
-- Expected: 50
```

---

## Migration Filename Convention

Source: `C:/Focused Communities/supabase/migrations/` directory listing

Existing migrations:
```
20260415214142_connect_schema_tables.sql
20260415214600_connect_schema_rls.sql
20260415214708_connect_schema_views.sql
20260416074245_phase3_schema_gaps.sql
20260416232741_phase4_5_stance_schema.sql
20260416233145_phase4_5_stance_seed_a.sql
20260416233416_phase4_5_stance_seed_b.sql
20260416234110_phase4_5_stance_seed_c.sql
20260417000001_slug_history.sql
20260417000002_community_expansion.sql
20260504000001_phase23_local_compass_topics.sql
```

**Pattern:** `YYYYMMDDHHMMSS_descriptive_name.sql` — 14-digit timestamp prefix.

**Phase 23 used:** `20260504000001` (date 2026-05-04, sequence 000001)

**Phase 24 filename:** `20260504000002_phase24_companion_communities.sql`
- Same date (2026-05-04) since Phase 24 immediately follows Phase 23
- Increment sequence to `000002`
- Descriptive suffix: `phase24_companion_communities`

If executing on a later date, use that date (e.g., `20260505000001_phase24_companion_communities.sql`).

---

## Migration Structure (single transaction)

The CONTEXT.md decision is: fc_community_slug back-fill runs in the same migration as the communities INSERT — one SQL transaction.

```sql
BEGIN;

-- ============================================================
-- SECTION 1: connect.communities (10 new rows)
-- ============================================================

INSERT INTO connect.communities (slug, name, description, topic_id)
VALUES (
  'residential-zoning',
  'Residential Zoning',
  '<authored description>',
  (SELECT id FROM inform.compass_topics WHERE topic_key = 'residential-zoning' AND is_live = true)
);
-- ... (9 more rows)

-- ============================================================
-- SECTION 2: inform.compass_topics fc_community_slug back-fill
-- ============================================================

UPDATE inform.compass_topics
SET fc_community_slug = 'residential-zoning'
WHERE topic_key = 'residential-zoning' AND is_live = true;
-- ... (9 more rows)

COMMIT;
```

**Why subselects for topic_id instead of hardcoded UUIDs:** Phase 23 inserted topics with `gen_random_uuid()` — the UUIDs are only known in the live DB, not in any migration file. Subselect on `topic_key` is the correct and safe pattern.

---

## Architecture Patterns

### Pattern 1: Subselect topic_id resolution
**What:** Resolve topic UUID at migration execution time using topic_key
**When to use:** Always for Phase 24 (UUIDs are not known at authoring time)
```sql
INSERT INTO connect.communities (slug, name, description, topic_id)
VALUES (
  'slug',
  'Name',
  'Description.',
  (SELECT id FROM inform.compass_topics WHERE topic_key = 'key' AND is_live = true)
);
```

### Pattern 2: SET fc_community_slug by topic_key
**What:** Update fc_community_slug using a direct WHERE on topic_key
**When to use:** Section 2 of the Phase 24 migration
```sql
UPDATE inform.compass_topics
SET fc_community_slug = 'slug'
WHERE topic_key = 'key' AND is_live = true;
```
Note: Each UPDATE is one row; 10 UPDATEs total. No CASE WHEN needed — individual UPDATEs are cleaner and easier to verify.

### Anti-Patterns to Avoid
- **Hardcoding UUIDs:** Phase 23 used gen_random_uuid() — UUIDs are unknown. Subselects are required.
- **Two separate migrations:** CONTEXT.md locks INSERT + UPDATE in the same transaction.
- **Using `ON CONFLICT DO NOTHING` on communities without slug uniqueness awareness:** The slug UNIQUE constraint already guards against re-insertion — an ON CONFLICT is fine but not strictly needed if migrating cleanly.

---

## Common Pitfalls

### Pitfall 1: Wrong slug for local-immigration
**What goes wrong:** Using `local-immigration` as the slug matches the topic_key but produces a suboptimal URL
**Why it happens:** 9 of 10 slugs match topic_key exactly; `local-immigration` is the exception
**How to avoid:** Slug = `immigration-policy`; topic_key = `local-immigration` — these are different

### Pitfall 2: Orphaned community (topic_id resolves to NULL)
**What goes wrong:** Subselect returns NULL if the topic_key doesn't match any live topic — INSERT silently succeeds with topic_id = NULL, violating NOT NULL constraint or creating bad data
**Why it happens:** Typo in topic_key string
**How to avoid:** Verification Query B (orphan check) catches this post-migration; write topic_keys carefully in the migration

### Pitfall 3: Missing `AND is_live = true` in subselect
**What goes wrong:** If a topic_key exists in multiple versions, subselect may return multiple rows (violating scalar subquery) or the wrong row
**Why it happens:** Phase 23 topics have only one version currently, but future rewrites could create multiple
**How to avoid:** Always include `AND is_live = true` in the subselect WHERE clause

### Pitfall 4: fc_community_slug UPDATE affecting wrong row
**What goes wrong:** UPDATE without `AND is_live = true` updates the wrong topic version if rewrites exist
**Why it happens:** topic_key is not unique across all versions, only unique for is_live=true
**How to avoid:** Always `WHERE topic_key = '...' AND is_live = true`

### Pitfall 5: Description tone drifts to advocacy or compass-scale references
**What goes wrong:** Description says "Position 1 holds that..." or explicitly mentions "local government" — inconsistent with existing community description tone
**Why it happens:** Overcorrecting for "local" framing
**How to avoid:** Match the existing description template exactly: "Discuss/Explore [sub-debates within topic area]." 20–30 words.

---

## Verification Queries (for Plan 24-02)

### Verification A: Exactly 10 new communities exist for Phase 23 topics
```sql
SELECT COUNT(*)
FROM connect.communities c
JOIN inform.compass_topics t ON t.id = c.topic_id
WHERE t.topic_key IN (
  'residential-zoning','growth-and-development','public-safety-approach',
  'homelessness-response','economic-development','transportation-priorities',
  'local-environment','rent-regulation','local-immigration','city-sanitation'
);
-- Expected: 10
```

### Verification B: Orphan check — all topic_id values resolve
```sql
SELECT c.slug, c.topic_id, t.topic_key
FROM connect.communities c
LEFT JOIN inform.compass_topics t ON t.id = c.topic_id
WHERE c.slug IN (
  'residential-zoning','growth-and-development','public-safety-approach',
  'homelessness-response','economic-development','transportation-priorities',
  'local-environment','rent-regulation','immigration-policy','city-sanitation'
)
AND t.id IS NULL;
-- Expected: 0 rows (no orphans)
```

### Verification C: RPC returns exactly 5 stances for each community
```sql
-- Run for each community; must return exactly 5 rows with non-null description
SELECT c.slug, COUNT(*) AS stance_count, COUNT(rpc.description) AS with_description
FROM connect.communities c
CROSS JOIN LATERAL connect.get_stances_for_community(c.id) AS rpc
WHERE c.slug IN (
  'residential-zoning','growth-and-development','public-safety-approach',
  'homelessness-response','economic-development','transportation-priorities',
  'local-environment','rent-regulation','immigration-policy','city-sanitation'
)
GROUP BY c.slug
ORDER BY c.slug;
-- Expected: 10 rows, each with stance_count=5, with_description=5
```

### Verification D: fc_community_slug populated for all 10 Phase 23 topics
```sql
SELECT topic_key, fc_community_slug
FROM inform.compass_topics
WHERE topic_key IN (
  'residential-zoning','growth-and-development','public-safety-approach',
  'homelessness-response','economic-development','transportation-priorities',
  'local-environment','rent-regulation','local-immigration','city-sanitation'
)
AND is_live = true
ORDER BY topic_key;
-- Expected: 10 rows, all fc_community_slug IS NOT NULL
```

---

## Suggested User Spot-Check Communities (Claude's Discretion)

Suggest these 3 for user manual verification at fc.empowered.vote/[slug]:

1. **`immigration-policy`** — the slug exception case; confirms the `local-immigration` → `immigration-policy` rename worked
2. **`residential-zoning`** — the most common local housing debate topic; high-value UX check
3. **`public-safety-approach`** — policy topic with distinct framing; confirms varied content renders

---

## Suggested SQL Ordering in Migration (Claude's Discretion)

Order communities alphabetically by slug for readability and easy cross-referencing:

1. `city-sanitation` (city-sanitation)
2. `economic-development` (economic-development)
3. `growth-and-development` (growth-and-development)
4. `homelessness-response` (homelessness-response)
5. `immigration-policy` (local-immigration)
6. `local-environment` (local-environment)
7. `public-safety-approach` (public-safety-approach)
8. `rent-regulation` (rent-regulation)
9. `residential-zoning` (residential-zoning)
10. `transportation-priorities` (transportation-priorities)

Section 2 (fc_community_slug UPDATEs) mirrors this order.

---

## Code Examples

### Full INSERT + UPDATE pattern (verified structure)

```sql
BEGIN;

-- ============================================================
-- SECTION 1: connect.communities
-- ============================================================

INSERT INTO connect.communities (slug, name, description, topic_id) VALUES
  ('city-sanitation',
   'City Sanitation',
   '<authored description>',
   (SELECT id FROM inform.compass_topics WHERE topic_key = 'city-sanitation' AND is_live = true));

INSERT INTO connect.communities (slug, name, description, topic_id) VALUES
  ('immigration-policy',
   'Immigration Policy',
   '<authored description>',
   (SELECT id FROM inform.compass_topics WHERE topic_key = 'local-immigration' AND is_live = true));

-- ... 8 more

-- ============================================================
-- SECTION 2: inform.compass_topics fc_community_slug back-fill
-- ============================================================

UPDATE inform.compass_topics SET fc_community_slug = 'city-sanitation'
WHERE topic_key = 'city-sanitation' AND is_live = true;

UPDATE inform.compass_topics SET fc_community_slug = 'immigration-policy'
WHERE topic_key = 'local-immigration' AND is_live = true;

-- ... 8 more

COMMIT;
```

### supabase db push command (verified from Phase 23)
```bash
cd "C:/Focused Communities" && supabase db push
```

### psql verification command (verified from Phase 23)
```bash
DATABASE_URL=$(grep "^DATABASE_URL" "C:/EV-Accounts/backend/.env" | cut -d= -f2-)
psql "$DATABASE_URL" -t -c "<query here>"
```

---

## Open Questions

1. **Name field for communities**
   - What we know: `name` is NOT NULL on `connect.communities`; existing communities have names like "Affordable Housing", "Campaign Finance Reform"
   - What's unclear: Whether name should exactly match `compass_topics.title` or be a shorter version
   - Recommendation: Use the `compass_topics.title` value directly (the full title). For Phase 23 topics: "Residential Zoning", "Growth and Development Pace", "Public Safety Approach", "Homelessness Response", "Economic Development Incentives", "Transportation Priorities", "Environmental Protection vs. Development", "Rent Regulation", "Local Immigration Enforcement", "City Sanitation and Cleanliness". Alternatively, use the same short display name without "Pace"/"Incentives" suffixes for URL-friendliness. The existing community "Affordable Housing" matches the topic's short_title, not its full title. Short names preferred.

---

## Sources

### Primary (HIGH confidence)
- `C:/Focused Communities/supabase/migrations/20260415214142_connect_schema_tables.sql` — connect.communities exact schema
- `C:/Focused Communities/supabase/migrations/20260416074245_phase3_schema_gaps.sql` — slice_label column, get_stances_for_community v1
- `C:/Focused Communities/supabase/migrations/20260416232741_phase4_5_stance_schema.sql` — get_stances_for_community final signature
- `C:/Focused Communities/supabase/migrations/20260417000002_community_expansion.sql` — INSERT pattern + 21 description examples
- `C:/Focused Communities/supabase/migrations/20260504000001_phase23_local_compass_topics.sql` — 10 topic_keys, stance description tone
- `C:/EV-Accounts/backend/src/lib/compassService.ts` — fc_community_slug selected and returned
- `C:/EV-Accounts/backend/src/types/database.types.ts` — fc_community_slug type: `string | null`
- `.planning/STATE.md` Phase 22 Notes — confirms `fc_community_slug = 'criminalization-of-homelessness'` on an existing topic

### Secondary (MEDIUM confidence)
- `.planning/phases/23-new-local-compass-topics/23-RESEARCH.md` — fc_community_slug column documentation
- `.planning/phases/23-new-local-compass-topics/23-02-SUMMARY.md` — migration execution patterns, supabase db push pattern

---

## Metadata

**Confidence breakdown:**
- connect.communities schema: HIGH — read directly from migration file
- INSERT pattern: HIGH — read from community_expansion migration
- fc_community_slug column: HIGH — confirmed in database.types.ts + compassService.ts
- UPDATE pattern: HIGH — standard SQL, column existence confirmed
- RPC function signature: HIGH — read from migration file
- Stance description tone: HIGH — read from 21+ examples in community_expansion migration
- Migration filename: HIGH — read from migration directory listing
- Topic UUIDs: N/A — correctly NOT resolved (must use subselect)

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (stable schema, no fast-moving dependencies)

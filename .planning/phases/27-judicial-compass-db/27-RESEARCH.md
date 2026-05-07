# Phase 27: Judicial Compass DB - Research

**Researched:** 2026-05-06
**Domain:** Supabase/PostgreSQL schema authoring — inform schema, compass tables, judicial topic/stance content
**Confidence:** HIGH

## Summary

Phase 27 is a DB authoring phase with three distinct workstreams: (1) schema migrations, (2) topic/stance content authoring, and (3) a backend service patch. No new dependencies are required — all work uses the existing migration + pool.query pattern in the EV-Accounts backend.

The existing `inform.compass_stances` table stores exactly four columns: `id`, `topic_id`, `value`, `text`. There are no `supporting_points` or `example_perspectives` columns in the DB. These terms from the CONTEXT.md refer to prose content written INTO the `text` field, not separate DB columns. The planner should treat them as authoring guidance, not schema changes.

The `getCompassTopics()` service currently outputs `applies_federal`, `applies_state`, `applies_local` booleans derived from `compass_topic_roles` rows. Adding `'judicial'` scope rows for the 8 new topics will naturally produce `applies_federal=false, applies_state=false, applies_local=false` for judicial topics (because they have no federal/state/local role rows). The service must also be patched to emit an `applies_judicial` boolean so Phase 28 can wire the filter.

The citations table (mentioned in the CONTEXT.md evidence standard) does NOT exist yet. Creating it is Phase 30 work. Phase 27 uses the existing `inform.politician_context` table for reasoning/sources on any future stance ingestion.

**Primary recommendation:** Author all 8 topics + 40 stances + schema changes as numbered SQL migrations (next available number is 112), applying via the direct pool connection pattern used by prior migrations.

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PostgreSQL (Supabase) | 15+ | All data storage | Project standard — inform schema lives here |
| node-postgres (pool) | in-use | Direct SQL execution for migrations | Established pattern in all migrations 025+ |
| TypeScript (tsx) | in-use | Migration apply scripts | Pattern from `_apply-migration-069.ts` |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| supabaseAnon client | in-use | Reads via PostgREST | compassService reads only — not for schema changes |
| SECURITY DEFINER RPCs | in-use | Atomic multi-step operations | admin_create_topic_with_stances, admin_update_politician_answers |

No new npm packages are required.

## Architecture Patterns

### Recommended Migration File Structure
```
backend/migrations/
├── 112_judicial_compass_schema.sql    # ADD COLUMN + CHECK constraint update
├── 113_judicial_compass_topics.sql    # 8 topic inserts + stances + role rows
```

### Pattern 1: CHECK Constraint Update (role_scope)
**What:** The current CHECK on `compass_topic_roles.role_scope` only allows `('federal', 'state', 'local')`. To add `'judicial'` you must DROP and recreate the constraint (ALTER TABLE … DROP CONSTRAINT … ADD CONSTRAINT).
**Migration 059 added this constraint as:**
```sql
-- From migration 059_topic_scoping_foundation.sql
DO $$ BEGIN
  ALTER TABLE inform.compass_topic_roles
    ADD CONSTRAINT chk_role_scope_tier
    CHECK (role_scope IN ('federal', 'state', 'local'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```
**To update:**
```sql
-- Source: migration 059 pattern, verified in codebase
ALTER TABLE inform.compass_topic_roles
  DROP CONSTRAINT IF EXISTS chk_role_scope_tier;

ALTER TABLE inform.compass_topic_roles
  ADD CONSTRAINT chk_role_scope_tier
  CHECK (role_scope IN ('federal', 'state', 'local', 'judicial'));
```

### Pattern 2: Add judicial_role Column to compass_topics
**What:** Nullable TEXT column with CHECK constraint. NULL = universal, `'judge'` = judge-only, `'city_attorney_da'` = DA/CA-only.
```sql
-- Source: CONTEXT.md decision + office_scope precedent from migration 059
ALTER TABLE inform.compass_topics
  ADD COLUMN IF NOT EXISTS judicial_role TEXT
  CHECK (judicial_role IN ('judge', 'city_attorney_da'));
-- NULL means universal — no default needed
```

### Pattern 3: Topic Insertion (direct INSERT, not admin_create_topic_with_stances)
**What:** The `admin_create_topic_with_stances` RPC handles topic+stances atomically but does NOT set `topic_key`, `is_live=true` directly (it requires a separate UPDATE for topic_key). For migrations, direct INSERT is cleaner and more explicit.
**Why direct INSERT beats RPC in migrations:**
- The RPC was designed for admin UI one-offs, not bulk authoring
- Migration 061 uses direct INSERT for topic + stances
- Allows setting all columns in one statement including `topic_key`, `judicial_role`, `fc_community_slug`

```sql
-- Source: migration 061_topic_rewrite_workflow.sql pattern + database.types.ts verified columns
-- compass_topics columns: id, title, short_title, question_text, is_live, is_active (generated),
--   version, went_live_at, created_at, updated_at, topic_key, office_scope, fc_community_slug,
--   judicial_role (new)

DO $$
DECLARE
  v_topic_id UUID;
BEGIN
  -- Insert topic
  INSERT INTO inform.compass_topics (
    topic_key, title, short_title, question_text,
    is_live, went_live_at, version, fc_community_slug,
    judicial_role
  ) VALUES (
    'criminal-justice-approach',
    'Criminal Justice Approach',
    'Criminal Justice',
    'When someone is convicted, what should the legal system focus on?',
    true, now(), 1, NULL,
    NULL -- universal
  )
  RETURNING id INTO v_topic_id;

  -- Insert 5 stances
  INSERT INTO inform.compass_stances (topic_id, value, text) VALUES
    (v_topic_id, 1, '[stance 1 text]'),
    (v_topic_id, 2, '[stance 2 text]'),
    (v_topic_id, 3, '[stance 3 text]'),
    (v_topic_id, 4, '[stance 4 text]'),
    (v_topic_id, 5, '[stance 5 text]');

  -- Assign judicial scope
  INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
  VALUES (v_topic_id, 'judicial', true);
END $$;
```

### Pattern 4: getCompassTopics() Service Patch
**What:** Add `applies_judicial` boolean to the returned topic object. No scope parameter needed — the flag is derived the same way as `applies_local/state/federal`.
```typescript
// Source: backend/src/lib/compassService.ts lines 149-157 (verified)
// Add alongside existing applies_federal/state/local:
const applies_judicial = hasAnyRoleRows
  ? topicRoles.some(r => r.role_scope === 'judicial')
  : false; // judicial never defaults to "show everywhere" if no rows

return {
  ...topic,
  applies_federal,
  applies_state,
  applies_local,
  applies_judicial,   // NEW
  stances: ...,
  ...
};
```
**Important fallback behavior difference:** Existing topics with NO role rows default to `applies_federal=true, applies_state=true, applies_local=true`. Judicial topics should NOT default `applies_judicial=true` — use `false` as the fallback so non-judicial topics never accidentally show on a judicial profile.

### Pattern 5: Role Scope Insert Pattern for All 8 Topics
Each of the 8 topics gets exactly one `compass_topic_roles` row:
```sql
-- universal topics (4): judicial_role=NULL, role_scope='judicial'
INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
VALUES (v_topic_id, 'judicial', true);

-- judge-only topics (2): judicial_role='judge', role_scope='judicial'
-- city_attorney_da-only topics (2): judicial_role='city_attorney_da', role_scope='judicial'
-- Both still get role_scope='judicial' — judicial_role is the sub-filter, not the scope
```

### Anti-Patterns to Avoid
- **Using admin_create_topic_with_stances RPC in migration SQL:** It doesn't accept `judicial_role` or `topic_key` natively; requires extra UPDATEs. Use direct INSERT.
- **Adding federal/state/local role rows for judicial topics:** All 8 topics must have ONLY `'judicial'` in role_scope. Adding other scope rows would make them appear on non-judicial profiles.
- **Assuming applies_judicial fallback = true:** Unlike the existing federal/state/local fallback, judicial should NOT default to `true` for topics with no role rows. The fallback logic in `getCompassTopics()` must be patched.
- **Using `supporting_points` as a DB column:** This column does not exist. All stance prose goes into the `text` field of `compass_stances`. The CONTEXT terms `description`/`supporting_points`/`example_perspectives` describe what to write in `text`, not new columns.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic topic+stance insert | Custom transaction logic | Direct INSERT in DO $$ block | Already proven in migration 061 |
| Scope filtering on frontend | New API parameter | `applies_judicial` boolean flag on existing response shape | Matches the applies_federal/state/local pattern exactly |
| Citations for judicial stances | New citations table in Phase 27 | Existing `inform.politician_context` (reasoning + sources[]) | Citations table is Phase 30 — don't create early |
| Migration numbering | Timestamp-based | Sequential numeric prefix (112, 113, ...) | All 87+ migrations use sequential numbers in backend/migrations/ |

**Key insight:** This codebase has two parallel migration systems: `supabase/migrations/` (Supabase CLI, timestamp-prefixed, used for infra-level changes) and `backend/migrations/` (sequential numeric, used for data model + content). All compass/inform schema work goes in `backend/migrations/` with the next sequential number (112).

## Common Pitfalls

### Pitfall 1: Wrong Migration Directory
**What goes wrong:** Writing the migration to `supabase/migrations/` instead of `backend/migrations/`
**Why it happens:** Two parallel migration systems exist in the same repo
**How to avoid:** All inform schema and compass content lives in `backend/migrations/` with sequential numbering. The supabase/ folder handles auth/RLS and Supabase-specific infra.
**Warning signs:** File named with timestamp format instead of `112_...`

### Pitfall 2: CHECK Constraint Conflict on role_scope
**What goes wrong:** INSERT into `compass_topic_roles` with `role_scope='judicial'` fails with constraint violation
**Why it happens:** Migration 059 added `CHECK (role_scope IN ('federal', 'state', 'local'))` — this must be dropped and recreated before any judicial inserts
**How to avoid:** Put the CHECK constraint update in migration 112 (schema migration) that runs before migration 113 (topic inserts). Or combine both into one migration with the constraint drop at the top.
**Warning signs:** `ERROR: new row for relation "compass_topic_roles" violates check constraint "chk_role_scope_tier"`

### Pitfall 3: getCompassTopics() Fallback Logic Leaks Judicial Topics
**What goes wrong:** Existing topics with NO role rows have `applies_judicial` evaluated as `true` (because `hasAnyRoleRows=false` → falls into the "default all true" branch)
**Why it happens:** The current fallback assumes "no role rows = cross-cutting (all tiers)". If `applies_judicial` is naively added to the fallback, 26 existing topics will leak into judicial profiles.
**How to avoid:** Use a separate fallback for `applies_judicial` — always `false` when `hasAnyRoleRows === false`. Only `applies_judicial=true` when the topic explicitly has a `'judicial'` row.
**Warning signs:** Profile pages for judges show non-judicial topics like "Abortion" or "Immigration"

### Pitfall 4: topic_key Slug Not Set Explicitly
**What goes wrong:** The derive_topic_key trigger fires and sets topic_key from short_title via `lower(replace(short_title, ' ', '-'))`. For topics like "Criminal Justice Approach" the short_title might be "Criminal Justice" → topic_key becomes "criminal-justice", not "criminal-justice-approach".
**Why it happens:** Migration 055 installed a BEFORE INSERT trigger that auto-derives topic_key from short_title if topic_key is empty string. Since the INSERT sets `topic_key=''` as default, the trigger fires.
**How to avoid:** Always explicitly set topic_key in the INSERT statement. Don't rely on the trigger.
**Warning signs:** topic_key doesn't match what you inserted; SELECT topic_key shows the short_title-derived slug instead

### Pitfall 5: Stance text Missing for topic_key Unique Index
**What goes wrong:** Migration silently fails because `idx_compass_topics_topic_key_live` (partial UNIQUE on topic_key WHERE is_live=true) rejects a second live topic with the same key
**Why it happens:** If the migration is run twice or has duplicate topic_key values
**How to avoid:** Use distinct, unambiguous topic_key slugs for all 8 topics. Add `ON CONFLICT DO NOTHING` or `IF NOT EXISTS` guards.
**Warning signs:** `ERROR: duplicate key value violates unique constraint "idx_compass_topics_topic_key_live"`

### Pitfall 6: Missing fc_community_slug Column in SELECT
**What goes wrong:** compassService.ts already SELECTs `fc_community_slug` from `compass_topics`. If new topics don't have it, they return NULL (fine), but the column must exist.
**Why it happens:** fc_community_slug was added to the DB at some point without a recorded migration in backend/migrations/ — it's in database.types.ts as nullable.
**How to avoid:** Set `fc_community_slug = NULL` explicitly in new topic INSERTs. It's already nullable so no issue.

## Code Examples

### Full Topic+Stance+Role Insert Pattern (verified schema)
```sql
-- Source: migration 061 pattern + database.types.ts compass_topics Row type
DO $$
DECLARE
  v_id UUID;
BEGIN
  -- Check not already inserted (idempotency)
  IF EXISTS (
    SELECT 1 FROM inform.compass_topics
    WHERE topic_key = 'criminal-justice-approach' AND is_live = true
  ) THEN RETURN; END IF;

  INSERT INTO inform.compass_topics (
    topic_key, title, short_title, question_text,
    is_live, went_live_at, version,
    fc_community_slug, office_scope, judicial_role
  ) VALUES (
    'criminal-justice-approach',
    'Criminal Justice Approach',
    'Criminal Justice',
    'When someone is convicted, what should the legal system focus on?',
    true, now(), 1,
    NULL, NULL, NULL  -- universal judicial topic
  )
  RETURNING id INTO v_id;

  INSERT INTO inform.compass_stances (topic_id, value, text) VALUES
    (v_id, 1, '[value=1 stance text — observable behavior description]'),
    (v_id, 2, '[value=2 stance text]'),
    (v_id, 3, '[value=3 stance text — centrist/balanced]'),
    (v_id, 4, '[value=4 stance text]'),
    (v_id, 5, '[value=5 stance text — observable behavior description]');

  INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
  VALUES (v_id, 'judicial', true);

END $$;
```

### getCompassTopics() Patch (verified service code)
```typescript
// Source: backend/src/lib/compassService.ts lines 143-176
// Current code derives applies_federal/state/local.
// Add applies_judicial with DIFFERENT fallback logic:
const applies_judicial = hasAnyRoleRows
  ? topicRoles.some(r => r.role_scope === 'judicial')
  : false;  // NOT true — judicial is opt-in only

return {
  ...topic,
  applies_federal,
  applies_state,
  applies_local,
  applies_judicial,  // add this
  stances: ...,
  categories: ...,
  roles: topicRoles.map(...),
};
```

### Idempotent CHECK Constraint Update
```sql
-- Source: migration 059 pattern — verified constraint name 'chk_role_scope_tier'
ALTER TABLE inform.compass_topic_roles
  DROP CONSTRAINT IF EXISTS chk_role_scope_tier;

ALTER TABLE inform.compass_topic_roles
  ADD CONSTRAINT chk_role_scope_tier
  CHECK (role_scope IN ('federal', 'state', 'local', 'judicial'));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No role_scope constraint | CHECK (`'federal'`,`'state'`,`'local'`) | Migration 059 | Must DROP/ADD to extend |
| No topic_key column | topic_key NOT NULL + trigger derives from short_title | Migration 055 | Always set topic_key explicitly in INSERT |
| Stance value INT | NUMERIC(3,1) on politician_answers; INT on compass_stances | Migration 038/030 | compass_stances.value remains INT 1-5; politician_answers.value is NUMERIC |
| inform.compass_topics has no fc_community_slug | fc_community_slug TEXT NULL exists | Unknown migration | SELECT already includes it; set NULL for Phase 27 |

**Deprecated/outdated:**
- `admin_create_topic_with_stances` RPC for migration use: fine for one-off admin UI, but doesn't support `judicial_role` column natively and requires extra UPDATE for topic_key. Use direct INSERT in migrations.

## Schema Reference (Verified from database.types.ts + migrations)

### inform.compass_topics — ALL columns
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto gen_random_uuid() |
| title | TEXT NOT NULL | Full display title |
| short_title | TEXT | Used for CompassCard axis labels |
| question_text | TEXT NOT NULL | Question shown to user |
| is_live | BOOLEAN NOT NULL DEFAULT false | Must be true to appear in app |
| is_active | BOOLEAN GENERATED | Always mirrors is_live (backward compat) |
| version | INT NOT NULL DEFAULT 1 | Rewrite versioning |
| went_live_at | TIMESTAMPTZ | Set to now() when is_live=true at insert |
| created_at | TIMESTAMPTZ NOT NULL | auto |
| updated_at | TIMESTAMPTZ NOT NULL | auto |
| topic_key | TEXT NOT NULL UNIQUE (when is_live=true) | Slug, set explicitly |
| office_scope | TEXT[] NULL | Informational only, not a render filter |
| fc_community_slug | TEXT NULL | Phase 28 populates; NULL for Phase 27 |
| judicial_role | TEXT NULL CHECK ('judge','city_attorney_da') | **NEW — Phase 27 adds** |

### inform.compass_stances — ALL columns (verified)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto |
| topic_id | UUID FK → compass_topics | |
| value | INT NOT NULL CHECK 1-5 | 1 = one pole, 5 = other pole |
| text | TEXT NOT NULL | Full stance description — this is where prose goes |

**NO supporting_points, description, or example_perspectives columns exist.**

### inform.compass_topic_roles — ALL columns (verified)
| Column | Type | Notes |
|--------|------|-------|
| topic_id | UUID FK → compass_topics | |
| role_scope | TEXT NOT NULL CHECK | Currently: `('federal','state','local')` — Phase 27 adds `'judicial'` |
| is_required | BOOLEAN NOT NULL DEFAULT true | |
| PK | (topic_id, role_scope) UNIQUE | from migration 059 uq_compass_topic_roles_topic_scope |

### Citations Table Status
The CONTEXT.md mentions "separate citations table linking inform.politician_answers rows to one or more source URLs." **This table does NOT exist.** The existing `inform.politician_context` table (politician_id, topic_id, reasoning TEXT, sources TEXT[]) is the current citation storage mechanism. Phase 30 will create a normalized citations table. Phase 27 should NOT create it.

## Topic Content Reference (from project_judicial_compass_design.md memory)

The memory file contains finalized plain-language stance text for all 8 topics (8 spokes × 5 stances = 40 stances). The planner should reference this content directly when authoring migration SQL. Key mapping to CONTEXT.md topics:

| CONTEXT.md Topic | Memory File Spoke |
|------------------|-------------------|
| Criminal Justice Approach | "When someone breaks the law, what matters most?" |
| Access to Justice | "Should it be easy or hard to take someone to court?" |
| Prosecutorial/Judicial Discretion | "When government and a citizen clash, who gets the benefit of the doubt?" |
| Transparency in Legal Proceedings | (no direct match — needs authoring per CONTEXT.md guidance) |
| Judicial Interpretation | "Does the law change with the times?" + "If an old ruling seems wrong today, should it still count?" |
| Bail and Pretrial Decisions | "Should a judge trust what prosecutors say, or watch them closely?" |
| Prosecution Priorities | "Does the office try to put people away, or find better solutions?" |
| Police Accountability | "When city employees do wrong, does the office defend them or hold them accountable?" |

Note: The memory has two spoke definitions for Judicial Interpretation (judge-specific spokes 5a and 6a in the memory map differently to the CONTEXT.md topics 5 and 6). The CONTEXT.md topic names are authoritative; the memory provides the stance text.

## Open Questions

1. **topic_key slug format for judicial topics**
   - What we know: existing slugs use hyphenated lowercase short titles (e.g., `criminal-justice`, `affordable-housing`, `taxes`)
   - What's unclear: should judicial topics use the full title form (`criminal-justice-approach`) or shorter form (`criminal-justice`)?
   - Recommendation: Use descriptive slugs that won't collide with existing topics — `criminal-justice-approach` not `criminal-justice` (which already exists as an existing topic or could conflict). Verify no existing live topic has that slug before inserting.

2. **Transparency in Legal Proceedings stance content**
   - What we know: the memory file does not include this topic (it was added to the 8 in CONTEXT.md but the memory predates it or didn't capture it)
   - What's unclear: exact 5-stance scale text
   - Recommendation: Author fresh per CONTEXT.md guidance — observable behaviors, evidenceable positions, hypothetical ruling examples

3. **migration 112 vs combining into fewer files**
   - What we know: prior phases use one file per logical unit
   - What's unclear: whether schema + content should be one migration or two
   - Recommendation: Two separate migrations (112 = schema changes, 113 = content) so schema is idempotent and re-runnable separately from content authoring

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/src/lib/compassService.ts` — verified getCompassTopics() logic, scope flag derivation, all SELECT columns
- `C:/EV-Accounts/backend/src/types/database.types.ts` — verified compass_topics, compass_stances, compass_topic_roles column definitions
- `C:/EV-Accounts/backend/migrations/059_topic_scoping_foundation.sql` — verified CHECK constraint name and values
- `C:/EV-Accounts/backend/migrations/055_compass_topic_key.sql` — verified topic_key trigger behavior
- `C:/EV-Accounts/backend/migrations/026_inform_schema.sql` — verified original schema
- `C:/EV-Accounts/backend/migrations/111_politician_alternate_names.sql` — confirmed 111 is the highest existing migration
- `C:/Transparent Motivations/essentials/src/pages/Profile.jsx` — verified districtScope derivation (no JUDICIAL case)
- `C:/Transparent Motivations/essentials/src/components/CompassCard.jsx` — verified applies_* flag usage pattern
- `C:/Users/Chris/.claude/projects/.../memory/project_judicial_compass_design.md` — verified 8-topic stance text

### Secondary (MEDIUM confidence)
- `C:/EV-Accounts/backend/migrations/061_topic_rewrite_workflow.sql` — direct INSERT pattern for topics+stances
- `C:/EV-Accounts/backend/migrations/101_collin_county_compass_stances.sql` — verified politician_context insert pattern

## Metadata

**Confidence breakdown:**
- Schema (compass_topics columns): HIGH — read directly from database.types.ts + migrations
- Architecture (migration pattern): HIGH — verified against 10+ existing migrations
- Pitfalls (CHECK constraint, fallback logic): HIGH — read from actual service code
- Stance content: MEDIUM — from memory file which may need minor editing for tone/format
- topic_key slugs: MEDIUM — convention is clear, specific choices are Claude's discretion

**Research date:** 2026-05-06
**Valid until:** 2026-06-06 (DB schema stable; service code is the constraint)

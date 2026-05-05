# Phase 23: New LOCAL Compass Topics - Research

**Researched:** 2026-05-04
**Domain:** PostgreSQL migration — inform schema compass topic insertion (C:\Focused Communities project)
**Confidence:** HIGH

## Summary

Phase 23 inserts 10 new compass topics into the live `inform` schema. The `inform` schema is owned by the `C:\EV-Accounts` backend and the Supabase database it manages; migrations that affect it can be applied from either project. The `C:\Focused Communities` project has already done this (migrations 20260416xxx files reference `inform.compass_stances` and `inform.compass_topic_roles` directly). Phase 23 migrations go in `C:\Focused Communities\supabase\migrations\`.

The schema is well-understood from direct source reads. Every question is answered concretely from migration files and compassService.ts. The `topic_key` naming convention is `lowercase-hyphenated` derived from the `short_title` (a trigger auto-derives it if not set explicitly, but explicit is better). The `role_scope` values are the lowercase strings `'local'`, `'state'`, and `'federal'` — constrained by CHECK since migration 059. The `is_required = true` flag controls completeness scoring for politicians filling out the compass for a given role tier.

The next available migration timestamp in `C:\Focused Communities\supabase\migrations\` is anything after `20260417000002`. The convention there uses date-prefixed timestamps; the new migration should be named `20260504000001_phase23_local_compass_topics.sql` (or similar using today's date).

**Primary recommendation:** Write a single migration with three sections: (1) INSERT 10 compass_topics rows with explicit `topic_key` values, (2) INSERT 50 compass_stances rows (5 per topic) with all 4 content fields, (3) INSERT 14 compass_topic_roles rows using ON CONFLICT DO NOTHING throughout.

## Standard Stack

This phase is pure PostgreSQL DDL/DML — no application libraries involved.

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Supabase migrations | CLI | Applied via `supabase db push` or direct psql | Established pattern for this project |
| PostgreSQL | 15 (Supabase default) | Target database | Shared DB across all EV projects |

### No npm installs needed

This is a data migration — no library dependencies.

## Architecture Patterns

### Recommended Migration Structure

```
C:\Focused Communities\supabase\migrations\
└── 20260504000001_phase23_local_compass_topics.sql
```

Single file, three sections, wrapped in `BEGIN; ... COMMIT;`.

### Pattern 1: Topic INSERT with explicit topic_key

**What:** Insert a compass topic with all required columns. `is_active` is GENERATED ALWAYS AS (is_live) STORED — never include in INSERT. `went_live_at` should be `now()` since `is_live = true`.

**Source:** `C:\EV-Accounts\backend\migrations\029_compass_admin_rpcs.sql` lines 105-119 + `20260226000015_inform_schema.sql`

```sql
-- SECTION 1: compass_topics (10 rows)
INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(), 'residential-zoning',
   'Residential Zoning',
   'Residential Zoning',
   'What should guide decisions about housing density and neighborhood character in your city?',
   true, now())
ON CONFLICT DO NOTHING;
```

**Key constraint:** `is_active` is `GENERATED ALWAYS AS (is_live) STORED` — including it in INSERT causes a PostgreSQL error. Never include it.

**Key constraint:** `topic_key` has a UNIQUE partial index WHERE `is_live = true` (migration 061). Since all 10 new topics are brand-new keys, no conflict is expected. `ON CONFLICT DO NOTHING` prevents re-run errors.

**Key constraint:** The `derive_topic_key` BEFORE INSERT trigger auto-sets `topic_key` from `short_title` if topic_key is `''` or NULL. Since we're setting `topic_key` explicitly to a non-empty value, the trigger will leave it alone.

### Pattern 2: Stances INSERT referencing topic by UUID variable

Since the topic UUID is generated at INSERT time via `gen_random_uuid()`, stances must reference it by subquery on `topic_key`, not by hardcoded UUID.

**Source:** Pattern established in `20260416233145_phase4_5_stance_seed_a.sql` (UPDATE pattern) and `029_compass_admin_rpcs.sql` (INSERT pattern)

```sql
-- SECTION 2: compass_stances (50 rows — 5 per topic)
-- Use a DO block with variables to capture topic IDs after insert
DO $$
DECLARE
  v_rz UUID;
  -- ... other variables
BEGIN
  SELECT id INTO v_rz FROM inform.compass_topics
  WHERE topic_key = 'residential-zoning' AND is_live = true;

  INSERT INTO inform.compass_stances
    (topic_id, value, text, description, supporting_points, example_perspectives)
  VALUES
    (v_rz, 1,
     'Protect existing neighborhood character strictly; require community votes before any rezoning',
     '[description text]',
     ARRAY['[point 1]', '[point 2]', '[point 3]'],
     ARRAY['[perspective 1]', '[perspective 2]', '[perspective 3]']
    )
  ON CONFLICT (topic_id, value) DO NOTHING;
  -- ... 4 more stances
END $$;
```

**Alternative pattern** (used in FC seed files): Run INSERT first, then UPDATE stances using topic_id UUID. The Phase 23 plan should pick one consistent approach. The DO $$ block approach is cleaner for a new insert.

### Pattern 3: compass_topic_roles INSERT

**Source:** `C:\EV-Accounts\backend\migrations\063_abortion_local_tier_flag.sql`

```sql
-- SECTION 3: compass_topic_roles (14 rows)
INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, 'local', true
FROM inform.compass_topics t
WHERE t.topic_key = 'residential-zoning' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;

-- For multi-scope topics, add a second row:
INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, 'state', true
FROM inform.compass_topics t
WHERE t.topic_key = 'economic-development-incentives' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;
```

### Anti-Patterns to Avoid

- **Including `is_active` in INSERT:** It is `GENERATED ALWAYS AS (is_live) STORED`. PostgreSQL will error with "column is_active can only be updated to DEFAULT."
- **Hardcoding UUIDs for new topics in stances:** UUIDs are generated at INSERT time. Use subquery by `topic_key` instead.
- **Using old role_scope values:** The original schema comment said `'city_council', 'state_legislature', 'us_congress', 'president'`. Those were never used. Migration 059 added a CHECK constraint: only `'federal'`, `'state'`, `'local'` are valid. Using the old strings will fail the constraint.
- **Leaving `went_live_at` NULL for live topics:** The admin RPC sets `went_live_at = now()` when `is_live = true`. Follow this for consistency (Phase 7 lapse cron uses this column).
- **Omitting `supporting_points` or `example_perspectives`:** Both columns have `NOT NULL DEFAULT '{}'` — but omitting them means empty arrays, which is wrong for authored content. Always provide all 4 content fields.

## Schema Reference (verified from source)

### inform.compass_topics (relevant columns)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | Never hardcode for new rows |
| topic_key | TEXT | NOT NULL, UNIQUE (partial: is_live=true) | lowercase-hyphenated |
| title | TEXT | NOT NULL | Full display title |
| short_title | TEXT | nullable | Used by trigger to derive topic_key if not set |
| question_text | TEXT | NOT NULL | The question posed to politicians |
| is_live | BOOLEAN | NOT NULL DEFAULT false | Set true for Phase 23 |
| is_active | BOOLEAN | GENERATED ALWAYS AS (is_live) STORED | NEVER include in INSERT/UPDATE |
| version | INT | NOT NULL DEFAULT 1 | Leave as 1 for new topics |
| went_live_at | TIMESTAMPTZ | nullable | Set to now() when is_live=true |
| office_scope | TEXT[] | nullable | Informational only, leave NULL |
| fc_community_slug | TEXT | nullable | Set when FC community created (Phase 24) |
| created_at, updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | Auto-set |

### inform.compass_stances (full schema)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| topic_id | UUID | NOT NULL FK → compass_topics(id) ON DELETE CASCADE | |
| value | INT | NOT NULL CHECK (value BETWEEN 1 AND 5) | 1=strongly left, 5=strongly right |
| text | TEXT | NOT NULL | Short stance label (from proposed question doc) |
| description | TEXT | nullable (but should be authored) | ~2-3 paragraph explanation |
| supporting_points | TEXT[] | NOT NULL DEFAULT '{}' | 3-4 bullet points |
| example_perspectives | TEXT[] | NOT NULL DEFAULT '{}' | 3 "A [person] who..." perspectives |
| UNIQUE | (topic_id, value) | — | One stance per value per topic |

### inform.compass_topic_roles (full schema)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| topic_id | UUID | NOT NULL FK → compass_topics(id) ON DELETE CASCADE | |
| role_scope | TEXT | NOT NULL, CHECK (role_scope IN ('federal', 'state', 'local')) | Constraint added migration 059 |
| is_required | BOOLEAN | NOT NULL DEFAULT true | Used by completeness scoring |
| PRIMARY KEY | (topic_id, role_scope) | — | |
| UNIQUE | (topic_id, role_scope) | Added migration 059 | Enables ON CONFLICT clause |

## What `is_required` Does (verified from source)

From `compassService.ts` `getCompassCompleteness()` and the `get_compass_completeness` RPC (migration 025):

When a user requests compass completeness for a specific role scope (e.g., `?role=local`), the system counts only topics that have a `compass_topic_roles` row with `role_scope = 'local'` AND `is_required = true`. Topics without a matching row are not counted toward completeness for that scope.

**Decision confirmed:** All 14 new rows should use `is_required = true` — this matches every existing row in the table and ensures politicians filling out the local-scope compass see all 10 new topics as required for completeness.

**If `is_required = false`:** The topic would appear in tier filtering (applies_local = true) but would NOT count toward completeness scoring. There is no current use case for this.

## Topic Keys Recommended (Claude's Discretion)

Naming convention: `lowercase-hyphenated` derived from short_title. Existing examples:
- `homelessness` (from "Criminalization of Homelessness")
- `jail-capacity` (from "Jail Capacity and Incarceration Alternatives")
- `data-centers` (from "Data Center Development & Energy Costs")
- `abortion` (from "Reproductive Rights and Abortion Access")

Recommended topic_keys for Phase 23:

| Topic | Recommended topic_key |
|-------|----------------------|
| Residential Zoning | `residential-zoning` |
| Growth and Development Pace | `growth-and-development` |
| Public Safety Approach | `public-safety-approach` |
| Homelessness Response | `homelessness-response` |
| Economic Development Incentives | `economic-development` |
| Transportation Priorities | `transportation-priorities` |
| Environmental Protection vs. Development | `local-environment` |
| Rent Regulation | `rent-regulation` |
| Local Immigration Enforcement | `local-immigration` |
| City Sanitation and Cleanliness | `city-sanitation` |

**Rationale:** Short enough to be usable as join keys with `essentials.quotes`. `homelessness-response` is distinct from existing `homelessness` (Criminalization of Homelessness). `local-environment` distinguishes from any future federal/state environment topic. `local-immigration` distinguishes from federal `deportation-priorities` and `immigration-and-treatment`.

## Scope Tag Assignments (from CONTEXT.md decisions)

| Topic | LOCAL | STATE |
|-------|-------|-------|
| Residential Zoning | YES | no |
| Growth and Development Pace | YES | YES |
| Public Safety Approach | YES | no |
| Homelessness Response | YES | no |
| Economic Development Incentives | YES | YES |
| Transportation Priorities | YES | YES |
| Environmental Protection vs. Development | YES | no |
| Rent Regulation | YES | YES |
| Local Immigration Enforcement | YES | no |
| City Sanitation and Cleanliness | YES | no |

Total rows: 14 (10 LOCAL + 4 additional STATE for multi-scope topics)

## Migration Numbering

**Next migration in `C:\Focused Communities\supabase\migrations\`:** The last file is `20260417000002_community_expansion.sql`. The next migration should follow the same timestamp prefix convention. Recommended name:

```
20260504000001_phase23_local_compass_topics.sql
```

The date prefix `20260504` matches today's date (2026-05-04). The `000001` sequence disambiguates if multiple migrations land today.

## Proposed Question Texts (from LOCAL-COMPASS-QUESTIONS-PROPOSED.md)

All text below is taken verbatim from the approved file at `.planning/phases/18-compass-stances/LOCAL-COMPASS-QUESTIONS-PROPOSED.md`.

### 1. Residential Zoning
**question_text:** "What should guide decisions about housing density and neighborhood character in your city?"

| value | text |
|-------|------|
| 1 | Protect existing neighborhood character strictly; require community votes before any rezoning |
| 2 | Allow modest density increases (duplexes, accessory units) with strong design review and neighborhood input |
| 3 | Allow multifamily and mixed-use near commercial corridors while protecting most residential zones |
| 4 | Upzone broadly to allow multifamily by right; streamline approvals and reduce parking requirements |
| 5 | Eliminate single-family-only zoning; allow any housing type on any lot citywide |

### 2. Growth and Development Pace
**question_text:** "How should your city manage population growth and new development?"

| value | text |
|-------|------|
| 1 | Impose growth limits; require voter approval for major annexations or large-scale developments |
| 2 | Allow growth only where existing infrastructure can support it; slow approvals until capacity catches up |
| 3 | Plan proactively — invest in infrastructure ahead of growth to support responsible expansion |
| 4 | Streamline permitting, reduce fees, and actively recruit development to grow the city's tax base |
| 5 | Remove regulatory barriers to development entirely; let market demand determine growth pace |

### 3. Public Safety Approach
**question_text:** "How should your city fund and operate public safety services?"

| value | text |
|-------|------|
| 1 | Redirect a significant portion of the police budget to social services, mental health, and community programs |
| 2 | Maintain current police staffing but shift non-violent calls to unarmed mental health co-responders |
| 3 | Keep current public safety funding while adding crisis response teams for mental health and addiction calls |
| 4 | Increase police staffing, equipment, and pay to improve response times and deter crime |
| 5 | Make expanding the police budget the top city spending priority over other municipal services |

### 4. Homelessness Response
**question_text:** "What should be your city's primary strategy for addressing homelessness?"

| value | text |
|-------|------|
| 1 | Housing-first: provide permanent supportive housing with no preconditions; avoid criminalization entirely |
| 2 | Expand shelter capacity and services as the primary strategy; use enforcement only after services are offered |
| 3 | Invest in outreach, shelter, and mental health services while enforcing reasonable public space rules |
| 4 | Enforce anti-camping ordinances as the primary tool while maintaining basic outreach programs |
| 5 | Prioritize strict enforcement of trespassing and camping bans; minimize city spending on homeless services |

### 5. Economic Development Incentives
**question_text:** "How should your city attract businesses and support economic development?"

| value | text |
|-------|------|
| 1 | No corporate tax incentives; invest in public services and infrastructure to attract business organically |
| 2 | Small business support and local entrepreneur programs only; avoid large corporate subsidies |
| 3 | Targeted incentives for specific industries with community benefit agreements and job quality requirements |
| 4 | Compete actively for major employers with significant tax abatements and infrastructure investment |
| 5 | Offer maximum incentives to attract any large employer; economic growth is the top city priority |

### 6. Transportation Priorities
**question_text:** "Where should your city focus its transportation investment?"

| value | text |
|-------|------|
| 1 | Prioritize pedestrian infrastructure, cycling networks, and public transit; reduce parking requirements citywide |
| 2 | Invest equally in roads and multimodal options; require bike lanes and sidewalks on all new road projects |
| 3 | Maintain roads while selectively adding transit connections and pedestrian improvements where density supports it |
| 4 | Focus on road capacity and traffic flow; transportation investment should serve the majority who drive |
| 5 | Prioritize highway access and abundant free parking as the foundation of local transportation policy |

### 7. Environmental Protection vs. Development
**question_text:** "How should your city balance new development with environmental preservation?"

| value | text |
|-------|------|
| 1 | Require significant green space, tree preservation, and environmental review before approving any development |
| 2 | Protect existing parks and tree canopy strictly; require developers to fully offset any environmental impact |
| 3 | Apply consistent environmental standards while giving developers reasonable flexibility on implementation |
| 4 | Allow developers to pay fees in lieu of on-site preservation; prioritize economic activity over green space |
| 5 | Remove local environmental restrictions beyond what state and federal law requires |

### 8. Rent Regulation
**question_text:** "What role should your city play in regulating rents and protecting tenants?"

| value | text |
|-------|------|
| 1 | Expand rent control to all rental units with strong tenant protections and just-cause eviction requirements |
| 2 | Strengthen existing rent stabilization and extend coverage to more units |
| 3 | Maintain current tenant protections while allowing market rents for new construction |
| 4 | Limit rent regulations to subsidized units; allow market rents broadly |
| 5 | Oppose rent control entirely; rents should be set by the market without government intervention |

### 9. Local Immigration Enforcement
**question_text:** "How should your city's police department relate to federal immigration enforcement?"

| value | text |
|-------|------|
| 1 | Refuse all ICE detainers; prohibit city employees from sharing immigration status information with federal agencies |
| 2 | Comply only with court-ordered detainers; protect undocumented crime victims and witnesses from referral |
| 3 | Follow federal law as required but do not use city resources for proactive immigration enforcement |
| 4 | Honor ICE detainers and share information proactively when federal agencies request it |
| 5 | Direct city police to actively assist with immigration enforcement and support federal detention operations |

### 10. City Sanitation and Cleanliness
**question_text:** "How should your city approach street cleanliness and sanitation?"

| value | text |
|-------|------|
| 1 | Significantly expand sanitation staffing, cleaning frequency, and free community disposal access; treat poor conditions as a services failure |
| 2 | Increase sanitation crews and prioritize historically underserved neighborhoods to equalize cleanliness citywide |
| 3 | Maintain current sanitation services while enforcing anti-dumping laws for businesses and large property owners |
| 4 | Rely primarily on enforcement of anti-littering and property maintenance laws; hold residents and businesses responsible |
| 5 | Privatize sanitation services and require residents and businesses to contract for cleanup directly |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotency | Custom existence check before INSERT | `ON CONFLICT DO NOTHING` | PostgreSQL handles atomically |
| Topic UUID lookup for stances | Hardcoded UUID constants in migration | Subquery `SELECT id FROM inform.compass_topics WHERE topic_key = '...' AND is_live = true` | UUIDs generated at runtime; phase 24 uses same pattern |
| Stance content formatting | Custom TEXT escaping | PostgreSQL `$$...$` dollar quoting or standard `''` escaping | Single-quotes in content must be escaped as `''` |

## Common Pitfalls

### Pitfall 1: Including `is_active` in INSERT
**What goes wrong:** PostgreSQL error: "column is_active can only be updated to DEFAULT"
**Why it happens:** `is_active` is `GENERATED ALWAYS AS (is_live) STORED` — it cannot be set manually
**How to avoid:** Never include `is_active` in any INSERT or UPDATE statement
**Warning signs:** "cannot INSERT into a generated column" or "cannot UPDATE a generated column"

### Pitfall 2: Wrong role_scope values
**What goes wrong:** CHECK constraint violation: `chk_role_scope_tier` (migration 059)
**Why it happens:** The original schema comment listed `'city_council', 'state_legislature', etc.` — those were the original planned values, never used in data
**How to avoid:** Only use `'local'`, `'state'`, `'federal'` (all lowercase)
**Warning signs:** Any insert into `compass_topic_roles` that fails with check constraint error

### Pitfall 3: Unescaped single quotes in content
**What goes wrong:** SQL syntax error mid-migration
**Why it happens:** Stance descriptions and perspectives contain contractions and possessives
**How to avoid:** Use `''` (double single-quote) to escape single quotes, or use dollar-quoting for long text blocks. Example: `'it''s'`, `'city''s'`
**Warning signs:** Migration fails on a content INSERT with a confusing syntax error pointing to the middle of a stance string

### Pitfall 4: `homelessness-response` colliding with existing `homelessness` topic
**What goes wrong:** Would only happen if someone mistakenly used `'homelessness'` as the new topic_key
**Why it happens:** The existing "Criminalization of Homelessness" topic has `topic_key = 'homelessness'`
**How to avoid:** Use `'homelessness-response'` as documented above — these are distinct topics per Phase 22 audit decision
**Warning signs:** ON CONFLICT on the live-topic-key partial unique index

### Pitfall 5: Missing `went_live_at` for live topics
**What goes wrong:** Phase 7 lapse cron cannot compute the 30-day calibration lapse window for these topics
**Why it happens:** The column defaults to NULL (correct for topics staged before going live), but since these insert as `is_live = true`, `went_live_at` should also be set
**How to avoid:** Include `went_live_at = now()` in every topic INSERT where `is_live = true`

## fc_community_slug Note

`inform.compass_topics` has an `fc_community_slug` column (TEXT nullable). The backend's `getCompassTopics()` selects it and returns it to the frontend. For Phase 23 topics, leave it NULL — it gets populated when the FC community is created in Phase 24. The column is nullable; NULL is the correct value for a topic with no companion FC community yet.

## Code Examples

### Full Topic INSERT (verified schema)

```sql
-- Source: C:\EV-Accounts\backend\migrations\029_compass_admin_rpcs.sql
-- and C:\EV-Accounts\supabase\migrations\20260226000015_inform_schema.sql
INSERT INTO inform.compass_topics
  (id, topic_key, title, short_title, question_text, is_live, went_live_at)
VALUES
  (gen_random_uuid(),
   'residential-zoning',
   'Residential Zoning',
   'Residential Zoning',
   'What should guide decisions about housing density and neighborhood character in your city?',
   true,
   now())
ON CONFLICT DO NOTHING;
```

### Stance INSERT with all 4 content fields

```sql
-- Source: C:\Focused Communities\supabase\migrations\20260416232741_phase4_5_stance_schema.sql
-- (schema) + C:\Focused Communities\supabase\migrations\20260416074245_phase3_schema_gaps.sql
INSERT INTO inform.compass_stances
  (topic_id, value, text, description, supporting_points, example_perspectives)
SELECT
  t.id,
  1,
  'Protect existing neighborhood character strictly; require community votes before any rezoning',
  'This stance holds that neighborhoods have a right to shape their own character through democratic processes. Zoning changes affect property values, density, traffic, and the character of daily life — decisions that residents should control directly rather than having imposed by developers or city planners. Requiring community votes before rezoning ensures that those who live in a neighborhood have the final word on what gets built there.',
  ARRAY[
    'Neighborhood character and cohesion are built over decades and are difficult to restore once disrupted by rapid density changes.',
    'Democratic accountability: residents bear the consequences of zoning decisions and should have direct input through votes.',
    'Infrastructure and services (schools, roads, utilities) need time to scale with population — community votes allow that pacing.'
  ],
  ARRAY[
    'A longtime homeowner in a single-family neighborhood who has watched nearby areas transform rapidly may see community vote requirements as the only check on developer-driven change.',
    'A resident in a city where city council decisions have routinely overridden neighborhood preferences may see direct democracy as a necessary corrective.',
    'A parent concerned about school overcrowding from rapid population growth may see growth controls as protecting quality of life for existing residents.'
  ]
FROM inform.compass_topics t
WHERE t.topic_key = 'residential-zoning' AND t.is_live = true
ON CONFLICT (topic_id, value) DO NOTHING;
```

### compass_topic_roles INSERT (LOCAL only)

```sql
-- Source: C:\EV-Accounts\backend\migrations\063_abortion_local_tier_flag.sql
INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, 'local', true
FROM inform.compass_topics t
WHERE t.topic_key = 'residential-zoning' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;
```

### compass_topic_roles INSERT (LOCAL + STATE)

```sql
-- For topics that get both scopes
INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, scope.role_scope, true
FROM inform.compass_topics t
CROSS JOIN (VALUES ('local'), ('state')) AS scope(role_scope)
WHERE t.topic_key = 'growth-and-development' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;
```

## State of the Art

| Old Pattern | Current Pattern | Source |
|-------------|-----------------|--------|
| role_scope 'city_council' etc | role_scope 'local'/'state'/'federal' | Migration 059 CHECK constraint |
| description/example_perspectives nullable | Always authored for Phase 4.5+ topics | Phase 4.5 seed migrations |
| topic_key auto-derived from short_title | Explicit topic_key in INSERT | Migration 055 trigger (still works if explicit) |

## Open Questions

1. **`description` field: authored content to be reviewed before migration runs**
   - What we know: The `description` column is nullable in the schema but should be authored. The CONTEXT.md decision says Claude generates and user reviews.
   - What's unclear: The planner needs to schedule a task where Claude drafts all 50 descriptions + supporting_points + example_perspectives, user reviews, then migration is finalized.
   - Recommendation: Plan tasks as (a) draft content, (b) user review checkpoint, (c) write migration file, (d) apply migration.

2. **`title` vs `short_title`: are they the same for these topics?**
   - What we know: Existing LOCAL topics like "Jail Capacity and Incarceration Alternatives" use a longer title and shorter short_title. "Criminalization of Homelessness" likely uses the same string for both.
   - What's unclear: Whether any of the 10 new topics should have a shorter short_title than title.
   - Recommendation: Use the same string for both `title` and `short_title` for all 10 new topics. The names are already reasonably short (longest is "Environmental Protection vs. Development"). The planner may want to confirm with user.

3. **`fc_community_slug` — not needed in Phase 23**
   - What we know: Phase 24 creates the FC communities and will set this column. Phase 23 leaves it NULL.
   - What's unclear: Whether Phase 24 sets this via UPDATE on compass_topics or some other mechanism.
   - Recommendation: Leave NULL in Phase 23; note for Phase 24 planner that the UPDATE pattern will be needed.

## Sources

### Primary (HIGH confidence)
- `C:\EV-Accounts\supabase\migrations\20260226000015_inform_schema.sql` — full inform schema including CREATE TABLE statements for compass_topics, compass_stances, compass_topic_roles
- `C:\EV-Accounts\backend\migrations\059_topic_scoping_foundation.sql` — CHECK constraint on role_scope IN ('federal', 'state', 'local')
- `C:\EV-Accounts\backend\src\lib\compassService.ts` — how is_required is used in completeness scoring; what role_scope values mean at runtime
- `C:\EV-Accounts\backend\migrations\025_rpc_pool_migration.sql` — get_compass_completeness RPC: is_required=true filter
- `C:\EV-Accounts\backend\migrations\029_compass_admin_rpcs.sql` — INSERT pattern for compass_topics (is_active exclusion)
- `C:\EV-Accounts\backend\migrations\055_compass_topic_key.sql` — topic_key column: derive_topic_key trigger, UNIQUE partial index
- `C:\EV-Accounts\backend\migrations\063_abortion_local_tier_flag.sql` — compass_topic_roles INSERT pattern
- `C:\Transparent Motivations\essentials\.planning\STATE.md` — Phase 22 AUDIT-01 findings confirming scope mechanism; existing topic_key for homelessness
- `C:\Transparent Motivations\essentials\.planning\phases\18-compass-stances\LOCAL-COMPASS-QUESTIONS-PROPOSED.md` — approved question texts and stance labels

### Secondary (HIGH confidence, cross-verified)
- `C:\Focused Communities\supabase\migrations\` — all 10 files; confirms Focused Communities project directly targets inform schema; confirms timestamp-based naming convention

## Metadata

**Confidence breakdown:**
- Schema structure: HIGH — read directly from CREATE TABLE migrations
- role_scope values: HIGH — verified CHECK constraint in migration 059 + compassService.ts runtime usage
- is_required semantics: HIGH — read directly from get_compass_completeness RPC and compassService.ts
- topic_key naming: HIGH — derive_topic_key trigger pattern verified + existing keys confirmed from STATE.md audit
- Migration numbering: HIGH — directly listed Focused Communities migrations dir
- Question texts and stance labels: HIGH — verbatim from approved LOCAL-COMPASS-QUESTIONS-PROPOSED.md
- Stance content (description, supporting_points, example_perspectives): NOT YET AUTHORED — this is Claude's discretion work, to be done in the planning phase

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (schema is stable; inform schema changes rarely)

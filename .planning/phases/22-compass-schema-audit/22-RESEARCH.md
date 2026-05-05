# Phase 22: Compass Schema Audit — Research

**Researched:** 2026-05-04
**Domain:** `inform.compass_stances` schema, scope filtering mechanism, topic retirement
**Confidence:** HIGH — all findings from live database queries and source code inspection

---

## Summary

Phase 22 is a pure audit phase. All three audit questions were resolved definitively via live
database queries and source code inspection. No migrations or code changes are needed for this
phase — the output is documentation and a retirement decision.

**Finding 1 — Scope column:** `inform.compass_stances` has NO scope/level/race_type column. The
scope mechanism lives entirely in a separate table: `inform.compass_topic_roles`. The service
layer (`compassService.ts`) converts those rows into three boolean flags (`applies_federal`,
`applies_state`, `applies_local`) at query time. Topics with no rows in `compass_topic_roles`
default to all three tiers = true (cross-cutting behavior).

**Finding 2 — Criminalization of Homelessness answer count:** 42 politician answers exist for
topic_id `4938766b-b45a-46e3-93bd-b8b30651271a`. The data is active, diverse (values 1–5), and
spans real politicians including LA council members, CA statewide officials, and Indiana politicians.

**Finding 3 — Retirement decision:** With 42 answers, the topic is NOT a candidate for retirement.
The decision is **"keep both"** — keep "Criminalization of Homelessness" active and add the new
"Homelessness Response" topic (Phase 23) as a companion question with a distinct framing (service
strategy vs. enforcement approach).

**Primary recommendation:** Document all three findings in STATE.md. Phase 22 produces zero
database changes.

---

## AUDIT-01: Scope/Level Mechanism in `inform.compass_stances`

### Confirmed: No Scope Column on `compass_stances`

Live `\d inform.compass_stances` result:

```
Column               | Type     | Notes
---------------------|----------|---------------------------
id                   | uuid     | PK
topic_id             | uuid     | FK → inform.compass_topics
value                | integer  | 1–5, UNIQUE per topic
text                 | text     | stance label
supporting_points    | text[]   | NOT NULL DEFAULT '{}'
description          | text     | nullable
example_perspectives | text[]   | NOT NULL DEFAULT '{}'
```

**There is no `scope`, `level`, `race_type`, or any similar column on `inform.compass_stances`.**
The stances table holds only the text content of the five stances per topic.

### Where Scope Lives: `inform.compass_topic_roles`

Scope filtering is on `inform.compass_topics` (via `compass_topic_roles`), not on
`compass_stances`. The mechanism:

1. **`inform.compass_topic_roles`** — join table with `(topic_id UUID, role_scope TEXT,
   is_required BOOLEAN)`. Valid `role_scope` values: `'federal'`, `'state'`, `'local'`.
   Constrained by `CHECK (role_scope IN ('federal', 'state', 'local'))` (migration 059).

2. **`inform.compass_topics.office_scope`** — a `TEXT[]` column added in migration 059.
   Documented as "optional metadata for topics primarily relevant to specific office types."
   Informational only — never used as a render filter per migration comments. Currently NULL
   for all 26 live topics (confirmed via live query).

3. **`inform.compass_topics.fc_community_slug`** — links a topic to its Focused Communities
   companion (`connect.communities.slug`). No filtering role.

### How the Service Converts Rows to Booleans

From `compassService.ts` `getCompassTopics()`:

```typescript
const hasAnyRoleRows = topicRoles.length > 0;
const applies_federal = hasAnyRoleRows
  ? topicRoles.some(r => r.role_scope === 'federal')
  : true;
const applies_state = hasAnyRoleRows
  ? topicRoles.some(r => r.role_scope === 'state')
  : true;
const applies_local = hasAnyRoleRows
  ? topicRoles.some(r => r.role_scope === 'local')
  : true;
```

**Topics with zero `compass_topic_roles` rows default to all three tiers = true (cross-cutting).**
This is the current behavior for six topics: Affordable Housing, AI Oversight, Deportation
Priorities, Healthcare Access, Immigration and Treatment, Taxation and Public Spending.

### Current Scope State of All Live Topics (Live Query Result)

| Topic | tier_roles rows | Effective Tiers |
|-------|-----------------|-----------------|
| Affordable Housing | 0 | all (cross-cutting) |
| AI Oversight | 0 | all (cross-cutting) |
| Campaign Finance Reform | 3 | federal, state, local |
| Childcare Affordability & Access | 3 | federal, state, local |
| Civil Rights and Social Justice | 3 | federal, state, local |
| Climate Change and Environmental Protection | 3 | federal, state, local |
| **Criminalization of Homelessness** | **3** | **federal, state, local** |
| Data Center Development & Energy Costs | 3 | federal, state, local |
| Deportation Priorities | 0 | all (cross-cutting) |
| Fossil Fuel Policy | 3 | federal, state, local |
| Healthcare Access | 0 | all (cross-cutting) |
| Immigration and Treatment of Immigrants | 0 | all (cross-cutting) |
| **Jail Capacity and Incarceration Alternatives** | **2** | **state, local** |
| Medicare / Medicaid | 2 | federal, state |
| Misinformation and Algorithms | 2 | federal, state |
| Religious Freedom | 3 | federal, state, local |
| Reproductive Rights and Abortion Access | 3 | federal, state, local |
| Same-Sex Marriage | 2 | federal, state |
| School Vouchers & Public Education Funding | 2 | federal, state |
| Social Security | 1 | federal |
| State Redistricting | 2 | federal, state |
| Taxation and Public Spending | 0 | all (cross-cutting) |
| Transgender Athletes | 3 | federal, state, local |
| Ukraine - Russia Conflict | 1 | federal |
| United States Tariff Policy | 1 | federal |
| Voting Rights and Electoral Integrity | 3 | federal, state, local |

### Where Filtering Actually Happens

The boolean flags (`applies_federal`, `applies_state`, `applies_local`) are returned from the API
in the `/compass/topics` response. The frontend (`src/lib/compass.js`) does not apply any
tier-based filtering. The flags are present in the topic objects the API returns, but the
essentials frontend does not currently use them to filter the displayed topic list.

**Implication:** Scope filtering is backend data, not currently enforced in essentials UI rendering.
The flags are available for future use.

---

## AUDIT-02: "Criminalization of Homelessness" Answer Count

### Topic Identity (Confirmed via Live Query)

| Field | Value |
|-------|-------|
| `id` | `4938766b-b45a-46e3-93bd-b8b30651271a` |
| `topic_key` | `homelessness` |
| `title` | `Criminalization of Homelessness` |
| `is_live` | `true` |
| `fc_community_slug` | `criminalization-of-homelessness` |
| `office_scope` | `NULL` |
| tier roles | federal, state, local (3 rows) |

### Politician Answer Count: **42**

Live query `SELECT COUNT(*) FROM inform.politician_answers WHERE topic_id = '4938766b-b45a-46e3-93bd-b8b30651271a'` returned **42 rows**.

Full list of politicians with answers (all verified to have `full_name` in `essentials.politicians`):

Adam B. Schiff (2.0), Adrin Nazarian (2.0), Alex Padilla (2.0), Bob Blumenfield (3.0),
Bradley Meyer (2.0), David G Henry (2.0), Eleni Kounalakis (3.0), Erin Houchin (4.0),
Eunisses Hernandez (2.0), Gavin Newsom (3.0), Heather Hutt (2.0), Holly J. Mitchell (2.0),
Hugo Soto-Martinez (2.0), Imelda Padilla (3.0), Isaac G. Bryan (2.0), John Lee (4.0),
Karen Ruth Bass (2.0), Kathryn Barger (3.0), Kelly Gonez (2.0), Kerry Thomson (2.0),
Lilliana Young (1.0), Lindsey P. Horvath (2.0), Lola Smallwood-Cuevas (2.0),
Malia M. Cohen (3.0), Marqueece Harris-Dawson (2.0), Matt Pierce (1.0), Micah Beckwith (5.0),
Nathan Hochman (4.0), Nithya Raman (2.0), Ricardo Lara (2.0), Rob Bonta (2.0),
Robert Luna (2.0), Shelli Yoder (2.0), Tanya Ortiz Franklin (2.0), Ted W. Lieu (2.0),
Tim McOsker (2.0), Timothy Peck (2.0), Tony Thurmond (2.0), Tony Vazquez (2.0),
Traci Park (4.0), Trent Deckard (2.0), Ysabel J. Jurado (2.0)

**Distribution:** 3× value=1, 27× value=2, 6× value=3, 4× value=4, 1× value=5 — full range
represented, meaningful data.

### Topic Rewrite Table Check

`SELECT * FROM inform.topic_rewrites WHERE old_topic_id = '4938766b...' OR new_topic_id = '4938766b...'`
returned **0 rows**. No active or historical rewrite exists for this topic.

### Companion Community Status

A `connect.communities` row exists:
- `slug`: `criminalization-of-homelessness`
- `member_count`: 0
- `thread_count`: 0
- `slug_history`: `{}`

The community is empty (no members, no threads) but the row exists and links to the topic.

---

## RETIRE-01: Retirement Decision

**Decision: KEEP BOTH**

**Reasoning:** 42 politician answers for "Criminalization of Homelessness" is substantial data.
The value distribution (1–5) is diverse and meaningful. Retiring this topic would orphan all 42
`politician_answers` rows (they would remain in the DB but become invisible to users since the
topic is filtered by `is_live = true`). More importantly, this topic captures a genuinely different
question than the proposed "Homelessness Response" (Phase 23 TOPIC-04):

- "Criminalization of Homelessness" = should sleeping in public spaces be criminalized?
  (rights/enforcement frame)
- "Homelessness Response" = what is the primary strategy for addressing homelessness?
  (service delivery frame)

These are complementary, not duplicative. Both should be live. No retirement is warranted.

**What retirement would require (documented for future reference):**
- `UPDATE inform.compass_topics SET is_live = false WHERE id = '4938766b...'` — hides from users
- No `topic_rewrites` row needed (no FK restriction; rewrites only needed when replacing with
  a successor)
- The `connect.communities` row at `criminalization-of-homelessness` would need no change for
  retirement (no members, no threads, FK constraint on communities is NO ACTION not RESTRICT)
- `slug_history` column exists on `connect.communities` but is an array on the row itself, not
  a separate table (ROADMAP.md had this wrong)

---

## Architecture Patterns

### Scope/Level: Always Use `compass_topic_roles`, Never `compass_stances`

When Phase 23 adds new LOCAL topics, scope is set by inserting rows into
`inform.compass_topic_roles`, not by modifying `compass_stances`. Pattern from migration 063:

```sql
INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
SELECT t.id, 'local', true
FROM inform.compass_topics t
WHERE t.topic_key = 'new-topic-key' AND t.is_live = true
ON CONFLICT (topic_id, role_scope) DO NOTHING;
```

For a strictly-LOCAL topic, insert only the `'local'` row. The service layer will then return
`applies_federal = false, applies_state = false, applies_local = true`.

### Topic Retirement Pattern (for reference)

Retirement = set `is_live = false` on the topic. The `topic_rewrites` workflow (migration 061)
is only needed when one topic is being *replaced* by another (old topic stays as audit record,
new topic goes live). Pure retirement of a topic with no successor needs only:

```sql
UPDATE inform.compass_topics SET is_live = false WHERE id = '<topic_id>';
```

No `topic_rewrites` entry is needed for pure retirement. The `ON DELETE RESTRICT` FK on
`topic_rewrites` only prevents *deleting* a topic that is referenced in a rewrite — it does not
prevent setting `is_live = false`.

---

## Common Pitfalls

### Pitfall 1: Looking for Scope on `compass_stances`
**What goes wrong:** Developer looks at `compass_stances` for a scope column, finds none, assumes
scope filtering doesn't exist.
**Reality:** Scope is on `compass_topics` via `compass_topic_roles`. Always check both tables.

### Pitfall 2: Assuming Cross-Cutting Topics Have Rows
**What goes wrong:** Developer assumes every topic has `compass_topic_roles` rows.
**Reality:** Six live topics have zero rows and default to all-three-tiers-true. Adding rows would
*restrict* them from cross-cutting to specific tiers.

### Pitfall 3: Confusing `slug_history` Location
**What goes wrong:** ROADMAP.md references a `slug_history` table. No such table exists.
**Reality:** `slug_history` is a `TEXT[]` column on the `connect.communities` row itself.
Archiving a slug means pushing to that array via `array_append`.

### Pitfall 4: `office_scope` vs `compass_topic_roles`
**What goes wrong:** Developer uses `office_scope` column on `compass_topics` for filtering.
**Reality:** `office_scope` is informational metadata only (migration 059 comment: "never used
as a render filter"). All current live topics have `office_scope = NULL`. Tier filtering uses
`compass_topic_roles` rows exclusively.

---

## Code Examples

### Query: Count Answers for a Topic (Verified Live)

```sql
-- Count politician answers for a topic by UUID
SELECT COUNT(*)
FROM inform.politician_answers
WHERE topic_id = '4938766b-b45a-46e3-93bd-b8b30651271a';
-- Returns: 42

-- Count by name join
SELECT COUNT(*) AS answer_count
FROM inform.politician_answers pa
JOIN inform.compass_topics ct ON ct.id = pa.topic_id
WHERE ct.title ILIKE '%homelessness%' AND ct.is_live = true;
```

### Query: Inspect All Topic Scope Assignments (Verified Live)

```sql
SELECT ct.topic_key, ct.title, COUNT(tr.topic_id) as role_row_count,
       string_agg(tr.role_scope, ', ') AS roles
FROM inform.compass_topics ct
LEFT JOIN inform.compass_topic_roles tr ON tr.topic_id = ct.id
WHERE ct.is_live = true
GROUP BY ct.id, ct.topic_key, ct.title
ORDER BY ct.title;
```

### Add LOCAL Scope to a New Topic

```sql
-- After creating the topic, add local-only scope
INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required)
VALUES ('<new_topic_uuid>', 'local', true)
ON CONFLICT (topic_id, role_scope) DO NOTHING;
```

---

## State of the Art

| Assumption | Actual State | Impact |
|------------|--------------|--------|
| `compass_stances` has scope column | No scope column exists | Phase 23 uses `compass_topic_roles` |
| Scope is frontend filter | Scope is backend data; frontend doesn't filter | No frontend work needed in Phase 22 |
| `slug_history` is a table | It's a `TEXT[]` column on `connect.communities` | Retirement doesn't need a new table |
| Homelessness topic has no data | 42 politician answers | Retire decision = "keep both" |

---

## Open Questions

None — all three audit questions were fully resolved via live queries.

---

## Sources

### Primary (HIGH confidence)

- Live Supabase database (`postgresql://...pooler.supabase.com:5432/postgres`)
  - `\d inform.compass_stances` — confirmed no scope column
  - `SELECT column_name FROM information_schema.columns WHERE table_schema='inform' AND table_name='compass_topics'` — confirmed `office_scope` column
  - `SELECT COUNT(*) FROM inform.politician_answers WHERE topic_id = '4938766b...'` — 42 answers
  - `SELECT * FROM inform.topic_rewrites WHERE ...` — 0 rows for homelessness
  - Full live tier roles query — all 26 topics' scope state confirmed
- `C:\EV-Accounts\backend\src\lib\compassService.ts` — scope filtering logic in `getCompassTopics()`
- `C:\EV-Accounts\backend\migrations\026_inform_schema_repair_and_candidates.sql` — original schema
- `C:\EV-Accounts\backend\migrations\059_topic_scoping_foundation.sql` — `office_scope` column, `compass_topic_roles` constraints
- `C:\EV-Accounts\backend\migrations\061_topic_rewrite_workflow.sql` — `topic_rewrites` table, FK RESTRICT behavior
- `C:\EV-Accounts\backend\migrations\063_abortion_local_tier_flag.sql` — canonical pattern for adding scope rows

### Secondary (MEDIUM confidence)

- `C:\Transparent Motivations\essentials\.planning\phases\18-compass-stances\LOCAL-COMPASS-QUESTIONS-PROPOSED.md` — topic inventory with scope annotations
- `C:\Transparent Motivations\essentials\.planning\REQUIREMENTS.md` — RETIRE-02 confirms `slug_history` column exists on communities

---

## Metadata

**Confidence breakdown:**
- Schema audit (AUDIT-01): HIGH — confirmed via live `information_schema` query + code inspection
- Answer count (AUDIT-02): HIGH — confirmed via live `COUNT(*)` query
- Retirement decision (RETIRE-01): HIGH — based on confirmed 42-answer count + topic comparison
- Retirement mechanics: HIGH — confirmed via `topic_rewrites` FK inspection + communities row check

**Research date:** 2026-05-04
**Valid until:** 90 days (schema structure; live data counts may change as ingestion continues)

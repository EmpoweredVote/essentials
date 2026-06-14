# Schema Retro — Problem Document

**Purpose:** This document is for Opus to conduct a thorough retro of the `essentials` schema. It catalogs known confusion points, naming landmines, and data inconsistencies discovered during a 2026-06-13 audit. The goal is to surface what else we're missing and propose a cleaner, more recallable mental model.

---

## 1. The Two "Government" Tables Problem

The most dangerous confusion in this schema: there are **two tables** that sound like the same thing.

### `essentials.government_bodies`
- **What it is:** A legacy/UI-facing table used by the browse sidebar and Treasury Tracker slug-matching.
- **Rows:** ~451 (CA: 195, IN: 253, MA: 2, US: 1)
- **State casing:** uppercase (`'MA'`, `'CA'`)
- **Key columns:** `id, state, geo_id, body_key, display_name, website_url`
- **Backend usage:** NOT queried by `getPoliticiansByGovernmentList` or any browse service. Likely used only for the sidebar area listings and Treasury linking.

### `essentials.governments`
- **What it is:** The live operational table. Every politician's chain goes: `governments → chambers → offices → politicians`.
- **Rows:** Thousands, covering all 50 states + DC + US federal
- **State casing:** Mostly uppercase, but **UT has a bug: 37 rows use `'ut'` (lowercase) and 1 uses `'UT'`**
- **Key columns:** `id, name, type, geo_id, state` (plus others)
- **Backend usage:** This is the authoritative source. All browse endpoints, politician queries, and elections data join through here.

**The failure mode:** Any agent or developer who queries `government_bodies` for politician counts will get near-zero results and conclude the state is unloaded. This burned an entire Explore agent run that reported "zero MA officials" when 300+ exist.

**Recommended retro question:** Should `government_bodies` be dropped, renamed to `legacy_government_bodies`, or merged into `governments`? What does it do that `governments` doesn't?

---

## 2. Schema Namespace — `essentials` vs `public`

- **All civic data** lives in the `essentials` schema (not `public`).
- The `public` schema holds accounts/social tables: `users`, `posts`, `follows`, `friendships`, etc.
- Queries without a schema prefix (e.g., `SELECT * FROM politicians`) hit `public` and fail or return wrong data.
- **Always prefix:** `essentials.governments`, `essentials.politicians`, etc.

**Retro question:** Is there a search_path set for the API user that defaults to `essentials`? If so, why does the mcp__supabase-local tool not inherit it?

---

## 3. The `offices` Join Direction

Old migrations sometimes used `politicians.office_id` (politician holds one office FK). The current live schema is the **reverse**:

```
essentials.offices.politician_id → essentials.politicians.id
```

- `offices` has `politician_id` (UUID FK to politicians)
- `politicians` does **not** have an `office_id` column
- The chain is: `governments → chambers (government_id) → offices (chamber_id) → politicians (via offices.politician_id)`

Any query that tries `politicians JOIN offices ON offices.id = politicians.office_id` will fail with "column does not exist."

---

## 4. Headshots: Two Storage Patterns — `politician_images` is the LIVE one

**Confirmed 2026-06-14:** `politician_images` is the primary headshot store (3,124 rows). The direct columns on `politicians` are largely empty for local officials and should be treated as legacy/fallback.

### Pattern A — `essentials.politician_images` (LIVE, authoritative)
- Columns: `id, politician_id (uuid), url (text), type (text), photo_license, focal_point`
- `url` points to Supabase Storage: `https://<project>.storage.supabase.co/storage/v1/object/public/politician_photos/<uuid>-headshot.jpg`
- This is what the app actually displays. 3,124 rows as of 2026-06-14.
- **Any headshot audit must join through this table.**

### Pattern B — Direct columns on `politicians` (legacy/sparse)
- `politicians.photo_custom_url` — null for most local officials
- `politicians.photo_origin_url` — sometimes a source page URL (not an image URL)
- `politicians.photo_custom_url_manual_override` (boolean) — flags manual overrides
- The backend's `COALESCE(p.photo_custom_url, p.photo_origin_url, '')` in browse queries may be stale — need to verify if browse queries also JOIN `politician_images`.

**Critical audit note:** Any query checking `photo_custom_url IS NOT NULL` to assess headshot coverage is **wrong**. Must use `politician_images` join.

**Retro question:** Does the browse API (`getPoliticiansByGovernmentList`) JOIN `politician_images`? If not, how does the app show headshots from the results page? Is there a client-side fallback that fetches from `politician_images` separately?

---

## 5. State Casing Bug in `governments`

```sql
SELECT state, COUNT(*) FROM essentials.governments 
WHERE state IN ('ut', 'UT') GROUP BY state;
-- ut: 37 rows, UT: 1 row
```

Utah has 37 governments stored with `state = 'ut'` (lowercase) and 1 with `'UT'`. Any query filtering `WHERE state = 'UT'` misses 37 Utah governments. This is a silent data bug — queries return partial results without error.

**Retro question:** Are there other states with mixed casing? Should a DB constraint enforce `UPPER(state)` or a CHECK constraint be added?

---

## 6. The Three Stance/Compass Tables Problem

There are **three tables** that sound like they hold politician stance data, only one of which is live.

### `inform.politician_answers` — THE LIVE TABLE
- **This is where actual compass stances are stored and served.**
- `politician_id` (UUID, matches `essentials.politicians.id`)
- The backend's `getPoliticianAnswers()` reads from this table.
- The GET `/compass/politicians/:id/answers` endpoint queries here.
- **698+ records across IN, CA, MA, and federal politicians.**
- Michelle Wu has **27 answers** here. Boston all 14/14 have stances. Worcester 11/11. MA state leg 202/204.

### `inform.compass_stances` — Related source/evidence table
- Stores evidence/source text for stances (the "reasoning" layer).
- Admin routes delete from here when replacing stances.
- Distinct from `politician_answers` — the answer (numeric value) vs the evidence.

### `essentials.politician_stances` — LEGACY / DIFFERENT PURPOSE
- Only 399 rows, mostly for older IN/LA data.
- NOT queried by any live compass endpoint.
- May be from a pre-`inform` era ingestion pipeline. Likely dead or deprecated.

### `compass.answers` / `compass.contexts` — DIFFERENT SYSTEM
- The `compass` schema appears to be for USER compass answers (not politician stances).
- `compass.answers.politician_id` holds some politician UUIDs but is not the primary stance store.

**Critical audit note:** Any query against `essentials.politician_stances` or `compass.answers` for MA politicians will return misleading zeros. The correct table is `inform.politician_answers`.

**The full `inform` schema** (20 tables) is the live compass engine:
`compass_categories, compass_change_history, compass_lens_topics, compass_lenses, compass_responses, compass_stances, compass_topic_categories, compass_topic_roles, compass_topics, compass_verdicts, district_boundaries, inform_profiles, politician_answers, politician_context, politician_context_evidence, politicians, stance_research_review, topic_rewrite_stance_proposals, topic_rewrites, yellow_gem_events`

Note: `inform.politicians` is a SEPARATE politicians table from `essentials.politicians` — its relationship to the essentials table needs investigation.

**Retro question:** What does `inform.politicians` contain vs `essentials.politicians`? Are they synced? Is `inform.politicians.id` the same UUID as `essentials.politicians.id`?

---

## 7. MA Coverage Snapshot (as of 2026-06-14, fully corrected)

| Government | geo_id | Officials | Headshots | Stances |
|---|---|---|---|---|
| Commonwealth of Massachusetts (state leg) | 25 | 204 | 204/204 ✓ | 0 ✗ |
| City of Cambridge | 2511000 | 16 | 16/16 ✓ | 0 ✗ |
| City of Springfield | 2567000 | 14 | 14/14 ✓ | 0 ✗ |
| City of Boston | 2507000 | 14 | 14/14 ✓ | 0 ✗ |
| City of Worcester | 2582000 | 11 | 11/11 ✓ | 0 ✗ |
| City of Lowell | 2537000 | 12 | 11/12 — 1 missing | 0 ✗ |
| City of Brockton | 2509000 | 12 | 11/12 — 1 missing | 0 ✗ |
| Boston Public Schools | 2502790 | 7 | 7/7 ✓ | 0 ✗ |
| City of Quincy | 2555745 | 10 | **0/10 ✗** | 0 ✗ |

**Headshots are in great shape** — only Quincy is completely missing (10 officials), and Lowell/Brockton each have 1 gap.

**Stances source:** `inform.politician_answers` (not `essentials.politician_stances` or `compass.answers`).

---

## 8. Other States with Notable Data Gaps (from `governments` table)

For context on what exists vs what's deep vs shallow:

| State | Governments | Notes |
|---|---|---|
| CA | 193 | Deep — state leg + many cities |
| IN | 61 | Deep — Collin County pattern |
| TX | 31 | Collin County TX work done |
| ME | 29 | Elections loaded; officials coverage unknown |
| OR | 14 | Chambers seeded; officials coverage unknown |
| MA | 10 | 8 governments with officials |
| VA | 3 | Alexandria + state |
| MD | 3 | Unknown depth |
| All other states | 1 each | Only federal/state skeleton row |

---

## 9. Retro Questions for Opus

1. **`government_bodies` vs `governments`** — should one be dropped? What is `government_bodies` actually used for today?
2. **`politician_images`** — dead code, staging, or should it replace the direct columns?
3. **UT state casing bug** — how many other silent casing bugs exist? Should we add a CHECK constraint?
4. **`offices` join direction** — is there any remaining code that uses the old `politicians.office_id` pattern? Safe to confirm it's fully migrated?
5. **MA stances priority** — 204 state legislators vs 14 Boston officials — where do we start?
6. **Missing MA cities** — Worcester, Lowell, Brockton, Springfield, Quincy all have officials but zero headshots. What's the fastest path to coverage?
7. **Treasury Tracker linking** — the app auto-links via slug matching. Are any of the 8 MA governments already in Treasury Tracker's city list?

# Phase 97: MD Compass Stances — Executives + Senators (Wave 1) - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Research and ingest compass stances for all 5 MD constitutional officers + State Treasurer (Moore, Miller, Brown, Lierman, Davis) and all 47 MD state senators, one research agent at a time, all cited from public record. Produce four numbered SQL migrations (one per plan) applying to `inform.politician_answers` and `inform.politician_context`.

Out of scope:
- MD House delegates (Phase 98)
- v11.0 verification (Phase 99)
- UI changes

</domain>

<decisions>
## Implementation Decisions

### Executive Stances (Plan 97-01)

- **D-01:** Scope is all 5 MD executives — Governor Moore, LG Miller, AG Brown, Comptroller Lierman, and State Treasurer Davis (Davis is is_appointed_position=true but is seeded with a profile; compass coverage is valuable). The ROADMAP says "4 exec" but the user confirmed to include Davis.
- **D-02:** Start fresh — ignore `2026-06-06-md-officials.csv` entirely. Run full research for each exec one at a time, aiming for 15-20+ topics per politician. The existing CSV is sparse (3-8 topics per official) and has no politician_ids; fresh research produces better coverage.
- **D-03:** Exec research is one agent per politician (5 sequential runs). After all 5 are done, generate migration 282 via gen_migration.py and apply to production.

### Senator Research Batching (Plans 97-02 / 97-03 / 97-04)

- **D-04:** 47 senators split across 3 plans of ~15/16/16 senators each:
  - Plan 97-02: Senators batch A (~senators 1–15 by district order)
  - Plan 97-03: Senators batch B (~senators 16–31)
  - Plan 97-04: Senators batch C (~senators 32–47)
- **D-05:** Within each plan: one research agent per senator, sequential. Each plan's research is completed fully before the migration is generated.

### Migration Strategy

- **D-06:** Rolling migrations — one migration per plan:
  - Migration 282: executive stances (5 politicians) — applied after Plan 97-01 research completes
  - Migration 283: senators batch A (~15 senators) — applied after Plan 97-02 research completes
  - Migration 284: senators batch B (~16 senators) — applied after Plan 97-03 research completes
  - Migration 285: senators batch C (~16 senators) — applied after Plan 97-04 research completes
- **D-07:** Each migration is generated via `gen_migration.py` (in `C:/EV-Accounts/backend/data/stance-research/`). The candidate_inventory list must be updated for each batch. Applied via `mcp__supabase-local__apply_migration`.

### Topic Scope for MD Officials

- **D-08:** MD state senators and constitutional officers use federal/state topic scope: all compass topics EXCEPT `data-centers`, `local-immigration`, `transportation-priorities` (EXCLUDED_TOPICS_FEDERAL from gen_migration.py). Researchers aim for 15-20+ covered topics per politician using evidence-only stances.
- **D-09:** Not-found senators (no discoverable public stance on any topic) are documented as `-- NOTE: No stances found in CSV for {name}` within the generated migration SQL. No separate log file is required.

### Claude's Discretion

- **Politician IDs for execs:** Researcher queries `SELECT id, first_name, last_name FROM essentials.politicians WHERE last_name IN ('Moore','Miller','Brown','Lierman','Davis') AND external_id BETWEEN -92000000 AND -90000000 OR office_id IN (...)` — or look up by government + office. Exact query is researcher's call.
- **Senator district ordering:** Researcher determines batch split order (districts 1–15 / 16–31 / 32–47 approximately) by querying `SELECT d.name, d.geo_id, p.id, p.full_name FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id = p.id JOIN essentials.districts d ON d.id = o.district_id WHERE d.district_type = 'STATE_UPPER' AND d.state = 'md' ORDER BY d.name`. Exact cutpoints are researcher's call.
- **Source strategy for MD senators:** Primary sources are mgaleg.maryland.gov (voting record), ballotpedia.org, and ontheissues.org. For senators with minimal online presence, fewer stances are acceptable — cite what exists; don't fabricate.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — MD-STANCES-01 (exec stances), MD-STANCES-02 (senator stances); Phase 97 success criteria
- `.planning/ROADMAP.md` §Phase 97 — 4 success criteria; note D-01 override (Davis included as 5th exec)

### Stance Research Tooling
- `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` — canonical migration generator; `generate_migration()` function signature + TOPIC_UUIDS map; EXCLUDED_TOPICS_FEDERAL set; candidate_inventory list format
- `C:/EV-Accounts/backend/data/stance-research/compass-topics-reference.md` — all 44 live compass topics with question + 5 answer options; use to build research agent prompts
- `C:/EV-Accounts/backend/data/stance-research/2026-06-06-md-officials.csv` — IGNORE for stance data (sparse, no politician_ids); may be useful to cross-check that researched topics aren't redundant

### Closest Migration Templates (exec stances)
- `C:/EV-Accounts/backend/migrations/216_sf_officials_stances.sql` — SF 20 officials stances migration (gen_migration.py output); shows per-candidate block structure + ON CONFLICT DO UPDATE pattern on both `inform.politician_answers` and `inform.politician_context`
- Migration 282 (target): exec stances — follow gen_migration.py output structure; `ON CONFLICT (politician_id, topic_id) DO UPDATE` on both tables

### Closest Migration Templates (senator stances)
- `C:/EV-Accounts/backend/migrations/` — OR legislature stances approach: individual apply scripts per senator; but MD will use gen_migration.py batch approach instead for cleaner migration history
- Migrations 283/284/285: senator batches A/B/C

### DB Schema
- `inform.politician_answers` — `UNIQUE (politician_id, topic_id)`; `value` is integer 1-5
- `inform.politician_context` — `UNIQUE (politician_id, topic_id)`; `reasoning` TEXT, `sources` TEXT[]
- `essentials.politicians` — look up `id` by name + district for politician_ids

### Existing Apply Script Reference (CSV format)
- `C:/EV-Accounts/backend/scripts/apply-tina-kotek-stances.ts` — shows how older CSV format (politician_id + topic_id inline) was applied; MD uses gen_migration.py path instead (full_name + topic_key columns)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `gen_migration.py` in `C:/EV-Accounts/backend/data/stance-research/` — key tool; must be updated with MD exec/senator candidate_inventory lists before running; TOPIC_UUIDS dict is current and correct
- `generate_md_senate.ps1` — already exists in `C:/EV-Accounts/backend/migrations/`; shows senator external_id pattern and district order that researcher can use to determine batch boundaries

### Established Patterns
- CSV format for gen_migration.py: `full_name,topic_key,value,reasoning,source_url_1,source_url_2,source_url_3` — no politician_id in CSV; politician_id comes from the candidate_inventory list passed to generate_migration()
- gen_migration.py `candidate_inventory` list format: list of `(full_name, politician_uuid)` tuples — researcher must query politician_ids from DB before running the generator
- Not-found documentation: gen_migration.py auto-inserts `-- NOTE: No stances found in CSV for {name} ({pid})` when a candidate has no CSV rows
- Evidence-only constraint: every row must have at least one non-null source_url; no stances without citation
- `apply_migration` via `mcp__supabase-local__apply_migration` — use after gen_migration.py produces the .sql file

### Integration Points
- `inform.politician_answers` + `inform.politician_context` — both tables write on every stance row; ON CONFLICT DO UPDATE for idempotency
- Compass UI reads from these tables via the politician profile API; stances will render automatically once migration is applied

</code_context>

<specifics>
## Specific Ideas

- User confirmed: include State Treasurer Dereck Davis as the 5th executive despite ROADMAP saying "4 exec"
- gen_migration.py needs a new MD exec section + 3 senator batch sections added to its `if __name__ == '__main__'` block before it can be used for this phase
- Each senator batch CSV file: one CSV per senator (named e.g. `2026-06-06-md-senator-NAME.csv`), then gen_migration.py bundles them for that batch's migration
- OR senate approach for reference: individual apply scripts per politician — MD uses gen_migration.py instead for cleaner bundled migration history
- Researcher should note district number in CSV filename for easy batch tracking (e.g., `2026-06-06-md-senator-d01-[lastname].csv`)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 97-MD Compass Stances — Executives + Senators (Wave 1)*
*Context gathered: 2026-06-06*

# Phase 98: MD Compass Stances — House Delegates (Wave 2) - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Research and ingest compass stances for all 141 MD house delegates, one agent at a time, all cited from public record. Produce 7 numbered SQL migrations (one per plan) applying to `inform.politician_answers` and `inform.politician_context`. Compass render verified on spot-checked delegate profiles (MD-STANCES-04 closes at end of final plan).

Out of scope:
- MD state senators (Phase 97 — complete)
- MD constitutional officers / State Treasurer (Phase 97 — complete)
- v11.0 verification and playbook retrospective (Phase 99)
- Any UI changes

</domain>

<decisions>
## Implementation Decisions

### Batch Plan Count

- **D-01:** 141 delegates split across **7 plans of ~20 delegates each**. This matches Phase 97's pace (~16 senators per plan) and keeps each plan's context manageable (~20 sequential research agents). Migration numbering starts at 286 and runs through 292.
- **D-02:** Batch boundaries should align with MD legislative district numbers (same district-range approach as Phase 97 senators: districts 1–N / N+1–M / …). Exact cutpoints are researcher's call after querying the DB.

### Migration Strategy

- **D-03:** Rolling migrations — one migration per plan:
  - Migration 286: delegates batch A (~20 delegates, districts 1–~7)
  - Migration 287: delegates batch B (~20 delegates)
  - Migration 288: delegates batch C (~20 delegates)
  - Migration 289: delegates batch D (~20 delegates)
  - Migration 290: delegates batch E (~20 delegates)
  - Migration 291: delegates batch F (~20 delegates)
  - Migration 292: delegates batch G (~20 delegates) + compass render verification
- **D-04:** Each migration generated via `gen_migration.py` (in `C:/EV-Accounts/backend/data/stance-research/`). Applied via `mcp__supabase-local__apply_migration`.

### Compass Verification (MD-STANCES-04)

- **D-05:** Embed verification in the **last batch plan (Plan 98-07)**. After migration 292 is applied, verify compass renders correctly on at least 3 senators (from Phase 97 data) + 3 delegates (from Phase 98 data). No separate verification plan needed.

### Topic Scope for Delegates

- **D-06:** Same as Phase 97 senators — EXCLUDED_TOPICS_FEDERAL applies: `data-centers`, `local-immigration`, `transportation-priorities` excluded. All other compass topics are in scope. Aim for 15-20+ covered topics per delegate using evidence-only stances.

### Inherited Rules (from Phase 97, no re-asking needed)

- **D-07:** One research agent per delegate, sequential. Never parallel.
- **D-08:** Evidence-only constraint — every stance row must have at least one non-null `source_url`.
- **D-09:** Not-found delegates documented as `-- NOTE: No stances found in CSV for {name} ({pid})` within the generated migration SQL.
- **D-10:** CSV format: `full_name,topic_key,value,reasoning,source_url_1,source_url_2,source_url_3` — no politician_id in CSV; politician_id comes from the candidate_inventory list in gen_migration.py.

### Claude's Discretion

- **Exact district-range batch boundaries:** Researcher queries `SELECT d.name, d.geo_id, p.id, p.full_name FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id = p.id JOIN essentials.districts d ON d.id = o.district_id WHERE d.district_type = 'STATE_LOWER' AND d.state = 'md' ORDER BY d.name` to determine batch boundaries. Splits should aim for ~20 delegates per plan.
- **A/B subdistrict handling:** Some MD districts have A/B subdistricts (e.g., 3A, 3B with 2 delegates each instead of 3). Researcher groups these within the same batch as their parent district number.
- **Primary sources for delegates:** mgaleg.maryland.gov (voting record), ballotpedia.org, ontheissues.org. For delegates with minimal online presence, fewer stances are acceptable — cite what exists; don't fabricate.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — MD-STANCES-03 (delegate stances), MD-STANCES-04 (compass render verification)
- `.planning/ROADMAP.md` §Phase 98 — 4 success criteria

### Stance Research Tooling
- `C:/EV-Accounts/backend/data/stance-research/gen_migration.py` — canonical migration generator; `generate_migration()` function signature + TOPIC_UUIDS map; EXCLUDED_TOPICS_FEDERAL set; candidate_inventory list format
- `C:/EV-Accounts/backend/data/stance-research/compass-topics-reference.md` — all 44 live compass topics with question + 5 answer options; use to build research agent prompts

### Phase 97 Context (Wave 1 — key reference for patterns)
- `.planning/phases/97-md-compass-stances-executives-senators-wave-1/97-CONTEXT.md` — full pattern documentation for gen_migration.py, CSV format, evidence-only constraint, not-found documentation, rolling migration approach

### Closest Migration Templates
- `C:/EV-Accounts/backend/migrations/216_sf_officials_stances.sql` — shows per-candidate block structure + ON CONFLICT DO UPDATE pattern on both `inform.politician_answers` and `inform.politician_context`
- Migrations 282–285 (Phase 97 output) — same structure; delegates use identical pattern

### DB Schema
- `inform.politician_answers` — `UNIQUE (politician_id, topic_id)`; `value` is integer 1-5
- `inform.politician_context` — `UNIQUE (politician_id, topic_id)`; `reasoning` TEXT, `sources` TEXT[]
- `essentials.politicians` — look up `id` by name + district for politician_ids; delegates have `district_type = 'STATE_LOWER'` and `d.state = 'md'`

### Delegate Roster Reference
- `C:/EV-Accounts/backend/migrations/` — `generate_md_house.ps1` shows the 141 delegate names, external_id pattern, and district order; use to verify batch coverage

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `gen_migration.py` in `C:/EV-Accounts/backend/data/stance-research/` — must be updated with 7 MD delegate batch sections in `if __name__ == '__main__'` block before running; TOPIC_UUIDS dict is current and correct
- `generate_md_house.ps1` — already exists in `C:/EV-Accounts/backend/migrations/`; shows 141 delegate names, external_id pattern, and district order for batch boundary planning

### Established Patterns
- CSV format for gen_migration.py: `full_name,topic_key,value,reasoning,source_url_1,source_url_2,source_url_3` — no politician_id in CSV
- gen_migration.py `candidate_inventory` list format: list of `(full_name, politician_uuid)` tuples — researcher must query politician_ids from DB before running
- One CSV file per delegate: named e.g. `2026-06-07-md-delegate-d01-[lastname].csv` (district number in filename for batch tracking)
- gen_migration.py groups by name-only (not (name, pid) tuple) — simplified CSV format; no politician_id column in CSV
- Not-found auto-comment inserted when candidate has no CSV rows
- A/B subdistrict delegates: district_type='STATE_LOWER' with district names like 'Maryland House District 3A'; researcher handles these within normal batch flow

### Integration Points
- `inform.politician_answers` + `inform.politician_context` — both tables write on every stance row; ON CONFLICT DO UPDATE for idempotency
- Compass UI reads from these tables via the politician profile API; stances render automatically once migration is applied
- `mcp__supabase-local__apply_migration` — used after gen_migration.py produces the .sql file; treats production DB as live (no dry-run)

</code_context>

<specifics>
## Specific Ideas

- Batch size of ~20 delegates per plan chosen to match Phase 97 pace; exact boundaries per district range are researcher's call
- Phase 97 migrations 282–285 already applied; next migration is 286; researcher confirms this before writing Plan 98-01
- Joseline Pena-Melnyk (HD-21, Speaker) has n-tilde: Peña-Melnyk — pena.jpg headshot pattern; politician_id already in DB (from Phase 93)
- Compound last name mgaleg lookup pattern established in Phase 97 (e.g., White Holland→white01, Fraser-Hidalgo→fraser01) — applies to delegate lookups too
- Compass verification at end of Plan 98-07: spot-check at least 3 senators from Phase 97 data + 3 delegates from Phase 98 data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 98-MD Compass Stances — House Delegates (Wave 2)*
*Context gathered: 2026-06-07*

# Phase 82: OR State Legislature Compass Stances - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Research and ingest compass stances (1–5 scale values) for all 90 OR state legislators — 30 senators (SD-01 through SD-30, external_ids -4110001 through -4110030) and 60 house representatives (HD-01 through HD-60, external_ids -4120001 through -4120060). This makes Oregon the first state in the app with full legislature-wide compass coverage.

**In scope:**
- All 30 OR state senators — stance research + ingestion (migration 242)
- All 60 OR house reps — stance research + ingestion (migration 243)
- Wave 3 verification: SQL coverage gates + spot-check compass render on 3 senator + 3 house rep profiles

**Out of scope:**
- OR constitutional officers, federal officials, Portland council — covered in Phase 80
- New state geofences, government body seeding, elections data — Phase 81 dependency satisfied
- Any frontend UI changes — compass renders automatically from existing politician_answers rows
- CA/ME/TX state legislature stances — explicitly deferred to future milestones

</domain>

<decisions>
## Implementation Decisions

### Source Strategy for OR State Legislators

- **D-01:** **Primary source**: OregonLegislature.gov bill/vote history — official public record; strongest verifiable evidence for compass positions; best for citation quality.
- **D-02:** **Secondary source**: Oregon Voter's Pamphlet (sos.oregon.gov) + Ballotpedia — Voter's Pamphlet is uniquely rich in OR (candidates write their own issue statements); Ballotpedia for structured profile summaries.
- **D-03:** **Tertiary source**: Campaign websites + local/regional news (OPB, The Oregonian) — only checked if primary and secondary yield nothing for a given topic.
- **D-04:** **Not-found**: If all three source tiers yield nothing for a legislator, document as not-found. Zero stances is acceptable and explicitly not a failure (same rule as all prior compass phases).

### Sub-Batch Structure

- **D-05:** Within plan 82-01 (senators) and plan 82-02 (house reps), group politicians into sub-batches of ~10.
- **D-06:** Per-person flow within a sub-batch: research agent → CSV rows produced → apply script run against production DB → move to next person. The live DB is updated per-person before proceeding. This makes the run resilient to mid-session interruption.
- **D-07:** Commit CSV data files and apply script artifacts after each group of ~10 completes.
- **D-08:** The single numbered SQL migration (242 for senators, 243 for house reps) is produced once at the very end of all sub-batches in that plan — one clean migration captures all stance values.

### Urban/Rural Coverage Calibration

- **D-09:** All 90 legislators are held to the same acceptance standard — sparse or zero stances is acceptable by design for any member. No tiered effort thresholds.
- **D-10:** Research brief must note the expected evidence asymmetry: Portland-metro and Willamette Valley legislators typically yield richer records; Eastern Oregon members often have sparser news trails and fewer documented positions on national compass topics. Researchers should not spend extra time trying to fill gaps for Eastern OR members — stop at tertiary sources and document not-found where evidence is absent.

### Carried Forward (Hard Constraints — Not Discussed, Already Locked)

- **D-11:** ONE-AT-A-TIME rule: each stance research agent must run sequentially. NEVER run parallel research agents. Hard rate-limit constraint established in Phase 18/46/70/80.
- **D-12:** Evidence-only: no stances without a verifiable, citable public record. No interpolation, no assumption from party affiliation.
- **D-13:** Value scale: 1=progressive, 5=conservative, integer values 1–5. Half-steps reserved for extreme edge cases only.
- **D-14:** Research ALL compass topics — not just local-scope ones. When research is scoped to local topics only, result is 6-7 stances per politician. Researching across all topics can yield 18-21+. Always attempt full topic coverage; record only what has evidence.
- **D-15:** Apply script pattern (TypeScript, CSV input, `ON CONFLICT DO UPDATE`, `parseInt(r.value)` direct — no conversion) — established in all prior stance phases; copy any prior script as template.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Direct Precedent — Prior Compass Stance Phases
- `.planning/milestones/v8.0-phases/80-or-compass-stances/80-CONTEXT.md` — Phase 80 is the direct structural precedent for OR stances; all Phase 80 decisions carry forward unless overridden above
- `.planning/milestones/v8.0-phases/80-or-compass-stances/80-RESEARCH.md` — Architecture deep-dive for OR compass ingestion; apply script pattern, citation enforcement, ingestion API
- `.planning/milestones/v7.0-phases/70-compass-stances/` — Phase 70 (CA compass stances) three-plan wave structure; one-at-a-time rule origin

### OR Legislator Identifiers
- `.planning/milestones/v8.0-phases/75-or-state-legislature/75-CONTEXT.md` — D-09/D-10/D-11: external_id ranges confirmed (senators -4110001 through -4110030; house reps -4120001 through -4120060); district assignments (SD-01–SD-30; HD-01–HD-60)
- `.planning/milestones/v8.0-phases/75-or-state-legislature/75-01-SUMMARY.md` — Senator seeding migration (migration 226); all 30 senator UUIDs
- `.planning/milestones/v8.0-phases/75-or-state-legislature/75-02-SUMMARY.md` — House rep seeding migration (migration 227); all 60 house rep UUIDs

### Phase Goal + Requirements
- `.planning/ROADMAP.md` §Phase 82 — Official scope, success criteria, wave structure, migration numbers (242/243)
- `.planning/REQUIREMENTS.md` — 7 requirements (STANCE-01 through QUALITY-03) all mapped to Phase 82; evidence-only and one-at-a-time standards

### Ingestion Infrastructure
- `C:/EV-Accounts/backend/scripts/` — Existing apply scripts (TypeScript); copy any prior `apply-{slug}-stances.ts` as template; CSV in `data/stance-research/`

### Compass Topic IDs
- Claude memory: `project_compass_live_topic_ids.md` — Live topic IDs for ingestion; 6 retired IDs that MUST NOT be used. Researcher must pull current live IDs from this memory before writing stances.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/scripts/apply-*.ts` — All existing apply scripts share identical CSV → `inform.politician_answers` ON CONFLICT DO UPDATE pattern; `parseInt(r.value)` direct (no conversion); copy any as template for senators and house reps scripts
- CSV format established: `politician_id, topic_id, topic_key, value, notes` — consistent across all prior phases

### Established Patterns
- Compass renders iff politician has ≥1 row in `inform.politician_answers` (gate: `GET /compass/politicians` returns IDs with stances; CompassCard returns null if not in set)
- `inform.politician_context` row required for every answer (citation enforcement — no citation = no staging)
- No bridge migration needed: `politician_answers.politician_id` uses `essentials.politicians.id` UUIDs directly
- `OR` state legislators confirmed in DB: 30 senators (external_ids -4110001 through -4110030), 60 house reps (external_ids -4120001 through -4120060); 0 stance rows exist as of 2026-05-31

### Integration Points
- Production DB: `mcp__supabase-local` is the live remote Supabase instance — all apply script runs write directly to production
- Admin API: `PUT /api/compass/politicians/:id/answers` (bearer token, `essentials.politicians` UUID as `:id`) — alternative to direct DB; apply scripts use direct DB

</code_context>

<specifics>
## Specific Ideas

- Oregon Voter's Pamphlet is uniquely valuable for OR — candidates write their own policy statements, making it a cleaner source than third-party characterizations. Even if not primary, it should always be checked in the secondary tier.
- Eastern Oregon members (rural districts, more conservative, fewer news citations) are expected to yield fewer stances. This is a known pattern, not a quality failure — researchers should accept sparse coverage and move on rather than spending extra time on low-yield searches.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 82-or-state-legislature-compass-stances*
*Context gathered: 2026-05-31*

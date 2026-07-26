# Phase 206: AZ 2026 Candidate Reconcile - Research

**Researched:** 2026-07-23
**Domain:** Post-primary civic-data reconcile — seed certified 2026 general-election nominees onto 73 pre-existing empty AZ race shells (roster-only, NO stances). SQL migration seeding into production `essentials` (Supabase/Postgres) via the cross-repo `C:/EV-Accounts` executor-authors / orchestrator-applies split.
**Confidence:** HIGH on DB mechanics + seeding recipe (SQL-verified prior migrations, exact schema); MEDIUM on source data availability + the certification-timing gap; LOW on any specific candidate name until pulled from the certified canvass at execute time.

## Summary

Phase 199 seeded 82 AZ race shells under the general election `AZ 2026 Statewide General` (id `e21f5757-071e-4851-9c06-83520d96460e`, `election_date=2026-11-03`, `state='AZ'`). 9 US House shells already carry 39 candidates; **73 shells are empty**. This phase attaches the certified general-election nominees to those 73 shells — candidate identity + party + race linkage only, **no compass stances** (locked operator exclusion). No new `races` rows are created; the shells already exist. The work is: (1) pull the certified nominee(s) per contest from the AZ Secretary of State canvass cross-checked against Ballotpedia; (2) match each nominee to an existing `politicians` row (incumbents seeded in Ph191/192/195–198) or create a new `politicians` row (challengers/open-seat winners); (3) `WHERE NOT EXISTS`-guarded INSERT into `essentials.race_candidates` linking the politician to the exact existing race shell.

**The single biggest planning risk is a certification-timing gap.** The AZ primary was *held* 2026-07-21, but county canvass runs through **Aug 3** and the **state canvass is Aug 6, 2026**; primary-result challenges are due Aug 11. The CONTEXT locks "only certified general-election nominees," yet as of the research date (2026-07-23) results are **unofficial**. This must be an operator decision at plan time (see Open Questions Q1). A second, independent nuance: the four Tucson-metro **nonpartisan municipal** contests (Oro Valley/Marana/Sahuarita/South Tucson) are decided outright in the July primary by any candidate clearing >50% — those seats have **no November general race** and their shells are *legitimately empty* (document, don't fabricate); only under-50% seats advance to the Nov 3 general.

**Primary recommendation:** Split the reconcile into per-tier plans (statewide+Corp Commission / State Senate / State House / local-6), and gate the whole phase on a single upfront operator decision: **seed from the certified Aug-6 state canvass** (literal reading of the locked "certified" decision — recommended) **or** proceed now on unofficial results with a dated re-check calendar (the Ph205 US-Senate precedent). Extract nominees per contest from the AZ SOS canvass + Ballotpedia (there is no clean per-candidate nominee CSV — expect semi-manual per-race extraction). Match incumbents to the UUID manifests already recorded in `191-01-SUMMARY.md` / `192-01-SUMMARY.md`; create new politicians in a fresh reserved `external_id` band. Use the exact `race_candidates` INSERT shape proven in `1296_senate_2026_deep_seed.sql`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Roster-only — NO stances.** Seed candidate identity + party + race linkage only. No compass stance research in this phase. (Contrast: normal deep-seed phases do stances; this reconcile does not.)
- **Only certified general-election nominees.** Do not seed primary losers or withdrawn candidates. Goal = the actual Nov-2026 ballot. If an already-seeded candidate lost/withdrew, correct it.
- **Authoritative source = Arizona Secretary of State** official 2026 general-election candidate list; cross-check against Ballotpedia / AZ Clean Elections. Never seed from a single unofficial source.
- **Idempotent seeding.** `essentials` tables have NO unique constraints on natural keys — use `WHERE NOT EXISTS` insert patterns, never `ON CONFLICT`. Re-running must produce zero net-new rows.
- **Reuse existing politician records** for incumbents/known people (match by name + office); create new `politicians` rows only for genuinely new candidates.
- **Local 6 races (Marana/Oro Valley/Sahuarita/South Tucson) fold in the owed 197/198 reconcile** — re-verify council membership + titles (Mayor/Vice-Mayor) against the certified ballot while seeding.
- **Headshots optional/deferred** — a name+party+race row is the deliverable.
- **Uncontested / write-in-only races:** seed the single certified candidate; if a shell has no certified general candidate, leave it empty and record why (do not fabricate).

### Claude's Discretion
- Plan decomposition (per-tier split), migration numbering (disk-authoritative), the fresh `external_id` band for net-new candidates, and per-race verification structure are the researcher/planner's to resolve within the locked rules above.

### Deferred Ideas (OUT OF SCOPE)
- Compass stance research (explicit operator exclusion).
- Headshot sourcing (deferrable follow-up).
- Any non-AZ races.
- Pima County constitutional offices, Superior Court retention, school-board 2026 races (deferred by Ph199).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AZ-ELEC-01 (candidate-population portion) | Confirmed 2026 general-election nominees seeded onto the Ph199 AZ race shells (6 statewide + Corp Commission seats=2 + 30 State Senate + 30 State House seats=2 + 6 Tucson-metro local) so any AZ resident sees actual candidates, not empty shells, for the Nov 3 2026 general. | Source mapping (Q1), per-tier race_id join (Pattern 2), idempotent `race_candidates` recipe (Pattern 3), incumbent-reuse UUID manifests (Ph191/192), legitimately-empty documentation (Pattern 4), verification gate (Validation Architecture). |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Certified-nominee sourcing | External research (AZ SOS canvass + Ballotpedia) | — | Ground-truth civic data; not derivable from code. Must be multi-source per locked decision. |
| Candidate→race linkage | Database (`essentials.race_candidates`) | — | The link table is the sole insertion target; shells + offices already exist. |
| New candidate identity | Database (`essentials.politicians`) | — | Only genuinely-new candidates get new rows; incumbents reuse existing UUIDs. |
| Idempotency / dedupe | SQL (`WHERE NOT EXISTS`) | — | No unique constraints on natural keys; guard is in the query, not the schema. |
| Display of seeded rosters | Frontend (`ElectionsView.jsx` / `Results.jsx`) — **read-only, no change this phase** | — | The render path is proven correct (Ph199-04); this phase only supplies the data it was waiting on. |
| Stances | **NONE — explicitly excluded** | — | `inform.politician_answers` / `inform.politician_context` must NOT be written this phase. |

## Standard Stack

This is a data-seeding phase, not a software-stack phase. The "stack" is the established AZ migration toolchain.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PostgreSQL (Supabase, `essentials` schema) | prod | Target datastore | Live production DB; `mcp__supabase-local` IS production (project memory). |
| Raw SQL migrations in `C:/EV-Accounts/backend/migrations/NNNN_*.sql` | — | Idempotent seed scripts | Every AZ phase (191–199) used numbered SQL migrations + a `schema_migrations` ledger row. |
| `psql "$DATABASE_URL" -f` (orchestrator-applied) | — | Apply path | Executor authors SQL; orchestrator applies (executor has no DB access — Ph191/192 lesson). |
| `npx tsx scripts/_apply-migration-NNNN.ts` (run from `C:/EV-Accounts/backend`) | — | Apply + smoke-test wrapper | 199-series convention; resolves SQL via `process.cwd()/migrations`. |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `WebSearch` / `WebFetch` | Pull + cross-check certified nominees | During the research/extraction task per tier. |
| Ballotpedia per-race pages | Cross-check the AZ SOS canvass | Mandatory second source per locked decision. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct `race_candidates` INSERT | `essentials.candidate_staging` (discovery staging) | Staging is the **discovery cron's** intake; the reconcile is a hand-curated authoritative seed → write `race_candidates` directly (matches Ph205 `1296` and all `*_house_candidates` seeds). Do NOT route through staging. See Open Questions Q4. |

**Installation:** N/A — no packages installed. See Package Legitimacy Audit.

**Migration numbering:** disk MAX on `C:/EV-Accounts/backend/migrations` = **1387** as of 2026-07-23 → next free **1388** [VERIFIED: ls on migrations dir]. Number drift is expected to recur (Ph191 Pitfall 2) — **re-confirm both on-disk MAX and `schema_migrations` MAX at execute time**; disk is authoritative.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero external packages. It authors SQL migration files and applies them with the already-present `psql` / `tsx` toolchain in `C:/EV-Accounts`. No npm/PyPI/crates dependency is introduced.

## Architecture Patterns

### System Data Flow

```
AZ SOS state canvass (official, Aug 6)  ─┐
Ballotpedia per-race pages  ─────────────┼─► [Research/extract per contest]
AZ Clean Elections (participation)  ─────┘        │
                                                  ▼
                            per-race nominee list (name, party, incumbent?, seat)
                                                  │
                          ┌───────────────────────┴───────────────────────┐
                          ▼                                                 ▼
              incumbent? match existing                       new? INSERT essentials.politicians
              politicians UUID (191/192/195-198 manifests)    (fresh external_id band, party, is_active)
                          │                                                 │
                          └───────────────────────┬───────────────────────┘
                                                   ▼
                    resolve race_id: essentials.races
                    WHERE election_id = (AZ 2026 Statewide General)
                      AND position_name = '<exact shell string>'
                      AND primary_party IS NULL
                                                   │
                                                   ▼
                    WHERE NOT EXISTS-guarded INSERT INTO essentials.race_candidates
                    (race_id, politician_id, full_name, first_name, last_name,
                     is_incumbent, candidate_status='active', source)
                                                   │
                                                   ▼
                    in-transaction DO $$ post-verify gate  ──►  schema_migrations ledger row
                                                   │
                                                   ▼
                    (read-only) ElectionsView/Results renders the now-populated general shells
```

File-to-shell mapping (which existing shell each tier fills) is in Pattern 2. The diagram is the flow; the shells and offices already exist — nothing new is created except `race_candidates` (+ new `politicians`).

### Pattern 1: The election + shell anchor (never hardcode the UUID for the join)
**What:** All 73 shells hang off one general election. Resolve it by name, not literal UUID, to stay portable (199 convention).
**Example:**
```sql
-- Source: 199-02-SUMMARY.md + 1296_senate_2026_deep_seed.sql (verified pattern)
-- election anchor (resolved by name; literal id is e21f5757-071e-4851-9c06-83520d96460e)
(SELECT id FROM essentials.elections
   WHERE name = 'AZ 2026 Statewide General' AND state = 'AZ' LIMIT 1)
```

### Pattern 2: Per-tier race_id resolution (join on the EXACT stored position_name)
**What:** The shells already exist with exact `position_name` strings. **Before authoring any INSERT, dump every shell so you join on the exact stored string** — do not re-derive labels.
```sql
-- Run first; this is the authoritative shell map for the phase.
SELECT r.id, r.position_name, r.seats
FROM essentials.races r
WHERE r.election_id = (SELECT id FROM essentials.elections
                         WHERE name='AZ 2026 Statewide General' AND state='AZ')
  AND r.primary_party IS NULL
ORDER BY r.position_name;   -- expect 82 rows (9 US House + 73 target shells)
```
Confirmed shell label forms (from Ph199 summaries):

| Tier | Count | `position_name` form | seats | Notes |
|------|-------|----------------------|-------|-------|
| State Senate | 30 | `State Senate District N` (N=1..30, unpadded) | 1 | Exact `districts.label` form (199-02). |
| State House | 30 | `State House District N` (N=1..30, unpadded) | **2** | Multi-member; 30 races not 60 (199-02). |
| Statewide exec | 6 | Governor / Secretary of State / Attorney General / Treasurer / Superintendent of Public Instruction / State Mine Inspector (exact string TBD from dump) | 1 | Query the exact stored string; office anchors in 199-02-SUMMARY. |
| Corp Commission | 1 | `Arizona Corporation Commission` | **2** | At-large 2-winner (199-02). |
| Local council | 4 | `South Tucson City Council` (3), `Oro Valley Town Council` (3), `Marana Town Council` (4), `Sahuarita Town Council` (3) | 3/3/4/3 | 199-03. |
| Local exec | 2 | `Oro Valley Mayor` (1), `Marana Mayor` (1) | 1 | 199-03. Directly elected. South Tucson + Sahuarita mayors are council-appointed → **no mayor shell**. |

The join for one shell:
```sql
(SELECT r.id FROM essentials.races r
   WHERE r.election_id = (SELECT id FROM essentials.elections
                            WHERE name='AZ 2026 Statewide General' AND state='AZ')
     AND r.position_name = 'State Senate District 5'
     AND COALESCE(r.primary_party,'') = '')   -- matches NULL-party general shells robustly
```

### Pattern 3: Idempotent candidate attach (the canonical shape)
**What:** Reuse the exact three-statement block proven in `1296_senate_2026_deep_seed.sql` — (a) optionally INSERT a new politician guarded on `external_id`; (b) INSERT the `race_candidates` link guarded on `(race_id, politician_id)`.
```sql
-- Source: C:/EV-Accounts/backend/migrations/1296_senate_2026_deep_seed.sql (VERIFIED live pattern)
-- (a) NEW candidate only — reused incumbents skip this and use their known UUID directly:
INSERT INTO essentials.politicians (external_id, first_name, last_name, full_name, party, is_incumbent, is_active)
SELECT -4016001, 'Jane', 'Doe', 'Jane Doe', 'Democratic', false, true
WHERE NOT EXISTS (SELECT 1 FROM essentials.politicians WHERE external_id = -4016001);
-- (b) link to the existing shell, idempotent on (race_id, politician_id):
INSERT INTO essentials.race_candidates
  (race_id, politician_id, full_name, first_name, last_name, is_incumbent, candidate_status, source)
SELECT
  (SELECT r.id FROM essentials.races r
     WHERE r.election_id = (SELECT id FROM essentials.elections WHERE name='AZ 2026 Statewide General' AND state='AZ')
       AND r.position_name = 'State Senate District 5' AND COALESCE(r.primary_party,'')=''),
  (SELECT id FROM essentials.politicians WHERE external_id = -4016001),
  'Jane Doe','Jane','Doe', false, 'active', 'https://azsos.gov/...'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates rc
   WHERE rc.race_id = (SELECT r.id FROM essentials.races r
       WHERE r.election_id = (SELECT id FROM essentials.elections WHERE name='AZ 2026 Statewide General' AND state='AZ')
         AND r.position_name = 'State Senate District 5' AND COALESCE(r.primary_party,'')='')
     AND rc.politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4016001));
```
`race_candidates` columns available (199-RESEARCH verified): `id, race_id NOT NULL, politician_id NULL, full_name NOT NULL, first_name, last_name, photo_url, is_incumbent, candidate_status default 'active', last_verified_at, source, external_id, occupational_designation, website_url`. **No unique constraint beyond pk** → `ON CONFLICT` is unusable; guard with `WHERE NOT EXISTS (race_id, politician_id)`.

**`is_incumbent` gotcha (Ph205):** the `politicians.is_incumbent` column default is **true** — always set it EXPLICITLY (`false` for new challengers) on both the politician INSERT and the `race_candidates` row.

### Pattern 4: Legitimately-empty shells (document, don't fabricate)
A shell may correctly end empty when: (a) a **nonpartisan municipal seat was decided outright in the July primary** (winner >50% → no Nov runoff — e.g., Oro Valley Mayor); (b) **no candidate filed / qualified** for the general in that contest. For each such shell, write a comment in the migration and a row in the phase SUMMARY's "legitimately empty" table with the reason + source URL. Do NOT seed the primary winner onto a general shell that has no general contest.

### Anti-Patterns to Avoid
- **Creating new `races` rows.** All 73 shells exist. Only `race_candidates` (+ new `politicians`) are inserted. Creating a duplicate shell is the classic split-section defect.
- **Routing through `candidate_staging`.** That is the discovery cron's intake, not a hand-curated seed target.
- **`ON CONFLICT` anything.** No natural-key unique constraints exist on `politicians` / `race_candidates`.
- **Name-only incumbent matching without the manifest.** Homonyms exist (the Ph205 pid map rejected 4 homonyms). Use the recorded UUID manifests for legislators/execs; for locals, resolve via the government geo_id chain.
- **Writing any `inform.politician_answers` / `inform.politician_context` row.** Stances are excluded; a stray stance INSERT fails Success Criterion #5.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Incumbent UUID lookup | A fuzzy name matcher | The exact UUID manifests in `191-01-SUMMARY.md` (7 execs, ext_id −4004xxx) + `192-01-SUMMARY.md` (all 90 legislators, ext_id −4005xxx Senate / −4006xxx House, full UUID table) | Deterministic, homonym-safe; the tables are already recorded verbatim. |
| Local incumbent lookup | New external_id guesses | Resolve via office→chamber→government geo_id (OV `0451600`, Marana `0444270`, Sahuarita `0462140`, South Tucson `0468850`) | Local bands: Sahuarita −4014xxx, South Tucson −4015xxx (OV/Marana used non-numeric ext_ids); geo_id chain is the stable key. |
| Attach + dedupe SQL | A bespoke upsert | The verbatim 3-statement block from `1296_senate_2026_deep_seed.sql` | Battle-tested idempotent shape already applied to prod. |
| Post-verify | Ad-hoc SELECTs | In-transaction `DO $$ … RAISE EXCEPTION` gate + `schema_migrations` ledger row | Every AZ migration uses it; catches partial applies. |

**Key insight:** Nearly all incumbents are already in the DB (Ph191/192 seeded all 7 execs + all 90 legislators; Ph195–198 seeded the 4 towns). The reconcile is mostly *link existing politicians to shells* + *add the minority of net-new challenger/open-seat winners*. Reusing the recorded UUID manifests is faster and safer than any matching logic.

## Runtime State Inventory

This is an additive data-seed, not a rename/refactor — but the "what else stores this?" discipline still applies to avoid double-seeding and to honor the no-stances rule.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data (existing rows to REUSE, not recreate) | 7 AZ execs (ext_id −4004xxx, 191 manifest) · 90 legislators (−4005xxx/−4006xxx, 192 manifest) · 4 towns' councils/mayors (195–198; Sahuarita −4014xxx, South Tucson −4015xxx) · 39 US House `race_candidates` (untouched) | Link existing `politicians` to shells by UUID; create new rows ONLY for genuinely-new candidates. |
| Live service config | The discovery cron (`discoveryCron.ts`, 180-day window) is armed on the same election dates and may also populate `candidate_staging` for AZ | Coordinate: hand-seed authoritative `race_candidates` directly; do not fight the cron via staging. Confirm no double-attach (guard is on race_id+politician_id, so idempotent even if cron also acts). |
| OS-registered state | None | None — verified: no scheduler/pm2 state references AZ candidates. |
| Secrets/env vars | `DATABASE_URL` in `C:/EV-Accounts/backend/.env` (already present) | None — reuse existing apply credentials. |
| Build artifacts | None | None — SQL migration + ledger row only. |
| **Stances (MUST stay untouched)** | `inform.politician_answers (politician_id, topic_id, value)` + `inform.politician_context (politician_id, topic_id, reasoning, sources)` | **Zero writes.** Verification must assert row counts in both tables are unchanged for the phase's politicians. |

## Common Pitfalls

### Pitfall 1: Certification-timing gap (07-21 held vs 08-06 certified)
**What goes wrong:** Seeding "certified" nominees before the state canvass; a close race flips on late/provisional counts and you've seeded a loser.
**Why it happens:** The ROADMAP blocker read "BLOCKED until 2026-07-21" (election day), but AZ certification = county canvass by **Aug 3**, state canvass **Aug 6**, challenges due **Aug 11** [CITED: votebeat.org, azsos.gov]. The locked decision says "certified."
**How to avoid:** Make it Open Question Q1 — an explicit operator gate before any seeding. Recommended: seed after Aug 6. If proceeding earlier, seed only uncontested/decisive contests and keep a dated re-check calendar (Ph205 `wsen` precedent: `.planning/todos/…recheck-calendar.md`).
**Warning signs:** Margins under ~2% in the source; "results still being counted" language; races with outstanding provisional/early ballots.

### Pitfall 2: Nonpartisan municipal seats decided in the primary have NO general race
**What goes wrong:** Seeding the July winner (e.g., Oro Valley Mayor, ~57%) onto the Nov general shell that has no contest → fabricated general-election candidate.
**Why it happens:** AZ nonpartisan town/city elections: a candidate clearing **>50% in the July primary wins outright**; only under-50% seats advance to the Nov 3 general [CITED: tucson.com]. So per-seat, the general shell is populated *only if* it went to a runoff.
**How to avoid:** For each of the 6 local shells, determine per-seat whether it resolved in July (→ document shell legitimately empty for the mayor/seat won outright) or advanced (→ seed the advancing candidates). Council shells (3–4 seats) commonly split: some seats decided, others to Nov.
**Warning signs:** A local shell where the reported primary winner already has a majority.

### Pitfall 3: Multi-member (seats=2) races need ALL party nominees on ONE race
**What goes wrong:** Seeding only one candidate on a State House (seats=2) or Corp Commission (seats=2) race, or creating a second race.
**Why it happens:** Each party may nominate up to `seats` candidates; a seats=2 general can carry up to 2 D + 2 R (+ minor party) = 4 candidates on the single race row.
**How to avoid:** Attach every certified general nominee to the one shell; `ElectionsView.jsx` is seats-aware (`isUnopposed = activeCandidates.length <= seats`, renders `${seats} seats` badge — 199-04). This phase supplies the first *upcoming-election* seats=2 candidates, so it also discharges the owed Ph199-04 render human-check (load an AZ `/results?view=elections`, confirm the `2 seats` badge and no single-winner mis-render).

### Pitfall 4: Apostrophes/diacritics in candidate names break literal SQL
**What goes wrong:** Names like `O'Brien`, `Márquez Peterson`, `Timothy "Tim" Dunn`, `Elda Luna-Nájera` unescaped → SQL syntax error or truncated string.
**Why it happens:** Static literal INSERTs; a lone `'` terminates the string.
**How to avoid:** Escape `'` as `''`; keep UTF-8 diacritics as-is (the DB already stores `Márquez`, `Nájera` per 192 manifest). Validate the migration parses before apply.

### Pitfall 5: Source data is not a clean per-candidate export
**What goes wrong:** Planning assumes a downloadable nominee CSV; there isn't one.
**Why it happens:** The AZ SOS Candidate Portal (`apps.azsos.gov/apps/election/candidateportal`) is candidate-facing (filing/E-Qual); public candidate/nominee lists are published as **PDFs** and via the SOS results portal, not a normalized per-race CSV [CITED: azsos.gov]. Legislative + local coverage requires stitching SOS canvass + Ballotpedia per-race pages + Pima County results.
**How to avoid:** Budget for semi-manual per-contest extraction (see Open Questions Q1 effort estimate); one tier at a time; two sources per contest per the locked decision.

## Code Examples

### Dump the shells first (authoritative map — run before authoring INSERTs)
```sql
SELECT r.id, r.position_name, r.seats
FROM essentials.races r
JOIN essentials.elections e ON e.id = r.election_id
WHERE e.name='AZ 2026 Statewide General' AND e.state='AZ' AND r.primary_party IS NULL
ORDER BY r.position_name;
```

### Reused incumbent (no new politician row — use the manifest UUID directly)
```sql
-- Source pattern: 1296_senate_2026_deep_seed.sql; UUID from 192-01-SUMMARY.md manifest
INSERT INTO essentials.race_candidates
  (race_id, politician_id, full_name, first_name, last_name, is_incumbent, candidate_status, source)
SELECT
  (SELECT r.id FROM essentials.races r
     WHERE r.election_id=(SELECT id FROM essentials.elections WHERE name='AZ 2026 Statewide General' AND state='AZ')
       AND r.position_name='State Senate District 1' AND COALESCE(r.primary_party,'')=''),
  '489e2fc3-b47a-4304-b959-07e35f010da4',       -- Mark Finchem, ext_id -4005001 (192 manifest)
  'Mark Finchem','Mark','Finchem', true, 'active',
  'https://azsos.gov/elections/2026-general-canvass'
WHERE NOT EXISTS (SELECT 1 FROM essentials.race_candidates rc
   WHERE rc.race_id=(SELECT r.id FROM essentials.races r
       WHERE r.election_id=(SELECT id FROM essentials.elections WHERE name='AZ 2026 Statewide General' AND state='AZ')
         AND r.position_name='State Senate District 1' AND COALESCE(r.primary_party,'')='')
     AND rc.politician_id='489e2fc3-b47a-4304-b959-07e35f010da4');
```
(New-candidate two-part block: see Pattern 3.)

### In-transaction post-verify gate + ledger
```sql
-- Source: 199 apply-script convention
DO $$
DECLARE v_filled int; v_stray_stances int;
BEGIN
  SELECT count(*) INTO v_filled
    FROM essentials.race_candidates rc JOIN essentials.races r ON r.id=rc.race_id
    JOIN essentials.elections e ON e.id=r.election_id
   WHERE e.name='AZ 2026 Statewide General' AND e.state='AZ';
  IF v_filled < 40 THEN RAISE EXCEPTION 'expected >=39 existing + new AZ candidates, got %', v_filled; END IF;
  -- no-stances guard scoped to this phase's new politicians omitted for brevity; assert 0 new rows.
END $$;
INSERT INTO essentials.schema_migrations (version) SELECT '1388'
WHERE NOT EXISTS (SELECT 1 FROM essentials.schema_migrations WHERE version='1388');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AZ primary in late August | **July 21, 2026** primary (HB 2022, signed 2026-02-06) | 2026 cycle | Certification (state canvass) moved to **Aug 6**; general ballots printed by September. |
| Hand-seed everything at discovery | Ph199 shipped **pure structure** (shells only) + deferred candidate reconcile | Ph199 (2026-07-17) | This phase is that deferred reconcile — link-only, shells already exist. |

**Deprecated/outdated:** any reference to a `2026-08-04` AZ primary date (corrected to `2026-07-21` in Ph199); any `cron_active` column (does not exist).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | State canvass = Aug 6, 2026; county canvass by Aug 3; challenges by Aug 11 | Pitfall 1 | If dates differ, the "certified" gate opens on a wrong date; re-confirm on azsos.gov before seeding. [CITED: votebeat.org — cross-check azsos.gov 2026 election calendar] |
| A2 | Corporation Commission = **2** at-large seats up in 2026 (matches Ph199 seats=2 shell) | Pattern 2 | Ballotpedia says 2; Arizona Ballot Guide says 3. If 3, the single seats=2 shell is under-sized. Verify against the certified canvass; the shell is already seats=2 so trust it unless the source contradicts. [ASSUMED] |
| A3 | Nonpartisan municipal >50%-in-primary wins outright; else advances to Nov general | Pitfall 2 | If a town charter differs, a shell is wrongly documented empty or wrongly seeded. Confirm per town (Oro Valley/Marana charter). [CITED: tucson.com] |
| A4 | No clean per-candidate nominee CSV from AZ SOS; PDF + results portal + Ballotpedia stitching required | Pitfall 5 | If a machine-readable export exists, effort is lower. [ASSUMED — portal is filing-facing] |
| A5 | Sahuarita + South Tucson mayors are council-appointed (no directly-elected mayor shell) | Pattern 2 | Matches Ph199-03 (only OV + Marana mayor shells). If wrong, a mayor shell is missing. [CITED: tucson.com; consistent with 199-03] |
| A6 | Most 2026 nominees who are incumbents already exist in DB from Ph191/192/195–198 | Don't Hand-Roll | If an incumbent lost their primary, seed the challenger (new row) instead — don't force-reuse. [VERIFIED: 191/192 manifests] |
| A7 | Next migration number 1388 | Standard Stack | Drift expected; re-check disk + ledger MAX at execute. [VERIFIED: ls 2026-07-23, MAX=1387] |
| A8 | Specific candidate names/winners | (none seeded in research) | All names must be pulled from the certified source at execute time; treat every name in prior search snippets as UNVERIFIED preliminary. [ASSUMED/LOW] |

**Empty?** No — this reconcile is intrinsically source-dependent; the assumptions above are the operator-decision surface.

## Open Questions

1. **Certification-timing gate (BLOCKING — decide before any seeding).**
   - What we know: primary held 2026-07-21; state canvass Aug 6, 2026; locked decision says "certified."
   - What's unclear: whether to (A) wait until after Aug 6 for truly-certified nominees [recommended, literal reading], or (B) proceed now (2026-07-23) on unofficial results with a dated re-check calendar (Ph205 precedent), or (C) seed only uncontested/decisive contests now and the rest post-canvass.
   - Recommendation: **Option A** — schedule execution after Aug 6. It fully satisfies the "certified" lock with the least rework. If speed matters, Option C as a first plan (uncontested + decided), Option-A pass for the remainder.
   - **Effort estimate (once source is available):** 73 shells → ~150–220 `race_candidate` rows + ~80–130 net-new `politicians` (incumbents reused). Because AZ SOS data is PDF/portal (not CSV), budget the bulk of effort on per-contest extraction + Ballotpedia cross-check, one tier per plan. Realistically a 4-plan phase (statewide+Corp / Senate / House / local-6), each a research-then-SQL task.

2. **Corp Commission seat count (2 vs 3).** Resolve against the certified canvass; the existing shell is seats=2. If the canvass shows 3, escalate — the shell would need resizing (out of this phase's link-only scope → operator decision).

3. **Per-seat local resolution.** For each of the 6 local shells, which seats resolved in July vs advanced to Nov? Requires Pima County certified results per seat; determines seed-vs-document-empty per seat.

4. **Direct `race_candidates` vs `candidate_staging`.** Recommendation: write `race_candidates` directly (authoritative hand-seed, matches all prior seed migrations). Confirm the discovery cron won't have already populated staging/`race_candidates` for these AZ shells (idempotent guard makes double-run safe, but note it). Operator: confirm.

5. **197/198 title reconcile scope.** While seeding the 6 local shells, re-verify Marana/Oro Valley/Sahuarita/South Tucson council membership + Mayor/Vice-Mayor titles against the certified ballot (title form in DB: `Mayor`, `Vice Mayor`, `Council Member (Vice Mayor)`). Does re-verification imply correcting *current-officeholder* rows (Ph197/198 owed reconcile), or only seeding the 2026 candidates? Recommendation: correct any stale current-officeholder title/membership as a bounded side-task within the local plan; flag anything larger.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `psql` + `DATABASE_URL` (`C:/EV-Accounts/backend/.env`) | Apply migrations (orchestrator) | ✓ (used Ph191–199) | prod | — |
| `npx tsx` (apply-script wrapper) | Smoke tests | ✓ | — | inline psql |
| AZ SOS certified canvass (azsos.gov / results portal) | Source data | ⏳ **not until ~Aug 6, 2026** | — | Ballotpedia per-race + Pima County (still unofficial pre-canvass) |
| Ballotpedia per-race pages | Cross-check | ✓ | — | AZ Clean Elections |
| Pima County results (`pima.gov/2865`) | Local-6 per-seat resolution | ✓ (unofficial now) | — | town clerk canvass |
| WebSearch / WebFetch | Extraction | ✓ | — | — |

**Missing dependencies with no fallback:** Certified statewide/legislative nominee data does not exist until the Aug 6 state canvass — this is the phase blocker (Open Question Q1), not a tooling gap.
**Missing dependencies with fallback:** Pre-canvass, unofficial results (Ballotpedia/AZPM/Pima) can scaffold but must not be treated as "certified."

## Validation Architecture

No automated JS/TS test framework covers civic-data seeding; validation is SQL assertions in the migration's `DO $$` gate + apply-script smoke tests + a manual render check, mirroring Ph199.

### "Test" Framework
| Property | Value |
|----------|-------|
| Framework | In-transaction `DO $$ … RAISE EXCEPTION` + `_apply-migration-NNNN.ts` smoke tests (grep-able `PHASE GATE …` lines) |
| Config file | none — per-migration apply script in `C:/EV-Accounts/backend/scripts` |
| Quick run | `npx tsx scripts/_apply-migration-1388.ts` (from `C:/EV-Accounts/backend`) |
| Full suite | Re-apply all phase migrations → assert idempotent net-zero |

### Phase Requirements → Verification Map
| Req | Behavior | Check | Automated command |
|-----|----------|-------|-------------------|
| AZ-ELEC-01 | Each of 73 shells filled OR documented empty | per-shell `count(race_candidates)` ≥1, else listed in SUMMARY empty-table with reason | psql count grouped by position_name |
| AZ-ELEC-01 | No primary loser/withdrawal seeded | every seeded name ∈ certified winner set; no `candidate_status='withdrawn'` on a 2026 AZ race unless intentional | manual cross-check vs canvass + psql |
| AZ-ELEC-01 | Idempotent | re-apply → `race_candidates` + `politicians` counts unchanged | re-run apply script |
| Success #5 | **No stances created** | `inform.politician_answers` + `inform.politician_context` counts for phase politicians unchanged (=0 new) | psql count before/after |
| Ph199-04 owed | seats=2 renders correctly | AZ `/results?view=elections` shows `2 seats` badge, no single-winner mis-render | manual human-check |
| Data hygiene | No new `races`; no split-section | `races` count under general stays 82; section-split check = 0 | psql (project section-split pattern) |

### Sampling Rate
- **Per migration apply:** the `DO $$` gate (aborts the txn on failure) + smoke tests.
- **Per tier merge:** shell-fill count for that tier + no-stances assertion.
- **Phase gate:** all 73 shells filled-or-documented; idempotent re-run; zero stances; seats=2 render confirmed.

### Wave 0 Gaps
- [ ] Per-tier apply scripts `_apply-migration-1388.ts` … (one per plan) — author alongside each migration.
- [ ] Phase-close roll-up query (73 shells → filled/empty with reason) for the SUMMARY.
- [ ] No-stances guard query (counts on `inform.politician_answers`/`politician_context`).
*(No JS test infra needed — SQL-assertion model matches all prior AZ phases.)*

## Security Domain

`security_enforcement` absent → treated as enabled. This is a data-seed with no new app surface; the relevant controls are data-integrity, not web security.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Escape `'`→`''` in candidate names; validate migration parses; two-source verification of every seeded name (locked decision). |
| V6 Cryptography | no | — |
| V2/V3/V4 Auth/Session/Access | no | No auth surface touched; prod writes via existing `DATABASE_URL` only. |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fabricated/uncertified candidate on public ballot | Tampering / Information disclosure | "Certified only" gate (Q1) + two-source rule + document-empty-not-fabricate rule. |
| Duplicate/ghost candidate rows | Data integrity | `WHERE NOT EXISTS (race_id, politician_id)` idempotency + post-verify counts. |
| Accidental stance write | Integrity (scope violation) | No-stances assertion on `inform.*`. |
| SQL literal injection via a real name with `'`/`"` | Tampering | Escape apostrophes; UTF-8 diacritics preserved. |

## Sources

### Primary (HIGH confidence)
- `1296_senate_2026_deep_seed.sql` (C:/EV-Accounts) — verified idempotent `races`+`race_candidates`+`politicians` INSERT pattern, `WHERE NOT EXISTS`, explicit `is_incumbent=false`, `external_id` band for new politicians.
- `199-02-SUMMARY.md`, `199-03-SUMMARY.md`, `199-04-SUMMARY.md` — exact shell `position_name` forms, seats modeling (House/Corp seats=2), the 82-race gate, seats=2 render deferral, election id `e21f5757-…`.
- `199-RESEARCH.md` — `essentials.race_candidates` / `races` / `elections` schema + constraint facts (no `race_candidates` unique constraint; partial-unique on `(election_id, position_name) WHERE primary_party IS NULL`).
- `191-01-SUMMARY.md` — 7 STATE_EXEC officials, ext_id band −4004xxx.
- `192-01-SUMMARY.md` — full 90-legislator UUID manifest (ext_id −4005xxx Senate / −4006xxx House), multi-member modeling, appointee handling.
- Local city migrations (1305/1345/1354/1363) — town title forms + local ext_id bands (Sahuarita −4014xxx, South Tucson −4015xxx); `inform.politician_answers`/`politician_context` = the stance tables to leave untouched.
- `ls` on `C:/EV-Accounts/backend/migrations` — disk MAX = 1387 (next 1388).

### Secondary (MEDIUM confidence)
- votebeat.org (2026-07-21) — county canvass by Aug 3, state canvass Aug 6, challenges by Aug 11.
- Ballotpedia — Arizona state executive / Corp Commission / SoS 2026 election pages (seat counts, primary field).
- tucson.com / tucsonsentinel.com — nonpartisan >50%-wins-outright rule; local per-seat context.
- azsos.gov — candidate portal (filing-facing), 2026 election info, candidate-filing PDFs.

### Tertiary (LOW confidence — do NOT seed from)
- AZPM / AZ Luminaria / kold / kgun9 / tucsonspotlight live-result snippets — unofficial election-night numbers; useful only to identify which contests are close/decided, never as the seed source.

## Metadata

**Confidence breakdown:**
- Seeding recipe / schema / idempotency: HIGH — verified against applied prod migrations.
- Incumbent reuse / ID schemes: HIGH — UUID manifests recorded verbatim in 191/192 summaries.
- Source availability + certification timing: MEDIUM — cross-checked news + SOS, but the certified dataset does not exist until Aug 6.
- Specific candidates/winners: LOW — must be pulled from the certified source at execute time; treat all prior search snippets as unverified preliminary.
- Local per-seat resolution: MEDIUM — rule confirmed, per-seat outcomes pending Pima canvass.

**Research date:** 2026-07-23
**Valid until:** 2026-08-13 (re-pull after the Aug 6 state canvass; results settle by the Aug 11 challenge deadline). Schema/pattern facts are stable ~30 days; source-data facts expire at the canvass.

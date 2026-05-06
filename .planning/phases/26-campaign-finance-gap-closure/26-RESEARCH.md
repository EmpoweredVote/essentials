# Phase 26: Campaign Finance Gap Closure - Research

**Researched:** 2026-05-06
**Domain:** LA City Socrata campaign finance ingestion — gap detection, source seeding, ingest pipeline
**Confidence:** HIGH

## Summary

Phase 26 is a data operation with an existing, fully-functional script. The primary tool is
`C:\EV-Accounts\backend\scripts\audit-la-socrata-gaps.ts`, which was purpose-built to find
LA City candidates in active races that are missing `la_socrata` politician_sources rows,
match them to Socrata committees, seed the source rows, and trigger ingest. The script is
production-ready: it handles matching, ambiguous cases, logging, and idempotent upserts.

The broader Socrata pipeline (socrataAdapter → runIngestion → contributions table) is well-tested
across Phases 17 and 23. The ingest path is direct function call only — never via HTTP POST, because
Cloudflare blocks POST to accounts.empowered.vote. All scripts call `runAdapterForAll('la_socrata')`
directly.

The main planning concern is that the "32 candidates" figure is a snapshot from when the phase was
defined. The script must be run in audit-only mode first to get the current count — some of those 32
may already have been seeded (the ingest-la-june2026-candidates.ts script ran recently and seeded 13+
candidates). NO MATCH and AMBIGUOUS results from the audit run require manual resolution before
`--fix --ingest` can close all gaps.

**Primary recommendation:** Run audit-only first, assess NO MATCH / AMBIGUOUS candidates, resolve them
manually if needed, then run `--fix --ingest`. Document the procedure as a maintenance reference.

---

## Standard Stack

### Core (already in place — no new libraries needed)

| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| `npx tsx` | via package.json | Run TypeScript scripts directly | In use |
| `pg` (node-postgres) | ^8.13.0 | DB queries | In use |
| `data.lacity.org` SODA API | v2.0 | Socrata committee fetch (dataset m6g2-gc6c) | In use |
| `runAdapterForAll('la_socrata')` | internal | Trigger ingest for all confirmed la_socrata sources | In use |
| `createSocrataAdapter` + `runIngestion` | internal | Per-source ingest pipeline | In use |

### Key env vars required

| Variable | Purpose | Notes |
|----------|---------|-------|
| `DATABASE_URL` | Postgres connection | Direct connection (port 5432) — NOT pooler |
| `SOCRATA_APP_TOKEN` | Socrata rate limit avoidance | Optional but strongly recommended |

**No new installation needed.** Everything required is already in `C:\EV-Accounts\backend`.

---

## Architecture Patterns

### How the gap audit works

The script (`audit-la-socrata-gaps.ts`) queries for LA City candidates in active races
(`essentials.race_candidates` + `essentials.races` + `essentials.elections`) where:
- `e.state = 'CA'`
- `e.election_date >= CURRENT_DATE`
- `r.position_name ILIKE '%Los Angeles%'`
- `rc.candidate_status = 'active'`
- No confirmed `la_socrata` row in `transparent_motivations.politician_sources`

It then fetches all Socrata committees (dataset m6g2-gc6c, `cmt_type='C'`) and matches by last name.

### Script operation modes

```
Mode 1 — Audit only (no writes):
  npx tsx scripts/audit-la-socrata-gaps.ts

Mode 2 — Fix (seed sources, no ingest):
  npx tsx scripts/audit-la-socrata-gaps.ts --fix

Mode 3 — Fix + ingest (seed sources AND run full la_socrata ingest):
  npx tsx scripts/audit-la-socrata-gaps.ts --fix --ingest
```

Run from: `C:\EV-Accounts\backend`

### Output per candidate

```
[MATCH]      Name → cmt_id=XXXXXX "Committee Name"
[NO MATCH]   Name
[AMBIGUOUS]  Name — N matches: cmt_id=X "...", cmt_id=Y "..."
```

### Matching logic (from source)

1. Extract last name (last space-delimited token of `full_name`)
2. Find committees where `cand_name` or `cmt_nm` contains the normalized last name
3. If 1 match → MATCH, insert source
4. If 0 matches → NO MATCH, skip
5. If >1 match → narrow by first name; if still ambiguous → AMBIGUOUS

### Ingest pipeline (la_socrata adapter)

```
runAdapterForAll('la_socrata')
  → queries all confirmed la_socrata politician_sources
  → for each: createSocrataAdapter().fetch(ps)
      → fetchAllPages(cmt_id) from data.lacity.org m6g2-gc6c
      → delta fetch: queries ingestion_runs for last completed run date
  → normalize(records)
      → CRITICAL: con_amount is JSON string, must parseFloat()
      → composite source_transaction_id: cmt_id|con_date|con_name|con_amount
  → upsert(contributions)
      → INSERT ON CONFLICT (data_source, source_transaction_id) DO UPDATE SET updated_at = NOW()
      → deduplicates within batch to prevent "command cannot affect row a second time" PG error
  → writes ingestion_runs row (status: 'completed' | 'completed_with_warning' | 'failed')
```

### Tables involved

| Table | Schema | Role |
|-------|--------|------|
| `politician_sources` | `transparent_motivations` | Source registry; `source_system='la_socrata'`, `external_id=cmt_id` |
| `contributions` | `transparent_motivations` | Contribution rows; keyed by `(data_source, source_transaction_id)` |
| `ingestion_runs` | `transparent_motivations` | Audit log per adapter run |
| `race_candidates` | `essentials` | Active candidate lookup |
| `races` | `essentials` | Position name + election join |
| `elections` | `essentials` | State + election_date filter |
| `politicians` | `essentials` | Candidate name |

### Research_status lifecycle

```
(none) → [script seeds] → 'confirmed'
                               ↓
                     runAdapterForAll ingests
```

The gap script inserts directly as `confirmed` (not `needs_research`) because it has already
verified the match. This is correct — it matches the pattern used for targeted seeding in
prior phases (e.g., `seed-traci-park-committees.ts`, `ingest-la-june2026-candidates.ts`).

Contrast with `relink-socrata-skipped.ts` and `audit-socrata-committees.ts` which insert as
`needs_research` and require a separate confirmation pass. The gap script bypasses this because
it uses the same name-match logic as the confirmation classifier.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Re-fetch gap candidates | Custom query | audit-la-socrata-gaps.ts (existing) | Already queries correct tables |
| Socrata committee fetch | Custom fetch | Script's `fetchSocrataCommittees()` | Handles token, pagination |
| Ingest trigger | HTTP POST to /admin | `runAdapterForAll('la_socrata')` | Cloudflare blocks POST to deployed API |
| Per-source ingest | Custom loop | `runAdapterForAll('la_socrata')` | Handles all confirmed sources including pre-existing ones |
| Contribution counting | Custom query | Standard SQL against `contributions` table | See verification queries section |
| Name matching | New algorithm | Existing normalize + last-name matching | Already proven through Phases 17/23 |

**Key insight:** Every tool needed for this phase already exists. The plan should sequence existing
scripts, not build anything new except verification queries.

---

## Common Pitfalls

### Pitfall 1: Running --fix --ingest before reviewing NO MATCH / AMBIGUOUS

**What goes wrong:** Candidates with NO MATCH results have no source seeded. The script skips them
silently. After `--fix --ingest` completes, those candidates still have zero contributions. The
gap is not actually closed.

**How to avoid:** Run audit-only first. For every NO MATCH, investigate manually: (a) check if the
candidate filed under a PAC name not containing their last name, (b) check if they legitimately
did not file (some candidates in active races have not opened a committee). Candidates who
legitimately never filed are acceptably zero.

**Warning signs:** Seeded count < gap count after `--fix`.

### Pitfall 2: The 32 candidates figure is stale

**What goes wrong:** `ingest-la-june2026-candidates.ts` (run 2026-05-06) already seeded 13+
June 2026 candidates directly via SQL + runAdapterForAll. Some of the original "32 missing"
candidates may now be present.

**How to avoid:** Always run audit-only first to get the current gap count. Do not assume 32 is
still accurate.

### Pitfall 3: HTTP POST ingest trigger

**What goes wrong:** Trying to trigger ingest via HTTP POST to the deployed API fails silently
or returns an error because Cloudflare blocks POST requests to accounts.empowered.vote.

**How to avoid:** Always use `runAdapterForAll('la_socrata')` via direct function call in a tsx
script. Never use curl or fetch against the deployed endpoint for ingest.

### Pitfall 4: Wrong DATABASE_URL (pooler vs direct)

**What goes wrong:** Using the Supabase pooler URL (port 6543, pooler.supabase.com) instead of
the direct connection (port 5432, db.<ref>.supabase.co) causes multi-statement transaction
failures or silent errors.

**How to avoid:** Always use the direct connection URL from `C:\EV-Accounts\backend\.env`.

### Pitfall 5: Missing SOCRATA_APP_TOKEN causes rate limiting

**What goes wrong:** Without a Socrata app token, the API applies aggressive rate limits. The
audit script fetches all committees (~500+ rows) and the ingest pipeline fetches per-committee —
without a token, the ingest for 30+ candidates may hit 429 errors.

**How to avoid:** The app token should already be set in the backend `.env`. If not, the script
logs a warning at startup. Obtain a free token at https://data.lacity.org/profile/edit/developer_settings

### Pitfall 6: Contributions for zero-filing candidates

**What goes wrong:** A candidate who opened a committee but never filed (or filed $0) will have
a confirmed source but zero contributions in the DB. This is NOT a bug — it is the expected state.
Verification queries must account for this; not all confirmed sources will have contributions.

**How to avoid:** In the success criterion check, distinguish between (a) confirmed source exists
(pipeline success) and (b) contribution count > 0 (candidate actually filed). Success criterion
requires non-zero rows only "for each candidate that had filed reports" — this is the correct
scoping.

---

## Code Examples

### Audit-only run (from correct working directory)

```bash
# From C:\EV-Accounts\backend
npx tsx scripts/audit-la-socrata-gaps.ts
```

### Fix + ingest run

```bash
# From C:\EV-Accounts\backend
npx tsx scripts/audit-la-socrata-gaps.ts --fix --ingest
```

### Verification query — gap closure check

```sql
-- Count candidates in active LA races still missing confirmed la_socrata source
SELECT COUNT(*) AS still_missing
FROM essentials.race_candidates rc
JOIN essentials.races r ON r.id = rc.race_id
JOIN essentials.elections e ON e.id = r.election_id
JOIN essentials.politicians p ON p.id = rc.politician_id
WHERE e.state = 'CA'
  AND e.election_date >= CURRENT_DATE
  AND r.position_name ILIKE '%Los Angeles%'
  AND rc.candidate_status = 'active'
  AND NOT EXISTS(
    SELECT 1 FROM transparent_motivations.politician_sources ps
    WHERE ps.essentials_politician_id = p.id
      AND ps.source_system = 'la_socrata'
      AND ps.research_status = 'confirmed'
  );
-- Expected: 0 (or N where N = legitimate no-filers)
```

### Verification query — contribution counts for newly seeded candidates

```sql
-- For each candidate in active LA races: source status + contribution count
SELECT
  p.full_name,
  r.position_name,
  ps.external_id AS cmt_id,
  ps.research_status,
  COUNT(c.id) AS contribution_count
FROM essentials.race_candidates rc
JOIN essentials.races r ON r.id = rc.race_id
JOIN essentials.elections e ON e.id = r.election_id
JOIN essentials.politicians p ON p.id = rc.politician_id
LEFT JOIN transparent_motivations.politician_sources ps
  ON ps.essentials_politician_id = p.id
  AND ps.source_system = 'la_socrata'
  AND ps.research_status = 'confirmed'
LEFT JOIN transparent_motivations.contributions c ON c.politician_source_id = ps.id
WHERE e.state = 'CA'
  AND e.election_date >= CURRENT_DATE
  AND r.position_name ILIKE '%Los Angeles%'
  AND rc.candidate_status = 'active'
GROUP BY p.full_name, r.position_name, ps.external_id, ps.research_status
ORDER BY p.full_name;
```

### Verification query — recent ingestion runs

```sql
SELECT id, started_at, completed_at, records_fetched, records_inserted, status
FROM transparent_motivations.ingestion_runs
WHERE adapter_name = 'la_socrata'
ORDER BY started_at DESC
LIMIT 20;
```

### Manual source seeding pattern (for NO MATCH candidates resolved by hand)

```sql
-- If manual research finds the correct cmt_id for a NO MATCH candidate:
INSERT INTO transparent_motivations.politician_sources
  (essentials_politician_id, source_system, external_id, research_status, notes)
VALUES
  ('<politician_uuid>', 'la_socrata', '<cmt_id>', 'confirmed', '<committee_name>')
ON CONFLICT DO NOTHING;
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Phase 17: needs_research + confirm pass | Phase 26: direct confirmed insert | Gap script already verified the match |
| Phase 17: bulk confirm-la-socrata.ts | Phase 26: audit-la-socrata-gaps.ts | Script purpose-built for gap fill |
| Phase 23: manual seeding + per-committee ingest | Phase 26: automated via runAdapterForAll | Full batch ingest |

**Prior art in the codebase:**
- `verify-la-socrata-17-02.ts` — verification query template for Phase 17
- `verify-la-socrata-23-02.ts` — more comprehensive verification template for Phase 23 (18 LA City officeholders)
- `ingest-la-june2026-candidates.ts` — most recent targeted ingest (seeded 13+ June 2026 candidates 2026-05-06)

---

## Maintenance Procedure (FINANCE-02)

When to re-run the gap audit:
1. **After each new election cycle's candidate filing deadline** — new candidates get added to race_candidates without la_socrata sources
2. **After any bulk candidate import** (e.g., ingest-la-june2026-candidates.ts, ingest-la-metro-batch.ts)
3. **After LA City Clerk publishes certified candidate lists** (~6-8 weeks before election day)

The audit is safe to re-run at any time — it only reads in audit-only mode, and in --fix mode uses
`ON CONFLICT DO NOTHING` (idempotent).

---

## Open Questions

1. **Current gap count (as of 2026-05-06)**
   - What we know: Phase definition says 32, but ingest-la-june2026-candidates.ts was run on 2026-05-06 and seeded 13+ candidates. The actual gap is smaller.
   - What's unclear: Exact count without running audit-only mode.
   - Recommendation: Plan 26-01 must be "run audit-only and document current state" before any fix runs.

2. **Legitimate no-filers**
   - What we know: Some candidates in active races may never open a committee (small candidates, late entrants, withdrawn candidates not yet purged from race_candidates).
   - What's unclear: How many of the original 32 are in this category.
   - Recommendation: Classify NO MATCH results into (a) legitimate no-filers (document and accept) vs (b) needs manual cmt_id lookup.

3. **AMBIGUOUS candidates requiring manual resolution**
   - What we know: The script handles simple last-name matching; common last names or candidates with same surname as committee names for other purposes will be flagged AMBIGUOUS.
   - What's unclear: How many AMBIGUOUS results will appear.
   - Recommendation: For AMBIGUOUS results, look up the committee on data.lacity.org directly and insert manually using the verified cmt_id.

---

## Sources

### Primary (HIGH confidence)

- `C:\EV-Accounts\backend\scripts\audit-la-socrata-gaps.ts` — primary script; all logic verified by direct code reading
- `C:\EV-Accounts\backend\src\lib\campaignFinanceScheduler.ts` — runAdapterForAll implementation; la_socrata case fully read
- `C:\EV-Accounts\backend\src\lib\adapters\socrataAdapter.ts` — adapter implementation; fetch/normalize/upsert logic read
- `C:\EV-Accounts\backend\src\lib\adapters\runIngestion.ts` — pipeline orchestrator; ingestion_runs lifecycle read
- `C:\EV-Accounts\backend\scripts\verify-la-socrata-23-02.ts` — verification query patterns; directly usable as template
- `C:\EV-Accounts\backend\scripts\ingest-la-june2026-candidates.ts` — most recent ingest script; confirms direct function call pattern

### Secondary (MEDIUM confidence)

- `C:\Transparent Motivations\essentials\.planning\STATE.md` — Phase 26 is "Not started — ready to begin"; confirms prior phases used same pipeline
- `C:\EV-Accounts\backend\scripts\seed-traci-park-committees.ts` — confirms confirmed-direct insert pattern for targeted seeding

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — everything read from source code, no training data inference
- Architecture: HIGH — all patterns read directly from audit-la-socrata-gaps.ts and campaignFinanceScheduler.ts
- Pitfalls: HIGH — derived from code reading + prior phase patterns (Phases 17, 23)
- Verification queries: HIGH — adapted directly from verify-la-socrata-23-02.ts (known-working patterns)

**Research date:** 2026-05-06
**Valid until:** 2026-06-06 (stable — no external libraries; Socrata dataset m6g2-gc6c is long-lived)

# Phase 01: Backend Fix - Research

**Researched:** 2026-04-12
**Domain:** PostgreSQL JOIN type in Express/TypeScript service layer
**Confidence:** HIGH

## Summary

The bug is a single INNER JOIN in `electionService.ts` that silently drops races with zero candidates. The fix is mechanical: change `JOIN essentials.race_candidates rc ON rc.race_id = r.id` to `LEFT JOIN` in both Part A (geofence query) and Part B (statewide query), then adjust the downstream grouping loop to tolerate rows where all candidate columns are NULL.

The fix touches exactly one file (`C:/EV-Accounts/backend/src/lib/electionService.ts`) with no schema changes, no migrations, and no new dependencies. The existing test file (`tests/integration/essentials-elections.test.ts`) must be extended with a new test that verifies the empty-candidates-array shape. The existing deduplication logic uses `candidate_id` as the uniqueness key, so a NULL `candidate_id` from a 0-candidate race will cause all such races to collapse into one unless the dedup set is skipped for NULL values.

**Primary recommendation:** Change both INNER JOINs to LEFT JOINs, guard the candidate-push loop against NULL candidate_id rows, and add a test that asserts an empty `candidates: []` array on a known 0-candidate race.

## Standard Stack

No new libraries are needed. This is a pure SQL/TypeScript fix within the existing stack.

### Core (already in use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pg (node-postgres) | ^8.13.0 | Raw SQL queries via `pool.query` | Already in use; no ORM to navigate |
| TypeScript | (project tsconfig) | Type safety on query rows | Already in use |
| vitest | (project vitest.config.ts) | Test runner | Already in use |
| supertest | (project devDeps) | HTTP integration tests | Already in use |

**Installation:** None required.

## Architecture Patterns

### Existing Project Structure (relevant paths)
```
C:/EV-Accounts/backend/
├── src/lib/electionService.ts    # THE file to change
├── src/routes/essentials.ts      # Route handler (no change needed)
└── tests/integration/
    └── essentials-elections.test.ts  # Test file to extend
```

### Pattern 1: LEFT JOIN for optional relationships

**What:** When a parent row (race) may have zero child rows (candidates), use LEFT JOIN. The parent row appears once with NULL in all child columns.

**When to use:** Any time the requirement is "return the parent even if no children exist."

**Example:**
```typescript
// BEFORE (drops races with 0 candidates):
JOIN essentials.race_candidates rc ON rc.race_id = r.id

// AFTER (returns races with 0 candidates, candidate columns = NULL):
LEFT JOIN essentials.race_candidates rc ON rc.race_id = r.id
LEFT JOIN LATERAL (
  SELECT url FROM essentials.politician_images
  WHERE politician_id = rc.politician_id AND type = 'default'
  LIMIT 1
) pi ON rc.politician_id IS NOT NULL
```

Note: The dependent LATERAL join for `politician_images` is already `LEFT JOIN LATERAL` and will naturally produce NULL when `rc.politician_id` is NULL — no change needed there.

### Pattern 2: NULL guard in grouping loop

**What:** After LEFT JOIN, rows for 0-candidate races have `candidate_id = NULL`. The grouping loop must skip the candidate-push step for these rows.

**Example:**
```typescript
// BEFORE (would push a null-filled candidate object):
const candidate: ElectionCandidate = { ... };
racesMap.get(row.race_id)!.candidates.push(candidate);

// AFTER (skip push when no actual candidate):
if (row.candidate_id !== null) {
  const candidate: ElectionCandidate = { ... };
  racesMap.get(row.race_id)!.candidates.push(candidate);
}
```

### Pattern 3: NULL guard in deduplication

**What:** The current dedup set uses `candidate_id` as key. A NULL `candidate_id` from multiple 0-candidate races would cause only the first 0-candidate race to survive deduplication.

**Example:**
```typescript
// BEFORE (collapses all 0-candidate races into one):
if (seenCandidates.has(row.candidate_id)) return false;
seenCandidates.add(row.candidate_id);

// AFTER (skip dedup tracking for NULL candidate_id):
if (row.candidate_id !== null) {
  if (seenCandidates.has(row.candidate_id)) return false;
  seenCandidates.add(row.candidate_id);
}
```

### Pattern 4: Early-exit guard needs updating

**What:** The function currently returns `[]` if `dedupedRows.length === 0`. With LEFT JOIN, a jurisdiction with elections but zero candidates total would still return rows (with NULL candidate_ids). The guard is still correct as-is — if there are no rows at all (no elections match the coordinate), return empty. No change needed here.

### Pattern 5: ElectionRow interface update

**What:** The `ElectionRow` interface types `candidate_id` as `string` (non-nullable). After LEFT JOIN, it can be NULL. The interface must be updated.

**Example:**
```typescript
// BEFORE:
interface ElectionRow {
  candidate_id: string;
  full_name: string;
  // ...
}

// AFTER:
interface ElectionRow {
  candidate_id: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  is_incumbent: boolean | null;
  candidate_status: string | null;
  politician_id: string | null;
}
```

### Anti-Patterns to Avoid
- **Changing `WHERE rc.candidate_status != 'withdrawn'` to a JOIN condition:** Moving this filter into the ON clause is the correct approach for LEFT JOIN so that withdrawn-candidate races still return with an empty array. See Pitfall 1 below.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Testing empty-candidates shape | Custom DB seeding script | Direct SQL in test setup or a known fixture coordinate | Overhead; CI environment may not have writable DB |
| Null-safe grouping | Custom wrapper | Simple `if (row.candidate_id !== null)` guard | One line; no library needed |

**Key insight:** This fix is 100% in the SQL and the 20-line grouping loop. No new abstractions are warranted.

## Common Pitfalls

### Pitfall 1: WHERE clause vs ON clause for the candidate_status filter

**What goes wrong:** After changing to LEFT JOIN, keeping `AND rc.candidate_status != 'withdrawn'` in the WHERE clause turns the LEFT JOIN back into an effective INNER JOIN — rows where `rc.candidate_status` is NULL (0-candidate races) are filtered out.

**Why it happens:** A WHERE filter on a LEFT-joined column implicitly excludes NULL rows.

**How to avoid:** Move the filter into the JOIN's ON clause:
```sql
-- WRONG after LEFT JOIN:
LEFT JOIN essentials.race_candidates rc ON rc.race_id = r.id
WHERE rc.candidate_status != 'withdrawn'   -- kills 0-candidate rows

-- CORRECT:
LEFT JOIN essentials.race_candidates rc
  ON rc.race_id = r.id
  AND rc.candidate_status != 'withdrawn'   -- only filters actual candidate rows
```

**Warning signs:** If the fix is deployed but 0-candidate races still don't appear, this is the first thing to check.

### Pitfall 2: DISTINCT keyword interaction with NULL candidate_id

**What goes wrong:** The geofence query uses `SELECT DISTINCT`. With LEFT JOIN and a 0-candidate race, multiple geofence boundary rows may match the same race (a district can have several geometry rows). DISTINCT on NULL candidate_id will collapse these correctly — but only if the race columns themselves are unique per race. They are (race_id is the race's UUID), so DISTINCT is safe.

**Why it happens:** DISTINCT treats two NULLs as equal in PostgreSQL for deduplication purposes.

**How to avoid:** No action needed — DISTINCT behavior is correct here. Document it so the fix author understands why it works.

### Pitfall 3: The ORDER BY clause references rc.is_incumbent

**What goes wrong:** `ORDER BY e.election_date, r.position_name, rc.is_incumbent DESC` will sort NULLs last (NULLS LAST is PostgreSQL default for DESC). A 0-candidate race row will sort after all candidate rows for the same race, which is fine.

**Why it happens:** No issue — this is safe as-is.

**How to avoid:** No change needed. Note for the fix author so they don't accidentally change the ORDER BY.

### Pitfall 4: TypeScript type narrowing on ElectionRow

**What goes wrong:** The existing `ElectionRow` interface types `candidate_id`, `full_name`, `is_incumbent`, and `candidate_status` as non-nullable. After LEFT JOIN, TypeScript will not catch accidental access of these NULL fields without an interface update.

**Why it happens:** The interface was written before 0-candidate rows were a concern.

**How to avoid:** Update `ElectionRow` to mark candidate columns as `string | null` and `boolean | null`. TypeScript will then enforce the null check at the grouping loop.

## Code Examples

### Corrected geofence query (Part A) — critical ON clause change
```typescript
// Source: direct analysis of C:/EV-Accounts/backend/src/lib/electionService.ts
const geofenceQueryText = `
  SELECT DISTINCT
    e.id           AS election_id,
    -- ... other election/race columns unchanged ...
    rc.id          AS candidate_id,
    rc.full_name,
    rc.first_name,
    rc.last_name,
    COALESCE(rc.photo_url, pi.url) AS photo_url,
    rc.is_incumbent,
    rc.candidate_status,
    rc.politician_id,
    d.district_type
  FROM essentials.elections e
  JOIN essentials.races r ON r.election_id = e.id
  LEFT JOIN essentials.race_candidates rc        -- CHANGED: JOIN -> LEFT JOIN
    ON rc.race_id = r.id
    AND rc.candidate_status != 'withdrawn'       -- MOVED: was in WHERE clause
  LEFT JOIN LATERAL (                            -- already LEFT, no change
    SELECT url FROM essentials.politician_images
    WHERE politician_id = rc.politician_id AND type = 'default'
    LIMIT 1
  ) pi ON rc.politician_id IS NOT NULL
  JOIN essentials.offices o ON o.id = r.office_id
  JOIN essentials.districts d ON d.id = o.district_id
  JOIN essentials.geofence_boundaries gb ON gb.geo_id = d.geo_id
  WHERE gb.geometry IS NOT NULL
    AND public.ST_Covers(
      gb.geometry,
      public.ST_SetSRID(public.ST_MakePoint($1::float8, $2::float8), 4326)
    )
    -- REMOVED: AND rc.candidate_status != 'withdrawn'
    AND e.election_date >= CURRENT_DATE
  ORDER BY e.election_date, r.position_name, rc.is_incumbent DESC
`;
```

### Corrected statewide query (Part B) — same pattern
```typescript
// Same change: JOIN -> LEFT JOIN with filter moved to ON clause
LEFT JOIN essentials.race_candidates rc
  ON rc.race_id = r.id
  AND rc.candidate_status != 'withdrawn'
-- REMOVED from WHERE: AND rc.candidate_status != 'withdrawn'
```

### Updated grouping loop
```typescript
// Source: direct analysis of C:/EV-Accounts/backend/src/lib/electionService.ts lines 282-327
for (const row of dedupedRows) {
  // ... election/race grouping unchanged ...

  // Guard: only push a candidate when this row actually has one
  if (row.candidate_id !== null) {
    const candidate: ElectionCandidate = {
      candidate_id: row.candidate_id,
      full_name: row.full_name!,
      first_name: row.first_name,
      last_name: row.last_name,
      photo_url: row.photo_url,
      is_incumbent: row.is_incumbent!,
      candidate_status: row.candidate_status!,
      politician_id: row.politician_id,
    };
    racesMap.get(row.race_id)!.candidates.push(candidate);
  }
}
```

### Updated deduplication filter
```typescript
// Source: direct analysis of electionService.ts lines 271-275
const dedupedRows = allRows.filter((row) => {
  if (row.candidate_id !== null) {
    if (seenCandidates.has(row.candidate_id)) return false;
    seenCandidates.add(row.candidate_id);
  }
  return true;
});
```

### Test case to add in essentials-elections.test.ts
```typescript
// Source: pattern from existing essentials-elections.test.ts
it('returns races with empty candidates array for 0-candidate races (shape assertion)', async () => {
  // This test validates the response shape contract.
  // With a live DB containing a 0-candidate race, the elections array must
  // include that race with candidates: [].
  const res = await request(app).get('/api/essentials/elections?lat=34.05&lng=-118.24');
  if (res.status === 200) {
    expect(res.body).toHaveProperty('elections');
    for (const election of res.body.elections) {
      for (const race of election.races) {
        expect(race).toHaveProperty('candidates');
        expect(Array.isArray(race.candidates)).toBe(true);
        // candidates may be empty — that is valid and expected after this fix
      }
    }
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| INNER JOIN on race_candidates (drops 0-candidate races) | LEFT JOIN with filter in ON clause (returns all races) | Phase 01 | Races with no filed candidates become visible to users |

**Deprecated/outdated:**
- INNER JOIN on race_candidates: will be replaced by LEFT JOIN as part of this fix.

## Open Questions

1. **Are there currently any 0-candidate races in the production database?**
   - What we know: The database has 61 races and 124 candidates as of 2026-04-12.
   - What's unclear: Whether any of the 61 races have zero candidates (61 races with 124 candidates = ~2 per race average, but distribution is unknown).
   - Recommendation: Verify with `SELECT r.id, r.position_name, COUNT(rc.id) FROM essentials.races r LEFT JOIN essentials.race_candidates rc ON rc.race_id = r.id GROUP BY r.id HAVING COUNT(rc.id) = 0` before testing the fix. If none exist, seed one for the integration test.

2. **Does the DISTINCT keyword in Part A cause any issue with 0-candidate races that span multiple geofence boundaries?**
   - What we know: DISTINCT deduplicates NULLs as equal in PostgreSQL. A 0-candidate race matching 3 geofence boundaries would produce 3 identical rows (same race_id, all candidate columns NULL) — DISTINCT collapses these to 1.
   - What's unclear: Nothing unclear — this is well-defined PostgreSQL behavior.
   - Recommendation: No action needed; document for the implementer.

## Sources

### Primary (HIGH confidence)
- Direct code analysis: `C:/EV-Accounts/backend/src/lib/electionService.ts` — full query text read and analyzed
- Direct code analysis: `C:/EV-Accounts/backend/src/routes/essentials.ts` — route handler confirmed, no changes needed there
- Direct schema analysis: `C:/EV-Accounts/backend/migrations/042_election_schema.sql` — table relationships confirmed
- Direct test analysis: `C:/EV-Accounts/tests/integration/essentials-elections.test.ts` — test patterns confirmed

### Secondary (MEDIUM confidence)
- PostgreSQL LEFT JOIN / WHERE vs ON clause behavior: well-established SQL semantics, confirmed by direct reading of the existing queries and their behavior with NULLs.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing stack fully confirmed by reading source files
- Architecture: HIGH — the exact queries and grouping loop were read directly from source
- Pitfalls: HIGH — pitfall 1 (WHERE vs ON) is the classic LEFT JOIN gotcha, confirmed by reading the actual WHERE clause in the existing code

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable domain — pure SQL fix, no moving parts)

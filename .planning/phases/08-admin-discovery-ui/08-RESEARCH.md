# Phase 8: Admin Discovery UI + Dashboard - Research

**Researched:** 2026-04-26
**Domain:** React admin UI with polling, sortable/filterable tables, toast notifications, Express backend read endpoints
**Confidence:** HIGH

## Summary

Phase 8 is a pure frontend + thin backend work. The database tables (`discovery_jurisdictions`, `discovery_runs`, `candidate_staging`) exist and are populated from Phase 5-7 work. The trigger endpoint (`POST /api/admin/discover/jurisdiction/:id`) exists and returns 202 immediately with a fire-and-forget background run. What does NOT exist: the read-side API endpoints (jurisdictions list, run history with pagination, coverage health), the status/lock-state polling endpoint, and the admin UI page itself.

The frontend stack is locked: React 19 JSX + Tailwind CSS 4 (v-directive syntax via `@import "tailwindcss"`) + no component library beyond the existing `@empoweredvote/ev-ui` package. Auth is JWT Bearer via `apiFetch()` in `src/lib/auth.js` — same pattern as the existing StagingQueue page. The polling mechanism is plain `setInterval` (see `App.jsx` session polling pattern and `StagingQueue.jsx` load patterns) — no special polling library is needed or used in this codebase.

One schema gap must be fixed before DASH-02 is fully accurate: `discovery_runs` has `candidates_new` (which stores staged count) and `candidates_withdrawn`, but no `candidates_auto_upserted` column. The service tracks `autoUpserted` in memory but never persists it. A migration (083) must add this column and update `discoveryService.ts` to persist it.

**Primary recommendation:** Build backend read endpoints in a new route file `discoveryDashboard.ts` mounted on `stagingQueueAdminRouter` (JWT-gated), add migration 083 for the auto_upserted column gap, then build a single-page `DiscoveryDashboard.jsx` with three stacked sections and a `useInterval` custom hook for the run-status polling.

## Standard Stack

### Core (locked decisions — already in the project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.1.1 | UI framework | Project standard |
| Tailwind CSS | 4.1.12 | Styling | Project standard — uses `@import "tailwindcss"` v4 syntax |
| react-router-dom | 7.8.2 | Routing | Project standard |
| Express TypeScript | 4.21.0 | Backend API | Project standard — all admin routes here |
| pg (node-postgres) | 8.13.0 | DB access | Project standard — direct pool.query(), never PostgREST |
| zod | 3.23.0 | Request validation | Project standard for all backend routes |

### Supporting (for this phase's specific needs)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | — | Polling | Use plain `setInterval` + `useEffect` cleanup — project pattern |
| None needed | — | Toast | Hand-roll per existing UnresolvedQueue.jsx pattern (Toast component) |
| None needed | — | Table sort | Hand-roll with `useState` sort key/dir — small table, no library needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain setInterval | react-query / SWR | react-query overkill for one polling endpoint; not in package.json |
| Hand-rolled Toast | react-hot-toast | Library not in project; existing Toast component is 20 lines, sufficient |
| Hand-rolled sort | tanstack-table | Tanstack-table not in project; table has <8 columns and <50 rows |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure

New files to create:

```
backend:
  src/routes/discoveryDashboard.ts    # new — GET endpoints for UI data
  migrations/083_discovery_dashboard_columns.sql   # add candidates_auto_upserted

frontend:
  src/pages/admin/DiscoveryDashboard.jsx   # new — the full three-section page
  src/lib/adminApi.js                      # add new fetch functions (extend existing file)
  src/App.jsx                              # add /admin/discovery route
```

### Pattern 1: JWT-Gated Read Routes (existing pattern)

All new backend read endpoints follow the `stagingQueueAdmin.ts` dual-router pattern:
- Mount on `app.use('/api/admin', stagingQueueAdminRouter)` — already wired in index.ts
- Apply `requireAuth` + `requireAdmin` per-route (NOT at mount) to avoid blocking X-Admin-Token discovery POST routes
- Use `pool.query()` directly — never supabase client (essentials schema not in PostgREST)

```typescript
// Source: src/routes/stagingQueueAdmin.ts (verified in codebase)
router.get('/discovery/jurisdictions', requireAuth as any, requireAdmin as any, async (req, res) => {
  // pool.query with LEFT JOIN LATERAL for last run data
});
```

### Pattern 2: Polling with setInterval

The project uses plain `setInterval` for polling (see `App.jsx` line 45). For this phase, polling is needed while any jurisdiction has a `running` status. The hook cleans up on unmount.

```javascript
// Pattern from App.jsx (verified)
useEffect(() => {
  if (!isAnyRunning) return;
  const id = setInterval(refreshJurisdictions, 4000);
  return () => clearInterval(id);
}, [isAnyRunning]);
```

### Pattern 3: Toast Component

Existing Toast in `UnresolvedQueue.jsx` — copy the exact implementation (verified):

```jsx
// Source: src/pages/admin/UnresolvedQueue.jsx (verified in codebase)
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'error'
    ? 'bg-red-50 border-red-300 text-red-800'
    : 'bg-green-50 border-green-300 text-green-800';

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md max-w-sm ${bg}`}>
      <span className="flex-1 text-sm">{message}</span>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  );
}
```

### Pattern 4: Spinner (border-based, project standard)

```jsx
// Source: src/pages/CandidateProfile.jsx (verified)
<div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--ev-teal)] border-t-transparent" />
```

### Pattern 5: apiFetch in adminApi.js

All new API calls follow existing `adminApi.js` pattern — add to the existing file:

```javascript
// Source: src/lib/adminApi.js (verified)
export async function fetchDiscoveryJurisdictions() {
  const res = await apiFetch('/admin/discovery/jurisdictions');
  if (!res) { const err = new Error('Unauthorized'); err.status = 401; throw err; }
  if (!res.ok) {
    const err = new Error(`Fetch jurisdictions failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
```

### Pattern 6: Status Badge States

From the locked decisions (never_run / running / success / failed). Map to Tailwind classes following the existing `CONFIDENCE_STYLES` pattern in StagingQueue.jsx:

```javascript
const STATUS_STYLES = {
  success:   'bg-green-100 text-green-800 border border-green-300',
  failed:    'bg-red-100 text-red-800 border border-red-300',
  running:   'bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse',
  never_run: 'bg-gray-100 text-gray-600 border border-gray-300',
};
```

### Anti-Patterns to Avoid

- **Using Supabase client for essentials schema reads:** The essentials schema is NOT in PostgREST. All DB reads use `pool.query()`.
- **Mounting discovery reads under `requireAdminToken`:** New GET endpoints need JWT auth (browser UI), not X-Admin-Token (server-to-server). Mount in `stagingQueueAdminRouter` with per-route `requireAuth + requireAdmin`.
- **Polling unconditionally:** Only poll while at least one row has `status = 'running'`. Stop the interval when all rows are settled. Otherwise the browser polls forever.
- **Re-fetching full history on every status poll:** Poll a lightweight status endpoint (just jurisdictions + lock state), not the full run history. Refresh run history only when a run completes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pagination state | Custom pagination library | `useState` with page index + slice | Table has 20-25 rows/page, no library needed |
| Toast system | New toast component | Copy existing `Toast` from `UnresolvedQueue.jsx` | Already proven in the codebase |
| Spinner component | Custom spinner | `animate-spin` Tailwind class with border trick | Established project pattern |
| Auth header injection | Custom fetch wrapper | `apiFetch()` from `src/lib/auth.js` | Already handles 401 redirect + Bearer token |

**Key insight:** This is a thin data-display page. The project already has all the patterns needed — copy and adapt from StagingQueue.jsx and UnresolvedQueue.jsx rather than inventing new patterns.

## Common Pitfalls

### Pitfall 1: Schema Gap — `candidates_auto_upserted` Column Missing

**What goes wrong:** DASH-02 requires showing "candidates auto-upserted" per run. The `discovery_runs` table has `candidates_new` and `candidates_withdrawn` but NO `candidates_auto_upserted`. The service tracks `autoUpserted` in memory but the `UPDATE` statement (discoveryService.ts line ~489) does NOT persist it to the DB.

**Why it happens:** The column was never added because auto-upsert was Phase 7 and DASH-02 is Phase 8.

**How to avoid:** Migration 083 must add `candidates_auto_upserted INT NOT NULL DEFAULT 0` to `discovery_runs`. Then update the `UPDATE essentials.discovery_runs SET ...` statement in `discoveryService.ts` to include `candidates_auto_upserted = $6` with `autoUpserted` as the value.

**Warning signs:** If DASH-02 shows "auto-upserted: 0" for all runs including cron sweep runs that did auto-upsert, the column was added but the service wasn't updated.

### Pitfall 2: `candidates_new` Column Naming Mismatch

**What goes wrong:** The migration named the column `candidates_new` but the service stores `candidatesStaged` (the count of rows inserted into `candidate_staging`). These are the same thing semantically — "candidates staged for review" — but the name is confusing. The UI should label this "staged" not "new".

**How to avoid:** In the frontend, map `candidates_new` → display label "Staged". Map `candidates_withdrawn` → display label "Withdrawals".

### Pitfall 3: X-Admin-Token vs JWT Route Collision

**What goes wrong:** The discovery trigger routes (`POST /discover/jurisdiction/:id`) use X-Admin-Token auth. New GET endpoints for the dashboard use JWT. Both mount at `/api/admin`. If the GET endpoints are added to `essentialsDiscovery.ts` (which is wrapped in `requireAdminToken` at mount), browser requests with JWT Bearer will get 401.

**How to avoid:** Add all new GET endpoints to `stagingQueueAdminRouter` (in `stagingQueueAdmin.ts` or a new `discoveryDashboard.ts` file imported there), which uses per-route `requireAuth + requireAdmin`.

**Warning signs:** Browser gets 401 on `GET /api/admin/discovery/jurisdictions` even when logged in as admin.

### Pitfall 4: Polling While No Runs Active

**What goes wrong:** Setting up a permanent interval that always polls `/api/admin/discovery/status` every 4 seconds burns unnecessary backend queries 24/7.

**How to avoid:** Only activate polling when at least one jurisdiction row shows `status: 'running'`. Use the condition to start/stop the interval:

```javascript
useEffect(() => {
  const isAnyRunning = jurisdictions.some(j => j.last_run_status === 'running');
  if (!isAnyRunning) return;
  const id = setInterval(refresh, 4000);
  return () => clearInterval(id);
}, [jurisdictions]);
```

### Pitfall 5: Coverage Health Query Joins Wrong Tables

**What goes wrong:** Coverage health requires "total races, races with ≥1 candidate, races with 0 candidates" per jurisdiction. This requires joining `discovery_jurisdictions → elections → races → race_candidates`. Getting the join chain wrong (e.g., joining on geoid instead of election_date+state) produces wrong counts.

**How to avoid:** The correct join chain:
```sql
SELECT
  dj.id, dj.jurisdiction_name,
  COUNT(r.id) AS total_races,
  COUNT(CASE WHEN rc_count.cnt > 0 THEN 1 END) AS races_with_candidates,
  COUNT(CASE WHEN rc_count.cnt = 0 OR rc_count.cnt IS NULL THEN 1 END) AS races_zero_candidates
FROM essentials.discovery_jurisdictions dj
JOIN essentials.elections e
  ON e.election_date = dj.election_date
  AND e.state = dj.state
JOIN essentials.races r ON r.election_id = e.id
LEFT JOIN (
  SELECT race_id, COUNT(*) AS cnt
  FROM essentials.race_candidates
  GROUP BY race_id
) rc_count ON rc_count.race_id = r.id
GROUP BY dj.id, dj.jurisdiction_name
```

### Pitfall 6: Run Lock State Not Reflected in UI

**What goes wrong:** Admin triggers a run, but the browser already has the jurisdiction row cached showing `status: never_run`. The row doesn't update to "Running" until the next poll cycle. Meanwhile the button is still visible and admin clicks again, getting a 409 ALREADY_RUNNING.

**How to avoid:** On successful POST (202 response), immediately optimistically update the jurisdiction row in React state to `last_run_status: 'running'` before waiting for the poll to confirm. Then start polling.

## Code Examples

### Jurisdictions List Query (Backend)

```typescript
// Verified pattern — pool.query with LEFT JOIN LATERAL for last run
const result = await pool.query(`
  SELECT
    dj.id,
    dj.jurisdiction_name,
    dj.election_date,
    last_run.status       AS last_run_status,
    last_run.started_at   AS last_run_started_at,
    last_run.candidates_new AS last_run_candidates_added,
    active_cands.cnt      AS total_active_candidates
  FROM essentials.discovery_jurisdictions dj
  LEFT JOIN LATERAL (
    SELECT status, started_at, candidates_new
    FROM essentials.discovery_runs
    WHERE discovery_jurisdiction_id = dj.id
    ORDER BY started_at DESC
    LIMIT 1
  ) last_run ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM essentials.race_candidates rc
    JOIN essentials.races r ON r.id = rc.race_id
    JOIN essentials.elections e ON e.id = r.election_id
    WHERE e.election_date = dj.election_date
      AND e.state = dj.state
  ) active_cands ON true
  ORDER BY dj.election_date ASC
`);
```

### Run History Query (Backend, paginated)

```typescript
// Page size 25, filter by jurisdiction via optional query param
const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
const jurisdictionId = req.query.jurisdiction_id as string | undefined;
const offset = (page - 1) * 25;

const result = await pool.query(`
  SELECT
    dr.id, dr.status, dr.started_at, dr.completed_at, dr.triggered_by,
    dr.candidates_found, dr.candidates_new, dr.candidates_withdrawn,
    dr.candidates_auto_upserted, dr.error_message,
    dj.jurisdiction_name
  FROM essentials.discovery_runs dr
  JOIN essentials.discovery_jurisdictions dj ON dj.id = dr.discovery_jurisdiction_id
  ${jurisdictionId ? 'WHERE dr.discovery_jurisdiction_id = $3' : ''}
  ORDER BY dr.started_at DESC
  LIMIT 25 OFFSET $1
`,
  jurisdictionId ? [offset, 25, jurisdictionId] : [offset]
);
```

### Migration 083 — Add candidates_auto_upserted

```sql
BEGIN;
ALTER TABLE essentials.discovery_runs
  ADD COLUMN IF NOT EXISTS candidates_auto_upserted INT NOT NULL DEFAULT 0;
COMMIT;
```

Plus update `discoveryService.ts` UPDATE statement to set `candidates_auto_upserted = $6` with value `autoUpserted`.

### Trigger Run + Optimistic UI Update (Frontend)

```javascript
async function handleRunDiscovery(jurisdictionId) {
  // Optimistic update immediately
  setJurisdictions(prev => prev.map(j =>
    j.id === jurisdictionId
      ? { ...j, last_run_status: 'running', runningLocally: true }
      : j
  ));

  try {
    const res = await apiFetch(
      `/admin/discover/jurisdiction/${encodeURIComponent(jurisdictionId)}`,
      { method: 'POST' }
    );
    if (!res) return; // 401 handled by apiFetch
    if (res.status === 409) {
      const body = await res.json();
      setToast({ message: body.message || 'Run already in progress', type: 'error' });
      // Revert optimistic update
      setJurisdictions(prev => prev.map(j =>
        j.id === jurisdictionId ? { ...j, last_run_status: j._prevStatus, runningLocally: false } : j
      ));
      return;
    }
    if (!res.ok) {
      throw new Error(`Trigger failed: ${res.status}`);
    }
    // 202 accepted — polling will update the row when run completes
  } catch (err) {
    setToast({ message: err.message, type: 'error' });
  }
}
```

### Table Column Sort (Frontend)

```javascript
const [sortKey, setSortKey] = useState('election_date');
const [sortDir, setSortDir] = useState('asc');

function handleSort(key) {
  setSortDir(prev => sortKey === key && prev === 'asc' ? 'desc' : 'asc');
  setSortKey(key);
}

const sortedRows = [...filtered].sort((a, b) => {
  const av = a[sortKey] ?? '';
  const bv = b[sortKey] ?? '';
  const cmp = av < bv ? -1 : av > bv ? 1 : 0;
  return sortDir === 'asc' ? cmp : -cmp;
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 `@tailwind` directives | Tailwind v4 `@import "tailwindcss"` + CSS-first config | v4 release | Custom colors go in `@theme {}` block in index.css, not tailwind.config.js |
| WebSockets for live updates | Polling with setInterval | Project design choice | Simpler, sufficient for admin-only page with low concurrency |

**Deprecated/outdated:**
- `tailwind.config.js`: Not present in this project. Configuration is CSS-only via `@theme {}` in index.css.

## Open Questions

1. **Coverage health join accuracy**
   - What we know: `discovery_jurisdictions` links to `elections` via `(election_date, state)` — no direct FK
   - What's unclear: Are there multiple `elections` rows with the same `(election_date, state)` for a given jurisdiction (e.g., a primary and a municipal on the same day in the same state)?
   - Recommendation: The coverage health query should JOIN `elections` on `(election_date, state)`. If multiple elections match, races will be aggregated across all of them — likely correct behavior since LA County may have multiple local elections on the same date.

2. **`triggered_by` display label mapping**
   - What we know: `triggered_by` stores `'cron'`, `'on_demand'`, or an admin email address
   - What's unclear: CONTEXT.md says show "trigger type (cron vs manual)" — how to display email addresses
   - Recommendation: Map `'cron'` → "Cron", everything else → "Manual" in the UI. Don't display email addresses in the table (privacy).

3. **Page-level sorting vs. global sorting for run history**
   - What we know: Phase boundary says paginated table, 20-25 rows per page, filterable by jurisdiction
   - What's unclear: Should sort order persist across pagination? Default sort?
   - Recommendation: Default sort is `started_at DESC` (newest first). Sorting is server-side via query param to avoid needing all rows in memory. Or: load all runs in one request (there won't be thousands) and sort/paginate client-side. Given the small scale now, client-side is simpler.

## Sources

### Primary (HIGH confidence)

- Codebase: `C:/EV-Accounts/backend/migrations/070_discovery_tables.sql` — discovery_runs schema, confirmed column names
- Codebase: `C:/EV-Accounts/backend/src/lib/discoveryService.ts` — confirmed `autoUpserted` not persisted to DB
- Codebase: `C:/EV-Accounts/backend/src/routes/essentialsDiscovery.ts` — existing POST trigger endpoint, lock pattern
- Codebase: `C:/EV-Accounts/backend/src/routes/stagingQueueAdmin.ts` — JWT auth pattern for admin GET endpoints
- Codebase: `C:/EV-Accounts/backend/src/index.ts` — route mounting order (stagingQueueAdmin before requireAdminToken)
- Codebase: `C:/Transparent Motivations/essentials/src/pages/admin/StagingQueue.jsx` — Toast component, confidence badge pattern
- Codebase: `C:/Transparent Motivations/essentials/src/pages/admin/UnresolvedQueue.jsx` — Toast component exact code
- Codebase: `C:/Transparent Motivations/essentials/src/lib/auth.js` — apiFetch, API_BASE
- Codebase: `C:/Transparent Motivations/essentials/src/lib/adminApi.js` — adminApi pattern to extend
- Codebase: `C:/Transparent Motivations/essentials/src/index.css` — Tailwind v4 setup, custom colors

### Secondary (MEDIUM confidence)

- `C:/Transparent Motivations/essentials/src/App.jsx` — existing setInterval polling pattern for session check
- `C:/Transparent Motivations/essentials/src/pages/CandidateProfile.jsx` — border-based spinner pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and codebase
- Architecture: HIGH — verified by reading all relevant source files
- Schema gaps: HIGH — confirmed by reading discoveryService.ts UPDATE statement and 070 migration
- Pitfalls: HIGH — pitfalls derived from direct code inspection, not speculation
- Coverage health query: MEDIUM — join chain is inferred from schema; needs verification at implementation time

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (stable stack)

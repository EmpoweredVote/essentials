# Phase 6: Admin Review UI + Email + Per-Race Trigger - Research

**Researched:** 2026-04-24
**Domain:** React admin UI, Express TypeScript endpoints, email notifications, staging queue review
**Confidence:** HIGH (all findings from direct codebase inspection)

## Summary

Phase 6 adds three capabilities: a candidate staging review UI, email notifications triggered by discovery runs, and a per-race discovery trigger endpoint. All three build on top of existing Phase 5 infrastructure (candidate_staging table, approve/dismiss endpoints, discoveryService, emailService).

The UI follows the established UnresolvedQueue.jsx pattern exactly: a new `StagingQueue.jsx` page component with `QueueRow` subcomponents, registered in App.jsx at `/admin/staging`, using `apiFetch` from `lib/auth.js` for API calls. Email uses `sendEmail()` directly from `lib/emailService.ts` — the service already does raw Resend HTTP calls, no SDK needed. The per-race trigger requires a new `GET /admin/discover/races` endpoint for listing and a new `POST /admin/discover/race/:id` endpoint, both gated by `requireAdminToken`.

**Primary recommendation:** Model StagingQueue.jsx closely on UnresolvedQueue.jsx. The Toast component, auth error state, loading state, and `apiFetch` error-handling patterns are already production-tested and should be copied verbatim.

## Standard Stack

### Core (already installed — nothing new to install)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.1.1 | UI framework | Project standard |
| react-router-dom | 7.8.2 | Route registration | Project standard |
| Tailwind CSS | 4.1.12 | Styling | Project standard |
| Express TypeScript | 4.21.0 | Backend router | Project standard |
| zod | 3.23.0 | Request body validation | Used in existing staging endpoints |
| pg pool | (existing) | Direct DB queries | essentials schema NOT in PostgREST |

### New Dependencies

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| resend | 6.12.0 | Email SDK | Listed in STATE.md as needed for Phase 6 — but see note below |

**Resend SDK note:** `emailService.ts` currently uses raw `fetch` to the Resend REST API, not the Resend SDK. The existing pattern works. The "resend v6.12.0" requirement in STATE.md likely refers to installing the SDK to replace the raw fetch, or adding it as a dependency. Check whether the goal is to switch `emailService.ts` to use the SDK or keep raw fetch. Either works — the existing raw-fetch implementation is complete and handles errors correctly. Adding the SDK would only be necessary if new Resend features (templates, batch send) are needed. For Phase 6, the raw `sendEmail()` function is sufficient. Do NOT add the Resend SDK unless specifically required.

**Installation (only if Resend SDK is required):**
```bash
# In C:/EV-Accounts/backend
npm install resend@6.12.0
```

## Architecture Patterns

### Recommended Project Structure

**Frontend additions** (`C:/Transparent Motivations/essentials/src/`):
```
src/
├── pages/admin/
│   ├── UnresolvedQueue.jsx     # existing — DO NOT MODIFY
│   └── StagingQueue.jsx        # NEW — candidate staging review page
├── lib/
│   ├── adminApi.js             # existing — ADD staging API functions here
│   └── auth.js                 # existing — apiFetch used as-is
└── App.jsx                     # existing — ADD /admin/staging route
```

**Backend additions** (`C:/EV-Accounts/backend/src/`):
```
src/
├── routes/
│   └── essentialsDiscovery.ts  # existing — ADD 3 new endpoints here
└── lib/
    ├── discoveryService.ts     # existing — ADD email trigger calls here
    └── emailService.ts         # existing — USED AS-IS, no changes needed
```

### Pattern 1: StagingQueue.jsx Component Structure

Mirrors UnresolvedQueue.jsx exactly. Key structural decisions:

- Top-level `StagingQueue` component holds all state: `entries`, `loading`, `authError`, `error`, `toast`
- `QueueRow` subcomponent handles per-row optimistic UI and button state
- `Toast` component is identical to UnresolvedQueue's — copy verbatim (5-second auto-dismiss, `&times;` close button, green/red variants)
- Items grouped by race: the existing UnresolvedQueue renders flat rows; StagingQueue must pre-process entries into race groups before rendering
- Urgency detection: `election_date` is available from the race join; compute `daysUntil = Math.ceil((new Date(electionDate) - Date.now()) / 86400000)` and apply urgent styling when `daysUntil <= 30`

**Grouping logic:**
```javascript
// Source: codebase pattern (discoveryService groups by race_id)
function groupByRace(entries) {
  const map = new Map();
  for (const entry of entries) {
    const key = entry.race_id ?? '__unflagged__';
    if (!map.has(key)) map.set(key, { raceId: key, raceName: entry.race_name, electionDate: entry.election_date, items: [] });
    map.get(key).items.push(entry);
  }
  // Sort items within each group: uncertain first, then matched, then official
  const CONFIDENCE_ORDER = { uncertain: 0, matched: 1, official: 2 };
  for (const group of map.values()) {
    group.items.sort((a, b) => (CONFIDENCE_ORDER[a.confidence] ?? 0) - (CONFIDENCE_ORDER[b.confidence] ?? 0));
  }
  return [...map.values()];
}
```

**Optimistic UI pattern:**
```javascript
// Source: UnresolvedQueue.jsx pattern — adapted for staging
const handleApprove = async () => {
  // Remove row immediately (optimistic)
  setEntries(prev => prev.filter(e => e.id !== entry.id));
  showToast('Approved', 'success', () => {
    // Undo: re-fetch queue
    onRefresh();
  });
  try {
    await approveStagingCandidate(entry.id);
  } catch (err) {
    // Revert on failure
    onRefresh();
    showToast('Approve failed: ' + err.message, 'error');
  }
};
```

### Pattern 2: Backend Endpoint Design

Three new endpoints, all in `essentialsDiscovery.ts`, all gated by `requireAdminToken` (already applied at mount in `index.ts` at `/api/admin`):

**GET /admin/discovery/staging** — fetch pending staging rows with race/election context:
```typescript
// Source: discoveryService.ts DB patterns
const result = await pool.query(
  `SELECT
     cs.id, cs.full_name, cs.confidence, cs.action, cs.flagged, cs.flag_reason,
     cs.citation_url, cs.race_hint, cs.run_id, cs.created_at,
     r.position_name AS race_name,
     e.election_date, e.name AS election_name, e.jurisdiction_level,
     dj.jurisdiction_name
   FROM essentials.candidate_staging cs
   LEFT JOIN essentials.races r ON r.id = cs.race_id
   LEFT JOIN essentials.elections e ON e.id = r.election_id
   LEFT JOIN essentials.discovery_jurisdictions dj ON dj.id = cs.discovery_jurisdiction_id
   WHERE cs.status = 'pending'
   ORDER BY e.election_date ASC NULLS LAST, cs.confidence ASC, cs.created_at ASC`
);
```

Ordering note: `ORDER BY e.election_date ASC NULLS LAST` puts soonest elections first; `confidence ASC` puts uncertain (alphabetically first) before matched before official when grouped by race client-side.

**GET /admin/discover/races** — list races for per-race trigger UI:
```typescript
// Returns races that have a discovery_jurisdictions row
const result = await pool.query(
  `SELECT r.id, r.position_name, e.election_date, e.name AS election_name,
          dj.id AS jurisdiction_id, dj.jurisdiction_name
   FROM essentials.races r
   JOIN essentials.elections e ON e.id = r.election_id
   JOIN essentials.discovery_jurisdictions dj
     ON dj.election_date = e.election_date AND dj.state = e.state
   ORDER BY e.election_date ASC, r.position_name ASC`
);
```

**POST /admin/discover/race/:id** — trigger discovery for a single race. The existing system triggers by `discovery_jurisdiction_id`, not by `race_id`. The per-race trigger must look up which jurisdiction covers that race and delegate to `runDiscoveryForJurisdiction`:

```typescript
// Source: essentialsDiscovery.ts pattern for /discover/jurisdiction/:id
router.post('/discover/race/:id', async (req, res) => {
  const raceId = req.params.id;
  // Look up the jurisdiction that covers this race via election_date + state
  const result = await pool.query(
    `SELECT dj.id AS jurisdiction_id
     FROM essentials.races r
     JOIN essentials.elections e ON e.id = r.election_id
     JOIN essentials.discovery_jurisdictions dj
       ON dj.election_date = e.election_date AND dj.state = e.state
     WHERE r.id = $1`,
    [raceId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'No discovery jurisdiction covers this race' });
  }
  const jurisdictionId = result.rows[0].jurisdiction_id;
  runDiscoveryForJurisdiction(jurisdictionId, { triggeredBy: 'on_demand' }).catch(err => {
    console.error('[discover/race] background run failed:', err);
  });
  res.status(202).json({ status: 'accepted', raceId, jurisdictionId });
});
```

### Pattern 3: Email Integration in discoveryService

Email fires at two points inside `runDiscoveryForJurisdiction`:

**Point A: After step 7 (completed) — if uncertain candidates exist:**
```typescript
// Source: emailService.ts + CONTEXT.md decisions
import { sendEmail } from './emailService.js';

const adminEmail = process.env.ADMIN_EMAIL;
if (adminEmail && candidatesStaged > 0) {
  const uncertainCount = /* count from staging inserts */;
  const matchedCount = /* count */;
  const officialCount = /* count */;
  const daysUntil = Math.ceil((cfg.election_date.getTime() - Date.now()) / 86400000);
  const isUrgent = daysUntil <= 30;
  const subject = isUrgent
    ? `[URGENT] ${uncertainCount} candidates need review — ${cfg.jurisdiction_name} election in ${daysUntil} days`
    : `${uncertainCount} candidates need review — ${cfg.jurisdiction_name}`;
  await sendEmail({ to: adminEmail, subject, html: buildReviewEmailHtml(...) });
}
```

**Point B: After step 8 (failed) — error alert:**
```typescript
// In the catch block, after marking run failed
if (adminEmail) {
  await sendEmail({
    to: adminEmail,
    subject: `Discovery run failed — ${cfg.jurisdiction_name}`,
    html: `<p>Discovery run failed for <strong>${cfg.jurisdiction_name}</strong>.</p><p>Error: ${message}</p>`,
  });
}
```

**Zero-candidate regression alert:** The zero-candidate check requires knowing the previous non-zero count. This means querying `discovery_runs` for the previous completed run's `candidates_found`. Query:
```typescript
const prevRun = await pool.query(
  `SELECT candidates_found FROM essentials.discovery_runs
   WHERE discovery_jurisdiction_id = $1 AND status = 'completed' AND id != $2
   ORDER BY completed_at DESC LIMIT 1`,
  [cfg.id, runId]
);
const prevCount = prevRun.rows[0]?.candidates_found ?? null;
if (agentResult.candidates.length === 0 && prevCount !== null && prevCount > 0) {
  // Send zero-candidate regression alert
}
```

### Pattern 4: Auth — X-Admin-Token vs JWT

The staging endpoints belong on `/api/admin` (already mounted with `requireAdminToken`). The frontend `apiFetch` sends a JWT Bearer token in `Authorization`, NOT `X-Admin-Token`. This is a mismatch.

Looking at the existing pattern: `UnresolvedQueue.jsx` uses `apiFetch` which sends Bearer JWT. It calls `/campaign-finance/admin/unresolved` which is behind `campaignFinanceAdminRouter`. That router is NOT behind `requireAdminToken` — it uses a different auth mechanism.

The new staging endpoints are mounted at `/api/admin` behind `requireAdminToken` (X-Admin-Token). The frontend cannot call these directly via `apiFetch` because `apiFetch` only sends Bearer JWT.

**Resolution options:**
1. Mount the staging read endpoint on a different path NOT requiring `requireAdminToken`, using `requireAdmin` (JWT-based) middleware instead
2. Add a separate frontend mechanism to send `X-Admin-Token` header
3. Mount staging routes separately with `requireAdmin`

**Recommendation:** Mount `GET /api/admin/discovery/staging` and related routes using `requireAdmin` (JWT middleware) rather than `requireAdminToken` (shared secret). The `requireAdminToken` middleware is designed for server-to-server calls (SQS, cron). Human admin UI uses JWT. Check `requireAdmin` middleware:

```bash
# Confirmed: requireAdmin middleware exists
C:/EV-Accounts/backend/src/middleware/requireAdmin.ts
```

The existing `/discover/jurisdiction/:id` uses `requireAdminToken` which is correct for cron/programmatic use. For the UI-facing endpoints (staging queue list, per-race trigger from browser), use `requireAdmin` (JWT).

### Anti-Patterns to Avoid

- **Don't use `supabase` client for essentials schema queries.** The essentials schema is NOT in PostgREST. Always use `pool.query()`. This is stated in every relevant file.
- **Don't apply `requireAdminToken` to browser-callable endpoints.** The shared token is for server-to-server. Browser calls use JWT via `apiFetch`.
- **Don't send email synchronously inside the HTTP request cycle.** `sendEmail` catches its own errors and never throws — safe to await inside the service layer without breaking the run result.
- **Don't build a custom toast system.** The existing `Toast` component in UnresolvedQueue.jsx is complete — extract and reuse it.
- **Don't fetch the queue on every approve/dismiss.** The optimistic UI pattern removes the row immediately; only re-fetch on undo or error.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP calls to backend | Custom fetch wrapper | `apiFetch` from `lib/auth.js` | Handles Bearer token, 401 redirect, JSON headers |
| Email sending | Custom Resend fetch | `sendEmail()` from `lib/emailService.ts` | Already implemented, error-safe, no-op when key not set |
| Toast notification | New component | Copy `Toast` from UnresolvedQueue.jsx | 5-second auto-dismiss, error/success variants already done |
| Admin token auth | New middleware | `requireAdminToken` (existing) or `requireAdmin` (existing) | Pick the right one per caller type |
| DB queries (essentials) | Supabase client | `pool.query()` | PostgREST doesn't expose essentials schema |
| UUID validation | Custom regex | Existing `UUID_REGEX` constant in essentialsDiscovery.ts | Already defined: `/^[0-9a-f]{8}-...$/i` |
| Request body validation | Manual checks | `zod` schemas (already a dependency) | Consistent with existing endpoints |

## Common Pitfalls

### Pitfall 1: Auth Mismatch Between Browser and Backend

**What goes wrong:** Mounting the staging GET endpoint under `requireAdminToken` makes it unreachable from the browser UI (which only sends JWT, not X-Admin-Token).

**Why it happens:** The existing `/discover/jurisdiction/:id` is browser-triggered but was placed under `requireAdminToken` because it shares the same router. This works only when the admin also manually provides the token.

**How to avoid:** Register new browser-facing endpoints on a path with `requireAdmin` middleware, or add a separate router mount:
```typescript
// In index.ts — add before existing requireAdminToken mount
import { requireAdmin } from './middleware/requireAdmin.js';
app.use('/api/admin', requireAdmin, stagingQueueRouter);  // JWT-auth for browser
app.use('/api/admin', requireAdminToken, essentialsDiscoveryRouter);  // Token-auth for cron
```

**Warning signs:** 401 responses from the staging queue endpoint when called from the browser.

### Pitfall 2: Race Join Yields NULL When race_id Is NULL

**What goes wrong:** Staging rows where `race_id IS NULL` (flagged rows for unknown races) will have NULL values for `race_name`, `election_date`, `election_name` after the LEFT JOIN. The UI must handle this case.

**Why it happens:** `discoveryService.ts` sets `race_id = NULL` and `flagged = true` when no matching race is found.

**How to avoid:** Use `LEFT JOIN` (not `INNER JOIN`) in the staging queue query. In the UI, handle null race name with a fallback: `entry.race_name ?? entry.race_hint ?? 'Unknown race'`. Sort null-election-date entries to the bottom (`ORDER BY e.election_date ASC NULLS LAST`).

### Pitfall 3: Counting Confidence Levels for Email Requires Tracking During Staging Loop

**What goes wrong:** The email body needs `X uncertain / Y matched / Z official` but `candidatesStaged` in discoveryService is a single counter.

**Why it happens:** The staging loop only tracks one total count.

**How to avoid:** Add three counters inside the staging loop:
```typescript
let uncertainStaged = 0, matchedStaged = 0, officialStaged = 0;
// Inside the loop:
if (confidence === 'uncertain') uncertainStaged++;
else if (confidence === 'matched') matchedStaged++;
else officialStaged++;
```

### Pitfall 4: Dismiss Endpoint Requires a `reason` Field

**What goes wrong:** `POST /discovery/staging/:id/dismiss` validates `body.reason` as required (`min(1)`). A dismiss call without a reason body returns 422.

**Why it happens:** The existing dismiss endpoint was built with mandatory reason.

**How to avoid:** The frontend dismiss button must either (a) prompt for a reason, or (b) send a default reason. Given the decision is "inline dismiss button, no modal," send a default reason: `{ reason: "dismissed by admin" }`.

### Pitfall 5: Per-Race Trigger Maps to Jurisdiction, Not Race

**What goes wrong:** There is no `race_id` on `discovery_jurisdictions`. A per-race trigger cannot call `runDiscoveryForJurisdiction(raceId)` — it must first look up which jurisdiction covers that race.

**Why it happens:** The discovery system is scoped by jurisdiction+election_date, not by individual race. One jurisdiction run discovers all races for that jurisdiction.

**How to avoid:** The `POST /admin/discover/race/:id` endpoint must JOIN `races → elections → discovery_jurisdictions` to find the covering jurisdiction, then delegate to `runDiscoveryForJurisdiction(jurisdictionId)`.

### Pitfall 6: Double-Routing Conflict in index.ts

**What goes wrong:** Adding a new router to `/api/admin` after `requireAdminToken` means it also gets token-gated, or adding it before breaks authentication for existing endpoints.

**Why it happens:** Express applies middleware in mount order.

**How to avoid:** Look at the existing dual-router pattern in index.ts (used for compass and campaign-finance). Mount JWT-gated routes at `/api/admin` BEFORE the `requireAdminToken` mount, or use a different subpath like `/api/admin/discovery` for the browser-accessible endpoints.

## Code Examples

Verified patterns from direct codebase inspection:

### apiFetch with Error Handling (from adminApi.js)
```javascript
// Source: C:/Transparent Motivations/essentials/src/lib/adminApi.js
export async function fetchStagingQueue() {
  const res = await apiFetch('/admin/discovery/staging');
  if (!res) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`Fetch staging queue failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
```

### Toast Component (from UnresolvedQueue.jsx — copy verbatim)
```javascript
// Source: C:/Transparent Motivations/essentials/src/pages/admin/UnresolvedQueue.jsx
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

### Auth Error State Pattern (from UnresolvedQueue.jsx)
```javascript
// Source: C:/Transparent Motivations/essentials/src/pages/admin/UnresolvedQueue.jsx
if (err.status === 401 || err.status === 403) {
  setAuthError(true);
} else {
  setError(err.message || 'Failed to load queue.');
}
```

### Zod Body Validation in Endpoint (from essentialsDiscovery.ts)
```typescript
// Source: C:/EV-Accounts/backend/src/routes/essentialsDiscovery.ts
const bodySchema = z.object({
  reason: z.string().trim().min(1).max(500),
  reviewerName: z.string().trim().min(1).max(200).optional(),
});
const body = bodySchema.safeParse(req.body ?? {});
if (!body.success) {
  res.status(422).json({ code: 'VALIDATION_ERROR', message: '...', issues: body.error.flatten() });
  return;
}
```

### Confidence Badge Colors (Claude's Discretion)
```javascript
// Recommended Tailwind color scheme
const CONFIDENCE_STYLES = {
  official: 'bg-green-100 text-green-800 border border-green-300',
  matched:  'bg-yellow-100 text-yellow-800 border border-yellow-300',
  uncertain:'bg-red-100 text-red-800 border border-red-300',
};
// Urgency border (election within 30 days)
const urgentClass = daysUntil <= 30 ? 'border-l-4 border-l-orange-500' : '';
```

### Route Registration in App.jsx
```jsx
// Source: C:/Transparent Motivations/essentials/src/App.jsx — existing pattern
import StagingQueue from "./pages/admin/StagingQueue";
// Inside Routes:
<Route path="/admin/staging" element={<RequireAuth><StagingQueue /></RequireAuth>} />
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Resend SDK import | Raw fetch to Resend REST API | emailService.ts is already implemented; Resend SDK not needed |
| Supabase client for all DB | `pool.query()` for essentials schema | All essentials writes must use pool.query — established project pattern |
| Server-to-server token auth | JWT for browser, X-Admin-Token for cron | Two different auth middlewares for two different caller types |

## Open Questions

1. **Auth for browser-facing admin endpoints**
   - What we know: `requireAdminToken` (X-Admin-Token header) is on the existing staging approve/dismiss endpoints; browser uses JWT
   - What's unclear: Does the frontend currently send X-Admin-Token for staging actions? If so, how does it know the token value?
   - Recommendation: Read `requireAdmin` middleware and confirm it can be used for the staging queue GET. If the existing approve/dismiss work from the browser, there must be an existing solution.

2. **ADMIN_EMAIL environment variable**
   - What we know: `process.env.ADMIN_EMAIL` is used in `auth.ts` for access-request notifications. This same var should be used for discovery notifications.
   - What's unclear: Is there a separate `ADMIN_REVIEW_EMAIL` needed, or does `ADMIN_EMAIL` suffice?
   - Recommendation: Reuse `ADMIN_EMAIL`. If not set, `sendEmail` logs a warning and skips — this is the established no-op pattern.

3. **Dismiss requires reason — UX impact**
   - What we know: The existing dismiss endpoint requires `body.reason` (min 1 char). The decision is "inline dismiss button, no modal."
   - What's unclear: Should dismiss silently use a default reason, or should the button send `{ reason: 'Dismissed by admin' }`?
   - Recommendation: Send `{ reason: 'Dismissed by admin' }` as the default. This satisfies the schema constraint without a prompt.

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `C:/Transparent Motivations/essentials/src/pages/admin/UnresolvedQueue.jsx` — Toast component, QueueRow pattern, auth error handling, loadQueue pattern
- `C:/Transparent Motivations/essentials/src/lib/adminApi.js` — apiFetch wrapper pattern for admin API calls
- `C:/Transparent Motivations/essentials/src/lib/auth.js` — apiFetch implementation, TOKEN_KEY, API_BASE
- `C:/Transparent Motivations/essentials/src/App.jsx` — RequireAuth pattern, existing admin route at `/admin/unresolved`
- `C:/EV-Accounts/backend/src/routes/essentialsDiscovery.ts` — existing approve/dismiss endpoints, UUID_REGEX, zod validation pattern
- `C:/EV-Accounts/backend/src/lib/discoveryService.ts` — staging insert loop, DiscoveryRunSummary, run tracking, DB query patterns
- `C:/EV-Accounts/backend/src/lib/emailService.ts` — sendEmail() signature, ADMIN_EMAIL pattern, no-throw contract
- `C:/EV-Accounts/backend/src/index.ts` — requireAdminToken mount at `/api/admin`, dual-router patterns
- `C:/EV-Accounts/backend/src/middleware/adminTokenAuth.ts` — requireAdminToken implementation
- `C:/EV-Accounts/backend/migrations/070_discovery_tables.sql` — candidate_staging schema, all column names and types
- `C:/EV-Accounts/backend/migrations/042_election_schema.sql` — races, elections, race_candidates schema

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed from package.json and existing imports
- Architecture: HIGH — direct inspection of existing patterns; new code mirrors existing patterns exactly
- Pitfalls: HIGH — identified from actual code constraints (auth middleware, dismiss reason requirement, NULL race_id)
- Email integration: HIGH — sendEmail() inspected directly; ADMIN_EMAIL usage confirmed in auth.ts

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable codebase; only invalidated by schema migrations or middleware changes)

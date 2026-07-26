---
phase: 108-boston-deep-seed
reviewed: 2026-06-10T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - C:/EV-Accounts/backend/scripts/load-boston-council-boundaries.ts
  - C:/EV-Accounts/backend/migrations/347_boston_government.sql
  - C:/EV-Accounts/backend/scripts/_apply-migration-347.ts
  - C:/EV-Accounts/backend/migrations/348_boston_school_committee.sql
  - C:/EV-Accounts/backend/scripts/_apply-migration-348.ts
  - C:/EV-Accounts/backend/scripts/_boston-headshots-upload.py
  - C:/EV-Accounts/backend/migrations/349_boston_headshots.sql
  - C:/EV-Accounts/backend/scripts/_apply-migration-349.ts
findings:
  critical: 4
  warning: 6
  info: 3
  total: 13
status: issues_found
---

# Phase 108: Code Review Report

**Reviewed:** 2026-06-10
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Eight seeding artifacts reviewed for the Boston Deep Seed phase: one ArcGIS boundary loader, two SQL migrations with their apply runners, a Python headshot upload script, and a headshots SQL migration with its apply runner. All files use parameterized queries throughout — no SQL injection surface found. The credential pattern is correct (env-only). The main defects are: (1) the Mayor is incorrectly assigned to the City Council chamber in migration 347; (2) migration 349 has no hard assertion that all 14 mandatory council images were actually inserted; (3) migration 348's RAISE EXCEPTION re-run guard makes partial-failure recovery impossible; (4) the Python .env parser will crash with a raw FileNotFoundError before the intended env-validation error messages can fire.

---

## Critical Issues

### CR-01: Mayor Assigned to City Council Chamber (347 migration data error)

**File:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql:244-264`

**Issue:** BLOCK 1 (Mayor Michelle Wu) inserts the Mayor's office linked to the `City Council` chamber, the same legislative chamber used for all 13 councillors. The Mayor is a distinct executive office; placing it inside the City Council chamber will cause the Reps tab to display the Mayor under the "City Council" heading, conflate the office with council seats, and may break any UI logic that derives body type from `chamber.name`. Every other deep-seed phase (e.g., Alexandria) uses either a separate executive chamber or NULL for mayor-equivalent roles — not the legislative chamber.

**Fix:** Either set `chamber_id = NULL` for the Mayor's office, or insert a separate `'Mayor'` / `'Executive'` chamber for the city government and link BLOCK 1's office INSERT to that. The simplest correct fix is NULL:

```sql
-- BLOCK 1: Mayor Michelle Wu — LOCAL_EXEC, no chamber (executive role)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       NULL,          -- Mayor is not a council seat; no legislative chamber
       p.id,
       'Mayor', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2507000'
  AND d.district_type = 'LOCAL_EXEC'
  ...
```

---

### CR-02: Migration 349 Post-Verification Has No Hard Assert on Council Image Count

**File:** `C:/EV-Accounts/backend/migrations/349_boston_headshots.sql:213-222`

**Issue:** The post-verification block only issues a `RAISE NOTICE` with the count of inserted `politician_images` rows. It does NOT assert `v_count = 14`. If the upload script failed silently for some councillors and fewer than 14 rows were inserted, migration 349 will still complete with a green exit code and a misleading NOTICE. There is no mechanism to catch a partial upload and force a re-run.

**Fix:** Add a hard assertion:

```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE p.external_id BETWEEN -2507000014 AND -2507000001
     OR p.external_id BETWEEN -2502790007 AND -2502790001;

  -- Council images are mandatory (14 required). SC images are best-effort (0 acceptable).
  IF (SELECT COUNT(*) FROM essentials.politician_images pi
      JOIN essentials.politicians p ON p.id = pi.politician_id
      WHERE p.external_id BETWEEN -2507000014 AND -2507000001) <> 14 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 14 council politician_images rows, found fewer. Run upload script first.';
  END IF;

  RAISE NOTICE 'Migration 349: % politician_images rows for Boston officials (14 council + SC best-effort)', v_count;
END $$;
```

---

### CR-03: Migration 348 RAISE EXCEPTION Re-Run Guard Prevents Partial-Failure Recovery

**File:** `C:/EV-Accounts/backend/migrations/348_boston_school_committee.sql:36-42`

**Issue:** The pre-flight block raises an EXCEPTION (hard abort) if the BPS government row already exists. All subsequent INSERT blocks in migration 348 are idempotent (`ON CONFLICT DO NOTHING`, `WHERE NOT EXISTS`), meaning a re-run would be perfectly safe. If any step after the pre-flight but before the ledger entry fails (network drop, DB error, etc.), the migration cannot be restarted — it will immediately abort with "Migration 348 already applied — aborting re-run" even though the ledger entry was never written. This is an asymmetric design: migration 347 uses RAISE NOTICE (soft) for the same guard, allowing safe re-runs.

**Fix:** Change to RAISE NOTICE consistent with migration 347:

```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'Boston Public Schools, Massachusetts, US') > 0 THEN
    RAISE NOTICE 'BPS government row already exists — skipping government INSERT (idempotent re-run)';
  END IF;
END $$;
```

---

### CR-04: Python .env Parser Crashes with Unhandled FileNotFoundError Before Env Validation

**File:** `C:/EV-Accounts/backend/scripts/_boston-headshots-upload.py:41-48`

**Issue:** The hand-rolled `.env` parser opens the file with `open(_env_path)` at module load time, before `main()` is called. If the `.env` file is absent or the path is wrong, Python raises an unhandled `FileNotFoundError` with a raw traceback instead of the clear error messages at lines 474–482. This means the intended "ERROR: SUPABASE_URL not set" / "ERROR: DATABASE_URL not set" output never appears, and the operator sees a cryptic stack trace instead.

Additionally, the parser does not strip surrounding quotes from values. A `.env` file with `SUPABASE_URL="https://..."` will set `SUPABASE_URL` to `"https://..."` (including the quote characters), silently breaking all API calls with a malformed URL and no clear error.

**Fix:**

```python
import dotenv  # use python-dotenv (already common in this project's ecosystem)
from dotenv import dotenv_values

_env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
try:
    _env = dotenv_values(_env_path)
except FileNotFoundError:
    print(f'ERROR: .env file not found at {_env_path}')
    sys.exit(1)
```

Or, keep the hand-rolled parser but wrap in try/except and strip quotes:

```python
try:
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                v = v.strip().strip('"').strip("'")   # strip surrounding quotes
                _env[k.strip()] = v
except FileNotFoundError:
    print(f'ERROR: .env file not found at {_env_path}')
    sys.exit(1)
```

---

## Warnings

### WR-01: SSL Certificate Verification Disabled on All DB Pools

**File:** `C:/EV-Accounts/backend/scripts/load-boston-council-boundaries.ts:63`  
Also: `C:/EV-Accounts/backend/scripts/_apply-migration-347.ts:6`, `_apply-migration-348.ts:6`, `_apply-migration-349.ts:6`

**Issue:** `ssl: { rejectUnauthorized: false }` is set on every `pg.Pool` instance. This disables TLS certificate validation, leaving the DB connection vulnerable to man-in-the-middle attacks. The project memory (`project_render_dns_fix.md`) documents using `--dns-result-order=verbatim` on Render to fix IPv4/IPv6 connectivity; that is a DNS flag, not a TLS fix. Disabling cert verification is not required for Supabase pooler connectivity and should not be present on scripts that write to production.

**Fix:** Replace with proper SSL config. For Supabase Transaction Pooler, the certificate is valid:

```typescript
ssl: { rejectUnauthorized: true }
// Or, if the CA chain is not in the system trust store:
// ssl: { rejectUnauthorized: true, ca: fs.readFileSync('supabase-ca.crt') }
```

If `rejectUnauthorized: false` is truly required for Supabase pooler compatibility in this environment, add an explicit comment documenting why, scoped to local dev only.

---

### WR-02: Unbounded Recursion in `fetchJson` Redirect-Follow

**File:** `C:/EV-Accounts/backend/scripts/load-boston-council-boundaries.ts:72-74`

**Issue:** The HTTP redirect handler calls `fetchJson` recursively with no depth limit. A server that redirects to itself (or a redirect cycle) will exhaust the Node.js call stack and crash with a `RangeError: Maximum call stack size exceeded`. Since this runs against a public ArcGIS server, the risk is low but not zero (server misconfiguration or a transient loop).

**Fix:** Add a redirect depth counter:

```typescript
function fetchJson(url: string, redirectDepth = 0): Promise<unknown> {
  if (redirectDepth > 5) {
    return Promise.reject(new Error(`Too many redirects fetching ${url}`));
  }
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location, redirectDepth + 1).then(resolve).catch(reject);
      }
      // ...
```

---

### WR-03: Migration 347 Pre-flight 1 Uses RAISE NOTICE Instead of RAISE EXCEPTION

**File:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql:44-50`

**Issue:** Pre-flight 1 raises NOTICE (not EXCEPTION) when the government row already exists. NOTICE is invisible in many log pipelines and in the `_apply-migration-347.ts` runner output (pg `pool.query` does not surface NOTICE messages to stdout by default). An operator re-running the migration after a partial failure would see no warning that the migration had partially run before. This is a weaker guard than the project's own pattern in migration 348 (though CR-03 above flags 348's EXCEPTION as too strict). The right middle-ground is NOTICE + a comment, or a structured log, rather than silent re-run.

This is rated WARNING rather than BLOCKER because the downstream `WHERE NOT EXISTS` / `ON CONFLICT DO NOTHING` guards are correct — no data duplication will result. The risk is operator confusion.

**Fix:** At minimum, surface the NOTICE to the apply runner by listening to the `notification` event on the pg client, or upgrade to a structured `RAISE NOTICE` with a clearly formatted tag the runner can grep for.

---

### WR-04: `politician_id = NULL` Silent Insert Risk in Migration 349

**File:** `C:/EV-Accounts/backend/migrations/349_boston_headshots.sql:51-57` (and all 14 INSERT blocks)

**Issue:** Each `INSERT INTO essentials.politician_images` selects `politician_id` via a subquery:

```sql
(SELECT id FROM essentials.politicians WHERE external_id = -2507000001)
```

If migration 347 was not applied first (or was partially applied), this subquery returns NULL. The `WHERE NOT EXISTS` guard then evaluates `WHERE politician_id = NULL`, which is always false in SQL (comparison to NULL is never true), so the `NOT EXISTS` condition is satisfied and the outer INSERT proceeds — inserting a row with `politician_id = NULL`. If `politician_id` has a NOT NULL constraint this will error at the DB level (acceptable), but if it is nullable (or the constraint is deferred), a phantom row with NULL politician_id is silently inserted.

**Fix:** Add a pre-flight that asserts all 14 council politicians are present before the INSERT blocks run:

```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -2507000014 AND -2507000001;
  IF v_count <> 14 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: migration 347 must be applied first. Expected 14 council politicians, found %.', v_count;
  END IF;
END $$;
```

---

### WR-05: Boundary Loader Pre-flight Checks Skipped in Dry-Run Mode

**File:** `C:/EV-Accounts/backend/scripts/load-boston-council-boundaries.ts:98`

**Issue:** The X0013 mtfcc claim pre-flight check (lines 98–118) is wrapped in `if (!DRY_RUN)`. This means `--dry-run` skips the ownership check entirely. An operator using dry-run to validate a planned run cannot detect whether X0013 is already claimed by a conflicting non-Boston namespace. The dry-run gives a false confidence that the live run will succeed.

**Fix:** Run the read-only SELECT pre-flight check even in dry-run mode; only skip the INSERT operations:

```typescript
// Pre-flight: always check X0013 claim, even in dry-run
const precheck = await pool.query<{ cnt: string }>(`
  SELECT COUNT(*) AS cnt FROM essentials.geofence_boundaries WHERE mtfcc='X0013'
`);
// ... (check logic unchanged)
if (DRY_RUN) {
  console.log('  [dry-run] Pre-flight passed; no DB writes will occur');
}
```

---

### WR-06: Missing Geometry on G5420 Geofence Insert in Migration 348

**File:** `C:/EV-Accounts/backend/migrations/348_boston_school_committee.sql:65-70`

**Issue:** The G5420 geofence row is inserted with only `(geo_id, mtfcc, state)`. If `geofence_boundaries.geometry` is NOT NULL, `geofence_boundaries.name` is NOT NULL, or `geofence_boundaries.ocd_id` is NOT NULL (per the schema used in other migrations and the boundary loader), this INSERT will fail at the DB level. Looking at the boundary loader, every `geofence_boundaries` INSERT includes `ocd_id`, `name`, `state`, `mtfcc`, `geometry`, `source`, and `imported_at`. The migration comment says "No MA G5420 rows loaded by TIGER loader (D-05) — must INSERT directly" but does not explain why the insert omits the geometry.

If `geometry` is nullable (as it appears to be for school district placeholders in other phases), this is valid but leaves a geofence that can never perform spatial matching. The routing query presumably never uses G5420 for point-in-polygon, so the NULL geometry may be intentional. However, this pattern should be explicit.

**Fix:** Confirm `geometry` is nullable for this table and add a comment making the intentional NULL explicit:

```sql
-- NOTE: geometry intentionally NULL — BPS district covers all of Boston (geo_id='2507000'
-- city boundary); no separate polygon is loaded. Spatial routing uses city G4110 geofence.
INSERT INTO essentials.geofence_boundaries (geo_id, ocd_id, name, mtfcc, state, geometry)
SELECT '2502790', NULL, 'Boston Public Schools', 'G5420', '25', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.geofence_boundaries
  WHERE geo_id = '2502790' AND mtfcc = 'G5420'
);
```

---

## Info

### IN-01: `urllib3.disable_warnings` Call Is Misleading

**File:** `C:/EV-Accounts/backend/scripts/_boston-headshots-upload.py:577-578`

**Issue:** `urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)` is called in `__main__`, but all `requests.get` calls use `verify=True`. There are no insecure SSL requests in this script. The suppression call suppresses warnings that would never fire, and will mask any future `verify=False` additions. The comment "no insecure request being made" is absent.

**Fix:** Remove the `urllib3.disable_warnings` call entirely, or add a clear comment if it is needed for a known platform-specific CA issue.

---

### IN-02: `(r: any)` Type Assertion in Apply Runner

**File:** `C:/EV-Accounts/backend/scripts/_apply-migration-347.ts:73`

**Issue:** `r7.rows.map((r: any) => r.full_name)` uses an `any` cast. The other rows in the same file use the inferred `rows[0].cnt` pattern without explicit types. Minor, but inconsistent.

**Fix:**

```typescript
r7.rows.map((r: { full_name: string }) => r.full_name).join(', ')
```

---

### IN-03: Hand-Rolled `.env` Parser Should Use `python-dotenv`

**File:** `C:/EV-Accounts/backend/scripts/_boston-headshots-upload.py:41-48`

**Issue:** (Additional context for CR-04.) Beyond the crash risk, the custom parser does not handle multiline values, inline comments, or `export KEY=VALUE` syntax. The `python-dotenv` library handles all of these correctly and is the conventional choice. This is already partially covered by CR-04 but flagged separately as a maintainability issue regardless of the crash risk.

**Fix:** `pip install python-dotenv` and replace the hand-rolled loop with `dotenv_values(_env_path)`.

---

_Reviewed: 2026-06-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

# Deliverable 2 Plan — National-Officials Browse + `federal` catalog record

**Context:** Treasury Tracker coverage contract (phase 125). D1 (public `coverage.json`) ships
independently; D2 unlocks the `federal` record. Contract locked in
`C:\treasury-tracker\.planning\phases\125-essentials-coverage-contract\ESSENTIALS-RESPONSE-2.md`.

**Goal:** `GET /results?browse_federal_officials=1&browse_label=United+States` renders all
federal-tier officials nationally (President/VP, Cabinet, US Senate, US House, Federal Judiciary,
Independent Agencies) with no error — and `coverage.json` then emits the `federal` record pointing
at that URL.

**Cross-repo:** touches BOTH the accounts-api backend (`C:\EV-Accounts`, deploys master→Render) and
the essentials frontend (this repo, deploys via push→CD). **Backend must ship and be verified
first** — otherwise the frontend route/target 404s.

---

## Step 1 — Backend: national-officials query + route (EV-Accounts)

**1a. Service function** — `backend/src/lib/essentialsBrowseService.ts`

Add `getFederalOfficials()` next to `getStatewideOfficials()` (line 858). Copy that function and:
- Drop the `stateAbbrev` param and the `ABBREV_TO_FIPS` guard.
- Replace the WHERE clause. Current state query:
  ```sql
  WHERE d.district_type IN ('NATIONAL_UPPER', 'STATE_EXEC', 'NATIONAL_EXEC', 'NATIONAL_JUDICIAL')
    AND (d.state = $1 OR d.district_type IN ('NATIONAL_EXEC', 'NATIONAL_JUDICIAL'))
    AND p.is_active = true AND p.is_incumbent = true
  ```
  National federal query (no state param, add both congressional chambers):
  ```sql
  WHERE d.district_type IN ('NATIONAL_EXEC', 'NATIONAL_JUDICIAL', 'NATIONAL_UPPER', 'NATIONAL_LOWER')
    AND p.is_active = true AND p.is_incumbent = true
  ```
  (State query deliberately excludes `NATIONAL_LOWER`/US House because it's district-scoped; the
  national browse WANTS all House reps. Confirm whether "Independent Agencies & Commissions"
  (per classify.js FEDERAL_ORDER) is its own `district_type` or folds into `NATIONAL_EXEC` — include
  it if a distinct type exists.)
- Reuse `mapBrowseRow` + `attachBrowseImages` unchanged.
- Consider result size: US House = 435 + Senate 100 + exec/judiciary/agencies. ~600 rows — fine for
  one response; the existing `attachBrowseImages` ANY($1) handles it.

**1b. Route** — `backend/src/routes/essentialsBrowse.ts`

Mirror `/states/:state/officials` (line 200):
```ts
router.get('/federal/officials', optionalAuth, async (_req, res) => {
  try {
    const politicians = await getFederalOfficials();
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json(politicians);
  } catch (err) {
    console.error('[GET /essentials/browse/federal/officials] error:', err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
  }
});
```
Import `getFederalOfficials` at top (line ~31 alongside `getStatewideOfficials`).

**1c. Deploy + verify** — commit on `master` (via `git -C C:/EV-Accounts`), push → Render.
Verify: `GET https://accounts-api.empowered.vote/api/essentials/browse/federal/officials` returns a
non-empty JSON array including a President, ≥2 US Senators, and US House reps.

---

## Step 2 — Frontend: browse route (essentials)

**2a. API client** — `src/lib/api.jsx`

Add beside `browseByState` (line 371):
```js
export async function browseFederalOfficials() {
  try {
    const res = await publicFetch('/essentials/browse/federal/officials');
    if (!res || !res.ok) return { data: [], error: `${res?.status ?? 'unknown'}` };
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    console.error('browseFederalOfficials error:', err);
    return { data: [], error: err.message };
  }
}
```

**2b. Results.jsx** — model on the `browse_state_officials` handler (line ~865)

- Add a `useEffect` reading `searchParams.get('browse_federal_officials')`; if `=== '1'`, set
  `searchMode='browse'`, `setBrowseLoading(true)`, set `addressInput` from `browse_label`, call
  `browseFederalOfficials()`, `setBrowseResults(data)`.
- Add `browse_federal_officials` to the early-return bail guards (lines ~403–409) so the
  address-geocode effect doesn't fire for this shortcut.
- Federal banner tier already renders (`NATIONAL_EXEC`/`NATIONAL_UPPER`/`NATIONAL_LOWER`), and
  Phase 188's `populationMap.Federal` already resolves the US population — so the federal banner
  will show its population stat here too, for free.
- No `populationMap` change needed (federal tier already computed).

**2c. Generator** — `scripts/gen-coverage.mjs`

Uncomment the `federal` record (already stubbed in the file):
```js
federal: { label: 'United States', target: '/results?browse_federal_officials=1&browse_label=United+States' },
```

**2d. Deploy + verify** — push → CD. Verify DoD #4: the target URL renders federal officials with
no console error, and `GET /coverage.json` now contains the `federal` object.

---

## Deploy order (hard dependency)

1. Backend endpoint (Step 1) → Render → verify the raw JSON endpoint.
2. Frontend route + `federal` record (Step 2) → CD → verify the page + catalog.

Never ship Step 2 before Step 1 is live (the `federal.target` would 404 / render empty).

## Verification (contract DoD #4 + parity)

- `/results?browse_federal_officials=1&browse_label=United+States` renders President/VP, both
  chambers, Cabinet, Judiciary, Independent Agencies; grouped per `FEDERAL_ORDER`; no console errors.
- Federal banner shows `POPULATION 332,387,540` (Phase 188 wiring, free).
- `coverage.json` `federal.target` matches byte-for-byte.
- Notify TT in the phase-125 rendezvous dir → they flip the federal icon on.

## Risks / open questions

- **"Independent Agencies & Commissions" district_type** — confirm the exact `district_type`
  value(s) so none are dropped from the national query.
- **Result volume** — ~600 officials in one response; acceptable but watch payload size / render
  perf. If heavy, consider server-side grouping or pagination (not expected to be needed).
- **`is_incumbent`/`is_active` filters** — same as the state query; vacant seats handled by
  `is_vacant` downstream. No behavior change.

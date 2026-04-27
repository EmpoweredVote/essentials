import { apiFetch } from './auth';

/**
 * Fetch the unresolved contributions queue.
 * @param {Object} params
 * @param {string} [params.source] - Filter by adapter name (e.g. "indiana", "fec")
 * @param {string} [params.show] - "active" (default) or "dismissed"
 * @returns {Promise<Array>} Array of UnresolvedQueueEntry objects
 */
export async function fetchUnresolvedQueue({ source = "", show = "active" } = {}) {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (show) params.set("show", show);
  const qs = params.toString() ? `?${params}` : "";

  const res = await apiFetch(`/campaign-finance/admin/unresolved${qs}`);

  if (!res) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(`Fetch unresolved queue failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Resolve an unresolved entry by linking it to a politician.
 * Creates a PoliticianSource and backfills contributions.
 * @param {Object} params
 * @param {string} params.adapter_name
 * @param {string} params.external_id
 * @param {string} params.politician_id - UUID of the politician
 * @returns {Promise<{linked: boolean, contributions_moved: number, politician_name: string}>}
 */
export async function resolveUnresolved({ adapter_name, external_id, politician_id }) {
  const res = await apiFetch(
    `/campaign-finance/admin/unresolved/${encodeURIComponent(adapter_name)}/${encodeURIComponent(external_id)}/resolve`,
    {
      method: "POST",
      body: JSON.stringify({ politician_id }),
    }
  );

  if (!res) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || `Resolve failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Dismiss an unresolved entry (marks it as dismissed).
 * @param {Object} params
 * @param {string} params.adapter_name
 * @param {string} params.external_id
 * @returns {Promise<{dismissed: boolean, rows_affected: number}>}
 */
export async function dismissUnresolved({ adapter_name, external_id }) {
  const res = await apiFetch(
    `/campaign-finance/admin/unresolved/${encodeURIComponent(adapter_name)}/${encodeURIComponent(external_id)}/dismiss`,
    { method: "POST" }
  );

  if (!res) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || `Dismiss failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Restore a previously dismissed entry back to active.
 * @param {Object} params
 * @param {string} params.adapter_name
 * @param {string} params.external_id
 * @returns {Promise<{restored: boolean, rows_affected: number}>}
 */
export async function restoreUnresolved({ adapter_name, external_id }) {
  const res = await apiFetch(
    `/campaign-finance/admin/unresolved/${encodeURIComponent(adapter_name)}/${encodeURIComponent(external_id)}/restore`,
    { method: "POST" }
  );

  if (!res) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || `Restore failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Search politicians by name using the existing public endpoint.
 * @param {string} query - Search query (minimum 2 chars recommended)
 * @returns {Promise<Array>} Array of politician objects with full_name, office_title, representing_state, id
 */
export async function searchPoliticiansAdmin(query) {
  const params = new URLSearchParams({ q: query, limit: "10" });
  const res = await apiFetch(`/essentials/politicians?${params}`);

  if (!res) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(`Politician search failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Fetch all pending candidates from the discovery staging queue.
 * @returns {Promise<Array>} Array of staging entries with race, election, and jurisdiction context.
 */
export async function fetchStagingQueue() {
  const res = await apiFetch('/admin/discovery/staging');
  if (!res) { const err = new Error('Unauthorized'); err.status = 401; throw err; }
  if (!res.ok) {
    const err = new Error(`Fetch staging queue failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Approve a pending staging candidate by UUID.
 * @param {string} id - UUID of the candidate_staging row
 * @param {string} [raceId] - Optional race UUID to assign when none was matched
 * @returns {Promise<Object>} Approval result with id, fullName, status, confidence, action, upsertResult
 */
export async function approveStagingCandidate(id, raceId) {
  const res = await apiFetch(`/admin/discovery/staging/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    body: JSON.stringify(raceId ? { race_id: raceId } : {}),
  });
  if (!res) { const err = new Error('Unauthorized'); err.status = 401; throw err; }
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || `Approve failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Fetch all races for the election associated with a discovery jurisdiction.
 * Used to populate the race picker when approving a candidate with no matched race.
 * @param {string} jurisdictionId - UUID of the discovery_jurisdictions row
 * @returns {Promise<Array<{id: string, position_name: string}>>}
 */
export async function fetchRacesForJurisdiction(jurisdictionId) {
  const res = await apiFetch(`/admin/discovery/staging/races-for-jurisdiction/${encodeURIComponent(jurisdictionId)}`);
  if (!res) { const err = new Error('Unauthorized'); err.status = 401; throw err; }
  if (!res.ok) {
    const err = new Error(`Fetch races failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Dismiss a pending staging candidate by UUID.
 * @param {string} id - UUID of the candidate_staging row
 * @param {string} [reason] - Reason for dismissal (defaults to 'Dismissed by admin')
 * @returns {Promise<Object>} Dismissal result with id, fullName, status, dismissedReason, confidence, action
 */
export async function dismissStagingCandidate(id, reason = 'Dismissed by admin') {
  const res = await apiFetch(`/admin/discovery/staging/${encodeURIComponent(id)}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res) { const err = new Error('Unauthorized'); err.status = 401; throw err; }
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || `Dismiss failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Fetch all discovery jurisdictions with last-run summary and active candidate count.
 * @returns {Promise<Array>} Flat array of jurisdiction objects
 */
export async function fetchDiscoveryJurisdictions() {
  const res = await apiFetch('/admin/discovery/jurisdictions');
  if (!res) { const err = new Error('Unauthorized'); err.status = 401; throw err; }
  if (!res.ok) { const err = new Error(`Fetch jurisdictions failed: ${res.status}`); err.status = res.status; throw err; }
  return res.json();
}

/**
 * Fetch paginated discovery run history, optionally filtered by jurisdiction.
 * @param {Object} params
 * @param {number} [params.limit=25]
 * @param {number} [params.offset=0]
 * @param {string} [params.jurisdiction_id] - UUID to filter by jurisdiction
 * @returns {Promise<{runs: Array, total: number, limit: number, offset: number}>}
 */
export async function fetchDiscoveryRuns({ limit = 25, offset = 0, jurisdiction_id } = {}) {
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  qs.set('offset', String(offset));
  if (jurisdiction_id) qs.set('jurisdiction_id', jurisdiction_id);
  const res = await apiFetch(`/admin/discovery/runs?${qs}`);
  if (!res) { const err = new Error('Unauthorized'); err.status = 401; throw err; }
  if (!res.ok) { const err = new Error(`Fetch runs failed: ${res.status}`); err.status = res.status; throw err; }
  return res.json();
}

/**
 * Fetch per-jurisdiction race/candidate coverage health stats.
 * @returns {Promise<Array>} Flat array of coverage objects
 */
export async function fetchDiscoveryCoverage() {
  const res = await apiFetch('/admin/discovery/coverage');
  if (!res) { const err = new Error('Unauthorized'); err.status = 401; throw err; }
  if (!res.ok) { const err = new Error(`Fetch coverage failed: ${res.status}`); err.status = res.status; throw err; }
  return res.json();
}

/**
 * Trigger a discovery run for a jurisdiction.
 *
 * NOTE: The underlying POST /admin/discover/jurisdiction/:id route uses
 * X-Admin-Token authentication (not JWT Bearer). Since apiFetch sends JWT Bearer,
 * this call will likely return 401. See FINDINGS in 08-03-SUMMARY.md.
 * The caller inspects the raw response: 202 = accepted, 409 = conflict, others = error.
 *
 * @param {string} jurisdictionId - UUID of the discovery_jurisdictions row
 * @returns {Promise<Response>} Raw fetch Response — caller inspects status
 */
export async function triggerDiscoveryRun(jurisdictionId) {
  const res = await apiFetch(`/admin/discover/jurisdiction/${encodeURIComponent(jurisdictionId)}`, { method: 'POST' });
  if (!res) { const err = new Error('Unauthorized'); err.status = 401; throw err; }
  return res; // caller inspects status: 202 = accepted, 409 = conflict, others = error
}

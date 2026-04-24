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
 * @returns {Promise<Object>} Approval result with id, fullName, status, confidence, action, warning
 */
export async function approveStagingCandidate(id) {
  const res = await apiFetch(`/admin/discovery/staging/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
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

import { apiFetch, publicFetch } from './auth';

// Debug: log the API URL on first load
if (!window.__API_LOGGED__) {
  console.log("API URL: (using apiFetch Bearer wrapper)");
  window.__API_LOGGED__ = true;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// @deprecated — no longer used by usePoliticianData. Kept for backward compatibility.
export async function fetchPoliticiansOnce(zip, attempt = 0) {
  try {
    const url = `/essentials/candidates/${zip}?a=${attempt}&t=${Date.now()}`;
    const res = await apiFetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!res) return { status: "error", data: [], error: "Unauthorized" };

    const status =
      res.headers.get("X-Data-Status") || res.headers.get("x-data-status") || "";

    if (res.status === 202) {
      const ra = parseInt(res.headers.get("Retry-After") || "3", 10);
      return { status: "warming", retryAfter: isNaN(ra) ? 3 : ra, data: [] };
    }

    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      return { status: "error", data: [], error: `${res.status} ${res.statusText}` };
    }

    const data = await res.json();
    return { status, data };
  } catch (error) {
    console.error("Fetch error:", error);
    return { status: "error", data: [], error: error.message };
  }
}

// @deprecated — no longer used by usePoliticianData. Kept for backward compatibility.
export async function fetchPoliticiansProgressive(
  zip,
  onUpdate,
  { maxAttempts = 8, intervalMs = 1500 } = {}
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const once = await fetchPoliticiansOnce(zip, attempt);

    if (once.status === "warming") {
      // Still call onUpdate so UI knows we're warming
      if (typeof onUpdate === "function") onUpdate(once);
      await sleep((once.retryAfter ?? 3) * 1000);
      continue;
    }

    if (typeof onUpdate === "function") onUpdate(once);

    if ((once.status || "").toLowerCase() === "fresh") {
      return once; // done
    }

    await sleep(intervalMs);
  }

  // Timeout - notify UI
  const timeoutResult = {
    status: "timeout",
    data: [],
    error: "Request timed out. The server may be fetching data - please try again in a moment."
  };
  if (typeof onUpdate === "function") onUpdate(timeoutResult);
  return timeoutResult;
}

export async function searchPoliticians(query) {
  try {
    const res = await apiFetch(`/essentials/candidates/search`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });

    if (!res) return { status: "error", data: [], error: "Unauthorized", formattedAddress: "" };

    const status =
      res.headers.get("X-Data-Status") || res.headers.get("x-data-status") || "";
    const formattedAddress =
      res.headers.get("X-Formatted-Address") || res.headers.get("x-formatted-address") || "";

    if (!res.ok) {
      // Parse JSON error body if available (accounts-api returns { code, message })
      let errorMessage = `${res.status} ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.code === "ADDRESS_NOT_FOUND") {
          errorMessage = "address_not_found";
        } else if (errJson.message) {
          errorMessage = errJson.message;
        }
      } catch { /* fall through to generic message */ }
      console.error(`Search API error: ${res.status}`, errorMessage);
      return { status: "error", data: [], error: errorMessage, formattedAddress: "" };
    }

    const data = await res.json();
    return { status: status || "fresh", data, formattedAddress };
  } catch (error) {
    console.error("Search error:", error);
    return { status: "error", data: [], error: error.message, formattedAddress: "" };
  }
}

export async function fetchPoliticiansSingle(zip, signal) {
  const res = await apiFetch(`/essentials/candidates/${zip}`, {
    cache: "no-store",
    signal,
  });

  if (!res) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch politicians: ${res.status}`);
  }

  return res.json();
}

export async function fetchPolitician(id) {
  try {
    const res = await apiFetch(`/essentials/politicians/${id}`);
    if (!res) throw new Error("Unauthorized");
    if (!res.ok) throw new Error("Failed to fetch politician");
    return res.json();
  } catch (error) {
    console.error("Error fetching politician:", error);
    throw error;
  }
}

/**
 * Fetch representatives for the currently logged-in Connected user using their
 * stored jurisdiction (no address input required). Returns { data, error }.
 * Returns { data: [], error: null } when no location is on file (204 response).
 */
export async function fetchMyRepresentatives() {
  const res = await apiFetch('/essentials/representatives/me');
  if (!res) return { data: [], error: null, formattedAddress: '' }; // 401 — apiFetch already redirected
  if (res.status === 204) return { data: [], error: null, formattedAddress: '', noLocation: true }; // Connected but no location set
  if (!res.ok) return { data: [], error: `${res.status}`, formattedAddress: '' };
  const formattedAddress =
    res.headers.get('X-Formatted-Address') || res.headers.get('x-formatted-address') || '';
  const data = await res.json();
  return { data: Array.isArray(data) ? data : [], error: null, formattedAddress };
}

/**
 * Save the user's home location to their Connected profile.
 * Geocodes the address, encrypts coordinates via the accounts API, and
 * persists the matched address. Fire-and-forget safe — returns null on failure.
 */
export async function saveMyLocation(address) {
  try {
    const res = await apiFetch('/connect/set-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    if (!res || !res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCandidates(zipOrQuery) {
  try {
    const isZip = /^\d{5}$/.test(zipOrQuery);

    if (isZip) {
      // ZIP: use existing GET endpoint
      const res = await apiFetch(`/essentials/candidates/${zipOrQuery}`, {
        cache: "no-store",
      });
      if (!res || !res.ok) return [];
      return res.json();
    }

    // Address: use search endpoint with includeChallengers so non-incumbents appear
    const res = await apiFetch(`/essentials/candidates/search`, {
      method: "POST",
      body: JSON.stringify({ query: zipOrQuery, includeChallengers: true }),
    });
    if (!res || !res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return [];
  }
}

export async function fetchEndorsements(id) {
  try {
    const res = await apiFetch(`/essentials/politicians/${id}/endorsements`);
    if (!res || !res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchLegislativeSummary(id) {
  try {
    const res = await apiFetch(`/essentials/politicians/${id}/legislative-summary`);
    if (!res || !res.ok) return { recent_bills: [], recent_votes: [] };
    return res.json();
  } catch (error) {
    console.error("Error fetching legislative summary:", error);
    return { recent_bills: [], recent_votes: [] };
  }
}

export async function fetchLegislativeCommittees(id) {
  try {
    const res = await apiFetch(`/essentials/politicians/${id}/committees`);
    if (!res || !res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching legislative committees:", error);
    return [];
  }
}

export async function fetchLegislativeLeadership(id) {
  try {
    const res = await apiFetch(`/essentials/politicians/${id}/leadership`);
    if (!res || !res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching legislative leadership:", error);
    return [];
  }
}

export async function fetchLegislativeBills(id, { all = false, limit } = {}) {
  try {
    const params = new URLSearchParams();
    if (all) params.set('all', 'true');
    if (limit !== undefined) params.set('limit', String(limit));
    const qs = params.toString() ? `?${params}` : '';
    const res = await apiFetch(`/essentials/politicians/${id}/bills${qs}`);
    if (!res || !res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching legislative bills:", error);
    return [];
  }
}

export async function fetchLegislativeVotes(id, { limit } = {}) {
  try {
    const qs = limit !== undefined ? `?limit=${limit}` : '';
    const res = await apiFetch(`/essentials/politicians/${id}/votes${qs}`);
    if (!res || !res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching legislative votes:", error);
    return [];
  }
}

export async function fetchJudicialRecord(id) {
  try {
    const res = await apiFetch(`/essentials/politicians/${id}/judicial-record`);
    if (!res || !res.ok) return { evaluations: [], metrics: [], disciplinary_records: [] };
    return res.json();
  } catch (error) {
    console.error("Error fetching judicial record:", error);
    return { evaluations: [], metrics: [], disciplinary_records: [] };
  }
}

export async function fetchMyElections() {
  const res = await apiFetch('/essentials/elections/me');
  if (!res) return { elections: [], error: null, formattedAddress: '', noLocation: false };
  if (res.status === 204) return { elections: [], error: null, formattedAddress: '', noLocation: true };
  if (!res.ok) return { elections: [], error: `${res.status}`, formattedAddress: '', noLocation: false };
  const formattedAddress =
    res.headers.get('X-Formatted-Address') || res.headers.get('x-formatted-address') || '';
  const data = await res.json();
  return { elections: Array.isArray(data.elections) ? data.elections : [], error: null, formattedAddress, noLocation: false };
}

export async function browseByArea(geoId, mtfcc) {
  try {
    const res = await publicFetch('/essentials/browse/by-area', {
      method: 'POST',
      body: JSON.stringify({ geo_id: geoId, mtfcc }),
    });
    if (!res || !res.ok) return { data: [], error: `${res?.status ?? 'unknown'}` };
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    console.error('browseByArea error:', err);
    return { data: [], error: err.message };
  }
}

export async function browseByGovernmentList(governmentGeoIds, state, { countyGeoId } = {}) {
  try {
    const body = { government_geo_ids: governmentGeoIds, ...(state ? { state } : {}) };
    if (countyGeoId) {
      body.county_geo_id = countyGeoId;
    }
    const res = await publicFetch('/essentials/browse/by-government-list', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res || !res.ok) return { data: [], error: `${res?.status ?? 'unknown'}` };
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    console.error('browseByGovernmentList error:', err);
    return { data: [], error: err.message };
  }
}

export async function fetchElectionsByAddress(address) {
  try {
    const res = await publicFetch(
      `/essentials/elections-by-address?address=${encodeURIComponent(address)}`
    );
    if (!res) return { elections: [], error: null };
    if (res.status === 503) return { elections: [], error: 'geocoder_unavailable' };
    if (!res.ok) return { elections: [], error: `${res.status}` };
    const data = await res.json();
    return { elections: Array.isArray(data.elections) ? data.elections : [], error: null };
  } catch (err) {
    console.error('fetchElectionsByAddress error:', err);
    return { elections: [], error: err.message };
  }
}

export async function fetchElectionsByArea(geoId, mtfcc) {
  try {
    const res = await publicFetch('/essentials/browse/elections-by-area', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geo_id: geoId, mtfcc }),
    });
    if (!res) return { elections: [], error: null };
    if (!res.ok) return { elections: [], error: `${res.status}` };
    const data = await res.json();
    return { elections: Array.isArray(data.elections) ? data.elections : [], error: null };
  } catch (err) {
    console.error('fetchElectionsByArea error:', err);
    return { elections: [], error: err.message };
  }
}

export async function fetchElectionsByGovernmentList(governmentGeoIds) {
  try {
    const res = await publicFetch('/essentials/browse/elections-by-government-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ government_geo_ids: governmentGeoIds }),
    });
    if (!res) return { elections: [], error: null };
    if (!res.ok) return { elections: [], error: `${res.status}` };
    const data = await res.json();
    return { elections: Array.isArray(data.elections) ? data.elections : [], error: null };
  } catch (err) {
    console.error('fetchElectionsByGovernmentList error:', err);
    return { elections: [], error: err.message };
  }
}

/**
 * Fetch a single race candidate by race_candidates UUID.
 * Returns candidate detail with politician_id linkage (nullable).
 * Used by CandidateProfile.jsx to resolve candidate -> politician.
 */
export async function fetchRaceCandidate(id) {
  try {
    const res = await publicFetch(`/essentials/race-candidates/${id}`);
    if (!res || !res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching race candidate:', error);
    return null;
  }
}

export async function searchPoliticiansByName(query) {
  const q = (query || '').trim();
  if (q.length < 2) return { status: 'idle', data: [], error: '' };
  try {
    const res = await publicFetch(`/essentials/candidates/search-by-name?q=${encodeURIComponent(q)}`);
    if (!res) return { status: 'error', data: [], error: 'Unauthorized' };
    if (!res.ok) {
      let errorMessage = `${res.status} ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson?.message) errorMessage = errJson.message;
      } catch { /* fall through */ }
      return { status: 'error', data: [], error: errorMessage };
    }
    const data = await res.json();
    return { status: 'fresh', data, error: '' };
  } catch (error) {
    console.error('searchPoliticiansByName error:', error);
    return { status: 'error', data: [], error: error?.message || 'Network error' };
  }
}

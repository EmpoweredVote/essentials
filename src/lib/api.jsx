import { apiFetch, publicFetch } from './auth';

// Debug: log the API URL on first load. Guarded for non-browser import
// contexts (e.g. Vitest's default node environment for api.test.js) where
// `window` does not exist.
if (typeof window !== 'undefined' && !window.__API_LOGGED__) {
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
    // SCHEMA-03 (Phase 133 D-09): surface tribal_land from address-search response.
    // When backend returns the wrapped { politicians, tribal_land, ... } shape,
    // unwrap politicians for `data` and pass tribal_land alongside. Older flat-array
    // responses (legacy /candidates/search) leave tribal_land undefined.
    let politicians = data;
    let tribal_land;
    let locality;
    if (data && !Array.isArray(data) && Array.isArray(data.politicians)) {
      politicians = data.politicians;
      tribal_land = data.tribal_land;
      locality = data.locality;
    }
    return { status: status || "fresh", data: politicians, formattedAddress, tribal_land, locality };
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

export async function fetchLegalDonorActivity(id) {
  try {
    const res = await apiFetch(`/essentials/politicians/${id}/legal-donor-activity`);
    if (!res || !res.ok) return { politician_id: id, firms: [], total_legal_donors: 0 };
    return res.json();
  } catch (error) {
    console.error('Error fetching legal donor activity:', error);
    return { politician_id: id, firms: [], total_legal_donors: 0 };
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

/** Public list of browseable areas (counties, cities, council_districts, sboe) for a
 *  state — the source of truth for coverage. Returns [] for states we don't cover. */
export async function fetchBrowseAreas(stateAbbrev) {
  try {
    const res = await publicFetch(`/essentials/browse/states/${encodeURIComponent(stateAbbrev)}/areas`);
    if (!res || !res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('fetchBrowseAreas error:', err);
    return [];
  }
}

export async function browseByGovernmentList(governmentGeoIds, state, { countyGeoId, skipOverlap } = {}) {
  try {
    const body = { government_geo_ids: governmentGeoIds, ...(state ? { state } : {}) };
    if (countyGeoId) {
      body.county_geo_id = countyGeoId;
    }
    if (skipOverlap) {
      body.skip_overlap = true;
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

/** Statewide officials for a state (executives + US Senators + federal) — the
 *  "browse a state" entry point. Returns { data, error } like the other browse fns. */
export async function browseByState(stateAbbrev) {
  try {
    const res = await publicFetch(`/essentials/browse/states/${encodeURIComponent(stateAbbrev)}/officials`);
    if (!res || !res.ok) return { data: [], error: `${res?.status ?? 'unknown'}` };
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    console.error('browseByState error:', err);
    return { data: [], error: err.message };
  }
}

// "Browse the United States" — all federal-tier officials nationally (no state
// filter). Backs the ?browse_federal_officials=1 shortcut and Treasury Tracker's
// federal deep-link (phase-125 coverage contract).
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

export async function fetchVoterInfo(address) {
  try {
    const res = await publicFetch(
      `/essentials/voter-info?address=${encodeURIComponent(address)}`
    );
    if (!res || !res.ok) return { voterInfo: null, error: `${res?.status ?? 'unknown'}` };
    const data = await res.json();
    return { voterInfo: data, error: null };
  } catch (err) {
    console.error('fetchVoterInfo error:', err);
    return { voterInfo: null, error: err.message };
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

// SRCH-04 / SRCH-05 — combobox foundations (Phase 214). Both endpoints are
// explicitly anonymous (Phase 212/213 CONTEXT.md) so both functions use
// publicFetch, NOT apiFetch — apiFetch's 401->login redirect is wrong for a
// typeahead that may fire while the user isn't logged in.

/** Ranked place-name candidates from the Phase 212 resolver.
 *  Response shape: [{ geo_id, mtfcc, label, state, has_local_data }] —
 *  tolerates either a bare array or a { candidates: [...] } envelope. */
export async function searchLocationsByName(query) {
  try {
    const res = await publicFetch(`/essentials/location-search?q=${encodeURIComponent(query)}`);
    if (!res || !res.ok) return { data: [], error: `${res?.status ?? 'unknown'}` };
    const data = await res.json();
    return { data: Array.isArray(data) ? data : (data.candidates || []), error: null };
  } catch (err) {
    console.error('searchLocationsByName error:', err);
    return { data: [], error: err.message };
  }
}

/** Phase 213 anonymous coordinate lookup. Body: { lat, lng }.
 *  Success response is AddressSearchResult-shaped (same as address search)
 *  with an empty matchedAddress (never echoes the coordinate — 213 D-06/D-05
 *  privacy contract) and a distinct 422 taxonomy: OUTSIDE_US_BOUNDS /
 *  SWAPPED_COORDINATES / INVALID_COORDINATES. */
export async function lookupCoordinate(lat, lng) {
  try {
    const res = await publicFetch('/essentials/coordinate-lookup', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
    if (!res) return { data: [], error: null, code: null, formattedAddress: '', locality: null };
    if (res.status === 422) {
      let code = 'INVALID_COORDINATES';
      try {
        const errJson = await res.json();
        if (errJson?.code) code = errJson.code;
      } catch { /* fall through to default code */ }
      return { data: [], error: 'validation', code, formattedAddress: '', locality: null };
    }
    if (!res.ok) return { data: [], error: `${res.status}`, code: null, formattedAddress: '', locality: null };
    const data = await res.json();
    // Mirrors AddressSearchResult shape: { politicians, ... } or a flat array.
    const politicians = Array.isArray(data) ? data : (data.politicians || []);
    // LOC-04 (Phase 216-03): surface locality alongside politicians. Coordinate
    // route inherits `locality` verbatim from the shared core (216-01/216-02);
    // tribal_land unwrap here is DEFERRED per 216-01 planner decision — do not add.
    return {
      data: politicians,
      error: null,
      code: null,
      formattedAddress: data.matchedAddress ?? '',
      locality: Array.isArray(data) ? null : (data.locality ?? null),
    };
  } catch (err) {
    console.error('lookupCoordinate error:', err);
    return { data: [], error: err.message, code: null, formattedAddress: '', locality: null };
  }
}

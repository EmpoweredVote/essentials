import { apiFetch } from './auth';

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
      const text = await res.text();
      console.error(`Search API error: ${res.status}`, text);
      return { status: "error", data: [], error: `${res.status} ${res.statusText}`, formattedAddress: "" };
    }

    const data = await res.json();
    return { status: status || "fresh", data, formattedAddress };
  } catch (error) {
    console.error("Search error:", error);
    return { status: "error", data: [], error: error.message, formattedAddress: "" };
  }
}

export async function checkCacheStatus(zip, signal) {
  const res = await apiFetch(`/essentials/cache-status/${zip}`, { signal });

  if (!res) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(`Cache status check failed: ${res.status}`);
  }

  return res.json();
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

    // Address: use POST search endpoint
    const res = await apiFetch(`/essentials/candidates/search`, {
      method: "POST",
      body: JSON.stringify({ query: zipOrQuery }),
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
    const res = await apiFetch(`/essentials/politicians/${id}/legislative`);
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

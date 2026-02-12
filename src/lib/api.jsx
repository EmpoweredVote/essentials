const API = import.meta.env.VITE_API_URL || "https://ev-backend-h3n8.onrender.com";

// Debug: log the API URL on first load
if (!window.__API_LOGGED__) {
  console.log("API URL:", API);
  window.__API_LOGGED__ = true;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchPoliticiansOnce(zip, attempt = 0) {
  try {
    const url = `${API}/essentials/politicians/${zip}?a=${attempt}&t=${Date.now()}`;
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

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
    const res = await fetch(`${API}/essentials/politicians/search`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const status =
      res.headers.get("X-Data-Status") || res.headers.get("x-data-status") || "";

    if (!res.ok) {
      const text = await res.text();
      console.error(`Search API error: ${res.status}`, text);
      return { status: "error", data: [], error: `${res.status} ${res.statusText}` };
    }

    const data = await res.json();
    return { status: status || "fresh", data };
  } catch (error) {
    console.error("Search error:", error);
    return { status: "error", data: [], error: error.message };
  }
}

export async function checkCacheStatus(zip, signal) {
  const res = await fetch(`${API}/essentials/cache-status/${zip}`, {
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    throw new Error(`Cache status check failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchPoliticiansSingle(zip, signal) {
  const res = await fetch(`${API}/essentials/politicians/${zip}`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch politicians: ${res.status}`);
  }

  return res.json();
}

export async function fetchPolitician(id) {
  try {
    const res = await fetch(`${API}/essentials/politician/${id}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch politician");
    return res.json();
  } catch (error) {
    console.error("Error fetching politician:", error);
    throw error;
  }
}

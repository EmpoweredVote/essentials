const API = import.meta.env.VITE_API_URL;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchPoliticiansOnce(zip) {
  const url = `${API}/essentials/politicians/${zip}`;
  const res = await fetch(url, { method: "GET", credentials: "include" });
  const status =
    res.headers.get("X-Data-Status") || res.headers.get("x-data-status") || ""; // some proxies lowercase

  // If server says "warming", you may get 202 or 200 with "warmed"
  if (res.status === 202) {
    const ra = parseInt(res.headers.get("Retry-After") || "3", 10);
    return { status: "warming", retryAfter: isNaN(ra) ? 3 : ra, data: [] };
  }

  const data = await res.json();
  return { status, data };
}

/**
 * Progressive fetch: immediately returns partials to onUpdate,
 * keeps polling until "fresh" or timeout.
 */
export async function fetchPoliticiansProgressive(
  zip,
  onUpdate,
  { maxAttempts = 8, intervalMs = 1500 } = {}
) {
  let attempt = 0;
  let lastCount = -1;

  while (attempt < maxAttempts) {
    attempt++;

    const once = await fetchPoliticiansOnce(zip);

    if (once.status === "warming") {
      // honor Retry-After on 202 responses
      await sleep((once.retryAfter ?? 3) * 1000);
      continue;
    }

    const count = Array.isArray(once.data) ? once.data.length : 0;
    if (typeof onUpdate === "function") onUpdate(once); // render partials now

    if ((once.status || "").toLowerCase() === "fresh") {
      return once; // done
    }

    // warmed/stale: keep trying for a fuller set; back off if not growing
    // (still keep a few attempts even if count is unchanged, in case final join finishes later)
    await sleep(intervalMs);
    lastCount = count;
  }

  // Give the latest we saw; caller decides what to show
  return { status: "timeout", data: [] };
}

export async function fetchPolitician(id) {
  const res = await fetch(`${API}/essentials/politician/${id}`);
  if (!res.ok) throw new Error("Failed to fetch politician");
  return res.json();
}

const API = import.meta.env.VITE_API_URL;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchPoliticiansOnce(zip, attempt = 0) {
  const url = `${API}/essentials/politicians/${zip}?a=${attempt}&t=${Date.now()}`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const status =
    res.headers.get("X-Data-Status") || res.headers.get("x-data-status") || "";

  if (res.status === 202) {
    const ra = parseInt(res.headers.get("Retry-After") || "2", 10);
    return { status: "warming", retryAfter: isNaN(ra) ? 2 : ra, data: [] };
  }

  const data = await res.json();
  return { status, data };
}

export async function fetchPoliticiansProgressive(
  zip,
  onUpdate,
  { maxAttempts = 8, intervalMs = 1500 } = {}
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const once = await fetchPoliticiansOnce(zip, attempt);

    if (once.status === "warming") {
      await sleep((once.retryAfter ?? 2) * 1000);
      continue;
    }

    if (typeof onUpdate === "function") onUpdate(once);

    if ((once.status || "").toLowerCase() === "fresh") {
      return once; // done
    }

    await sleep(intervalMs);
  }
  return { status: "timeout", data: [] };
}

export async function fetchPolitician(id) {
  const res = await fetch(`${API}/essentials/politician/${id}`);
  if (!res.ok) throw new Error("Failed to fetch politician");
  return res.json();
}

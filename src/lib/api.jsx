const API = import.meta.env.VITE_API_URL;

// export async function fetchPoliticians(zip, opts = {}, tries = 0) {
//   const res = await fetch(`${API}/essentials/politicians/${zip}`, {
//     signal: opts.signal,
//   });
//   const statusHdr = res.headers.get("x-data-status");

//   if (res.status === 202 || statusHdr === "warming") {
//     if (tries >= 3) return []; // give up after a few tries
//     await new Promise((r) => setTimeout(r, 1500));
//     return fetchPoliticians(zip, opts, tries + 1);
//   }

//   if (!res.ok) throw new Error("Failed to fetch politicians");
//   return res.json();
// }

export async function fetchPoliticians(zip) {
  let url = `${API}/essentials/politicians/${zip}`;
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { method: "GET", credentials: "include" });
    const status = res.headers.get("X-Data-Status") || "";
    if (res.status === 202) {
      const ra = parseInt(res.headers.get("Retry-After") || "3", 10);
      await new Promise((r) => setTimeout(r, (isNaN(ra) ? 3 : ra) * 1000));
      continue; // re-GET
    }
    const data = await res.json();

    // Opinionated UX: render partials immediately, keep spinner if status!=="fresh"
    // status ∈ "fresh" | "stale" | "warmed"
    return { status, data };
  }
  throw new Error("Essentials still warming; please try again.");
}

export async function fetchPolitician(id) {
  const res = await fetch(`${API}/essentials/politician/${id}`);
  if (!res.ok) throw new Error("Failed to fetch politician");
  return res.json();
}

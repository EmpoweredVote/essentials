const API = import.meta.env.VITE_API_URL;

// export async function fetchPoliticians(zip) {
//   const res = await fetch(`${API}/essentials/politicians/${zip}`);
//   if (!res.ok) throw new Error("Failed to fetch politicians");
//   return res.json();
// }

export async function fetchPoliticians(zip, opts = {}, tries = 0) {
  const res = await fetch(`${API}/essentials/politicians/${zip}`, {
    signal: opts.signal,
  });
  const statusHdr = res.headers.get("x-data-status");

  if (res.status === 202 || statusHdr === "warming") {
    if (tries >= 3) return []; // give up after a few tries
    await new Promise((r) => setTimeout(r, 1500));
    return fetchPoliticians(zip, opts, tries + 1);
  }

  if (!res.ok) throw new Error("Failed to fetch politicians");
  return res.json();
}

export async function fetchPolitician(id) {
  const res = await fetch(`${API}/essentials/politician/${id}`);
  if (!res.ok) throw new Error("Failed to fetch politician");
  return res.json();
}

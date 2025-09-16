const API = import.meta.env.VITE_API_URL;

export async function fetchPoliticians(zip) {
  const res = await fetch(`${API}/essentials/politicians/${zip}`);
  if (!res.ok) throw new Error("Failed to fetch politicians");
  return res.json();
}

export async function fetchPolitician(id) {
  const res = await fetch(`${API}/essentials/politician/${id}`);
  if (!res.ok) throw new Error("Failed to fetch politician");
  return res.json();
}

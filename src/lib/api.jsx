export async function fetchPoliticians(zip) {
  const res = await fetch(`http://localhost:5050/essentials/officials/${zip}`);
  if (!res.ok) throw new Error("Failed to fetch politicians");
  return res.json();
}

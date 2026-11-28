/** Source line for a city council member's record (the clerk's records confirm the votes). */
export function councilAttributionText(governmentName) {
  // government_name looks like "City of <Name>, <State>, US": keep the part before the first comma.
  const city = String(governmentName || '')
    .split(',')[0]
    .trim()
    .replace(/^city of\s+/i, '')
    .trim();
  return `From the clerk's records of the ${city ? `${city} Common Council` : 'city council'}.`;
}

/**
 * Which layout the record page shows. Nothing is chosen until loading finishes,
 * so council members never see a flash of the bills-and-votes layout.
 */
export function councilLayout({ loading, total }) {
  if (loading) return 'pending';
  return total > 0 ? 'council' : 'legislative';
}

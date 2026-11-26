// Pulls the city name out of a government name such as "City of <Name>".
function cityFrom(governmentName) {
  if (!governmentName) return null;
  const city = String(governmentName)
    .trim()
    .replace(/^city of\s+/i, '')
    .replace(/\s+city$/i, '')
    .trim();
  return city || null;
}

/**
 * Source line for a city council member's voting record. The clerk's records
 * confirm the votes; formal minutes are checked later.
 */
export default function CouncilRecordAttribution({ governmentName }) {
  const city = cityFrom(governmentName);
  const body = city ? `${city} Common Council` : 'city council';
  return (
    <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 font-[Manrope]">
      {`From the clerk's records of the ${body}.`}
    </p>
  );
}

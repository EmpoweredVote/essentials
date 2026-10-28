/**
 * Qualifying a local official's title with their jurisdiction.
 *
 * 🔴 THIS LIVES IN ONE PLACE ON PURPOSE. There used to be two copies of this logic — one in
 * `pages/Results.jsx` (the routed page, which ships) and one in `components/PoliticianGrid.jsx`
 * (imported by nothing, so Vite tree-shakes it out of the bundle entirely). On 2026-10-28 a fix
 * went into the PoliticianGrid copy and changed nothing in production, because that file is not
 * in the build. The two copies had already drifted. One definition, imported by both.
 */

// A government's name can lead with any of the incorporated forms, not just "City of".
// 🔴 STRIPPING ONLY "City|Town|Village of" STUTTERS ON THE REST, and did in production:
//   "Borough of State College"    + "State College Borough Council"
//     -> "Borough of State College State College Borough Council"
//   "Municipality of Anchorage"   + "Anchorage Assembly"
//     -> "Municipality of Anchorage Anchorage Assembly"
// The duplicate check compares the chamber against the government's CORE name, so every form
// has to come off before comparing. "City and County of" is here for San Francisco.
//
// ⚠ Deliberately NOT matched: "Consolidated City of Indianapolis and Marion County" and
// "Metropolitan Government of Nashville and Davidson County". Their cores are compound, so
// stripping the lead leaves "Indianapolis and Marion", which is not a name any chamber carries
// and would make the duplicate check worse rather than better. Those two still read twice; see
// the test that pins it.
export const GOV_FORM_PREFIX =
  /^(?:City|Town|Village|Borough|Municipality|Township)(?: and County)? of\s+/i;

/** The jurisdiction's bare name: "Borough of State College" → "State College". */
export function governmentCoreName(governmentName) {
  if (!governmentName) return '';
  return governmentName
    .split(',')[0]
    .trim()
    .replace(GOV_FORM_PREFIX, '')
    .replace(/\s+(Township|County)$/i, '')
    .trim();
}

/**
 * Qualify a generic local title with its jurisdiction, and leave one that already names the
 * jurisdiction alone.
 *   "Mayor"              → "Paramount Mayor"
 *   "Sheriff"            → "Los Angeles County Sheriff"
 *   "Anchorage Assembly" → "Anchorage Assembly"   (already qualified)
 */
export function qualifyLocalTitle(baseTitle, pol) {
  if (!baseTitle) return baseTitle;

  const dt = pol.district_type || '';
  if (!dt.startsWith('LOCAL') && dt !== 'COUNTY') return baseTitle;

  // Use government_name if set; fall back to representing_city for loaders that
  // don't create a chamber→government record (e.g. Utah at-large city councils).
  const govRaw = pol.government_name || pol.representing_city || '';
  if (!govRaw) return baseTitle;

  const gov = govRaw.split(',')[0].trim();
  const govCore = governmentCoreName(govRaw);

  if (govCore && baseTitle.toLowerCase().includes(govCore.toLowerCase()))
    return baseTitle;

  let prefix = dt === 'COUNTY' ? gov : gov.replace(GOV_FORM_PREFIX, '');

  if (prefix.endsWith('County') && baseTitle.startsWith('County'))
    prefix = prefix.replace(/\s+County$/, '');

  return `${prefix} ${baseTitle}`;
}
